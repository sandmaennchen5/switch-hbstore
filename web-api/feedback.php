<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const MAX_MESSAGE_LENGTH = 3000;
$dataDir = __DIR__ . '/data';
$pendingDir = $dataDir . '/pending';
$processedDir = $dataDir . '/processed';
$tokenFile = __DIR__ . '/.feedback-token';

function respond(int $status, array $body): never {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function bearerToken(): string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    return preg_match('/^Bearer\s+(.+)$/i', $header, $match) ? trim($match[1]) : '';
}

function requireImporter(string $tokenFile): void {
    $expected = is_file($tokenFile) ? trim((string)file_get_contents($tokenFile)) : '';
    if ($expected === '' || !hash_equals($expected, bearerToken())) respond(401, ['ok' => false, 'error' => 'unauthorized']);
}

function clean(string $value, int $maximum): string {
    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '');
    return mb_substr($value, 0, $maximum);
}

function input(): array {
    $type = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
    if (str_contains($type, 'application/json')) {
        $decoded = json_decode((string)file_get_contents('php://input'), true);
        return is_array($decoded) ? $decoded : [];
    }
    return $_POST;
}

function ensureStorage(string ...$directories): void {
    foreach ($directories as $directory) if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) respond(500, ['ok' => false, 'error' => 'storage_unavailable']);
}

$action = $_GET['action'] ?? 'submit';

if ($action === 'pending') {
    requireImporter($tokenFile);
    ensureStorage($pendingDir);
    $items = [];
    foreach (glob($pendingDir . '/*.json') ?: [] as $file) {
        $item = json_decode((string)file_get_contents($file), true);
        if (is_array($item)) $items[] = $item;
    }
    usort($items, fn(array $a, array $b): int => strcmp((string)($a['created_at'] ?? ''), (string)($b['created_at'] ?? '')));
    respond(200, ['ok' => true, 'feedback' => array_slice($items, 0, 25)]);
}

if ($action === 'ack') {
    requireImporter($tokenFile);
    $values = input();
    $id = preg_replace('/[^a-f0-9]/', '', strtolower((string)($values['id'] ?? '')));
    if (strlen($id) !== 32) respond(400, ['ok' => false, 'error' => 'invalid_id']);
    ensureStorage($pendingDir, $processedDir);
    $source = $pendingDir . '/' . $id . '.json';
    if (!is_file($source)) respond(404, ['ok' => false, 'error' => 'not_found']);
    $item = json_decode((string)file_get_contents($source), true) ?: [];
    $item['discussion_url'] = clean((string)($values['discussion_url'] ?? ''), 500);
    $item['processed_at'] = gmdate('c');
    file_put_contents($processedDir . '/' . $id . '.json', json_encode($item, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX);
    unlink($source);
    respond(200, ['ok' => true]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
$values = input();
if (!empty($values['website'])) respond(202, ['ok' => true]);

$package = clean((string)($values['package'] ?? ''), 100);
$message = clean((string)($values['message'] ?? ''), MAX_MESSAGE_LENGTH);
if (!preg_match('/^[A-Za-z0-9._-]{1,100}$/', $package)) respond(400, ['ok' => false, 'error' => 'invalid_package']);
if (mb_strlen($message) < 3) respond(400, ['ok' => false, 'error' => 'message_too_short']);

ensureStorage($pendingDir);
$ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . '|' . gmdate('Y-m-d-H'));
$rateFile = $dataDir . '/rate-' . $ipHash;
$rate = is_file($rateFile) ? (int)file_get_contents($rateFile) : 0;
if ($rate >= 5) respond(429, ['ok' => false, 'error' => 'rate_limited']);
file_put_contents($rateFile, (string)($rate + 1), LOCK_EX);

$id = bin2hex(random_bytes(16));
$entry = [
    'id' => $id,
    'package' => $package,
    'message' => $message,
    'name' => clean((string)($values['name'] ?? 'anonymous'), 80),
    'platform' => clean((string)($values['platform'] ?? 'web'), 40),
    'package_version' => clean((string)($values['package_version'] ?? ''), 80),
    'client_version' => clean((string)($values['hbas_version'] ?? $values['client_version'] ?? ''), 80),
    'source' => clean((string)($values['source'] ?? 'web'), 40),
    'created_at' => gmdate('c'),
];
$path = $pendingDir . '/' . $id . '.json';
if (file_put_contents($path, json_encode($entry, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX) === false) respond(500, ['ok' => false, 'error' => 'storage_unavailable']);
respond(201, ['ok' => true, 'id' => $id]);
