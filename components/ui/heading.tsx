import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const headingVariants = cva('font-semibold tracking-tight', {
  variants: {
    variant: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      destructive: 'text-destructive',
      primary: 'text-primary',
    },
    size: {
      xs: 'text-smaller',
      sm: 'text-small',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-small',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
    },
    level: {
      h1: 'text-4xl font-bold',
      h2: 'text-3xl font-bold',
      h3: 'text-2xl font-semibold',
      h4: 'text-xl font-semibold',
      h5: 'text-lg font-medium',
      h6: 'text-base font-medium',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'base',
    level: 'h1',
  },
});

const subtitleVariants = cva('font-normal tracking-normal mt-1', {
  variants: {
    variant: {
      default: 'text-muted-foreground',
      muted: 'text-muted-foreground/80',
      destructive: 'text-destructive/90',
      primary: 'text-primary/90',
    },
    size: {
      xs: 'text-smaller',
      sm: 'text-small',
      base: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'sm',
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  subtitle?: React.ReactNode;
  subtitleVariant?: VariantProps<typeof subtitleVariants>['variant'];
  subtitleSize?: VariantProps<typeof subtitleVariants>['size'];
  subtitleClassName?: string;
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  (
    {
      className,
      variant,
      size,
      level,
      as,
      subtitle,
      subtitleVariant,
      subtitleSize,
      subtitleClassName,
      children,
      ...props
    },
    ref
  ) => {
    const Comp =
      as ||
      (level === 'h1'
        ? 'h1'
        : level === 'h2'
        ? 'h2'
        : level === 'h3'
        ? 'h3'
        : level === 'h4'
        ? 'h4'
        : level === 'h5'
        ? 'h5'
        : 'h6');

    return (
      <div>
        <Comp
          className={cn(headingVariants({ variant, size, level, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
        {subtitle && (
          <div
            className={cn(
              subtitleVariants({
                variant: subtitleVariant || variant,
                size: subtitleSize,
              }),
              subtitleClassName
            )}
          >
            {subtitle}
          </div>
        )}
      </div>
    );
  }
);

Heading.displayName = 'Heading';

export { Heading, headingVariants, subtitleVariants };