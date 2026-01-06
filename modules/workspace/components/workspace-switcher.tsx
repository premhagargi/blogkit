'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useUserWorkspaces,
  useCurrentWorkspace,
} from '@/modules/workspace/hooks/use-workspaces';
import { useWorkspaceStore } from '@/modules/workspace/stores/workspace-store';

export function WorkSpaceSwitcher() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;

  const { data: userWorkspaces, isLoading: workspacesLoading } =
    useUserWorkspaces();

  const { data: currentWorkspace, isLoading: currentWorkspaceLoading } =
    useCurrentWorkspace(workspaceSlug);

  const { currentWorkspace: storeCurrentWorkspace } = useWorkspaceStore();

  const handleWorkspaceSwitch = (slug: string) => {
    // if (slug !== workspaceSlug) {
    router.push(`/${slug}`);
    // }
  };

  const handleCreateWorkspace = () => {
    router.push('/onboarding');
  };

  const displayWorkspace = currentWorkspace || storeCurrentWorkspace;
  const isLoading = workspacesLoading || currentWorkspaceLoading;

  if (isLoading) {
    return (
      <div className="flex h-8 w-16 mx-2 items-center rounded-md bg-muted animate-pulse" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Replaced SidebarMenuButton with a standard Button for consistent height */}
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-normal hover:bg-transparent hover:cursor-pointer focus-visible:ring-0"
        >
          <span>{displayWorkspace?.name || 'Select Workspace'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground " />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
        align="start"
      >
        {userWorkspaces?.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onSelect={() => handleWorkspaceSwitch(workspace.slug)}
            className="cursor-pointer"
          >
            <div className="flex flex-1 items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                {workspace.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-normal ">{workspace.name}</span>
                <span className="text-small">
                  {workspace.role.toLowerCase()}
                </span>
              </div>
            </div>
            {workspace.slug === workspaceSlug && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleCreateWorkspace}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="text-normal">Create workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
