 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from "@/components/ui/popover";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { useNotifications, Notification } from "@/hooks/useNotifications";
 import { formatDistanceToNow } from "date-fns";
 import { cn } from "@/lib/utils";
 
 const NotificationBell = () => {
   const navigate = useNavigate();
   const [isOpen, setIsOpen] = useState(false);
   const {
     notifications,
     unreadCount,
     isLoading,
     markAsRead,
     markAllAsRead,
     deleteNotification,
     clearAll,
   } = useNotifications();
 
   const getNotificationIcon = (type: string) => {
     switch (type) {
       case "booking":
         return "📅";
       case "payment":
         return "💰";
       case "kyc":
         return "📋";
       case "review":
         return "⭐";
       case "success":
         return "✅";
       case "warning":
         return "⚠️";
       case "error":
         return "❌";
       default:
         return "🔔";
     }
   };
 
   const handleNotificationClick = (notification: Notification) => {
     if (!notification.is_read) {
       markAsRead(notification.id);
     }
     if (notification.action_url) {
       navigate(notification.action_url);
       setIsOpen(false);
     }
   };
 
   return (
     <Popover open={isOpen} onOpenChange={setIsOpen}>
       <PopoverTrigger asChild>
         <Button variant="ghost" size="icon" className="relative">
           <Bell className="h-5 w-5" />
           {unreadCount > 0 && (
             <Badge
               className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-[10px] text-white"
             >
               {unreadCount > 9 ? "9+" : unreadCount}
             </Badge>
           )}
         </Button>
       </PopoverTrigger>
       <PopoverContent className="w-80 p-0" align="end">
         <div className="flex items-center justify-between border-b border-border px-4 py-3">
           <h3 className="font-semibold">Notifications</h3>
           <div className="flex items-center gap-1">
             {unreadCount > 0 && (
               <Button
                 variant="ghost"
                 size="sm"
                 className="h-8 text-xs"
                 onClick={markAllAsRead}
               >
                 <CheckCheck className="mr-1 h-3 w-3" />
                 Mark all read
               </Button>
             )}
           </div>
         </div>
 
         <ScrollArea className="h-[300px]">
           {isLoading ? (
             <div className="flex items-center justify-center py-8">
               <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
             </div>
           ) : notifications.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-8 text-center">
               <Bell className="mb-2 h-8 w-8 text-muted-foreground/50" />
               <p className="text-sm text-muted-foreground">No notifications yet</p>
             </div>
           ) : (
             <div className="divide-y divide-border">
               {notifications.map((notification) => (
                 <div
                   key={notification.id}
                   className={cn(
                     "flex gap-3 p-3 transition-colors hover:bg-muted/50 cursor-pointer",
                     !notification.is_read && "bg-primary/5"
                   )}
                   onClick={() => handleNotificationClick(notification)}
                 >
                   <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-start justify-between gap-2">
                       <p
                         className={cn(
                           "text-sm font-medium truncate",
                           !notification.is_read && "text-foreground",
                           notification.is_read && "text-muted-foreground"
                         )}
                       >
                         {notification.title}
                       </p>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                         onClick={(e) => {
                           e.stopPropagation();
                           deleteNotification(notification.id);
                         }}
                       >
                         <X className="h-3 w-3" />
                       </Button>
                     </div>
                     <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                       {notification.message}
                     </p>
                     <p className="text-[10px] text-muted-foreground/70 mt-1">
                       {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                     </p>
                   </div>
                   {!notification.is_read && (
                     <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                   )}
                 </div>
               ))}
             </div>
           )}
         </ScrollArea>
 
         {notifications.length > 0 && (
           <div className="border-t border-border p-2">
             <Button
               variant="ghost"
               size="sm"
               className="w-full text-xs text-muted-foreground hover:text-destructive"
               onClick={clearAll}
             >
               <Trash2 className="mr-1 h-3 w-3" />
               Clear all notifications
             </Button>
           </div>
         )}
       </PopoverContent>
     </Popover>
   );
 };
 
 export default NotificationBell;