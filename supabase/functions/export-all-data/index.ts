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

    // Export storage files from dog-photos bucket
    let storageFiles: unknown[] = [];
    try {
      const { data: folders, error: storageError } = await supabase.storage
        .from("dog-photos")
        .list("", { limit: 10000 });
      if (storageError) {
        errors.push(`storage_dog_photos: ${storageError.message}`);
      } else if (folders) {
        for (const item of folders) {
          if (!item.metadata || item.id === null) {
            // It's a folder - list contents
            const { data: folderFiles } = await supabase.storage
              .from("dog-photos")
              .list(item.name, { limit: 10000 });
            if (folderFiles) {
              for (const file of folderFiles) {
                const path = `${item.name}/${file.name}`;
                const { data: urlData } = supabase.storage.from("dog-photos").getPublicUrl(path);
                storageFiles.push({
                  path,
                  folder: item.name,
                  name: file.name,
                  size: file.metadata?.size,
                  mimetype: file.metadata?.mimetype,
                  created_at: file.created_at,
                  public_url: urlData?.publicUrl,
                });
              }
            }
          } else {
            // Root-level file
            const { data: urlData } = supabase.storage.from("dog-photos").getPublicUrl(item.name);
            storageFiles.push({
              path: item.name,
              folder: null,
              name: item.name,
              size: item.metadata?.size,
              mimetype: item.metadata?.mimetype,
              created_at: item.created_at,
              public_url: urlData?.publicUrl,
            });
          }
        }
      }
    } catch (e) {
      errors.push(`storage_dog_photos: ${e.message}`);
    }

    // Export auth users (paginated)
    let authUsers: unknown[] = [];
    try {
      let page = 1;
      const perPage = 1000;
      while (true) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error) {
          errors.push(`auth_users: ${error.message}`);
          break;
        }
        if (!users || users.length === 0) break;
        authUsers = authUsers.concat(users);
        if (users.length < perPage) break;
        page++;
      }
    } catch (e) {
      errors.push(`auth_users: ${e.message}`);
    }

    // Export all public tables (paginated)
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
      total_auth_users: authUsers.length,
      total_storage_files: storageFiles.length,
      summary: Object.fromEntries(
        Object.entries(result).map(([k, v]) => [k, (v as unknown[]).length])
      ),
      errors: errors.length > 0 ? errors : undefined,
      auth_users: authUsers,
      storage_dog_photos: storageFiles,
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
