"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

// ✅ Use the new hooks instead of direct actions
import {
  useTags,
  useUpdateTag,
  useDeleteTag,
  useCreateTag,
} from "@/modules/blogs/hooks/use-tags";

// ✅ Import the ConfirmationDialog and Heading components
import { ConfirmationDialog } from "@/components/models/confirmation-dialog";
import { Heading } from "@/components/ui/heading";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectValue,
  SelectItem,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";

// Types
interface TagWithStats {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  workspaceId: string;
  pageId: string;
  posts: number;
  isPublic: boolean;
  traffic: number;
  leads: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BlogTagsViewProps {
  workspaceSlug: string;
  blogId: string;
}

// Tag Table Row Component (no drag and drop)
function TagTableRow({
  tag,
  onEdit,
  onDelete,
  workspaceSlug,
  blogId,
}: {
  tag: TagWithStats;
  onEdit: (tag: TagWithStats) => void;
  onDelete: (tag: TagWithStats) => void;
  workspaceSlug: string;
  blogId: string;
}) {
  const router = useRouter();

  return (
    <TableRow className="group">
      <TableCell className="font-medium pl-lg max-w-[200px]">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/blog/tags/${tag.slug}`}
            passHref
            className="flex items-center gap-1.5 hover:underline min-w-0 max-w-full"
          >
            <span className="text-normal truncate min-w-0 max-w-full">
              {tag.name}
            </span>
          </Link>
        </div>
      </TableCell>

      <TableCell className="text-center min-w-[160px] w-[160px]">
        {tag.isPublic ? (
          <div className="border-2 rounded-full flex items-center gap-1 px-2 py-1 w-fit">
            <Eye className="h-4 w-4" /> Public
          </div>
        ) : (
          <div className="border-2 rounded-full flex items-center gap-1 px-2 py-1 w-fit">
            <EyeOff className="h-4 w-4" /> Private
          </div>
        )}
      </TableCell>

      <TableCell className="min-w-[120px] w-[120px]">{tag.posts}</TableCell>

      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-normal-muted"
            onClick={() => router.push(`/${workspaceSlug}/blogs/${blogId}?tag=${tag.id}`)}
          >
            View Posts
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(tag)}
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
                onClick={() => onDelete(tag)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function BlogTagsView({ workspaceSlug, blogId }: BlogTagsViewProps) {
  // ✅ Use TanStack Query hooks
  const { data: tagsData, isLoading, isFetching, error } = useTags(workspaceSlug, blogId);
  const updateTagMutation = useUpdateTag(workspaceSlug, blogId);
  const deleteTagMutation = useDeleteTag(workspaceSlug, blogId);
  const createTagMutation = useCreateTag(workspaceSlug, blogId);
  const queryClient = useQueryClient();
  // Local state for dialogs
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // ✅ Add state for the new tag dialog to enable the "New Tag" button
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagWithStats | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagDescription, setEditTagDescription] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editTagType, setEditTagType] = useState(true);
  const [newTagName, setNewTagName] = useState("");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [newTagType, setNewTagType] = useState<boolean>(true); // true = public, false = private
  const tags = tagsData?.tags || [];

  const handleEditTag = async () => {
    if (!selectedTag || !editTagName.trim()) return;

    updateTagMutation.mutate(
      {
        tagId: selectedTag.id,
        data: {
          name: editTagName.trim(),
          description: editTagDescription.trim() || undefined,
          isPublic: editTagType,
        },
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
        },
      }
    );
  };

  const handleDeleteTag = async () => {
    if (!selectedTag) return;

    deleteTagMutation.mutate(selectedTag.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        // ✅ Clear the selected tag after deletion to avoid stale data
        setSelectedTag(null);
      },
    });
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    createTagMutation.mutate(
      {
        name: newTagName.trim(),
        description: newTagDescription.trim() || undefined,
        isPublic: newTagType,
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          setNewTagName("");
          setNewTagDescription("");
          setNewTagType(true);
        },
      }
    );
  };

  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple clicks

    setIsRefreshing(true);

    try {
      // Invalidate tags query to trigger a refetch (use correct query key)
      await queryClient.invalidateQueries({
        queryKey: ["tags", workspaceSlug, blogId],
      });
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  if (error) {
    return <div>Error loading tags</div>;
  }

  return (
    <>
      <CardTitle className="text-sm ml-lg mb-sm text-normal">
        {tags.length} <span className="text-small">Tags</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 px-3 text-normal font-medium hover:bg-muted/50 transition-all duration-200 group disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`h-4 w-4 transition-transform duration-500 ease-out group-hover:rotate-45 ${isRefreshing ? "animate-spin" : ""
              }`}
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
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="pl-lg w-fit">Tag</TableHead>
              <TableHead className="min-w-[150px]">Type</TableHead>
              <TableHead className="min-w-[100px]">Posts</TableHead>
              <TableHead className="text-right min-w-[350px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* ✅ Updated "No Tags" state to provide a better user experience */}
            {tags.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Heading
                      level="h3"
                      variant="default"
                      subtitle="Get started by creating your first tag."
                      subtitleVariant="muted"
                    >
                      No Tags Yet
                    </Heading>
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="mt-3"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Tag
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              // Skeleton rows
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`loading-${index}`} className="group">
                    <TableCell className="pl-lg">
                      <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-8 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell className="sticky right-0 bg-background">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : (
              <>
                {tags.map((tag) => (
                  <TagTableRow
                    key={tag.id}
                    tag={tag}
                    workspaceSlug={workspaceSlug}
                    blogId={blogId}
                    onEdit={(t) => {
                      setSelectedTag(t);
                      setEditTagName(t.name);
                      setEditTagType(t.isPublic);
                      setEditTagDescription(t.description || "");
                      setIsEditDialogOpen(true);
                    }}
                    onDelete={(t) => {
                      setSelectedTag(t);
                      setIsDeleteDialogOpen(true);
                    }}
                  />
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog (No changes here) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tag-name">Tag Name</Label>
              <Input
                id="edit-tag-name"
                value={editTagName}
                onChange={(e) => setEditTagName(e.target.value)}
              />
            </div>
            <div className="space-y-2 w-full">
              <Label htmlFor="edit-tag-name">Type</Label>
              <Select
                defaultValue={editTagType ? "public" : "private"}
                value={editTagType ? "public" : "private"}
                onValueChange={(value) =>
                  setEditTagType(value == "public" ? true : false)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <Eye className="h-4 w-4" /> Public
                  </SelectItem>
                  <SelectItem value="private">
                    <EyeOff className="h-4 w-4" /> Private
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tag-description">Description</Label>
              <Textarea
                id="edit-tag-description"
                value={editTagDescription}
                onChange={(e) => setEditTagDescription(e.target.value)}
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
              onClick={handleEditTag}
              disabled={updateTagMutation.isPending}
            >
              {updateTagMutation.isPending ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Replaced the old Dialog with the more consistent ConfirmationDialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteTag}
        title="Delete Tag"
        description={`Are you sure you want to delete "${selectedTag?.name}"? This action cannot be undone.`}
        confirmButtonLabel="Delete Tag"
        theme="danger"
        isConfirming={deleteTagMutation.isPending}
      />

      {/* Add Tag Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-lg">
            <div className="space-y-2">
              <Label htmlFor="new-tag-name">Tag Name</Label>
              <Input
                id="new-tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
            <div className="space-y-2 w-full">
              <Label htmlFor="new-tag-type">Type</Label>
              <Select
                value={newTagType ? "public" : "private"}
                onValueChange={(value) => setNewTagType(value === "public")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <Eye className="h-4 w-4" /> Public
                  </SelectItem>
                  <SelectItem value="private">
                    <EyeOff className="h-4 w-4" /> Private
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-tag-description">Description</Label>
              <Textarea
                id="new-tag-description"
                value={newTagDescription}
                onChange={(e) => setNewTagDescription(e.target.value)}
                placeholder="Brief description of this tag"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewTagName("");
                setNewTagDescription("");
                setNewTagType(true);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTag}
              disabled={createTagMutation.isPending}
            >
              {createTagMutation.isPending ? "Creating..." : "Create Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

