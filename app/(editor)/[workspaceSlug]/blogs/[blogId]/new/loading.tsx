"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function NewPostLoading() {
    return (
        <div className="flex flex-col h-screen">
            <div className="flex flex-1 overflow-hidden">
                {/* Editor skeleton */}
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Title skeleton */}
                        <Skeleton className="h-12 w-3/4" />
                        {/* Description skeleton */}
                        <Skeleton className="h-6 w-1/2" />
                        {/* Content skeleton */}
                        <div className="space-y-4 mt-8">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>
                </div>

                {/* Sidebar skeleton */}
                <div className="w-80 border-l border-gray-200 shrink-0 p-4">
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
