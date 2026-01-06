'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Clock, X, Settings2, Plus, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ✅ Simplified interfaces - we still need the full data but won't show all details
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

interface TagWithStats {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  posts: number;
  traffic: number;
  leads: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPost {
  id?: string;
  title: string;
  slug?: string;
  content: any;
  description?: string;
  categoryIds: string[];
  tagIds: string[];
  authorIds: string[];
  featuredImage?: string;
  publishDate?: Date;
  relatedArticleIds: string[];
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  readTime?: number;
}

export interface Author {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface BlogEditorSidebarProps {
  post: BlogPost;
  categories: CategoryWithStats[];
  authors: Author[];
  allPosts: BlogPost[];
  tags: TagWithStats[];
  onPostChange: (post: BlogPost) => void;
  onSave: () => void;
  onPublish: () => void;
  isSaving?: boolean;
  isPublishing?: boolean;
}

type TabType = 'settings' | 'seo' | 'advanced';

export function BlogEditorSidebar({
  post,
  categories,
  authors,
  allPosts,
  tags,
  onPostChange,
  onSave,
  onPublish,
  isSaving = false,
  isPublishing = false,
}: BlogEditorSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [selectedAuthors, setSelectedAuthors] = useState<Author[]>([]);
  const [selectedRelatedArticles, setSelectedRelatedArticles] = useState<
    BlogPost[]
  >([]);
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSelectOpen, setTagSelectOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  // SEO fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  const categorySelectRef = useRef<HTMLDivElement>(null);
  const tagSelectRef = useRef<HTMLDivElement>(null);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categorySelectRef.current &&
        !categorySelectRef.current.contains(event.target as Node)
      ) {
        setCategorySelectOpen(false);
        setCategorySearch('');
      }
      if (
        tagSelectRef.current &&
        !tagSelectRef.current.contains(event.target as Node)
      ) {
        setTagSelectOpen(false);
        setTagSearch('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const postAuthors = authors.filter((author) =>
      post.authorIds.includes(author.id)
    );
    setSelectedAuthors(postAuthors);

    const relatedPosts = allPosts.filter((p) =>
      post.relatedArticleIds.includes(p.id || '')
    );
    setSelectedRelatedArticles(relatedPosts);
  }, [post.authorIds, post.relatedArticleIds, authors, allPosts]);

  const handleCategoryToggle = (categoryId: string) => {
    const isSelected = post.categoryIds.includes(categoryId);
    const newCategoryIds = isSelected
      ? post.categoryIds.filter((id) => id !== categoryId)
      : [...post.categoryIds, categoryId];

    onPostChange({ ...post, categoryIds: newCategoryIds });
  };

  const handleTagToggle = (tagId: string) => {
    const isSelected = post.tagIds.includes(tagId);
    const newTagIds = isSelected
      ? post.tagIds.filter((id) => id !== tagId)
      : [...post.tagIds, tagId];

    onPostChange({ ...post, tagIds: newTagIds });
  };

  const handleAuthorToggle = (author: Author) => {
    const isSelected = post.authorIds.includes(author.id);
    const newAuthorIds = isSelected
      ? post.authorIds.filter((id) => id !== author.id)
      : [...post.authorIds, author.id];

    onPostChange({ ...post, authorIds: newAuthorIds });
  };

  const handleRelatedArticleToggle = (article: BlogPost) => {
    const isSelected = post.relatedArticleIds.includes(article.id || '');
    const newRelatedIds = isSelected
      ? post.relatedArticleIds.filter((id) => id !== article.id)
      : [...post.relatedArticleIds, article.id || ''];

    onPostChange({ ...post, relatedArticleIds: newRelatedIds });
  };

