import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCardProps {
  currentStreak: number;
  longestStreak?: number;
  dogName?: string;
}

export function StreakCard({ currentStreak, longestStreak = 0, dogName }: StreakCardProps) {
  const getStreakLevel = () => {
    if (currentStreak >= 30) return { color: "text-red-500", bg: "from-red-500/20 to-orange-500/20", label: "Lendário!" };
    if (currentStreak >= 14) return { color: "text-orange-500", bg: "from-orange-500/20 to-yellow-500/20", label: "Incrível!" };
    if (currentStreak >= 7) return { color: "text-amber-500", bg: "from-amber-500/20 to-yellow-500/20", label: "Ótimo!" };
    if (currentStreak >= 3) return { color: "text-yellow-500", bg: "from-yellow-500/20 to-primary/20", label: "Continue!" };
    return { color: "text-accent", bg: "from-accent/10 to-primary/10", label: "Começando!" };
  };

  const streakLevel = getStreakLevel();
  const isNewRecord = currentStreak > 0 && currentStreak >= longestStreak;

  if (currentStreak < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.5 }}
    >
      <Card className={cn("bg-gradient-to-r border-accent/20 overflow-hidden", streakLevel.bg)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Fire Icon with Animation */}
            <motion.div
              className={cn("p-3 rounded-xl bg-background/50 backdrop-blur", streakLevel.color)}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Flame className="w-8 h-8" strokeWidth={2.5} />
            </motion.div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={cn("text-3xl font-black", streakLevel.color)}>
                  {currentStreak}
                </span>
                <span className="text-lg font-bold text-foreground">
                  dias seguidos!
                </span>
                {isNewRecord && currentStreak > 1 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20"
                  >
                    <Trophy className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-bold text-accent">RECORDE!</span>
                  </motion.div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {streakLevel.label} Continue registrando a alimentação{dogName ? ` de ${dogName}` : ""} 🔥
              </p>
              
              {longestStreak > 0 && longestStreak !== currentStreak && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Zap className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Recorde: {longestStreak} dias
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
