"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit2,
  Copy,
  Trash2,
  Eye,
  ExternalLink,
  Edit,
  Globe,
  EyeOff,
  Archive,
} from "lucide-react";
import Link from "next/link";
import { BlogPost } from "@/types/blog";
import { useBlogTable } from "@/modules/blogs/contexts/BlogTableContext";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/date";
import { useState, useCallback } from "react";
import { ConfirmationDialog } from "@/components/models/confirmation-dialog";
import {
  bulkDeletePosts,
  bulkPublishPosts,
  bulkUnpublishPosts,
  bulkArchivePosts,
} from "@/modules/blogs/actions/post-bulk-actions";
import { toast } from "sonner";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";

interface BlogTableRowProps {
  post: BlogPost;
  workspaceSlug: string;
}

// Type for the infinite query page structure
interface BlogPostsPage {
  success: boolean;
  blogPosts?: BlogPost[];
  error?: string;
  pagination?: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function BlogTableRow({ post, workspaceSlug }: BlogTableRowProps) {
  const { pinnedIds, togglePin, selectedIds, toggleSelection } = useBlogTable();
  const isPinned = pinnedIds.has(post.id) || post.pinned;
  const isSelected = selectedIds.has(post.id);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  // Helper to determine dynamic menu options based on status
  const isPublished = post.status === "PUBLISHED";
  const isArchived = post.status === "ARCHIVED";
  const isDraft = post.status === "DRAFT";
  const isScheduled = post.status === "SCHEDULED";

  // Optimistic update helper for status changes
  const optimisticUpdateStatus = useCallback(
    (newStatus: BlogPost["status"], additionalUpdates?: Partial<BlogPost>) => {
      // Get all query keys that might contain this post
      const infiniteQueryKey = ["blog-posts-table-infinite", workspaceSlug, post.pageId];
      const regularQueryKey = ["blog-posts-table", workspaceSlug, post.pageId];

      // Store previous data for rollback
      const previousInfiniteData = queryClient.getQueryData<InfiniteData<BlogPostsPage>>(infiniteQueryKey);

      // Optimistically update infinite query cache
      queryClient.setQueriesData<InfiniteData<BlogPostsPage>>(
        { queryKey: infiniteQueryKey, exact: false },
        (oldData) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              blogPosts: page.blogPosts?.map((p) =>
                p.id === post.id
                  ? ({
                    ...p,
                    status: newStatus,
                    updatedAt: new Date().toISOString(),
                    ...(newStatus === "PUBLISHED" && !p.publishedAt
                      ? { publishedAt: new Date().toISOString() }
                      : {}),
                    ...additionalUpdates,
                  } as BlogPost)
                  : p
              ),
            })),
          } as InfiniteData<BlogPostsPage>;
        }
      );

      // Also update regular query if it exists
      queryClient.setQueriesData(
        { queryKey: regularQueryKey, exact: false },
        (oldData: any) => {
          if (!oldData?.blogPosts) return oldData;
          return {
            ...oldData,
            blogPosts: oldData.blogPosts.map((p: BlogPost) =>
              p.id === post.id
                ? {
                  ...p,
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                  ...(newStatus === "PUBLISHED" && !p.publishedAt
                    ? { publishedAt: new Date().toISOString() }
                    : {}),
                  ...additionalUpdates,
                }
                : p
            ),
          };
        }
      );

      // Return rollback function
      return () => {
        if (previousInfiniteData) {
          queryClient.setQueryData(infiniteQueryKey, previousInfiniteData);
        }
        // Also refresh to ensure consistency
        queryClient.invalidateQueries({ queryKey: infiniteQueryKey, exact: false });
        queryClient.invalidateQueries({ queryKey: regularQueryKey, exact: false });
      };
    },
    [queryClient, workspaceSlug, post.pageId, post.id]
  );

  // Optimistic delete helper
  const optimisticDelete = useCallback(() => {
    const infiniteQueryKey = ["blog-posts-table-infinite", workspaceSlug, post.pageId];
    const regularQueryKey = ["blog-posts-table", workspaceSlug, post.pageId];

    const previousInfiniteData = queryClient.getQueryData<InfiniteData<BlogPostsPage>>(infiniteQueryKey);

    // Remove post from infinite query cache
    queryClient.setQueriesData<InfiniteData<BlogPostsPage>>(
      { queryKey: infiniteQueryKey, exact: false },
      (oldData) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            blogPosts: page.blogPosts?.filter((p) => p.id !== post.id),
            pagination: page.pagination
              ? { ...page.pagination, totalCount: page.pagination.totalCount - 1 }
              : undefined,
          })),
        };
      }
    );

    // Also update regular query
    queryClient.setQueriesData(
      { queryKey: regularQueryKey, exact: false },
      (oldData: any) => {
        if (!oldData?.blogPosts) return oldData;
        return {
          ...oldData,
          blogPosts: oldData.blogPosts.filter((p: BlogPost) => p.id !== post.id),
        };
      }
    );

    return () => {
      if (previousInfiniteData) {
        queryClient.setQueryData(infiniteQueryKey, previousInfiniteData);
      }
      queryClient.invalidateQueries({ queryKey: infiniteQueryKey, exact: false });
      queryClient.invalidateQueries({ queryKey: regularQueryKey, exact: false });
    };
  }, [queryClient, workspaceSlug, post.pageId, post.id]);

  const refreshTable = () => {
    queryClient.invalidateQueries({
      queryKey: ["blog-posts-table-infinite", workspaceSlug, post.pageId],
    });
    queryClient.invalidateQueries({
      queryKey: ["blog-posts-table", workspaceSlug, post.pageId],
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-700 border border-green-200";
      case "DRAFT":
        return "bg-gray-100 text-gray-700 border border-gray-200";
      case "SCHEDULED":
        return "bg-orange-100 text-orange-700 border border-orange-200";
      case "ARCHIVED":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "DELETED":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "Published";
      case "DRAFT":
        return "Draft";
      case "SCHEDULED":
        return "Scheduled";
      case "ARCHIVED":
        return "Archived";
      case "DELETED":
        return "Deleted";
      default:
        return status;
    }
  };

  // Calculate total authors
  const coAuthorsCount = post.coAuthorIds?.length || 0;
  const hasAuthor = !!post.author;
  const totalAuthors = (hasAuthor ? 1 : 0) + coAuthorsCount;

  const handlePublish = async () => {
    // Optimistically update to PUBLISHED status immediately
    const rollback = optimisticUpdateStatus("PUBLISHED");
    const toastId = toast.loading("Publishing post...");

    try {
      const result = await bulkPublishPosts(workspaceSlug, [post.id]);

      if (result.success) {
        toast.success(result.message || "Post published successfully", {
          id: toastId,
        });
        // Refresh to ensure server data is in sync
        refreshTable();
      } else {
        // Rollback on error
        rollback();
        toast.error(result.error || "Failed to publish post", { id: toastId });
      }
    } catch (error) {
      // Rollback on error
      rollback();
      toast.error("An unexpected error occurred", { id: toastId });
    }
  };

  const handleUnpublish = async () => {
    // Optimistically update to DRAFT status immediately
    const rollback = optimisticUpdateStatus("DRAFT");
    const toastId = toast.loading("Unpublishing post...");

    try {
      const result = await bulkUnpublishPosts(workspaceSlug, [post.id]);

      if (result.success) {
        toast.success(result.message || "Post unpublished successfully", {
          id: toastId,
        });
        refreshTable();
      } else {
        rollback();
        toast.error(result.error || "Failed to unpublish post", { id: toastId });
      }
    } catch (error) {
      rollback();
      toast.error("An unexpected error occurred", { id: toastId });
    }
  };

  const handleArchive = async () => {
    // Optimistically update to ARCHIVED status immediately
    const rollback = optimisticUpdateStatus("ARCHIVED");
    const toastId = toast.loading("Archiving post...");

    try {
      const result = await bulkArchivePosts(workspaceSlug, [post.id]);

      if (result.success) {
        toast.success(result.message || "Post archived successfully", {
          id: toastId,
        });
        refreshTable();
      } else {
        rollback();
        toast.error(result.error || "Failed to archive post", { id: toastId });
      }
    } catch (error) {
      rollback();
      toast.error("An unexpected error occurred", { id: toastId });
    }
  };

  const handleDuplicate = async () => {
    // TODO: Implement duplicate functionality
    toast.info("Duplicate functionality coming soon!");
  };

  const handleDelete = async () => {
    // Optimistically remove the post immediately
    const rollback = optimisticDelete();
    setShowDeleteConfirm(false);
    const toastId = toast.loading("Deleting post...");

    try {
      const result = await bulkDeletePosts(workspaceSlug, [post.id]);

      if (result.success) {
        toast.success(result.message || "Post deleted successfully", {
          id: toastId,
        });
        // Refresh to ensure server data is in sync
        refreshTable();
      } else {
        rollback();
        toast.error(result.error || "Failed to delete post", { id: toastId });
      }
    } catch (error) {
      rollback();
      toast.error("An unexpected error occurred", { id: toastId });
    }
  };

  return (
    <>
      <TableRow
        className={cn(
          "group hover:bg-muted/50",
          isSelected && "bg-blue-50 hover:bg-blue-50"
        )}
      >
        <TableCell className="pl-lg">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleSelection(post.id)}
            aria-label={`Select ${post.title}`}
          />
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/${workspaceSlug}/blogs/${post.pageId}/${post.id}/edit`}
              className="group inline-flex items-center gap-1 text-normal text-foreground hover:text-primary min-w-0 max-w-full"
            >
              {/* truncating span */}
              <span className="truncate min-w-0 max-w-full">{post.title}</span>

              <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              <Edit className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          </div>
        </TableCell>

        <TableCell>
          <span
            className={`inline-flex items-center rounded-xl px-2 py-0.5 text-normal ${getStatusColor(
              post.status
            )}`}
          >
            <span className="text-[8px] mr-1  leading-none">●</span>
            {getStatusLabel(post.status)}
          </span>
        </TableCell>

        <TableCell>
          {post.categories && post.categories.length > 0 ? (
            <div className="flex items-center gap-1">
              {post.categories.length > 1 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <span className="inline-flex rounded-xl border border-border bg-muted/50 px-2 py-0.5 text-normal-muted">
                        {post.categories[0].name}
                      </span>
                      {post.categories.length > 1 && (
                        <span className="text-small">
                          +{post.categories.length - 1}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    sideOffset={5}
                    className="flex flex-col gap-1 p-2 bg-popover border border-border rounded-md shadow-lg"
                  >
                    {post.categories.map((category, index) => (
                      <span key={index} className=" text-normal-muted">
                        {category.name}
                      </span>
                    ))}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="inline-flex rounded-xl border border-border bg-muted/50 px-2 py-0.5 text-normal-muted">
                  {post.categories[0].name}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground"></span>
          )}
        </TableCell>

        <TableCell>
          {post.tags && post.tags.length > 0 ? (
            <div className="flex items-center gap-1">
              {post.tags.length > 1 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <span className="inline-flex rounded-xl border border-border bg-muted/50 px-2 py-0.5 text-normal-muted">
                        {post.tags[0].name}
                      </span>
                      {post.tags.length > 1 && (
                        <span className="text-normal-muted">
                          +{post.tags.length - 1}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    sideOffset={5}
                    className="flex flex-col gap-1 p-2 bg-popover border border-border rounded-md shadow-lg"
                  >
                    {post.tags.map((tag, index) => (
                      <span key={index} className="text-normal-muted">
                        {tag.name}
                      </span>
                    ))}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="inline-flex rounded-xl border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {post.tags[0].name}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground"></span>
          )}
        </TableCell>

        <TableCell>
          <div className="flex items-center space-x-2">
            {post.author ? (
              <div className="flex items-center gap-1">
                <Avatar className="h-6 w-6 border border-border">
                  <AvatarImage src={post.author.image || ""} />
                  <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                    {post.author.name ? post.author.name[0].toUpperCase() : "A"}
                  </AvatarFallback>
                </Avatar>
                {totalAuthors > 1 && (
                  <span className="text-xs text-muted-foreground">
                    +{totalAuthors - 1}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground"></span>
            )}
          </div>
        </TableCell>

        <TableCell>
          <div className="text-xs text-muted-foreground">
            {post.publishedAt ? formatDate(post.publishedAt) : ""}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-xs text-muted-foreground">
            {formatDate(post.updatedAt)}
          </div>
        </TableCell>

        <TableCell className="text-center ">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* View Post - only show for published posts */}
              {isPublished && post.slug && (
                <DropdownMenuItem asChild>
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Post
                  </a>
                </DropdownMenuItem>
              )}

              {/* Edit Post */}
              <DropdownMenuItem asChild>
                <Link
                  href={`/${workspaceSlug}/blogs/${post.pageId}/${post.id}/edit`}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Post
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Publish - show for drafts and archived posts */}
              {(isDraft || isArchived) && (
                <DropdownMenuItem onClick={handlePublish}>
                  <Globe className="mr-2 h-4 w-4" />
                  Publish
                </DropdownMenuItem>
              )}

              {/* Unpublish - show for published posts */}
              {isPublished && (
                <DropdownMenuItem onClick={handleUnpublish}>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Unpublish
                </DropdownMenuItem>
              )}

              {/* Archive - show when not already archived */}
              {!isArchived && (
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}

              {/* Duplicate */}
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Delete */}
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Post"
        description={`Are you sure you want to delete "${post.title}"? This action cannot be undone.`}
        confirmButtonLabel="Delete Post"
        theme="danger"
        isConfirming={false}
      />
    </>
  );
}

