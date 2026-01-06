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
import { ExternalLink, Link, Reply, Text, Unlink } from 'lucide-react';
import { KEYS } from 'platejs';
import {
  useEditorRef,
  useEditorSelection,
  useFormInputProps,
  usePluginOption,
} from 'platejs/react';

import { buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const popoverVariants = cva(
  'z-50 w-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-hidden'
);

const inputVariants = cva(
  'flex h-[28px] w-full rounded-md border-none bg-transparent px-1.5 py-1 text-base placeholder:text-muted-foreground focus-visible:ring-transparent focus-visible:outline-none md:text-sm'
);

export function LinkFloatingToolbar({
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
      <div className="flex items-center ">
        <div className="flex items-center pr-1 pl-2 text-muted-foreground">
          <Link className="size-4" />
        </div>

        <FloatingLinkUrlInput
          className={inputVariants()}
          placeholder="Paste link"
          data-plate-focus
        />
        {/* //enter button icon  */}
        <Reply className="size-6 text-gray-400" style={{ transform: "scaleY(-1)" }} />
      </div>
      {/* <Separator className="my-1" /> */}
      {/* <div className="flex items-center">
        <div className="flex items-center pr-1 pl-2 text-muted-foreground">
          <Text className="size-4" />
        </div>
        <input
          className={inputVariants()}
          placeholder="Text to display"
          data-plate-focus
          {...textInputProps}
        />
      </div> */}
      <Separator className="my-1" />
      <div className="flex items-center py-1">
        <NofollowCheckbox insertState={insertState} editState={editState} />
      </div>
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

function NofollowCheckbox({
  insertState,
  editState,
}: {
  insertState: ReturnType<typeof useFloatingLinkInsertState>;
  editState: ReturnType<typeof useFloatingLinkEditState>;
}) {
  const editor = useEditorRef();
  const selection = useEditorSelection();
  const [nofollow, setNofollow] = React.useState(false);
  const previousLinkRef = React.useRef<string | null>(null);
  const manuallySetRef = React.useRef(false); // Track if user manually set the checkbox

  // Check current link's nofollow status when selection changes
  // Only update from link attribute when editing an existing link
  React.useEffect(() => {
    // Don't overwrite manually set state during link creation
    if (manuallySetRef.current && insertState.isOpen) {
      return;
    }

    const entry = editor.api.node<TLinkElement>({
      match: { type: editor.getType(KEYS.link) },
    });
    
    if (entry) {
      const [element, path] = entry;
      // Read url and rel directly from the element (not from getLinkAttributes)
      const url = typeof (element as any).url === 'string' ? (element as any).url : '';
      const rel = typeof (element as any).rel === 'string' ? (element as any).rel : '';
      
      // Only update state if this is a different link (to preserve state when creating new links)
      // or if we're editing an existing link
      if (url !== previousLinkRef.current || editState.isEditing) {
        setNofollow(rel.includes('nofollow'));
        previousLinkRef.current = url;
        // Reset manual flag when we've synced with the link
        manuallySetRef.current = false;
      }
    } else {
      // When no link is selected:
      // - If we're in insert mode, preserve the nofollow state (don't reset it)
      // - If we're not in insert mode, reset the previous link ref but keep nofollow state
      //   until we know we're switching to a different context
      if (!insertState.isOpen && !editState.isEditing) {
        // Only reset if we're completely out of link editing context
        previousLinkRef.current = null;
        manuallySetRef.current = false;
      }
      // Don't reset nofollow state here - let it persist for new link creation
    }
  }, [editor, selection, editState.isEditing, insertState.isOpen]);

  // Handle applying nofollow to newly created links
  // This runs when a link is selected and the checkbox is checked but the link doesn't have nofollow yet
  React.useEffect(() => {
    if (!nofollow) return;

    // Use a small delay to ensure the link is fully created
    const timeoutId = setTimeout(() => {
      const entry = editor.api.node<TLinkElement>({
        match: { type: editor.getType(KEYS.link) },
      });
      
      if (entry) {
        const [element, path] = entry;
        // Read url and rel directly from the element
        const url = typeof (element as any).url === 'string' ? (element as any).url : '';
        const rel = typeof (element as any).rel === 'string' ? (element as any).rel : '';
        
        // Only add nofollow if it doesn't already have it
        // And only if this is a newly created link (url not in previousLinkRef) or we're in insert mode
        if (!rel.includes('nofollow')) {
          // Check if this is a new link or if we're actively inserting
          const isNewLink = url !== previousLinkRef.current || insertState.isOpen;
          
          if (isNewLink && url) {
            const relParts = rel.split(' ').filter(Boolean);
            relParts.push('nofollow');
            const newRel = relParts.join(' ');
            editor.tf.setNodes({ rel: newRel }, { at: path });
            // Update the ref to track this link
            previousLinkRef.current = url;
            // Clear manual flag after applying to the link
            manuallySetRef.current = false;
          }
        } else {
          // Link already has nofollow, clear manual flag
          if (manuallySetRef.current && url === previousLinkRef.current) {
            manuallySetRef.current = false;
          }
        }
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [editor, selection, nofollow, insertState.isOpen]);

  const handleNofollowChange = React.useCallback(
    (checked: boolean) => {
      setNofollow(checked);
      manuallySetRef.current = true; // Mark as manually set

      // Update existing link immediately
      const entry = editor.api.node<TLinkElement>({
        match: { type: editor.getType(KEYS.link) },
      });
      if (entry) {
        const [element, path] = entry;
        // Read url and rel directly from the element
        const url = typeof (element as any).url === 'string' ? (element as any).url : '';
        const currentRel = typeof (element as any).rel === 'string' ? (element as any).rel : '';
        const relParts = currentRel.split(' ').filter(Boolean);
        
        if (checked) {
          // Add nofollow if not already present
          if (!relParts.includes('nofollow')) {
            relParts.push('nofollow');
          }
        } else {
          // Remove nofollow
          const filtered = relParts.filter((part) => part !== 'nofollow');
          relParts.length = 0;
          relParts.push(...filtered);
        }
        
        const newRel = relParts.length > 0 ? relParts.join(' ') : undefined;
        editor.tf.setNodes({ rel: newRel }, { at: path });
        
        // Update the previous link ref to prevent state reset
        previousLinkRef.current = url;
      }
      // If no link exists yet (creating new link), the state is preserved
      // and will be applied when the link is created via the second useEffect
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
        className="text-sm text-muted-foreground cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
