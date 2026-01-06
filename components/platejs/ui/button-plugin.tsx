import { type PlateElementProps, PlateElement, useEditorRef } from 'platejs/react';
import { BlockSelectionPlugin } from '@platejs/selection/react';

import { cn } from '@/lib/utils';

export const BUTTON_RADIUS_VARIANTS = {
  round: { label: 'Round', radius: 24 },
  smooth: { label: 'Smooth', radius: 8 },
  sharp: { label: 'Sharp', radius: 0 },
} as const;

const BUTTON_RADIUS_ENTRIES = Object.entries(
  BUTTON_RADIUS_VARIANTS
) as Array<
  [
    ButtonRadiusVariant,
    (typeof BUTTON_RADIUS_VARIANTS)[ButtonRadiusVariant],
  ]
>;

export const BUTTON_VARIANTS = {
  filled: {
    label: 'Filled',
    className:
      'bg-blue-500 text-white shadow-xs hover:bg-blue-500/90 focus-visible:ring-blue-200',
  },
  outline: {
    label: 'Outline',
    className:
      'border-2 bg-transparent text-black hover:bg-black/10 focus-visible:ring-black-100',
  },
} as const;

export const BUTTON_SIZES = {
  small: { label: 'Small', className: 'px-3 py-1.5 text-sm' },
  medium: { label: 'Medium', className: 'px-4 py-2 text-sm' },
  large: { label: 'Large', className: 'px-6 py-3 text-base' },
} as const;

export const BUTTON_ALIGNMENT_VARIANTS = {
  left: { label: 'Left', alignment: 'left' },
  center: { label: 'Center', alignment: 'center' },
  right: { label: 'Right', alignment: 'right' },
} as const;


export type ButtonRadiusVariant = keyof typeof BUTTON_RADIUS_VARIANTS;
export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSizeVariant = keyof typeof BUTTON_SIZES;

export const DEFAULT_BUTTON_RADIUS_VARIANT: ButtonRadiusVariant = 'smooth';
export const DEFAULT_BUTTON_VARIANT: ButtonVariant = 'filled';
export const DEFAULT_BUTTON_SIZE: ButtonSizeVariant = 'medium';
export const DEFAULT_BUTTON_COLOR: string = '#000000';
export const DEFAULT_BUTTON_HREF: string | null = null;
export const DEFAULT_BUTTON_ALIGNMENT: string = "left";

export function CustomButtonElement({
  element,
  className,
  style,
  ...rest
}: PlateElementProps) {
  const editor = useEditorRef();
  const node = element as Record<string, unknown>;

  const radiusVariant = resolveRadiusVariant(node);
  const radiusValue = resolveRadiusValue(node, radiusVariant);
  const buttonVariant = resolveButtonVariant(node);
  const buttonSize = resolveButtonSize(node);
  const buttonColor = resolveButtonColor(node);
  const buttonHref = resolveButtonHref(node);
  const buttonAlignment = resolveButtonAlignment(node);
  const asElement = buttonHref ? 'a' : 'button';

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger toolbar, don't prevent button's default behavior
    const blockSelectionApi = editor.getApi(BlockSelectionPlugin)?.blockSelection;
    
    if (blockSelectionApi) {
      blockSelectionApi.set(element.id as string);
      blockSelectionApi.focus();
    }
    
    editor.tf.select(element);
    editor.tf.focus();
  };

  console.log("buttonAlignment", node.align);

  return (
    <div
      className={cn(
        // alignment utility
        node.align === 'center'
          ? 'flex justify-center'
          : node.align === 'right'
          ? 'flex justify-end'
          : 'flex justify-start'
      )}
      style={{
        width: '100%',
      }}
      onClick={handleClick}
    >
      <PlateElement
        as={asElement as any}
        className={cn(
          'inline-flex w-fit items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          BUTTON_VARIANTS[buttonVariant].className,
          BUTTON_SIZES[buttonSize].className,
          className
        )}
        style={{
          borderRadius: `${radiusValue}px`,
          backgroundColor: buttonVariant === 'outline' ? 'transparent' : buttonColor,
          borderColor: buttonVariant === 'outline' ? buttonColor : undefined,
          ...(style ?? {}),
        }}
        attributes={{
          href: buttonHref ?? undefined,
          target: buttonHref ? '_blank' : undefined,
          rel: buttonHref ? 'noopener noreferrer' : undefined,
        }}
        element={element}
        {...rest}
      >
        {rest.children || 'Button'}
      </PlateElement>
    </div>
  );
}

function resolveRadiusVariant(
  node: Record<string, unknown>
): ButtonRadiusVariant {
  const value = node?.borderRadiusStyle;

  if (isRadiusVariant(value)) {
    return value;
  }

  const numericRadius = normalizeBorderRadius(node?.borderRadius);
  const matchedVariant = BUTTON_RADIUS_ENTRIES.find(
    ([, meta]) => meta.radius === numericRadius
  );

  return matchedVariant?.[0] ?? DEFAULT_BUTTON_RADIUS_VARIANT;
}

function resolveRadiusValue(
  node: Record<string, unknown>,
  variant: ButtonRadiusVariant
) {
  const variantRadius = BUTTON_RADIUS_VARIANTS[variant].radius;

  if (isRadiusVariant(node?.borderRadiusStyle)) {
    return variantRadius;
  }

  return normalizeBorderRadius(node?.borderRadius) ?? variantRadius;
}

function resolveButtonVariant(node: Record<string, unknown>): ButtonVariant {
  const value = node?.buttonVariant;

  if (isButtonVariant(value)) {
    return value;
  }

  return DEFAULT_BUTTON_VARIANT;
}

function resolveButtonSize(node: Record<string, unknown>): ButtonSizeVariant {
  const value = node?.buttonSize;

  if (isButtonSize(value)) {
    return value;
  }

  return DEFAULT_BUTTON_SIZE;
}

function resolveButtonColor(node: Record<string, unknown>): string {
  const value = node?.buttonColor;

  if (typeof value === 'string') {
    return value;
  }

  return DEFAULT_BUTTON_COLOR;
}

function resolveButtonAlignment(node: Record<string, unknown>): string {
  const value = node?.buttonAlignment;

  if (typeof value === 'string' && value in BUTTON_ALIGNMENT_VARIANTS) {
    return value;
  }

  return DEFAULT_BUTTON_ALIGNMENT;
}

function resolveButtonHref(node: Record<string, unknown>): string | null {
  const value = node?.buttonHref;

  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  return DEFAULT_BUTTON_HREF;
}
function normalizeBorderRadius(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clampRadius(value);
  }

  if (typeof value === 'string') {
    // Handle pixel values (e.g., "24px" or just "24")
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return clampRadius(parsed);
    }
  }

  return BUTTON_RADIUS_VARIANTS[DEFAULT_BUTTON_RADIUS_VARIANT].radius;
}

function clampRadius(value: number) {
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function isRadiusVariant(value: unknown): value is ButtonRadiusVariant {
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
