// ============================================
// FONDO PROGRESA 2026 - APLICACIÓN PRINCIPAL
// ============================================

// ============================================
// SISTEMA DE NOTIFICACIONES TOAST
// Uso: toast.success('msg') | toast.error('msg') | toast.warning('msg') | toast.info('msg')
// ============================================
const toast = (() => {
    const ICONOS = {
        success: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error:   '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info:    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };
    const DURACION = { success: 4000, info: 4000, warning: 5500, error: 7000 };
    const MAX_VISIBLES = 4;
    let contenedor = null;

    function getContenedor() {
        if (!contenedor) {
            contenedor = document.createElement('div');
            contenedor.className = 'toast-container';
            contenedor.setAttribute('aria-live', 'polite');
            document.body.appendChild(contenedor);
        }
        return contenedor;
    }

    function cerrar(el) {
        if (!el || el.dataset.closing) return;
        el.dataset.closing = '1';
        el.classList.add('toast-hide');
        setTimeout(() => el.remove(), 300);
    }

    function mostrar(tipo, mensaje, duracion) {
        const cont = getContenedor();
        const ms = duracion || DURACION[tipo];

        // Limita la cantidad de toasts simultáneos
        const activos = cont.querySelectorAll('.toast:not([data-closing])');
        if (activos.length >= MAX_VISIBLES) cerrar(activos[0]);

        const el = document.createElement('div');
        el.className = `toast toast-${tipo}`;
        el.setAttribute('role', tipo === 'error' ? 'alert' : 'status');

        const icono = document.createElement('span');
        icono.className = 'toast-icon';
        icono.innerHTML = ICONOS[tipo];

        const texto = document.createElement('div');
        texto.className = 'toast-message';
        texto.textContent = mensaje; // textContent evita inyección de HTML

        const btn = document.createElement('button');
        btn.className = 'toast-close';
        btn.setAttribute('aria-label', 'Cerrar notificación');
        btn.innerHTML = '&times;';
        btn.onclick = () => cerrar(el);

        const barra = document.createElement('div');
        barra.className = 'toast-progress';
        barra.style.animationDuration = ms + 'ms';

        el.append(icono, texto, btn, barra);
        cont.appendChild(el);

        // Cierre automático (se pausa al pasar el mouse)
        let timer = setTimeout(() => cerrar(el), ms);
        let inicio = Date.now();
        let restante = ms;
        el.addEventListener('mouseenter', () => {
            clearTimeout(timer);
            restante -= Date.now() - inicio;
            barra.style.animationPlayState = 'paused';
        });
        el.addEventListener('mouseleave', () => {
            inicio = Date.now();
            timer = setTimeout(() => cerrar(el), Math.max(restante, 1000));
            barra.style.animationPlayState = 'running';
        });
        return el;
    }

    return {
        success: (m, d) => mostrar('success', m, d),
        error:   (m, d) => mostrar('error', m, d),
        warning: (m, d) => mostrar('warning', m, d),
        info:    (m, d) => mostrar('info', m, d)
    };
})();

// ============================================
// UTILIDADES: escape HTML, diálogo de confirmación y loader
// ============================================
function esc(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Reemplazo de window.confirm(). Uso: if (!await confirmar({ mensaje: '...' })) return;
function confirmar({ titulo = '¿Estás seguro?', mensaje = '', confirmarTexto = 'Confirmar', cancelarTexto = 'Cancelar', peligro = false } = {}) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay confirm-overlay';
        overlay.setAttribute('role', 'alertdialog');
        overlay.setAttribute('aria-modal', 'true');

        const caja = document.createElement('div');
        caja.className = 'confirm-box';

        const icono = document.createElement('div');
        icono.className = 'confirm-icon' + (peligro ? ' confirm-icon-danger' : '');
        icono.textContent = peligro ? '!' : '?';

        const h = document.createElement('h3');
        h.textContent = titulo;
        const p = document.createElement('p');
        p.textContent = mensaje;

        const acciones = document.createElement('div');
        acciones.className = 'confirm-actions';
        const btnCancelar = document.createElement('button');
        btnCancelar.className = 'btn btn-secondary';
        btnCancelar.textContent = cancelarTexto;
        const btnOk = document.createElement('button');
        btnOk.className = 'btn ' + (peligro ? 'btn-danger' : 'btn-primary');
        btnOk.textContent = confirmarTexto;
        acciones.append(btnCancelar, btnOk);

        caja.append(icono, h, p, acciones);
        overlay.appendChild(caja);

        const cerrarCon = (valor) => {
            document.removeEventListener('keydown', onKey);
            overlay.remove();
            resolve(valor);
        };
        const onKey = (e) => { if (e.key === 'Escape') cerrarCon(false); };
        document.addEventListener('keydown', onKey);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrarCon(false); });
        btnCancelar.onclick = () => cerrarCon(false);
        btnOk.onclick = () => cerrarCon(true);

        document.body.appendChild(overlay);
        btnCancelar.focus();
    });
}

// Pantalla de carga mientras se consultan datos
function mostrarCargando(visible, texto = 'Cargando datos...') {
    let el = document.getElementById('app-loader');
    if (!visible) { if (el) el.remove(); return; }
    if (el) return;
    el = document.createElement('div');
    el.id = 'app-loader';
    el.className = 'app-loader';
    el.innerHTML = '<div class="spinner"></div><div class="app-loader-text"></div>';
    el.querySelector('.app-loader-text').textContent = texto;
    document.body.appendChild(el);
}

// Traduce los errores de autenticación de Supabase
function traducirErrorAuth(err) {
    const msg = (err && err.message) || '';
    if (/invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
    if (/email not confirmed/i.test(msg)) return 'Debes confirmar tu correo antes de ingresar.';
    if (/failed to fetch|network/i.test(msg)) return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
    if (/too many requests|rate limit/i.test(msg)) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
    if (/supabaseClient|undefined|null/i.test(msg)) return 'No se pudo cargar el servicio de autenticación. Recarga la página.';
    return msg || 'Correo o contraseña incorrectos.';
}

// Estado global
let currentUser = null;
let userProfile = null;
let cursoActual = { id: '1', nombre: 'Fondo Progresa 2026', anio: 2026, semestre: 1 };
let estudiantes = DEMO_MODE ? [...DEMO_ESTUDIANTES] : [];
let evaluadores = [];
let allUsuarios = [];
let evaluaciones = [];
let asignaciones = DEMO_MODE ? [] : [];
let selectedStudent = null;
let evalValues = {};

// Criterios de evaluación con sus niveles y descripciones completas
const CRITERIOS = [
    { 
        key: 'resumen_ejecutivo', 
        nombre: 'Resumen Ejecutivo', 
        peso: 0.10,
        niveles: {
            5: 'Presenta un resumen ejecutivo ampliamente claro, descripción del proyecto concisa y coherente, reconoce su propósito y singularidad. Objetivos de corto, mediano y largo plazo claros y específicos. Explica de manera clara el problema o necesidad que se aborda y cómo el proyecto proporciona una solución alineada. Incluye el lienzo Canvas, el cual es coherente con su iniciativa.',
            4: 'Presenta un resumen claro y coherente, con objetivos definidos y explicación del problema, aunque con ligeros detalles faltantes.',
            3: 'Resumen general, con descripción y objetivos parcialmente claros; la explicación del problema o solución es superficial.',
            2: 'Resumen incompleto, con descripción poco coherente y objetivos vagos; la explicación del problema es confusa.',
            1: 'Presenta información mínima, sin claridad en objetivos ni en el problema que aborda.',
            0: 'No presenta resumen ejecutivo.'
        }
    },
    { 
        key: 'estudio_mercado', 
        nombre: 'Estudio de Mercado', 
        peso: 0.25,
        niveles: {
            5: 'Segmentación precisa y bien justificada, describe claramente mercado objetivo y cuantifica su tamaño. Define perfil de cliente ideal, analiza tres competidores directos e indirectos, estrategias de mercadeo bien alineadas, imagen corporativa completa (logo, slogan, etc.) y presenta claramente las acciones de validación de mercado.',
            4: 'Segmentación bien sustentada con mercado objetivo claro y perfil de cliente definido; analiza competidores y estrategias con pequeños vacíos; imagen corporativa y validación casi completas.',
            3: 'Segmentación aceptable, con descripción general del mercado y perfil del cliente; analiza menos competidores o estrategias superficiales; imagen corporativa parcial y validación poco clara.',
            2: 'Segmentación limitada, mercado objetivo vago; sin análisis suficiente de competidores o estrategias; imagen corporativa básica; validación mínima.',
            1: 'Presenta solo algunos datos aislados del mercado y cliente, sin análisis de competidores ni estrategias; imagen corporativa incompleta; sin validación.',
            0: 'No presenta segmentación de mercado.'
        }
    },
    { 
        key: 'estudio_tecnico', 
        nombre: 'Estudio Técnico', 
        peso: 0.20,
        niveles: {
            5: 'Estudio técnico completo y argumentado: ficha técnica precisa y bien estructurada, cálculos claros de capacidad de producción, localización justificada, proceso detallado en diagrama de flujo, recursos humanos, materiales y tecnológicos descritos, estructura administrativa definida, y normativa/legal totalmente presentada.',
            4: 'Estudio técnico bien elaborado, con ficha técnica clara, capacidad de producción y localización bien descritas, proceso y recursos completos con ligeros vacíos; normativa casi completa.',
            3: 'Estudio técnico aceptable, ficha técnica y cálculos generales, localización y proceso con detalles parciales, recursos y normativa mencionados superficialmente.',
            2: 'Estudio técnico incompleto, ficha técnica básica, cálculos poco claros, localización y proceso poco desarrollados, recursos y normativa muy limitados.',
            1: 'Presenta información muy mínima, sin cálculos claros ni detalles de proceso, localización, recursos o normativa.',
            0: 'No presenta estudio técnico.'
        }
    },
    { 
        key: 'estudio_financiero', 
        nombre: 'Estudio Financiero', 
        peso: 0.25,
        niveles: {
            5: 'Estudio financiero acertado y totalmente coherente con el ejercicio. Describe detalladamente la inversión requerida, en coherencia con el Fondo Progresa 2026; detalla capital y su distribución. Análisis completo de flujos de caja, ventas, rentabilidad y punto de equilibrio; coherente con simulador financiero.',
            4: 'Estudio financiero bien estructurado, con inversión y distribución claras, análisis de flujos y rentabilidad casi completos, coherente con simulador salvo pequeños detalles.',
            3: 'Estudio general, inversión descrita de forma básica, análisis de flujos, ventas o rentabilidad parcial, algunas inconsistencias con simulador.',
            2: 'Estudio incompleto, inversión vaga, análisis de flujos o rentabilidad limitado, inconsistencias notables.',
            1: 'Presenta información mínima, sin análisis sólido ni coherencia con simulador.',
            0: 'No presenta estudio financiero.'
        }
    },
    { 
        key: 'plan_implementacion', 
        nombre: 'Plan de Implementación', 
        peso: 0.10,
        niveles: {
            5: 'Plan de implementación muy bien detallado con cronograma claro y estructurado que incluye todas las etapas clave, responsables y fechas. Define al menos tres indicadores de éxito específicos, medibles y alineados con los objetivos del proyecto.',
            4: 'Plan bien estructurado con cronograma claro, etapas y responsables casi completos; tres indicadores de éxito en su mayoría medibles y alineados.',
            3: 'Plan general con cronograma básico, algunas etapas, responsables o fechas; define dos o tres indicadores medianamente medibles y alineados.',
            2: 'Plan incompleto; cronograma confuso o con pocas etapas; uno o dos indicadores poco específicos o poco medibles.',
            1: 'Presenta solo una idea de plan, sin cronograma detallado ni indicadores de éxito claros.',
            0: 'No presenta plan de implementación.'
        }
    },
    { 
        key: 'impactos', 
        nombre: 'Impactos Ambientales/Sociales/Económicos', 
        peso: 0.10,
        niveles: {
            5: 'Análisis exhaustivo con cifras concretas de los impactos ambientales, sociales y económicos. Demuestra comprensión profunda y propone soluciones claras para mitigar efectos negativos. Explica detalladamente el impacto del otorgamiento del beneficio para el emprendimiento.',
            4: 'Análisis completo con cifras en su mayoría concretas; buena comprensión; propone soluciones viables; explica adecuadamente el impacto del beneficio.',
            3: 'Análisis general con algunas cifras; comprensión aceptable; propone soluciones generales; menciona el impacto del beneficio de forma breve.',
            2: 'Análisis limitado, pocas cifras; comprensión débil; soluciones vagas; impacto del beneficio superficial.',
            1: 'Presenta información muy mínima, sin cifras ni soluciones; apenas menciona el impacto del beneficio.',
            0: 'No presenta análisis de impactos.'
        }
    }
];

// Máximo de formadores/evaluadores que se pueden asignar a un mismo estudiante
const MAX_EVALUADORES_POR_ESTUDIANTE = 2;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (isMobileDevice()) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('mobile-blocked').style.display = 'flex';
        return;
    }
    setupEventListeners();
    restaurarSesion();
});

