"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface InviteMemberDialogProps {
  workspaceSlug: string;
}

export function InviteMemberDialog({ workspaceSlug }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [type, setType] = useState("ADMIN");
  const [pagesAccess, setPagesAccess] = useState("ALL_PAGES");
  const queryClient = useQueryClient();

  const roleTypes = [
    { value: "ADMIN", label: "Admin" },
    { value: "EDITOR", label: "Member" },
    { value: "VIEWER", label: "Viewer" },
  ];

  const pageTypes = [
    { value: "ALL_PAGES", label: "All Pages" },
    { value: "BLOG", label: "Blog" },
    { value: "HELP_DOC", label: "Help Doc" },
    { value: "HELPDESK", label: "Helpdesk" },
    { value: "CHANGELOG", label: "Changelog" },
    { value: "KNOWLEDGE_BASE", label: "Knowledge Base" },
    { value: "FAQ", label: "FAQ" },
  ];

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/team/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitation");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", workspaceSlug] });
      toast.success("Invitation sent successfully");
      setOpen(false);
      setEmail("");
      setType("ADMIN");
      setPagesAccess("ALL_PAGES");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitation");
    },
  });

  const handleInvite = () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    inviteMutation.mutate({ email: email.trim(), role: type });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black text-white hover:bg-gray-800">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Add Team Member
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInvite();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleTypes.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pages">Pages with access</Label>
            <Select value={pagesAccess} onValueChange={setPagesAccess}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageTypes.map((page) => (
                  <SelectItem key={page.value} value={page.value}>
                    {page.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={inviteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={inviteMutation.isPending || !email.trim()}
          >
            {inviteMutation.isPending ? "Sending..." : "Invite Member"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
