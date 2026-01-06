// 'use server';

// import { revalidatePath } from 'next/cache';
// import { redirect } from 'next/navigation';
// import db from '@/lib/db';
// import { auth } from '@/lib/auth';
// import { PageStatus, PageType } from '@prisma/client';

// interface PublishBlogData {
//   title: string;
//   slug: string;
//   description?: string;
//   content: any[]; // PlateJS content
//   featuredImage?: string;
//   category?: string;
//   tags: string[];
//   authorIds: string[]; // Author IDs from the Author model
//   seoTitle?: string;
//   seoDescription?: string;
//   readTime?: number;
//   publishedAt?: Date;
//   workspaceId: string;
//   blogId?: string; // If updating existing blog
// }

// export async function publishBlog(data: PublishBlogData) {
//   try {
//     const session = await auth();

//     if (!session?.user?.id) {
//       throw new Error('Unauthorized');
//     }

//     const {
//       title,
//       slug,
//       description,
//       content,
//       featuredImage,
//       category,
//       tags,
//       authorIds,
//       seoTitle,
//       seoDescription,
//       readTime,
//       publishedAt,
//       workspaceId,
//       blogId,
//     } = data;

//     // Verify user has access to the workspace
//     const workspace = await db.workspace.findFirst({
//       where: {
//         id: workspaceId,
//         members: {
//           some: {
//             userId: session.user.id,
//             role: {
//               in: ['OWNER', 'ADMIN', 'EDITOR'],
//             },
//           },
//         },
//       },
//     });

//     if (!workspace) {
//       throw new Error('Workspace not found or access denied');
//     }

//     // Check if slug is unique within workspace (excluding current blog if updating)
//     const existingPage = await db.page.findFirst({
//       where: {
//         slug,
//         workspaceId,
//         ...(blogId && { id: { not: blogId } }),
//       },
//     });

//     if (existingPage) {
//       throw new Error('A blog with this slug already exists');
//     }

//     // Calculate estimated read time if not provided
//     const estimatedReadTime = readTime || calculateReadTime(content);

//     const result = await db.$transaction(async (tx) => {
//       // Create or update the main Page record
//       const page = blogId
//         ? await tx.page.update({
//             where: { id: blogId },
//             data: {
//               title,
//               slug,
//               description,
//               content,
//               status: PageStatus.PUBLISHED,
//               featuredImage,
//               seoTitle: seoTitle || title,
//               seoDescription: seoDescription || description,
//               readTime: estimatedReadTime,
//               category,
//               publishedAt: publishedAt || new Date(),
//               updatedById: session.user.id,
//             },
//           })
//         : await tx.page.create({
//             data: {
//               title,
//               slug,
//               type: PageType.BLOG,
//               description,
//               content,
//               status: PageStatus.PUBLISHED,
//               featuredImage,
//               seoTitle: seoTitle || title,
//               seoDescription: seoDescription || description,
//               readTime: estimatedReadTime,
//               category,
//               publishedAt: publishedAt || new Date(),
//               workspaceId,
//               createdById: session.user.id,
//               updatedById: session.user.id,
//             },
//           });

//       // Create or update BlogPost record
//       await tx.blogPost.upsert({
//         where: { pageId: page.id },
//         update: {
//           tags,
//           categories: category ? [category] : [],
//           estimatedReadTime,
//         },
//         create: {
//           pageId: page.id,
//           tags,
//           categories: category ? [category] : [],
//           estimatedReadTime,
//         },
//       });

//       // Handle authors - first clear existing PageAuthor relationships
//       await tx.pageAuthor.deleteMany({
//         where: { pageId: page.id },
//       });

//       // Add new author relationships
//       if (authorIds.length > 0) {
//         // Verify all authors exist and belong to the workspace
//         const validAuthors = await tx.author.findMany({
//           where: {
//             id: { in: authorIds },
//             workspaceId,
//           },
//         });

//         const validAuthorIds = validAuthors.map((author) => author.id);

//         await tx.pageAuthor.createMany({
//           data: validAuthorIds.map((authorId) => ({
//             pageId: page.id,
//             userId: session.user.id, // The user creating the relationship
//           })),
//         });

//         // Also connect to the Author model through the pages relation
//         await tx.page.update({
//           where: { id: page.id },
//           data: {
//             pageAuthors: {
//               connect: validAuthorIds.map((id) => ({ id })),
//             },
//           },
//         });
//       }

//       return page;
//     });

//     // Revalidate relevant paths
//     revalidatePath(`/${workspace.slug}/blogs`);
//     revalidatePath(`/${workspace.slug}/blogs/${result.id}`);

//     return {
//       success: true,
//       pageId: result.id,
//       message: 'Blog published successfully!',
//     };
//   } catch (error) {
//     console.error('Error publishing blog:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to publish blog',
//     };
//   }
// }

