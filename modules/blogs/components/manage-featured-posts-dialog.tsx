"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronDown,
  GripVertical,
  X,
  ExternalLink,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { useBlogFilterOptions } from "@/modules/blogs/hooks/use-blog-filter-options";
import { useBlogPostsTable } from "@/modules/blogs/hooks/use-blog-posts-table";
import {
  getFeaturedPosts,
  updateFeaturedPosts,
} from "@/modules/blogs/actions/featured-posts-actions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ManageFeaturedPostsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  pageId: string;
  categoryId?: string;
}

interface FeaturedPost {
  id: string;
  title: string;
  slug: string;
  order: number;
}

interface SortablePostItemProps {
  post: FeaturedPost;
  onRemove: (postId: string) => void;
}

function SortablePostItem({ post, onRemove }: SortablePostItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-3 py-2 border-b last:border-0 bg-white min-w-0",
        isDragging && "opacity-50 z-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <span className="font-medium text-sm truncate block">{post.title}</span>
      </div>

      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(post.id)}
        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ManageFeaturedPostsDialog({
  isOpen,
  onClose,
  workspaceSlug,
  pageId,
  categoryId,
}: ManageFeaturedPostsDialogProps) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryId || "global"
  );
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { categories } = useBlogFilterOptions(workspaceSlug, pageId);

  // Build filters - include category filter based on categoryId prop or selectedCategory
  const filters = useMemo(() => {
    const filterObj: { search?: string; categories?: string[] } = {};
    if (searchQuery) {
      filterObj.search = searchQuery;
    }
    // Use categoryId prop if provided, otherwise use selectedCategory (if not "global")
    const categoryToFilter = categoryId || (selectedCategory !== "global" ? selectedCategory : undefined);
    if (categoryToFilter) {
      filterObj.categories = [categoryToFilter];
    }
    return Object.keys(filterObj).length > 0 ? filterObj : undefined;
  }, [searchQuery, categoryId, selectedCategory]);

  const { data: postsData } = useBlogPostsTable({
    workspaceSlug,
    blogId: pageId,
    filters,
    pagination: { page: 1, pageSize: 50 },
  });

  // Get current featured posts for selected category
  const { data: featuredData } = useQuery({
    queryKey: ["featured-posts", workspaceSlug, pageId, selectedCategory],
    queryFn: () => getFeaturedPosts(workspaceSlug, pageId, selectedCategory),
    enabled: isOpen && !!selectedCategory,
  });

  // Update featured posts mutation
  const updateMutation = useMutation({
    mutationFn: (data: { categoryId: string; postIds: string[] }) =>
      updateFeaturedPosts(workspaceSlug, pageId, data.categoryId, data.postIds),
    onSuccess: () => {
      toast.success("Featured posts updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["featured-posts"] });
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update featured posts");
      console.error("Featured posts update error:", error);
    },
  });

  // Initialize selectedCategory when categoryId prop changes
  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
  }, [categoryId]);

  useEffect(() => {
    if (featuredData?.featuredPosts) {
      setFeaturedPosts(featuredData.featuredPosts);
    } else {
      setFeaturedPosts([]);
    }
  }, [featuredData, selectedCategory]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Category options for dropdown
  const categoryOptions = useMemo(() => {
    const options = [{ id: "global", name: "Global" }];
    if (categories) {
      options.push(
        ...categories.map((cat) => ({ id: cat.id, name: cat.name }))
      );
    }
    return options;
  }, [categories]);

  const availablePosts = useMemo(() => {
    if (!postsData?.success || !postsData.blogPosts) return [];

    return postsData.blogPosts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
    }));
  }, [postsData]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = featuredPosts.findIndex((p) => p.id === active.id);
      const newIndex = featuredPosts.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedPosts = arrayMove(featuredPosts, oldIndex, newIndex);

        const updatedPosts = reorderedPosts.map((post, index) => ({
          ...post,
          order: index,
        }));
        setFeaturedPosts(updatedPosts);
      }
    }
  };

  const handleAddPost = (postId: string) => {
    const post = availablePosts.find((p) => p.id === postId);
    if (post && featuredPosts.length < 4) {
      const isAlreadyFeatured = featuredPosts.some((fp) => fp.id === postId);
      if (!isAlreadyFeatured) {
        const newPost: FeaturedPost = {
          ...post,
          order: featuredPosts.length,
        };
        setFeaturedPosts((prev) => [...prev, newPost]);
      }
      setSearchQuery("");
      setIsSelectOpen(false);
    }
  };

  const handleRemovePost = (postId: string) => {
    setFeaturedPosts((prev) =>
      prev
        .filter((p) => p.id !== postId)
        .map((post, index) => ({ ...post, order: index }))
    );
  };

  const handleSave = () => {
    const postIds = featuredPosts.map((p) => p.id);
    updateMutation.mutate({
      categoryId: selectedCategory,
      postIds,
    });
  };

  const selectedCategoryName =
    categoryOptions.find((c) => c.id === selectedCategory)?.name || "Global";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[500px] max-w-[95vw] overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Manage Featured Post</DialogTitle>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Select up to 4 posts to feature for{" "}
              {selectedCategoryName.toLowerCase()}.
            </p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Category Selection - Hide if categoryId is provided */}
          {!categoryId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Featured Posts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Featured Posts</label>
              <span className="text-xs text-muted-foreground">
                ({featuredPosts.length} / 4 selected)
              </span>
            </div>

            {/* Post Selection */}
            {featuredPosts.length < 4 && (
              <Popover open={isSelectOpen} onOpenChange={setIsSelectOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-muted-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Search or select posts...
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={4}
                  className="p-0 max-w-none w-[var(--radix-popover-trigger-width)]"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                >
                  <Command>
                    <CommandInput
                      placeholder="Search posts..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandEmpty>No posts found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {availablePosts
                          .filter(
                            (post) =>
                              !featuredPosts.some((fp) => fp.id === post.id)
                          )
                          .map((post) => (
                            <CommandItem
                              key={post.id}
                              onSelect={() => handleAddPost(post.id)}
                              className="w-full cursor-pointer px-3 py-2 border-b last:border-0"
                            >
                              <span className="truncate">{post.title}</span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}

            {/* Featured Posts List */}
            <div className="border rounded-lg overflow-hidden">
              {featuredPosts.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={featuredPosts.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {featuredPosts.map((post) => (
                      <SortablePostItem
                        key={post.id}
                        post={post}
                        onRemove={handleRemovePost}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No featured posts selected for {selectedCategoryName}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
