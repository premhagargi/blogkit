'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, BookOpen, HelpCircle } from 'lucide-react';

interface NewPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
}

type PageType = 'BLOG' | 'HELP_DOC';

const pageTypeOptions = [
  {
    value: 'BLOG' as const,
    label: 'Blog',
    description: 'Create a blog post',
    icon: FileText,
    defaultSlug: '/blog',
    disabled: false,
  },
  {
    value: 'HELP_DOC' as const,
    label: 'Help Doc',
    description: 'Create a help documentation',
    icon: BookOpen,
    defaultSlug: '/help',
    disabled: false,
  },
  {
    value: 'CHANGELOG' as const,
    label: 'Changelog',
    description: 'Create a changelog entry',
    icon: HelpCircle,
    defaultSlug: '/changelog',
    disabled: true,
  },
  {
    value: 'HELPDESK' as const,
    label: 'Helpdesk',
    description: 'Create a helpdesk article',
    icon: HelpCircle,
    defaultSlug: '/helpdesk',
    disabled: true,
  },
];

export function NewPageDialog({
  open,
  onOpenChange,
  workspaceSlug,
}: NewPageDialogProps) {
  const [pageType, setPageType] = useState<PageType>('BLOG');
  const [slug, setSlug] = useState('/blog');
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const router = useRouter();
  const queryClient = useQueryClient();

  // Handle page type change
  const handlePageTypeChange = (value: PageType) => {
    setPageType(value);
    const selectedOption = pageTypeOptions.find(
      (option) => option.value === value
    );
    if (selectedOption) {
      setSlug(selectedOption.defaultSlug);
    }
  };

  // Handle slug change
  const handleSlugChange = (value: string) => {
    // Ensure slug starts with /
    let formattedSlug = value;
    if (!formattedSlug.startsWith('/')) {
      formattedSlug = '/' + formattedSlug;
    }
    // Remove spaces and special characters, convert to lowercase
    formattedSlug = formattedSlug
      .toLowerCase()
      .replace(/[^a-z0-9\-\/]/g, '-')
      .replace(/-+/g, '-')
      .replace(/\/-/g, '/')
      .replace(/-\//g, '/')
      .replace(/^-+|-+$/g, '');

    setSlug(formattedSlug);
  };

  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      slug: string;
      type: PageType;
      workspaceSlug: string;
    }) => {
      const response = await fetch(
        `/api/workspaces/${data.workspaceSlug}/pages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: data.title,
            slug: data.slug,
            type: data.type,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create page');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate workspace pages query
      queryClient.invalidateQueries({
        queryKey: ['workspace', workspaceSlug],
      });

      // Close dialog
      onOpenChange(false);

      // Navigate to edit page
      router.push(`/${workspaceSlug}/blogs/${data.page.id}`);
    },
    onError: (error) => {
      console.error('Error creating page:', error);
      // Handle error (could show toast here)
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !slug.trim()) {
      return;
    }

    createPageMutation.mutate({
      title: title.trim(),
      slug: slug.trim(),
      type: pageType,
      workspaceSlug,
    });
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTitle('');
      setSlug('/blog');
      setPageType('BLOG');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Page</DialogTitle>
          <DialogDescription>
            Choose the type of page you want to create and customize its
            details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Page Type Selection */}
            <div className="space-y-3">
              <Label htmlFor="pageType">Page Type</Label>
              <div className="grid grid-cols-1 gap-3">
                {pageTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div
                      key={option.value}
                      className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                        option.disabled
                          ? 'opacity-50 cursor-not-allowed bg-gray-50'
                          : pageType === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() =>
                        !option.disabled &&
                        handlePageTypeChange(option.value as PageType)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {option.label}
                            </span>
                            {option.disabled && (
                              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                                Coming Soon
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {option.description}
                          </p>
                        </div>
                        {pageType === option.value && !option.disabled && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                placeholder="Enter page title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Page URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 px-2">
                  {workspaceSlug}.blogkit.com
                </span>
                <Input
                  id="slug"
                  placeholder="/blog"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                This will be the URL path for your page
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createPageMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !title.trim() || !slug.trim() || createPageMutation.isPending
              }
            >
              {createPageMutation.isPending ? 'Creating...' : 'Create Page'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
