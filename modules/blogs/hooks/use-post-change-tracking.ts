'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { BlogPost } from '../components/blog-editor-sidebar';
import { deepEqual, deepClone } from '@/lib/utils';

interface UsePostChangeTrackingOptions {
  initialPost?: BlogPost;
  currentPost: BlogPost;
  onRevert?: (initialPost: BlogPost) => void;
}

interface UsePostChangeTrackingReturn {
  hasChanges: boolean;
  revertToInitial: () => void;
  updateInitialState: (newInitial: BlogPost) => void;
  getInitialPost: () => BlogPost | undefined;
}

/**
 * Hook to track changes between current post state and initial published/saved state
 */
export function usePostChangeTracking({
  initialPost,
  currentPost,
  onRevert,
}: UsePostChangeTrackingOptions): UsePostChangeTrackingReturn {
  // Store initial state in ref to prevent re-renders
  const initialPostRef = useRef<BlogPost | undefined>(
    initialPost ? deepClone(initialPost) : undefined
  );

  // Track if there are changes
  const [hasChanges, setHasChanges] = useState(false);

  // Normalize post for comparison (handle content as string or object)
  const normalizePost = useCallback((post: BlogPost): BlogPost => {
    const normalized = { ...post };

    // Normalize content - always compare as string
    if (normalized.content) {
      if (typeof normalized.content === 'string') {
        // Already a string, try to parse and re-stringify to normalize
        try {
          const parsed = JSON.parse(normalized.content);
          normalized.content = JSON.stringify(parsed);
        } catch {
          // If parsing fails, keep as is
        }
      } else {
        // It's an object/array, stringify it
        normalized.content = JSON.stringify(normalized.content);
      }
    } else {
      normalized.content = '';
    }

    // Normalize arrays - sort for comparison
    normalized.categoryIds = [...(normalized.categoryIds || [])].sort();
    normalized.tagIds = [...(normalized.tagIds || [])].sort();
    normalized.authorIds = [...(normalized.authorIds || [])].sort();
    normalized.relatedArticleIds = [...(normalized.relatedArticleIds || [])].sort();

    // Normalize dates
    if (normalized.publishDate && !(normalized.publishDate instanceof Date)) {
      normalized.publishDate = new Date(normalized.publishDate);
    }

    // Normalize strings (trim and handle undefined)
    normalized.title = (normalized.title || '').trim();
    normalized.description = (normalized.description || '').trim();
    normalized.slug = (normalized.slug || '').trim();
    normalized.featuredImage = normalized.featuredImage || '';

    return normalized;
  }, []);

  // Compare current post with initial post
  const checkForChanges = useCallback(() => {
    if (!initialPostRef.current) {
      // No initial post means this is a new post
      // Check if current post has any meaningful content
      const hasContent =
        currentPost.title?.trim() ||
        currentPost.content ||
        (currentPost.categoryIds && currentPost.categoryIds.length > 0) ||
        (currentPost.tagIds && currentPost.tagIds.length > 0) ||
        (currentPost.authorIds && currentPost.authorIds.length > 0);

      setHasChanges(hasContent);
      return;
    }

    const normalizedCurrent = normalizePost(currentPost);
    const normalizedInitial = normalizePost(initialPostRef.current);

    // Compare all relevant fields
    const changed =
      normalizedCurrent.title !== normalizedInitial.title ||
      normalizedCurrent.slug !== normalizedInitial.slug ||
      normalizedCurrent.content !== normalizedInitial.content ||
      normalizedCurrent.description !== normalizedInitial.description ||
      normalizedCurrent.featuredImage !== normalizedInitial.featuredImage ||
      !deepEqual(normalizedCurrent.categoryIds, normalizedInitial.categoryIds) ||
      !deepEqual(normalizedCurrent.tagIds, normalizedInitial.tagIds) ||
      !deepEqual(normalizedCurrent.authorIds, normalizedInitial.authorIds) ||
      !deepEqual(
        normalizedCurrent.relatedArticleIds,
        normalizedInitial.relatedArticleIds
      ) ||
      !deepEqual(normalizedCurrent.publishDate, normalizedInitial.publishDate);

    setHasChanges(changed);
  }, [currentPost, normalizePost]);

  // Check for changes whenever current post changes
  useEffect(() => {
    checkForChanges();
  }, [checkForChanges]);

  // Revert to initial state
  const revertToInitial = useCallback(() => {
    if (!initialPostRef.current) {
      // For new posts, revert to empty state
      const emptyPost: BlogPost = {
        title: '',
        content: '',
        description: '',
        categoryIds: [],
        tagIds: [],
        authorIds: [],
        featuredImage: '',
        publishDate: undefined,
        relatedArticleIds: [],
        status: 'DRAFT',
        readTime: 5,
      };
      onRevert?.(emptyPost);
      return;
    }

    // Restore initial state
    const restored = deepClone(initialPostRef.current);
    onRevert?.(restored);
  }, [onRevert]);

  // Update initial state (called after save/publish)
  const updateInitialState = useCallback(
    (newInitial: BlogPost) => {
      initialPostRef.current = deepClone(newInitial);
      checkForChanges();
    },
    [checkForChanges]
  );

  // Get initial post (for external access)
  const getInitialPost = useCallback(() => {
    return initialPostRef.current ? deepClone(initialPostRef.current) : undefined;
  }, []);

  return {
    hasChanges,
    revertToInitial,
    updateInitialState,
    getInitialPost,
  };
}
