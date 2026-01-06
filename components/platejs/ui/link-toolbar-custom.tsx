// @ts-nocheck
// @ts-ignore
'use client';

import * as React from 'react';

import type { TLinkElement } from 'platejs';

import {
  type UseVirtualFloatingOptions,
  flip,
  offset,
} from '@platejs/floating';
import { getLinkAttributes } from '@platejs/link';
import {
  type LinkFloatingToolbarState,
  FloatingLinkUrlInput,
  useFloatingLinkEdit,
  useFloatingLinkEditState,
  useFloatingLinkInsert,
  useFloatingLinkInsertState,
} from '@platejs/link/react';
import { cva } from 'class-variance-authority';
import { ExternalLink, Link, Text, Unlink } from 'lucide-react';
import { KEYS } from 'platejs';
import {
  useEditorRef,
  useEditorSelection,
  useFormInputProps,
  usePluginOption,
} from 'platejs/react';

import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { normalizeUrl } from '@/lib/url-utils';

const popoverVariants = cva(
  'z-50 w-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-hidden'
);

const inputVariants = cva(
  'flex h-[28px] w-full rounded-md border-none bg-transparent px-1.5 py-1 text-base placeholder:text-muted-foreground focus-visible:ring-transparent focus-visible:outline-none md:text-sm'
);

// Enhanced FloatingLinkUrlInput that normalizes URLs
function EnhancedFloatingLinkUrlInput(props: any) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && inputRef.current) {
        const currentValue = inputRef.current.value;
        if (currentValue.trim()) {
          const normalizedUrl = normalizeUrl(currentValue);
          if (normalizedUrl !== currentValue) {
            // Update the input value with normalized URL before submission
            inputRef.current.value = normalizedUrl;

            // Trigger input event to update PlateJS's internal state
            const inputEvent = new Event('input', { bubbles: true });
            inputRef.current.dispatchEvent(inputEvent);
          }
        }
      }
    },
    []
  );

  return (
    <FloatingLinkUrlInput
      {...props}
      ref={inputRef}
      placeholder="Google.com"
      onKeyDown={handleKeyDown}
    />
  );
}

export function CustomLinkFloatingToolbar({
  state,
}: {
  state?: LinkFloatingToolbarState;
}) {
  const activeCommentId = usePluginOption({ key: KEYS.comment }, 'activeId');
  const activeSuggestionId = usePluginOption(
    { key: KEYS.suggestion },
    'activeId'
  );

  const floatingOptions: UseVirtualFloatingOptions = React.useMemo(() => {
    return {
      middleware: [
        offset(8),
        flip({
          fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
          padding: 12,
        }),
      ],
      placement:
        activeSuggestionId || activeCommentId ? 'top-start' : 'bottom-start',
    };
  }, [activeCommentId, activeSuggestionId]);

  const insertState = useFloatingLinkInsertState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  });
  const {
    hidden,
    props: insertProps,
    ref: insertRef,
    textInputProps,
  } = useFloatingLinkInsert(insertState);

  const editState = useFloatingLinkEditState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  });
  const {
    editButtonProps,
    props: editProps,
    ref: editRef,
    unlinkButtonProps,
  } = useFloatingLinkEdit(editState);

  const inputProps = useFormInputProps({
    preventDefaultOnEnterKeydown: true,
  });

  if (hidden) return null;

  const input = (
    <div className="flex w-[330px] flex-col" {...inputProps}>
      <div className="flex items-center">
        <div className="flex items-center pr-1 pl-2 text-muted-foreground">
          <Link className="size-4" />
        </div>

        {/* Use enhanced FloatingLinkUrlInput that normalizes URLs */}
        <EnhancedFloatingLinkUrlInput
          className={inputVariants()}
          data-plate-focus
        />
      </div>

      <Separator className="my-1" />

      <div className="flex items-center">
        <div className="flex items-center pr-1 pl-2 text-muted-foreground">
          <Text className="size-4" />
        </div>
        <input
          className={inputVariants()}
          placeholder="Text to display"
          data-plate-focus
          {...textInputProps}
        />
      </div>

      {/* Add nofollow checkbox */}
      <Separator className="my-1" />
      <NofollowCheckbox />
    </div>
  );

  const editContent = editState.isEditing ? (
    input
  ) : (
    <div className="box-content flex items-center">
      <button
        className={buttonVariants({ size: 'sm', variant: 'ghost' })}
        type="button"
        {...editButtonProps}
      >
        Edit link
      </button>

      <Separator orientation="vertical" />

      <LinkOpenButton />

      <Separator orientation="vertical" />

      <button
        className={buttonVariants({
          size: 'sm',
          variant: 'ghost',
        })}
        type="button"
        {...unlinkButtonProps}
      >
        <Unlink width={18} />
      </button>
    </div>
  );

  return (
    <>
      <div ref={insertRef} className={popoverVariants()} {...insertProps}>
        {input}
      </div>

      <div ref={editRef} className={popoverVariants()} {...editProps}>
        {editContent}
      </div>
    </>
  );
}

