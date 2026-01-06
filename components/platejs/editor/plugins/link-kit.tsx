'use client';

import { LinkPlugin } from '@platejs/link/react';

import { LinkElement } from '@/components/platejs/ui/link-node';
import { LinkFloatingToolbar } from '@/components/platejs/ui/link-toolbar';
import { CustomLinkFloatingToolbar } from '../../ui/link-toolbar-custom';

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
];
