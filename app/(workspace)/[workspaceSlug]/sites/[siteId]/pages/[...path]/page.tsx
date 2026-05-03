'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

export default function PageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;
  const workspaceSlug = params.workspaceSlug as string;
  const path = (params.path as string[]).join('/');

  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageContent = async () => {
      try {
        const response = await fetch(`/api/sites/${siteId}/pages?path=${encodeURIComponent(path)}`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
          setOriginalContent(data.content);
        } else {
          setError('Failed to load page content');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchPageContent();
  }, [path, siteId]);

  const handleSave = async () => {
    if (content === originalContent) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/pages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content }),
      });

      if (response.ok) {
        setOriginalContent(content);
        // Show success message or something
      } else {
        setError('Failed to save changes');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = content !== originalContent;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${workspaceSlug}/sites/${siteId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Site
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Editing {path}</h1>
              <p className="text-sm text-muted-foreground">Make changes and save to create a draft</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-card border rounded-lg shadow-sm">
          <div className="p-6">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your page content..."
              className="min-h-[600px] font-mono text-sm resize-none border-0 focus:ring-0 p-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}