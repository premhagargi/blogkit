'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NewPageDialog } from './new-page-dialog';

interface NewPageButtonProps {
  workspaceSlug: string;
}

export function NewPageButton({ workspaceSlug }: NewPageButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        className="bg-black hover:bg-gray-800 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Page
      </Button>

      <NewPageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceSlug={workspaceSlug}
      />
    </>
  );
}
