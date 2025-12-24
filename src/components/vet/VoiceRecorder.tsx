import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type RecordingState = "idle" | "recording" | "processing" | "done";

interface TranscriptionResult {
  titulo: string;
  descricao: string;
  tipo_sugerido: "consulta" | "vacina" | "exame" | "observacao";
  data_retorno: string | null;
}

interface VoiceRecorderProps {
  onTranscriptionComplete: (result: TranscriptionResult) => void;
  disabled?: boolean;
}

export const VoiceRecorder = ({ onTranscriptionComplete, disabled }: VoiceRecorderProps) => {
  const { toast } = useToast();
  const [state, setState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Check for browser support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast({
          title: "Navegador não suportado",
          description: "Use Chrome, Edge ou Safari para gravar por voz.",
          variant: "destructive",
        });
        return;
      }

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "pt-BR";

      transcriptRef.current = "";

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          transcriptRef.current += finalTranscript;
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "no-speech") {
          toast({
            title: "Nenhuma fala detectada",
            description: "Tente falar mais perto do microfone.",
            variant: "destructive",
          });
        } else if (event.error === "not-allowed") {
          toast({
            title: "Microfone bloqueado",
            description: "Permita o acesso ao microfone nas configurações do navegador.",
            variant: "destructive",
          });
        }
        stopRecording();
      };

      recognition.onend = () => {
        // If we have a transcript and we're still in recording state, process it
        if (state === "recording" && transcriptRef.current.trim()) {
          processTranscription();
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setState("recording");
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          // Auto-stop after 2 minutes
          if (prev >= 120) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      toast({
        title: "Gravando...",
        description: "Fale agora. Clique novamente para parar.",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Erro ao iniciar gravação",
        description: "Verifique as permissões do microfone.",
        variant: "destructive",
      });
    }
  }, [toast, state]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (transcriptRef.current.trim()) {
      processTranscription();
    } else {
      setState("idle");
      toast({
        title: "Nenhuma fala detectada",
        description: "Tente novamente falando mais perto do microfone.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const processTranscription = async () => {
    setState("processing");
    
    try {
      const transcript = transcriptRef.current.trim();
      console.log("Sending transcript to AI:", transcript);

      const { data, error } = await supabase.functions.invoke("transcribe-vet-note", {
        body: {
          audioBase64: transcript,
          mimeType: "text/plain",
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to process transcription");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("Transcription result:", data);

      setState("done");
      
      toast({
        title: "Transcrição concluída! ✅",
        description: "Campos preenchidos automaticamente.",
      });

      onTranscriptionComplete(data);

      // Reset after a moment
      setTimeout(() => {
        setState("idle");
        setRecordingTime(0);
        transcriptRef.current = "";
      }, 2000);
    } catch (error) {
      console.error("Error processing transcription:", error);
      setState("idle");
      toast({
        title: "Erro ao processar áudio",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleClick = () => {
    if (state === "idle") {
      startRecording();
    } else if (state === "recording") {
      stopRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getButtonContent = () => {
    switch (state) {
      case "recording":
        return (
          <>
            <MicOff className="w-5 h-5" />
            <span>{formatTime(recordingTime)}</span>
          </>
        );
      case "processing":
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processando...</span>
          </>
        );
      case "done":
        return (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>Pronto!</span>
          </>
        );
      default:
        return (
          <>
            <Mic className="w-5 h-5" />
            <span>Gravar com voz</span>
          </>
        );
    }
  };

  const getButtonStyles = () => {
    switch (state) {
      case "recording":
        return "bg-red-500 hover:bg-red-600 text-white animate-pulse";
      case "processing":
        return "bg-amber-500 hover:bg-amber-600 text-white";
      case "done":
        return "bg-green-500 hover:bg-green-600 text-white";
      default:
        return "bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white";
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      className={`w-full gap-2 ${getButtonStyles()}`}
      onClick={handleClick}
      disabled={disabled || state === "processing" || state === "done"}
    >
      {getButtonContent()}
    </Button>
  );
};

// Add TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}
