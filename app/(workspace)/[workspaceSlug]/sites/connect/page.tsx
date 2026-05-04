'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Github, GitBranch, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession, signIn } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GitConnection {
  id: string;
  provider: string;
  providerId: string;
  createdAt: string;
}

interface Repo {
  fullName: string;
  name: string;
  defaultBranch: string;
  id: string;
}

export default function ConnectSitePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceSlug = params.workspaceSlug as string;
  const { data: session } = useSession();

  const [connections, setConnections] = useState<GitConnection[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [cfAccountId, setCfAccountId] = useState<string>('');
  const [cfApiToken, setCfApiToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'connect' | 'select-repo' | 'configure'>('connect');

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceSlug}/sites/connections`);
        if (response.ok) {
          const data = await response.json();
          setConnections(data.connections);
          if (data.connections.length === 0) {
            setStep('connect');
          } else {
            setStep('select-repo');
          }
        }
      } catch (error) {
        console.error('Error fetching connections:', error);
      }
    };

    fetchConnections();
  }, [workspaceSlug]);

   useEffect(() => {
     const oauth = searchParams.get('oauth');
     if (oauth && (session as any)?.accessToken) {
       const handleOAuthCallback = async (provider: string, token: string) => {
         try {
           const response = await fetch(`/api/workspaces/${workspaceSlug}/sites/connections`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ provider: provider.toUpperCase(), token }),
           });

           if (response.ok) {
             const data = await response.json();

             // Refresh connections list after connection is created
             const connectionsRes = await fetch(`/api/workspaces/${workspaceSlug}/sites/connections`);
             let connectionsList: any[] = [];
             if (connectionsRes.ok) {
               const connectionsData = await connectionsRes.json();
               connectionsList = connectionsData.connections;
               setConnections(connectionsList);
             }

             // Use repos returned from POST (already fetched by server)
             if (data.repos && data.repos.length > 0) {
               setRepos(data.repos);
               // Auto-select the newly created connection (first one)
               if (connectionsList.length > 0) {
                 setSelectedConnection(connectionsList[0].id);
               }
               // Show repo selection list - user must click a repo to continue
               setStep('select-repo');
             } else {
               alert('No repositories found in this account');
               setStep('connect');
             }
             // Clean URL
             router.replace(`/${workspaceSlug}/sites/connect`);
           } else {
             const error = await response.json();
             alert(error.error || 'Failed to connect');
           }
         } catch (error) {
           console.error('Error connecting:', error);
           alert('Failed to connect');
         }
       };

       handleOAuthCallback(oauth, (session as any).accessToken);
     }
   }, [searchParams, session, workspaceSlug, router]);

  const handleGitHubConnect = () => {
    signIn('github', { callbackUrl: `${window.location.href}?oauth=github` });
  };

  const handleGitLabConnect = () => {
    signIn('gitlab', { callbackUrl: `${window.location.href}?oauth=gitlab` });
  };

  const fetchRepos = async (connectionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/sites/connections/${connectionId}/repos`);
      if (response.ok) {
        const data = await response.json();
        setRepos(data.repos.map((repo: any) => ({ ...repo, id: repo.fullName })));
        setStep('configure');
      }
    } catch (error) {
      console.error('Error fetching repos:', error);
    } finally {
      setLoading(false);
    }
  };

   const handleCreateSite = async () => {
     if (!selectedConnection || !selectedRepo || !cfAccountId || !cfApiToken) return;

     setLoading(true);
     try {
       const repo = repos.find(r => r.fullName === selectedRepo);
       if (!repo) return;

       const response = await fetch(`/api/workspaces/${workspaceSlug}/sites`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           name: repo.name,
           repoFullName: repo.fullName,
           gitConnectionId: selectedConnection,
           cloudflareAccountId: cfAccountId,
           cloudflareApiToken: cfApiToken,
           defaultBranch: repo.defaultBranch,
         }),
       });

      if (response.ok) {
        const data = await response.json();
        router.push(`/${workspaceSlug}/sites/${data.site.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create site');
      }
    } catch (error) {
      console.error('Error creating site:', error);
      alert('Failed to create site');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Connect Repository</h1>
        <p className="text-muted-foreground mt-2">
          Link your Git repository to deploy static sites automatically
        </p>
      </div>

      {step === 'connect' && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Git Provider</CardTitle>
            <CardDescription>
              Choose your Git provider to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGitHubConnect}
              className="w-full"
              size="lg"
            >
              <Github className="w-5 h-5 mr-2" />
              Connect GitHub
            </Button>
            <Button
              onClick={handleGitLabConnect}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <GitBranch className="w-5 h-5 mr-2" />
              Connect GitLab
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'select-repo' && connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Repository</CardTitle>
            <CardDescription>
              Choose a repository to connect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connections.map((connection) => (
                <Button
                  key={connection.id}
                  variant={selectedConnection === connection.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedConnection(connection.id);
                    fetchRepos(connection.id);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {connection.provider === 'GITHUB' ? (
                      <Github className="w-4 h-4" />
                    ) : (
                      <GitBranch className="w-4 h-4" />
                    )}
                    <span>{connection.provider}</span>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'configure' && repos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Site</CardTitle>
            <CardDescription>
              Select a repository and configure deployment settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Repository</label>
              <div className="space-y-2">
                {repos.map((repo) => (
                  <Button
                    key={repo.id}
                    variant={selectedRepo === repo.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedRepo(repo.id)}
                  >
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-medium">{repo.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {repo.defaultBranch}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cfAccountId">Cloudflare Account ID</Label>
              <Input
                id="cfAccountId"
                value={cfAccountId}
                onChange={(e) => setCfAccountId(e.target.value)}
                placeholder="Your Cloudflare account ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cfApiToken">Cloudflare API Token</Label>
              <Input
                id="cfApiToken"
                type="password"
                value={cfApiToken}
                onChange={(e) => setCfApiToken(e.target.value)}
                placeholder="Your Cloudflare API token"
              />
            </div>

            <Button
              onClick={handleCreateSite}
              disabled={!selectedRepo || !cfAccountId || !cfApiToken || loading}
              className="w-full"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Site
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}