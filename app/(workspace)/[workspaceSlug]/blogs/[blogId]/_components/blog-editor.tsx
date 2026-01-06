'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Clock, Eye, Settings, Save } from 'lucide-react';

interface BlogEditorProps {
  page: {
    id: string;
    title: string;
    slug: string;
    type: string;
    description?: string | null;
    content: any;
    status: string;
    featuredImage?: string | null;
    readTime?: number | null;
    category?: string | null;
    publishedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: {
      name?: string | null;
      email: string;
      image?: string | null;
    };
    blogPost?: {
      tags: string[];
      categories: string[];
      authorBio?: string | null;
    } | null;
  };
  workspaceSlug: string;
}

export function BlogEditor({ page, workspaceSlug }: BlogEditorProps) {
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(
    typeof page.content === 'string'
      ? page.content
      : JSON.stringify(page.content)
  );
  const [description, setDescription] = useState(page.description || '');
  const [category, setCategory] = useState(page.category || '');
  const [tags, setTags] = useState(page.blogPost?.tags?.join(', ') || '');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not published';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                Blog Editor
              </h1>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                  page.status
                )}`}
              >
                {page.status}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title */}
            <Card>
              <CardContent className="pt-6">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your blog post title..."
                  className="text-3xl font-bold border-none p-0 focus-visible:ring-0 placeholder:text-gray-400"
                />
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a brief description of your blog post..."
                  className="min-h-[100px] resize-none"
                />
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your blog post..."
                  className="min-h-[400px] resize-none font-mono text-sm"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Rich text editor coming soon. For now, you can write in
                  Markdown or plain text.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CalendarDays className="w-4 h-4" />
                  <span>Published: {formatDate(page.publishedAt)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    Read time: {page.readTime || 'Not calculated'} min
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <Button className="w-full" variant="default">
                    {page.status === 'PUBLISHED' ? 'Update' : 'Publish'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Categories & Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Category
                  </label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Technology, Marketing"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tags
                  </label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., react, javascript, web-dev"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate tags with commas
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Author Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Author</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={page.createdBy.image || ''} />
                    <AvatarFallback>
                      {(page.createdBy.name ||
                        page.createdBy.email)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {page.createdBy.name || page.createdBy.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created {new Date(page.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Words:</span>
                  <span className="font-medium">
                    {
                      content.split(/\s+/).filter((word) => word.length > 0)
                        .length
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Characters:</span>
                  <span className="font-medium">{content.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last updated:</span>
                  <span className="font-medium">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