function NofollowCheckbox() {
  const editor = useEditorRef();
  const [nofollow, setNofollow] = React.useState(false);

  // Monitor for new links being created
  React.useEffect(() => {
    const handleNofollowForNewLinks = () => {
      if (nofollow) {
        // Small delay to ensure link is created first
        setTimeout(() => {
          const entry = editor.api.node<TLinkElement>({
            match: { type: editor.getType(KEYS.link) },
          });
          if (entry) {
            const [element] = entry;
            const attrs = getLinkAttributes(editor, element);
            // Only add nofollow if it doesn't already have it
            // if (!attrs.rel?.includes('nofollow')) {
            //   const [, path] = entry;
            //   editor.tf.setNodes({ rel: 'nofollow' }, { at: path });
            // }
          }
        }, 50);
      }
    };

    // Listen for editor changes (when links are created)
    editor.addEventListener?.('change', handleNofollowForNewLinks);

    return () => {
      editor.removeEventListener?.('change', handleNofollowForNewLinks);
    };
  }, [editor, nofollow]);

  // Check current link's nofollow status when component mounts or selection changes
  React.useEffect(() => {
    const entry = editor.api.node<TLinkElement>({
      match: { type: editor.getType(KEYS.link) },
    });
    if (entry) {
      const [element] = entry;
      const attrs = getLinkAttributes(editor, element);
      setNofollow(attrs.rel?.includes('nofollow') || false);
    } else {
      // Reset when no link is selected
      setNofollow(false);
    }
  }, [editor]);

  const handleNofollowChange = React.useCallback(
    (checked: boolean) => {
      setNofollow(checked);

      // Update existing link immediately
      const entry = editor.api.node<TLinkElement>({
        match: { type: editor.getType(KEYS.link) },
      });
      if (entry) {
        const [, path] = entry;
        editor.tf.setNodes(
          { rel: checked ? 'nofollow' : undefined },
          { at: path }
        );
      }
    },
    [editor]
  );

  return (
    <div className="flex items-center space-x-2 px-2">
      <Checkbox
        id="nofollow"
        checked={nofollow}
        onCheckedChange={handleNofollowChange}
      />
      <label
        htmlFor="nofollow"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Mark as nofollow
      </label>
    </div>
  );
}

function LinkOpenButton() {
  const editor = useEditorRef();
  const selection = useEditorSelection();

  const attributes = React.useMemo(
    () => {
      const entry = editor.api.node<TLinkElement>({
        match: { type: editor.getType(KEYS.link) },
      });
      if (!entry) {
        return {};
      }
      const [element] = entry;
      return getLinkAttributes(editor, element);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, selection]
  );

  return (
    <a
      {...attributes}
      className={buttonVariants({
        size: 'sm',
        variant: 'ghost',
      })}
      onMouseOver={(e) => {
        e.stopPropagation();
      }}
      aria-label="Open link in a new tab"
      target="_blank"
    >
      <ExternalLink width={18} />
    </a>
  );
}
