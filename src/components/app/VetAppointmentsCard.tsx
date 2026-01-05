import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isFuture, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Syringe, Stethoscope, Clock } from "lucide-react";

interface VetAppointment {
  id: string;
  title: string;
  note_type: string;
  scheduled_date: string;
  vet_name: string;
  dog_name: string;
}

const NOTE_TYPE_ICONS: Record<string, React.ReactNode> = {
  consulta: <Stethoscope className="w-4 h-4" />,
  vacina: <Syringe className="w-4 h-4" />,
};

const NOTE_TYPE_COLORS: Record<string, string> = {
  consulta: "bg-blue-500/10 text-blue-600",
  vacina: "bg-green-500/10 text-green-600",
};

export const VetAppointmentsCard = () => {
  const { user } = useAuth();
  const { selectedDogId, dogs } = useData();
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user || !selectedDogId) {
        setAppointments([]);
        setIsLoading(false);
        return;
      }

      try {
        // Get active vet links for this dog
        const { data: links } = await supabase
          .from("vet_dog_links")
          .select("id")
          .eq("dog_id", selectedDogId)
          .eq("tutor_user_id", user.id)
          .eq("status", "active");

        if (!links || links.length === 0) {
          setAppointments([]);
          setIsLoading(false);
          return;
        }

        const linkIds = links.map(l => l.id);

        // Get future scheduled notes
        const { data: notes } = await supabase
          .from("vet_notes")
          .select(`
            id,
            title,
            note_type,
            scheduled_date,
            vet_profile:vet_profiles!vet_notes_vet_profile_fkey(name)
          `)
          .in("vet_dog_link_id", linkIds)
          .not("scheduled_date", "is", null)
          .gte("scheduled_date", new Date().toISOString().split('T')[0])
          .order("scheduled_date", { ascending: true })
          .limit(5);

        if (notes) {
          const dog = dogs.find(d => d.id === selectedDogId);
          const formattedAppointments: VetAppointment[] = notes.map((note: any) => ({
            id: note.id,
            title: note.title,
            note_type: note.note_type,
            scheduled_date: note.scheduled_date,
            vet_name: Array.isArray(note.vet_profile) ? note.vet_profile[0]?.name : note.vet_profile?.name || "Veterinário",
            dog_name: dog?.name || "Cão",
          }));
          setAppointments(formattedAppointments);
        }
      } catch (error) {
        console.error("Error fetching vet appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [user, selectedDogId, dogs]);

  if (isLoading || appointments.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Próximos compromissos
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {appointments.map((appointment) => {
          const appointmentDate = parseISO(appointment.scheduled_date);
          const isAppointmentToday = isToday(appointmentDate);
          
          return (
            <div
              key={appointment.id}
              className={`p-3 rounded-xl ${isAppointmentToday ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${NOTE_TYPE_COLORS[appointment.note_type] || 'bg-muted'}`}>
                  {NOTE_TYPE_ICONS[appointment.note_type] || <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{appointment.title}</p>
                    {isAppointmentToday && (
                      <Badge className="bg-primary text-primary-foreground text-[10px]">
                        Hoje
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(appointmentDate, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dr(a). {appointment.vet_name}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
