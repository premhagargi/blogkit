'use client';

import { useEffect, useState } from 'react';
import { Sandpack } from '@codesandbox/sandpack-react';
import { Loader2 } from 'lucide-react';

interface LivePreviewProps {
  html: string;
  css?: string;
  js?: string;
}

export default function LivePreview({ html, css = '', js = '' }: LivePreviewProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay for better UX
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const files = {
    '/index.html': {
      code: html,
      active: true,
    },
    '/styles.css': {
      code: css,
    },
    '/script.js': {
      code: js,
    },
  };

  if (loading) {
    return (
      <div className="border rounded-lg h-96 flex items-center justify-center bg-muted/20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading preview...
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted px-3 py-2 text-sm font-medium border-b">
        Live Preview
      </div>
      <div className="h-96">
        <Sandpack
          template="vanilla"
          files={files}
          options={{
            showNavigator: false,
            showTabs: false,
            showLineNumbers: false,
            showRefreshButton: false,
            showOpenInCodeSandbox: false,
            autorun: true,
            recompileMode: 'delayed',
            recompileDelay: 500,
          }}
          customSetup={{
            dependencies: {},
          }}
        />
      </div>
      <div className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-t">
        Preview limitations: No SSR, partial Tailwind support, no full Next.js runtime
      </div>
    </div>
  );
}