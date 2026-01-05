import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import * as LucideIcons from "lucide-react";
import { toast } from "sonner";

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  threshold: number | null;
  unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
}

export function useAchievements() {
  const { user } = useAuth();
  const { meals, weightLogs, dogs } = useData();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAchievements = useCallback(async () => {
    if (!user) return;

    try {
      // Get all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .order("category", { ascending: true });

      if (achievementsError) throw achievementsError;

      // Get user's unlocked achievements
      const { data: userAchievements, error: userError } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      if (userError) throw userError;

      const unlockedIds = new Set(userAchievements?.map((ua) => ua.achievement_id));

      // Calculate progress for each achievement
      const achievementsWithStatus = allAchievements?.map((achievement) => {
        const unlocked = unlockedIds.has(achievement.id);
        const userAchievement = userAchievements?.find(
          (ua) => ua.achievement_id === achievement.id
        );

        let progress = 0;
        if (achievement.threshold && !unlocked) {
          // Calculate progress based on achievement type
          switch (achievement.code) {
            case "first_dog":
              progress = dogs.length > 0 ? 100 : 0;
              break;
            case "first_meal":
              progress = meals.length > 0 ? 100 : 0;
              break;
            case "week_streak":
              progress = Math.min(100, (getStreak() / 7) * 100);
              break;
            case "month_streak":
              progress = Math.min(100, (getStreak() / 30) * 100);
              break;
            case "weight_tracker":
              progress = Math.min(100, (weightLogs.length / (achievement.threshold || 10)) * 100);
              break;
            case "hundred_meals":
              progress = Math.min(100, (meals.length / 100) * 100);
              break;
            case "multi_dogs":
              progress = Math.min(100, (dogs.length / 3) * 100);
              break;
            default:
              progress = 0;
          }
        }

        return {
          ...achievement,
          unlocked,
          unlocked_at: userAchievement?.unlocked_at,
          progress: unlocked ? 100 : Math.round(progress),
        };
      }) || [];

      setAchievements(achievementsWithStatus);
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, meals, weightLogs, dogs]);

  const getStreak = useCallback(() => {
    if (meals.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sortedMeals = [...meals].sort(
      (a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date(today);
    
    const mealDates = new Set(
      sortedMeals.map((m) => {
        const d = new Date(m.date_time);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );

    while (true) {
      const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
      if (mealDates.has(dateKey)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [meals]);

  const unlockAchievement = async (achievementId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("user_achievements").insert({
        user_id: user.id,
        achievement_id: achievementId,
      });

      if (error && error.code !== "23505") throw error; // Ignore duplicate key error

      await loadAchievements();
    } catch (error) {
      console.error("Error unlocking achievement:", error);
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.Award;
  };

  // Auto-unlock achievements based on progress
  const checkAndUnlockAchievements = useCallback(async () => {
    if (!user || achievements.length === 0) return;

    const achievementsToUnlock: { id: string; name: string; icon: string }[] = [];

    for (const achievement of achievements) {
      if (achievement.unlocked) continue;

      let shouldUnlock = false;

      switch (achievement.code) {
        case "first_dog":
          shouldUnlock = dogs.length >= 1;
          break;
        case "first_meal":
          shouldUnlock = meals.length >= 1;
          break;
        case "week_streak":
          shouldUnlock = getStreak() >= 7;
          break;
        case "month_streak":
          shouldUnlock = getStreak() >= 30;
          break;
        case "weight_tracker":
          shouldUnlock = weightLogs.length >= (achievement.threshold || 10);
          break;
        case "hundred_meals":
          shouldUnlock = meals.length >= 100;
          break;
        case "multi_dogs":
          shouldUnlock = dogs.length >= 3;
          break;
      }

      if (shouldUnlock) {
        achievementsToUnlock.push({
          id: achievement.id,
          name: achievement.name,
          icon: achievement.icon,
        });
      }
    }

    // Unlock achievements and show toast
    for (const achievement of achievementsToUnlock) {
      try {
        const { error } = await supabase.from("user_achievements").insert({
          user_id: user.id,
          achievement_id: achievement.id,
        });

        if (!error || error.code === "23505") {
          const Icon = getIcon(achievement.icon);
          toast.success(`🏆 Conquista desbloqueada: ${achievement.name}!`, {
            duration: 4000,
          });
        }
      } catch (error) {
        console.error("Error unlocking achievement:", error);
      }
    }

    if (achievementsToUnlock.length > 0) {
      await loadAchievements();
    }
  }, [user, achievements, dogs, meals, weightLogs, getStreak, getIcon, loadAchievements]);

  const hasCheckedRef = useRef(false);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // Check for auto-unlock after achievements are loaded
  useEffect(() => {
    if (!isLoading && achievements.length > 0 && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      checkAndUnlockAchievements();
    }
  }, [isLoading, achievements, checkAndUnlockAchievements]);

  // Reset check flag when user data changes significantly
  useEffect(() => {
    hasCheckedRef.current = false;
  }, [meals.length, dogs.length, weightLogs.length]);

  return {
    achievements,
    isLoading,
    unlockAchievement,
    getIcon,
    streak: getStreak(),
    reload: loadAchievements,
    checkAndUnlockAchievements,
  };
}
