'use client';

import * as React from 'react';

import type { Alignment } from '@platejs/basic-styles';
import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { TextAlignPlugin } from '@platejs/basic-styles/react';
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from 'lucide-react';
import { useEditorPlugin, useEditorSelector, useSelectionFragmentProp } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from './toolbar';
import { TElement } from 'platejs';
import { BUTTON_ALIGNMENT_VARIANTS } from './button-plugin';
import { useEditorRef } from 'platejs/react';

const BUTTON_ALIGNMENT_ENTRIES = [
  {
    icon: AlignLeftIcon,
    value: 'left',
  },
  {
    icon: AlignCenterIcon,
    value: 'center',
  },
  {
    icon: AlignRightIcon,
    value: 'right',
  },
];

function isButtonAlignment(value: unknown): value is string {
  return typeof value === 'string' && Object.keys(BUTTON_ALIGNMENT_VARIANTS).includes(value);
}

export function AlignToolbarButton(props: any) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const buttonEntry = useEditorSelector(
    (editor) =>
      editor.api.above<TElement>({
        match: { type: 'button' },
      }),
    []
  );

  const buttonNode = buttonEntry?.[0] as Record<string, unknown> | undefined;
  const DEFAULT_BUTTON_ALIGNMENT = 'left';
  const buttonAlignment = React.useMemo(() =>  inferButtonAlignment(buttonNode), [buttonNode]);
    
    function inferButtonAlignment(node?: Record<string, unknown>): string {
      if (!node) return 'left';

      const value = node?.buttonAlignment;
      if (isButtonAlignment(value)) {
        return value;
      }

      return DEFAULT_BUTTON_ALIGNMENT;
    }

    const setButtonProps = React.useCallback(
      (updates: Record<string, unknown>) => {
        const entry = editor.api.above<TElement>({
          match: { type: 'button' },
        });

        if (!entry) return;
  
        const [node, path] = entry;
  
        const nextEntries = Object.entries(updates).filter(([key, updatedValue]) => {
          return (node as any)?.[key] !== updatedValue;
        });
  
        if (!nextEntries.length) return;
  
        const next = Object.fromEntries(nextEntries);
        editor.tf.setNodes(next, { at: path });
        editor.tf.focus();
      },
      [editor]
    );

    const handleValueChange = React.useCallback((value: string) => {
      if (!BUTTON_ALIGNMENT_VARIANTS[value as keyof typeof BUTTON_ALIGNMENT_VARIANTS]) return;

      setButtonProps({ buttonAlignment: value });
      console.log("value", value);
    }, [setButtonProps]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Align" isDropdown>
          {
            BUTTON_ALIGNMENT_VARIANTS[buttonAlignment as keyof typeof BUTTON_ALIGNMENT_VARIANTS]?.alignment === 'left' ? <AlignLeftIcon /> :
            BUTTON_ALIGNMENT_VARIANTS[buttonAlignment as keyof typeof BUTTON_ALIGNMENT_VARIANTS]?.alignment === 'center' ? <AlignCenterIcon /> : <AlignRightIcon />
          }
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-0" align="start" onCloseAutoFocus={(e) => {
            e.preventDefault();
            editor.tf.focus();
          }}>
        <DropdownMenuRadioGroup
          value={buttonAlignment}
          onValueChange={handleValueChange}
        >
          {BUTTON_ALIGNMENT_ENTRIES.map(({ icon: Icon, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="pl-2 data-[state=checked]:bg-accent *:first:[span]:hidden"
              value={itemValue}
            >
              <Icon />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
