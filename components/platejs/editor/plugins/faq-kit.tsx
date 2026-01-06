'use client';

import { createPlatePlugin } from 'platejs/react';

import { FAQElement } from '@/components/platejs/ui/faq-node';

export const FAQKit = [
  createPlatePlugin({
    key: 'faq',
    node: { isElement: true },
  }).configure({
    node: { component: FAQElement },
  }),
];

