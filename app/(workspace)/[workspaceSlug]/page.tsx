import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getWorkspaceWithPages } from "@/modules/workspace/actions/workspace-actions";
import { PageCard } from "../_components/page-card";
import { NewPageButton } from "../_components/new-page-button";

// Loading component
function PagesLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main pages content
async function PagesContent({ workspaceSlug }: { workspaceSlug: string }) {
  const workspace = await getWorkspaceWithPages(workspaceSlug);

  if (!workspace) {
    notFound();
  }

  return (
    <div className="p-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-header">My Pages</p>
        <NewPageButton workspaceSlug={workspaceSlug} />
      </div>

      {/* Pages Grid */}
      {workspace.pages.length === 0 ? (
        <div className="text-center  py-12">
          <div className=" mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No pages yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first page.
            </p>
            <NewPageButton workspaceSlug={workspaceSlug} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspace.pages.map((page) => (
            <PageCard key={page.id} page={page} workspaceSlug={workspaceSlug} />
          ))}
        </div>
      )}
    </div>
  );
}

// Main page component
export default async function WorkspacePage(props: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<PagesLoading />}>
      <PagesContent workspaceSlug={params.workspaceSlug} />
    </Suspense>
  );
}
