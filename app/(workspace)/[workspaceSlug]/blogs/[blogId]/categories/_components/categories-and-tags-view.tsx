'use client';

import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Eye, EyeOff, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createCategory } from '@/modules/blogs/actions/category-actions';
import { createTag } from '@/modules/blogs/actions/tag-actions-new';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCreateCategory } from '@/modules/blogs/hooks/use-categories';
import { useCreateTag } from '@/modules/blogs/hooks/use-tags';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface CategoriesAndTagsViewProps {
  workspaceSlug: string;
  blogId: string;
  categoriesView: ReactNode;
  tagsView: ReactNode;
}

export function CategoriesAndTagsView({
  workspaceSlug,
  blogId,
  categoriesView,
  tagsView,
}: CategoriesAndTagsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>(
    'categories'
  );
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isAddTagDialogOpen, setIsAddTagDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newTagType, setNewTagType] = useState<boolean>(true); // true = public, false = private

  // ✅ Use the create mutation
  const createCategoryMutation = useCreateCategory(workspaceSlug, blogId);
  const createTagMutation = useCreateTag(workspaceSlug, blogId);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    createCategoryMutation.mutate(
      {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsAddCategoryDialogOpen(false);
          setNewCategoryName('');
          setNewCategoryDescription('');
        },
      }
    );
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
          setIsAddTagDialogOpen(false);
          setNewTagName('');
          setNewTagDescription('');
          setNewTagType(true);
        },
      }
    );
  };

  return (
    <div className="">
      {/* Header with Main Title */}
      <div className="flex items-center justify-between">
        <div className="w-full">
          <div className=" mx-auto">
            <div className="flex items-start w-full justify-between flex-col md:flex-row p-lg">
              <div className="space-y-4 ">
                {/* Tab Navigation */}
                <div className="flex items-center bg-muted p-1 rounded-lg w-fit">
                  <Button
                    variant={activeTab === 'categories' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('categories')}
                    className={`w-28 flex items-center justify-center gap-2 text-normal transition-all duration-200 rounded-md  ${
                      activeTab === 'categories'
                        ? 'bg-card shadow-sm hover:bg-card/80'
                        : 'bg-transparent hover:bg-accent cursor-pointer'
                    }`}
                  >
                    <p className="text-main">Categories</p>
                  </Button>
                  <Button
                    variant={activeTab === 'tags' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('tags')}
                    className={`w-28 flex items-center justify-center gap-2 text-normal transition-all duration-200 rounded-md ${
                      activeTab === 'tags'
                        ? 'bg-card  shadow-sm hover:bg-card'
                        : ' bg-transparent hover:bg-accent cursor-pointer'
                    }`}
                  >
                    <p className="text-main">Tags</p>
                  </Button>
                </div>
                <Heading
                  level="h1"
                  variant="default"
                  subtitleVariant="muted"
                  subtitleSize="xs"
                  subtitle={
                    <div className="">
                      <p className="text-small">
                        Organize your blog content with categories and tags
                      </p>
                      <p className="text-small">
                        to help readers find what they&apos;re looking for.
                      </p>
                    </div>
                  }
                ></Heading>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-5 md:mt-0">
                <Dialog
                  open={isAddCategoryDialogOpen}
                  onOpenChange={setIsAddCategoryDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Create New Category</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-lg">
                      <div className="space-y-2">
                        <Label htmlFor="category-name">Category Name</Label>
                        <Input
                          id="category-name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Enter category name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-description">
                          Description
                        </Label>
                        <Textarea
                          id="category-description"
                          value={newCategoryDescription}
                          onChange={(e) =>
                            setNewCategoryDescription(e.target.value)
                          }
                          placeholder="Brief description of this category"
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddCategoryDialogOpen(false);
                          setNewCategoryName('');
                          setNewCategoryDescription('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddCategory}
                        disabled={createCategoryMutation.isPending}
                      >
                        {createCategoryMutation.isPending
                          ? 'Creating...'
                          : 'Create Category'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={isAddTagDialogOpen}
                  onOpenChange={setIsAddTagDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Tag
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Create New Tag</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-lg">
                      <div className="space-y-2">
                        <Label htmlFor="tag-name">Tag Name</Label>
                        <Input
                          id="tag-name"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          placeholder="Enter tag name"
                        />
                      </div>
                      <div className="space-y-2 w-full">
                        <Label htmlFor="tag-type">Type</Label>
                        <Select value={newTagType ? 'public' : 'private'} onValueChange={(value) => setNewTagType(value === 'public')}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public"><Eye className="h-4 w-4" /> Public</SelectItem>
                            <SelectItem value="private"><EyeOff className="h-4 w-4" /> Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tag-description">Description</Label>
                        <Textarea
                          id="tag-description"
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
                          setIsAddTagDialogOpen(false);
                          setNewTagName('');
                          setNewTagDescription('');
                          setNewTagType(true);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddTag}
                        disabled={createTagMutation.isPending}
                      >
                        {createTagMutation.isPending
                          ? 'Creating...'
                          : 'Create Tag'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="">
        {activeTab === 'categories' ? categoriesView : tagsView}
      </div>
    </div>
  );
}