// export async function saveBlogDraft(data: PublishBlogData) {
//   try {
//     const session = await auth();

//     if (!session?.user?.id) {
//       throw new Error('Unauthorized');
//     }

//     const {
//       title,
//       slug,
//       description,
//       content,
//       featuredImage,
//       category,
//       tags,
//       authorIds,
//       seoTitle,
//       seoDescription,
//       readTime,
//       workspaceId,
//       blogId,
//     } = data;

//     // Verify workspace access
//     const workspace = await db.workspace.findFirst({
//       where: {
//         id: workspaceId,
//         members: {
//           some: {
//             userId: session.user.id,
//             role: {
//               in: ['OWNER', 'ADMIN', 'EDITOR'],
//             },
//           },
//         },
//       },
//     });

//     if (!workspace) {
//       throw new Error('Workspace not found or access denied');
//     }

//     const estimatedReadTime = readTime || calculateReadTime(content);

//     const result = await db.$transaction(async (tx) => {
//       const page = blogId
//         ? await tx.page.update({
//             where: { id: blogId },
//             data: {
//               title,
//               slug,
//               description,
//               content,
//               status: PageStatus.DRAFT,
//               featuredImage,
//               seoTitle: seoTitle || title,
//               seoDescription: seoDescription || description,
//               readTime: estimatedReadTime,
//               category,
//               updatedById: session.user.id,
//             },
//           })
//         : await tx.page.create({
//             data: {
//               title,
//               slug,
//               type: PageType.BLOG,
//               description,
//               content,
//               status: PageStatus.DRAFT,
//               featuredImage,
//               seoTitle: seoTitle || title,
//               seoDescription: seoDescription || description,
//               readTime: estimatedReadTime,
//               category,
//               workspaceId,
//               createdById: session.user.id,
//               updatedById: session.user.id,
//             },
//           });

//       await tx.blogPost.upsert({
//         where: { pageId: page.id },
//         update: {
//           tags,
//           categories: category ? [category] : [],
//           estimatedReadTime,
//         },
//         create: {
//           pageId: page.id,
//           tags,
//           categories: category ? [category] : [],
//           estimatedReadTime,
//         },
//       });

//       return page;
//     });

//     revalidatePath(`/${workspace.slug}/blogs`);

//     return {
//       success: true,
//       pageId: result.id,
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

// export async function deleteBlog(blogId: string, workspaceId: string) {
//   try {
//     const session = await auth();

//     if (!session?.user?.id) {
//       throw new Error('Unauthorized');
//     }

//     // Verify workspace access
//     const workspace = await db.workspace.findFirst({
//       where: {
//         id: workspaceId,
//         members: {
//           some: {
//             userId: session.user.id,
//             role: {
//               in: ['OWNER', 'ADMIN', 'EDITOR'],
//             },
//           },
//         },
//       },
//     });

//     if (!workspace) {
//       throw new Error('Workspace not found or access denied');
//     }

//     await db.$transaction(async (tx) => {
//       // Delete related records first
//       await tx.pageAuthor.deleteMany({
//         where: { pageId: blogId },
//       });

//       await tx.blogPost.deleteMany({
//         where: { pageId: blogId },
//       });

//       await tx.page.delete({
//         where: { id: blogId },
//       });
//     });

//     revalidatePath(`/${workspace.slug}/blogs`);

//     return { success: true, message: 'Blog deleted successfully!' };
//   } catch (error) {
//     console.error('Error deleting blog:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to delete blog',
//     };
//   }
// }

// // Helper function to calculate read time from PlateJS content
// function calculateReadTime(content: any[]): number {
//   if (!content || !Array.isArray(content)) return 1;

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

//   const text = extractText(content);
//   const words = text
//     .trim()
//     .split(/\s+/)
//     .filter((word) => word.length > 0).length;
//   return Math.max(1, Math.ceil(words / 200)); // 200 words per minute, minimum 1 minute
// }

// // Get blog for editing
// export async function getBlog(blogId: string, workspaceId: string) {
//   try {
//     const session = await auth();

//     if (!session?.user?.id) {
//       throw new Error('Unauthorized');
//     }

//     const blog = await db.page.findFirst({
//       where: {
//         id: blogId,
//         workspaceId,
//         type: PageType.BLOG,
//         workspace: {
//           members: {
//             some: {
//               userId: session.user.id,
//             },
//           },
//         },
//       },
//       include: {
//         blogPost: true,
//         pageAuthors: true,
//         createdBy: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     if (!blog) {
//       throw new Error('Blog not found');
//     }

//     return { success: true, blog };
//   } catch (error) {
//     console.error('Error fetching blog:', error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to fetch blog',
//     };
//   }
// }
