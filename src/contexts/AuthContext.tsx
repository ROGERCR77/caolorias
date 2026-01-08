import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
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

  useEffect(() => {
    let appListenerHandle: { remove: () => void } | null = null;

    // O onAuthStateChange vai disparar INITIAL_SESSION quando terminar
    // de verificar o storage - esse é o momento correto para setar isLoading=false
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change:", event, session?.user?.id);
        
        // INITIAL_SESSION = Supabase terminou de verificar storage
        // Pode ter sessão ou não, mas agora sabemos o estado real
        if (event === "INITIAL_SESSION") {
          console.log("[Auth] Initial session resolved:", session ? "HAS SESSION" : "NO SESSION");
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false); // SÓ aqui setamos isLoading=false
          
          if (session?.user?.id) {
            lastLinkedUserId.current = session.user.id;
            setTimeout(() => setExternalUserId(session.user.id), 0);
          }
          return;
        }
        
        // TOKEN_REFRESHED - atualizar sessão silenciosamente
        if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully");
          setSession(session);
          setUser(session?.user ?? null);
          return;
        }
        
        // SIGNED_IN após login manual
        if (event === "SIGNED_IN") {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user?.id && lastLinkedUserId.current !== session.user.id) {
            lastLinkedUserId.current = session.user.id;
            setTimeout(() => setExternalUserId(session.user.id), 0);
          }
          return;
        }
        
        // SIGNED_OUT
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
      }
    );

    // Listener para quando o app volta do background (iOS/Android)
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appStateChange', async ({ isActive }) => {
        if (!isActive) return;
        console.log('[Auth] App became active, refreshing session...');
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('[Auth] Error refreshing session on resume:', error);
          } else if (data.session) {
            console.log('[Auth] Session refreshed successfully on resume');
          }
        } catch (error) {
          console.error('[Auth] Error in refresh on resume:', error);
        }
      }).then((handle) => {
        appListenerHandle = handle;
      });
    }

    // REMOVIDO: getSession() que setava isLoading=false prematuramente
    // Agora confiamos apenas no INITIAL_SESSION do onAuthStateChange

    return () => {
      subscription.unsubscribe();
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
