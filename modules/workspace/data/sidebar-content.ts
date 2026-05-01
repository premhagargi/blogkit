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
  Command,
  GitBranch,
} from 'lucide-react';


export const workspaceSidebarData = [
  {
    id: 'main',
    items: [
      { title: 'Pages', url: '#', icon: Layers },
      { title: 'Sites', url: '/sites', icon: GitBranch },
      { title: 'Widgets', url: '#', icon: Home },
      { title: 'Templates', url: '#', icon: LayoutTemplate },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { title: 'Domain', url: '/settings/domain', icon: Globe },
      { title: 'Brand Settings', url: '/settings/brand-settings', icon: Settings2 },
      { title: 'Global Header', url: '/settings/global-header', icon: Box },
      { title: 'Global Footer', url: '/settings/global-footer', icon: Box },
      { title: 'Team', url: '/settings/team', icon: Users },
      { title: 'Billing', url: '/settings/billing', icon: CreditCard },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      { title: 'Help Center', url: '#', icon: HelpCircle },
      { title: 'Changelog', url: '#', icon: RefreshCw },
      { title: 'Feedback', url: '#', icon: MessageSquare },
    ],
  },
];