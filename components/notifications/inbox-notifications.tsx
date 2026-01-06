'use client';

import React, { useState } from 'react';
import { Inbox, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/modules/notifications/actions/notification-actions';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: any;
  workspace?: {
    id: string;
    name: string;
    slug: string;
  };
}

export function InboxNotifications() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getUserNotifications(20),
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: getUnreadNotificationCount,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Handle different notification types
    if (notification.type === 'TEAM_INVITATION') {
      if (notification.data?.invitationToken) {
        // If we have an invitation token, go to the invite page
        window.location.href = `/invite/${notification.data.invitationToken}`;
      } else if (notification.workspace) {
        // Fallback to workspace page if no token
        window.location.href = `/${notification.workspace.slug}`;
      }
    } else if (notification.workspace) {
      // For other notification types, go to workspace
      window.location.href = `/${notification.workspace.slug}`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TEAM_INVITATION':
        return '👤';
      case 'TEAM_MEMBER_ADDED':
        return '✅';
      case 'TEAM_MEMBER_REMOVED':
        return '👋';
      case 'TEAM_ROLE_CHANGED':
        return '🔄';
      case 'WORKSPACE_CREATED':
        return '🏠';
      default:
        return '💬';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-primary bg-transparent rounded-full relative"
            >
              <Inbox className="h-4 w-4 text-normal" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] font-medium"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Inbox</p>
        </TooltipContent>
      </Tooltip>

      <PopoverContent className="w-80 p-0 shadow-lg border-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-sm">Inbox</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="h-7 px-2 text-xs hover:bg-gray-100"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center p-4">
              <Inbox className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No notifications</p>
              <p className="text-xs text-gray-400">You're all caught up!</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`group relative cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50/30' : ''
                  } ${index !== notifications.length - 1 ? 'border-b' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3 p-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
                        )}
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>

                        {notification.workspace && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {notification.workspace.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mark as read button (appears on hover) */}
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              onClick={() => {
                // You can add a link to a full notifications page here
                setOpen(false);
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
