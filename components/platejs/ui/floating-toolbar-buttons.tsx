'use client';

import * as React from 'react';

import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BaselineIcon,
  BoldIcon,
  Circle,
  Code2Icon,
  ItalicIcon,
  Link as LinkIcon,
  StrikethroughIcon,
  Trash2Icon,
  UnderlineIcon,
  WandSparklesIcon,
} from 'lucide-react';
import { KEYS, type TElement } from 'platejs';
import {
  useEditorReadOnly,
  useEditorRef,
  useEditorSelector,
  useRemoveNodeButton,
} from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BUTTON_RADIUS_VARIANTS,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  DEFAULT_BUTTON_RADIUS_VARIANT,
  DEFAULT_BUTTON_SIZE,
  DEFAULT_BUTTON_VARIANT,
  type ButtonRadiusVariant,
  type ButtonSizeVariant,
  type ButtonVariant,
} from '@/components/platejs/ui/button-plugin';

import { AIToolbarButton } from './ai-toolbar-button';
import { CommentToolbarButton } from './comment-toolbar-button';
import { InlineEquationToolbarButton } from './equation-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
import { MoreToolbarButton } from './more-toolbar-button';
import { SuggestionToolbarButton } from './suggestion-toolbar-button';
import { ToolbarButton, ToolbarGroup } from './toolbar';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';
import { AlignToolbarButton } from './align-toolbar-button';
import { Input } from '@/components/ui/input';
import { Button, Button as UIButton } from '@/components/ui/button';
import { normalizeUrl } from '@/lib/url-utils';

// Color palette - flattened for better grid layout
const TEXT_COLOR_PALETTE = [
  '#000000',
  '#FFFFFF',
  '#64473A',
  '#D9730D',
  '#DFAB01',
  '#0F7B6C',
  '#0B6E99',
  '#6940A5',
  '#AD1A72',
  '#E03E3E',
];

const BACKGROUND_COLOR_PALETTE = [
  '#FFFFFF',
  '#000000',
  '#E6D9D0',
  '#FFD8A8',
  '#FFE066',
  '#C3E6D3',
  '#A5D8FF',
  '#D0B2F6',
  '#F7B2D9',
  '#FFB3B3',
];

const BUTTON_RADIUS_ENTRIES = Object.entries(BUTTON_RADIUS_VARIANTS) as [
  ButtonRadiusVariant,
  (typeof BUTTON_RADIUS_VARIANTS)[ButtonRadiusVariant],
][];
const BUTTON_VARIANT_ENTRIES = Object.entries(BUTTON_VARIANTS) as [
  ButtonVariant,
  (typeof BUTTON_VARIANTS)[ButtonVariant],
][];
const BUTTON_SIZE_ENTRIES = Object.entries(BUTTON_SIZES) as [
  ButtonSizeVariant,
  (typeof BUTTON_SIZES)[ButtonSizeVariant],
][];

const ALIGN_ENTRIES = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' }
];

function FloatingFontColorButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [selectedTextColor, setSelectedTextColor] = React.useState<string>();
  const [selectedBgColor, setSelectedBgColor] = React.useState<string>();

  const selectionDefined = useEditorSelector(
    (editor) => !!editor.selection,
    []
  );

  const buttonEntry = useEditorSelector(
    (editor) =>
      editor.api.above<TElement>({
        match: { type: 'button' },
      }),
    []
  );

  const isButton = !!buttonEntry;

  const textColor = useEditorSelector(
    (editor) => editor.api.mark(KEYS.color) as string,
    [KEYS.color]
  );

  const bgColor = useEditorSelector(
    (editor) => editor.api.mark(KEYS.backgroundColor) as string,
    [KEYS.backgroundColor]
  );

  const updateTextColor = React.useCallback(
    (color: string) => {
      if (editor.selection) {
        editor.tf.select(editor.selection);
        editor.tf.focus();
        editor.tf.addMark(KEYS.color, color);
      }
    },
    [editor]
  );

  const updateBgColor = React.useCallback(
    (color: string) => {
      if (editor.selection) {
        editor.tf.select(editor.selection);
        editor.tf.focus();
        editor.tf.addMark(KEYS.backgroundColor, color);
      }
    },
    [editor]
  );

  const updateTextColorAndClose = React.useCallback(
    (color: string) => {
      updateTextColor(color);
      setOpen(false);
    },
    [updateTextColor]
  );

  const updateBgColorAndClose = React.useCallback(
    (color: string) => {
      updateBgColor(color);
      setOpen(false);
    },
    [updateBgColor]
  );

  const clearTextColor = React.useCallback(() => {
    if (editor.selection) {
      editor.tf.select(editor.selection);
      editor.tf.focus();
      editor.tf.removeMarks(KEYS.color);
      setOpen(false);
    }
  }, [editor]);

  const clearBgColor = React.useCallback(() => {
    if (editor.selection) {
      editor.tf.select(editor.selection);
      editor.tf.focus();
      editor.tf.removeMarks(KEYS.backgroundColor);
      setOpen(false);
    }
  }, [editor]);

  React.useEffect(() => {
    if (selectionDefined) {
      setSelectedTextColor(textColor);
      setSelectedBgColor(bgColor);
    }
  }, [textColor, bgColor, selectionDefined]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Text color">
          <BaselineIcon />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
        align="start"
      >
        <div className="p-3 w-52 bg-popover">
          {/* Text color section */}
          <div className="mb-4">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
              Text color
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {TEXT_COLOR_PALETTE.map((hexColor) => (
                <button
                  key={hexColor}
                  className={`
                    relative w-7 h-7 rounded-sm
                    bg-muted flex items-center justify-center
                    hover:opacity-80 transition-opacity
                    ${selectedTextColor === hexColor ? 'border-2 border-foreground/40' : 'border border-black/10'}
                  `}
                  onClick={() => updateTextColorAndClose(hexColor)}
                  title={hexColor}
                >
                  <span
                    className="text-sm font-semibold uppercase"
                    style={{ color: hexColor, textShadow: '0 0 1px rgba(0, 0, 0, 0.5)' }}
                  >
                    A
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Background color section */}
          {!isButton && (
            <div className="mb-3">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                Background color
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {BACKGROUND_COLOR_PALETTE.map((hexColor) => (
                  <button
                    key={hexColor}
                    className={`
                      relative w-7 h-7 rounded-sm
                      hover:opacity-80 transition-opacity
                      ${selectedBgColor === hexColor ? 'border-2 border-foreground/40' : 'border border-black/10'}
                    `}
                    style={{ backgroundColor: hexColor }}
                    onClick={() => updateBgColorAndClose(hexColor)}
                    title={hexColor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Remove color buttons */}
          {/* <div className="flex gap-2">
            {selectedTextColor && (
              <button
                onClick={clearTextColor}
                className="flex-1 text-xs py-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                Remove text color
              </button>
            )}
            {selectedBgColor && (
              <button
                onClick={clearBgColor}
                className="flex-1 text-xs py-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                Remove background
              </button>
            )}
          </div> */}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ButtonStyleToolbarButton() {
  const editor = useEditorRef();
  const [radiusOpen, setRadiusOpen] = React.useState(false);
  const [variantOpen, setVariantOpen] = React.useState(false);
  const [sizeOpen, setSizeOpen] = React.useState(false);

  const buttonEntry = useEditorSelector(
    (editor) =>
      editor.api.above<TElement>({
        match: { type: 'button' },
      }),
    []
  );

  const buttonNode = buttonEntry?.[0] as Record<string, unknown> | undefined;

  const radiusVariant = React.useMemo(
    () => inferButtonRadiusVariant(buttonNode),
    [buttonNode]
  );
  const buttonVariant = React.useMemo(
    () => inferButtonVariant(buttonNode),
    [buttonNode]
  );
  const buttonSize = React.useMemo(
    () => inferButtonSize(buttonNode),
    [buttonNode]
  );

  const setButtonProps = React.useCallback(
    (updates: Record<string, unknown>) => {
      const entry = editor.api.above<TElement>({
        match: { type: 'button' },
      });

      if (!entry) return;

      const [node, path] = entry;

      const nextEntries = Object.entries(updates).filter(([key, value]) => {
        return (node as any)?.[key] !== value;
      });

      if (!nextEntries.length) return;

      const next = Object.fromEntries(nextEntries);
      editor.tf.setNodes(next, { at: path });
      editor.tf.focus();
    },
    [editor]
  );

  const handleRadiusChange = React.useCallback(
    (value: string) => {
      if (!isButtonRadiusVariant(value)) return;

      setButtonProps({
        borderRadiusStyle: value,
        borderRadius: BUTTON_RADIUS_VARIANTS[value].radius,
      });
    },
    [setButtonProps]
  );

  const handleVariantChange = React.useCallback(
    (value: string) => {
      if (!isButtonVariant(value)) return;

      setButtonProps({ buttonVariant: value });
    },
    [setButtonProps]
  );

  const handleSizeChange = React.useCallback(
    (value: string) => {
      if (!isButtonSize(value)) return;

      setButtonProps({ buttonSize: value });
    },
    [setButtonProps]
  );

  if (!buttonEntry) return null;

  return (
    <>
      <DropdownMenu open={radiusOpen} onOpenChange={setRadiusOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            className="min-w-[80px]"
            isDropdown
            pressed={radiusOpen}
            tooltip="Button border radius"
          >
            {BUTTON_RADIUS_VARIANTS[radiusVariant].label}
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="ignore-click-outside/toolbar space-y-2 p-3"
          align="start"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            editor.tf.focus();
          }}
        >
          {/* <DropdownMenuLabel className="px-1 text-xs font-medium uppercase text-muted-foreground">
            Border radius
          </DropdownMenuLabel> */}
          <DropdownMenuRadioGroup
            value={radiusVariant}
            onValueChange={handleRadiusChange}
          >
            {BUTTON_RADIUS_ENTRIES.map(([value, meta]) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                className="justify-between"
              >
                {meta.label}
                {/* <span className="text-xs text-muted-foreground">
                  {meta.radius}px
                </span> */}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu
        open={variantOpen}
        onOpenChange={setVariantOpen}
        modal={false}
      >
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            className="min-w-[80px]"
            isDropdown
            pressed={variantOpen}
            tooltip="Button fill style"
          >
            {BUTTON_VARIANTS[buttonVariant].label}
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="ignore-click-outside/toolbar space-y-2 p-3"
          align="start"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            editor.tf.focus();
          }}
        >
          {/* <DropdownMenuLabel className="px-1 text-xs font-medium uppercase text-muted-foreground">
            Fill
          </DropdownMenuLabel> */}
          <DropdownMenuRadioGroup
            value={buttonVariant}
            onValueChange={handleVariantChange}
          >
            {BUTTON_VARIANT_ENTRIES.map(([value, meta]) => (
              <DropdownMenuRadioItem key={value} value={value}>
                {meta.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu open={sizeOpen} onOpenChange={setSizeOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            className="min-w-[80px]"
            isDropdown
            pressed={sizeOpen}
            tooltip="Button size"
          >
            {BUTTON_SIZES[buttonSize].label}
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="ignore-click-outside/toolbar space-y-2 p-3"
          align="start"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            editor.tf.focus();
          }}
        >
          {/* <DropdownMenuLabel className="px-1 text-xs font-medium uppercase text-muted-foreground">
            Size
          </DropdownMenuLabel> */}
          <DropdownMenuRadioGroup
            value={buttonSize}
            onValueChange={handleSizeChange}
          >
            {BUTTON_SIZE_ENTRIES.map(([value, meta]) => (
              <DropdownMenuRadioItem key={value} value={value}>
                {meta.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

//align whole button block left, center, right, justify
// function AlignToolbarButton() {
//   const [open, setOpen] = React.useState(false);
//   const editor = useEditorRef();

//   const updateAlign = React.useCallback(
//     (align: string) => {
//       if (editor.selection) {
//         editor.tf.select(editor.selection);
//         editor.tf.focus();
//         editor.tf.addMark(KEYS.align, align);
//       }
//     },
//     [editor]
//   );

//   return (
//     <DropdownMenu
//         open={variantOpen}
//         onOpenChange={setVariantOpen}
//         modal={false}
//       >
//         <DropdownMenuTrigger asChild>
//           <ToolbarButton
//             className="min-w-[80px]"
//             isDropdown
//             pressed={variantOpen}
//             tooltip="Button fill style"
//           >
//             Fill
//           </ToolbarButton>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent
//           className="ignore-click-outside/toolbar w-44 space-y-2 p-3"
//           align="start"
//           onCloseAutoFocus={(e) => {
//             e.preventDefault();
//             editor.tf.focus();
//           }}
//         >
//           <DropdownMenuLabel className="px-1 text-xs font-medium uppercase text-muted-foreground">
//             Fill
//           </DropdownMenuLabel>
//           <DropdownMenuRadioGroup
//             value={buttonVariant}
//             onValueChange={handleVariantChange}
//           >
//             {ALIGN_ENTRIES.map(([value, meta]) => (
//               <DropdownMenuRadioItem key={value} value={value}>
//                 {meta.label}
//               </DropdownMenuRadioItem>
//             ))}
//           </DropdownMenuRadioGroup>
//         </DropdownMenuContent>
//       </DropdownMenu>
//   );
// }

function inferButtonRadiusVariant(
  node?: Record<string, unknown>
): ButtonRadiusVariant {
  if (!node) return DEFAULT_BUTTON_RADIUS_VARIANT;

  const value = node?.borderRadiusStyle;
  if (isButtonRadiusVariant(value)) {
    return value;
  }

  const numericRadius = normalizeLegacyRadius(node?.borderRadius);
  const matchedVariant = BUTTON_RADIUS_ENTRIES.find(
    ([, meta]) => meta.radius === numericRadius
  );

  return matchedVariant?.[0] ?? DEFAULT_BUTTON_RADIUS_VARIANT;
}

//change button color to a color picker
function ButtonColorToolbarButton() {
  const [open, setOpen] = React.useState(false);
  const [selectedColor, setSelectedColor] = React.useState<string>();

  const selectionDefined = useEditorSelector(
    (editor) => !!editor.selection,
    []
  );

  const editor = useEditorRef();;

  const buttonEntry = useEditorSelector(
    (editor) =>
      editor.api.above<TElement>({
        match: { type: 'button' },
      }),
    []
  );

  const buttonNode = buttonEntry?.[0] as Record<string, unknown> | undefined;
  const currentColor =
    typeof buttonNode?.buttonColor === 'string' ? (buttonNode.buttonColor as string) : undefined;

  React.useEffect(() => {
    if (open) {
      setSelectedColor(currentColor);
    }
  }, [open, currentColor]);

  const setButtonProps = React.useCallback(
    (updates: Record<string, unknown>) => {
      const entry = editor.api.above<TElement>({
        match: { type: 'button' },
      });

      if (!entry) return;

      const [node, path] = entry;

      const nextEntries = Object.entries(updates).filter(([key, value]) => {
        return (node as any)?.[key] !== value;
      });

      if (!nextEntries.length) return;

      const next = Object.fromEntries(nextEntries);
      editor.tf.setNodes(next, { at: path });
      editor.tf.focus();
    },
    [editor]
  );

  const handleButtonColorChange = React.useCallback(
    (value: string) => {
      if (!isButtonColor(value)) return;

      setButtonProps({ buttonColor: value });
      setSelectedColor(value);
    },
    [setButtonProps]
  );

  if (!buttonEntry) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton tooltip="Button color" pressed={open} disabled={!selectionDefined}>
          <Circle className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedColor || '#000000', }} />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="ignore-click-outside/toolbar w-48 p-3"
        align="start"
        onCloseAutoFocus={e => { e.preventDefault(); }}
      >
        <div className="flex flex-wrap gap-1.5 py-2">
          {BACKGROUND_COLOR_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              className={`
                w-6 h-6 rounded-full border
                ${selectedColor === color ? " border-2 border-blue-500" : "border-black/10"}
                focus:outline-none focus-visible:ring-2
              `}
              style={{ backgroundColor: color }}
              aria-label={color}
              onClick={() => handleButtonColorChange(color)}
            />
          ))}
        </div>
        <button
            onClick={() => {
              setButtonProps({ buttonColor: null });
              setSelectedColor(undefined);
            }}
            className="w-full text-xs py-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            Remove color
          </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ButtonLinkToolbarButton() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  const editor = useEditorRef();
  const buttonEntry = useEditorSelector(
    (ed) =>
      ed.api.above<TElement>({
        match: { type: 'button' },
      }),
    []
  );

  const buttonNode = buttonEntry?.[0] as Record<string, unknown> | undefined;
  const currentHref =
    typeof buttonNode?.buttonHref === 'string' ? (buttonNode.buttonHref as string) : '';

  React.useEffect(() => {
    if (open) {
      setValue(currentHref ?? '');
    }
  }, [open, currentHref]);

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

  const handleApply = React.useCallback(() => {
    const trimmed = value.trim();

    if (!trimmed) {
      setButtonProps({ buttonHref: null });
      setOpen(false);
      return;
    }

    const normalized = normalizeUrl(trimmed);
    setButtonProps({ buttonHref: normalized });
    setValue(normalized);
    setOpen(false);
  }, [setButtonProps, value]);

  const handleRemove = React.useCallback(() => {
    setButtonProps({ buttonHref: null });
    setValue('');
    setOpen(false);
  }, [setButtonProps]);

  if (!buttonEntry) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          tooltip={currentHref ? `Button link: ${currentHref}` : 'Set button link'}
          pressed={open}
        >
          <LinkIcon className="size-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="ignore-click-outside/toolbar w-72 space-y-3 p-3"
        align="start"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            handleApply();
          }}
        >
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://example.com"
            autoFocus
          />

          <div className="flex items-center justify-end gap-2">
            {currentHref ? (
              <UIButton type="button" variant="ghost" size="sm" onClick={handleRemove}>
                Remove
              </UIButton>
            ) : null}
            <UIButton type="submit" size="sm">
              Apply
            </UIButton>
          </div>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function inferButtonVariant(node?: Record<string, unknown>): ButtonVariant {
  if (!node) return DEFAULT_BUTTON_VARIANT;

  const value = node?.buttonVariant;
  if (isButtonVariant(value)) {
    return value;
  }

  return DEFAULT_BUTTON_VARIANT;
}

function inferButtonSize(node?: Record<string, unknown>): ButtonSizeVariant {
  if (!node) return DEFAULT_BUTTON_SIZE;

  const value = node?.buttonSize;
  if (isButtonSize(value)) {
    return value;
  }

  return DEFAULT_BUTTON_SIZE;
}

function normalizeLegacyRadius(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clampRadius(value);
  }

  if (typeof value === 'string') {
    // Handle pixel values (e.g., "24px" or just "24")
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      // Convert legacy very large values (999px) to new round value (24px)
      if (parsed >= 500) return 24; // round
      return clampRadius(parsed);
    }
  }

  return BUTTON_RADIUS_VARIANTS[DEFAULT_BUTTON_RADIUS_VARIANT].radius;
}

function clampRadius(value: number) {
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function isButtonRadiusVariant(
  value: unknown
): value is ButtonRadiusVariant {
  return (
    typeof value === 'string' &&
    value in BUTTON_RADIUS_VARIANTS &&
    (BUTTON_RADIUS_VARIANTS as Record<string, unknown>)[value] !== undefined
  );
}

function isButtonVariant(value: unknown): value is ButtonVariant {
  return (
    typeof value === 'string' &&
    value in BUTTON_VARIANTS &&
    (BUTTON_VARIANTS as Record<string, unknown>)[value] !== undefined
  );
}

function isButtonSize(value: unknown): value is ButtonSizeVariant {
  return (
    typeof value === 'string' &&
    value in BUTTON_SIZES &&
    (BUTTON_SIZES as Record<string, unknown>)[value] !== undefined
  );
}

function isButtonColor(value: unknown): value is string {
  return typeof value === 'string';
}

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();

  const buttonEntry = useEditorSelector(
    (ed) =>
      ed.api.above<TElement>({
        match: { type: 'button' },
      }),
    []
  );

  const { props: buttonProps } = useRemoveNodeButton({ element: buttonEntry?.[0] as TElement });

  return (
    <>
      {!readOnly && (
        <>
          {/* <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              <WandSparklesIcon />
              Ask AI
            </AIToolbarButton>
          </ToolbarGroup> */}

          <ToolbarGroup>
            <ButtonStyleToolbarButton />
          </ToolbarGroup>

          {buttonEntry ? (
            <ToolbarGroup>
              <AlignToolbarButton />
              <ButtonLinkToolbarButton />
            </ToolbarGroup>
          ) : (
            <ToolbarGroup>
              <TurnIntoToolbarButton />

              <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
                <BoldIcon />
              </MarkToolbarButton>

              <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
                <ItalicIcon />
              </MarkToolbarButton>

              <MarkToolbarButton nodeType={KEYS.underline} tooltip="Underline (⌘+U)">
                <UnderlineIcon />
              </MarkToolbarButton>

              <MarkToolbarButton
                nodeType={KEYS.strikethrough}
                tooltip="Strikethrough (⌘+⇧+M)"
              >
                <StrikethroughIcon />
              </MarkToolbarButton>

              <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (⌘+E)">
                <Code2Icon />
              </MarkToolbarButton>

              {/* <InlineEquationToolbarButton /> */}

              <LinkToolbarButton />
            </ToolbarGroup>
          )}
        </>
      )}

      <ToolbarGroup>
        <ButtonColorToolbarButton />
        <FloatingFontColorButton />
      </ToolbarGroup>

      
      {/* <ToolbarGroup>
      <Button size="sm" variant="ghost" {...buttonProps}>
              <Trash2Icon />
            </Button>
      </ToolbarGroup> */}
    </>
  );
}
