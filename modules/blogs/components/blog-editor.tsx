'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { BlogEditorSidebar, BlogPost, Author } from './blog-editor-sidebar';
import { PlateEditor } from '../../../components/platejs/components/editor/plate-editor';
import { usePostChangeTracking } from '../hooks/use-post-change-tracking';

// ✅ Add interfaces for rich data
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

interface BlogEditorProps {
  workspaceSlug: string;
  blogId?: string;
  initialPost?: BlogPost;
  categories: CategoryWithStats[]; // ✅ Updated type
  authors: Author[];
  allPosts: any[];
  tags: TagWithStats[]; // ✅ Updated type
  isNewPost?: boolean;
  workspaceId?: string;
}

// Autosave status type
type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function BlogEditor({
  workspaceSlug,
  blogId,
  initialPost,
  categories,
  authors,
  allPosts,
  tags,
  isNewPost = true,
  workspaceId,
}: BlogEditorProps) {
  const [post, setPost] = useState<BlogPost>({
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
    ...initialPost,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentBlogPostId, setCurrentBlogPostId] = useState<string | undefined>(initialPost?.id);
  const [editorKey, setEditorKey] = useState(0);

  // ✅ Medium-style autosave state
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUserMadeChanges = useRef<boolean>(false); // Track if user has made any changes

  // Initialize lastSavedContentRef with initial post state to prevent autosave on load
  const lastSavedContentRef = useRef<string>(
    JSON.stringify({
      title: initialPost?.title || '',
      content: initialPost?.content || '',
      description: initialPost?.description || '',
      categoryIds: initialPost?.categoryIds || [],
      tagIds: initialPost?.tagIds || [],
      authorIds: initialPost?.authorIds || [],
      featuredImage: initialPost?.featuredImage || '',
    })
  );

  // Change tracking
  const { hasChanges, revertToInitial, updateInitialState } = usePostChangeTracking({
    initialPost,
    currentPost: post,
    onRevert: (revertedPost) => {
      setPost(revertedPost);
      setEditorKey((prev) => prev + 1);
    },
  });

  // ✅ Silent autosave function (no toasts, just status updates)
  const performAutosave = useCallback(async (currentPost: BlogPost, blogPostId?: string) => {
    // Don't autosave if no blogId or workspaceId
    if (!blogId || !workspaceId) return;

    // Check if content has actually changed since last save
    const contentSnapshot = JSON.stringify({
      title: currentPost.title,
      content: currentPost.content,
      description: currentPost.description,
      categoryIds: currentPost.categoryIds,
      tagIds: currentPost.tagIds,
      authorIds: currentPost.authorIds,
      featuredImage: currentPost.featuredImage,
    });

    if (contentSnapshot === lastSavedContentRef.current) {
      return; // No changes, skip save
    }

    // Generate title if empty (like Medium's "Untitled" drafts)
    const title = currentPost.title.trim() || 'Untitled';
    const slug = generateSlug(title) || 'untitled';

    setAutosaveStatus('saving');

    try {
      const content = currentPost.content ? JSON.parse(currentPost.content) : [];

      const requestData = {
        title,
        slug,
        content,
        excerpt: currentPost.description,
        featuredImage: currentPost.featuredImage,
        tagIds: currentPost.tagIds,
        categoryIds: currentPost.categoryIds,
        metaTitle: title,
        metaDescription: currentPost.description,
        featured: false,
        pinned: false,
        scheduledFor: currentPost.publishDate,
        authorIds: currentPost.authorIds,
        workspaceId,
        pageId: blogId,
        blogPostId: blogPostId,
      };

      const response = await fetch('/api/blogs/posts/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        setAutosaveStatus('saved');
        setLastSavedAt(new Date());
        lastSavedContentRef.current = contentSnapshot;

        // Update blogPostId if this was a new post
        if (!blogPostId && result.blogPostId) {
          setCurrentBlogPostId(result.blogPostId);
        }

        // Update initial state silently
        updateInitialState(currentPost);
      } else {
        setAutosaveStatus('error');
        console.error('Autosave failed:', result.error);
      }
    } catch (error) {
      setAutosaveStatus('error');
      console.error('Autosave error:', error);
    }
  }, [blogId, workspaceId, updateInitialState]);

  // ✅ Debounced autosave effect - triggers 2 seconds after last change
  useEffect(() => {
    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Don't autosave if user hasn't made any changes yet (prevents autosave on page load)
    if (!hasUserMadeChanges.current) return;

    // Don't autosave if there's nothing to save
    const hasContent = post.title.trim() || post.content || post.description;
    if (!hasContent) return;

    // Set new timeout for autosave
    autosaveTimeoutRef.current = setTimeout(() => {
      performAutosave(post, currentBlogPostId);
    }, 2000); // 2 second debounce like Medium

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [post, currentBlogPostId, performAutosave]);

  // ✅ Reset autosave status after showing "Saved" for a bit
  useEffect(() => {
    if (autosaveStatus === 'saved') {
      const timer = setTimeout(() => {
        setAutosaveStatus('idle');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [autosaveStatus]);

  const handlePostChange = (updatedPost: BlogPost) => {
    hasUserMadeChanges.current = true; // Mark that user has made changes
    setPost(updatedPost);
  };

  const handleContentChange = (content: any[]) => {
    handlePostChange({ ...post, content: JSON.stringify(content) });
  };

  const handleTitleChange = (title: string) => {
    const slug = generateSlug(title);
    handlePostChange({ ...post, title, slug });
  };

  const handleDescriptionChange = (description: string) => {
    handlePostChange({ ...post, description });
  };

  // Manual save (Ctrl+S or button click) - keeps toast for explicit action
  const handleSave = async () => {
    if (!blogId || !workspaceId) {
      toast.error('Unable to save - missing blog or workspace');
      return;
    }

    setIsSaving(true);

    try {
      const title = post.title.trim() || 'Untitled';
      const slug = generateSlug(title) || 'untitled';
      const content = post.content ? JSON.parse(post.content) : [];

      const requestData = {
        title,
        slug,
        content,
        excerpt: post.description,
        featuredImage: post.featuredImage,
        tagIds: post.tagIds,
        categoryIds: post.categoryIds,
        metaTitle: title,
        metaDescription: post.description,
        featured: false,
        pinned: false,
        scheduledFor: post.publishDate,
        authorIds: post.authorIds,
        workspaceId,
        pageId: blogId,
        blogPostId: currentBlogPostId,
      };

      const response = await fetch('/api/blogs/posts/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Draft saved');
        setLastSavedAt(new Date());
        lastSavedContentRef.current = JSON.stringify({
          title: post.title,
          content: post.content,
          description: post.description,
          categoryIds: post.categoryIds,
          tagIds: post.tagIds,
          authorIds: post.authorIds,
          featuredImage: post.featuredImage,
        });

        if (!currentBlogPostId && result.blogPostId) {
          setCurrentBlogPostId(result.blogPostId);
        }

        updateInitialState(post);
      } else {
        toast.error(result.error || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save draft');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!post.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!post.content || post.content.trim() === '') {
      toast.error('Please add some content');
      return;
    }

    if (!blogId) {
      toast.error('Blog ID is required');
      return;
    }

    setIsPublishing(true);

    try {
      const content = JSON.parse(post.content);

      const requestData = {
        title: post.title,
        slug: post.slug,
        content,
        excerpt: post.description,
        featuredImage: post.featuredImage,
        tagIds: post.tagIds,
        categoryIds: post.categoryIds,
        metaTitle: post.title,
        metaDescription: post.description,
        featured: false,
        pinned: false,
        publishedAt: post.publishDate || new Date(),
        workspaceId,
        pageId: blogId,
        blogPostId: currentBlogPostId,
      };

      const response = await fetch('/api/blog-posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        updateInitialState(post);
        window.open(`${result.data.publicUrl}`, '_blank');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to publish blog');
      console.error('Publish error:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  // ✅ Format "last saved" time like Medium
  const getLastSavedText = () => {
    if (autosaveStatus === 'saving') return 'Saving...';
    if (autosaveStatus === 'error') return 'Save failed';
    if (autosaveStatus === 'saved') return 'Saved';
    if (lastSavedAt) {
      const now = new Date();
      const diffSeconds = Math.floor((now.getTime() - lastSavedAt.getTime()) / 1000);
      if (diffSeconds < 60) return 'Saved just now';
      if (diffSeconds < 3600) return `Saved ${Math.floor(diffSeconds / 60)}m ago`;
      return `Saved ${Math.floor(diffSeconds / 3600)}h ago`;
    }
    return '';
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <PlateEditor
            key={editorKey}
            initialValue={
              post.content
                ? typeof post.content === 'string'
                  ? JSON.parse(post.content)
                  : post.content
                : undefined
            }
            onChange={handleContentChange}
            title={post.title}
            description={post.description}
            onTitleChange={handleTitleChange}
            onDescriptionChange={handleDescriptionChange}
            placeholder="Press '/' for commands or start typing..."
            workspaceSlug={workspaceSlug}
            blogId={blogId || 'new'}
            onSave={handleSave}
            onPublish={handlePublish}
            isSaving={isSaving}
            isPublishing={isPublishing}
            blogPostId={currentBlogPostId}
            postStatus={post.status}
            workspaceId={workspaceId}
            hasChanges={hasChanges}
            onRevert={revertToInitial}
            // ✅ Pass autosave status to editor for display
            autosaveStatus={autosaveStatus}
            lastSavedText={getLastSavedText()}
          />
        </div>

        <div className="w-80 border-l border-gray-200 shrink-0">
          <BlogEditorSidebar
            post={post}
            categories={categories}
            authors={authors}
            allPosts={allPosts}
            tags={tags}
            onPostChange={handlePostChange}
            onSave={handleSave}
            onPublish={handlePublish}
            isSaving={isSaving}
            isPublishing={isPublishing}
          />
        </div>
      </div>
    </div>
  );
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
