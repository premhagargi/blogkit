export interface CloudflareProject {
  id: string;
  name: string;
  subdomain: string;
  domains: string[];
  source: {
    type: 'github' | 'gitlab';
    config: {
      owner: string;
      repo: string;
      branch: string;
      prCommentsEnabled: boolean;
    };
  };
  buildConfig: {
    buildCommand: string;
    destinationDir: string;
    rootDir: string;
    webAnalyticsTag: string;
    webAnalyticsToken: string;
  };
  deploymentTrigger: {
    type: 'manual' | 'automatic';
  };
  latestDeployment?: CloudflareDeployment;
  createdOn: string;
  modifiedOn: string;
}

export interface CloudflareDeployment {
  id: string;
  shortId: string;
  projectId: string;
  projectName: string;
  environment: 'preview' | 'production';
  url: string;
  createdOn: string;
  modifiedOn: string;
  status: 'active' | 'success' | 'failure' | 'pending' | 'building';
  buildConfig: {
    buildCommand: string;
    destinationDir: string;
    rootDir: string;
    webAnalyticsTag: string;
    webAnalyticsToken: string;
  };
  source: {
    type: 'github' | 'gitlab';
    config: {
      owner: string;
      repo: string;
      branch: string;
      commitHash: string;
      commitMessage: string;
    };
  };
  build?: {
    logsUrl: string;
    startedOn: string;
    endedOn: string;
  };
}

export class CloudflarePagesClient {
  constructor(
    private accountId: string,
    private apiToken: string
  ) {}

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText} - ${error}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Cloudflare API error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    return data.result;
  }

  async createProject(
    name: string,
    source: {
      type: 'github' | 'gitlab';
      config: {
        owner: string;
        repo: string;
        branch: string;
      };
    },
    buildConfig?: {
      buildCommand?: string;
      destinationDir?: string;
      rootDir?: string;
    }
  ): Promise<CloudflareProject> {
    const body: any = {
      name,
      source,
      deployment_configs: {
        production: {
          ...buildConfig,
        },
      },
    };

    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async connectRepo(
    projectName: string,
    source: {
      type: 'github' | 'gitlab';
      config: {
        owner: string;
        repo: string;
        branch: string;
      };
    }
  ): Promise<void> {
    await this.request(`/projects/${projectName}`, {
      method: 'PATCH',
      body: JSON.stringify({
        source,
      }),
    });
  }

  async triggerDeployment(projectName: string, branch?: string): Promise<CloudflareDeployment> {
    const body = branch ? { branch } : {};
    return this.request(`/projects/${projectName}/deployments`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async uploadDeployment(
    projectName: string,
    files: { [path: string]: Buffer },
    manifest: { [path: string]: string }
  ): Promise<CloudflareDeployment> {
    // Create a FormData for multipart upload
    const formData = new FormData();

    // Add files
    for (const [path, content] of Object.entries(files)) {
      formData.append('file', new Blob([content]), path);
    }

    // Add manifest
    formData.append('manifest', JSON.stringify(manifest));

    return this.request(`/projects/${projectName}/deployments`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': undefined, // Let fetch set it for FormData
      },
    });
  }

  async getDeployment(projectName: string, deploymentId: string): Promise<CloudflareDeployment> {
    return this.request(`/projects/${projectName}/deployments/${deploymentId}`);
  }

  async getDeployments(projectName: string): Promise<CloudflareDeployment[]> {
    return this.request(`/projects/${projectName}/deployments`);
  }

  async getProject(projectName: string): Promise<CloudflareProject> {
    return this.request(`/projects/${projectName}`);
  }

  async listProjects(): Promise<CloudflareProject[]> {
    return this.request('/projects');
  }
}