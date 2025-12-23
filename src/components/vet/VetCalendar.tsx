import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Loader2, Syringe, Stethoscope, Microscope, MessageSquare } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday, isFuture, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  dogName: string;
  type: string;
  date: string;
  title: string;
}

const NOTE_TYPE_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  consulta: { icon: Stethoscope, color: "text-blue-600", bgColor: "bg-blue-500" },
  vacina: { icon: Syringe, color: "text-green-600", bgColor: "bg-green-500" },
  exame: { icon: Microscope, color: "text-purple-600", bgColor: "bg-purple-500" },
  observacao: { icon: MessageSquare, color: "text-amber-600", bgColor: "bg-amber-500" },
};

export const VetCalendar = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        // Get all active links with dog names
        const { data: links } = await supabase
          .from("vet_dog_links")
          .select("id, dog:dogs(name)")
          .eq("vet_user_id", user.id)
          .eq("status", "active");

        const linkIds = links?.map((l) => l.id) || [];
        const linkDogMap = new Map(
          links?.map((l) => [l.id, Array.isArray(l.dog) ? l.dog[0]?.name : l.dog?.name]) || []
        );

        if (linkIds.length === 0) {
          setEvents([]);
          setIsLoading(false);
          return;
        }

        // Get all notes with scheduled_date
        const { data: notes } = await supabase
          .from("vet_notes")
          .select("id, vet_dog_link_id, scheduled_date, note_type, title")
          .in("vet_dog_link_id", linkIds)
          .not("scheduled_date", "is", null)
          .order("scheduled_date", { ascending: true });

        const mappedEvents: CalendarEvent[] = (notes || []).map((note) => ({
          id: note.id,
          dogName: linkDogMap.get(note.vet_dog_link_id) || "Paciente",
          type: note.note_type,
          date: note.scheduled_date!,
          title: note.title,
        }));

        setEvents(mappedEvents);
      } catch (error) {
        console.error("Error fetching calendar events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), day));
  };

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-semibold capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h3>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const hasFutureEvents = dayEvents.some((e) => isFuture(new Date(e.date)) || isToday(new Date(e.date)));

            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={`
                  relative p-2 text-sm rounded-lg transition-colors min-h-[40px]
                  ${!inCurrentMonth ? "text-muted-foreground/40" : ""}
                  ${isToday(day) ? "bg-blue-100 dark:bg-blue-900/30 font-bold" : ""}
                  ${isSelected ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/50" : "hover:bg-muted"}
                `}
              >
                {format(day, "d")}
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((event, idx) => {
                      const config = NOTE_TYPE_CONFIG[event.type] || NOTE_TYPE_CONFIG.observacao;
                      return (
                        <div
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${config.bgColor}`}
                        />
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
          {Object.entries(NOTE_TYPE_CONFIG).map(([type, config]) => (
            <div key={type} className="flex items-center gap-1.5 text-xs">
              <div className={`w-2 h-2 rounded-full ${config.bgColor}`} />
              <span className="text-muted-foreground capitalize">{type}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Selected day events */}
      {selectedDate && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-500" />
            <p className="font-medium">
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum agendamento para este dia
            </p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((event) => {
                const config = NOTE_TYPE_CONFIG[event.type] || NOTE_TYPE_CONFIG.observacao;
                const Icon = config.icon;
                const isPast = !isFuture(new Date(event.date)) && !isToday(new Date(event.date));

                return (
                  <div
                    key={event.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      isPast ? "bg-muted/50 opacity-60" : "bg-muted"
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-background ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{event.dogName}</p>
                      <p className="text-xs text-muted-foreground truncate">{event.title}</p>
                    </div>
                    <Badge variant={isPast ? "secondary" : "outline"} className="text-xs">
                      {isPast ? "Passou" : "Agendado"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
