'use client';

import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavMain } from '@/modules/workspace/layouts/navmain';
import { NavSecondary } from '@/modules/workspace/layouts/navsecondary';
import { LucideIcon } from 'lucide-react';

// Define a type for a single navigation item
type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: NavItem[];
};

// Define a type for a sidebar section
interface SidebarSection {
  id: string;
  label?: string;
  items: NavItem[];
}

interface MainSidebarProps extends React.ComponentProps<typeof Sidebar> {
  sections?: SidebarSection[];
}

export function MainSidebar({ sections = [], ...props }: MainSidebarProps) {
  // The first section is always treated as the main navigation
  const mainSection = sections[0];
  // All other sections are treated as secondary groups with labels
  const contentSections = sections.slice(1);

  return (
    <Sidebar
      className="top-[calc(var(--header-height)-15px)] h-[calc(100svh-var(--header-height)+15px)]!"
      {...props}
    >
      <SidebarHeader>
        {mainSection && <NavMain items={mainSection.items} />}
      </SidebarHeader>
      <SidebarContent>
        {contentSections.map((section) =>
          section.label ? (
            <NavSecondary
              key={section.id}
              label={section.label}
              items={section.items}
            />
          ) : null
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}