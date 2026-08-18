export type Channel = 'stable' | 'beta' | 'nightly' | string;
export interface Compatibility { libnx:string; atmosphere:string; firmware:string; verified:boolean; minimumAtmosphere?:string; minimumFirmware?:string; }
export interface PackageBuild { id:string; title:string; author:string; description:string; details?:string; category:string; license:string; homepage?:string; binary?:string; appCreated?:string; app_dls?:number; source?:string; channels?:Channel[]; compatibility?:Compatibility; }
export interface Source { type:'github-release'|'github-actions-artifact'|'http'; owner?:string; repo?:string; asset?:string; artifact?:string; branch?:string; workflow?:string; versionPattern?:string; url?:string; version?:string; prerelease?:boolean; direct?:boolean; }
export interface InstallRule { from:string; to:string; exclude?:string[]; mode?:'overwrite'|'if-missing'; }
export interface GithubChangelogHistory { owner:string; repo:string; path:string; branch?:string; commits?:number; }
export interface ChangelogSource { url:string; section:'future'|'version'; history?:number; previousReleases?:number; githubHistory?:GithubChangelogHistory; excludeFile?:string; }
export interface Updater { source:Source; install:InstallRule[]; changelog?:ChangelogSource; patchNroVersion?:boolean; autoUpdate?:boolean; }
export interface StoredPackage { id:string; version:string; changelog:string[]; downloadedAt:string; updated?:string; sourceUrl:string; archiveFile:string; size:number; extractedSize?:number; installFiles?:string[]; installManifest?:string[]; direct?:boolean; finalized?:boolean; buildKey?:string; md5:string; sha256:string; }
