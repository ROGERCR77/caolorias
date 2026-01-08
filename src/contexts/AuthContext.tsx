import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { supabase } from "@/lib/supabaseClient";
import { useOneSignal } from "@/hooks/useOneSignal";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setExternalUserId, removeExternalUserId } = useOneSignal();
  const lastLinkedUserId = useRef<string | null>(null);
  const appStateListenerRef = useRef<any>(null);

  useEffect(() => {
    // Set up auth state listener FIRST - this is the source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change:", event, session?.user?.id);
        
        // Handle token refresh errors
        if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully");
        }
        
        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setIsLoading(false);
          if (lastLinkedUserId.current) {
            lastLinkedUserId.current = null;
            setTimeout(() => removeExternalUserId(), 0);
          }
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Link/unlink OneSignal user
        if (session?.user?.id && lastLinkedUserId.current !== session.user.id) {
          lastLinkedUserId.current = session.user.id;
          setTimeout(() => setExternalUserId(session.user.id), 0);
        } else if (!session?.user && lastLinkedUserId.current) {
          lastLinkedUserId.current = null;
          setTimeout(() => removeExternalUserId(), 0);
        }
      }
    );

    // THEN check for existing session
    // NÃO limpar sessão se houver erro - onAuthStateChange é a fonte da verdade
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        // Não limpar sessão por erro transitório - apenas logar
        // onAuthStateChange vai atualizar o estado se necessário
        setIsLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user?.id && lastLinkedUserId.current !== session.user.id) {
        lastLinkedUserId.current = session.user.id;
        setTimeout(() => setExternalUserId(session.user.id), 0);
      }
    });

    // App state change listener (Capacitor) - registrado uma única vez
    if (Capacitor.isNativePlatform()) {
      // Inicializar listener de forma assíncrona
      App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive) {
          console.log("App became active, checking session...");
          
          try {
            // Verificar sessão atual
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error("Error getting session on app state change:", sessionError);
              // NÃO limpar sessão - erro pode ser transitório
              return;
            }
            
            if (session) {
              console.log("Session found, attempting refresh...");
              // Tentar refresh do token
              const { error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshError) {
                console.error("Error refreshing session on app state change:", refreshError);
                // NÃO limpar sessão - erro pode ser de rede transitório
                // onAuthStateChange vai lidar com isso
              } else {
                console.log("Session refreshed successfully");
              }
            }
          } catch (error) {
            console.error("Error in app state change handler:", error);
            // NUNCA limpar sessão em erro de rede
          }
        }
      }).then((listener) => {
        appStateListenerRef.current = listener;
      }).catch((error) => {
        console.error("Error setting up app state listener:", error);
      });
    }

    // Cleanup: unsubscribe de ambos os listeners
    return () => {
      subscription.unsubscribe();
      if (appStateListenerRef.current) {
        appStateListenerRef.current.remove().catch((error: any) => {
          console.error("Error removing app state listener:", error);
        });
        appStateListenerRef.current = null;
      }
    };
  }, [setExternalUserId, removeExternalUserId]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("E-mail ou senha incorretos.");
      }
      throw new Error(error.message);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
        },
      },
    });
    
    if (error) {
      if (error.message.includes("User already registered")) {
        throw new Error("Este e-mail já está cadastrado. Tente fazer login.");
      }
      throw new Error(error.message);
    }
  };

  const signInWithApple = async () => {
    const redirectUrl = `${window.location.origin}/app/hoje`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
      },
    });
    
    if (error) {
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    removeExternalUserId();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signInWithApple, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
