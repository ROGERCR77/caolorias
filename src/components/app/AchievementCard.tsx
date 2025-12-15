import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AchievementCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  index?: number;
}

export function AchievementCard({
  name,
  description,
  icon: Icon,
  category,
  unlocked,
  unlockedAt,
  progress = 0,
  index = 0,
}: AchievementCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          "transition-all duration-300 overflow-hidden",
          unlocked
            ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 shadow-lg"
            : "bg-muted/30 border-border/50 grayscale"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={cn(
                "p-3 rounded-xl transition-all relative",
                unlocked
                  ? "bg-gradient-hero text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="w-6 h-6" />
              {!unlocked && (
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-background">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "font-bold text-sm",
                  unlocked ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {name}
              </h3>
              <p
                className={cn(
                  "text-xs mt-0.5",
                  unlocked ? "text-muted-foreground" : "text-muted-foreground/70"
                )}
              >
                {description}
              </p>

              {/* Progress or Date */}
              {unlocked && unlockedAt ? (
                <p className="text-xs text-primary font-medium mt-2">
                  ✓ Desbloqueado em{" "}
                  {format(parseISO(unlockedAt), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              ) : (
                progress > 0 &&
                progress < 100 && (
                  <div className="mt-2 space-y-1">
                    <Progress value={progress} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground">
                      {Math.round(progress)}% completo
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
