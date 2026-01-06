// import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@/lib/auth';
// import db from '@/lib/db';
// import { PostStatus } from '@prisma/client';
// import { revalidatePath } from 'next/cache';

// export interface BlogPostData {
//   title: string;
//   slug?: string;
//   content: any; // PlateJS content
//   excerpt?: string;
//   featuredImage?: string;
//   tags: string[];
//   category?: string;
//   metaTitle?: string;
//   metaDescription?: string;
//   featured?: boolean;
//   pinned?: boolean;
//   scheduledFor?: Date;
//   publishedAt?: Date;
// }

// export async function POST(request: NextRequest) {
//   try {
//     const session = await auth();

//     if (!session?.user?.id) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await request.json();
//     const {
//       workspaceId,
//       pageId,
//       blogPostId,
//       ...postData
//     }: BlogPostData & {
//       workspaceId: string;
//       pageId: string;
//       blogPostId?: string;
//     } = body;

//     // Validate required fields
//     if (!workspaceId || !pageId || !postData.title) {
//       return NextResponse.json(
//         { error: 'WorkspaceId, pageId, and title are required' },
//         { status: 400 }
//       );
//     }

//     if (
//       !postData.content ||
//       (Array.isArray(postData.content) && postData.content.length === 0)
//     ) {
//       return NextResponse.json(
//         { error: 'Content is required for publishing' },
//         { status: 400 }
//       );
//     }

//     // Verify the blog publication exists and user has access
//     const blogPage = await db.page.findFirst({
//       where: {
//         id: pageId,
//         type: 'BLOG',
//         workspaceId,
//         workspace: {
//           members: {
//             some: {
//               userId: session.user.id,
//               role: { in: ['OWNER', 'ADMIN', 'EDITOR'] },
//             },
//           },
//         },
//       },
//       include: {
//         workspace: {
//           select: { slug: true },
//         },
//       },
//     });

//     if (!blogPage) {
//       return NextResponse.json(
//         { error: 'Blog not found or access denied' },
//         { status: 403 }
//       );
//     }

//     // Generate slug
//     const slug = postData.slug || generateSlug(postData.title);

//     // Check slug uniqueness within this blog
//     const existingPost = await db.blogPost.findFirst({
//       where: {
//         slug,
//         pageId, // Within the same blog publication
//         ...(blogPostId && { id: { not: blogPostId } }),
//       },
//     });

//     if (existingPost) {
//       return NextResponse.json(
//         { error: 'A post with this slug already exists in this blog' },
//         { status: 409 }
//       );
//     }

//     // Find or create author
//     let author = await db.author.findFirst({
//       where: {
//         email: session.user.email!,
//         workspaceId,
//       },
//     });

//     if (!author) {
//       author = await db.author.create({
//         data: {
//           name: session.user.name || 'Anonymous',
//           email: session.user.email!,
//           image: session.user.image,
//           workspaceId,
//         },
//       });
//     }

//     const readTime = calculateReadTime(postData.content);

//     const blogPost = blogPostId
//       ? await db.blogPost.update({
//           where: { id: blogPostId },
//           data: {
//             title: postData.title,
//             slug,
//             content: postData.content,
//             excerpt: postData.excerpt,
//             featuredImage: postData.featuredImage,
//             tags: postData.tags,
//             categories: postData.category ? [postData.category] : [],
//             metaTitle: postData.metaTitle,
//             metaDescription: postData.metaDescription,
//             featured: postData.featured || false,
//             pinned: postData.pinned || false,
//             readTime,
//             scheduledFor: postData.scheduledFor,
//             estimatedReadTime: readTime,
//           },
//         })
//       : await db.blogPost.create({
//           data: {
//             title: postData.title,
//             slug,
//             content: postData.content,
//             excerpt: postData.excerpt,
//             status: PostStatus.DRAFT,
//             featuredImage: postData.featuredImage,
//             tags: postData.tags,
//             categories: postData.category ? [postData.category] : [],
//             metaTitle: postData.metaTitle,
//             metaDescription: postData.metaDescription,
//             featured: postData.featured || false,
//             pinned: postData.pinned || false,
//             readTime,
//             scheduledFor: postData.scheduledFor,
//             authorId: author.id,
//             workspaceId,
//             pageId,
//             estimatedReadTime: readTime,
//           },
//         });

//     // Revalidate cache
//     revalidatePath(`/${blogPage.workspace.slug}/blogs/${blogPage.slug}`);

//     return NextResponse.json(
//       {
//         success: true,
//         blogPostId: blogPost.id,
//         message: 'Draft saved successfully!',
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error('Error saving blog draft:', error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : 'Failed to save draft',
//       },
//       { status: 500 }
//     );
//   }
// }

// function generateSlug(title: string): string {
//   return title
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, '-')
//     .replace(/^-+|-+$/g, '');
// }

// function calculateReadTime(content: any): number {
//   if (!content) return 1;

//   const extractText = (nodes: any[]): string => {
//     return nodes
//       .map((node) => {
//         if (typeof node === 'string') return node;
//         if (node.text) return node.text;
//         if (node.children) return extractText(node.children);
//         return '';
//       })
//       .join(' ');
//   };

//   const text = extractText(Array.isArray(content) ? content : [content]);
//   const words = text
//     .trim()
//     .split(/\s+/)
//     .filter((word) => word.length > 0).length;
//   return Math.max(1, Math.ceil(words / 200));
// }

// interface ApiResponse<T = any> {
//   success: boolean;
//   data?: T;
//   error?: string;
//   message?: string;
// }

// class ApiClient {
//   private baseURL: string;

//   constructor() {
//     this.baseURL =
//       process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : '';
//   }

//   private async request<T = any>(
//     endpoint: string,
//     options: RequestInit = {}
//   ): Promise<ApiResponse<T>> {
//     try {
//       const url = `${this.baseURL}${endpoint}`;
//       const response = await fetch(url, {
//         headers: {
//           'Content-Type': 'application/json',
//           ...options.headers,
//         },
//         ...options,
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || `HTTP error! status: ${response.status}`);
//       }

//       return data;
//     } catch (error) {
//       console.error('API request failed:', error);
//       return {
//         success: false,
//         error:
//           error instanceof Error ? error.message : 'Unknown error occurred',
//       };
//     }
//   }

//   // Blog post methods
//   async saveBlogDraft(data: any) {
//     return this.request('/api/blog-posts/draft', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//   }

//   async publishBlogPost(data: any) {
//     return this.request('/api/blog-posts/publish', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//   }
// }

// export const apiClient = new ApiClient();
