'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ChevronLeft,
  ChevronRight,
  Folder,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { useCtaTable, useCtaTableState } from '@/modules/blogs/hooks/use-cta-table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CtaTable = () => {
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
      EndOfPost: 'bg-blue-100 text-blue-800',
      Sidebar: 'bg-green-100 text-green-800',
      InLine: 'bg-yellow-100 text-yellow-800',
      PopUp: 'bg-purple-100 text-purple-800',
      Floating: 'bg-pink-100 text-pink-800',
    };
    return colorMap[type as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            Error loading CTAs: {error.message}
            <Button variant="outline" onClick={() => refetch()} className="ml-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>CTA Management</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={!search && type === 'all' && category === 'all' && tag === 'all'}
            >
              Clear Filters
            </Button>
            <Link
              href={`/${workspaceSlug}/blogs/${blogId}/forms-cta/cta-dashboard`}
            >
              <Button size="sm">+ New CTA</Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search CTAs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="EndOfPost">End of Post</SelectItem>
              <SelectItem value="Sidebar">Sidebar</SelectItem>
              <SelectItem value="InLine">Inline</SelectItem>
              <SelectItem value="PopUp">Pop Up</SelectItem>
              <SelectItem value="Floating">Floating</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="global">Global</SelectItem>
              {/* Categories will be populated dynamically */}
            </SelectContent>
          </Select>
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {/* Tags will be populated dynamically */}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-4">
                  <input type="checkbox" className="rounded border-gray-300" />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('name')}
                    className="font-medium p-0 h-auto hover:bg-transparent"
                  >
                    CTA Name {getSortIcon('name')}
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : tableData?.ctas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-gray-500">
                      <p className="text-lg mb-2">No CTAs found</p>
                      <p className="text-sm">
                        {search || type !== 'all' || category !== 'all' || tag !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Create your first CTA to get started'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tableData?.ctas.map((cta) => (
                  <TableRow key={cta.id}>
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{getTypeIcon(cta.type)}</span>
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
                        className={cn('text-xs', getTypeBadgeColor(cta.type))}
                        variant="secondary"
                      >
                        {cta.type.replace(/([A-Z])/g, ' $1').trim()}
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{cta.clickCount} Clicks</div>
                        <div className="text-xs text-muted-foreground">
                          {cta.conversionRate}%
                        </div>
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
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {cta.enabled ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Enable
                                </>
                              )}
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
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                Showing {Math.min((page - 1) * pageSize + 1, tableData.totalCount)} to{' '}
                {Math.min(page * pageSize, tableData.totalCount)} of {tableData.totalCount}{' '}
                CTAs
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={!tableData.hasPreviousPage}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, tableData.pageCount) }, (_, i) => {
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
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!tableData.hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CtaTable;