// Si ya hay una sesión de Supabase activa, entra directo sin pedir login otra vez
async function restaurarSesion() {
    if (DEMO_MODE || typeof supabaseClient === 'undefined' || !supabaseClient) return;
    try {
        const { data } = await supabaseClient.auth.getSession();
        if (!data || !data.session) return;
        mostrarCargando(true, 'Restaurando sesión...');
        currentUser = data.session.user;
        await loadUserProfile();
        if (!userProfile) throw new Error('Sin perfil');
        await showMainScreen();
    } catch (err) {
        console.error('No se pudo restaurar la sesión:', err);
        currentUser = null;
        userProfile = null;
    } finally {
        mostrarCargando(false);
    }
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (window.innerWidth <= 768 && 'ontouchstart' in window);
}

function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('add-student-form').addEventListener('submit', handleAddStudent);
    const buscador = document.getElementById('dashboard-search');
    if (buscador) buscador.addEventListener('input', renderDashboardTable);
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
}

// ============================================
// AUTENTICACIÓN
// ============================================
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    
    btn.textContent = 'Ingresando...';
    btn.disabled = true;
    errorDiv.style.display = 'none';
    
    try {
        if (DEMO_MODE) {
            const user = DEMO_USERS.find(u => u.email === email && u.password === password);
            if (!user) throw new Error('Credenciales incorrectas');
            currentUser = { id: user.id, email: user.email };
            userProfile = { id: user.id, nombre_completo: user.nombre_completo, rol: user.rol };
        } else {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            currentUser = data.user;
            await loadUserProfile();
        }
        showMainScreen();
    } catch (err) {
        errorDiv.textContent = traducirErrorAuth(err);
        errorDiv.style.display = 'block';
    } finally {
        btn.textContent = 'Iniciar Sesión';
        btn.disabled = false;
    }
}

async function loadUserProfile() {
    if (DEMO_MODE) return;
    const { data } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    
    if (data) {
        userProfile = data;
    } else {
        const nombreTemp = currentUser.email.split('@')[0];
        const { data: nuevoPerfil, error } = await supabaseClient
            .from('usuarios')
            .insert({
                id: currentUser.id,
                email: currentUser.email,
                nombre_completo: nombreTemp,
                rol: 'evaluador'
            })
            .select()
            .single();
        
        if (!error && nuevoPerfil) {
            userProfile = nuevoPerfil;
        }
    }
}

async function signOut() {
    if (!DEMO_MODE) {
        await supabaseClient.auth.signOut();
    }
    currentUser = null;
    userProfile = null;
    document.getElementById('main-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
}

async function showMainScreen() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
    document.getElementById('user-name').textContent = userProfile?.nombre_completo || currentUser.email;
    document.getElementById('user-role').textContent = userProfile?.rol === 'admin' ? 'Administrador' : 'Evaluador';
    
    mostrarCargando(true);
    try {
        await loadData();
    } catch (err) {
        console.error(err);
        toast.error('No se pudieron cargar los datos: ' + err.message);
    } finally {
        mostrarCargando(false);
    }
    
    const nav = document.getElementById('main-nav');
    if (userProfile?.rol === 'evaluador') {
        nav.querySelectorAll('[data-view="estudiantes"], [data-view="asignaciones"], [data-view="dashboard"], [data-view="usuarios"], [data-view="exportar"]').forEach(el => el.style.display = 'none');
        switchView('evaluar');
    } else {
        nav.querySelectorAll('.nav-btn').forEach(el => el.style.display = 'block');
        nav.querySelector('[data-view="evaluar"]').style.display = 'none';
        switchView('dashboard');
    }
}

// ============================================
// NAVEGACIÓN
// ============================================
function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`view-${view}`).classList.add('active');
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    if (view === 'asignaciones') renderAsignaciones();
    if (view === 'estudiantes') renderStudentsTable();
    if (view === 'evaluar') showEvalList();
    if (view === 'usuarios') renderUsuariosSync();
}

// ============================================
// CARGA DE DATOS
// ============================================
async function loadData() {
    if (DEMO_MODE) {
        evaluadores = DEMO_USERS.filter(u => u.rol === 'evaluador');
        allUsuarios = [...DEMO_USERS];
        updateDashboard();
        return;
    }
    
    const { data: cursos } = await supabaseClient
        .from('cursos')
        .select('*')
        .eq('anio', 2026)
        .eq('estado', 'activo')
        .limit(1);
    
    if (cursos && cursos.length > 0) {
        cursoActual = cursos[0];
    } else {
        const { data: nuevoCurso } = await supabaseClient
            .from('cursos')
            .insert({ nombre: 'Fondo Progresa 2026', anio: 2026, semestre: 1 })
            .select()
            .single();
        cursoActual = nuevoCurso;
    }
    
    await loadCursoData();
    updateDashboard();
}

async function loadCursoData() {
    if (DEMO_MODE) return;
    
    const [estRes, evalRes, allUsersRes, asigRes, evaRes] = await Promise.all([
        supabaseClient.from('estudiantes').select('*').eq('curso_id', cursoActual.id),
        supabaseClient.from('usuarios').select('*').eq('rol', 'evaluador'),
        supabaseClient.from('usuarios').select('*'),
        supabaseClient.from('asignaciones').select('*').eq('curso_id', cursoActual.id),
        supabaseClient.from('evaluaciones').select('*').eq('curso_id', cursoActual.id)
    ]);
    
    estudiantes = estRes.data || [];
    evaluadores = evalRes.data || [];
    allUsuarios = allUsersRes.data || [];
    asignaciones = asigRes.data || [];
    evaluaciones = evaRes.data || [];
}

// ============================================
// DASHBOARD
// ============================================
function updateDashboard() {
    document.getElementById('stat-estudiantes').textContent = estudiantes.length;
    document.getElementById('stat-evaluadores').textContent = evaluadores.length;
    document.getElementById('stat-evaluaciones').textContent = evaluaciones.length;
    document.getElementById('stat-completadas').textContent = evaluaciones.filter(e => e.estado === 'completada').length;
    
    renderDashboardTable();
}

function renderUsuariosSync() {
    const container = document.getElementById('view-usuarios');
    if (!container) return;
    
    const allUsers = allUsuarios.length > 0 ? [...allUsuarios] : [];
    
    container.innerHTML = `
        <h2>Gestión de Usuarios</h2>
        <div class="table-container">
            <div class="table-header">
                <h3>Usuarios del Sistema</h3>
                <p style="color:#666;font-size:0.85rem">Administra los roles de cada usuario registrado</p>
            </div>
            <div class="scroll-wrapper">
                <table class="sync-table">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Nombre</th>
                            <th>Rol Actual</th>
                            <th>Cambiar Rol</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allUsers.map(u => `
                            <tr>
                                <td>${esc(u.email)}</td>
                                <td>${esc(u.nombre_completo)}</td>
                                <td>
                                    <span class="status-badge ${u.rol === 'admin' ? 'status-admin' : 'status-eval'}">${u.rol === 'admin' ? 'Admin' : 'Evaluador'}</span>
                                </td>
                                <td>
                                    <select class="sync-role-select" data-user-id="${u.id}" onchange="cambiarRolUsuario('${u.id}', this.value)">
                                        <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Admin</option>
                                        <option value="evaluador" ${u.rol === 'evaluador' ? 'selected' : ''}>Evaluador</option>
                                    </select>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="info-banner">
            <strong>Nota:</strong> Si un usuario se crea nuevo en Auth pero no aparece aquí, simplemente pídele que inicie sesión una vez. El sistema creará su perfil automáticamente.
        </div>
    `;
}

async function cambiarRolUsuario(userId, nuevoRol) {
    if (currentUser && userId === currentUser.id && nuevoRol !== 'admin') {
        const ok = await confirmar({ titulo: 'Quitarte el rol de administrador', mensaje: 'Estás por quitarte tus propios permisos de administrador. Perderás acceso a esta sección. ¿Continuar?', confirmarTexto: 'Continuar', peligro: true });
        if (!ok) { renderUsuariosSync(); return; }
    }
    if (DEMO_MODE) {
        const user = allUsuarios.find(u => u.id === userId);
        if (user) user.rol = nuevoRol;
        toast.success('Rol actualizado');
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('usuarios')
            .update({ rol: nuevoRol })
            .eq('id', userId);
        
        if (error) throw error;
        
        const user = allUsuarios.find(u => u.id === userId);
        if (user) user.rol = nuevoRol;
        
        toast.success('Rol actualizado exitosamente');
        renderUsuariosSync();
    } catch (err) {
        toast.error('Error al actualizar rol: ' + err.message);
    }
}

function renderDashboardTable() {
    const tbody = document.getElementById('dashboard-table-body');
    tbody.innerHTML = '';
    
    const filtro = ((document.getElementById('dashboard-search') || {}).value || '').toLowerCase().trim();
    const lista = filtro
        ? estudiantes.filter(e => e.nombre_completo.toLowerCase().includes(filtro) || String(e.cedula).includes(filtro))
        : estudiantes;
    
    lista.forEach(est => {
        const evasEst = evaluaciones.filter(e => e.estudiante_id === est.id && e.estado === 'completada');
        const asignados = asignaciones.filter(a => a.estudiante_id === est.id).length;
        const totalEvaluadores = Math.max(asignados, 1);
        const sumaNotas = evasEst.reduce((sum, e) => sum + (e.nota_individual || 0), 0);
        const promedio = sumaNotas / totalEvaluadores;
        
        const evaluadoresNombres = evasEst.map(e => {
            const ev = evaluadores.find(u => u.id === e.evaluador_id);
            return ev ? ev.nombre_completo.split(' ')[0] : 'Desconocido';
        }).join(', ');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${esc(est.cedula)}</td>
            <td>${esc(est.nombre_completo)}</td>
            <td>${evasEst.length}/${MAX_EVALUADORES_POR_ESTUDIANTE}</td>
            <td><strong style="color:${promedio > 0 ? '#2e7d32' : '#f57c00'}">${promedio.toFixed(2)}</strong></td>
            <td style="font-size:0.85rem">${esc(evaluadoresNombres) || '-'}</td>
            <td>
                <button class="btn btn-primary btn-table-action" onclick="verDetalleEstudiante('${est.id}')">Ver Detalle</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if (!tbody.children.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${filtro ? 'Ningún estudiante coincide con la búsqueda.' : 'Aún no hay estudiantes registrados.'}</td></tr>`;
    }
}

// ============================================
// FUNCIONES DE ADMIN - GESTIÓN DE EVALUACIONES
// ============================================
function cerrarModal() {
    const modal = document.getElementById('modal-detalle');
    if (modal) modal.remove();
}

function verComentarioEval(evaluacionId) {
    const eva = evaluaciones.find(e => e.id === evaluacionId);
    verComentario(eva ? eva.comentario_global : '');
}

