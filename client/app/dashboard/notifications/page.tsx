"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadNotifications = () => {
    setIsLoading(true);
    fetchApi('/notifications')
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    try {
      await fetchApi(`/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetchApi('/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (isLoading) return <div>Loading notifications...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your tasks and team activities.</p>
        </div>
        
        {notifications.some(n => !n.isRead) && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No notifications yet</h3>
          <p className="text-sm text-slate-500">We'll let you know when something important happens.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <ul className="divide-y divide-slate-200">
            {notifications.map((notification) => (
              <li 
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 items-start ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
              >
                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!notification.isRead ? 'bg-blue-600' : 'bg-transparent'}`} />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm font-medium ${!notification.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{notification.message}</p>
                </div>
                
                <div className="flex gap-2 flex-shrink-0">
                  {notification.link && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" title="Go to page">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  {!notification.isRead && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100" 
                      title="Mark as read"
                      onClick={(e) => markAsRead(notification.id, e)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
