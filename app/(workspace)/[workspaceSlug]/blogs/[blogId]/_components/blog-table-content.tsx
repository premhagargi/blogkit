"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BlogTableRow } from "./blog-table-row";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Archive,
  Eye,
  EyeOff,
  Hash,
  Tag,
  User,
  ChevronDown,
} from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { useRouter } from "next/navigation";
import { BlogPost } from "@/types/blog";
import { BlogPostSort } from "@/modules/blogs/actions/blog-table-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { useBlogTable } from "@/modules/blogs/contexts/BlogTableContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  bulkPublishPosts,
  bulkUnpublishPosts,
  bulkUpdateCategories,
  bulkUpdateTags,
  bulkUpdateAuthors,
  bulkDeletePosts,
  bulkArchivePosts,
} from "@/modules/blogs/actions/post-bulk-actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmationDialog } from "@/components/models/confirmation-dialog";
import { Separator } from "@/components/ui/separator";
import { useBlogFilterOptions } from "@/modules/blogs/hooks/use-blog-filter-options";
import { motion, AnimatePresence } from "framer-motion";
import { CategorySelectionView } from "@/modules/blogs/components/table/blogs/category-selection-dialog";
import { TagSelectionView } from "@/modules/blogs/components/table/blogs/tag-selection-dialog";
import { AuthorSelectionView } from "@/modules/blogs/components/table/blogs/author-selection-dialog";
import { StatusSelectionView } from "@/modules/blogs/components/table/blogs/status-selection-dialog";
import { PostTableSkeleton } from "@/components/skeleton/table-skeleton";

interface BlogTableContentProps {
  posts: BlogPost[];
  workspaceSlug: string;
  currentPageId: string;
  loading?: boolean;
  onSort?: (field: BlogPostSort["field"]) => void;
  sortConfig?: BlogPostSort;
}

function SortableHeader({
  children,
  field,
  sortConfig,
  className = "",
}: {
  children: React.ReactNode;
  field: BlogPostSort["field"];
  sortConfig?: BlogPostSort;
  className?: string;
}) {
  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium hover:bg-transparent !px-0"
      >
        <span>{children}</span>
      </Button>
    </TableHead>
  );
}

type BulkActionView = "main" | "category" | "tag" | "author" | "status";

