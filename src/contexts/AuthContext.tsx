import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useOneSignal } from "@/hooks/useOneSignal";
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

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

  useEffect(() => {
    let appListenerHandle: { remove: () => void } | null = null;

    // Set up auth state listener FIRST
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

    // Listener para quando o app volta do background (iOS/Android)
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appStateChange', async ({ isActive }) => {
        if (!isActive) return;
        console.log('[Auth] App became active, checking session...');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Tentar refresh para garantir token válido
            await supabase.auth.refreshSession();
          }
        } catch (error) {
          console.error('[Auth] Error refreshing on resume:', error);
          // NÃO limpar sessão aqui - pode ser erro de rede temporário
        }
      }).then((handle) => {
        appListenerHandle = handle;
      });
    }

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        // NÃO limpar sessão imediatamente - tentar refresh
        supabase.auth.refreshSession().then(({ data: { session: refreshedSession }, error: refreshError }) => {
          if (refreshError) {
            console.error("Error refreshing session:", refreshError);
            // NÃO limpar sessão aqui - deixar o listener resolver se houver sessão válida
          } else if (refreshedSession) {
            setSession(refreshedSession);
            setUser(refreshedSession?.user ?? null);
            if (refreshedSession?.user?.id && lastLinkedUserId.current !== refreshedSession.user.id) {
              lastLinkedUserId.current = refreshedSession.user.id;
              setTimeout(() => setExternalUserId(refreshedSession.user.id), 0);
            }
          }
          setIsLoading(false);
        });
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

    return () => {
      subscription.unsubscribe();
      // Cleanup do listener do Capacitor
      appListenerHandle?.remove();
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
