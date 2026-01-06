"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ChevronDown, Beef, ChevronsUpDown, Slash } from "lucide-react"; // Changed Command to Beef icon

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { WorkSpaceSwitcher } from "../../modules/workspace/components/workspace-switcher";
import Link from "next/link";
import { BlogSwitcher } from "../../modules/workspace/components/blogs-switcher";

// Interface for a breadcrumb item
interface BreadcrumbItem {
  label: string;
  href?: string;
  isDropdown?: boolean;
  dropdownItems?: Array<{
    label: string;
    href: string;
  }>;
}

export function BreadcrumbNav() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const workspaceSlug = params?.workspaceSlug as string;
  const blogId = params?.blogId as string;

  // Dynamically generate breadcrumb items based on the current URL path
  const breadcrumbItems = React.useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];

    // The first item is always the workspace switcher
    items.push({
      label: "Workspace",
      isDropdown: true,
    });

    // Add blog-related breadcrumbs if in a blog context
    if (pathname.includes("/blogs/") && blogId) {
      items.push({
        label: "Blog",
        isDropdown: true,
        dropdownItems: [
          {
            label: "Dashboard",
            href: `/${workspaceSlug}/blogs/${blogId}`,
          },
          {
            label: "Categories",
            href: `/${workspaceSlug}/blogs/${blogId}/categories`,
          },
          {
            label: "Authors",
            href: `/${workspaceSlug}/blogs/${blogId}/authors`,
          },
        ],
      });
    } else if (pathname.includes("/pages/")) {
      // Add other page-related breadcrumbs if needed
      items.push({
        label: "Pages",
        href: "#", // Replace with actual link if available
      });
    }

    return items;
  }, [pathname, blogId, workspaceSlug]);

  return (
    <nav className="flex items-center gap-[--gap-sm] text-sm ">
      {/* App Logo */}
      <Link
        href="/"
        aria-label="Home"
        className="flex items-center justify-center"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 mr-2">
          <Beef className="h-5 w-5 text-yellow-800" />
        </div>
      </Link>

      {/* Render Breadcrumb Items */}
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center gap-[--gap-sm] ">
          <Slash className="w-3 h-3 text-muted-foreground rotate-[170deg]" />

          {item.isDropdown ? (
            item.label === "Blog" ? (
              <BlogSwitcher />
            ) : (
              <WorkSpaceSwitcher />
            )
          ) : (
            // Standard breadcrumb link or text
            <Button
              variant={item.href ? "ghost" : "link"}
              size="sm"
              className="h-auto p-1 text-normal hover:bg-transparent disabled:opacity-100 "
              onClick={() => item.href && router.push(item.href)}
              disabled={!item.href}
            >
              {item.label}
            </Button>
          )}
        </div>
      ))}
    </nav>
  );
}
