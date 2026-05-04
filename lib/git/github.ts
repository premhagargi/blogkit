import { GitRepo, GitFile, GitBranch, GitCommit, GitPR } from './types';

export class GitHubClient {
  constructor(private token: string) {}

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'BlogKit-Sites',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async listRepos(): Promise<GitRepo[]> {
    const data = await this.request('/user/repos?sort=updated&per_page=100');
    return data.map((repo: any) => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      private: repo.private,
      defaultBranch: repo.default_branch,
    }));
  }

  async getFileInfo(owner: string, repo: string, path: string, branch?: string): Promise<{ sha: string }> {
    const query = branch ? `?ref=${branch}` : '';
    const data = await this.request(`/repos/${owner}/${repo}/contents/${path}${query}`);
    return { sha: data.sha };
  }

  async listFiles(owner: string, repo: string, path = '', branch?: string): Promise<GitFile[]> {
    // Fetch entire git tree recursively
    const branchName = branch || 'main';
    const data = await this.request(`/repos/${owner}/${repo}/git/trees/${branchName}?recursive=1`);

    const items = data.tree || [];

    // Filter by path prefix if specified
    let filtered = items.filter((item: any) => item.type === 'blob' || item.type === 'tree');

    if (path) {
      const prefix = path.endsWith('/') ? path : path + '/';
      filtered = filtered.filter((item: any) => item.path.startsWith(prefix));
    }

    return filtered.map((item: any) => ({
      name: item.path.split('/').pop() || item.path,
      path: item.path,
      type: item.type === 'blob' ? 'file' : 'dir',
      size: item.size,
      sha: item.sha,
      url: '',
    }));
  }

  async listFiles(owner: string, repo: string, path = '', branch?: string): Promise<GitFile[]> {
    // Fetch entire git tree recursively
    const branchName = branch || 'main';
    const data = await this.request(`/repos/${owner}/${repo}/git/trees/${branchName}?recursive=1`);

    const items = data.tree || [];

    // Filter by path prefix if specified
    let filtered = items.filter((item: any) => item.type === 'blob' || item.type === 'tree');

    if (path) {
      const prefix = path.endsWith('/') ? path : path + '/';
      filtered = filtered.filter((item: any) => item.path.startsWith(prefix));
    }

    return filtered.map((item: any) => ({
      name: item.path.split('/').pop() || item.path,
      path: item.path,
      type: item.type === 'blob' ? 'file' : 'dir',
      size: item.size,
      sha: item.sha,
      url: '',
    }));
  }

  async readFile(owner: string, repo: string, path: string, branch?: string): Promise<string> {
    const query = branch ? `?ref=${branch}` : '';
    const data = await this.request(`/repos/${owner}/${repo}/contents/${path}${query}`);
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  async createBranch(owner: string, repo: string, branchName: string, fromSha: string): Promise<void> {
    await this.request(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: fromSha,
      }),
    });
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
    const body: any = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
    };

    if (sha) {
      body.sha = sha;
    }

    const data = await this.request(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    return {
      sha: data.commit.sha,
      blobSha: data.content.sha,
      message: data.commit.message,
      author: {
        name: data.commit.author.name,
        email: data.commit.author.email,
      },
      date: data.commit.author.date,
    };
  }

  async openPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body?: string
  ): Promise<GitPR> {
    const data = await this.request(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        head,
        base,
        body,
      }),
    });

    return {
      id: data.number,
      title: data.title,
      head: {
        ref: data.head.ref,
        sha: data.head.sha,
      },
      base: {
        ref: data.base.ref,
      },
      url: data.html_url,
      state: data.state,
    };
  }

  private mapFile(file: any): GitFile {
    return {
      name: file.name,
      path: file.path,
      type: file.type === 'file' ? 'file' : 'dir',
      size: file.size,
      sha: file.sha,
      url: file.html_url,
    };
  }
}