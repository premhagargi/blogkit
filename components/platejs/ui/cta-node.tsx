//create a cta node component that can be used in the platejs editor
import { type PlateElementProps, PlateElement, useEditorRef } from 'platejs/react';
import { BlockSelectionPlugin } from '@platejs/selection/react';

import { cn } from '@/lib/utils';
import type { CTAData } from './cta-dialog';

export function CTAElement({
  element,
  className,
  style,
  ...rest
}: PlateElementProps) {
  const editor = useEditorRef();
  const node = element as Record<string, unknown> & Partial<CTAData>;

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

  const heading = node.heading || '';
  const description = node.description || '';
  const primaryButtonText = node.primaryButtonText || '';
  const primaryButtonUrl = node.primaryButtonUrl || '';
  const secondaryButtonText = node.secondaryButtonText || '';
  const secondaryButtonUrl = node.secondaryButtonUrl || '';
  const footnote = node.footnote || '';

  return (
    <div
      className={cn(
        'my-4 rounded-lg border bg-card p-6 shadow-sm',
        className
      )}
      onClick={handleClick}
      style={style}
    >
      <PlateElement {...rest} element={element}>
        <div className="space-y-4">
          {heading && (
            <h3 className="text-2xl font-semibold">{heading}</h3>
          )}
          
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}

          {(primaryButtonText || secondaryButtonText) && (
            <div className="flex flex-wrap gap-3">
              {primaryButtonText && (
                <a
                  href={primaryButtonUrl || '#'}
                  className={cn(
                    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    !primaryButtonUrl && 'pointer-events-none opacity-50'
                  )}
                  onClick={(e) => {
                    if (!primaryButtonUrl) {
                      e.preventDefault();
                    }
                  }}
                >
                  {primaryButtonText}
                </a>
              )}
              
              {secondaryButtonText && (
                <a
                  href={secondaryButtonUrl || '#'}
                  className={cn(
                    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
                    'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    !secondaryButtonUrl && 'pointer-events-none opacity-50'
                  )}
                  onClick={(e) => {
                    if (!secondaryButtonUrl) {
                      e.preventDefault();
                    }
                  }}
                >
                  {secondaryButtonText}
                </a>
              )}
            </div>
          )}

          {footnote && (
            <p className="text-xs text-muted-foreground">{footnote}</p>
          )}

          {!heading && !description && !primaryButtonText && !secondaryButtonText && (
            <p className="text-muted-foreground italic">Empty CTA block</p>
          )}
        </div>
      </PlateElement>
    </div>
  );
}