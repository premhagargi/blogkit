import React from "react";
import { getWorkspaceTeam } from "@/modules/workspace/actions/team-actions";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { InviteMemberDialog } from "./_components/invite-members-dialog";
import { TeamMembersTable } from "./_components/team-member-table";

interface TeamPageProps {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

export default async function TeamPage(props: TeamPageProps) {
  const params = await props.params;
  const teamData = await getWorkspaceTeam(params.workspaceSlug);

  if (!teamData) {
    redirect("/auth/signin");
  }

  const { workspace, currentUserRole, members, invitations } = teamData;

  // Check if user can invite (OWNER or ADMIN)
  const canInvite =
    currentUserRole && ["OWNER", "ADMIN"].includes(currentUserRole);

  return (
    <div className="">
      <div className="flex items-start justify-between p-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Team</h1>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Admin have access to all pages, widgets and global settings.</p>
            <p>
              Members have access to selected pages.{" "}
              <a href="#" className="underline hover:text-primary">
                View detailed access permission
              </a>
            </p>
          </div>
        </div>
        {canInvite && (
          <InviteMemberDialog workspaceSlug={params.workspaceSlug} />
        )}
      </div>

      {/* Team Members Table */}
      <TeamMembersTable
        members={members}
        invitations={invitations}
        currentUserRole={currentUserRole || "VIEWER"}
        workspaceSlug={params.workspaceSlug}
      />
    </div>
  );
}
