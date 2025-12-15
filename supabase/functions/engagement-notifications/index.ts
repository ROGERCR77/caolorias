import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Notification {
  user_id: string;
  title: string;
  message: string;
  category: string;
}

interface UserDogData {
  user_id: string;
  dog_id: string;
  dog_name: string;
  birth_date: string | null;
  is_puppy: boolean;
}

// ==================== NOTIFICATION GENERATORS ====================

async function checkMealNotifications(
  supabase: SupabaseClient,
  userDogs: UserDogData[],
  today: Date
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  
  for (const { user_id, dog_name } of userDogs) {
    const { data: lastMeal } = await supabase
      .from('meals')
      .select('date_time')
      .eq('user_id', user_id)
      .order('date_time', { ascending: false })
      .limit(1)
      .single();

    if (lastMeal) {
      const daysSinceMeal = Math.floor((today.getTime() - new Date(lastMeal.date_time).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceMeal >= 2 && daysSinceMeal < 7) {
        notifications.push({
          user_id,
          title: '🍖 Hora da refeição!',
          message: `${dog_name} está esperando o registro da refeição! Faz ${daysSinceMeal} dias.`,
          category: 'meal'
        });
      } else if (daysSinceMeal >= 7) {
        notifications.push({
          user_id,
          title: '🍖 Sentimos sua falta!',
          message: `Faz ${daysSinceMeal} dias que não registra refeições de ${dog_name}. Volte a acompanhar!`,
          category: 'meal'
        });
      }
    }
  }
  
  return notifications;
}

async function checkWeightNotifications(
  supabase: SupabaseClient,
  userDogs: UserDogData[],
  today: Date
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  
  for (const { user_id, dog_name } of userDogs) {
    const { data: lastWeight } = await supabase
      .from('weight_logs')
      .select('date')
      .eq('user_id', user_id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (lastWeight) {
      const daysSinceWeight = Math.floor((today.getTime() - new Date(lastWeight.date).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceWeight >= 7 && daysSinceWeight < 14) {
        notifications.push({
          user_id,
          title: '⚖️ Que tal pesar?',
          message: `Faz ${daysSinceWeight} dias que você não pesa ${dog_name}. Vamos atualizar?`,
          category: 'weight'
        });
      } else if (daysSinceWeight >= 14) {
        notifications.push({
          user_id,
          title: '⚖️ Hora de atualizar o peso!',
          message: `Já faz ${daysSinceWeight} dias! Pesar ${dog_name} regularmente ajuda a acompanhar a saúde.`,
          category: 'weight'
        });
      }
    }
  }
  
  return notifications;
}

async function checkHealthRecordNotifications(
  supabase: SupabaseClient,
  userDogs: UserDogData[],
  today: Date
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  
  const typeEmojis: Record<string, string> = {
    vacina: '💉',
    vermifugo: '💊',
    antipulgas: '🐜'
  };
  
  const typeNames: Record<string, string> = {
    vacina: 'Vacina',
    vermifugo: 'Vermífugo',
    antipulgas: 'Antipulgas'
  };
  
  for (const { user_id, dog_id, dog_name } of userDogs) {
    const { data: healthRecords } = await supabase
      .from('health_records')
      .select('type, name, next_due_at')
      .eq('dog_id', dog_id)
      .not('next_due_at', 'is', null)
      .order('next_due_at', { ascending: true });

    if (healthRecords) {
      for (const record of healthRecords) {
        if (!record.next_due_at) continue;
        
        const dueDate = new Date(record.next_due_at);
        const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        const emoji = typeEmojis[record.type] || '📋';
        const typeName = typeNames[record.type] || record.type;
        
        if (daysUntilDue === 7) {
          notifications.push({
            user_id,
            title: `${emoji} ${typeName} em 1 semana`,
            message: `${record.name} de ${dog_name} vence em 7 dias. Agende com o veterinário!`,
            category: 'health'
          });
        } else if (daysUntilDue === 3) {
          notifications.push({
            user_id,
            title: `${emoji} ${typeName} em 3 dias!`,
            message: `${record.name} de ${dog_name} vence em 3 dias. Não esqueça!`,
            category: 'health'
          });
        } else if (daysUntilDue === 0) {
          notifications.push({
            user_id,
            title: `${emoji} ${typeName} vence hoje!`,
            message: `Hoje é o dia de ${record.name} de ${dog_name}!`,
            category: 'health'
          });
        } else if (daysUntilDue < 0 && daysUntilDue >= -3) {
          notifications.push({
            user_id,
            title: `${emoji} ${typeName} atrasado!`,
            message: `${record.name} de ${dog_name} está ${Math.abs(daysUntilDue)} dias atrasado!`,
            category: 'health'
          });
        }
      }
    }
  }
  
  return notifications;
}

async function checkPoopNotifications(
  supabase: SupabaseClient,
  userDogs: UserDogData[],
  today: Date
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  for (const { user_id, dog_id, dog_name } of userDogs) {
    const { data: recentPoops } = await supabase
      .from('poop_logs')
      .select('texture, color, has_blood, has_mucus, logged_at')
      .eq('dog_id', dog_id)
      .gte('logged_at', threeDaysAgo.toISOString())
      .order('logged_at', { ascending: false });

    if (recentPoops && recentPoops.length >= 2) {
      // Check for persistent issues
      const abnormalTextures = recentPoops.filter(p => 
        p.texture === 'mole' || p.texture === 'liquida' || p.texture === 'muito_dura'
      );
      
      const hasBloodOrMucus = recentPoops.some(p => p.has_blood || p.has_mucus);
      
      if (abnormalTextures.length >= 2) {
        notifications.push({
          user_id,
          title: '💩 Atenção com as fezes',
          message: `${dog_name} teve fezes alteradas por ${abnormalTextures.length} dias seguidos. Vale observar!`,
          category: 'digestive'
        });
      }
      
      if (hasBloodOrMucus) {
        notifications.push({
          user_id,
          title: '⚠️ Alerta de saúde',
          message: `Fezes de ${dog_name} com sangue ou muco. Consulte o veterinário!`,
          category: 'digestive'
        });
      }
    }
  }
  
  return notifications;
}

async function checkSymptomNotifications(
  supabase: SupabaseClient,
  userDogs: UserDogData[],
  today: Date
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  for (const { user_id, dog_id, dog_name } of userDogs) {
    const { data: recentSymptoms } = await supabase
      .from('health_symptoms')
      .select('symptoms, severity, logged_at')
      .eq('dog_id', dog_id)
      .gte('logged_at', threeDaysAgo.toISOString())
      .order('logged_at', { ascending: false });

    if (recentSymptoms && recentSymptoms.length >= 2) {
      const severeSymptoms = recentSymptoms.filter(s => s.severity === 'alto');
      
      if (severeSymptoms.length >= 1) {
        notifications.push({
          user_id,
          title: '🏥 Sintomas persistentes',
          message: `${dog_name} apresentou sintomas severos recentemente. Consulte o veterinário!`,
          category: 'symptoms'
        });
      }
    }
  }
  
  return notifications;
}

async function checkEnergyNotifications(
  supabase: SupabaseClient,
  userDogs: UserDogData[],
  today: Date
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  for (const { user_id, dog_id, dog_name } of userDogs) {
    const { data: recentEnergy } = await supabase
      .from('energy_logs')
      .select('energy_level, logged_at')
      .eq('dog_id', dog_id)
      .gte('logged_at', threeDaysAgo.toISOString())
      .order('logged_at', { ascending: false });

    if (recentEnergy && recentEnergy.length >= 3) {
      const lowEnergyDays = recentEnergy.filter(e => e.energy_level === 'muito_quieto');
      
      if (lowEnergyDays.length >= 3) {
        notifications.push({
          user_id,
          title: '😴 Energia baixa',
          message: `${dog_name} está quieto há ${lowEnergyDays.length} dias. Pode ser um sinal de que algo não está bem.`,
          category: 'energy'
        });
      }
    }
  }
  
  return notifications;
}

async function checkActivityNotifications(
  supabase: SupabaseClient,
  userDogs: UserDogData[],
  today: Date
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  
  for (const { user_id, dog_name } of userDogs) {
    const { data: lastActivity } = await supabase
      .from('activity_logs')
      .select('logged_at')
      .eq('user_id', user_id)
      .order('logged_at', { ascending: false })
      .limit(1)
      .single();

    if (lastActivity) {
      const daysSinceActivity = Math.floor((today.getTime() - new Date(lastActivity.logged_at).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceActivity >= 3 && daysSinceActivity < 7) {
        notifications.push({
          user_id,
          title: '🏃 Hora de se exercitar!',
          message: `Faz ${daysSinceActivity} dias que ${dog_name} não registra atividade. Que tal um passeio?`,
          category: 'activity'
        });
      }
    }
  }
  
  return notifications;
}

async function checkDietaryTransitionNotifications(
  supabase: SupabaseClient,
  userDogs: UserDogData[],
  today: Date
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  
  for (const { user_id, dog_id, dog_name } of userDogs) {
    const { data: activeTransition } = await supabase
      .from('dietary_transitions')
      .select('id, current_day, total_days, status, started_at')
      .eq('dog_id', dog_id)
      .eq('status', 'em_andamento')
      .single();

    if (activeTransition) {
      // Check if user logged today
      const todayStr = today.toISOString().split('T')[0];
      const { data: todayLog } = await supabase
        .from('transition_daily_logs')
        .select('id')
        .eq('transition_id', activeTransition.id)
        .eq('logged_at', todayStr)
        .single();

      if (!todayLog) {
        const naturalPercent = Math.min(100, Math.round((activeTransition.current_day / activeTransition.total_days) * 100));
        
        notifications.push({
          user_id,
          title: '🔄 Transição alimentar',
          message: `Dia ${activeTransition.current_day} de ${activeTransition.total_days} de ${dog_name}! Hoje: ${naturalPercent}% natural.`,
          category: 'transition'
        });
      }
    }
  }
  
  return notifications;
}

async function checkBirthdayNotifications(
  userDogs: UserDogData[],
  today: Date
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  
  for (const { user_id, dog_name, birth_date } of userDogs) {
    if (!birth_date) continue;
    
    const birthDateObj = new Date(birth_date);
    const birthMonth = birthDateObj.getMonth() + 1;
    const birthDay = birthDateObj.getDate();
    
    if (birthMonth === todayMonth && birthDay === todayDay) {
      const age = today.getFullYear() - birthDateObj.getFullYear();
      notifications.push({
        user_id,
        title: '🎂 Feliz aniversário!',
        message: `Hoje ${dog_name} completa ${age} ano${age > 1 ? 's' : ''}! Parabéns! 🎉`,
        category: 'birthday'
      });
    }
  }
  
  return notifications;
}

async function checkStreakNotifications(
  supabase: SupabaseClient,
  userDogs: UserDogData[],
  today: Date
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  
  for (const { user_id, dog_name } of userDogs) {
    const { data: streak } = await supabase
      .from('user_streaks')
      .select('current_streak, last_activity_date')
      .eq('user_id', user_id)
      .single();

    if (streak && streak.current_streak >= 3 && streak.last_activity_date) {
      const lastActivity = new Date(streak.last_activity_date);
      const daysSinceActivity = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceActivity === 1) {
        notifications.push({
          user_id,
          title: '🔥 Mantenha a sequência!',
          message: `Você está com ${streak.current_streak} dias seguidos! Registre algo de ${dog_name} para manter!`,
          category: 'gamification'
        });
      }
    }
  }
  
  return notifications;
}

async function checkPuppyTransitionNotifications(
  supabase: SupabaseClient,
  userDogs: UserDogData[],
  today: Date
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  
  for (const { user_id, dog_id, dog_name, birth_date, is_puppy } of userDogs) {
    if (!is_puppy || !birth_date) continue;
    
    const birthDateObj = new Date(birth_date);
    const ageInMonths = (today.getFullYear() - birthDateObj.getFullYear()) * 12 + 
                        (today.getMonth() - birthDateObj.getMonth());
    
    // Check if puppy is turning 12 months (within 7 days)
    if (ageInMonths >= 11 && ageInMonths <= 12) {
      const daysUntil12Months = Math.round(
        (new Date(birthDateObj.getFullYear() + 1, birthDateObj.getMonth(), birthDateObj.getDate()).getTime() - today.getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntil12Months === 7) {
        notifications.push({
          user_id,
          title: '🐕 Quase adulto!',
          message: `${dog_name} completará 12 meses em 1 semana! Hora de ajustar a alimentação para adulto.`,
          category: 'puppy_transition'
        });
      } else if (daysUntil12Months === 0) {
        notifications.push({
          user_id,
          title: '🎉 Parabéns! Seu filhote cresceu!',
          message: `${dog_name} completou 12 meses! Atualize o perfil para "adulto" e recalcule a meta alimentar.`,
          category: 'puppy_transition'
        });
        
        // Auto-update dog to not be a puppy anymore
        await supabase
          .from('dogs')
          .update({ is_puppy: false })
          .eq('id', dog_id);
      }
    }
  }
  
  return notifications;
}

async function checkCalorieNotifications(
  supabase: SupabaseClient,
  userDogs: UserDogData[],
  today: Date
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  for (const { user_id, dog_id, dog_name } of userDogs) {
    // Get dog's calorie goal
    const { data: dog } = await supabase
      .from('dogs')
      .select('meta_kcal_dia')
      .eq('id', dog_id)
      .single();

    if (!dog?.meta_kcal_dia) continue;

    // Get recent meals
    const { data: recentMeals } = await supabase
      .from('meals')
      .select('total_kcal_estimated, date_time')
      .eq('dog_id', dog_id)
      .gte('date_time', threeDaysAgo.toISOString());

    if (recentMeals && recentMeals.length >= 3) {
      // Group by day and sum calories
      const dailyCalories = new Map<string, number>();
      recentMeals.forEach(meal => {
        const day = new Date(meal.date_time).toISOString().split('T')[0];
        dailyCalories.set(day, (dailyCalories.get(day) || 0) + (meal.total_kcal_estimated || 0));
      });

      const days = Array.from(dailyCalories.values());
      const avgCalories = days.reduce((a, b) => a + b, 0) / days.length;
      const goalPercent = (avgCalories / dog.meta_kcal_dia) * 100;

      if (goalPercent > 120) {
        notifications.push({
          user_id,
          title: '📈 Acima da meta',
          message: `${dog_name} está comendo ${Math.round(goalPercent - 100)}% acima da meta calórica há 3 dias.`,
          category: 'nutrition'
        });
      } else if (goalPercent < 80) {
        notifications.push({
          user_id,
          title: '📉 Abaixo da meta',
          message: `${dog_name} está comendo ${Math.round(100 - goalPercent)}% abaixo da meta há 3 dias.`,
          category: 'nutrition'
        });
      }
    }
  }
  
  return notifications;
}

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('Missing OneSignal credentials');
      return new Response(
        JSON.stringify({ error: 'OneSignal not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const today = new Date();

    console.log('🔔 Starting comprehensive engagement notifications check...');

    // Get all users with their dogs
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, user_id, name, birth_date, is_puppy')
      .order('created_at', { ascending: true });

    if (dogsError) throw dogsError;

    // Create unique user-dog pairs (first dog per user for some notifications)
    const userDogs: UserDogData[] = [];
    const seenUsers = new Set<string>();
    
    dogs?.forEach(dog => {
      if (!seenUsers.has(dog.user_id)) {
        userDogs.push({
          user_id: dog.user_id,
          dog_id: dog.id,
          dog_name: dog.name,
          birth_date: dog.birth_date,
          is_puppy: dog.is_puppy || false
        });
        seenUsers.add(dog.user_id);
      }
    });

    console.log(`📊 Checking ${userDogs.length} users...`);

    // Run all notification checks in parallel
    const [
      mealNotifications,
      weightNotifications,
      healthNotifications,
      poopNotifications,
      symptomNotifications,
      energyNotifications,
      activityNotifications,
      transitionNotifications,
      birthdayNotifications,
      streakNotifications,
      calorieNotifications,
      puppyTransitionNotifications
    ] = await Promise.all([
      checkMealNotifications(supabase, userDogs, today),
      checkWeightNotifications(supabase, userDogs, today),
      checkHealthRecordNotifications(supabase, userDogs, today),
      checkPoopNotifications(supabase, userDogs, today),
      checkSymptomNotifications(supabase, userDogs, today),
      checkEnergyNotifications(supabase, userDogs, today),
      checkActivityNotifications(supabase, userDogs, today),
      checkDietaryTransitionNotifications(supabase, userDogs, today),
      checkBirthdayNotifications(userDogs, today),
      checkStreakNotifications(supabase, userDogs, today),
      checkCalorieNotifications(supabase, userDogs, today),
      checkPuppyTransitionNotifications(supabase, userDogs, today)
    ]);

    // Combine all notifications
    const allNotifications = [
      ...mealNotifications,
      ...weightNotifications,
      ...healthNotifications,
      ...poopNotifications,
      ...symptomNotifications,
      ...energyNotifications,
      ...activityNotifications,
      ...transitionNotifications,
      ...birthdayNotifications,
      ...streakNotifications,
      ...calorieNotifications,
      ...puppyTransitionNotifications
    ];

    // Deduplicate by user_id + category (max 1 per category per user)
    const uniqueNotifications = new Map<string, Notification>();
    allNotifications.forEach(n => {
      const key = `${n.user_id}-${n.category}`;
      if (!uniqueNotifications.has(key)) {
        uniqueNotifications.set(key, n);
      }
    });

    const notificationsToSend = Array.from(uniqueNotifications.values());

    console.log(`📬 Found ${notificationsToSend.length} notifications to send`);

    // Log breakdown by category
    const categoryCounts: Record<string, number> = {};
    notificationsToSend.forEach(n => {
      categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
    });
    console.log('📊 Breakdown:', JSON.stringify(categoryCounts));

    // Send notifications via OneSignal
    let sentCount = 0;
    const errors: string[] = [];

    for (const notification of notificationsToSend) {
      try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
          },
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            headings: { en: notification.title, pt: notification.title },
            contents: { en: notification.message, pt: notification.message },
            include_aliases: {
              external_id: [notification.user_id]
            },
            target_channel: "push",
            data: {
              category: notification.category
            }
          }),
        });

        const result = await response.json();
        
        if (response.ok) {
          sentCount++;
          console.log(`✅ [${notification.category}] Sent to ${notification.user_id}`);
        } else {
          const errorMsg = `Failed [${notification.category}] ${notification.user_id}: ${JSON.stringify(result)}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      } catch (err) {
        const errorMsg = `Error [${notification.category}] ${notification.user_id}: ${err}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`🎯 Completed: ${sentCount}/${notificationsToSend.length} sent`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        users_checked: userDogs.length,
        notifications_found: notificationsToSend.length,
        notifications_sent: sentCount,
        by_category: categoryCounts,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in engagement-notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
