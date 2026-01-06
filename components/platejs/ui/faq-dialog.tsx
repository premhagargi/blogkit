'use client';

import { useState } from 'react';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQData {
  items: FAQItem[];
}

interface FAQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FAQData) => void;
  initialData?: Partial<FAQData>;
}

export function FAQDialog({ open, onOpenChange, onSubmit, initialData }: FAQDialogProps) {
  const [items, setItems] = useState<FAQItem[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items
      : [{ question: '', answer: '' }]
  );

  // Update items when initialData changes or dialog opens
  React.useEffect(() => {
    if (open && initialData?.items && initialData.items.length > 0) {
      setItems(initialData.items);
    } else if (open && (!initialData?.items || initialData.items.length === 0)) {
      setItems([{ question: '', answer: '' }]);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty items and validate
    const validItems = items.filter(
      (item) => item.question.trim() && item.answer.trim()
    );

    if (validItems.length === 0) {
      return;
    }

    onSubmit({ items: validItems });
    onOpenChange(false);
    
    // Reset form
    setItems([{ question: '', answer: '' }]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setItems([{ question: '', answer: '' }]);
    }
    onOpenChange(newOpen);
  };

  const addItem = () => {
    setItems([...items, { question: '', answer: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: 'question' | 'answer', value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData?.items && initialData.items.length > 0
              ? 'Edit FAQ Block'
              : 'Create FAQ Block'}
          </DialogTitle>
          <DialogDescription>
            {initialData?.items && initialData.items.length > 0
              ? 'Update your FAQ block with questions and answers.'
              : 'Add frequently asked questions with their answers.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="space-y-4 p-4 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    FAQ Item {index + 1}
                  </Label>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`question-${index}`}>Question *</Label>
                  <Input
                    id={`question-${index}`}
                    value={item.question}
                    onChange={(e) =>
                      updateItem(index, 'question', e.target.value)
                    }
                    placeholder="Enter question"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`answer-${index}`}>Answer *</Label>
                  <Textarea
                    id={`answer-${index}`}
                    value={item.answer}
                    onChange={(e) =>
                      updateItem(index, 'answer', e.target.value)
                    }
                    placeholder="Enter answer"
                    rows={3}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ Item
          </Button>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {initialData?.items && initialData.items.length > 0
                ? 'Update FAQ'
                : 'Create FAQ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

