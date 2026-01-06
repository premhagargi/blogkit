'use client';

import { useQuery } from '@tanstack/react-query';

interface CategoryWithStats {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    icon?: string;
    posts: number;
    traffic: number;
    leads: number;
    createdAt: Date;
    updatedAt: Date;
}

interface TagWithStats {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    posts: number;
    traffic: number;
    leads: number;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

interface Author {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
}

interface InitialPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    description: string;
    categoryIds: string[];
    tagIds: string[];
    authorIds: string[];
    featuredImage: string;
    publishDate?: Date;
    relatedArticleIds: string[];
    status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
    readTime?: number;
}

interface EditorMetadata {
    workspaceId: string;
    workspaceSlug: string;
    categories: CategoryWithStats[];
    tags: TagWithStats[];
    authors: Author[];
    initialPost: InitialPost | null;
}

interface UseEditorMetadataParams {
    blogId: string;
    postId?: string;
}

interface UseEditorMetadataResult {
    data: EditorMetadata | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
}

export function useEditorMetadata({ blogId, postId }: UseEditorMetadataParams): UseEditorMetadataResult {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['editor-metadata', blogId, postId],
        queryFn: async (): Promise<EditorMetadata> => {
            const url = postId
                ? `/api/blogs/${blogId}/editor-metadata?postId=${postId}`
                : `/api/blogs/${blogId}/editor-metadata`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch editor metadata');
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch editor metadata');
            }

            return result.data;
        },
        enabled: !!blogId,
        staleTime: 5 * 60 * 1000, // 5 minutes - metadata doesn't change often
        gcTime: 10 * 60 * 1000, // 10 minutes cache
    });

    return {
        data: data ?? null,
        isLoading,
        isError,
        error: error as Error | null,
    };
}
