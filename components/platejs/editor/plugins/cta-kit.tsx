'use client';

import { createPlatePlugin } from 'platejs/react';

import { CTAElement } from '@/components/platejs/ui/cta-node';

export const CtaKit = [
  createPlatePlugin({
    key: 'cta',
    node: { isElement: true },
  }).configure({
    node: { component: CTAElement },
  }),
];

