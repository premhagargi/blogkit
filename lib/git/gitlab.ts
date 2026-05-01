import { GitRepo, GitFile, GitBranch, GitCommit, GitPR } from './types';

export class GitLabClient {
  constructor(private token: string) {}

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`https://gitlab.com/api/v4${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async listRepos(): Promise<GitRepo[]> {
    const data = await this.request('/projects?owned=true&order_by=updated_at&per_page=100');
    return data.map((project: any) => ({
      id: project.id.toString(),
      name: project.name,
      fullName: project.path_with_namespace,
      url: project.web_url,
      private: project.visibility === 'private',
      defaultBranch: project.default_branch,
    }));
  }

  async listFiles(projectId: string, path = '', branch?: string): Promise<GitFile[]> {
    const query = branch ? `?ref=${branch}` : '';
    const data = await this.request(`/projects/${projectId}/repository/tree${query}&path=${encodeURIComponent(path)}&per_page=100`);
    return data.map((item: any) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      sha: item.id,
      url: '', // GitLab doesn't provide direct file URLs in tree API
    }));
  }

  async readFile(projectId: string, path: string, branch?: string): Promise<string> {
    const query = branch ? `?ref=${branch}` : '';
    const data = await this.request(`/projects/${projectId}/repository/files/${encodeURIComponent(path)}${query}`);
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  async createBranch(projectId: string, branchName: string, fromSha: string): Promise<void> {
    await this.request(`/projects/${projectId}/repository/branches`, {
      method: 'POST',
      body: JSON.stringify({
        branch: branchName,
        ref: fromSha,
      }),
    });
  }

  async commitFile(
    projectId: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    lastCommitId?: string
  ): Promise<GitCommit> {
    const actions = [{
      action: 'update',
      file_path: path,
      content: content,
    }];

    if (lastCommitId) {
      actions[0].previous_path = path; // For updates
    }

    const data = await this.request(`/projects/${projectId}/repository/commits`, {
      method: 'POST',
      body: JSON.stringify({
        branch,
        commit_message: message,
        actions,
      }),
    });

    return {
      sha: data.id,
      message: data.message,
      author: {
        name: data.author_name,
        email: data.author_email,
      },
      date: data.created_at,
    };
  }

  async openPullRequest(
    projectId: string,
    title: string,
    sourceBranch: string,
    targetBranch: string,
    description?: string
  ): Promise<GitPR> {
    const data = await this.request(`/projects/${projectId}/merge_requests`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        source_branch: sourceBranch,
        target_branch: targetBranch,
        description,
      }),
    });

    return {
      id: data.iid,
      title: data.title,
      head: {
        ref: data.source_branch,
        sha: data.sha,
      },
      base: {
        ref: data.target_branch,
      },
      url: data.web_url,
      state: data.state === 'opened' ? 'open' : 'closed',
    };
  }
}