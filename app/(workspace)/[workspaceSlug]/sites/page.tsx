'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Settings, ExternalLink, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

interface Site {
  id: string;
  name: string;
  repoFullName: string;
  gitProvider: string;
  createdAt: string;
  gitConnection: {
    provider: string;
  };
  _count: {
    pageDrafts: number;
    deployments: number;
  };
}

export default function SitesPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceSlug}/sites`
        );
        if (response.ok) {
          const data = await response.json();
          setSites(data.sites);
        }
      } catch (error) {
        console.error('Error fetching sites:', error);
        setError('Failed to load sites');
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [workspaceSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-muted-foreground">Loading sites...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-10 lg:px-10 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Sites</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your Git repositories and deploy static sites
          </p>
        </div>

        <Button asChild className="w-fit shadow-sm">
          <Link href={`/${workspaceSlug}/sites/connect`}>
            <Plus className="w-4 h-4 mr-2" />
            Connect Repository
          </Link>
        </Button>
      </div>

      {/* Empty State */}
      {sites.length === 0 ? (
  <div className="flex items-center justify-center min-h-[65vh]">
    <div className="w-full max-w-xl border rounded-xl bg-muted/30 p-10 text-center">
      
      {/* Icon */}
      <div className="w-12 h-12 mx-auto mb-4 rounded-full border bg-background flex items-center justify-center">
        <GitBranch className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold mb-2">
        No sites connected
      </h2>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        Connect your GitHub or GitLab repository to automatically build and deploy your static sites.
      </p>

      {/* CTA */}
      <Button asChild>
        <Link href={`/${workspaceSlug}/sites/connect`}>
          <Plus className="w-4 h-4 mr-2" />
          Connect your first site
        </Link>
      </Button>
    </div>
  </div>
) : (
        /* Grid */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card
              key={site.id}
              className="group transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-medium leading-tight">
                      {site.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {site.gitConnection.provider} • {site.gitProvider}
                    </CardDescription>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="opacity-0 group-hover:opacity-100 transition"
                  >
                    <Link
                      href={`/${workspaceSlug}/sites/${site.id}/settings`}
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-3 space-y-4">
                {/* Stats */}
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Pages</p>
                    <p className="font-semibold">
                      {site._count.pageDrafts}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs">
                      Deployments
                    </p>
                    <p className="font-semibold">
                      {site._count.deployments}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <Link
                      href={`/${workspaceSlug}/sites/${site.id}`}
                    >
                      Edit
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}