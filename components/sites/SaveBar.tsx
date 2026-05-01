'use client';

import { useState } from 'react';
import { Save, GitBranch, GitPullRequest, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SaveBarProps {
  hasChanges: boolean;
  saving: boolean;
  onSave: (mode: 'commit' | 'pr') => void;
  lastSaved?: Date;
}

export default function SaveBar({ hasChanges, saving, onSave, lastSaved }: SaveBarProps) {
  const [saveMode, setSaveMode] = useState<'commit' | 'pr'>('commit');

  const handleSave = () => {
    onSave(saveMode);
  };

  return (
    <div className="border-t bg-background px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant={hasChanges ? 'destructive' : 'secondary'}>
            {hasChanges ? 'Unsaved changes' : 'All changes saved'}
          </Badge>
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select value={saveMode} onValueChange={(value: 'commit' | 'pr') => setSaveMode(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="commit">
              <div className="flex items-center gap-2">
                <GitBranch className="w-3 h-3" />
                Commit
              </div>
            </SelectItem>
            <SelectItem value="pr">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-3 h-3" />
                Pull Request
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          size="sm"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saveMode === 'commit' ? 'Commit' : 'Create PR'}
        </Button>
      </div>
    </div>
  );
}