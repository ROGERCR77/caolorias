import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TABLES = [
  "profiles",
  "dogs",
  "foods",
  "meals",
  "meal_items",
  "meal_plans",
  "meal_plan_items",
  "weight_logs",
  "activity_logs",
  "energy_logs",
  "poop_logs",
  "health_records",
  "health_symptoms",
  "food_intolerances",
  "dietary_transitions",
  "transition_daily_logs",
  "recipes",
  "recipe_items",
  "favorite_meals",
  "favorite_meal_items",
  "reminders",
  "reminder_sends",
  "weekly_insights",
  "ai_insights_history",
  "user_subscriptions",
  "user_achievements",
  "user_streaks",
  "user_roles",
  "vet_profiles",
  "vet_dog_links",
  "vet_notes",
  "tutor_health_reports",
  "achievements",
  "dog_breed_reference",
  "food_reference",
  "food_macros_reference",
  "food_substitutions",
  "activity_reference",
  "plan_limits",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const result: Record<string, unknown[]> = {};
    const errors: string[] = [];

    await Promise.all(
      TABLES.map(async (table) => {
        try {
          let allData: unknown[] = [];
          let from = 0;
          const pageSize = 1000;
          while (true) {
            const { data: page, error: pageError } = await supabase
              .from(table)
              .select("*")
              .range(from, from + pageSize - 1);
            if (pageError) {
              errors.push(`${table}: ${pageError.message}`);
              break;
            }
            if (!page || page.length === 0) break;
            allData = allData.concat(page);
            if (page.length < pageSize) break;
            from += pageSize;
          }
          result[table] = allData;
        } catch (e) {
          errors.push(`${table}: ${e.message}`);
          result[table] = [];
        }
      })
    );

    const exportData = {
      exported_at: new Date().toISOString(),
      total_tables: TABLES.length,
      summary: Object.fromEntries(
        Object.entries(result).map(([k, v]) => [k, (v as unknown[]).length])
      ),
      errors: errors.length > 0 ? errors : undefined,
      data: result,
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="caolorias-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
