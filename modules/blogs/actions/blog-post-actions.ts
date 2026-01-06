// 'use server';

// import { revalidatePath } from 'next/cache';
// import db from '@/lib/db';
// import { auth } from '@/lib/auth';
// import { PostStatus } from '@prisma/client';

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

// // Save blog post as draft
// export async function saveBlogDraft(
//   data: BlogPostData & {
//     workspaceId: string;
//     pageId: string; // The blog publication ID
//     blogPostId?: string; // If editing existing post
//   }
// ) {
//   console.log('data', data, data.workspaceId, data.pageId, data.blogPostId);
//   try {
//     const session = await auth();

//     if (!session?.user?.id) {
//       throw new Error('Unauthorized');
//     }

//     const { workspaceId, pageId, blogPostId, ...postData } = data;

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
//       throw new Error('Blog not found or access denied');
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
//       throw new Error('A post with this slug already exists in this blog');
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
//             // Keep existing legacy fields for compatibility
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
//             pageId, // Link to the blog publication
//             // Legacy compatibility
//             estimatedReadTime: readTime,
//           },
//         });

//     revalidatePath(`/${blogPage.workspace.slug}/blogs/${blogPage.slug}`);

//     return {
//       success: true,
//       blogPostId: blogPost.id,
//       message: 'Draft saved successfully!',
//     };
//   } catch (error) {
//     console.error('Error saving blog draft:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to save draft',
//     };
//   }
// }

// // Publish blog post
// export async function publishBlog(
//   data: BlogPostData & {
//     workspaceId: string;
//     pageId: string;
//     blogPostId?: string;
//   }
// ) {
//   try {
//     // First save as draft
//     const draftResult = await saveBlogDraft(data);
//     if (!draftResult.success) {
//       return draftResult;
//     }

//     const blogPostId = data.blogPostId || draftResult.blogPostId;

//     // Then publish
//     const blogPost = await db.blogPost.update({
//       where: { id: blogPostId },
//       data: {
//         status: PostStatus.PUBLISHED,
//         publishedAt: data.publishedAt || new Date(),
//       },
//     });

//     const blogPage = await db.page.findUnique({
//       where: { id: data.pageId },
//       include: { workspace: { select: { slug: true } } },
//     });

//     revalidatePath(`/${blogPage?.workspace?.slug}/blogs/${blogPage?.slug}`);

//     return {
//       success: true,
//       message: 'Blog post published successfully!',
//     };
//   } catch (error) {
//     console.error('Error publishing blog:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to publish blog',
//     };
//   }
// }

// // Get blog posts for a specific blog publication
// export async function getBlogPosts(pageId: string, workspaceId: string) {
//   try {
//     const session = await auth();

//     if (!session?.user?.id) {
//       throw new Error('Unauthorized');
//     }

//     const blogPosts = await db.blogPost.findMany({
//       where: {
//         pageId, // Posts for this specific blog publication
//         workspaceId,
//         workspace: {
//           members: {
//             some: { userId: session.user.id },
//           },
//         },
//       },
//       include: {
//         author: {
//           select: {
//             id: true,
//             name: true,
//             image: true,
//           },
//         },
//       },
//       orderBy: [
//         { pinned: 'desc' },
//         { publishedAt: 'desc' },
//         { createdAt: 'desc' },
//       ],
//     });

//     return {
//       success: true,
//       blogPosts,
//     };
//   } catch (error) {
//     console.error('Error fetching blog posts:', error);
//     return {
//       success: false,
//       error:
//         error instanceof Error ? error.message : 'Failed to fetch blog posts',
//     };
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
