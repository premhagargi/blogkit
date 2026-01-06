'use client';

import { useParams, usePathname } from 'next/navigation';
import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
  }[];
}) {
  const params = useParams();
  const pathname = usePathname();

  // Extract workspaceSlug and blogId from current path
  const workspaceSlug = params?.workspaceSlug as string;
  const blogId = params?.blogId as string;

  // Check if we're in a blog context
  const isBlogContext = pathname.includes('/blogs/') && workspaceSlug && blogId;

  const getHref = (url: string) => {
    if (url === '#') {
      // For dashboard/main blog page
      return isBlogContext ? `/${workspaceSlug}/blogs/${blogId}` : url;
    }

    // For other routes, preserve blog context
    if (isBlogContext && !url.startsWith('/') && !url.startsWith('http')) {
      return `/${workspaceSlug}/blogs/${blogId}/${url}`;
    }

    return url;
  };

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.isActive}>
            <Link href={getHref(item.url)}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
