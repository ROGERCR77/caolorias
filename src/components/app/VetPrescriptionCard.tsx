import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Stethoscope, UtensilsCrossed } from "lucide-react";
import { FeatureGateBlur } from "@/components/app/FeatureGate";

interface PrescriptionItem {
  id: string;
  food_name: string;
  grams: number;
  meal_number: number;
}

interface Prescription {
  id: string;
  title: string;
  notes: string | null;
  total_kcal_target: number | null;
  meals_per_day: number;
  vet_name: string;
  items: PrescriptionItem[];
}

interface VetPrescriptionCardProps {
  dogId: string;
}

export function VetPrescriptionCard({ dogId }: VetPrescriptionCardProps) {
  const { user } = useAuth();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrescription = async () => {
      if (!user || !dogId) {
        setIsLoading(false);
        return;
      }

      try {
        // Get active vet links for this dog where tutor is current user
        const { data: links } = await supabase
          .from("vet_dog_links")
          .select("id, vet_user_id")
          .eq("dog_id", dogId)
          .eq("tutor_user_id", user.id)
          .eq("status", "active");

        if (!links || links.length === 0) {
          setIsLoading(false);
          return;
        }

        const linkIds = links.map((l) => l.id);
        const vetUserIds = links.map((l) => l.vet_user_id);

        // Get the most recent active prescription
        const { data: prescriptions } = await supabase
          .from("vet_prescriptions")
          .select("id, title, notes, total_kcal_target, meals_per_day, vet_user_id")
          .in("vet_dog_link_id", linkIds)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!prescriptions || prescriptions.length === 0) {
          setIsLoading(false);
          return;
        }

        const rx = prescriptions[0];

        // Fetch items for this prescription
        const { data: items } = await supabase
          .from("vet_prescription_items")
          .select("id, food_name, grams, meal_number")
          .eq("prescription_id", rx.id)
          .order("meal_number", { ascending: true });

        // Fetch vet name
        const { data: vetProfile } = await supabase
          .from("vet_profiles")
          .select("name")
          .eq("user_id", rx.vet_user_id)
          .single();

        setPrescription({
          id: rx.id,
          title: rx.title,
          notes: rx.notes,
          total_kcal_target: rx.total_kcal_target,
          meals_per_day: rx.meals_per_day,
          vet_name: vetProfile?.name || "Veterinario",
          items: (items as PrescriptionItem[]) || [],
        });
      } catch (error) {
        console.error("Error fetching vet prescription:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescription();
  }, [user, dogId]);

  if (isLoading) {
    return null;
  }

  if (!prescription) {
    return null;
  }

  // Group items by meal_number
  const itemsByMeal = prescription.items.reduce<Record<number, PrescriptionItem[]>>(
    (acc, item) => {
      const meal = item.meal_number;
      if (!acc[meal]) acc[meal] = [];
      acc[meal].push(item);
      return acc;
    },
    {}
  );

  const mealNumbers = Object.keys(itemsByMeal)
    .map(Number)
    .sort((a, b) => a - b);

  const content = (
    <Card className="border-blue-200/50 dark:border-blue-800/50">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <Stethoscope className="w-4 h-4 text-blue-500" />
          </div>
          <span className="flex-1">{prescription.title}</span>
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-200/50 text-[10px]">
            Recomendacao do Veterinario
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground ml-9">
          Dr(a). {prescription.vet_name}
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {prescription.total_kcal_target && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50">
            <UtensilsCrossed className="w-3 h-3 text-amber-600" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Meta: {prescription.total_kcal_target} kcal/dia ({prescription.meals_per_day} refeicoes)
            </span>
          </div>
        )}

        {mealNumbers.map((mealNum) => (
          <div key={mealNum} className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Refeicao {mealNum}
            </p>
            <div className="space-y-1">
              {itemsByMeal[mealNum].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <span className="text-sm">{item.food_name}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {item.grams}g
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}

        {prescription.notes && (
          <div className="p-2 rounded-lg bg-muted/30 border border-dashed">
            <p className="text-xs text-muted-foreground">{prescription.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <FeatureGateBlur
      feature="vet_prescriptions"
      overlayText="Prescricoes veterinarias disponivel no plano Premium"
    >
      {content}
    </FeatureGateBlur>
  );
}
