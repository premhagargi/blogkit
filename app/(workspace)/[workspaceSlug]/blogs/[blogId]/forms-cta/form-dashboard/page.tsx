import MainLayout from "@/modules/blogs/components/forms-cta/form-dashboard/main-layout";

interface PageProps {
  params: Promise<{
    workspaceSlug: string;
    blogId: string;
  }>;
}

export default async function FormDashboardPage({ params }: PageProps) {
  const { workspaceSlug, blogId } = await params;

  return <MainLayout pageId={blogId} />;
}
