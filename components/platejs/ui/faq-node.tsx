//create a faq node component that can be used in the platejs editor
import { type PlateElementProps, PlateElement, useEditorRef } from 'platejs/react';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { FAQData, FAQItem } from './faq-dialog';
import { getGlobalFAQDialog } from './faq-dialog-context';

export function FAQElement({
  element,
  className,
  style,
  ...rest
}: PlateElementProps) {
  const editor = useEditorRef();
  const node = element as Record<string, unknown> & Partial<FAQData>;
  
  // Initialize expanded state - start with all items collapsed
  const items = (node.items as FAQItem[] | undefined) || [];
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

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

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const handleEdit = () => {
    const openDialog = getGlobalFAQDialog();
    if (openDialog) {
      openDialog(
        (updatedData: FAQData) => {
          // Update the existing node with new data
          editor.tf.setNodes(
            {
              ...updatedData,
            },
            {
              at: editor.api.findPath(element)!,
            }
          );
        },
        { items }
      );
    }
  };

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
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Frequently Asked Questions</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Edit
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-muted-foreground italic">No FAQ items</p>
          ) : (
            items.map((item, index) => {
              const isExpanded = expandedItems.has(index);
              return (
                <div
                  key={index}
                  className="border-b last:border-b-0 pb-3 last:pb-0"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItem(index);
                    }}
                    className="w-full flex items-center justify-between text-left py-3 hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors"
                  >
                    <span className="font-medium pr-4">{item.question}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-2 pb-2 text-muted-foreground">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </PlateElement>
    </div>
  );
}

