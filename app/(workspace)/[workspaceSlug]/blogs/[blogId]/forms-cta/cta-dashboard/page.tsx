import MainLayout from "@/modules/blogs/components/forms-cta/cta-dashboard/main-layout";
import React from "react";

async function page({
  params,
}: {
  params: Promise<{ workspaceSlug: string; blogId: string }>;
}) {
  const { workspaceSlug, blogId } = await params;
  return <MainLayout pageId={blogId} />;
}

export default page;
