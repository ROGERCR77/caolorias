import { AppLayout } from "@/components/app/AppLayout";
import { AchievementCard } from "@/components/app/AchievementCard";
import { StreakCard } from "@/components/app/StreakCard";
import { useAchievements } from "@/hooks/useAchievements";
import { useData } from "@/contexts/DataContext";
import { Loader2, Trophy, Star, Flame, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const categoryLabels: Record<string, { label: string; icon: typeof Trophy }> = {
  general: { label: "Geral", icon: Star },
  meals: { label: "Alimentação", icon: Target },
  streak: { label: "Consistência", icon: Flame },
  dogs: { label: "Cães", icon: Target },
};

export default function Achievements() {
  const { achievements, isLoading, getIcon, streak } = useAchievements();
  const { dogs, selectedDogId } = useData();

  const selectedDog = dogs.find((d) => d.id === selectedDogId);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container page-content">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-accent" />
            Conquistas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unlockedCount} de {totalCount} desbloqueadas
          </p>
        </div>

        {/* Progress Summary */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Seu progresso</p>
                <p className="text-3xl font-black text-primary">
                  {Math.round((unlockedCount / totalCount) * 100)}%
                </p>
              </div>
              <div className="flex -space-x-2">
                {achievements
                  .filter((a) => a.unlocked)
                  .slice(0, 5)
                  .map((a) => {
                    const Icon = getIcon(a.icon);
                    return (
                      <div
                        key={a.id}
                        className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center border-2 border-background"
                      >
                        <Icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                    );
                  })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <StreakCard 
          currentStreak={streak} 
          longestStreak={streak} 
          dogName={selectedDog?.name} 
        />

        {/* Achievements by Category */}
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
          const categoryInfo = categoryLabels[category] || categoryLabels.general;
          const CategoryIcon = categoryInfo.icon;
          
          return (
            <div key={category} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <CategoryIcon className="w-4 h-4" />
                {categoryInfo.label}
              </h2>
              <div className="space-y-2">
                {categoryAchievements.map((achievement, index) => {
                  const Icon = getIcon(achievement.icon);
                  return (
                    <AchievementCard
                      key={achievement.id}
                      name={achievement.name}
                      description={achievement.description}
                      icon={Icon}
                      category={achievement.category}
                      unlocked={achievement.unlocked}
                      unlockedAt={achievement.unlocked_at}
                      progress={achievement.progress}
                      index={index}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
