'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getWorkspaceCategoriesWithStats,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '../actions/category-actions';

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

interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface ReorderData {
  id: string;
  order: number;
}

// Main hook for categories query
export function useCategories(workspaceSlug: string, blogId: string) {
  return useQuery({
    queryKey: ['categories', workspaceSlug, blogId],
    queryFn: () => getWorkspaceCategoriesWithStats(workspaceSlug, blogId),
    enabled: !!(workspaceSlug && blogId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if we have cached data
  });
}

// Hook for creating categories
export function useCreateCategory(workspaceSlug: string, blogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryData) =>
      createCategory(workspaceSlug, blogId, data),

    onError: () => {
      toast.error('Failed to create category');
    },

    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ['categories', workspaceSlug, blogId],
      });
      toast.success('Category created successfully!');
    },
  });
}

// Hook for updating categories
export function useUpdateCategory(workspaceSlug: string, blogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: UpdateCategoryData;
    }) => updateCategory(workspaceSlug, categoryId, data),

    onError: () => {
      toast.error('Failed to update category');
    },

    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ['categories', workspaceSlug, blogId],
      });
      toast.success('Category updated successfully!');
    },
  });
}

// Hook for deleting categories
export function useDeleteCategory(workspaceSlug: string, blogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) =>
      deleteCategory(workspaceSlug, categoryId),

    onError: () => {
      toast.error('Failed to delete category');
    },

    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ['categories', workspaceSlug, blogId],
      });
      toast.success('Category deleted successfully!');
    },
  });
}

// Hook for reordering categories with optimistic updates
export function useReorderCategories(workspaceSlug: string, blogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reorderData: ReorderData[]) =>
      reorderCategories(workspaceSlug, reorderData),

    // Optimistic update for instant UI feedback
    onMutate: async (reorderData) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: ['categories', workspaceSlug, blogId],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<{
        workspaceId: string;
        categories: CategoryWithStats[];
      }>(['categories', workspaceSlug, blogId]);

      // Optimistically update the cache with the new order
      if (previousData) {
        const reorderMap = new Map(
          reorderData.map((item) => [item.id, item.order])
        );

        const optimisticCategories = [...previousData.categories].sort(
          (a, b) => {
            const orderA = reorderMap.get(a.id) ?? 0;
            const orderB = reorderMap.get(b.id) ?? 0;
            return orderA - orderB;
          }
        );

        queryClient.setQueryData(['categories', workspaceSlug, blogId], {
          ...previousData,
          categories: optimisticCategories,
        });
      }

      // Return context with the previous data for rollback
      return { previousData };
    },

    onError: (_error, _variables, context) => {
      // Rollback to the previous value on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['categories', workspaceSlug, blogId],
          context.previousData
        );
      }
      toast.error('Failed to reorder categories');
    },

    onSettled: () => {
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries({
        queryKey: ['categories', workspaceSlug, blogId],
      });
    },
  });
}
