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

  async listFiles(owner: string, repo: string, path = '', branch?: string): Promise<GitFile[]> {
    if (this.client instanceof GitHubClient) {
      return this.client.listFiles(owner, repo, path, branch);
    } else {
      // For GitLab, use "owner/repo" as project identifier
      const projectId = `${owner}/${repo}`;
      return this.client.listFiles(projectId, path, branch);
    }
  }

  async readFile(owner: string, repo: string, path: string, branch?: string): Promise<string> {
    if (this.client instanceof GitHubClient) {
      return this.client.readFile(owner, repo, path, branch);
    } else {
      // For GitLab, use "owner/repo" as project identifier
      const projectId = `${owner}/${repo}`;
      return this.client.readFile(projectId, path, branch);
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
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    sha?: string
  ): Promise<GitCommit> {
    if (this.client instanceof GitHubClient) {
      return this.client.commitFile(owner, repo, path, content, message, branch, sha);
    } else {
      // For GitLab, use "owner/repo" as project identifier
      const projectId = `${owner}/${repo}`;
      return this.client.commitFile(projectId, path, content, message, branch, sha);
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

  /**
   * Get the identifier needed to update a file.
   * GitHub: returns blob SHA
   * GitLab: returns last_commit_id
   */
  async getFileUpdateId(owner: string, repo: string, path: string, branch?: string): Promise<string> {
    if (this.client instanceof GitHubClient) {
      const info = await this.client.getFileInfo(owner, repo, path, branch);
      return info.sha;
    } else {
      // For GitLab, use "owner/repo" as project identifier
      const projectId = `${owner}/${repo}`;
      const info = await (this.client as GitLabClient).getFileInfo(projectId, path, branch);
      if (!info.last_commit_id) {
        throw new Error('File not found or missing last_commit_id');
      }
      return info.last_commit_id;
    }
  }
      return files[0].sha;
    } else {
      // For GitLab, ownerOrId is numeric ID, repo is not used in project path construction in our client
      const fileInfo = await (this.client as GitLabClient).getFileInfo(ownerOrId, path, branch);
      if (!fileInfo.last_commit_id) {
        throw new Error('File not found or missing last_commit_id');
      }
      return fileInfo.last_commit_id;
    }
  }
}
  }

  /**
   * Get the identifier required to update a file.
   * - GitHub: returns blob SHA
   * - GitLab: returns last_commit_id (commit SHA of last change to the file)
   */
  async getFileUpdateId(ownerOrId: string, repo: string, path: string, branch?: string): Promise<string> {
    if (this.client instanceof GitHubClient) {
      const files = await this.client.listFiles(ownerOrId, repo, path, branch);
      if (files.length === 0) {
        throw new Error('File not found');
      }
      return files[0].sha;
    } else {
      // GitLab: combine ownerOrId and repo into full project path
      const projectId = `${ownerOrId}/${repo}`;
      const fileInfo = await (this.client as GitLabClient).getFileInfo(projectId, path, branch);
      if (!fileInfo.last_commit_id) {
        throw new Error('File not found or missing last_commit_id');
      }
      return fileInfo.last_commit_id;
    }
  }
}