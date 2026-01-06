"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, X, User, UserMinus, UserX } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  role: string;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: Date;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  invitedBy: {
    name: string | null;
    email: string;
  };
}

interface TeamMembersTableProps {
  members: TeamMember[];
  invitations: Invitation[];
  currentUserRole: string;
  workspaceSlug: string;
}

export function TeamMembersTable({
  members,
  invitations,
  currentUserRole,
  workspaceSlug,
}: TeamMembersTableProps) {
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [invitationToCancel, setInvitationToCancel] =
    useState<Invitation | null>(null);
  const [editForm, setEditForm] = useState({
    email: "",
    type: "ADMIN",
    pagesAccess: "ALL_PAGES",
  });
  const queryClient = useQueryClient();

  const canManage = ["OWNER", "ADMIN"].includes(currentUserRole);

  // Role type mapping for display
  const getRoleType = (role: string) => {
    if (role === "OWNER" || role === "ADMIN") {
      return "Admin";
    }
    return "Member";
  };

  // Pages access based on role
  const getPagesAccess = (role: string) => {
    if (role === "OWNER" || role === "ADMIN") {
      return ["All"];
    }
    // For EDITOR and VIEWER, they have access to specific page types
    return ["Blog", "Help Center"];
  };

  // Available page types from schema
  const pageTypes = [
    { value: "BLOG", label: "Blog" },
    { value: "HELP_DOC", label: "Help Doc" },
    { value: "HELPDESK", label: "Helpdesk" },
    { value: "CHANGELOG", label: "Changelog" },
    { value: "KNOWLEDGE_BASE", label: "Knowledge Base" },
    { value: "FAQ", label: "FAQ" },
  ];

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      newRole,
    }: {
      memberId: string;
      newRole: string;
    }) => {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/team/${memberId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update role");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", workspaceSlug] });
      toast.success("Member role updated successfully");
      setMemberToEdit(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/team/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove member");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", workspaceSlug] });
      toast.success("Member removed successfully");
      setMemberToRemove(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove member");
      setMemberToRemove(null);
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/team/invitations/${invitationId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel invitation");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", workspaceSlug] });
      toast.success("Invitation cancelled");
      setInvitationToCancel(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel invitation");
      setInvitationToCancel(null);
    },
  });

  const handleEditMember = (member: TeamMember) => {
    setMemberToEdit(member);
    setEditForm({
      email: member.user.email,
      type:
        member.role === "OWNER" || member.role === "ADMIN" ? "ADMIN" : "EDITOR",
      pagesAccess:
        member.role === "OWNER" || member.role === "ADMIN"
          ? "ALL_PAGES"
          : "SELECTED_PAGES",
    });
  };

  const handleSaveEdit = () => {
    if (memberToEdit) {
      updateMemberRoleMutation.mutate({
        memberId: memberToEdit.id,
        newRole: editForm.type,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Table>
          <TableHeader className="bg-accent">
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Pages with access</TableHead>
              {canManage && <TableHead className="w-[100px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Active Members */}
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.user.email}
                </TableCell>
                <TableCell>{member.user.name || "john"}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-800 border-gray-200"
                  >
                    {getRoleType(member.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {getPagesAccess(member.role).map((page, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-gray-100 text-gray-800 border-gray-200"
                      >
                        {page}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                {canManage && (
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMember(member)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove(member)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}

            {/* Pending Invitations */}
            {invitations.map((invitation) => (
              <TableRow key={invitation.id} className="opacity-60">
                <TableCell className="font-medium">
                  {invitation.email}
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-800 border-gray-200"
                  >
                    {getRoleType(invitation.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {getPagesAccess(invitation.role).map((page, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-gray-100 text-gray-800 border-gray-200"
                      >
                        {page}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                {canManage && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        Invitation Sent
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInvitationToCancel(invitation)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Team Member Dialog */}
      <Dialog open={!!memberToEdit} onOpenChange={() => setMemberToEdit(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Edit Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={editForm.type}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, type: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EDITOR">Member</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pages">Pages with access</Label>
              <Select
                value={editForm.pagesAccess}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, pagesAccess: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_PAGES">All Pages</SelectItem>
                  <SelectItem value="BLOG">Blog</SelectItem>
                  <SelectItem value="HELP_DOC">Help Doc</SelectItem>
                  <SelectItem value="HELPDESK">Helpdesk</SelectItem>
                  <SelectItem value="CHANGELOG">Changelog</SelectItem>
                  <SelectItem value="KNOWLEDGE_BASE">Knowledge Base</SelectItem>
                  <SelectItem value="FAQ">FAQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setMemberToEdit(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMemberRoleMutation.isPending}
            >
              {updateMemberRoleMutation.isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent className="sm:max-w-[380px] ">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center justify-between">
              Remove Team Member
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMemberToRemove(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the team member? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-between gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToRemove) {
                  removeMemberMutation.mutate(memberToRemove.id);
                }
              }}
            >
              Remove Member
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invitation Confirmation */}
      <AlertDialog
        open={!!invitationToCancel}
        onOpenChange={() => setInvitationToCancel(null)}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center justify-between">
              Cancel Invitation
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInvitationToCancel(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation for{" "}
              <strong>{invitationToCancel?.email}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (invitationToCancel) {
                  cancelInvitationMutation.mutate(invitationToCancel.id);
                }
              }}
              className="bg-gray-800 hover:bg-gray-900"
            >
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
