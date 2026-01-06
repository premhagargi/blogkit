'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import FormManagement from '@/modules/blogs/components/forms-cta/form-management';
import CTAManagement from '@/modules/blogs/components/forms-cta/cta-management';

export default function FormsAndCTAPage() {
  const params = useParams();
  const { workspaceSlug, blogId } = params;
  const [activeTab, setActiveTab] = useState('forms');

  // Dynamic button configuration based on active tab
  const getNewButtonConfig = () => {
    if (activeTab === 'forms') {
      return {
        text: 'New Form',
        href: `/${workspaceSlug}/blogs/${blogId}/forms-cta/form-dashboard`,
      };
    } else {
      return {
        text: 'New CTA',
        href: `/${workspaceSlug}/blogs/${blogId}/forms-cta/cta-dashboard`,
      };
    }
  };

  const getSettingsText = () => {
    return activeTab === 'forms' ? 'Form Settings' : 'CTA Settings';
  };

  const newButtonConfig = getNewButtonConfig();

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <TabsList className="grid w-48 grid-cols-2">
                <TabsTrigger value="forms">Forms</TabsTrigger>
                <TabsTrigger value="cta">CTA</TabsTrigger>
              </TabsList>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                {getSettingsText()}
              </Button>
              <Link href={newButtonConfig.href}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {newButtonConfig.text}
                </Button>
              </Link>
            </div>
          </div>

          <TabsContent value="forms">
            <FormManagement />
          </TabsContent>

          <TabsContent value="cta">
            <CTAManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