function verComentario(comentario) {
    const texto = esc(comentario || '');
    const existe = document.getElementById('modal-comentario');
    if (existe) existe.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-comentario';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '1100';
    modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
    modal.innerHTML = `
        <div class="modal-content--small">
            <h3 style="margin-bottom:1rem;color:#1a237e;">Comentario del Evaluador</h3>
            <div class="comment-body">${texto || 'No hay comentario disponible.'}</div>
            <br>
            <button class="btn btn-secondary" onclick="document.getElementById('modal-comentario').remove()" style="width:auto;padding:0.5rem 1rem">Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function verDetalleEstudiante(estudianteId) {
    const estudiante = estudiantes.find(e => e.id === estudianteId);
    if (!estudiante) return;
    
    const evasEst = evaluaciones.filter(e => e.estudiante_id === estudianteId);
    
    let html = `<h3>${esc(estudiante.nombre_completo)}</h3>`;
    html += `<p>Cédula: ${esc(estudiante.cedula)}</p>`;
    html += `<p>Evaluaciones: ${evasEst.length}/${MAX_EVALUADORES_POR_ESTUDIANTE}</p>`;
    html += `<br>`;
    
    if (evasEst.length === 0) {
        html += `<p style="color:#666">No hay evaluaciones registradas</p>`;
    } else {
        html += `<div class="scroll-wrapper"><table style="width:100%">
            <thead>
                <tr>
                    <th>Evaluador</th>
                    <th>Nota</th>
                    <th>Estado</th>
                    <th>Comentario</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>`;
        
        evasEst.forEach(eva => {
            const ev = evaluadores.find(u => u.id === eva.evaluador_id);
            const tieneComentario = eva.comentario_global && eva.comentario_global.trim().length > 0;
            html += `
                <tr>
                    <td>${ev ? esc(ev.nombre_completo) : 'Desconocido'}</td>
                    <td><strong>${eva.nota_individual ? eva.nota_individual.toFixed(2) : '-'}</strong></td>
                    <td><span class="badge ${eva.estado === 'completada' ? 'badge-success' : 'badge-warning'}">${eva.estado === 'completada' ? 'Completada' : 'Borrador'}</span></td>
                    <td>
                        ${tieneComentario 
                            ? `<button class="btn btn-primary btn-table-action" onclick="verComentarioEval('${eva.id}')">Ver Comentario</button>` 
                            : '<span style="color:#999; font-size:0.8rem;">Sin comentario</span>'}
                    </td>
                    <td>
                        <button class="btn btn-danger btn-table-action" onclick="eliminarEvaluacion('${eva.id}')">Eliminar</button>
                    </td>
                </tr>`;
        });
        
        html += `</tbody></table></div>`;
    }
    
    const asignadosAlEst = asignaciones.filter(a => a.estudiante_id === estudianteId);
    const idsQueEvalaron = evasEst.map(e => e.evaluador_id);
    const pendientes = asignadosAlEst.filter(a => !idsQueEvalaron.includes(a.evaluador_id));
    
    if (pendientes.length > 0) {
        html += `<div class="pending-box">
            <strong style="color:#e65100;">📋 Formadores Pendientes por Evaluar:</strong>
            <ul style="margin:0.5rem 0 0 1.2rem;padding:0;">`;
        pendientes.forEach(a => {
            const ev = evaluadores.find(u => u.id === a.evaluador_id);
            html += `<li style="margin-bottom:0.3rem;color:#333;">${ev ? esc(ev.nombre_completo) : 'Desconocido'} <span class="badge badge-warning" style="font-size:0.7rem;">Pendiente</span></li>`;
        });
        html += `</ul></div>`;
    }
    
    const asignadosModal = asignadosAlEst.length;
    const totalEvaluadoresModal = Math.max(asignadosModal, 1);
    const sumaNotasModal = evasEst.reduce((sum, e) => sum + (e.nota_individual || 0), 0);
    const promedio = sumaNotasModal / totalEvaluadoresModal;
    
    html += `<br><div class="nota-display">
        <div>Nota Final (Promedio)</div>
        <div class="nota-value">${promedio.toFixed(2)}</div>
    </div>`;
    
    cerrarModal();
    
    const modal = document.createElement('div');
    modal.id = 'modal-detalle';
    modal.className = 'modal-overlay';
    modal.addEventListener('click', function(e) { if (e.target === modal) cerrarModal(); });
    modal.innerHTML = `
        <div class="modal-content">
            ${html}
            <br>
            <button class="btn btn-secondary" onclick="cerrarModal()" style="width:auto;padding:0.5rem 1rem">Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function eliminarEvaluacion(evaluacionId) {
    if (!await confirmar({ titulo: 'Eliminar evaluación', mensaje: 'Esta acción no se puede deshacer. ¿Deseas eliminar esta evaluación?', confirmarTexto: 'Eliminar', peligro: true })) return;
    
    if (DEMO_MODE) {
        evaluaciones = evaluaciones.filter(e => e.id !== evaluacionId);
        cerrarModal();
        toast.success('Evaluación eliminada');
        updateDashboard();
        return;
    }
    
    try {
        const { error } = await supabaseClient.from('evaluaciones').delete().eq('id', evaluacionId);
        if (error) throw error;
        cerrarModal();
        toast.success('Evaluación eliminada');
        await loadCursoData();
        updateDashboard();
    } catch (err) {
        toast.error('Error al eliminar la evaluación: ' + err.message);
    }
}

// ============================================
// ESTUDIANTES
// ============================================
async function handleAddStudent(e) {
    e.preventDefault();
    const cedula = document.getElementById('new-cedula').value;
    const nombre = document.getElementById('new-nombre').value;
    const correo = document.getElementById('new-correo').value.trim();
    
    if (DEMO_MODE) {
        const newId = String(estudiantes.length + 1);
        estudiantes.push({ id: newId, cedula, nombre_completo: nombre, correo });
        document.getElementById('new-cedula').value = '';
        document.getElementById('new-nombre').value = '';
        document.getElementById('new-correo').value = '';
        renderStudentsTable();
        updateDashboard();
        toast.success('Estudiante agregado');
        return;
    }
    
    if (!cursoActual) {
        toast.warning('No hay curso activo');
        return;
    }
    
    const dataInsert = { cedula, nombre_completo: nombre, curso_id: cursoActual.id };
    if (correo) dataInsert.correo = correo;
    
    const { error } = await supabaseClient
        .from('estudiantes')
        .insert(dataInsert);
    
    if (error) {
        toast.error('Error: ' + error.message);
    } else {
        document.getElementById('new-cedula').value = '';
        document.getElementById('new-nombre').value = '';
        document.getElementById('new-correo').value = '';
        await loadCursoData();
        renderStudentsTable();
        updateDashboard();
    }
}

function renderStudentsTable() {
    const tbody = document.getElementById('students-table-body');
    tbody.innerHTML = '';
    
    estudiantes.forEach(est => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${esc(est.cedula)}</td>
            <td>${esc(est.nombre_completo)}</td>
            <td>${est.correo ? esc(est.correo) : '<span style="color:#999">-</span>'}</td>
            <td><button class="btn btn-danger btn-table-action" onclick="deleteStudent('${est.id}')">Eliminar Todo</button></td>
        `;
        tbody.appendChild(tr);
    });
    if (!tbody.children.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Aún no hay estudiantes registrados.</td></tr>';
    }
}

async function deleteStudent(id) {
    if (!await confirmar({ titulo: 'Eliminar estudiante', mensaje: 'Se borrarán también TODAS sus asignaciones y evaluaciones. Esta acción no se puede deshacer.', confirmarTexto: 'Eliminar todo', peligro: true })) return;
    
    if (DEMO_MODE) {
        estudiantes = estudiantes.filter(e => e.id !== id);
        evaluaciones = evaluaciones.filter(e => e.estudiante_id !== id);
        asignaciones = asignaciones.filter(e => e.estudiante_id !== id);
        renderStudentsTable();
        updateDashboard();
        toast.success('Estudiante eliminado.');
        return;
    }
    
    try {
        await supabaseClient.from('evaluaciones').delete().eq('estudiante_id', id);
        await supabaseClient.from('asignaciones').delete().eq('estudiante_id', id);
        
        const { error } = await supabaseClient.from('estudiantes').delete().eq('id', id);
        if (error) throw error;
        
        toast.success('Estudiante y todos sus registros eliminados correctamente.');
        await loadCursoData();
        renderStudentsTable();
        updateDashboard();
    } catch (err) {
        toast.error('Error al eliminar: ' + err.message);
    }
}

// ============================================
// EVALUACIONES (PARA PROFESORES)
// ============================================
function showEvalList() {
    document.getElementById('eval-list-view').style.display = 'block';
    document.getElementById('eval-form-view').style.display = 'none';
    renderEvalTable();
}

function showEvalFormById(estudianteId) {
    const est = estudiantes.find(e => e.id === estudianteId);
    if (est) showEvalForm(est);
}

function showEvalForm(estudiante) {
    selectedStudent = estudiante;
    evalValues = {};
    
    document.getElementById('eval-list-view').style.display = 'none';
    document.getElementById('eval-form-view').style.display = 'block';
    document.getElementById('eval-student-info').innerHTML = `<strong>${esc(estudiante.nombre_completo)}</strong>`;
    document.getElementById('comentario-global').value = '';
    
    const evaExistente = evaluaciones.find(e => 
        e.estudiante_id === estudiante.id && 
        e.evaluador_id === currentUser.id
    );
    
    if (evaExistente) {
        CRITERIOS.forEach(c => {
            if (evaExistente[`${c.key}_puntaje`] !== null) {
                evalValues[c.key] = evaExistente[`${c.key}_puntaje`];
            }
        });
        document.getElementById('comentario-global').value = evaExistente.comentario_global || '';
    }
    
    renderCriterios();
    updateNotaCalculada();
}

function renderEvalTable() {
    const tbody = document.getElementById('eval-students-table');
    tbody.innerHTML = '';
    
    estudiantes.forEach(est => {
        const estaAsignado = asignaciones.some(a => a.estudiante_id === est.id && a.evaluador_id === currentUser.id);
        const eva = evaluaciones.find(e => e.estudiante_id === est.id && e.evaluador_id === currentUser.id);
        
        if (!estaAsignado && !eva) return; 
        
        const completada = eva && eva.estado === 'completada';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="white-space:normal">${esc(est.nombre_completo)}</td>
            <td><span class="badge ${completada ? 'badge-success' : 'badge-warning'}">${completada ? 'Completada' : 'Pendiente'}</span></td>
            <td><strong>${completada ? eva.nota_individual.toFixed(2) : '-'}</strong></td>
            <td><button class="btn btn-primary btn-table-action" onclick="showEvalFormById('${est.id}')">${completada ? 'Ver/Editar' : 'Evaluar'}</button></td>
        `;
        tbody.appendChild(tr);
    });
    if (!tbody.children.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No tienes estudiantes asignados todavía.</td></tr>';
    }
}

