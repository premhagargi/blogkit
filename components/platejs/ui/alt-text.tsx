'use client';

import * as React from 'react';

import { createPrimitiveComponent } from '@udecode/cn';
import { KEYS } from 'platejs';
import { useEditorRef, useElement } from 'platejs/react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SaveIcon, XIcon } from 'lucide-react';

type AltTextButtonState = ReturnType<typeof useAltTextButtonState>;

const AltTextButtonPrimitive = createPrimitiveComponent(Button)({
  propsHook: useAltTextButton,
});

export function AltTextButton({
  mediaType,
  ...props
}: React.ComponentProps<typeof Button> & {
  mediaType?: string;
}) {
  const state = useAltTextButtonState(mediaType);

  if (!state) return null;

  return (
    <>
      <AltTextButtonPrimitive {...props} state={state} />
      <AltTextDialog state={state} />
    </>
  );
}

function useAltTextButtonState(mediaType?: string) {
  const editor = useEditorRef();
  const element = useElement();

  const isImage = mediaType === KEYS.img;

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  const currentAlt = React.useMemo(() => {
    const alt = (element as any)?.attributes?.alt;
    return typeof alt === 'string' ? alt : '';
  }, [element]);

  React.useEffect(() => {
    if (!open) return;
    setValue(currentAlt);
  }, [currentAlt, open]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (!nextOpen) {
        requestAnimationFrame(() => {
          editor.tf.focus();
        });
      }
    },
    [editor]
  );

  const handleSave = React.useCallback(() => {
    if (!element) {
      handleOpenChange(false);
      return;
    }

    const normalized = value.trim();
    const existing = currentAlt.trim();

    if (normalized === existing) {
      handleOpenChange(false);
      return;
    }

    const path = editor.api.findPath(element);

    if (!path) {
      handleOpenChange(false);
      return;
    }

    const nextAttributes = {
      ...((element as any)?.attributes ?? {}),
    } as Record<string, unknown>;

    if (normalized) {
      nextAttributes.alt = normalized;
    } else {
      delete nextAttributes.alt;
    }

    editor.tf.setNodes({ attributes: nextAttributes }, { at: path });
    handleOpenChange(false);
  }, [currentAlt, editor, element, handleOpenChange, value]);

  if (!isImage) return null;

  return {
    currentAlt,
    handleOpenChange,
    handleSave,
    isImage,
    open,
    setValue,
    value,
  };
}

function useAltTextButton(state?: AltTextButtonState) {
  if (!state) return { props: {} };

  return {
    props: {
      onClick: () => state.handleOpenChange(true),
      type: 'button',
    },
  };
}

function AltTextDialog({ state }: { state: AltTextButtonState }) {
  const trimmedValue = state.value.trim();
  const trimmedCurrent = state.currentAlt.trim();
  const hasChanges = trimmedValue !== trimmedCurrent;

  return (
    <>
    <div className={`flex items-center gap-2 absolute mt-22 ${state.open ? 'opacity-100' : 'opacity-0'}`} onClick={() => state.handleOpenChange(true)}>
        <Input className='w-full' value={state.value} onKeyDown={(event) => {
            if (event.key === 'Enter') {
                state.handleSave();
            } else if (event.key === 'Escape') {
                state.handleOpenChange(false);
            }
        }} onChange={(event) => state.setValue(event.target.value)} placeholder="Add a short description..." />
        {/* <Button type="button" variant="outline" onClick={(event) => {
            event.stopPropagation();
            state.handleOpenChange(false);
        }}>
            <XIcon className="w-4 h-4" />
        </Button>
        <Button type="submit" disabled={!hasChanges} onClick={(event) => {
            event.stopPropagation();
            state.handleSave();
        }}>
            <SaveIcon className="w-4 h-4" />
        </Button> */}
    </div>
    {/* <Dialog open={state.open} onOpenChange={state.handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            state.handleSave();
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit alt text</DialogTitle>
            <DialogDescription>
              Describe the image to improve accessibility and SEO.
            </DialogDescription>
          </DialogHeader>

          <Input
            autoFocus
            placeholder="Add a short description..."
            value={state.value}
            onChange={(event) => state.setValue(event.target.value)}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => state.handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!hasChanges}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog> */}
    </>
  );
}

