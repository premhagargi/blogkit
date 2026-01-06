import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import { type LucideIcon } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';

export function NavSecondary({
  items,
  label,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    badge?: React.ReactNode;
  }[];
  label: string;
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
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

    // For absolute URLs, use as-is
    if (url.startsWith('/') || url.startsWith('http')) {
      return url;
    }

    // Default fallback
    return `/${url}`;
  };

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={getHref(item.url)}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
