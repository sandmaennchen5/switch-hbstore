const required = name => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} ist nicht konfiguriert`);
  return value;
};

const githubToken = required('GH_TOKEN');
const feedbackToken = required('FEEDBACK_API_TOKEN');
const feedbackEndpoint = required('FEEDBACK_API_URL').replace(/\?+$/, '');
const [owner, name] = required('GITHUB_REPOSITORY').split('/');
const categoryName = process.env.FEEDBACK_DISCUSSION_CATEGORY?.trim() || 'Feedback';

async function github(query, variables = {}) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${githubToken}`, 'Content-Type': 'application/json', 'User-Agent': 'switch-hbas-feedback' },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (!response.ok || result.errors?.length) throw new Error(`GitHub GraphQL: ${JSON.stringify(result.errors || result)}`);
  return result.data;
}

async function feedbackRequest(action, body) {
  const response = await fetch(`${feedbackEndpoint}?action=${action}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${feedbackToken}`, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body,
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(`Feedback-API ${response.status}: ${JSON.stringify(result)}`);
  return result;
}

const repositoryData = await github(`query($owner:String!,$name:String!){repository(owner:$owner,name:$name){id discussionCategories(first:50){nodes{id name}} discussions(first:100,orderBy:{field:CREATED_AT,direction:DESC}){nodes{id url title body comments(last:100){nodes{body url}}}}}}`, { owner, name });
const repository = repositoryData.repository;
if (!repository) throw new Error(`Repository ${owner}/${name} nicht gefunden`);
const category = repository.discussionCategories.nodes.find(item => item.name.toLocaleLowerCase('de') === categoryName.toLocaleLowerCase('de'));
if (!category) throw new Error(`Discussion-Kategorie „${categoryName}“ fehlt. Vorhanden: ${repository.discussionCategories.nodes.map(item => item.name).join(', ')}`);

const pending = await feedbackRequest('pending');
console.log(`${pending.feedback.length} offene Feedback-Meldung(en)`);

for (const item of pending.feedback) {
  const appMarker = `<!-- switch-hbas-app-feedback:${item.package} -->`;
  const feedbackMarker = `<!-- switch-hbas-feedback:${item.id} -->`;
  let discussion = repository.discussions.nodes.find(entry => entry.body?.includes(appMarker));
  if (!discussion) {
    const title = `[Feedback] ${item.package}`.slice(0, 120);
    const body = `${appMarker}\n## Feedback zu ${item.package}\n\nIn dieser Discussion wird das über Switch HBAS eingereichte Feedback zu \`${item.package}\` gesammelt. Jede Rückmeldung erscheint als eigener Kommentar.`;
    const created = await github(`mutation($input:CreateDiscussionInput!){createDiscussion(input:$input){discussion{id url}}}`, { input: { repositoryId: repository.id, categoryId: category.id, title, body } });
    const createdDiscussion = created.createDiscussion.discussion;
    discussion = { id: createdDiscussion.id, url: createdDiscussion.url, title, body, comments: { nodes: [] } };
    repository.discussions.nodes.push(discussion);
    console.log(`App-Discussion erstellt: ${discussion.url}`);
  }

  let commentUrl = discussion.comments?.nodes?.find(comment => comment.body?.includes(feedbackMarker))?.url;
  if (!commentUrl) {
    const message = String(item.message || '').replace(/\r/g, '').trim();
    const commentBody = `${feedbackMarker}\n${message}\n\n---\n\n- Paketversion: ${item.package_version || 'nicht angegeben'}\n- Plattform: ${item.platform || 'nicht angegeben'}\n- Client: ${item.client_version || item.source || 'nicht angegeben'}\n- Eingegangen: ${item.created_at || 'nicht angegeben'}\n- Feedback-ID: \`${item.id}\``;
    const added = await github(`mutation($input:AddDiscussionCommentInput!){addDiscussionComment(input:$input){comment{url}}}`, { input: { discussionId: discussion.id, body: commentBody } });
    commentUrl = added.addDiscussionComment.comment.url;
    discussion.comments.nodes.push({ url: commentUrl, body: commentBody });
    console.log(`Feedback-Kommentar erstellt: ${commentUrl}`);
  } else {
    console.log(`Feedback-Kommentar bereits vorhanden: ${commentUrl}`);
  }
  await feedbackRequest('ack', new URLSearchParams({ id: item.id, discussion_url: commentUrl }));
}