function renderCriterios() {
    const container = document.getElementById('criterios-container');
    container.innerHTML = '';
    
    CRITERIOS.forEach(criterio => {
        const card = document.createElement('div');
        card.className = 'criterion-card';
        
        const valorActual = evalValues[criterio.key];
        const nivelEntero = valorActual !== undefined ? Math.floor(Math.min(5, Math.max(0, valorActual))) : null;
        const descripcionActual = nivelEntero !== null ? criterio.niveles[nivelEntero] : '';
        
        card.innerHTML = `
            <div class="criterion-header">
                <h3>${criterio.nombre}</h3>
                <span class="weight">${(criterio.peso * 100)}%</span>
            </div>
            <div class="level-selector" id="levels-${criterio.key}">
                ${[5,4,3,2,1,0].map(valor => `
                    <button class="level-btn ${nivelEntero === valor ? 'selected' : ''}" 
                        data-key="${criterio.key}" 
                        data-value="${valor}" 
                        onclick="selectLevel('${criterio.key}', ${valor})">
                        <div class="level-value">${valor}</div>
                        <div class="level-name">${getNombreNivel(valor)}</div>
                    </button>
                `).join('')}
            </div>
            <div class="decimal-input-row">
                <label>O puntaje decimal:</label>
                <input type="number" class="decimal-score-input" 
                    id="decimal-${criterio.key}"
                    min="0" max="5" step="0.1" 
                    value="${valorActual !== undefined ? valorActual : ''}"
                    placeholder="0.0 - 5.0"
                    onchange="updateDecimalScore('${criterio.key}', this.value)"
                    oninput="updateDecimalScore('${criterio.key}', this.value)">
            </div>
            <div class="${descripcionActual ? 'rubric-description' : 'rubric-description-empty'}" id="desc-${criterio.key}">
                <strong>${valorActual !== undefined ? 'Nivel ' + nivelEntero + ' - ' + getNombreNivel(nivelEntero) + ':' : 'Seleccione un nivel para ver la descripción:'}</strong>
                <p style="margin-top: 0.5rem; line-height: 1.5;">${descripcionActual || 'Haga clic en uno de los niveles arriba para ver la descripción de la rúbrica.'}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function getNombreNivel(valor) {
    const nombres = {
        5: 'Excelente',
        4: 'Bueno',
        3: 'Regular (3 a 3.9)',
        2: 'Insuficiente (2 a 2.9)',
        1: 'Mínimo (1 a 1.9)',
        0: 'No presenta'
    };
    return nombres[valor] || '';
}

function selectLevel(key, value) {
    evalValues[key] = value;
    
    document.querySelectorAll(`[data-key="${key}"]`).forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.value) === value);
    });
    
    const decimalInput = document.getElementById(`decimal-${key}`);
    if (decimalInput) decimalInput.value = value;
    
    updateRubricaDescription(key, value);
    updateNotaCalculada();
}

function updateDecimalScore(key, value) {
    let num = parseFloat(value);
    if (isNaN(num)) {
        delete evalValues[key];
        const decimalInput = document.getElementById(`decimal-${key}`);
        if (decimalInput) decimalInput.value = '';
        document.querySelectorAll(`[data-key="${key}"]`).forEach(btn => btn.classList.remove('selected'));
        updateRubricaDescription(key, null);
        updateNotaCalculada();
        return;
    }
    
    num = Math.min(5, Math.max(0, num));
    evalValues[key] = num;
    
    const nivelEntero = Math.floor(num);
    document.querySelectorAll(`[data-key="${key}"]`).forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.value) === nivelEntero);
    });
    
    updateRubricaDescription(key, num);
    updateNotaCalculada();
}

function updateRubricaDescription(key, value) {
    const criterio = CRITERIOS.find(c => c.key === key);
    const descDiv = document.getElementById(`desc-${key}`);
    if (!criterio || !descDiv) return;
    
    if (value === undefined || value === null) {
        descDiv.className = 'rubric-description-empty';
        descDiv.innerHTML = `
            <strong>Seleccione un nivel para ver la descripción:</strong>
            <p style="margin-top: 0.5rem; line-height: 1.5;">Haga clic en uno de los niveles arriba para ver la descripción de la rúbrica.</p>
        `;
        return;
    }
    
    const nivelEntero = Math.floor(Math.min(5, Math.max(0, value)));
    const descripcion = criterio.niveles[nivelEntero];
    descDiv.className = 'rubric-description';
    descDiv.innerHTML = `
        <strong>Nivel ${nivelEntero} - ${getNombreNivel(nivelEntero)}:</strong>
        <p style="margin-top: 0.5rem; line-height: 1.5;">${descripcion}</p>
    `;
}

function updateNotaCalculada() {
    let nota = 0;
    CRITERIOS.forEach(c => {
        if (evalValues[c.key] !== undefined) {
            nota += evalValues[c.key] * c.peso;
        }
    });
    document.getElementById('nota-calculada').textContent = nota.toFixed(2);
}

async function saveEvaluacion(estado) {
    if (!selectedStudent) return;
    
    if (DEMO_MODE) {
        const existingIndex = evaluaciones.findIndex(e => 
            e.estudiante_id === selectedStudent.id && 
            e.evaluador_id === currentUser.id
        );
        
        const evalData = {
            id: existingIndex >= 0 ? evaluaciones[existingIndex].id : String(evaluaciones.length + 1),
            estudiante_id: selectedStudent.id,
            evaluador_id: currentUser.id,
            curso_id: cursoActual.id,
            comentario_global: document.getElementById('comentario-global').value,
            estado,
            nota_individual: parseFloat(document.getElementById('nota-calculada').textContent)
        };
        
        CRITERIOS.forEach(c => {
            evalData[`${c.key}_puntaje`] = evalValues[c.key] || null;
        });
        
        if (existingIndex >= 0) {
            evaluaciones[existingIndex] = evalData;
        } else {
            evaluaciones.push(evalData);
        }
        
        toast.success('Evaluación guardada exitosamente');
        showEvalList();
        return;
    }
    
    const data = {
        estudiante_id: selectedStudent.id,
        evaluador_id: currentUser.id,
        curso_id: cursoActual.id,
        comentario_global: document.getElementById('comentario-global').value,
        estado
    };
    
    CRITERIOS.forEach(c => {
        data[`${c.key}_puntaje`] = evalValues[c.key] || null;
    });
    
    const evaExistente = evaluaciones.find(e => 
        e.estudiante_id === selectedStudent.id && 
        e.evaluador_id === currentUser.id
    );
    
    try {
        if (evaExistente) {
            await supabaseClient.from('evaluaciones').update(data).eq('id', evaExistente.id);
        } else {
            await supabaseClient.from('evaluaciones').insert(data);
        }
        
        await loadCursoData();
        toast.success('Evaluación guardada exitosamente');
        showEvalList();
    } catch (err) {
        toast.error('Error al guardar: ' + err.message);
    }
}

// ============================================
// ASIGNACIONES (NUEVA INTERFAZ MANUAL)
// ============================================
function getAsignacionesDeEstudiante(estudianteId) {
    return asignaciones.filter(a => a.estudiante_id === estudianteId);
}

function renderAsignaciones() {
    if (userProfile?.rol !== 'admin') return;
    
    const container = document.getElementById('view-asignaciones');
    
    container.innerHTML = `
        <h2>Asignación Manual de Evaluadores</h2>
        
        <div class="import-section">
            <div class="import-header">
                <h3>Importar Asignaciones desde Excel</h3>
                <p>Cargue un archivo .xlsx con las columnas: <strong>CÉDULA, NOMBRE ESTUDIANTE, FORMADOR 1, FORMADOR 2, CORREO (opcional)</strong></p>
            </div>
            <input type="file" id="import-asignaciones-file" accept=".xlsx,.xls" style="display:none" onchange="importarAsignacionesExcel(this)">
            <button class="btn btn-import" onclick="document.getElementById('import-asignaciones-file').click()">
                Importar desde Excel
            </button>
            <div id="import-preview-container" style="display:none; margin-top: 1.5rem;"></div>
        </div>
        
        <div class="assignment-card">
            <div class="assignment-header">
                <h3 style="margin: 0; color: #1a237e;">Nueva Asignación</h3>
                <p style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">Busque al estudiante y asígnele manualmente a su evaluador. Máximo ${MAX_EVALUADORES_POR_ESTUDIANTE} formadores por estudiante.</p>
            </div>
            
            <div class="assignment-form-row">
                <div class="assignment-form-field">
                    <label>Seleccionar Estudiante:</label>
                    <select id="manual-estudiante">
                        <option value="">-- Elija un estudiante --</option>
                        ${estudiantes.map(e => {
                            const count = getAsignacionesDeEstudiante(e.id).length;
                            const lleno = count >= MAX_EVALUADORES_POR_ESTUDIANTE;
                            return `<option value="${e.id}" ${lleno ? 'disabled' : ''}>${esc(e.nombre_completo)} - ${esc(e.cedula)} (${count}/${MAX_EVALUADORES_POR_ESTUDIANTE}${lleno ? ' - completo' : ''})</option>`;
                        }).join('')}
                    </select>
                </div>
                <div class="assignment-form-field">
                    <label>Seleccionar Evaluador:</label>
                    <select id="manual-evaluador">
                        <option value="">-- Elija un evaluador --</option>
                        ${evaluadores.map(e => `<option value="${e.id}">${esc(e.nombre_completo)}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <button class="btn btn-success" style="padding:0.75rem 2rem; height: 100%;" onclick="asignarManual()">Asignar Manualmente</button>
                </div>
            </div>
        </div>

        <div class="table-container">
            <div class="table-header">
                <h3>Estudiantes y sus Formadores Asignados</h3>
                <input type="text" id="asig-buscar" placeholder="Buscar estudiante o cédula..." 
                    style="padding:0.5rem 0.75rem;border:1px solid #ddd;border-radius:6px;min-width:0;width:100%;max-width:300px"
                    oninput="renderAsignacionesTabla()">
            </div>
            <div class="scroll-wrapper">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa; text-align: left;">
                            <th style="padding: 0.75rem 1rem; border-bottom: 2px solid #dee2e6;">Estudiante</th>
                            <th style="padding: 0.75rem 1rem; border-bottom: 2px solid #dee2e6;">Formadores Asignados</th>
                            <th style="padding: 0.75rem 1rem; border-bottom: 2px solid #dee2e6; text-align:center;">Cupos</th>
                        </tr>
                    </thead>
                    <tbody id="asignaciones-tbody-manual">
                        ${renderAsignacionesRows()}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderAsignacionesTabla() {
    const tbody = document.getElementById('asignaciones-tbody-manual');
    if (tbody) tbody.innerHTML = renderAsignacionesRows();
}

function renderAsignacionesRows() {
    if (estudiantes.length === 0) {
        return `<tr><td colspan="3" style="text-align:center; padding: 2rem; color:#666;">No hay estudiantes registrados todavía.</td></tr>`;
    }

    const filtro = (document.getElementById('asig-buscar')?.value || '').trim().toLowerCase();

    let sortedEst = [...estudiantes].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));

    if (filtro) {
        sortedEst = sortedEst.filter(e =>
            e.nombre_completo.toLowerCase().includes(filtro) ||
            String(e.cedula).toLowerCase().includes(filtro)
        );
    }

    if (sortedEst.length === 0) {
        return `<tr><td colspan="3" style="text-align:center; padding: 2rem; color:#666;">Ningún estudiante coincide con la búsqueda.</td></tr>`;
    }

    let html = '';

    sortedEst.forEach(est => {
        const asigs = getAsignacionesDeEstudiante(est.id);
        const count = asigs.length;

        let formadoresHtml;
        if (count === 0) {
            formadoresHtml = `<span style="color:#999; font-style:italic;">Sin formadores asignados</span>`;
        } else {
            formadoresHtml = asigs.map(a => {
                const ev = evaluadores.find(u => u.id === a.evaluador_id);
                if (!ev) return '';
                const evaCompletada = evaluaciones.some(e => e.estudiante_id === est.id && e.evaluador_id === ev.id && e.estado === 'completada');
                return `
                    <span class="evaluator-tag">
                        ${esc(ev.nombre_completo)}
                        <span class="badge ${evaCompletada ? 'badge-success' : 'badge-warning'}" style="font-size:0.7rem;">${evaCompletada ? 'Evaluado' : 'Pendiente'}</span>
                        <button onclick="desasignarEvaluador('${ev.id}', '${est.id}')"
                            ${evaCompletada ? 'disabled title="No se puede quitar porque ya tiene nota"' : 'title="Quitar asignación"'}
                            style="border:none;background:transparent;color:${evaCompletada ? '#bbb' : '#c62828'};cursor:${evaCompletada ? 'not-allowed' : 'pointer'};font-weight:bold;padding:0 0.15rem;font-size:0.9rem;line-height:1;">✕</button>
                    </span>`;
            }).join('');
        }

        const lleno = count >= MAX_EVALUADORES_POR_ESTUDIANTE;

        html += `
            <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 0.75rem 1rem; vertical-align:top;">
                    ${esc(est.nombre_completo)}<br><span style="color:#888; font-size:0.8rem;">CC ${esc(est.cedula)}</span>
                </td>
                <td style="padding: 0.75rem 1rem; vertical-align:top;">${formadoresHtml}</td>
                <td style="padding: 0.75rem 1rem; text-align:center; vertical-align:top;">
                    <span class="badge ${lleno ? 'badge-success' : (count > 0 ? 'badge-warning' : 'badge-danger')}">${count}/${MAX_EVALUADORES_POR_ESTUDIANTE}</span>
                </td>
            </tr>
        `;
    });

    return html;
}

async function asignarManual() {
    const estId = document.getElementById('manual-estudiante').value;
    const evId = document.getElementById('manual-evaluador').value;
    
    if(!estId || !evId) {
        toast.warning('Por favor seleccione tanto el estudiante como el evaluador.');
        return;
    }
    
    const existe = asignaciones.find(a => a.estudiante_id === estId && a.evaluador_id === evId);
    if(existe) {
        toast.warning('Este estudiante ya está asignado a ese evaluador.');
        return;
    }
    
    const asignadosActuales = getAsignacionesDeEstudiante(estId).length;
    if (asignadosActuales >= MAX_EVALUADORES_POR_ESTUDIANTE) {
        const est = estudiantes.find(e => e.id === estId);
        toast.warning(`${est ? est.nombre_completo : 'Este estudiante'} ya tiene el máximo de ${MAX_EVALUADORES_POR_ESTUDIANTE} formadores asignados. Quite una asignación existente antes de agregar otra.`);
        return;
    }
    
    await asignarEvaluador(evId, estId);
    toast.success('¡Asignación guardada con éxito!');
}

async function asignarEvaluador(evaluadorId, estudianteId) {
    if (getAsignacionesDeEstudiante(estudianteId).length >= MAX_EVALUADORES_POR_ESTUDIANTE) {
        toast.warning(`Este estudiante ya tiene el máximo de ${MAX_EVALUADORES_POR_ESTUDIANTE} formadores asignados.`);
        return;
    }
    
    if (DEMO_MODE) {
        asignaciones.push({
            id: String(Date.now()),
            estudiante_id: estudianteId,
            evaluador_id: evaluadorId,
            curso_id: cursoActual.id
        });
        renderAsignaciones();
        return;
    }
    
    try {
        const { error } = await supabaseClient.from('asignaciones').insert({
            evaluador_id: evaluadorId,
            estudiante_id: estudianteId,
            curso_id: cursoActual.id
        });
        if (error) throw error;
        await loadCursoData();
        renderAsignaciones();
    } catch (err) {
        toast.error('Error al asignar: ' + err.message);
    }
}

async function desasignarEvaluador(evaluadorId, estudianteId) {
    if (!await confirmar({ titulo: 'Quitar asignación', mensaje: '¿Seguro que deseas quitar la asignación de este evaluador?', confirmarTexto: 'Quitar', peligro: true })) return;
    
    if (DEMO_MODE) {
        asignaciones = asignaciones.filter(a => !(a.evaluador_id === evaluadorId && a.estudiante_id === estudianteId));
        renderAsignaciones();
        return;
    }
    
    try {
        const { error } = await supabaseClient.from('asignaciones').delete()
            .eq('evaluador_id', evaluadorId)
            .eq('estudiante_id', estudianteId);
        if (error) throw error;
        await loadCursoData();
        renderAsignaciones();
    } catch (err) {
        toast.error('Error al desasignar: ' + err.message);
    }
}

// ============================================
// IMPORTACIÓN DE ASIGNACIONES DESDE EXCEL
// ============================================
let importPreviewData = [];

function importarAsignacionesExcel(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            if (rows.length < 2) {
                toast.warning('El archivo está vacío o no tiene datos válidos.');
                return;
            }
            
            procesarArchivoAsignaciones(rows);
        } catch (err) {
            toast.error('Error al leer el archivo: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
    input.value = '';
}

function procesarArchivoAsignaciones(rows) {
    importPreviewData = [];
    
    const evaluadoresPorNombre = {};
    evaluadores.forEach(ev => {
        evaluadoresPorNombre[ev.nombre_completo.toLowerCase().trim()] = ev;
    });
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 3) continue;
        
        const cedula = String(row[0] || '').trim();
        const nombre = String(row[1] || '').trim();
        const formador1 = String(row[2] || '').trim();
        const formador2 = row.length > 3 ? String(row[3] || '').trim() : '';
        const correo = row.length > 4 ? String(row[4] || '').trim() : '';
        
        if (!cedula || !nombre || !formador1) continue;
        
        const estudianteExistente = estudiantes.find(e => String(e.cedula).trim() === cedula);
        
        const ev1Match = evaluadoresPorNombre[formador1.toLowerCase()];
        const ev2Match = formador2 ? evaluadoresPorNombre[formador2.toLowerCase()] : null;
        
        const errores = [];
        if (!ev1Match) errores.push(`Formador 1 "${formador1}" no encontrado`);
        if (formador2 && !ev2Match) errores.push(`Formador 2 "${formador2}" no encontrado`);
        
        importPreviewData.push({
            cedula,
            nombre,
            correo,
            formador1,
            formador2,
            estudianteExistente: !!estudianteExistente,
            estudianteId: estudianteExistente ? estudianteExistente.id : null,
            ev1: ev1Match || null,
            ev2: ev2Match || null,
            errores,
            ok: errores.length === 0
        });
    }
    
    if (importPreviewData.length === 0) {
        toast.warning('No se encontraron registros válidos en el archivo.');
        return;
    }
    
    renderPreviewImportacion();
}

function renderPreviewImportacion() {
    const container = document.getElementById('import-preview-container');
    const totalOk = importPreviewData.filter(r => r.ok).length;
    const totalErr = importPreviewData.filter(r => !r.ok).length;
    const totalNew = importPreviewData.filter(r => r.ok && !r.estudianteExistente).length;
    
    container.innerHTML = `
        <div class="import-header" style="margin-bottom:1rem">
            <h3>Vista Previa de Importación</h3>
            <p style="margin-top:0.5rem">
                <strong>${importPreviewData.length}</strong> registros encontrados — 
                <span class="status-badge status-ok">${totalOk} válidos</span>
                ${totalErr > 0 ? `<span class="status-badge status-err">${totalErr} con error</span>` : ''}
                ${totalNew > 0 ? `<span class="status-badge status-warn">${totalNew} estudiantes nuevos</span>` : ''}
            </p>
        </div>
        <div class="preview-scroll-wrapper">
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Cédula</th>
                        <th>Nombre Estudiante</th>
                        <th>Correo</th>
                        <th>Formador 1</th>
                        <th>Formador 2</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${importPreviewData.map((r, i) => {
                        const rowClass = r.ok ? (r.estudianteExistente ? 'preview-success' : 'preview-warn') : 'preview-error';
                        let statusHtml;
                        if (r.errores.length > 0) {
                            statusHtml = `<span class="status-badge status-err">${r.errores.join('; ')}</span>`;
                        } else if (r.estudianteExistente) {
                            statusHtml = `<span class="status-badge status-ok">Asignar</span>`;
                        } else {
                            statusHtml = `<span class="status-badge status-warn">Crear + Asignar</span>`;
                        }
                        return `
                            <tr class="${rowClass}">
                                <td>${i + 1}</td>
                                <td>${esc(r.cedula)}</td>
                                <td>${esc(r.nombre)}</td>
                                <td>${r.correo ? esc(r.correo) : '<span style="color:#999">-</span>'}</td>
                                <td>${r.ev1 ? esc(r.ev1.nombre_completo) : '<em style="color:#c62828">' + esc(r.formador1) + '</em>'}</td>
                                <td>${r.ev2 ? esc(r.ev2.nombre_completo) : (r.formador2 ? '<em style="color:#c62828">' + esc(r.formador2) + '</em>' : '-')}</td>
                                <td>${statusHtml}</td>
                            </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
        <div class="preview-actions">
            <button class="btn btn-secondary" onclick="cancelarImportacion()">Cancelar</button>
            <button class="btn btn-success" ${totalOk === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''} onclick="ejecutarImportacion()">
                Confirmar Importación (${totalOk} registros)
            </button>
        </div>
    `;
    container.style.display = 'block';
}

function cancelarImportacion() {
    importPreviewData = [];
    document.getElementById('import-preview-container').style.display = 'none';
}

async function ejecutarImportacion() {
    const registros = importPreviewData.filter(r => r.ok);
    if (registros.length === 0) return;
    
    let creados = 0;
    let asignacionesNuevas = 0;
    let asignacionesReemplazadas = 0;
    
    for (const reg of registros) {
        let estId = reg.estudianteId;
        
        if (!estId) {
            if (DEMO_MODE) {
                estId = String(estudiantes.length + 1);
                estudiantes.push({ id: estId, cedula: reg.cedula, nombre_completo: reg.nombre, correo: reg.correo || '' });
                creados++;
            } else {
                const dataEst = { cedula: reg.cedula, nombre_completo: reg.nombre, curso_id: cursoActual.id };
                if (reg.correo) dataEst.correo = reg.correo;
                const { data: nuevoEst, error: errEst } = await supabaseClient
                    .from('estudiantes')
                    .insert(dataEst)
                    .select()
                    .single();
                if (errEst) continue;
                estId = nuevoEst.id;
                estudiantes.push(nuevoEst);
                creados++;
            }
        }
        
        if (DEMO_MODE) {
            const asignCount = getAsignacionesDeEstudiante(estId).length;
            if (asignCount > 0) {
                asignaciones = asignaciones.filter(a => a.estudiante_id !== estId);
                asignacionesReemplazadas++;
            }
            if (reg.ev1) {
                asignaciones.push({ id: String(Date.now()) + 'a', estudiante_id: estId, evaluador_id: reg.ev1.id, curso_id: cursoActual.id });
                asignacionesNuevas++;
            }
            if (reg.ev2) {
                asignaciones.push({ id: String(Date.now()) + 'b', estudiante_id: estId, evaluador_id: reg.ev2.id, curso_id: cursoActual.id });
                asignacionesNuevas++;
            }
        } else {
            const asignActuales = getAsignacionesDeEstudiante(estId);
            if (asignActuales.length > 0) {
                await supabaseClient.from('asignaciones').delete().eq('estudiante_id', estId);
                asignacionesReemplazadas++;
            }
            const filas = [];
            if (reg.ev1) filas.push({ evaluador_id: reg.ev1.id, estudiante_id: estId, curso_id: cursoActual.id });
            if (reg.ev2) filas.push({ evaluador_id: reg.ev2.id, estudiante_id: estId, curso_id: cursoActual.id });
            if (filas.length > 0) {
                const { error } = await supabaseClient.from('asignaciones').insert(filas);
                if (!error) asignacionesNuevas += filas.length;
            }
        }
    }
    
    if (!DEMO_MODE) await loadCursoData();
    
    renderAsignaciones();
    
    toast.success(`Importación completada:\n• ${creados} estudiantes creados\n• ${asignacionesReemplazadas} asignaciones reemplazadas\n• ${asignacionesNuevas} asignaciones nuevas`);
    
    importPreviewData = [];
}

// ============================================
// EXPORTACIÓN EXCEL - CON BANNER INSTITUCIONAL
// ============================================

const BANNER_INSTITUCIONES = [
    { nombre: 'Fondo Progresa', sigla: 'FP' },
    { nombre: 'Alcaldía de Zipaquirá', sigla: 'AZ' },
    { nombre: 'Sec. Desarrollo Económico y Turismo', sigla: 'SDET' },
    { nombre: 'UNIMINUTO', sigla: 'U' },
    { nombre: 'E.P.E.', sigla: 'EPE' }
];

const COLORES = {
    fondoBanner: 'FF1A237E',
    textoBanner: 'FFFFFFFF',
    fondoSubtitulo: 'FF0D47A1',
    fondoFila: 'FFF5F5F5',
    borde: 'FFD0D0D0',
    notaVerde: 'FF2E7D32',
    fondoAlternado: 'FFE3F2FD'
};

function exportarExcel() {
    if (DEMO_MODE) {
        exportarMatrizGeneralDemo();
        toast.success('Archivo Excel exportado (datos demo)');
        return;
    }
    
    exportarMatrizGeneral();
    exportarFichasIndividuales();
    toast.success('Archivos Excel exportados exitosamente');
}

async function exportarMatrizGeneralDemo() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('EVALUACIÓN PLAN DE NEGOCIOS');
    
    ws.getColumn(1).width = 13.73;
    ws.getColumn(2).width = 47.18;
    ws.getColumn(3).width = 34.27;
    ws.getColumn(4).width = 141.27;
    
    ws.getRow(1).height = 45;
    ws.mergeCells('A1:D1');
    const bannerCell = ws.getCell('A1');
    bannerCell.value = '    FONDO PROGRESA    |    ALCALDÍA DE ZIPAQUIRÁ    |    SEC. DESARROLLO ECONÓMICO Y TURISMO    |    UNIMINUTO    |    E.P.E.    ';
    bannerCell.font = { bold: true, size: 12, color: { argb: COLORES.textoBanner } };
    bannerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoBanner } };
    
    ws.getRow(2).height = 25;
    ws.mergeCells('A2:D2');
    const subtituloCell = ws.getCell('A2');
    subtituloCell.value = 'Educación de calidad al alcance de todos | Corporación Universitaria Minuto de Dios';
    subtituloCell.font = { italic: true, size: 10, color: { argb: COLORES.textoBanner } };
    subtituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
    subtituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoSubtitulo } };
    
    ws.getRow(3).height = 5;
    ws.mergeCells('A3:D3');
    ws.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC107' } };
    
    ws.getRow(4).height = 15;
    
    ws.getRow(5).height = 40;
    ws.mergeCells('A5:D5');
    const titleCell = ws.getCell('A5');
    titleCell.value = 'FICHA GENERAL DE CALIFICACIÓN\nCOMENTARIO GLOBAL';
    titleCell.font = { bold: true, size: 14, color: { argb: COLORES.textoBanner } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoSubtitulo } };
    
    ws.getRow(6).height = 10;
    
    ws.mergeCells('A7:A8');
    ws.mergeCells('B7:B8');
    ws.mergeCells('C7:C8');
    ws.mergeCells('D7:D8');
    
    const headers = [
        { cell: 'A7', value: 'CÉDULA' },
        { cell: 'B7', value: 'NOMBRES Y APELLIDOS EMPRENDEDOR' },
        { cell: 'C7', value: 'NOTA PROMEDIO REVISIÓN PLAN DE NEGOCIOS' },
        { cell: 'D7', value: 'COMENTARIO GLOBAL (A DESTACAR, A MEJORAR Y VIABILIDAD DE LA INVERSIÓN)' }
    ];
    
    headers.forEach(h => {
        const cell = ws.getCell(h.cell);
        cell.value = h.value;
        cell.font = { bold: true, size: 11, color: { argb: COLORES.textoBanner } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoBanner } };
        cell.border = {
            top: { style: 'medium', color: { argb: COLORES.fondoBanner } },
            bottom: { style: 'medium', color: { argb: COLORES.fondoBanner } },
            left: { style: 'thin', color: { argb: COLORES.textoBanner } },
            right: { style: 'thin', color: { argb: COLORES.textoBanner } }
        };
    });
    ws.getRow(7).height = 25;
    ws.getRow(8).height = 25;
    
    let currentRow = 9;
    estudiantes.forEach((est, index) => {
        const evasEst = evaluaciones.filter(e => e.estudiante_id === est.id && e.estado === 'completada');
        const asignados = asignaciones.filter(a => a.estudiante_id === est.id).length;
        const totalEvaluadores = Math.max(asignados, 1);
        const sumaNotas = evasEst.reduce((sum, e) => sum + (e.nota_individual || 0), 0);
        const promedio = sumaNotas / totalEvaluadores;
        const comentarios = evasEst.map(e => {
            const ev = evaluadores.find(u => u.id === e.evaluador_id);
            const prefijo = ev ? ev.nombre_completo.split(' ')[0].toUpperCase() : 'EV';
            return `${prefijo}: ${e.comentario_global || ''}`;
        }).join('\n\n');
        
        const cedulaCell = ws.getCell(`A${currentRow}`);
        cedulaCell.value = est.cedula;
        cedulaCell.alignment = { vertical: 'top', horizontal: 'center' };
        cedulaCell.border = { 
            bottom: { style: 'thin', color: { argb: COLORES.borde } },
            left: { style: 'thin', color: { argb: COLORES.borde } },
            right: { style: 'thin', color: { argb: COLORES.borde } }
        };
        
        const nombreCell = ws.getCell(`B${currentRow}`);
        nombreCell.value = est.nombre_completo;
        nombreCell.alignment = { vertical: 'top', wrapText: true };
        nombreCell.border = { 
            bottom: { style: 'thin', color: { argb: COLORES.borde } },
            left: { style: 'thin', color: { argb: COLORES.borde } },
            right: { style: 'thin', color: { argb: COLORES.borde } }
        };
        
        const notaCell = ws.getCell(`C${currentRow}`);
        notaCell.value = parseFloat(promedio.toFixed(2));
        notaCell.numFmt = '0.00';
        notaCell.alignment = { horizontal: 'center', vertical: 'top' };
        notaCell.border = { 
            bottom: { style: 'thin', color: { argb: COLORES.borde } },
            left: { style: 'thin', color: { argb: COLORES.borde } },
            right: { style: 'thin', color: { argb: COLORES.borde } }
        };
        if (promedio) {
            notaCell.font = { bold: true, size: 11, color: { argb: COLORES.notaVerde } };
        }
        
        const comentarioCell = ws.getCell(`D${currentRow}`);
        comentarioCell.value = comentarios || 'El estudiante no presentó la actividad correspondiente dentro del plazo establecido';
        comentarioCell.alignment = { vertical: 'top', wrapText: true };
        comentarioCell.border = { 
            bottom: { style: 'thin', color: { argb: COLORES.borde } },
            left: { style: 'thin', color: { argb: COLORES.borde } },
            right: { style: 'thin', color: { argb: COLORES.borde } }
        };
        
        const fillColor = index % 2 === 0 ? COLORES.fondoFila : 'FFFFFFFF';
        [cedulaCell, nombreCell, notaCell, comentarioCell].forEach(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        });
        
        ws.getRow(currentRow).height = 65;
        currentRow++;
    });
    
    currentRow += 2;
    ws.mergeCells(`A${currentRow}:D${currentRow}`);
    const footerCell = ws.getCell(`A${currentRow}`);
    footerCell.value = `Generado el ${new Date().toLocaleDateString('es-CO')} - Sistema de Evaluación Fondo Progresa 2026`;
    footerCell.font = { italic: true, size: 9, color: { argb: 'FF666666' } };
    footerCell.alignment = { horizontal: 'center' };
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Ficha General de Calificación - Comentario Global.xlsx');
}

