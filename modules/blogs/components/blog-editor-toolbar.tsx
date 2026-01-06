'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Eye,
  ChevronDown,
  Undo2,
  Redo2,
  MoreVertical,
  Save,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmationDialog } from '@/components/models/confirmation-dialog';
import { RotateCcw } from 'lucide-react';

interface BlogEditorToolbarProps {
  workspaceSlug?: string;
  blogId?: string;
  onSave?: () => void;
  onPublish?: () => void;
  isSaving?: boolean;
  isPublishing?: boolean;
  blogPostId?: string;
  postStatus?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  workspaceId?: string;
  hasChanges?: boolean;
  onRevert?: () => void;
  // Autosave props
  autosaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedText?: string;
}

export function BlogEditorToolbar({
  workspaceSlug,
  blogId,
  onSave,
  onPublish,
  isSaving = false,
  isPublishing = false,
  blogPostId,
  postStatus,
  workspaceId,
  hasChanges = false,
  onRevert,
  autosaveStatus = 'idle',
  lastSavedText = '',
}: BlogEditorToolbarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editor = useEditorRef();
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const [showRevertDialog, setShowRevertDialog] = useState(false);

  // Undo/Redo state
  const canUndo = useEditorSelector(
    (editor) => editor.history.undos.length > 0,
    []
  );
  const canRedo = useEditorSelector(
    (editor) => editor.history.redos.length > 0,
    []
  );

  // Calculate word count and read time from editor content
  const calculateStats = useCallback(() => {
    if (!editor) return;

    try {
      const content = editor.children;
      let text = '';

      // Extract text from editor nodes recursively
      const extractText = (nodes: any[]): string => {
        return nodes
          .map((node) => {
            if (node.text) {
              return node.text;
            }
            if (node.children) {
              return extractText(node.children);
            }
            return '';
          })
          .join(' ');
      };

      text = extractText(content);

      // Calculate word count
      const words = text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      const estimatedReadTime = Math.ceil(words / 200); // 200 words per minute

      setWordCount(words);
      setReadTime(estimatedReadTime);
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  }, [editor]);

  // Update stats when editor content changes
  useEditorSelector(
    (editor) => {
      calculateStats();
      return editor.children;
    },
    [calculateStats]
  );

  // Autosave is now handled in BlogEditor component

  const handleUndo = () => {
    if (editor && canUndo) {
      editor.undo();
    }
  };

  const handleRedo = () => {
    if (editor && canRedo) {
      editor.redo();
    }
  };

  // Get autosave status display
  const getAutosaveDisplay = () => {
    switch (autosaveStatus) {
      case 'saving':
        return {
          text: 'Saving...',
          className: 'text-gray-500',
          icon: '⟳',
        };
      case 'saved':
        return {
          text: 'Saved',
          className: 'text-green-600',
          icon: '✓',
        };
      case 'error':
        return {
          text: 'Save failed',
          className: 'text-red-600',
          icon: '✕',
        };
      default:
        if (lastSavedText) {
          return {
            text: lastSavedText,
            className: 'text-gray-400',
            icon: '',
          };
        }
        return {
          text: '',
          className: 'text-gray-400',
          icon: '',
        };
    }
  };

  const autosaveDisplay = getAutosaveDisplay();

  const getStatusDisplay = () => {
    if (!postStatus) {
      return {
        text: 'Draft',
        className: 'bg-yellow-100 text-yellow-800',
      };
    }

    // If post is published but has unsaved changes, show "Unpublished"
    if (postStatus === 'PUBLISHED' && hasChanges) {
      return {
        text: 'Unpublished',
        className: 'bg-orange-100 text-orange-800',
      };
    }

    switch (postStatus) {
      case 'PUBLISHED':
        return {
          text: 'Published',
          className: 'bg-green-100 text-green-800',
        };
      case 'DRAFT':
        return {
          text: 'Draft',
          className: 'bg-yellow-100 text-yellow-800',
        };
      case 'SCHEDULED':
        return {
          text: 'Scheduled',
          className: 'bg-blue-100 text-blue-800',
        };
      case 'ARCHIVED':
        return {
          text: 'Archived',
          className: 'bg-gray-100 text-gray-800',
        };
      default:
        return {
          text: 'Draft',
          className: 'bg-yellow-100 text-yellow-800',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  const handlePublishClick = async () => {
    if (onPublish) {
      await onPublish();
    }
  };

  const handleSaveClick = async () => {
    if (onSave) {
      console.log('Saving post');
      await onSave();
    }
  };

  const handleUnpublish = async () => {
    if (!blogPostId || !workspaceId) {
      toast.error('Post ID or workspace ID is missing');
      return;
    }

    try {
      const response = await fetch('/api/blog-posts/unpublish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogPostId,
          workspaceId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Post unpublished successfully');
        // Invalidate blog posts table queries to refresh data
        queryClient.invalidateQueries({
          queryKey: ['blog-posts-table', workspaceSlug, blogId],
        });
        // Also invalidate base queries if they exist
        queryClient.invalidateQueries({
          queryKey: ['blog-posts-base', workspaceSlug, blogId],
        });
      } else {
        toast.error(result.error || 'Failed to unpublish post');
      }
    } catch (error) {
      toast.error('Failed to unpublish post');
      console.error('Unpublish error:', error);
    }
  };

  const handleDuplicate = async () => {
    if (!blogPostId || !workspaceId || !blogId) {
      toast.error('Post ID, workspace ID, or blog ID is missing');
      return;
    }

    try {
      // Show loading toast
      toast.loading('Duplicating post...');
      const response = await fetch('/api/blog-posts/duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogPostId,
          workspaceId,
          pageId: blogId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Post duplicated successfully');
        // Invalidate blog posts table queries to refresh data
        queryClient.invalidateQueries({
          queryKey: ['blog-posts-table', workspaceSlug, blogId],
        });
        // Also invalidate base queries if they exist
        queryClient.invalidateQueries({
          queryKey: ['blog-posts-base', workspaceSlug, blogId],
        });
        //toast 
        // Redirect to the new post's edit page
        if (result.data?.blogPostId) {
          toast.success('Post duplicated successfully, redirecting to edit page');
          router.push(`/${workspaceSlug}/blogs/${blogId}/${result.data.blogPostId}/edit`);
        }
      } else {
        toast.error(result.error || 'Failed to duplicate post');
      }
    } catch (error) {
      toast.error('Failed to duplicate post');
      console.error('Duplicate error:', error);
    }
  };

  const handleDelete = async () => {
    if (!blogPostId || !workspaceId) {
      toast.error('Post ID or workspace ID is missing');
      return;
    }

    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/blog-posts/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogPostId,
          workspaceId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Post deleted successfully');
        // Invalidate blog posts table queries to refresh data
        queryClient.invalidateQueries({
          queryKey: ['blog-posts-table', workspaceSlug, blogId],
        });
        // Also invalidate base queries if they exist
        queryClient.invalidateQueries({
          queryKey: ['blog-posts-base', workspaceSlug, blogId],
        });
        // Redirect back to workspace blogs page
        router.push(`/${workspaceSlug}/blogs/${blogId}`);
      } else {
        toast.error(result.error || 'Failed to delete post');
      }
    } catch (error) {
      toast.error('Failed to delete post');
      console.error('Delete error:', error);
    }
  };

  const handleRevert = () => {
    if (onRevert) {
      onRevert();
      setShowRevertDialog(false);
      toast.success('Changes reverted to last published version');
    }
  };

  return (
    <div className=" px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900 px-2"
            onClick={() => {
              // Invalidate blog posts table queries to refresh data
              queryClient.invalidateQueries({
                queryKey: ['blog-posts-table', workspaceSlug, blogId],
              });
              // Also invalidate base queries if they exist
              queryClient.invalidateQueries({
                queryKey: ['blog-posts-base', workspaceSlug, blogId],
              });
              // Navigate back
              router.push(`/${workspaceSlug}/blogs/${blogId}`);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Go back
          </Button>
          {/* <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 px-2"
              onClick={handleSaveClick}
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button> */}
          {onRevert && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 px-2"
              onClick={() => setShowRevertDialog(true)}
              disabled={!hasChanges || isSaving || isPublishing}
              title="Revert to last published version"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Revert
            </Button>
          )}

          <div className="text-sm text-gray-500">
            {readTime} min read | {wordCount} words
          </div>

          {/* Undo/Redo buttons */}
          {/* <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 px-2"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 px-2"
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div> */}
        </div>

        {/* Center - Status indicators (Medium-style) */}
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
            {statusDisplay.text}
          </span>
          {/* Medium-style autosave indicator */}
          {autosaveDisplay.text && (
            <span className={`text-xs ${autosaveDisplay.className} flex items-center gap-1`}>
              {autosaveStatus === 'saving' && (
                <span className="animate-spin inline-block w-3 h-3 border border-gray-400 border-t-transparent rounded-full" />
              )}
              {autosaveStatus === 'saved' && (
                <span className="text-green-600">✓</span>
              )}
              {autosaveStatus === 'error' && (
                <span className="text-red-600">✕</span>
              )}
              {autosaveDisplay.text}
            </span>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>

          <DropdownMenu>
            <div className="flex items-center">
              <Button
                onClick={handlePublishClick}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-r-none border-r border-gray-700"
                size="sm"
                disabled={isSaving || isPublishing} // Update this line
              >
                {isPublishing ? 'Publishing...' : 'Publish'}
              </Button>
              <DropdownMenuTrigger asChild>
                <Button
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-l-none px-2"
                  size="sm"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleSaveClick} disabled={isSaving}>
                Save changes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleUnpublish}
                disabled={!blogPostId || postStatus !== 'PUBLISHED' || isSaving}
              >
                Unpublish
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDuplicate}
                disabled={!blogPostId || isSaving}
              >
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={!blogPostId || isSaving}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Revert Confirmation Dialog */}
      <ConfirmationDialog
        open={showRevertDialog}
        onOpenChange={setShowRevertDialog}
        onConfirm={handleRevert}
        title="Revert Changes?"
        description="Are you sure you want to revert all changes? This will restore the post to its last published version and discard all unsaved changes."
        confirmButtonLabel="Revert"
        theme="default"
      />
    </div>
  );
}
