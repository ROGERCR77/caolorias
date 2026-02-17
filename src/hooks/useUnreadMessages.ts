import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useUnreadMessages(userId: string | undefined, role: "tutor" | "vet") {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      // First get active link IDs for this user
      const linkColumn = role === "tutor" ? "tutor_user_id" : "vet_user_id";
      const { data: links, error: linksError } = await supabase
        .from("vet_dog_links")
        .select("id")
        .eq(linkColumn, userId)
        .eq("status", "active");

      if (linksError || !links || links.length === 0) {
        setUnreadCount(0);
        return;
      }

      const linkIds = links.map((l) => l.id);

      // Count unread messages where sender is NOT this user
      const { count, error: countError } = await supabase
        .from("vet_messages")
        .select("*", { count: "exact", head: true })
        .in("vet_dog_link_id", linkIds)
        .neq("sender_user_id", userId)
        .is("read_at", null);

      if (countError) {
        console.error("Error fetching unread messages:", countError);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error in useUnreadMessages:", error);
    }
  }, [userId, role]);

  useEffect(() => {
    fetchUnread();

    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  return { unreadCount, refetch: fetchUnread };
}
