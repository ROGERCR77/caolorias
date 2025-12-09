export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          threshold: number | null
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          threshold?: number | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          threshold?: number | null
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          created_at: string
          dog_id: string
          duration_minutes: number
          id: string
          intensity: string
          logged_at: string
          notes: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dog_id: string
          duration_minutes: number
          id?: string
          intensity: string
          logged_at?: string
          notes?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          dog_id?: string
          duration_minutes?: number
          id?: string
          intensity?: string
          logged_at?: string
          notes?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_reference: {
        Row: {
          energia: string
          id: string
          minutos_max_dia: number
          minutos_min_dia: number
          observacao: string | null
          porte: string
        }
        Insert: {
          energia: string
          id?: string
          minutos_max_dia: number
          minutos_min_dia: number
          observacao?: string | null
          porte: string
        }
        Update: {
          energia?: string
          id?: string
          minutos_max_dia?: number
          minutos_min_dia?: number
          observacao?: string | null
          porte?: string
        }
        Relationships: []
      }
      ai_insights_history: {
        Row: {
          created_at: string
          dog_id: string
          id: string
          insights: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          dog_id: string
          id?: string
          insights: Json
          user_id: string
        }
        Update: {
          created_at?: string
          dog_id?: string
          id?: string
          insights?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_history_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      dietary_transitions: {
        Row: {
          created_at: string
          current_day: number
          dog_id: string
          id: string
          notes: string | null
          started_at: string
          status: string
          total_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_day?: number
          dog_id: string
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          total_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_day?: number
          dog_id?: string
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          total_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dog_breed_reference: {
        Row: {
          braquicefalico: boolean
          breed_name: string
          created_at: string | null
          descricao_resumida: string | null
          energia_padrao: string
          id: string
          peso_max_kg: number
          peso_min_kg: number
          porte: string
        }
        Insert: {
          braquicefalico?: boolean
          breed_name: string
          created_at?: string | null
          descricao_resumida?: string | null
          energia_padrao: string
          id?: string
          peso_max_kg: number
          peso_min_kg: number
          porte: string
        }
        Update: {
          braquicefalico?: boolean
          breed_name?: string
          created_at?: string | null
          descricao_resumida?: string | null
          energia_padrao?: string
          id?: string
          peso_max_kg?: number
          peso_min_kg?: number
          porte?: string
        }
        Relationships: []
      }
      dogs: {
        Row: {
          birth_date: string | null
          breed: string | null
          condicao_corporal: string | null
          created_at: string
          current_weight_kg: number | null
          feeding_type: string | null
          id: string
          meta_gramas_dia: number | null
          meta_kcal_dia: number | null
          name: string
          nivel_atividade: string | null
          objetivo: string | null
          photo_url: string | null
          size: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          breed?: string | null
          condicao_corporal?: string | null
          created_at?: string
          current_weight_kg?: number | null
          feeding_type?: string | null
          id?: string
          meta_gramas_dia?: number | null
          meta_kcal_dia?: number | null
          name: string
          nivel_atividade?: string | null
          objetivo?: string | null
          photo_url?: string | null
          size?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          breed?: string | null
          condicao_corporal?: string | null
          created_at?: string
          current_weight_kg?: number | null
          feeding_type?: string | null
          id?: string
          meta_gramas_dia?: number | null
          meta_kcal_dia?: number | null
          name?: string
          nivel_atividade?: string | null
          objetivo?: string | null
          photo_url?: string | null
          size?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      energy_logs: {
        Row: {
          created_at: string
          dog_id: string
          energy_level: string
          id: string
          logged_at: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dog_id: string
          energy_level: string
          id?: string
          logged_at?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dog_id?: string
          energy_level?: string
          id?: string
          logged_at?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      favorite_meal_items: {
        Row: {
          created_at: string
          favorite_meal_id: string
          food_id: string
          grams: number
          id: string
        }
        Insert: {
          created_at?: string
          favorite_meal_id: string
          food_id: string
          grams?: number
          id?: string
        }
        Update: {
          created_at?: string
          favorite_meal_id?: string
          food_id?: string
          grams?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_meal_items_favorite_meal_id_fkey"
            columns: ["favorite_meal_id"]
            isOneToOne: false
            referencedRelation: "favorite_meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_meals: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      food_intolerances: {
        Row: {
          created_at: string
          dog_id: string
          food_id: string | null
          food_name: string | null
          id: string
          notes: string | null
          reaction_type: string
          symptoms: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dog_id: string
          food_id?: string | null
          food_name?: string | null
          id?: string
          notes?: string | null
          reaction_type: string
          symptoms?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          dog_id?: string
          food_id?: string | null
          food_name?: string | null
          id?: string
          notes?: string | null
          reaction_type?: string
          symptoms?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      foods: {
        Row: {
          category: string | null
          created_at: string
          id: string
          kcal_per_100g: number | null
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          kcal_per_100g?: number | null
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          kcal_per_100g?: number | null
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_records: {
        Row: {
          applied_at: string
          created_at: string
          dog_id: string
          id: string
          name: string
          next_due_at: string | null
          notes: string | null
          photo_url: string | null
          type: string
          user_id: string
        }
        Insert: {
          applied_at: string
          created_at?: string
          dog_id: string
          id?: string
          name: string
          next_due_at?: string | null
          notes?: string | null
          photo_url?: string | null
          type: string
          user_id: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          dog_id?: string
          id?: string
          name?: string
          next_due_at?: string | null
          notes?: string | null
          photo_url?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      health_symptoms: {
        Row: {
          created_at: string
          dog_id: string
          id: string
          logged_at: string
          notes: string | null
          related_food_id: string | null
          severity: string
          symptoms: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          dog_id: string
          id?: string
          logged_at?: string
          notes?: string | null
          related_food_id?: string | null
          severity: string
          symptoms: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          dog_id?: string
          id?: string
          logged_at?: string
          notes?: string | null
          related_food_id?: string | null
          severity?: string
          symptoms?: string[]
          user_id?: string
        }
        Relationships: []
      }
      meal_items: {
        Row: {
          created_at: string
          food_id: string
          grams: number
          id: string
          kcal_estimated: number | null
          meal_id: string
        }
        Insert: {
          created_at?: string
          food_id: string
          grams?: number
          id?: string
          kcal_estimated?: number | null
          meal_id: string
        }
        Update: {
          created_at?: string
          food_id?: string
          grams?: number
          id?: string
          kcal_estimated?: number | null
          meal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_items: {
        Row: {
          categoria: string
          created_at: string
          food_id: string | null
          gramas_sugeridas: number
          id: string
          meal_plan_id: string
          refeicao_nome: string
          refeicao_ordem: number
        }
        Insert: {
          categoria: string
          created_at?: string
          food_id?: string | null
          gramas_sugeridas: number
          id?: string
          meal_plan_id: string
          refeicao_nome: string
          refeicao_ordem: number
        }
        Update: {
          categoria?: string
          created_at?: string
          food_id?: string | null
          gramas_sugeridas?: number
          id?: string
          meal_plan_id?: string
          refeicao_nome?: string
          refeicao_ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_items_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          ativo: boolean
          created_at: string
          dog_id: string
          id: string
          meta_gramas_dia_snapshot: number
          meta_kcal_dia_snapshot: number
          numero_refeicoes_dia: number
          objetivo: string
          observacoes: string | null
          percentual_carbo: number
          percentual_proteina: number
          percentual_vegetais: number
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dog_id: string
          id?: string
          meta_gramas_dia_snapshot: number
          meta_kcal_dia_snapshot: number
          numero_refeicoes_dia?: number
          objetivo: string
          observacoes?: string | null
          percentual_carbo?: number
          percentual_proteina?: number
          percentual_vegetais?: number
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dog_id?: string
          id?: string
          meta_gramas_dia_snapshot?: number
          meta_kcal_dia_snapshot?: number
          numero_refeicoes_dia?: number
          objetivo?: string
          observacoes?: string | null
          percentual_carbo?: number
          percentual_proteina?: number
          percentual_vegetais?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          date_time: string
          dog_id: string
          id: string
          title: string
          total_grams: number
          total_kcal_estimated: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date_time?: string
          dog_id: string
          id?: string
          title: string
          total_grams?: number
          total_kcal_estimated?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          date_time?: string
          dog_id?: string
          id?: string
          title?: string
          total_grams?: number
          total_kcal_estimated?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          created_at: string
          has_activity_recommendations: boolean
          has_advanced_alerts: boolean
          has_ai_features: boolean
          has_charts: boolean
          has_favorites: boolean
          has_multi_profile: boolean
          has_pdf_export: boolean
          has_recipes: boolean
          has_weight_history: boolean
          id: string
          max_dogs: number
          max_history_days: number
          max_meals_per_day: number
          plan_type: string
        }
        Insert: {
          created_at?: string
          has_activity_recommendations?: boolean
          has_advanced_alerts?: boolean
          has_ai_features?: boolean
          has_charts?: boolean
          has_favorites?: boolean
          has_multi_profile?: boolean
          has_pdf_export?: boolean
          has_recipes?: boolean
          has_weight_history?: boolean
          id?: string
          max_dogs?: number
          max_history_days?: number
          max_meals_per_day?: number
          plan_type: string
        }
        Update: {
          created_at?: string
          has_activity_recommendations?: boolean
          has_advanced_alerts?: boolean
          has_ai_features?: boolean
          has_charts?: boolean
          has_favorites?: boolean
          has_multi_profile?: boolean
          has_pdf_export?: boolean
          has_recipes?: boolean
          has_weight_history?: boolean
          id?: string
          max_dogs?: number
          max_history_days?: number
          max_meals_per_day?: number
          plan_type?: string
        }
        Relationships: []
      }
      poop_logs: {
        Row: {
          color: string
          created_at: string
          dog_id: string
          has_blood: boolean
          has_mucus: boolean
          id: string
          logged_at: string
          notes: string | null
          texture: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          dog_id: string
          has_blood?: boolean
          has_mucus?: boolean
          id?: string
          logged_at?: string
          notes?: string | null
          texture: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          dog_id?: string
          has_blood?: boolean
          has_mucus?: boolean
          id?: string
          logged_at?: string
          notes?: string | null
          texture?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_items: {
        Row: {
          created_at: string
          food_id: string
          grams: number
          id: string
          recipe_id: string
        }
        Insert: {
          created_at?: string
          food_id: string
          grams?: number
          id?: string
          recipe_id: string
        }
        Update: {
          created_at?: string
          food_id?: string
          grams?: number
          id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          servings: number | null
          total_grams: number | null
          total_kcal: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          servings?: number | null
          total_grams?: number | null
          total_kcal?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          servings?: number | null
          total_grams?: number | null
          total_kcal?: number | null
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          days_of_week: number[]
          dog_id: string | null
          enabled: boolean
          id: string
          time: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[]
          dog_id?: string | null
          enabled?: boolean
          id?: string
          time: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[]
          dog_id?: string | null
          enabled?: boolean
          id?: string
          time?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      transition_daily_logs: {
        Row: {
          completed: boolean
          created_at: string
          day_number: number
          id: string
          kibble_percentage: number
          logged_at: string
          natural_percentage: number
          notes: string | null
          symptoms: string[] | null
          transition_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          day_number: number
          id?: string
          kibble_percentage: number
          logged_at?: string
          natural_percentage: number
          notes?: string | null
          symptoms?: string[] | null
          transition_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          day_number?: number
          id?: string
          kibble_percentage?: number
          logged_at?: string
          natural_percentage?: number
          notes?: string | null
          symptoms?: string[] | null
          transition_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transition_daily_logs_transition_id_fkey"
            columns: ["transition_id"]
            isOneToOne: false
            referencedRelation: "dietary_transitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_insights: {
        Row: {
          created_at: string
          dog_id: string
          id: string
          insights_data: Json
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          dog_id: string
          id?: string
          insights_data: Json
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          dog_id?: string
          id?: string
          insights_data?: Json
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          date: string
          dog_id: string
          id: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          date?: string
          dog_id: string
          id?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          date?: string
          dog_id?: string
          id?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
