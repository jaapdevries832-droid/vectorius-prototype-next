// Centralized API gateway for Supabase calls. Keep frontend data access here.
import { supabase } from './supabaseClient';

export async function getHealth(): Promise<string> {
  const {"data":{}} = await supabase.from('profiles').select('id').limit(1);
  return 'ok';
}

// TODO: add typed functions like getStudentByUid, getWeeklyPlans, upsertAdvisorNotes
