 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 export interface Notification {
   id: string;
   user_id: string;
   title: string;
   message: string;
   type: string;
   is_read: boolean;
   action_url: string | null;
   metadata: Record<string, unknown> | null;
   created_at: string;
 }
 
 export const useNotifications = () => {
   const [notifications, setNotifications] = useState<Notification[]>([]);
   const [unreadCount, setUnreadCount] = useState(0);
   const [isLoading, setIsLoading] = useState(true);
 
   const fetchNotifications = useCallback(async () => {
     try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session?.user) return;
 
       const { data, error } = await supabase
         .from("notifications")
         .select("*")
         .eq("user_id", session.user.id)
         .order("created_at", { ascending: false })
         .limit(50);
 
       if (error) throw error;
 
       const notifs = (data || []) as Notification[];
       setNotifications(notifs);
       setUnreadCount(notifs.filter((n) => !n.is_read).length);
     } catch (error) {
       console.error("Error fetching notifications:", error);
     } finally {
       setIsLoading(false);
     }
   }, []);
 
   const markAsRead = useCallback(async (notificationId: string) => {
     try {
       const { error } = await supabase
         .from("notifications")
         .update({ is_read: true })
         .eq("id", notificationId);
 
       if (error) throw error;
 
       setNotifications((prev) =>
         prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
       );
       setUnreadCount((prev) => Math.max(0, prev - 1));
     } catch (error) {
       console.error("Error marking notification as read:", error);
     }
   }, []);
 
   const markAllAsRead = useCallback(async () => {
     try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session?.user) return;
 
       const { error } = await supabase
         .from("notifications")
         .update({ is_read: true })
         .eq("user_id", session.user.id)
         .eq("is_read", false);
 
       if (error) throw error;
 
       setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
       setUnreadCount(0);
     } catch (error) {
       console.error("Error marking all as read:", error);
     }
   }, []);
 
   const deleteNotification = useCallback(async (notificationId: string) => {
     try {
       const notification = notifications.find((n) => n.id === notificationId);
       
       const { error } = await supabase
         .from("notifications")
         .delete()
         .eq("id", notificationId);
 
       if (error) throw error;
 
       setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
       if (notification && !notification.is_read) {
         setUnreadCount((prev) => Math.max(0, prev - 1));
       }
     } catch (error) {
       console.error("Error deleting notification:", error);
     }
   }, [notifications]);
 
   const clearAll = useCallback(async () => {
     try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session?.user) return;
 
       const { error } = await supabase
         .from("notifications")
         .delete()
         .eq("user_id", session.user.id);
 
       if (error) throw error;
 
       setNotifications([]);
       setUnreadCount(0);
     } catch (error) {
       console.error("Error clearing notifications:", error);
     }
   }, []);
 
   useEffect(() => {
     fetchNotifications();
 
     // Set up realtime subscription
     const setupRealtime = async () => {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session?.user) return;
 
       const channel = supabase
         .channel("notifications-realtime")
         .on(
           "postgres_changes",
           {
             event: "INSERT",
             schema: "public",
             table: "notifications",
             filter: `user_id=eq.${session.user.id}`,
           },
           (payload) => {
             const newNotification = payload.new as Notification;
             setNotifications((prev) => [newNotification, ...prev]);
             setUnreadCount((prev) => prev + 1);
             
             // Show toast for new notification
             toast(newNotification.title, {
               description: newNotification.message,
             });
           }
         )
         .subscribe();
 
       return () => {
         supabase.removeChannel(channel);
       };
     };
 
     setupRealtime();
   }, [fetchNotifications]);
 
   return {
     notifications,
     unreadCount,
     isLoading,
     markAsRead,
     markAllAsRead,
     deleteNotification,
     clearAll,
     refetch: fetchNotifications,
   };
 };
 
 // Helper function to create notifications
 export const createNotification = async (
   userId: string,
   title: string,
   message: string,
   type: string = "info",
   actionUrl?: string,
   metadata?: Record<string, string | number | boolean | null>
 ) => {
   try {
     const { error } = await supabase.from("notifications").insert([{
       user_id: userId,
       title,
       message,
       type,
       action_url: actionUrl || null,
       metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
     }]);
 
     if (error) throw error;
     return true;
   } catch (error) {
     console.error("Error creating notification:", error);
     return false;
   }
 };