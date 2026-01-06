export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: any; // JSON content
  htmlContent?: string;
  excerpt?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED' | 'DELETED';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // ✅ UPDATED: Rich category and tag data instead of strings
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    color?: string;
    usageCount: number;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    color?: string;
    description?: string;
  }>;

  featured: boolean;
  pinned: boolean;
  views: number;
  readTime?: number;
  featuredImage?: string;

  // Author relations
  authorId?: string;
  coAuthorIds: string[];
  author?: {
    id: string;
    name: string;
    image?: string;
  };
  coAuthors?: Array<{
    id: string;
    name: string;
    image?: string;
  }>;

  // Workspace relation
  workspaceId: string;
  pageId: string; // Blog publication ID
}
