'use client';

import { createPlatePlugin } from 'platejs/react';

import { CustomButtonElement } from '@/components/platejs/ui/button-plugin';

export const ButtonKit = [
  createPlatePlugin({
    key: 'button',
    node: { isElement: true },
  }).configure({
    node: { component: CustomButtonElement },
  }),
];