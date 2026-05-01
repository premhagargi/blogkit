'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileText, GitBranch, Settings, ExternalLink, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Site {
  id: string;
  name: string;
  repoFullName: string;
  defaultBranch: string;
  gitProvider: string;
  pageDrafts: Array<{
    id: string;
    path: string;
    updatedAt: string;
  }>;
  deployments: Array<{
    id: string;
    status: string;
    url: string | null;
    createdAt: string;
  }>;
  gitConnection: {
    provider: string;
  };
}

export default function SiteDashboardPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const workspaceSlug = params.workspaceSlug as string;

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    fetchSite();
  }, [siteId]);

  const fetchSite = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}`);
      if (response.ok) {
        const data = await response.json();
        setSite(data.site);
      }
    } catch (error) {
      console.error('Error fetching site:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Update pages' }),
      });
      if (response.ok) {
        // Refresh site data
        await fetchSite();
      } else {
        alert('Failed to commit changes');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setCommitting(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/deploy`, {
        method: 'POST',
      });
      if (response.ok) {
        // Refresh site data
        await fetchSite();
      } else {
        alert('Failed to deploy');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading site...</div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Site not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{site.name}</h1>
          <p className="text-muted-foreground">
            {site.gitConnection.provider} • {site.repoFullName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${workspaceSlug}/sites/${siteId}/settings`}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Site
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Pages
            </CardTitle>
            <CardDescription>
              Edit your site's pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {site.pageDrafts.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No pages detected. Connect your repository to get started.
                </p>
              ) : (
                site.pageDrafts.slice(0, 5).map((draft) => (
                  <div key={draft.id} className="flex items-center justify-between">
                    <span className="text-sm">{draft.path}</span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${workspaceSlug}/sites/${siteId}/pages/${draft.path}`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                ))
              )}
              {site.pageDrafts.length > 5 && (
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View All Pages
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Deployments
            </CardTitle>
            <CardDescription>
              Recent deployment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {site.deployments.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No deployments yet.
                </p>
              ) : (
                site.deployments.map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          deployment.status === 'SUCCESS' ? 'default' :
                          deployment.status === 'FAILED' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {deployment.status}
                      </Badge>
                      <span className="text-sm">
                        {new Date(deployment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {deployment.url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={deployment.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing your site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleCommit} disabled={committing}>
              {committing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Commit Changes
            </Button>
            <Button onClick={handleDeploy} disabled={deploying}>
              {deploying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Deploy Now
            </Button>
            <Button variant="outline" asChild>
              <a href={`https://github.com/${site?.repoFullName}`} target="_blank" rel="noopener noreferrer">
                View Repository
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}