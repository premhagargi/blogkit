'use client';
import { useContext } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Smartphone,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormContext } from './context/form-context';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EditorHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  disabled?: boolean;
}

export default function EditorHeader({
  activeTab,
  setActiveTab,
  disabled = false,
}: EditorHeaderProps) {
  const {
    theme,
    setTheme,
    device,
    setDevice,
    saveChanges,
    cancelChanges,
    refresh,
    isSaving,
    saveMessage,
    saveError,
  } = useContext(FormContext);
  const router = useRouter();

  return (
    <>
      <header className="flex items-center justify-between px-4 py-1 border-b bg-background">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <fieldset
            disabled={disabled || isSaving}
            className={disabled || isSaving ? 'cursor-not-allowed' : ''}
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-[400px]"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger
                  value="configure"
                  className="text-normal font-normal"
                >
                  Configure
                </TabsTrigger>
                <TabsTrigger value="form" className="text-normal font-normal">
                  Form
                </TabsTrigger>
                <TabsTrigger
                  value="confirmation"
                  className="text-normal font-normal"
                >
                  Confirmation
                </TabsTrigger>
                <TabsTrigger value="action" className="text-normal font-normal">
                  Action
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </fieldset>
        </div>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDevice('desktop')}
          >
            <Monitor
              className={`h-4 w-4 ${
                device === 'desktop'
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDevice('mobile')}
          >
            <Smartphone
              className={`h-4 w-4 ${
                device === 'mobile'
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            />
          </Button>
          <Button
            variant="outline"
            onClick={cancelChanges}
            className="mx-2 h-8"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button className="h-8" onClick={saveChanges} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      {/* Save Status Messages */}
      {(saveMessage || saveError) && (
        <div className="px-4 py-2">
          {saveMessage && (
            <Alert className="mb-2">
              <AlertDescription className="text-green-600">
                {saveMessage}
              </AlertDescription>
            </Alert>
          )}
          {saveError && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </>
  );
}
