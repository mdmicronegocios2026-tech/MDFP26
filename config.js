// ============================================
// MODO DEMO - Credenciales predefinidas
// ============================================

const DEMO_MODE = false; // setea en false para usar Supabase

// Credenciales de prueba
const DEMO_USERS = [
    { 
        id: '1', 
        email: 'admin@uniminuto.edu.co', 
        password: 'admin123', 
        nombre_completo: 'Administrador General', 
        rol: 'admin' 
    },
    { 
        id: '2', 
        email: 'carlos@uniminuto.edu.co', 
        password: 'evaluador123', 
        nombre_completo: 'Carlos González', 
        rol: 'evaluador' 
    },
    { 
        id: '3', 
        email: 'jimmy@uniminuto.edu.co', 
        password: 'evaluador123', 
        nombre_completo: 'Jimmy', 
        rol: 'evaluador' 
    },
    { 
        id: '4', 
        email: 'erika@uniminuto.edu.co', 
        password: 'evaluador123', 
        nombre_completo: 'Erika Velosa', 
        rol: 'evaluador' 
    },
    { 
        id: '5', 
        email: 'estefania@uniminuto.edu.co', 
        password: 'evaluador123', 
        nombre_completo: 'Estefanía', 
        rol: 'evaluador' 
    },
    { 
        id: '6', 
        email: 'paola@uniminuto.edu.co', 
        password: 'evaluador123', 
        nombre_completo: 'Paola', 
        rol: 'evaluador' 
    },
    { 
        id: '7', 
        email: 'jairo@uniminuto.edu.co', 
        password: 'evaluador123', 
        nombre_completo: 'Jairo', 
        rol: 'evaluador' 
    }
];

// Datos de prueba - Estudiantes del 2025
const DEMO_ESTUDIANTES = [
    { id: '1', cedula: '1014244875', nombre_completo: 'ALLISON YANINE RODRIGUEZ ROJAS', correo: 'allison.rodriguez@uniminuto.edu.co' },
    { id: '2', cedula: '35416339', nombre_completo: 'ADRIANA MARCELA MELO BOLIVAR', correo: 'adriana.melo@uniminuto.edu.co' },
    { id: '3', cedula: '1075654690', nombre_completo: 'ANA MARIA MONCADA RODRIGUEZ', correo: '' },
    { id: '4', cedula: '35423602', nombre_completo: 'ANDREA ALEJANDRA FINO RIAÑO', correo: 'andrea.fino@uniminuto.edu.co' },
    { id: '5', cedula: '20450458', nombre_completo: 'AURA CECILIA PACHÓN', correo: '' },
    { id: '6', cedula: '79688331', nombre_completo: 'DANIEL GUILLERMO HERNANDEZ PALACIO', correo: 'daniel.hernandez@uniminuto.edu.co' },
    { id: '7', cedula: '1075675630', nombre_completo: 'DANNA VANESA GÓMEZ CASTIBLANCO', correo: '' },
    { id: '8', cedula: '1003823079', nombre_completo: 'DAVID SANTIAGO GÓMEZ RODRÍGUEZ', correo: 'david.gomez@uniminuto.edu.co' },
    { id: '9', cedula: '1075655056', nombre_completo: 'DIANA IVETTE FAGUA GARCÍA', correo: '' },
    { id: '10', cedula: '52817689', nombre_completo: 'DIANA MERCEDES RUEDA GUTIÉRREZ', correo: 'diana.rueda@uniminuto.edu.co' },
    { id: '11', cedula: '1075688022', nombre_completo: 'DONAR ESTEBAN CORTES RODRIGUEZ', correo: '' },
    { id: '12', cedula: '35419227', nombre_completo: 'EDILMA TORRES MARTÍNEZ', correo: 'edilma.torres@uniminuto.edu.co' },
    { id: '13', cedula: '1075673293', nombre_completo: 'EDITH JOHANA GALINDO CASTRO', correo: '' },
    { id: '14', cedula: '35422107', nombre_completo: 'ELSA NEYITH SANTANA DÍAZ', correo: 'elsa.santana@uniminuto.edu.co' },
    { id: '15', cedula: '1075672658', nombre_completo: 'ESTEBAN ALIRIO ROJAS GARZÓN', correo: '' },
    { id: '16', cedula: '1075690353', nombre_completo: 'EVELYN TATIANA PACHÓN RINCÓN', correo: 'evelyn.pachon@uniminuto.edu.co' },
    { id: '17', cedula: '1075690247', nombre_completo: 'FABIAN GARCIA RINCON', correo: '' },
    { id: '18', cedula: '1072366576', nombre_completo: 'GERMAN FELIPE MONCADA ZAPATA', correo: 'german.moncada@uniminuto.edu.co' },
    { id: '19', cedula: '1075672728', nombre_completo: 'HEYDI PAOLA ORJUELA SALDAÑA', correo: '' },
    { id: '20', cedula: '53167958', nombre_completo: 'INGRID JHOANNA SANCHEZ RODRIGUEZ', correo: 'ingrid.sanchez@uniminuto.edu.co' }
];

// Inicializar cliente de Supabase
var supabaseClient; // Usamos un nombre diferente para evitar colisión con window.supabase
if (!DEMO_MODE) {
    const SUPABASE_URL = 'https://henboqdysxkslmejfzjv.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_5Xmex0MxZM2szmP2k0ofxw_GV7RXZyE';
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
