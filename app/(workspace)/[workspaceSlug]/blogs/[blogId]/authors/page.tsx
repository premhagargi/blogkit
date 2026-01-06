"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { MoreHorizontal, Plus, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heading } from "@/components/ui/heading";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AuthorDialog } from "./_components/author-dialog";

// ✅ Use the new hooks
import {
  useAuthors,
  useCreateAuthor,
  useUpdateAuthor,
  useDeleteAuthor,
} from "@/modules/blogs/hooks/use-authors";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/models/confirmation-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Author {
  id: string;
  name: string;
  bio?: string;
  image?: string;
  email?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  posts: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthorFormData {
  name: string;
  bio: string;
  email: string;
  website: string;
  image: string;
  socialLinks: Record<string, string>;
}

interface AuthorsPageProps {
  params: Promise<{
    workspaceSlug: string;
    blogId: string;
  }>;
}

export default function AuthorsPage(props: AuthorsPageProps) {
  const params = use(props.params);
  const router = useRouter();

  // ✅ Use TanStack Query hooks
  const {
    data: authorsData,
    isLoading,
    isFetching,
    error,
  } = useAuthors(params.workspaceSlug);
  const createAuthorMutation = useCreateAuthor(params.workspaceSlug);
  const updateAuthorMutation = useUpdateAuthor(params.workspaceSlug);
  const deleteAuthorMutation = useDeleteAuthor(params.workspaceSlug);

  // Local state for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const authors = authorsData?.authors || [];

  const handleAddAuthor = async (formData: AuthorFormData) => {
    createAuthorMutation.mutate(
      {
        name: formData.name.trim(),
        bio: formData.bio.trim() || undefined,
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined,
        image: formData.image.trim() || undefined,
        socialLinks:
          Object.keys(formData.socialLinks).length > 0
            ? formData.socialLinks
            : undefined,
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
        },
      }
    );
  };

  const handleEditAuthor = async (formData: AuthorFormData) => {
    if (!selectedAuthor) return;

    updateAuthorMutation.mutate(
      {
        authorId: selectedAuthor.id,
        data: {
          name: formData.name.trim(),
          bio: formData.bio.trim() || undefined,
          email: formData.email.trim() || undefined,
          website: formData.website.trim() || undefined,
          image: formData.image.trim() || undefined,
          socialLinks:
            Object.keys(formData.socialLinks).length > 0
              ? formData.socialLinks
              : undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setSelectedAuthor(null);
        },
      }
    );
  };

  const handleDeleteAuthor = async () => {
    if (!selectedAuthor) return;

    deleteAuthorMutation.mutate(selectedAuthor.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedAuthor(null);
      },
    });
  };

  const handleEditClick = (author: Author) => {
    setSelectedAuthor(author);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (author: Author) => {
    setSelectedAuthor(author);
    setIsDeleteDialogOpen(true);
  };

  const handleViewPosts = (authorId: string) => {
    router.push(`/${params.workspaceSlug}/blogs/${params.blogId}?author=${authorId}`);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple clicks

    setIsRefreshing(true);

    try {
      // Invalidate authors query to trigger a refetch (use correct query key)
      await queryClient.invalidateQueries({
        queryKey: ["authors", params.workspaceSlug],
      });
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Prepare edit data
  const editData: AuthorFormData | undefined = selectedAuthor
    ? {
      name: selectedAuthor.name,
      bio: selectedAuthor.bio || "",
      email: selectedAuthor.email || "",
      website: selectedAuthor.website || "",
      image: selectedAuthor.image || "",
      socialLinks: selectedAuthor.socialLinks || {},
    }
    : undefined;

  if (error) {
    return <div>Error loading authors</div>;
  }

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="p-lg">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-start">
          <div>
            <Heading
              level="h1"
              variant="default"
              subtitleVariant="muted"
              subtitleSize="xs"
              className="text-primary"
              subtitle={
                <p className="max-w-xl text-small">
                  Manage authors who can write and be attributed to posts.{" "}
                  <br />
                  <span className="cursor-pointer text-small hover:underline">
                    Learn more
                  </span>
                </p>
              }
            >
              <p className="text-header">Authors</p>
            </Heading>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Author
          </Button>
        </div>
      </div>

      {/* Authors Table */}
      <div>
        <CardTitle className="flex items-center justify-between ml-lg mb-sm">
          <span className="text-normal">
            {authors.length} <span className="text-small">Authors</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "text-normal-muted transition-all duration-200 group",
              isRefreshing && "cursor-not-allowed"
            )}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 transition-transform duration-500 ease-out",
                "group-hover:rotate-45",
                isRefreshing && "animate-spin"
              )}
            />
            Refresh
          </Button>
        </CardTitle>
        <Card className="p-0 shadow-none border-none">
          <CardContent
            className={cn(
              "p-0 transition-all duration-300 ease-out",
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
                <TableRow className="bg-muted">
                  <TableHead className="pl-lg">Author</TableHead>
                  <TableHead>Posts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // ✅ Skeleton rows (not complete table)
                  <>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={`loading-${index}`}>
                        <TableCell className="pl-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
                            <div className="flex items-center space-x-2">
                              <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                              <div className="h-6 w-6 bg-muted animate-pulse rounded" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-between">
                            <div className="h-5 w-8 bg-muted animate-pulse rounded" />
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                              <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : authors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                        <Heading
                          level="h3"
                          variant="default"
                          subtitle="Get started by creating your first author."
                          subtitleVariant="muted"
                        >
                          No Authors Yet
                        </Heading>
                        <Button
                          onClick={() => setIsAddDialogOpen(true)}
                          className="mt-3"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          New Author
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {authors.map((author) => (
                      <TableRow key={author.id}>
                        <TableCell className="pl-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={author.image || ""} />
                              <AvatarFallback className="text-sm">
                                {author.name[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{author.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                              >
                                <ExternalLink className="h-3 w-3 text-normal" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{author.posts}</span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-normal-muted"
                                onClick={() => handleViewPosts(author.id)}
                              >
                                View Posts
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(author as any)}
                                className="text-normal-muted"
                              >
                                Edit
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4 text-normal-muted" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      handleDeleteClick(author as any)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Author Dialog */}
      <AuthorDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddAuthor}
        isLoading={createAuthorMutation.isPending}
      />

      {/* Edit Author Dialog */}
      <AuthorDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setSelectedAuthor(null);
          }
        }}
        onSubmit={handleEditAuthor}
        initialData={editData}
        isEdit={true}
        isLoading={updateAuthorMutation.isPending}
      />

      {/* Delete Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteAuthor}
        title="Delete Author"
        description={`Are you sure you want to delete "${selectedAuthor?.name}"? This action cannot be undone. The author will be removed from all associated blog posts.`}
        confirmButtonLabel="Delete Author"
        theme="danger"
        isConfirming={deleteAuthorMutation.isPending}
      />
    </div>
  );
}
