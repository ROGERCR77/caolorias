import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user?.id && lastLinkedUserId.current !== session.user.id) {
        lastLinkedUserId.current = session.user.id;
        setTimeout(() => setExternalUserId(session.user.id), 0);
      }
    });

    return () => subscription.unsubscribe();
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
