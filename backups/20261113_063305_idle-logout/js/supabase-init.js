// ============================================
// KWATTA — Supabase Init
// ============================================
(function() {
  if (window.kwatta_db) return;

  const SUPABASE_URL = 'https://bbpbtepdlfmtijztwtxu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicGJ0ZXBkbGZtdGlqenR3dHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNzUyOTYsImV4cCI6MjEwNTk1MTI5Nn0.lrZGhc-9kmbguxIPNDWsUZ08Wl5OAYKbWQNcPpFkADo';

  if (window.supabase && window.supabase.createClient) {
    window.kwatta_db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[KWATTA] Supabase connecté');
  } else {
    console.error('[KWATTA] SDK Supabase non chargé');
  }
})();
