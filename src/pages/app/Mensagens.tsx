import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, ArrowLeft, Dog, Stethoscope, Loader2 } from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VetProfile {
  name: string;
  crmv: string;
  uf: string;
  clinic_name: string | null;
}

interface Conversation {
  linkId: string;
  dogId: string;
  dogName: string;
  dogPhotoUrl: string | null;
  vetName: string;
  vetCrmv: string;
  vetUf: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface Message {
  id: string;
  vet_dog_link_id: string;
  sender_user_id: string;
  sender_role: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

const Mensagens = () => {
  const { user } = useAuth();
  const { dogs } = useData();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data: links, error: linksError } = await supabase
        .from("vet_dog_links")
        .select(`
          id,
          dog_id,
          vet_profile:vet_profiles!vet_dog_links_vet_profile_fkey(
            name, crmv, uf, clinic_name
          ),
          dog:dogs(id, name, photo_url)
        `)
        .eq("tutor_user_id", user.id)
        .eq("status", "active");

      if (linksError) throw linksError;
      if (!links || links.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      const linkIds = links.map((l) => l.id);

      // Fetch last message for each link
      const { data: allMessages } = await supabase
        .from("vet_messages")
        .select("vet_dog_link_id, content, created_at, sender_user_id, read_at")
        .in("vet_dog_link_id", linkIds)
        .order("created_at", { ascending: false });

      const convs: Conversation[] = links.map((link) => {
        const vet = Array.isArray(link.vet_profile) ? link.vet_profile[0] : link.vet_profile;
        const dog = Array.isArray(link.dog) ? link.dog[0] : link.dog;
        const linkMessages = (allMessages || []).filter(
          (m) => m.vet_dog_link_id === link.id
        );
        const lastMsg = linkMessages[0] || null;
        const unread = linkMessages.filter(
          (m) => m.sender_user_id !== user.id && !m.read_at
        ).length;

        return {
          linkId: link.id,
          dogId: dog?.id || "",
          dogName: dog?.name || "Cão",
          dogPhotoUrl: dog?.photo_url || null,
          vetName: vet?.name || "Veterinário",
          vetCrmv: vet?.crmv || "",
          vetUf: vet?.uf || "",
          lastMessage: lastMsg?.content || null,
          lastMessageAt: lastMsg?.created_at || null,
          unreadCount: unread,
        };
      });

      // Sort by last message date (most recent first)
      convs.sort((a, b) => {
        if (!a.lastMessageAt && !b.lastMessageAt) return 0;
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      setConversations(convs);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Erro ao carregar conversas",
        description: "Tente recarregar a página.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (linkId: string) => {
    if (!user) return;

    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("vet_messages")
        .select("*")
        .eq("vet_dog_link_id", linkId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      const unreadIds = (data || [])
        .filter((m) => m.sender_user_id !== user.id && !m.read_at)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from("vet_messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unreadIds);

        // Update conversation unread count locally
        setConversations((prev) =>
          prev.map((c) =>
            c.linkId === linkId ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  // Open conversation
  const openConversation = (linkId: string) => {
    setSelectedLinkId(linkId);
    fetchMessages(linkId);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!user || !selectedLinkId || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("vet_messages").insert({
        vet_dog_link_id: selectedLinkId,
        sender_user_id: user.id,
        sender_role: "tutor",
        content: newMessage.trim(),
      });

      if (error) throw error;

      // Get the vet user ID for push notification
      const conv = conversations.find((c) => c.linkId === selectedLinkId);
      if (conv) {
        const { data: linkData } = await supabase
          .from("vet_dog_links")
          .select("vet_user_id")
          .eq("id", selectedLinkId)
          .single();

        if (linkData) {
          try {
            await supabase.functions.invoke("send-push-notification", {
              body: {
                user_id: linkData.vet_user_id,
                title: "Nova mensagem do tutor",
                message: `Mensagem sobre ${conv.dogName}: ${newMessage.trim().substring(0, 100)}`,
                data: {
                  type: "vet_message",
                  link_id: selectedLinkId,
                },
              },
            });
          } catch (pushError) {
            console.error("Error sending push notification:", pushError);
          }
        }
      }

      setNewMessage("");
      fetchMessages(selectedLinkId);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return "Ontem " + format(date, "HH:mm");
    return format(date, "dd/MM HH:mm", { locale: ptBR });
  };

  const formatConversationDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = parseISO(dateStr);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return "Ontem";
    return format(date, "dd/MM", { locale: ptBR });
  };

  const selectedConversation = conversations.find(
    (c) => c.linkId === selectedLinkId
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="page-container flex flex-col items-center justify-center gap-items">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando mensagens...</p>
        </div>
      </AppLayout>
    );
  }

  // Conversation detail view
  if (selectedLinkId && selectedConversation) {
    return (
      <AppLayout>
        <div className="flex flex-col h-[calc(100vh-160px)]">
          {/* Conversation Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedLinkId(null);
                setMessages([]);
                fetchConversations();
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Stethoscope className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {selectedConversation.vetName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                CRMV {selectedConversation.vetCrmv}/{selectedConversation.vetUf} - {selectedConversation.dogName}
              </p>
            </div>
          </div>

          {/* Messages Area */}
          {isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div ref={scrollRef} className="p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Nenhuma mensagem ainda. Inicie a conversa!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isTutor = msg.sender_role === "tutor";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isTutor ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                            isTutor
                              ? "bg-green-500 text-white rounded-br-md"
                              : "bg-blue-500 text-white rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isTutor ? "text-green-100" : "text-blue-100"
                            }`}
                          >
                            {formatMessageDate(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          )}

          {/* Message Input */}
          <div className="px-4 py-3 border-t bg-card">
            <div className="flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="flex-1 rounded-xl"
                maxLength={2000}
                disabled={isSending}
              />
              <Button
                size="icon"
                className="rounded-xl bg-green-500 hover:bg-green-600 shrink-0"
                onClick={handleSend}
                disabled={isSending || !newMessage.trim()}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Conversations list view
  return (
    <AppLayout>
      <div className="page-container page-content">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Mensagens</h1>
            <p className="text-sm text-muted-foreground">
              Converse com seus veterinários
            </p>
          </div>
        </div>

        {conversations.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Nenhuma conversa disponível.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Vincule um veterinário ao seu cão para começar.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Card
                key={conv.linkId}
                className="p-4 press-effect hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => openConversation(conv.linkId)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center overflow-hidden shrink-0">
                    <Stethoscope className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate">{conv.vetName}</p>
                      {conv.lastMessageAt && (
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {formatConversationDate(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Dog className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {conv.dogName}
                      </span>
                    </div>
                    {conv.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge className="bg-green-500 text-white shrink-0">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Mensagens;