  const handlePublishDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : undefined;
    onPostChange({ ...post, publishDate: date });
  };

  const tabs = [
    { id: 'settings', label: 'Settings' },
    { id: 'seo', label: 'SEO' },
    { id: 'advanced', label: 'Advanced' },
  ] as const;

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* ✅ Clean Category Multiselect */}
      <div>
        <Label className="text-sm font-medium text-foreground">
          Categories
        </Label>
        <div className="mt-2">
          <div className="relative" ref={categorySelectRef}>
            <div
              className="min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setCategorySelectOpen(!categorySelectOpen)}
            >
              <div className="flex flex-wrap gap-1">
                {post.categoryIds.length === 0 ? (
                  <span className="text-muted-foreground">
                    Select categories...
                  </span>
                ) : (
                  post.categoryIds.map((categoryId) => {
                    const category = categories.find(
                      (c) => c.id === categoryId
                    );
                    return category ? (
                      <Badge
                        key={category.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {category.name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategoryToggle(category.id);
                          }}
                          className="ml-1 hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })
                )}
              </div>
            </div>

            {/* Categories Dropdown */}
            {categorySelectOpen && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="p-2">
                  <Input
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="mb-2"
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="space-y-1">
                    {categories
                      .filter((category) =>
                        category.name
                          .toLowerCase()
                          .includes(categorySearch.toLowerCase())
                      )
                      .map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-2 hover:bg-accent hover:text-accent-foreground rounded cursor-pointer transition-colors"
                          onClick={() => handleCategoryToggle(category.id)}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{category.name}</span>
                          </div>
                          {post.categoryIds.includes(category.id) ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}

                    {categories.filter((category) =>
                      category.name
                        .toLowerCase()
                        .includes(categorySearch.toLowerCase())
                    ).length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-2">
                          {categorySearch
                            ? 'No categories found'
                            : 'No categories available'}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Clean Tags Multiselect */}
      <div>
        <Label className="text-sm font-medium text-foreground">Tags</Label>
        <div className="mt-2">
          <div className="relative" ref={tagSelectRef}>
            <div
              className="min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setTagSelectOpen(!tagSelectOpen)}
            >
              <div className="flex flex-wrap gap-1">
                {post.tagIds.length === 0 ? (
                  <span className="text-muted-foreground">Select tags...</span>
                ) : (
                  post.tagIds.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId);
                    return tag ? (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag.name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagToggle(tag.id);
                          }}
                          className="ml-1 hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })
                )}
              </div>
            </div>

            {/* Tags Dropdown */}
            {tagSelectOpen && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="p-2">
                  <Input
                    placeholder="Search tags..."
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    className="mb-2"
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="space-y-1">
                    {tags
                      .filter((tag) =>
                        tag.name.toLowerCase().includes(tagSearch.toLowerCase())
                      )
                      .map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between p-2 hover:bg-accent hover:text-accent-foreground rounded cursor-pointer transition-colors"
                          onClick={() => handleTagToggle(tag.id)}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{tag.name}</span>
                          </div>
                          {post.tagIds.includes(tag.id) ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}

                    {tags.filter((tag) =>
                      tag.name.toLowerCase().includes(tagSearch.toLowerCase())
                    ).length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-2">
                          {tagSearch ? 'No tags found' : 'No tags available'}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Authors - unchanged */}
      <div>
        <Label className="text-sm font-medium text-foreground">Authors</Label>
        <Select
          onValueChange={(value) => {
            const author = authors.find((a) => a.id === value);
            if (author) handleAuthorToggle(author);
          }}
        >
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select author(s)" />
          </SelectTrigger>
          <SelectContent>
            {authors.map((author) => (
              <SelectItem key={author.id} value={author.id}>
                <div className="flex items-center space-x-2">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={author.image || ''} />
                    <AvatarFallback className="text-xs">
                      {(author.name || author.email)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{author.name || author.email}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-2 space-y-2">
          {selectedAuthors.map((author) => (
            <div
              key={author.id}
              className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1"
            >
              <div className="flex items-center space-x-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={author.image || ''} />
                  <AvatarFallback className="text-xs">
                    {(author.name || author.email)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{author.name || author.email}</span>
              </div>
              <button
                onClick={() => handleAuthorToggle(author)}
                className="text-destructive hover:text-destructive/80 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Publish Date - unchanged */}
      <div>
        <Label className="text-sm font-medium text-foreground">
          Publish Date
        </Label>
        <div className="relative mt-2">
          <Input
            type="date"
            value={
              post.publishDate
                ? post.publishDate.toISOString().split('T')[0]
                : ''
            }
            onChange={handlePublishDateChange}
            className="pl-10"
          />
          <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Related Articles - unchanged */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium text-foreground">
            Related Articles
          </Label>
          <div className="flex items-center space-x-1">
            <input
              type="checkbox"
              id="auto-related"
              className="w-4 h-4 text-primary rounded border-input focus:ring-primary focus:ring-2 focus:ring-offset-2"
              defaultChecked
            />
            <label
              htmlFor="auto-related"
              className="text-xs text-muted-foreground"
            >
              Auto
            </label>
            <Settings2 className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          {allPosts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No other articles in this blog yet
            </p>
          )}

          {[1, 2, 3, 4, 5].map((num) => (
            <Select
              key={num}
              onValueChange={(value) => {
                const article = allPosts.find((p) => p.id === value);
                if (article) handleRelatedArticleToggle(article);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Article ${num}`} />
              </SelectTrigger>
              <SelectContent>
                {allPosts
                  .filter((p) => p.id !== post.id)
                  .map((article) => (
                    <SelectItem key={article.id} value={article.id || ''}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{article.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {article.status}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        {selectedRelatedArticles.length > 0 && (
          <div className="mt-3 space-y-2">
            <Label className="text-xs text-muted-foreground">
              Selected Articles:
            </Label>
            {selectedRelatedArticles.map((article, index) => (
              <div
                key={article.id}
                className="flex items-center justify-between bg-muted/50 rounded px-2 py-1"
              >
                <div>
                  <p className="text-sm font-medium">Article {index + 1}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {article.title}
                  </p>
                </div>
                <button
                  onClick={() => handleRelatedArticleToggle(article)}
                  className="text-destructive hover:text-destructive/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Section - unchanged */}
      <div>
        <Label className="text-sm font-medium text-foreground">Form</Label>
        <div className="mt-2 p-3 border border-border rounded-md text-center text-muted-foreground text-sm bg-muted/30">
          No form selected
        </div>
      </div>
    </div>
  );

  const renderSeoTab = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-foreground">SEO Title</Label>
        <Input
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
          placeholder="Enter SEO title..."
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-foreground">
          Meta Description
        </Label>
        <Textarea
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          placeholder="Enter meta description..."
          className="mt-2 min-h-[100px]"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-foreground">Keywords</Label>
        <Input
          value={seoKeywords}
          onChange={(e) => setSeoKeywords(e.target.value)}
          placeholder="Enter keywords separated by commas..."
          className="mt-2"
        />
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-foreground">
          Custom CSS
        </Label>
        <Textarea
          placeholder="Add custom CSS..."
          className="mt-2 min-h-[100px] font-mono text-sm"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-foreground">
          Custom JavaScript
        </Label>
        <Textarea
          placeholder="Add custom JavaScript..."
          className="mt-2 min-h-[100px] font-mono text-sm"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-foreground">
          Canonical URL
        </Label>
        <Input
          placeholder="https://example.com/canonical-url"
          className="mt-2"
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-primary text-foreground bg-background'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'seo' && renderSeoTab()}
        {activeTab === 'advanced' && renderAdvancedTab()}
      </div>
    </div>
  );
}
