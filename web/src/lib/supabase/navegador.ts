import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../../../supabase/database.types';
import { configSupabase } from './config';

// Cliente para Client Components. Sujeito ao RLS como qualquer usuário logado.
export function criarClienteNavegador() {
  const { url, chaveAnon } = configSupabase();
  return createBrowserClient<Database>(url, chaveAnon);
}
