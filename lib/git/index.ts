import { GitHubClient } from './github';
import { GitLabClient } from './gitlab';
import type { GitProvider, GitRepo, GitFile, GitCommit, GitPR } from './types';

export class GitClient {
  private client: GitHubClient | GitLabClient;

  constructor(provider: GitProvider, token: string) {
    switch (provider) {
      case 'github':
        this.client = new GitHubClient(token);
        break;
      case 'gitlab':
        this.client = new GitLabClient(token);
        break;
      default:
        throw new Error(`Unsupported git provider: ${provider}`);
    }
  }

  async listRepos(): Promise<GitRepo[]> {
    return this.client.listRepos();
  }

  async listFiles(ownerOrId: string, repo: string, path = '', branch?: string): Promise<GitFile[]> {
    if (this.client instanceof GitHubClient) {
      return this.client.listFiles(ownerOrId, repo, path, branch);
    } else {
      // GitLab uses project ID
      return this.client.listFiles(ownerOrId, path, branch);
    }
  }

  async readFile(ownerOrId: string, repo: string, path: string, branch?: string): Promise<string> {
    if (this.client instanceof GitHubClient) {
      return this.client.readFile(ownerOrId, repo, path, branch);
    } else {
      return this.client.readFile(ownerOrId, path, branch);
    }
  }

  async createBranch(ownerOrId: string, repo: string, branchName: string, fromSha: string): Promise<void> {
    if (this.client instanceof GitHubClient) {
      return this.client.createBranch(ownerOrId, repo, branchName, fromSha);
    } else {
      return this.client.createBranch(ownerOrId, branchName, fromSha);
    }
  }

  async commitFile(
    ownerOrId: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    sha?: string
  ): Promise<GitCommit> {
    if (this.client instanceof GitHubClient) {
      return this.client.commitFile(ownerOrId, repo, path, content, message, branch, sha);
    } else {
      return this.client.commitFile(ownerOrId, path, content, message, branch, sha);
    }
  }

  async openPullRequest(
    ownerOrId: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body?: string
  ): Promise<GitPR> {
    if (this.client instanceof GitHubClient) {
      return this.client.openPullRequest(ownerOrId, repo, title, head, base, body);
    } else {
      return this.client.openPullRequest(ownerOrId, title, head, base, body);
    }
  }
}