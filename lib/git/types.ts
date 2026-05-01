export type GitProvider = 'github' | 'gitlab';

export interface GitRepo {
  id: string;
  name: string;
  fullName: string;
  url: string;
  private: boolean;
  defaultBranch: string;
}

export interface GitFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  sha: string;
  url: string;
}

export interface GitBranch {
  name: string;
  sha: string;
  protected: boolean;
}

export interface GitCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  date: string;
}

export interface GitPR {
  id: number;
  title: string;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  url: string;
  state: 'open' | 'closed';
}