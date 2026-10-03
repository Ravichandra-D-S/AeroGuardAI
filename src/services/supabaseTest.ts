import { supabase } from '../lib/supabase';

export async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from('aircraft')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Supabase connection error:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  console.log('Supabase connection successful:', data);

  return {
    success: true,
    data,
  };
}