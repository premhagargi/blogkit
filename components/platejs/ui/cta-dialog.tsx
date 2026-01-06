'use client';

import { useState } from 'react';
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

export interface CTAData {
  heading: string;
  description: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  footnote: string;
}

interface CTADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CTAData) => void;
}

export function CTADialog({ open, onOpenChange, onSubmit }: CTADialogProps) {
  const [formData, setFormData] = useState<CTAData>({
    heading: '',
    description: '',
    primaryButtonText: '',
    primaryButtonUrl: '',
    secondaryButtonText: '',
    secondaryButtonUrl: '',
    footnote: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // At least heading is required
    if (!formData.heading.trim()) {
      return;
    }

    onSubmit(formData);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      heading: '',
      description: '',
      primaryButtonText: '',
      primaryButtonUrl: '',
      secondaryButtonText: '',
      secondaryButtonUrl: '',
      footnote: '',
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        heading: '',
        description: '',
        primaryButtonText: '',
        primaryButtonUrl: '',
        secondaryButtonText: '',
        secondaryButtonUrl: '',
        footnote: '',
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create CTA Block</DialogTitle>
          <DialogDescription>
            Add a call-to-action block with heading, description, and buttons.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heading">Heading *</Label>
            <Input
              id="heading"
              value={formData.heading}
              onChange={(e) =>
                setFormData({ ...formData, heading: e.target.value })
              }
              placeholder="Enter heading"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter description"
              rows={3}
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="primaryButtonText">Primary Button Text</Label>
              <Input
                id="primaryButtonText"
                value={formData.primaryButtonText}
                onChange={(e) =>
                  setFormData({ ...formData, primaryButtonText: e.target.value })
                }
                placeholder="e.g., Get Started"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryButtonUrl">Primary Button URL</Label>
              <Input
                id="primaryButtonUrl"
                type="url"
                value={formData.primaryButtonUrl}
                onChange={(e) =>
                  setFormData({ ...formData, primaryButtonUrl: e.target.value })
                }
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="secondaryButtonText">Secondary Button Text</Label>
              <Input
                id="secondaryButtonText"
                value={formData.secondaryButtonText}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    secondaryButtonText: e.target.value,
                  })
                }
                placeholder="e.g., Learn More"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryButtonUrl">Secondary Button URL</Label>
              <Input
                id="secondaryButtonUrl"
                type="url"
                value={formData.secondaryButtonUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    secondaryButtonUrl: e.target.value,
                  })
                }
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footnote">Footnote</Label>
            <Input
              id="footnote"
              value={formData.footnote}
              onChange={(e) =>
                setFormData({ ...formData, footnote: e.target.value })
              }
              placeholder="Enter footnote text"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create CTA</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

