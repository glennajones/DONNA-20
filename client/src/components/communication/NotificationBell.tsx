import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { pusher } from "@/lib/pusher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  from: string;
  text: string;
  date: string;
  source: string;
  messageSid?: string;
}

interface NotificationBellProps {
  user?: { id?: string | number; username?: string; name?: string };
}

export default function NotificationBell({ user }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    try {
      // Subscribe to both chat messages and direct notifications
      const chatChannel = pusher.subscribe("global-chat");
      const notificationChannel = pusher.subscribe("notifications");

      const handleIncomingMessage = (data: Notification) => {
        // Only show notifications for incoming replies, not outgoing messages
        if (data.source === "sms_reply" || data.source === "email_reply") {
          setNotifications((prev) => {
            const updated = [data, ...prev.slice(0, 49)]; // Keep last 50 notifications
            return updated;
          });
          setUnread((prev) => prev + 1);
        }
      };

      chatChannel.bind("message", handleIncomingMessage);
      notificationChannel.bind("sms_reply", handleIncomingMessage);
      notificationChannel.bind("email_reply", handleIncomingMessage);

      return () => {
        chatChannel.unbind_all();
        notificationChannel.unbind_all();
        pusher.unsubscribe("global-chat");
        pusher.unsubscribe("notifications");
      };
    } catch (error) {
      console.warn("Notification bell Pusher connection failed:", error);
    }
  }, []);

  const markAllRead = () => {
    setUnread(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnread(0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && markAllRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unread > 9 ? "9+" : unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 pb-2 border-b">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Notifications</span>
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-1 text-xs"
                onClick={clearNotifications}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-default">
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {notification.source === "sms_reply" ? "📱 SMS Reply" : "📧 Email Reply"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(notification.date)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  From: {notification.from}
                </div>
                <div className="text-sm leading-tight">
                  {notification.text.length > 100 
                    ? `${notification.text.substring(0, 100)}...` 
                    : notification.text}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}