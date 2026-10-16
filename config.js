// ============================================
// CONFIGURACIÓN - FONDO PROGRESA 2026
// ============================================

// true  = modo demo (datos ficticios en memoria, requiere cargar demo-data.js en index.html)
// false = producción con Supabase
const DEMO_MODE = false;

// Cliente de Supabase. La anon key es pública por diseño: la seguridad real
// depende de las políticas RLS (Row Level Security) configuradas en Supabase.
var supabaseClient; // Nombre distinto a window.supabase para evitar colisión
if (!DEMO_MODE) {
    const SUPABASE_URL = 'https://henboqdysxkslmejfzjv.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_5Xmex0MxZM2szmP2k0ofxw_GV7RXZyE';
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error('No se pudo cargar la librería de Supabase (¿sin internet o bloqueada?).');
    }
}