async function exportarMatrizGeneral() {
    await exportarMatrizGeneralDemo();
}

async function exportarFichasIndividuales() {
    const evaluadoresUnicos = [...new Set(evaluaciones.filter(e => e.estado === 'completada').map(e => e.evaluador_id))];
    
    for (const evaluadorId of evaluadoresUnicos) {
        const evasDelEvaluador = evaluaciones.filter(e => e.evaluador_id === evaluadorId && e.estado === 'completada');
        if (evasDelEvaluador.length === 0) continue;
        
        const ev = evaluadores.find(u => u.id === evaluadorId);
        const nombreEvaluador = ev ? ev.nombre_completo : evaluadorId;
        
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('EVALUACIÓN PLAN DE NEGOCIOS');
        
        ws.getColumn(1).width = 15;
        ws.getColumn(2).width = 45;
        ws.getColumn(3).width = 12;
        ws.getColumn(4).width = 60;
        ws.getColumn(5).width = 12;
        ws.getColumn(6).width = 60;
        ws.getColumn(7).width = 12;
        ws.getColumn(8).width = 60;
        ws.getColumn(9).width = 12;
        ws.getColumn(10).width = 60;
        ws.getColumn(11).width = 12;
        ws.getColumn(12).width = 60;
        ws.getColumn(13).width = 12;
        ws.getColumn(14).width = 60;
        ws.getColumn(15).width = 15;
        
        ws.getRow(1).height = 40;
        ws.mergeCells('A1:O1');
        const bannerCell = ws.getCell('A1');
        bannerCell.value = '    FONDO PROGRESA    |    ALCALDÍA DE ZIPAQUIRÁ    |    SEC. DESARROLLO ECONÓMICO Y TURISMO    |    UNIMINUTO    |    E.P.E.    ';
        bannerCell.font = { bold: true, size: 11, color: { argb: COLORES.textoBanner } };
        bannerCell.alignment = { horizontal: 'center', vertical: 'middle' };
        bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoBanner } };
        
        ws.getRow(2).height = 22;
        ws.mergeCells('A2:O2');
        const subtituloCell = ws.getCell('A2');
        subtituloCell.value = 'Educación de calidad al alcance de todos | Corporación Universitaria Minuto de Dios';
        subtituloCell.font = { italic: true, size: 9, color: { argb: COLORES.textoBanner } };
        subtituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
        subtituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoSubtitulo } };
        
        ws.getRow(3).height = 4;
        ws.mergeCells('A3:O3');
        ws.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC107' } };
        
        ws.getRow(4).height = 10;
        
        ws.getRow(5).height = 35;
        ws.mergeCells('A5:O5');
        const titleCell = ws.getCell('A5');
        titleCell.value = `EVALUACIÓN PLAN DE NEGOCIOS - ${nombreEvaluador.toUpperCase()}`;
        titleCell.font = { bold: true, size: 13, color: { argb: COLORES.textoBanner } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoSubtitulo } };
        
        ws.getRow(6).height = 8;
        
        ws.mergeCells('A7:A8');
        ws.mergeCells('B7:B8');
        ws.mergeCells('C7:D7');
        ws.mergeCells('E7:F7');
        ws.mergeCells('G7:H7');
        ws.mergeCells('I7:J7');
        ws.mergeCells('K7:L7');
        ws.mergeCells('M7:N7');
        
        const mainHeaders = [
            { cell: 'A7', value: 'CÉDULA' },
            { cell: 'B7', value: 'NOMBRES Y APELLIDOS EMPRENDEDOR' },
            { cell: 'C7', value: 'RESUMEN EJECUTIVO (10%)' },
            { cell: 'E7', value: 'ESTUDIO DE MERCADO (25%)' },
            { cell: 'G7', value: 'ESTUDIO TÉCNICO (20%)' },
            { cell: 'I7', value: 'ESTUDIO FINANCIERO (25%)' },
            { cell: 'K7', value: 'PLAN IMPLEMENTACIÓN (10%)' },
            { cell: 'M7', value: 'IMPACTOS (10%)' }
        ];
        
        mainHeaders.forEach(h => {
            const cell = ws.getCell(h.cell);
            cell.value = h.value;
            cell.font = { bold: true, size: 10, color: { argb: COLORES.textoBanner } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoBanner } };
            cell.border = {
                top: { style: 'medium', color: { argb: COLORES.fondoBanner } },
                bottom: { style: 'medium', color: { argb: COLORES.fondoBanner } },
                left: { style: 'thin', color: { argb: COLORES.textoBanner } },
                right: { style: 'thin', color: { argb: COLORES.textoBanner } }
            };
        });
        ws.getRow(7).height = 25;
        
        ws.getCell('O7').value = '';
        const subHeaders = ['PUNTAJE', 'DESCRIPCIÓN RÚBRICA'];
        for (let col = 3; col <= 14; col += 2) {
            ws.getCell(8, col).value = subHeaders[0];
            ws.getCell(8, col + 1).value = subHeaders[1];
            
            [ws.getCell(8, col), ws.getCell(8, col + 1)].forEach(cell => {
                cell.font = { bold: true, size: 9, color: { argb: COLORES.textoBanner } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoSubtitulo } };
                cell.border = {
                    top: { style: 'thin', color: { argb: COLORES.textoBanner } },
                    bottom: { style: 'thin', color: { argb: COLORES.textoBanner } },
                    left: { style: 'thin', color: { argb: COLORES.textoBanner } },
                    right: { style: 'thin', color: { argb: COLORES.textoBanner } }
                };
            });
        }
        ws.getCell(8, 15).value = 'NOTA FINAL';
        ws.getCell(8, 15).font = { bold: true, size: 9, color: { argb: COLORES.textoBanner } };
        ws.getCell(8, 15).alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getCell(8, 15).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoSubtitulo } };
        ws.getRow(8).height = 20;
        
        let currentRow = 9;
        evasDelEvaluador.forEach((eva, index) => {
            const est = estudiantes.find(e => e.id === eva.estudiante_id);
            if (!est) return;
            
            const cedulaCell = ws.getCell(`A${currentRow}`);
            cedulaCell.value = est.cedula;
            cedulaCell.alignment = { vertical: 'top', horizontal: 'center' };
            cedulaCell.border = { 
                bottom: { style: 'thin', color: { argb: COLORES.borde } },
                left: { style: 'thin', color: { argb: COLORES.borde } },
                right: { style: 'thin', color: { argb: COLORES.borde } }
            };
            
            const nombreCell = ws.getCell(`B${currentRow}`);
            nombreCell.value = est.nombre_completo;
            nombreCell.alignment = { vertical: 'top', wrapText: true };
            nombreCell.border = { 
                bottom: { style: 'thin', color: { argb: COLORES.borde } },
                left: { style: 'thin', color: { argb: COLORES.borde } },
                right: { style: 'thin', color: { argb: COLORES.borde } }
            };
            
            let col = 3;
            CRITERIOS.forEach(cr => {
                const puntaje = eva[`${cr.key}_puntaje`];
                const desc = getDescripcionRubrica(cr.key, puntaje);
                
                const puntajeCell = ws.getCell(currentRow, col);
                puntajeCell.value = puntaje;
                puntajeCell.alignment = { horizontal: 'center', vertical: 'top' };
                puntajeCell.border = { 
                    bottom: { style: 'thin', color: { argb: COLORES.borde } },
                    left: { style: 'thin', color: { argb: COLORES.borde } },
                    right: { style: 'thin', color: { argb: COLORES.borde } }
                };
                if (puntaje !== null && puntaje !== undefined) {
                    puntajeCell.font = { bold: true };
                }
                
                const descCell = ws.getCell(currentRow, col + 1);
                descCell.value = desc;
                descCell.alignment = { vertical: 'top', wrapText: true };
                descCell.border = { 
                    bottom: { style: 'thin', color: { argb: COLORES.borde } },
                    left: { style: 'thin', color: { argb: COLORES.borde } },
                    right: { style: 'thin', color: { argb: COLORES.borde } }
                };
                
                col += 2;
            });
            
            const notaCell = ws.getCell(`O${currentRow}`);
            notaCell.value = eva.nota_individual ? parseFloat(eva.nota_individual.toFixed(2)) : null;
            notaCell.numFmt = '0.00';
            notaCell.alignment = { horizontal: 'center', vertical: 'top' };
            notaCell.font = { bold: true, size: 11, color: { argb: COLORES.notaVerde } };
            notaCell.border = { 
                bottom: { style: 'thin', color: { argb: COLORES.borde } },
                left: { style: 'thin', color: { argb: COLORES.borde } },
                right: { style: 'thin', color: { argb: COLORES.borde } }
            };
            
            const fillColor = index % 2 === 0 ? COLORES.fondoFila : 'FFFFFFFF';
            for (let c = 1; c <= 15; c++) {
                ws.getCell(currentRow, c).fill = { 
                    type: 'pattern', 
                    pattern: 'solid', 
                    fgColor: { argb: fillColor } 
                };
            }
            
            ws.getRow(currentRow).height = 85;
            currentRow++;
        });
        
        currentRow += 2;
        ws.mergeCells(`A${currentRow}:O${currentRow}`);
        const footerCell = ws.getCell(`A${currentRow}`);
        footerCell.value = `Generado el ${new Date().toLocaleDateString('es-CO')} - Sistema de Evaluación Fondo Progresa 2026`;
        footerCell.font = { italic: true, size: 9, color: { argb: 'FF666666' } };
        footerCell.alignment = { horizontal: 'center' };
        
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${nombreEvaluador} - Ficha de Evaluación.xlsx`);
    }
}

function getDescripcionRubrica(criterioKey, puntaje) {
    const criterio = CRITERIOS.find(c => c.key === criterioKey);
    if (!criterio || puntaje === null || puntaje === undefined) return '';
    const nivel = Math.floor(Math.min(5, Math.max(0, puntaje)));
    return criterio.niveles[nivel] || '';
}

async function exportarRespuestasCrudas() {
    const evaluadoresUnicos = [...new Set(evaluaciones.filter(e => e.estado === 'completada').map(e => e.evaluador_id))];
    
    if (evaluadoresUnicos.length === 0) {
        toast.warning('No hay evaluaciones completadas para exportar');
        return;
    }
    
    const wb = new ExcelJS.Workbook();
    
    for (const evaluadorId of evaluadoresUnicos) {
        const evasDelEvaluador = evaluaciones.filter(e => e.evaluador_id === evaluadorId && e.estado === 'completada');
        if (evasDelEvaluador.length === 0) continue;
        
        const ev = evaluadores.find(u => u.id === evaluadorId);
        const nombreEvaluador = ev ? ev.nombre_completo : evaluadorId;
        const sheetName = nombreEvaluador.length > 31 ? nombreEvaluador.substring(0, 31) : nombreEvaluador;
        
        const ws = wb.addWorksheet(sheetName);
        
        ws.getColumn(1).width = 13.73;
        ws.getColumn(2).width = 46.7;
        ws.getColumn(3).width = 10.3;
        ws.getColumn(4).width = 43.6;
        ws.getColumn(5).width = 10.3;
        ws.getColumn(6).width = 59.3;
        ws.getColumn(7).width = 10.3;
        ws.getColumn(8).width = 30.7;
        ws.getColumn(9).width = 10.3;
        ws.getColumn(10).width = 30.7;
        ws.getColumn(11).width = 10.3;
        ws.getColumn(12).width = 30.7;
        ws.getColumn(13).width = 10.3;
        ws.getColumn(14).width = 30.7;
        ws.getColumn(15).width = 14;
        ws.getColumn(16).width = 11.4;
        
        ws.getRow(1).height = 20;
        ws.getRow(2).height = 20;
        ws.getRow(3).height = 20;
        ws.getRow(4).height = 20;
        ws.mergeCells('A1:P4');
        const bannerCell = ws.getCell('A1');
        bannerCell.value = '';
        bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoBanner } };
        
        ws.getRow(5).height = 67.5;
        ws.mergeCells('A5:A6');
        ws.mergeCells('B5:B6');
        ws.mergeCells('C5:D5');
        ws.mergeCells('E5:F5');
        ws.mergeCells('G5:H5');
        ws.mergeCells('I5:J5');
        ws.mergeCells('K5:L5');
        ws.mergeCells('M5:N5');
        ws.mergeCells('O5:O6');
        ws.mergeCells('P5:P6');
        
        const mainHeaders = [
            { cell: 'A5', value: 'CÉDULA' },
            { cell: 'B5', value: 'NOMBRES Y APELLIDOS EMPRENDEDOR' },
            { cell: 'C5', value: 'RESUMEN EJECUTIVO (10%)' },
            { cell: 'E5', value: 'ESTUDIO DE MERCADO (25%)' },
            { cell: 'G5', value: 'ESTUDIO TÉCNICO (20%)' },
            { cell: 'I5', value: 'ESTUDIO FINANCIERO (25%)' },
            { cell: 'K5', value: 'PLAN IMPLEMENTACIÓN (10%)' },
            { cell: 'M5', value: 'IMPACTOS AMBIENTALES/SOCIALES/ECONÓMICOS (10%)' },
            { cell: 'O5', value: 'NOTA PLAN DE NEGOCIOS' },
            { cell: 'P5', value: 'OBSERVACIÓN' }
        ];
        
        mainHeaders.forEach(h => {
            const cell = ws.getCell(h.cell);
            cell.value = h.value;
            cell.font = { bold: true, size: 9, name: 'Century Gothic' };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'medium' },
                bottom: { style: 'medium' },
                left: { style: 'medium' },
                right: { style: 'medium' }
            };
        });
        
        const subHeaders = ['PUNTAJE', 'DESCRIPCIÓN RÚBRICA'];
        for (let col = 3; col <= 14; col += 2) {
            ws.getCell(6, col).value = subHeaders[0];
            ws.getCell(6, col + 1).value = subHeaders[1];
            
            [ws.getCell(6, col), ws.getCell(6, col + 1)].forEach(cell => {
                cell.font = { bold: true, size: 9, name: 'Century Gothic' };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'medium' },
                    bottom: { style: 'medium' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        }
        
        let currentRow = 7;
        evasDelEvaluador.forEach((eva, index) => {
            const est = estudiantes.find(e => e.id === eva.estudiante_id);
            if (!est) return;
            
            const cedulaCell = ws.getCell(`A${currentRow}`);
            cedulaCell.value = est.cedula;
            cedulaCell.alignment = { vertical: 'top', horizontal: 'center' };
            cedulaCell.font = { name: 'Century Gothic', size: 9 };
            cedulaCell.border = { bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
            
            const nombreCell = ws.getCell(`B${currentRow}`);
            nombreCell.value = est.nombre_completo;
            nombreCell.alignment = { vertical: 'top', wrapText: true };
            nombreCell.font = { name: 'Century Gothic', size: 9 };
            nombreCell.border = { bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
            
            let col = 3;
            CRITERIOS.forEach(cr => {
                const puntaje = eva[`${cr.key}_puntaje`];
                const desc = getDescripcionRubrica(cr.key, puntaje);
                
                const puntajeCell = ws.getCell(currentRow, col);
                puntajeCell.value = puntaje;
                puntajeCell.alignment = { horizontal: 'center', vertical: 'top' };
                puntajeCell.font = { name: 'Century Gothic', size: 9, bold: true };
                puntajeCell.border = { bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
                
                const descCell = ws.getCell(currentRow, col + 1);
                descCell.value = desc;
                descCell.alignment = { vertical: 'top', wrapText: true };
                descCell.font = { name: 'Century Gothic', size: 9 };
                descCell.border = { bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
                
                col += 2;
            });
            
            const notaCell = ws.getCell(`O${currentRow}`);
            notaCell.value = eva.nota_individual;
            notaCell.numFmt = '0.0000';
            notaCell.alignment = { horizontal: 'center', vertical: 'top' };
            notaCell.font = { bold: true, name: 'Century Gothic', size: 9 };
            notaCell.border = { bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
            
            const obsCell = ws.getCell(`P${currentRow}`);
            obsCell.value = eva.comentario_global || '';
            obsCell.alignment = { vertical: 'top', wrapText: true };
            obsCell.font = { name: 'Century Gothic', size: 9 };
            obsCell.border = { bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
            
            if (index % 2 === 0) {
                for (let c = 1; c <= 16; c++) {
                    ws.getCell(currentRow, c).fill = { 
                        type: 'pattern', 
                        pattern: 'solid', 
                        fgColor: { argb: 'FFF5F5F5' } 
                    };
                }
            }
            
            ws.getRow(currentRow).height = 18;
            currentRow++;
        });
    }
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Respuestas Formadores Fondo Progresa 2026.xlsx');
    toast.success('Archivo de respuestas crudas exportado exitosamente');
}

// ============================================
// EXPORTACIÓN EXCEL - FORMADORES PENDIENTES
// ============================================
async function exportarPendientes() {
    const conPendientes = [];
    
    estudiantes.forEach(est => {
        const asignados = asignaciones.filter(a => a.estudiante_id === est.id);
        const evasEst = evaluaciones.filter(e => e.estudiante_id === est.id && e.estado === 'completada');
        const idsQueEvalaron = evasEst.map(e => e.evaluador_id);
        const pendientes = asignados.filter(a => !idsQueEvalaron.includes(a.evaluador_id));
        
        if (pendientes.length > 0) {
            conPendientes.push({
                nombre: est.nombre_completo,
                pendientes: pendientes.map(a => {
                    const ev = evaluadores.find(u => u.id === a.evaluador_id);
                    return ev ? ev.nombre_completo : 'Desconocido';
                })
            });
        }
    });
    
    if (conPendientes.length === 0) {
        toast.warning('No hay estudiantes con formadores pendientes. Todos han sido evaluados.');
        return;
    }
    
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Formadores Pendientes');
    
    ws.getColumn(1).width = 50;
    ws.getColumn(2).width = 60;
    
    ws.getRow(1).height = 45;
    ws.mergeCells('A1:B1');
    const bannerCell = ws.getCell('A1');
    bannerCell.value = '    FONDO PROGRESA    |    ALCALDÍA DE ZIPAQUIRÁ    |    SEC. DESARROLLO ECONÓMICO Y TURISMO    |    UNIMINUTO    |    E.P.E.    ';
    bannerCell.font = { bold: true, size: 12, color: { argb: COLORES.textoBanner } };
    bannerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoBanner } };
    
    ws.getRow(2).height = 25;
    ws.mergeCells('A2:B2');
    const subtituloCell = ws.getCell('A2');
    subtituloCell.value = 'Educación de calidad al alcance de todos | Corporación Universitaria Minuto de Dios';
    subtituloCell.font = { italic: true, size: 10, color: { argb: COLORES.textoBanner } };
    subtituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
    subtituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoSubtitulo } };
    
    ws.getRow(3).height = 5;
    ws.mergeCells('A3:B3');
    ws.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC107' } };
    
    ws.getRow(4).height = 15;
    
    ws.getRow(5).height = 35;
    ws.mergeCells('A5:B5');
    const titleCell = ws.getCell('A5');
    titleCell.value = 'FORMADORES PENDIENTES POR EVALUAR';
    titleCell.font = { bold: true, size: 14, color: { argb: COLORES.textoBanner } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoSubtitulo } };
    
    ws.getRow(6).height = 10;
    
    ws.mergeCells('A7:A8');
    ws.mergeCells('B7:B8');
    
    const headers = [
        { cell: 'A7', value: 'NOMBRE DEL ESTUDIANTE' },
        { cell: 'B7', value: 'FORMADORES PENDIENTES' }
    ];
    
    headers.forEach(h => {
        const cell = ws.getCell(h.cell);
        cell.value = h.value;
        cell.font = { bold: true, size: 11, color: { argb: COLORES.textoBanner } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoBanner } };
        cell.border = {
            top: { style: 'medium', color: { argb: COLORES.fondoBanner } },
            bottom: { style: 'medium', color: { argb: COLORES.fondoBanner } },
            left: { style: 'thin', color: { argb: COLORES.textoBanner } },
            right: { style: 'thin', color: { argb: COLORES.textoBanner } }
        };
    });
    ws.getRow(7).height = 25;
    ws.getRow(8).height = 25;
    
    let currentRow = 9;
    conPendientes.forEach((item, index) => {
        const nombreCell = ws.getCell(`A${currentRow}`);
        nombreCell.value = item.nombre;
        nombreCell.alignment = { vertical: 'top', wrapText: true };
        nombreCell.border = { 
            bottom: { style: 'thin', color: { argb: COLORES.borde } },
            left: { style: 'thin', color: { argb: COLORES.borde } },
            right: { style: 'thin', color: { argb: COLORES.borde } }
        };
        
        const pendientesCell = ws.getCell(`B${currentRow}`);
        pendientesCell.value = item.pendientes.join('\n');
        pendientesCell.alignment = { vertical: 'top', wrapText: true };
        pendientesCell.font = { color: { argb: 'FFC62828' } };
        pendientesCell.border = { 
            bottom: { style: 'thin', color: { argb: COLORES.borde } },
            left: { style: 'thin', color: { argb: COLORES.borde } },
            right: { style: 'thin', color: { argb: COLORES.borde } }
        };
        
        const fillColor = index % 2 === 0 ? COLORES.fondoFila : 'FFFFFFFF';
        [nombreCell, pendientesCell].forEach(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        });
        
        ws.getRow(currentRow).height = Math.max(30, item.pendientes.length * 18);
        currentRow++;
    });
    
    currentRow += 2;
    ws.mergeCells(`A${currentRow}:B${currentRow}`);
    const footerCell = ws.getCell(`A${currentRow}`);
    footerCell.value = `Generado el ${new Date().toLocaleDateString('es-CO')} - Sistema de Evaluación Fondo Progresa 2026`;
    footerCell.font = { italic: true, size: 9, color: { argb: 'FF666666' } };
    footerCell.alignment = { horizontal: 'center' };
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Formadores Pendientes Fondo Progresa 2026.xlsx');
    toast.success(`Archivo exportado: ${conPendientes.length} estudiante(s) con formadores pendientes`);
}

// ============================================
// EXPORTACIÓN EXCEL CON CORREOS
// ============================================
async function exportarExcelConCorreos() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('EVALUACIÓN PLAN DE NEGOCIOS');
    
    ws.getColumn(1).width = 13.73;
    ws.getColumn(2).width = 47.18;
    ws.getColumn(3).width = 35;
    ws.getColumn(4).width = 18;
    ws.getColumn(5).width = 141.27;
    
    ws.getRow(1).height = 45;
    ws.mergeCells('A1:E1');
    const bannerCell = ws.getCell('A1');
    bannerCell.value = '    FONDO PROGRESA    |    ALCALDÍA DE ZIPAQUIRÁ    |    SEC. DESARROLLO ECONÓMICO Y TURISMO    |    UNIMINUTO    |    E.P.E.    ';
    bannerCell.font = { bold: true, size: 12, color: { argb: COLORES.textoBanner } };
    bannerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoBanner } };
    
    ws.getRow(2).height = 25;
    ws.mergeCells('A2:E2');
    const subtituloCell = ws.getCell('A2');
    subtituloCell.value = 'Educación de calidad al alcance de todos | Corporación Universitaria Minuto de Dios';
    subtituloCell.font = { italic: true, size: 10, color: { argb: COLORES.textoBanner } };
    subtituloCell.alignment = { horizontal: 'center', vertical: 'middle' };
    subtituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoSubtitulo } };
    
    ws.getRow(3).height = 5;
    ws.mergeCells('A3:E3');
    ws.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC107' } };
    
    ws.getRow(4).height = 15;
    
    ws.getRow(5).height = 40;
    ws.mergeCells('A5:E5');
    const titleCell = ws.getCell('A5');
    titleCell.value = 'FICHA GENERAL DE CALIFICACIÓN\nCOMENTARIO GLOBAL';
    titleCell.font = { bold: true, size: 14, color: { argb: COLORES.textoBanner } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoSubtitulo } };
    
    ws.getRow(6).height = 10;
    
    ws.mergeCells('A7:A8');
    ws.mergeCells('B7:B8');
    ws.mergeCells('C7:C8');
    ws.mergeCells('D7:D8');
    ws.mergeCells('E7:E8');
    
    const headers = [
        { cell: 'A7', value: 'CÉDULA' },
        { cell: 'B7', value: 'NOMBRES Y APELLIDOS EMPRENDEDOR' },
        { cell: 'C7', value: 'CORREO ELECTRÓNICO' },
        { cell: 'D7', value: 'NOTA PROMEDIO REVISIÓN PLAN DE NEGOCIOS' },
        { cell: 'E7', value: 'COMENTARIO GLOBAL (A DESTACAR, A MEJORAR Y VIABILIDAD DE LA INVERSIÓN)' }
    ];
    
    headers.forEach(h => {
        const cell = ws.getCell(h.cell);
        cell.value = h.value;
        cell.font = { bold: true, size: 11, color: { argb: COLORES.textoBanner } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORES.fondoBanner } };
        cell.border = {
            top: { style: 'medium', color: { argb: COLORES.fondoBanner } },
            bottom: { style: 'medium', color: { argb: COLORES.fondoBanner } },
            left: { style: 'thin', color: { argb: COLORES.textoBanner } },
            right: { style: 'thin', color: { argb: COLORES.textoBanner } }
        };
    });
    ws.getRow(7).height = 25;
    ws.getRow(8).height = 25;
    
    let currentRow = 9;
    estudiantes.forEach((est, index) => {
        const evasEst = evaluaciones.filter(e => e.estudiante_id === est.id && e.estado === 'completada');
        const asignados = asignaciones.filter(a => a.estudiante_id === est.id).length;
        const totalEvaluadores = Math.max(asignados, 1);
        const sumaNotas = evasEst.reduce((sum, e) => sum + (e.nota_individual || 0), 0);
        const promedio = sumaNotas / totalEvaluadores;
        const comentarios = evasEst.map(e => {
            const ev = evaluadores.find(u => u.id === e.evaluador_id);
            const prefijo = ev ? ev.nombre_completo.split(' ')[0].toUpperCase() : 'EV';
            return `${prefijo}: ${e.comentario_global || ''}`;
        }).join('\n\n');
        
        const cedulaCell = ws.getCell(`A${currentRow}`);
        cedulaCell.value = est.cedula;
        cedulaCell.alignment = { vertical: 'top', horizontal: 'center' };
        cedulaCell.border = { 
            bottom: { style: 'thin', color: { argb: COLORES.borde } },
            left: { style: 'thin', color: { argb: COLORES.borde } },
            right: { style: 'thin', color: { argb: COLORES.borde } }
        };
        
        const nombreCell = ws.getCell(`B${currentRow}`);
        nombreCell.value = est.nombre_completo;
        nombreCell.alignment = { vertical: 'top', wrapText: true };
        nombreCell.border = { 
            bottom: { style: 'thin', color: { argb: COLORES.borde } },
            left: { style: 'thin', color: { argb: COLORES.borde } },
            right: { style: 'thin', color: { argb: COLORES.borde } }
        };
        
        const correoCell = ws.getCell(`C${currentRow}`);
        correoCell.value = est.correo || '';
        correoCell.alignment = { vertical: 'top', horizontal: 'center' };
        correoCell.font = { size: 9, color: { argb: est.correo ? 'FF333333' : 'FF999999' } };
        correoCell.border = { 
            bottom: { style: 'thin', color: { argb: COLORES.borde } },
            left: { style: 'thin', color: { argb: COLORES.borde } },
            right: { style: 'thin', color: { argb: COLORES.borde } }
        };
        
        const notaCell = ws.getCell(`D${currentRow}`);
        notaCell.value = parseFloat(promedio.toFixed(2));
        notaCell.numFmt = '0.00';
        notaCell.alignment = { horizontal: 'center', vertical: 'top' };
        notaCell.border = { 
            bottom: { style: 'thin', color: { argb: COLORES.borde } },
            left: { style: 'thin', color: { argb: COLORES.borde } },
            right: { style: 'thin', color: { argb: COLORES.borde } }
        };
        if (promedio) {
            notaCell.font = { bold: true, size: 11, color: { argb: COLORES.notaVerde } };
        }
        
        const comentarioCell = ws.getCell(`E${currentRow}`);
        comentarioCell.value = comentarios || 'El estudiante no presentó la actividad correspondiente dentro del plazo establecido';
        comentarioCell.alignment = { vertical: 'top', wrapText: true };
        comentarioCell.border = { 
            bottom: { style: 'thin', color: { argb: COLORES.borde } },
            left: { style: 'thin', color: { argb: COLORES.borde } },
            right: { style: 'thin', color: { argb: COLORES.borde } }
        };
        
        const fillColor = index % 2 === 0 ? COLORES.fondoFila : 'FFFFFFFF';
        [cedulaCell, nombreCell, correoCell, notaCell, comentarioCell].forEach(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        });
        
        ws.getRow(currentRow).height = 65;
        currentRow++;
    });
    
    currentRow += 2;
    ws.mergeCells(`A${currentRow}:E${currentRow}`);
    const footerCell = ws.getCell(`A${currentRow}`);
    footerCell.value = `Generado el ${new Date().toLocaleDateString('es-CO')} - Sistema de Evaluación Fondo Progresa 2026`;
    footerCell.font = { italic: true, size: 9, color: { argb: 'FF666666' } };
    footerCell.alignment = { horizontal: 'center' };
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'Ficha General de Calificación 2026 - Con Correos.xlsx');
    toast.success('Archivo exportado exitosamente');
}
