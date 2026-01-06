export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  order: number;
  workspaceId: string;
  blogId?: string;
  usageCount: number; // How many posts use this category
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  workspaceId: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}
