"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { InputWithSuffix, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/header";

export default function OnboardingPage() {
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceAddress, setWorkspaceAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();
  const router = useRouter();

  const handleCreateWorkspace = async () => {
    if (!workspaceName || !workspaceAddress) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/workspaces/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: workspaceName,
          slug: workspaceAddress,
          description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Something went wrong");
        return;
      }

      const data = await response.json();
      // Redirect to the specific workspace that was created
      router.push(`/${data.workspace.slug}`);
    } catch (error) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug) return;

    try {
      const response = await fetch(`/api/workspaces/check-slug?slug=${slug}`);
      const data = await response.json();

      if (!data.available) {
        setError("The name is already taken.");
      } else {
        setError("");
      }
    } catch (error) {
      console.error("Error checking slug:", error);
    }
  };

  const handleWorkspaceAddressChange = (value: string) => {
    // Only allow letters and numbers
    const cleanValue = value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    setWorkspaceAddress(cleanValue);

    if (cleanValue) {
      checkSlugAvailability(cleanValue);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Main Section */}
      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="border-none shadow-none w-full max-w-[450px]">
          <CardHeader>
            <h1 className="text-2xl font-bold text-primary">
              Create Workspace
            </h1>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Workspace Name */}
            <label
              htmlFor="workspaceName"
              className="text-normal text-gray-800"
            >
              Workspace Name*
            </label>
            <Input
              id="workspaceName"
              type="text"
              className="w-full"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />

            {/* Workspace Address */}
            <label
              htmlFor="workspaceAddress"
              className="text-normal text-gray-800"
            >
              Workspace Address*
            </label>
            <InputWithSuffix
              id="workspaceAddress"
              type="text"
              value={workspaceAddress}
              onChange={(e) => handleWorkspaceAddressChange(e.target.value)}
              suffix=".blogkit.test"
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="description"
                className="text-normal text-gray-800"
              >
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Create Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleCreateWorkspace}
                disabled={
                  !workspaceName || !workspaceAddress || loading || !!error
                }
                className="bg-black text-white rounded-md hover:bg-gray-800 flex items-center w-fit px-8"
              >
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    Create Workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
