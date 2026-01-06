"use client";
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  SortAsc,
  Plus,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Folder,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useFormsTable,
  useForms,
  useToggleForm,
  useDeleteForm,
  FormData,
  FormsFilters,
  FormsSort,
  FormsPagination,
} from "@/modules/blogs/hooks/use-forms";
import { useBlogFilterOptions } from "@/modules/blogs/hooks/use-blog-filter-options";
import { format } from "date-fns";
import { toast } from "sonner";

const FORM_TYPE_CONFIG = {
  EndOfPost: {
    label: "End of Post",

    color: "bg-blue-100 text-blue-800",
  },
  Sidebar: {
    label: "Sidebar",

    color: "bg-green-100 text-green-800",
  },
  InLine: {
    label: "In Line",
    icon: "📄",
    color: "bg-purple-100 text-purple-800",
  },
  PopUp: {
    label: "Pop Up",

    color: "bg-orange-100 text-orange-800",
  },
  Floating: {
    label: "Floating",

    color: "bg-pink-100 text-pink-800",
  },
  Gated: { label: "Gated", color: "bg-red-100 text-red-800" },
};

const SORT_OPTIONS = [
  { value: "lastModified-desc", label: "Recent on top" },
  { value: "lastModified-asc", label: "Oldest on top" },
  { value: "submissionCount-desc", label: "Leads - Higher to Lower" },
  { value: "submissionCount-asc", label: "Leads - Lower to Higher" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
];

interface FormTableData {
  id: string;
  name: string;
  type: "EndOfPost" | "Sidebar" | "InLine" | "PopUp" | "Floating" | "Gated";
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
  submissionCount: number;
  lastModified: string;
  createdAt: string;
  version: number;
}

export default function FormManagement() {
  const params = useParams();
  const { workspaceSlug, blogId } = params;

  const [filters, setFilters] = useState<FormsFilters>({});
  const [sort, setSort] = useState<FormsSort>({
    field: "lastModified",
    direction: "desc",
  });
  const [pagination, setPagination] = useState<FormsPagination>({
    page: 1,
    pageSize: 10,
  });

  const {
    data: tableData,
    isLoading,
    error,
    refetch,
  } = useFormsTable(blogId as string, filters, sort, pagination);
  const { data: formsData } = useForms(blogId as string);
  const { categories } = useBlogFilterOptions(
    workspaceSlug as string,
    blogId as string
  );

  const toggleFormMutation = useToggleForm(blogId as string);
  const deleteFormMutation = useDeleteForm(blogId as string);

  const globalForms = useMemo(
    () =>
      formsData?.forms?.filter(
        (f: any) =>
          (f.categoryIds || []).includes("global") || f.categoryId === "global"
      ) || [],
    [formsData?.forms]
  );

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search: search || undefined }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key: keyof FormsFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (sortValue: string) => {
    const [field, direction] = sortValue.split("-") as [
      FormsSort["field"],
      FormsSort["direction"]
    ];
    setSort({ field, direction });
  };

  const handleToggleForm = async (formId: string, enabled: boolean) => {
    try {
      await toggleFormMutation.mutateAsync({ formId, enabled });
      toast.success(`Form ${enabled ? "enabled" : "disabled"} successfully`);
    } catch (error) {
      toast.error("Failed to update form status");
    }
  };

  const handleDeleteForm = async (formId: string, formName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${formName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteFormMutation.mutateAsync(formId);
      toast.success("Form deleted successfully");
    } catch (error) {
      toast.error("Failed to delete form");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">Failed to load forms</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Global Forms</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create and edit all global posts. Watch tutorial (2 mins) →
          </p>
        </CardHeader>
        <CardContent>
          {globalForms.length > 0 ? (
            <div className="space-y-3">
              {globalForms.map((form: any) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {FORM_TYPE_CONFIG[form.config?.formType]?.icon}
                    </span>
                    <div>
                      <h3 className="font-medium">{form.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        Global
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      0 Leads
                      <Badge variant="outline" className="ml-2">
                        New
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(form.updatedAt), "dd MMM yy")}
                    </div>
                    <Switch
                      checked={form.enabled}
                      onCheckedChange={(enabled) =>
                        handleToggleForm(form.id, enabled)
                      }
                      disabled={toggleFormMutation.isPending}
                    />
                    <span className="text-sm text-green-600">
                      {form.enabled ? "Enabled" : "Disabled"}
                    </span>
                    <Link
                      href={`/${workspaceSlug}/blogs/${blogId}/forms-cta/form-dashboard?formId=${form.id}`}
                    >
                      <Button variant="outline" size="sm">
                        Edit Form
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No global forms created yet.</p>
              <Link
                href={`/${workspaceSlug}/blogs/${blogId}/forms-cta/form-dashboard`}
              >
                <Button variant="outline" className="mt-2">
                  Create Global Form
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <div className="grid gap-2">
            <div>
              <CardTitle className="text-lg">Post Forms</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create and edit all post forms. Watch tutorial (3 mins) →
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-9 w-64"
                  value={filters.search || ""}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) => handleFilterChange("type", value)}
              >
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Type</SelectItem>
                  {Object.entries(FORM_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.category || "all"}
                onValueChange={(value) => handleFilterChange("category", value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Category</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={`${sort.field}-${sort.direction}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-48">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading forms...
            </div>
          ) : tableData && tableData.forms.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category / Tag</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.forms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell>
                        <div className="font-medium">{form.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={FORM_TYPE_CONFIG[form.type]?.color}>
                            {FORM_TYPE_CONFIG[form.type]?.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {form.isGlobal ? (
                            <Badge variant="secondary">Global</Badge>
                          ) : (
                            <>
                              {(() => {
                                const allItems = [
                                  ...(form.categories?.map((cat) => ({
                                    ...cat,
                                    type: "category",
                                  })) || []),
                                  ...(form.tags?.map((tag) => ({
                                    ...tag,
                                    type: "tag",
                                  })) || []),
                                ];

                                const visibleItems = allItems.slice(0, 2);
                                const remainingCount = allItems.length - 2;

                                return (
                                  <>
                                    {visibleItems.map((item) => (
                                      <Badge
                                        key={`${item.type}-${item.id}`}
                                        variant="outline"
                                        className={
                                          item.type === "category"
                                            ? "bg-blue-50 text-blue-700"
                                            : "bg-green-50 text-green-700"
                                        }
                                      >
                                        {item.type === "category" ? (
                                          <Folder className="h-3 w-3 mr-1" />
                                        ) : (
                                          <Tag className="h-3 w-3 mr-1" />
                                        )}
                                        {item.name}
                                      </Badge>
                                    ))}
                                    {remainingCount > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="bg-gray-50 text-gray-700"
                                      >
                                        +{remainingCount} more
                                      </Badge>
                                    )}
                                    {allItems.length === 0 && (
                                      <span className="text-sm text-muted-foreground">
                                        No categories or tags
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {form.submissionCount} Leads
                          {form.submissionCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(form.lastModified), "dd MMM yy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link
                              href={`/${workspaceSlug}/blogs/${blogId}/forms-cta/form-dashboard?formId=${form.id}`}
                            >
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Form
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDeleteForm(form.id, form.name)
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {tableData.totalCount > pagination.pageSize && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.pageSize,
                      tableData.totalCount
                    )}{" "}
                    of {tableData.totalCount} forms
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!tableData.hasPreviousPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {tableData.pageCount}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!tableData.hasNextPage}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No forms found matching your criteria.</p>
              <Link
                href={`/${workspaceSlug}/blogs/${blogId}/forms-cta/form-dashboard`}
              >
                <Button variant="outline" className="mt-2">
                  Create Your First Form
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
