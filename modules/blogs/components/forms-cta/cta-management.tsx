'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ArrowUpDown,
  Folder,
  Tag,
  SortAsc,
} from 'lucide-react';
import Link from 'next/link';
import {
  useCtaTable,
  useCtaTableState,
} from '@/modules/blogs/hooks/use-cta-table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function CTAManagement() {
  const params = useParams();
  const { workspaceSlug, blogId } = params;
  const pageId = blogId as string;

  const tableState = useCtaTableState();
  const {
    page,
    pageSize,
    search,
    type,
    category,
    tag,
    sortField,
    sortDirection,
    setPage,
    setSearch,
    setType,
    setCategory,
    setTag,
    resetFilters,
    handleSort,
  } = tableState;

  const {
    data: tableData,
    isLoading,
    error,
    refetch,
  } = useCtaTable({
    pageId,
    page,
    pageSize,
    search: search || undefined,
    type: type === 'all' ? undefined : type,
    category: category === 'all' ? undefined : category,
    tag: tag === 'all' ? undefined : tag,
    sortField,
    sortDirection,
  });

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const getTypeIcon = (type: string) => {
    const iconMap = {
      EndOfPost: '📄',
      Sidebar: '📝',
      InLine: '📋',
      PopUp: '🪟',
      Floating: '💬',
    };
    return iconMap[type as keyof typeof iconMap] || '📄';
  };

  const getTypeBadgeColor = (type: string) => {
    const colorMap = {
      EndOfPost:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      Sidebar:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      InLine:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      PopUp:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      Floating: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    };
    return (
      colorMap[type as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
    );
  };

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        Error loading CTAs: {error.message}
        <Button variant="outline" onClick={() => refetch()} className="ml-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="">
      {/* Global CTA Section */}
      <div className="  rounded-lg px-4">
        <h3 className="text-lg font-medium mb-2">Global CTA</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create and edit end-of-posts. Watch tutorial (2 mins) →
        </p>
      </div>

      {/* After Content CTA Section */}
      <div className=" rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">
              After Content CTA - main page
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="after-content-enabled" defaultChecked />
              <label
                htmlFor="after-content-enabled"
                className="text-sm font-medium"
              >
                Enabled
              </label>
            </div>
            <div className="text-sm">
              <span className="font-medium text-green-600">5 clicks</span>
              <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded ml-1">
                30%
              </span>
            </div>
            <Button variant="outline" size="sm">
              Edit CTA
            </Button>
          </div>
        </div>
      </div>

      {/* Post CTA Section */}
      <div className="  rounded-lg">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Post CTA</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Create and edit end-of-posts. Watch tutorial (2 mins) →
          </p>
        </div>

        {/* CTA Count and Filters */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-medium">
              {tableData?.totalCount || 0} CTA
            </h4>
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Recent on top
              </span>
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {/* Tags will be populated dynamically */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('name')}
                    className="font-medium p-0 h-auto hover:bg-transparent"
                  >
                    Form {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('type')}
                    className="font-medium p-0 h-auto hover:bg-transparent"
                  >
                    Type {getSortIcon('type')}
                  </Button>
                </TableHead>
                <TableHead>Category / Tag</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('clickCount')}
                    className="font-medium p-0 h-auto hover:bg-transparent"
                  >
                    Clicks {getSortIcon('clickCount')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('lastModified')}
                    className="font-medium p-0 h-auto hover:bg-transparent"
                  >
                    Last Modified {getSortIcon('lastModified')}
                  </Button>
                </TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : tableData?.ctas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-gray-500">
                      <p className="text-lg mb-2">No CTAs found</p>
                      <p className="text-sm">
                        {search ||
                        type !== 'all' ||
                        category !== 'all' ||
                        tag !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Create your first CTA to get started'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tableData?.ctas.map((cta) => (
                  <TableRow key={cta.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {cta.name}
                        {cta.isGlobal && (
                          <Badge variant="secondary" className="text-xs">
                            Global
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'text-xs px-2 py-1',
                          getTypeBadgeColor(cta.type)
                        )}
                      >
                        {cta.type === 'EndOfPost'
                          ? 'End of Post'
                          : cta.type === 'InLine'
                          ? 'Inline'
                          : cta.type === 'PopUp'
                          ? 'Pop Up'
                          : cta.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cta.categories.map((cat) => (
                          <Badge
                            key={cat.id}
                            variant="outline"
                            className="text-xs flex items-center gap-1"
                          >
                            <Folder className="h-3 w-3 text-blue-500" />
                            {cat.name}
                          </Badge>
                        ))}
                        {cta.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs flex items-center gap-1"
                          >
                            <Tag className="h-3 w-3 text-green-500" />
                            {tag.name}
                          </Badge>
                        ))}
                        {cta.isGlobal &&
                          !cta.categories.length &&
                          !cta.tags.length && (
                            <Badge
                              variant="outline"
                              className="text-xs flex items-center gap-1"
                            >
                              <Folder className="h-3 w-3 text-blue-500" />
                              Global
                            </Badge>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">
                          {cta.clickCount} Clicks
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded ml-1">
                          {cta.conversionRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(cta.lastModified), 'd MMM yy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/${workspaceSlug}/blogs/${blogId}/forms-cta/cta-dashboard?ctaId=${cta.id}`}
                        >
                          <Button variant="outline" size="sm">
                            Edit CTA
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link
                              href={`/${workspaceSlug}/blogs/${blogId}/forms-cta/cta-dashboard?ctaId=${cta.id}`}
                            >
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>

                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {tableData && tableData.totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing{' '}
              {Math.min((page - 1) * pageSize + 1, tableData.totalCount)} to{' '}
              {Math.min(page * pageSize, tableData.totalCount)} of{' '}
              {tableData.totalCount} CTAs
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={!tableData.hasPreviousPage}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from(
                  { length: Math.min(5, tableData.pageCount) },
                  (_, i) => {
                    const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                    if (pageNum > tableData.pageCount) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!tableData.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
