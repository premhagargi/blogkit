import {
  Layers,
  LayoutTemplate,
  Home,
  Settings2,
  Box,
  Users,
  CreditCard,
  HelpCircle,
  RefreshCw,
  MessageSquare,
  Gauge,
  FileText,
  FolderOpen,
  ClipboardList,
  Target,
  Palette,
  Globe,
  Puzzle,
  Hash,
  Command,
} from 'lucide-react';


export const pageManagementSidebarData = [
  {
    id: 'main',
    items: [
      { title: 'Dashboard', url: '/', icon: Gauge },
    ],
  },
  {
    id: 'post-management',
    label: 'Post Management',
    items: [
      { title: 'Posts', url: '#', icon: FileText },
      { title: 'Categories/tags', url: 'categories', icon: Hash },
      { title: 'Authors', url: 'authors', icon: Users },
      { title: 'Forms/CTA', url: 'forms-cta', icon: ClipboardList },
      { title: 'Leads', url: 'leads', icon: Target },
      { title: 'Widgets', url: 'widgets', icon: Box },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { title: 'Customization', url: '#', icon: Palette },
      { title: 'Integrations', url: '#', icon: Globe },
      { title: 'Settings', url: '#', icon: Settings2 },
    ],
  },
];