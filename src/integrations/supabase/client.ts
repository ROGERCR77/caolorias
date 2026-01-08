// Ponte para o client unificado que usa o storage correto (Preferences no native, localStorage no web)
// Isso garante que qualquer import do caminho "errado" ainda use o client correto
export { supabase } from "@/lib/supabaseClient";