function BulkActions({
  selectedCount,
  selectedIds,
  onClearSelection,
  workspaceSlug,
  currentPageId,
}: {
  selectedCount: number;
  selectedIds: Set<string>;
  onClearSelection: () => void;
  workspaceSlug: string;
  currentPageId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [view, setView] = useState<BulkActionView>("main");

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>([]);

  const {
    categories: categoryOptions,
    tags: tagOptions,
    authors: authorOptions,
    isLoading: dataLoading,
  } = useBlogFilterOptions(workspaceSlug, currentPageId);

  const queryClient = useQueryClient();
  const selectedPostIds = Array.from(selectedIds);

  useEffect(() => {
    if (!isMenuOpen) {
      setTimeout(() => {
        setView("main");
      }, 300); // Reset view after closing animation
    }
  }, [isMenuOpen]);

  const refreshTable = () => {
    queryClient.invalidateQueries({
      queryKey: ["blog-posts-table-infinite", workspaceSlug, currentPageId],
    });
    queryClient.invalidateQueries({
      queryKey: ["workspace-categories", workspaceSlug, currentPageId],
    });
    queryClient.invalidateQueries({
      queryKey: ["workspace-tags", workspaceSlug, currentPageId],
    });
    queryClient.invalidateQueries({
      queryKey: ["workspace-authors", workspaceSlug],
    });
  };

  const handleBulkAction = async (
    action: () => Promise<any>,
    loadingMessage: string
  ) => {
    setIsMenuOpen(false);
    setIsLoading(true);
    const toastId = toast.loading(loadingMessage);

    try {
      const result = await action();
      if (result.success) {
        toast.success(result.message || "Action completed successfully", {
          id: toastId,
        });
        onClearSelection();
        refreshTable();
      } else {
        toast.error(result.error || "Action failed", { id: toastId });
      }
    } catch (error) {
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handlePublish = () =>
    handleBulkAction(
      () => bulkPublishPosts(workspaceSlug, selectedPostIds),
      "Publishing posts..."
    );
  const handleUnpublish = () =>
    handleBulkAction(
      () => bulkUnpublishPosts(workspaceSlug, selectedPostIds),
      "Unpublishing posts..."
    );
  const handleArchive = () =>
    handleBulkAction(
      () => bulkArchivePosts(workspaceSlug, selectedPostIds),
      "Archiving posts..."
    );
  const confirmDelete = () =>
    handleBulkAction(
      () => bulkDeletePosts(workspaceSlug, selectedPostIds),
      "Deleting posts..."
    );
  const handleCategoryUpdate = () =>
    handleBulkAction(
      () =>
        bulkUpdateCategories(
          workspaceSlug,
          selectedPostIds,
          selectedCategoryIds
        ),
      "Updating categories..."
    );
  const handleTagUpdate = () =>
    handleBulkAction(
      () => bulkUpdateTags(workspaceSlug, selectedPostIds, selectedTagIds),
      "Updating tags..."
    );
  const handleAuthorUpdate = () =>
    handleBulkAction(
      () =>
        bulkUpdateAuthors(workspaceSlug, selectedPostIds, selectedAuthorIds),
      "Updating authors..."
    );

  const handleBack = () => {
    setView("main");
  };

  const mainView = (
    <div className="p-1">
      <p className="px-3 py-1.5 text-sm font-semibold text-muted-foreground">
        Actions
      </p>
      <Button
        variant="ghost"
        className="w-full text-normal justify-start h-8 px-2"
        onClick={() => setView("status")}
      >
        <Eye className="mr-2 h-4 w-4" />
        Change Status
      </Button>
      <Button
        variant="ghost"
        className="w-full text-normal justify-start h-8 px-2"
        onClick={() => setView("category")}
      >
        <Hash className="mr-2 h-4 w-4" />
        Change Category
      </Button>
      <Button
        variant="ghost"
        className="w-full text-normal justify-start h-8 px-2"
        onClick={() => setView("tag")}
      >
        <Tag className="mr-2 h-4 w-4" />
        Change Tag
      </Button>
      <Button
        variant="ghost"
        className="w-full text-normal justify-start h-8 px-2"
        onClick={() => setView("author")}
      >
        <User className="mr-2 h-4 w-4" />
        Change Author
      </Button>
      <Separator className="my-1" />
      <Button
        variant="ghost"
        className="w-full text-normal justify-start h-8 px-2"
        onClick={handleArchive}
      >
        <Archive className="mr-2 h-4 w-4" />
        Archive Posts
      </Button>
      <Button
        variant="ghost"
        className="w-full text-normal justify-start h-8 px-2 text-red-600 hover:text-red-700 focus:text-red-700"
        onClick={() => {
          setIsMenuOpen(false);
          setShowDeleteConfirm(true);
        }}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Posts
      </Button>
    </div>
  );

  return (
    <>
      <div className="relative ml-[15vw]">
        <div
          className={cn(
            "absolute bottom-full w-full origin-bottom rounded-xl bg-white shadow-xl ring-[1px] ring-black/10 z-10 mb-2 overflow-hidden transition-all duration-300 ease-in-out",
            isMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          <div className="relative">
            {/* Main View */}
            <div
              className="transition-transform duration-300 ease-in-out"
              style={{
                transform:
                  view === "main" ? "translateX(0%)" : "translateX(-100%)",
              }}
            >
              {mainView}
            </div>
            {/* Status View */}
            <div
              className="absolute top-0 left-0 w-full transition-transform duration-300 ease-in-out"
              style={{
                transform:
                  view === "status" ? "translateX(0)" : "translateX(100%)",
              }}
            >
              {/* Update the props passed to StatusSelectionView */}
              <StatusSelectionView
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
                onBack={handleBack}
              />
            </div>

            {/* Category View */}
            <div
              className="absolute top-0 left-0 w-full transition-transform duration-300 ease-in-out"
              style={{
                transform:
                  view === "category" ? "translateX(0)" : "translateX(100%)",
              }}
            >
              <CategorySelectionView
                options={categoryOptions}
                loading={dataLoading}
                selectedIds={selectedCategoryIds}
                setSelectedIds={setSelectedCategoryIds}
                onSave={handleCategoryUpdate}
                onBack={handleBack}
              />
            </div>

            {/* Tag View */}
            <div
              className="absolute top-0 left-0 w-full transition-transform duration-300 ease-in-out"
              style={{
                transform:
                  view === "tag" ? "translateX(0)" : "translateX(100%)",
              }}
            >
              <TagSelectionView
                options={tagOptions}
                loading={dataLoading}
                selectedIds={selectedTagIds}
                setSelectedIds={setSelectedTagIds}
                onSave={handleTagUpdate}
                onBack={handleBack}
              />
            </div>

            {/* Author View */}
            <div
              className="absolute top-0 left-0 w-full transition-transform duration-300 ease-in-out"
              style={{
                transform:
                  view === "author" ? "translateX(0)" : "translateX(100%)",
              }}
            >
              <AuthorSelectionView
                options={authorOptions}
                loading={dataLoading}
                selectedIds={selectedAuthorIds}
                setSelectedIds={setSelectedAuthorIds}
                onSave={handleAuthorUpdate}
                onBack={handleBack}
              />
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-10 !px-6 bg-white shadow-xl rounded-full flex items-center gap-3"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          disabled={isLoading}
        >
          <span className="font-semibold text-primary">
            {selectedCount} post{selectedCount > 1 ? "s" : ""} selected
          </span>
          <div className="h-5 border-l border-gray-300"></div>
          <span className="font-medium">Actions</span>
          <ChevronDown
            className={cn(
              "ml-1 h-4 w-4 transition-transform",
              isMenuOpen && "rotate-180"
            )}
          />
        </Button>
      </div>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDelete}
        title={`Delete ${selectedCount} post${selectedCount > 1 ? "s" : ""}?`}
        description="This action cannot be undone. This will permanently delete the selected posts."
        confirmButtonLabel="Delete"
        theme="danger"
        isConfirming={isLoading}
      />
    </>
  );
}

export function BlogTableContent({
  posts,
  workspaceSlug,
  currentPageId,
  loading = false,
  onSort,
  sortConfig,
}: BlogTableContentProps) {
  const router = useRouter();
  const {
    selectedIds,
    selectAll,
    clearSelection,
    isAllSelected,
    isIndeterminate,
  } = useBlogTable();

  const newPage = () => {
    router.push(`/${workspaceSlug}/blogs/${currentPageId}/new`);
  };

  const allPostIds = posts.map((post) => post.id);
  const selectedCount = selectedIds.size;

  const [isAnimating, setIsAnimating] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const show = selectedCount > 0;
    if (show) {
      setIsRendered(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsRendered(false), 300);
    }
  }, [selectedCount]);

  return (
    <div className="overflow-hidden">
      <div className="relative overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12 pl-lg">
                <Checkbox
                  checked={isAllSelected(allPostIds)}
                  ref={(el: any) => {
                    if (el) el.indeterminate = isIndeterminate(allPostIds);
                  }}
                  onCheckedChange={() => selectAll(allPostIds)}
                  aria-label="Select all posts"
                  disabled={loading}
                />
              </TableHead>
              <SortableHeader
                field="title"
                sortConfig={sortConfig}
                className="min-w-[300px] w-[20%]"
              >
                Posts
              </SortableHeader>
              <SortableHeader field="status" sortConfig={sortConfig}>
                Status
              </SortableHeader>
              <TableHead>Category</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead className="sticky right-0 w-12  text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <PostTableSkeleton row={5} />
            ) : posts.length === 0 ? (
              <TableRow>
                <td colSpan={9} className="text-center py-12">
                  <div className="mx-auto">
                    <Heading
                      level="h3"
                      variant="default"
                      subtitle="Get started by creating your first blog post."
                      subtitleVariant="muted"
                    >
                      No blog posts found
                    </Heading>
                    <Button onClick={newPage} className="mt-3">
                      <Plus className="mr-2 h-4 w-4" />
                      New Post
                    </Button>
                  </div>
                </td>
              </TableRow>
            ) : (
              posts.map((post) => (
                <BlogTableRow
                  key={post.id}
                  post={post}
                  workspaceSlug={workspaceSlug}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isRendered && (
        <div
          className={cn(
            "fixed bottom-20 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ease-in-out",
            isAnimating
              ? "translate-y-0 opacity-100"
              : "translate-y-20 opacity-0"
          )}
        >
          <BulkActions
            selectedCount={selectedCount}
            selectedIds={selectedIds}
            onClearSelection={clearSelection}
            workspaceSlug={workspaceSlug}
            currentPageId={currentPageId}
          />
        </div>
      )}
    </div>
  );
}
