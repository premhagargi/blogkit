import { auth } from '@/lib/auth';
import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/blogs/[pageId]/editor-metadata
 * Returns all metadata needed for the blog editor (categories, tags, authors)
 * Optionally fetches a specific post if ?postId= is provided
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ pageId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { pageId } = await params;
        const { searchParams } = new URL(request.url);
        const postId = searchParams.get('postId');

        // Get the page and verify access
        const page = await db.page.findFirst({
            where: {
                id: pageId,
                workspace: {
                    members: {
                        some: {
                            userId: session.user.id,
                        },
                    },
                },
            },
            select: {
                id: true,
                workspaceId: true,
                workspace: {
                    select: {
                        id: true,
                        slug: true,
                    },
                },
            },
        });

        if (!page) {
            return NextResponse.json(
                { error: 'Blog not found or access denied' },
                { status: 404 }
            );
        }

        // Build parallel queries
        const queries: Promise<any>[] = [
            // Categories with post counts
            db.category.findMany({
                where: {
                    pageId: pageId,
                    workspaceId: page.workspaceId,
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    color: true,
                    icon: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { blogPosts: true },
                    },
                },
                orderBy: { name: 'asc' },
            }),

            // Tags with post counts
            db.tag.findMany({
                where: {
                    pageId: pageId,
                    workspaceId: page.workspaceId,
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    color: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { blogPosts: true },
                    },
                },
                orderBy: { name: 'asc' },
            }),

            // Authors in this workspace
            db.author.findMany({
                where: {
                    workspaceId: page.workspaceId,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
                orderBy: { name: 'asc' },
            }),
        ];

        // Optionally fetch specific post for editing
        if (postId) {
            queries.push(
                db.blogPost.findFirst({
                    where: {
                        id: postId,
                        workspaceId: page.workspaceId,
                        pageId: pageId,
                    },
                    include: {
                        categories: { select: { id: true } },
                        tags: { select: { id: true } },
                    },
                })
            );
        }

        // Fetch all data in parallel for speed
        const results = await Promise.all(queries);
        const [categories, tags, authors] = results;
        const blogPost = postId ? results[3] : null;

        // Transform to match expected format
        const categoriesWithStats = categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            color: cat.color,
            icon: cat.icon,
            posts: cat._count.blogPosts,
            traffic: 0,
            leads: 0,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt,
        }));

        const tagsWithStats = tags.map((tag: any) => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            description: tag.description,
            color: tag.color,
            posts: tag._count.blogPosts,
            traffic: 0,
            leads: 0,
            usageCount: tag._count.blogPosts,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt,
        }));

        // Transform blog post if it exists
        let initialPost = null;
        if (blogPost) {
            const content = typeof blogPost.content === 'string'
                ? blogPost.content
                : JSON.stringify(blogPost.content ?? []);

            const status =
                blogPost.status === 'DRAFT' ||
                    blogPost.status === 'PUBLISHED' ||
                    blogPost.status === 'SCHEDULED'
                    ? blogPost.status
                    : 'DRAFT';

            initialPost = {
                id: blogPost.id,
                title: blogPost.title,
                slug: blogPost.slug,
                content,
                description: blogPost.excerpt ?? '',
                categoryIds: blogPost.categories.map((c: any) => c.id),
                tagIds: blogPost.tags.map((t: any) => t.id),
                authorIds: [
                    ...(blogPost.authorId ? [blogPost.authorId] : []),
                    ...(Array.isArray(blogPost.coAuthorIds) ? blogPost.coAuthorIds : []),
                ],
                featuredImage: blogPost.featuredImage ?? '',
                publishDate: blogPost.scheduledFor ?? blogPost.publishedAt ?? undefined,
                relatedArticleIds: [] as string[],
                status,
                readTime: blogPost.readTime ?? blogPost.estimatedReadTime ?? undefined,
            };
        }

        return NextResponse.json({
            success: true,
            data: {
                workspaceId: page.workspaceId,
                workspaceSlug: page.workspace.slug,
                categories: categoriesWithStats,
                tags: tagsWithStats,
                authors: authors,
                initialPost,
            },
        });
    } catch (error) {
        console.error('Error fetching editor metadata:', error);
        return NextResponse.json(
            { error: 'Failed to fetch editor metadata' },
            { status: 500 }
        );
    }
}

