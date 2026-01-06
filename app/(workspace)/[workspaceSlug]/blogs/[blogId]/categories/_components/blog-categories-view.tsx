"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

// Icons
import {
  ExternalLink,
  GripVertical,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"; // ✅ Import Plus icon

// Drag and Drop
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ✅ Use the new hooks
import {
  useCategories,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
  useCreateCategory,
} from "@/modules/blogs/hooks/use-categories";

// ✅ Import the required components
import { ConfirmationDialog } from "@/components/models/confirmation-dialog";
import { Heading } from "@/components/ui/heading";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ManageFeaturedPostsDialog } from "@/modules/blogs/components/manage-featured-posts-dialog";

// Types
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

interface BlogCategoriesViewProps {
  workspaceSlug: string;
  blogId: string;
}

// Sortable Row Component remains the same...
function SortableTableRow({
  category,
  onEdit,
  onDelete,
  workspaceSlug,
  blogId,
}: {
  category: CategoryWithStats;
  onEdit: (category: CategoryWithStats) => void;
  onDelete: (category: CategoryWithStats) => void;
  workspaceSlug: string;
  blogId: string;
}) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const [isFeaturedDialogOpen, setIsFeaturedDialogOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  const handleViewPosts = () => {
    router.push(`/${workspaceSlug}/blogs/${blogId}?category=${category.id}`);
  };

  return (
    <>
      <TableRow ref={setNodeRef} style={style} className="group">
        <TableCell className="w-14 ">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab rounded p-1 hover:bg-accent flex items-center justify-center"
          >
            <GripVertical className="h-4 w-4 text-normal-muted" />
          </div>
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/blog/${category.slug}`}
              passHref
              className="flex items-center gap-1.5 hover:underline min-w-0 max-w-full"
            >
              <span className="text-normal truncate min-w-0 max-w-full">
                {category.name}
              </span>
              <ExternalLink className="h-4 w-4 text-normal shrink-0" />
            </Link>
          </div>
        </TableCell>

        <TableCell>{category.posts}</TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-normal-muted"
              onClick={() => setIsFeaturedDialogOpen(true)}
            >
              Manage featured posts
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-normal-muted"
              onClick={handleViewPosts}
            >
              View Posts
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(category)}
              className="text-normal-muted"
            >
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4 text-normal-muted" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(category)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      <ManageFeaturedPostsDialog
        isOpen={isFeaturedDialogOpen}
        onClose={() => setIsFeaturedDialogOpen(false)}
        workspaceSlug={workspaceSlug}
        pageId={blogId}
        categoryId={category.id}
      />
    </>
  );
}

export function BlogCategoriesView({
  workspaceSlug,
  blogId,
}: BlogCategoriesViewProps) {
  // ✅ Use TanStack Query hooks
  const {
    data: categoriesData,
    isLoading,
    isFetching,
    error,
  } = useCategories(workspaceSlug, blogId);
  const updateCategoryMutation = useUpdateCategory(workspaceSlug, blogId);
  const deleteCategoryMutation = useDeleteCategory(workspaceSlug, blogId);
  const reorderCategoriesMutation = useReorderCategories(workspaceSlug, blogId);
  const createCategoryMutation = useCreateCategory(workspaceSlug, blogId);
  const queryClient = useQueryClient();

  // Local state for dialogs
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // ✅ Add state for the new category dialog to match the author page functionality
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryWithStats | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");

  const categories = categoriesData?.categories || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);

      const categoryOrders = newCategories.map((cat, index) => ({
        id: cat.id,
        order: index + 1,
      }));

      reorderCategoriesMutation.mutate(categoryOrders);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !editCategoryName.trim()) return;

    updateCategoryMutation.mutate(
      {
        categoryId: selectedCategory.id,
        data: {
          name: editCategoryName.trim(),
          description: editCategoryDescription.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
        },
      }
    );
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    console.log(
      "handleDeleteCategory: Calling delete for category",
      selectedCategory.id
    );
    deleteCategoryMutation.mutate(selectedCategory.id, {
      onSuccess: () => {
        console.log("handleDeleteCategory: onSuccess - Closing dialog");
        setIsDeleteDialogOpen(false);
        setSelectedCategory(null); // Clear selection on success
      },
    });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    createCategoryMutation.mutate(
      {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          setNewCategoryName("");
          setNewCategoryDescription("");
        },
      }
    );
  };

  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple clicks

    setIsRefreshing(true);

    try {
      // Invalidate categories query to trigger a refetch (use correct query key)
      await queryClient.invalidateQueries({
        queryKey: ['categories', workspaceSlug, blogId],
      });
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  if (error) {
    return <div>Error loading categories</div>;
  }

  return (
    <>
      <CardTitle className="text-normal ml-lg mb-sm">
        {categories.length} <span className="text-small">Categories</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          className={cn(
            "h-8 px-3 text-normal font-medium",
            "hover:bg-muted/50 transition-all duration-200 group",
            isRefreshing && "cursor-not-allowed"
          )}
        >
          <RefreshCw
            className={cn(
              "size-3 transition-transform duration-500 ease-out",
              "group-hover:rotate-45",
              (isRefreshing || loading) && "animate-spin"
            )}
          />
          Refresh
        </Button>
      </CardTitle>
      <div
        className={cn(
          "relative w-full overflow-x-auto transition-all duration-300 ease-out",
          (isRefreshing || (isFetching && !isLoading)) && "opacity-60"
        )}
      >
        {/* Subtle loading overlay */}
        {(isRefreshing || (isFetching && !isLoading)) && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-background/5 to-transparent animate-pulse" />
          </div>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-14"></TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead className="text-right min-w-[350px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* ✅ Updated "No Categories" state to match the Author page */}
              {categories.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <Heading
                        level="h3"
                        variant="default"
                        subtitle="Get started by creating your first category."
                        subtitleVariant="muted"
                      >
                        No Categories Yet
                      </Heading>
                      <Button
                        onClick={() => setIsAddDialogOpen(true)} // This state needs to be created
                        className="mt-3"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New Category
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                // Skeleton rows remain the same
                <>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={`loading-${index}`} className="group">
                      <TableCell className="w-14">
                        <div className="flex items-center justify-center">
                          <div className="h-5 w-5 rounded bg-muted animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-8 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell className="sticky right-0 bg-background">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-8 w-28 bg-muted animate-pulse rounded" />
                          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                          <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : (
                <SortableContext
                  items={categories.map((cat) => cat.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {categories.map((category) => (
                    <SortableTableRow
                      key={category.id}
                      category={category}
                      workspaceSlug={workspaceSlug}
                      blogId={blogId}
                      onEdit={(cat) => {
                        setSelectedCategory(cat);
                        setEditCategoryName(cat.name);
                        setEditCategoryDescription(cat.description || "");
                        setIsEditDialogOpen(true);
                      }}
                      onDelete={(cat) => {
                        setSelectedCategory(cat);
                        setIsDeleteDialogOpen(true);
                      }}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Edit Dialog remains the same */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-lg">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Category Name</Label>
              <Input
                id="edit-category-name"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-description">Description</Label>
              <Textarea
                id="edit-category-description"
                value={editCategoryDescription}
                onChange={(e) => setEditCategoryDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditCategory}
              disabled={updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending
                ? "Updating..."
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* ✅ Replaced the old Dialog with the ConfirmationDialog component */}
      < ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        description={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`
        }
        confirmButtonLabel="Delete Category"
        theme="danger"
        isConfirming={deleteCategoryMutation.isPending}
      />

      {/* Add Category Dialog */}
      < Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-lg">
            <div className="space-y-2">
              <Label htmlFor="new-category-name">Category Name</Label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-category-description">Description</Label>
              <Textarea
                id="new-category-description"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Brief description of this category"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewCategoryName("");
                setNewCategoryDescription("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending
                ? "Creating..."
                : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </>
  );
}
