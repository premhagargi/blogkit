import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface CtaTableData {
  id: string;
  name: string;
  type: 'EndOfPost' | 'Sidebar' | 'InLine' | 'PopUp' | 'Floating';
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
  categoryIds: string[];
  tagIds: string[];
  isGlobal: boolean;
  enabled: boolean;
  clickCount: number;
  conversionRate: number;
  lastModified: string;
  createdAt: string;
  version: number;
}

interface TableResponse {
  ctas: CtaTableData[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UseCtaTableProps {
  pageId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  category?: string;
  tag?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const useCtaTable = ({
  pageId,
  page = 1,
  pageSize = 10,
  search,
  type,
  category,
  tag,
  sortField = 'lastModified',
  sortDirection = 'desc',
}: UseCtaTableProps) => {
  const query = useQuery({
    queryKey: [
      'cta-table',
      pageId,
      page,
      pageSize,
      search,
      type,
      category,
      tag,
      sortField,
      sortDirection,
    ],
    queryFn: async (): Promise<TableResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortField,
        sortDirection,
      });

      if (search) params.set('search', search);
      if (type && type !== 'all') params.set('type', type);
      if (category && category !== 'all') params.set('category', category);
      if (tag && tag !== 'all') params.set('tag', tag);

      const response = await fetch(`/api/blogs/${pageId}/ctas/table?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch CTA table data');
      }

      return response.json();
    },
    enabled: !!pageId,
  });

  return query;
};

// Hook for managing table state
export const useCtaTableState = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [tag, setTag] = useState('all');
  const [sortField, setSortField] = useState('lastModified');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const resetFilters = () => {
    setSearch('');
    setType('all');
    setCategory('all');
    setTag('all');
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  };

  return {
    // State
    page,
    pageSize,
    search,
    type,
    category,
    tag,
    sortField,
    sortDirection,

    // Setters
    setPage,
    setPageSize,
    setSearch,
    setType,
    setCategory,
    setTag,
    setSortField,
    setSortDirection,

    // Actions
    resetFilters,
    handleSort,
  };
};
