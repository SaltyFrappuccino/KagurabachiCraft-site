export interface GithubSourceConfig {
  owner: string;
  repo: string;
  token?: string;
  releasesUrl: string;
}

const DEFAULT_GITHUB_OWNER = "SaltyFrappuccino";
const DEFAULT_GITHUB_REPO = "KagurabachiCraft";

export const getGithubSourceConfig = (): GithubSourceConfig => {
  const owner = process.env.GITHUB_OWNER?.trim() || DEFAULT_GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO?.trim() || DEFAULT_GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN?.trim();

  return {
    owner,
    repo,
    token: token && token.length > 0 ? token : undefined,
    releasesUrl: `https://github.com/${owner}/${repo}/releases`,
  };
};
