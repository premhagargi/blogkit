'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface FormData {
  id: string;
  name: string;
  type: 'EndOfPost' | 'Sidebar' | 'InLine' | 'PopUp' | 'Floating' | 'Gated';
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  categoryIds: string[]; // For filtering
  tagIds: string[];
  isGlobal: boolean;
  enabled: boolean;
  submissionCount: number;
  lastModified: string;
  createdAt: string;
  version: number;
}

export interface FormsResponse {
  forms: FormData[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FormsFilters {
  search?: string;
  type?: string;
  category?: string;
  isGlobal?: boolean;
}

export interface FormsPagination {
  page: number;
  pageSize: number;
}

export interface FormsSort {
  field: 'name' | 'lastModified' | 'submissionCount' | 'createdAt';
  direction: 'asc' | 'desc';
}

// Hook to fetch forms table data with pagination, filtering, and sorting
export function useFormsTable(
  pageId: string,
  filters: FormsFilters = {},
  sort: FormsSort = { field: 'lastModified', direction: 'desc' },
  pagination: FormsPagination = { page: 1, pageSize: 10 }
) {
  return useQuery({
    queryKey: ['forms-table', pageId, filters, sort, pagination],
    queryFn: async (): Promise<FormsResponse> => {
      const searchParams = new URLSearchParams();

      // Add pagination
      searchParams.append('page', pagination.page.toString());
      searchParams.append('pageSize', pagination.pageSize.toString());

      // Add sorting
      searchParams.append('sortField', sort.field);
      searchParams.append('sortDirection', sort.direction);

      // Add filters
      if (filters.search) searchParams.append('search', filters.search);
      if (filters.type) searchParams.append('type', filters.type);
      if (filters.category) searchParams.append('category', filters.category);
      if (filters.isGlobal !== undefined) {
        searchParams.append('isGlobal', filters.isGlobal.toString());
      }

      const response = await fetch(
        `/api/blogs/${pageId}/forms/table?${searchParams.toString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch forms table data');
      return response.json();
    },
    enabled: !!pageId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook to fetch basic forms data (for form builder/config)
export function useForms(pageId: string) {
  return useQuery({
    queryKey: ['forms', pageId],
    queryFn: async () => {
      const response = await fetch(`/api/blogs/${pageId}/forms`);
      if (!response.ok) throw new Error('Failed to fetch forms');
      const data = await response.json();
      return data.data; // Return the data object from the API response
    },
    enabled: !!pageId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook to create a new form
export function useCreateForm(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch(`/api/blogs/${pageId}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create form');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms-table', pageId] });
      queryClient.invalidateQueries({ queryKey: ['forms', pageId] });
    },
  });
}

// Hook to update a form
export function useUpdateForm(pageId: string, formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch(`/api/blogs/${pageId}/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to update form');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', pageId] });
    },
  });
}

// Hook to delete a form
export function useDeleteForm(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formId: string) => {
      const response = await fetch(`/api/blogs/${pageId}/forms/${formId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete form');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms-table', pageId] });
      queryClient.invalidateQueries({ queryKey: ['forms', pageId] });
    },
  });
}

// Hook to toggle form enabled status
export function useToggleForm(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      formId,
      enabled,
    }: {
      formId: string;
      enabled: boolean;
    }) => {
      const response = await fetch(`/api/blogs/${pageId}/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error('Failed to toggle form');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both table and basic forms queries
      queryClient.invalidateQueries({ queryKey: ['forms-table', pageId] });
      queryClient.invalidateQueries({ queryKey: ['forms', pageId] });
    },
  });
}
