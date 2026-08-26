// ============================================
// FONDO PROGRESA 2026 - APLICACIÓN PRINCIPAL
// ============================================

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
            5: 'Presenta un resumen ejecutivo ampliamente claro, descripción del proyecto concisa y coherente, reconoce su propósito y singularidad. Objetivos de corto y largo plazo claros y específicos. Explica de manera clara el problema o necesidad que se aborda y cómo el proyecto proporciona una solución alineada.',
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
            5: 'Estudio financiero acertado y totalmente coherente con el ejercicio. Describe detalladamente la inversión requerida, en coherencia con el Fondo Progresa 2025; detalla capital y su distribución. Análisis completo de flujos de caja, ventas, rentabilidad y punto de equilibrio; coherente con simulador financiero.',
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
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('add-student-form').addEventListener('submit', handleAddStudent);
    
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
        errorDiv.textContent = err.message || 'Credenciales incorrectas';
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

function showMainScreen() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
    document.getElementById('user-name').textContent = userProfile?.nombre_completo || currentUser.email;
    document.getElementById('user-role').textContent = userProfile?.rol === 'admin' ? 'Administrador' : 'Evaluador';
    
    const nav = document.getElementById('main-nav');
    if (userProfile?.rol === 'evaluador') {
        nav.querySelectorAll('[data-view="estudiantes"], [data-view="asignaciones"], [data-view="dashboard"]').forEach(el => el.style.display = 'none');
        switchView('evaluar');
    } else {
        nav.querySelectorAll('.nav-btn').forEach(el => el.style.display = 'block');
        switchView('dashboard');
    }
    
    loadData();
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
    
    if (userProfile?.rol === 'admin') {
        document.getElementById('sync-section').style.display = 'block';
        renderUsuariosSync();
    }
}

function renderUsuariosSync() {
    const container = document.getElementById('sync-users-container');
    if (!container) return;
    
    const allUsers = allUsuarios.length > 0 ? [...allUsuarios] : [];
    
    container.innerHTML = `
        <div style="overflow-x:auto; margin-top:1rem;">
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
                            <td>${u.email}</td>
                            <td>${u.nombre_completo}</td>
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
        <div style="margin-top:1rem; padding:0.75rem; background:#e3f2fd; border-radius:6px; font-size:0.85rem; color:#1565c0;">
            <strong>Nota:</strong> Si un usuario se crea nuevo en Auth pero no aparece aquí, simplemente pídele que inicie sesión una vez. El sistema creará su perfil automáticamente.
        </div>
    `;
}

async function cambiarRolUsuario(userId, nuevoRol) {
    if (DEMO_MODE) {
        const user = allUsuarios.find(u => u.id === userId);
        if (user) user.rol = nuevoRol;
        alert('Rol actualizado');
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
        
        alert('Rol actualizado exitosamente');
        renderUsuariosSync();
    } catch (err) {
        alert('Error al actualizar rol: ' + err.message);
    }
}

function renderDashboardTable() {
    const tbody = document.getElementById('dashboard-table-body');
    tbody.innerHTML = '';
    
    estudiantes.forEach(est => {
        const evasEst = evaluaciones.filter(e => e.estudiante_id === est.id && e.estado === 'completada');
        const promedio = evasEst.length > 0 
            ? evasEst.reduce((sum, e) => sum + (e.nota_individual || 0), 0) / evasEst.length 
            : null;
        
        const evaluadoresNombres = evasEst.map(e => {
            const ev = evaluadores.find(u => u.id === e.evaluador_id);
            return ev ? ev.nombre_completo.split(' ')[0] : 'Desconocido';
        }).join(', ');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${est.cedula}</td>
            <td>${est.nombre_completo}</td>
            <td>${evasEst.length}/5</td>
            <td><strong style="color:${promedio ? '#2e7d32' : '#f57c00'}">${promedio ? promedio.toFixed(2) : 'Pendiente'}</strong></td>
            <td style="font-size:0.85rem">${evaluadoresNombres || '-'}</td>
            <td>
                <button class="btn btn-danger" style="width:auto;padding:0.25rem 0.5rem;font-size:0.75rem" onclick="verDetalleEstudiante('${est.id}')">Ver Detalle</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================
// FUNCIONES DE ADMIN - GESTIÓN DE EVALUACIONES
// ============================================
function verDetalleEstudiante(estudianteId) {
    const estudiante = estudiantes.find(e => e.id === estudianteId);
    const evasEst = evaluaciones.filter(e => e.estudiante_id === estudianteId);
    
    let html = `<h3>${estudiante.nombre_completo}</h3>`;
    html += `<p>Cédula: ${estudiante.cedula}</p>`;
    html += `<p>Evaluaciones: ${evasEst.length}/5</p>`;
    html += `<br>`;
    
    if (evasEst.length === 0) {
        html += `<p style="color:#666">No hay evaluaciones registradas</p>`;
    } else {
        html += `<table style="width:100%">
            <thead>
                <tr>
                    <th>Evaluador</th>
                    <th>Nota</th>
                    <th>Estado</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>`;
        
        evasEst.forEach(eva => {
            const ev = evaluadores.find(u => u.id === eva.evaluador_id);
            html += `
                <tr>
                    <td>${ev ? ev.nombre_completo : 'Desconocido'}</td>
                    <td><strong>${eva.nota_individual ? eva.nota_individual.toFixed(2) : '-'}</strong></td>
                    <td><span class="badge ${eva.estado === 'completada' ? 'badge-success' : 'badge-warning'}">${eva.estado === 'completada' ? 'Completada' : 'Borrador'}</span></td>
                    <td>
                        <button class="btn btn-danger" style="width:auto;padding:0.25rem 0.5rem;font-size:0.75rem" onclick="eliminarEvaluacion('${eva.id}')">Eliminar</button>
                    </td>
                </tr>`;
        });
        
        html += `</tbody></table>`;
    }
    
    const promedio = evasEst.length > 0 
        ? evasEst.reduce((sum, e) => sum + (e.nota_individual || 0), 0) / evasEst.length 
        : null;
    
    html += `<br><div class="nota-display">
        <div>Nota Final (Promedio)</div>
        <div class="nota-value">${promedio ? promedio.toFixed(2) : 'Pendiente'}</div>
    </div>`;
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1000';
    modal.innerHTML = `
        <div style="background:white;padding:2rem;border-radius:12px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto">
            ${html}
            <br>
            <button class="btn btn-secondary" onclick="this.closest('div[style]').remove()" style="width:auto;padding:0.5rem 1rem">Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function eliminarEvaluacion(evaluacionId) {
    if (!confirm('¿Estás seguro de eliminar esta evaluación?')) return;
    
    if (DEMO_MODE) {
        evaluaciones = evaluaciones.filter(e => e.id !== evaluacionId);
        alert('Evaluación eliminada');
        document.querySelector('div[style*="position:fixed"]').remove();
        updateDashboard();
        return;
    }
    
    supabaseClient.from('evaluaciones').delete().eq('id', evaluacionId).then(() => {
        alert('Evaluación eliminada');
        document.querySelector('div[style*="position:fixed"]').remove();
        loadCursoData().then(() => updateDashboard());
    });
}

// ============================================
// ESTUDIANTES
// ============================================
async function handleAddStudent(e) {
    e.preventDefault();
    const cedula = document.getElementById('new-cedula').value;
    const nombre = document.getElementById('new-nombre').value;
    
    if (DEMO_MODE) {
        const newId = String(estudiantes.length + 1);
        estudiantes.push({ id: newId, cedula, nombre_completo: nombre });
        document.getElementById('new-cedula').value = '';
        document.getElementById('new-nombre').value = '';
        renderStudentsTable();
        updateDashboard();
        alert('Estudiante agregado');
        return;
    }
    
    if (!cursoActual) {
        alert('No hay curso activo');
        return;
    }
    
    const { error } = await supabaseClient
        .from('estudiantes')
        .insert({ cedula, nombre_completo: nombre, curso_id: cursoActual.id });
    
    if (error) {
        alert('Error: ' + error.message);
    } else {
        document.getElementById('new-cedula').value = '';
        document.getElementById('new-nombre').value = '';
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
            <td>${est.cedula}</td>
            <td>${est.nombre_completo}</td>
            <td><button class="btn btn-danger" style="width:auto;padding:0.25rem 0.5rem;font-size:0.8rem" onclick="deleteStudent('${est.id}')">Eliminar Todo</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteStudent(id) {
    if (!confirm('¿Estás seguro de eliminar este estudiante por completo? Se borrarán también TODAS sus asignaciones y evaluaciones.')) return;
    
    if (DEMO_MODE) {
        estudiantes = estudiantes.filter(e => e.id !== id);
        evaluaciones = evaluaciones.filter(e => e.estudiante_id !== id);
        asignaciones = asignaciones.filter(e => e.estudiante_id !== id);
        renderStudentsTable();
        updateDashboard();
        alert('Estudiante eliminado.');
        return;
    }
    
    try {
        await supabaseClient.from('evaluaciones').delete().eq('estudiante_id', id);
        await supabaseClient.from('asignaciones').delete().eq('estudiante_id', id);
        
        const { error } = await supabaseClient.from('estudiantes').delete().eq('id', id);
        if (error) throw error;
        
        alert('Estudiante y todos sus registros eliminados correctamente.');
        await loadCursoData();
        renderStudentsTable();
        updateDashboard();
    } catch (err) {
        alert('Error al eliminar: ' + err.message);
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

function showEvalForm(estudiante) {
    selectedStudent = estudiante;
    evalValues = {};
    
    document.getElementById('eval-list-view').style.display = 'none';
    document.getElementById('eval-form-view').style.display = 'block';
    document.getElementById('eval-student-info').innerHTML = `<strong>${estudiante.nombre_completo}</strong> | Cédula: ${estudiante.cedula}`;
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
            <td>${est.cedula}</td>
            <td>${est.nombre_completo}</td>
            <td><span class="badge ${completada ? 'badge-success' : 'badge-warning'}">${completada ? 'Completada' : 'Pendiente'}</span></td>
            <td><strong>${completada ? eva.nota_individual.toFixed(2) : '-'}</strong></td>
            <td><button class="btn btn-primary" style="width:auto;padding:0.5rem 1rem" onclick='showEvalForm(${JSON.stringify(est)})'>${completada ? 'Ver/Editar' : 'Evaluar'}</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCriterios() {
    const container = document.getElementById('criterios-container');
    container.innerHTML = '';
    
    CRITERIOS.forEach(criterio => {
        const card = document.createElement('div');
        card.className = 'criterion-card';
        
        const valorActual = evalValues[criterio.key];
        const descripcionActual = valorActual !== undefined ? criterio.niveles[valorActual] : '';
        
        card.innerHTML = `
            <div class="criterion-header">
                <h3>${criterio.nombre}</h3>
                <span class="weight">${(criterio.peso * 100)}%</span>
            </div>
            <div class="level-selector" id="levels-${criterio.key}">
                ${[5,4,3,2,1,0].map(valor => `
                    <button class="level-btn ${valorActual === valor ? 'selected' : ''}" 
                        data-key="${criterio.key}" 
                        data-value="${valor}" 
                        onclick="selectLevel('${criterio.key}', ${valor})">
                        <div class="level-value">${valor}</div>
                        <div class="level-name">${getNombreNivel(valor)}</div>
                    </button>
                `).join('')}
            </div>
            <div class="rubric-description" id="desc-${criterio.key}" style="
                margin-top: 1rem;
                padding: 1rem;
                background: ${descripcionActual ? '#e3f2fd' : '#f5f5f5'};
                border-left: 4px solid ${descripcionActual ? '#1976d2' : '#bdbdbd'};
                border-radius: 4px;
                font-size: 0.9rem;
                color: #333;
                min-height: 60px;
            ">
                <strong>${valorActual !== undefined ? 'Descripción del nivel ' + valorActual + ':' : 'Seleccione un nivel para ver la descripción:'}</strong>
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
        3: 'Regular',
        2: 'Insuficiente',
        1: 'Mínimo',
        0: 'No presenta'
    };
    return nombres[valor] || '';
}

function selectLevel(key, value) {
    evalValues[key] = value;
    
    document.querySelectorAll(`[data-key="${key}"]`).forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.value) === value);
    });
    
    const criterio = CRITERIOS.find(c => c.key === key);
    const descDiv = document.getElementById(`desc-${key}`);
    if (criterio && descDiv) {
        const descripcion = criterio.niveles[value];
        descDiv.style.background = '#e3f2fd';
        descDiv.style.borderLeftColor = '#1976d2';
        descDiv.innerHTML = `
            <strong>Descripción del nivel ${value}:</strong>
            <p style="margin-top: 0.5rem; line-height: 1.5;">${descripcion}</p>
        `;
    }
    
    updateNotaCalculada();
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
        
        alert('Evaluación guardada exitosamente');
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
        alert('Evaluación guardada exitosamente');
        showEvalList();
    } catch (err) {
        alert('Error al guardar: ' + err.message);
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
                <p>Cargue un archivo .xlsx con las columnas: <strong>CÉDULA, NOMBRE ESTUDIANTE, FORMADOR 1, FORMADOR 2</strong></p>
            </div>
            <input type="file" id="import-asignaciones-file" accept=".xlsx,.xls" style="display:none" onchange="importarAsignacionesExcel(this)">
            <button class="btn btn-import" onclick="document.getElementById('import-asignaciones-file').click()">
                Importar desde Excel
            </button>
            <div id="import-preview-container" style="display:none; margin-top: 1.5rem;"></div>
        </div>
        
        <div class="table-container" style="margin-bottom: 2rem; padding: 1.5rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="border-bottom: 1px solid #dee2e6; padding-bottom: 1rem; margin-bottom: 1.5rem;">
                <h3 style="margin: 0; color: #1a237e;">Nueva Asignación</h3>
                <p style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">Busque al estudiante y asígnele manualmente a su evaluador. Máximo ${MAX_EVALUADORES_POR_ESTUDIANTE} formadores por estudiante.</p>
            </div>
            
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
                <div style="flex: 1; min-width: 250px;">
                    <label style="display:block; margin-bottom:0.5rem; font-weight:600;">Seleccionar Estudiante:</label>
                    <select id="manual-estudiante" style="width:100%; padding:0.75rem; border-radius:6px; border:1px solid #ddd; font-size: 1rem; background-color: #fff;">
                        <option value="">-- Elija un estudiante --</option>
                        ${estudiantes.map(e => {
                            const count = getAsignacionesDeEstudiante(e.id).length;
                            const lleno = count >= MAX_EVALUADORES_POR_ESTUDIANTE;
                            return `<option value="${e.id}" ${lleno ? 'disabled' : ''}>${e.nombre_completo} - ${e.cedula} (${count}/${MAX_EVALUADORES_POR_ESTUDIANTE}${lleno ? ' - completo' : ''})</option>`;
                        }).join('')}
                    </select>
                </div>
                <div style="flex: 1; min-width: 250px;">
                    <label style="display:block; margin-bottom:0.5rem; font-weight:600;">Seleccionar Evaluador:</label>
                    <select id="manual-evaluador" style="width:100%; padding:0.75rem; border-radius:6px; border:1px solid #ddd; font-size: 1rem; background-color: #fff;">
                        <option value="">-- Elija un evaluador --</option>
                        ${evaluadores.map(e => `<option value="${e.id}">${e.nombre_completo}</option>`).join('')}
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
                    style="padding:0.5rem 0.75rem;border:1px solid #ddd;border-radius:6px;min-width:250px"
                    oninput="renderAsignacionesTabla()">
            </div>
            <div style="overflow-x:auto">
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
                    <span style="display:inline-flex;align-items:center;gap:0.4rem;background:#e8eaf6;color:#1a237e;padding:0.35rem 0.6rem;border-radius:20px;margin:0.15rem 0.3rem 0.15rem 0;font-size:0.85rem;">
                        ${ev.nombre_completo}
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
                    ${est.nombre_completo}<br><span style="color:#888; font-size:0.8rem;">CC ${est.cedula}</span>
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
        alert('Por favor seleccione tanto el estudiante como el evaluador.');
        return;
    }
    
    const existe = asignaciones.find(a => a.estudiante_id === estId && a.evaluador_id === evId);
    if(existe) {
        alert('Este estudiante ya está asignado a ese evaluador.');
        return;
    }
    
    const asignadosActuales = getAsignacionesDeEstudiante(estId).length;
    if (asignadosActuales >= MAX_EVALUADORES_POR_ESTUDIANTE) {
        const est = estudiantes.find(e => e.id === estId);
        alert(`${est ? est.nombre_completo : 'Este estudiante'} ya tiene el máximo de ${MAX_EVALUADORES_POR_ESTUDIANTE} formadores asignados. Quite una asignación existente antes de agregar otra.`);
        return;
    }
    
    await asignarEvaluador(evId, estId);
    alert('¡Asignación guardada con éxito!');
}

async function asignarEvaluador(evaluadorId, estudianteId) {
    if (getAsignacionesDeEstudiante(estudianteId).length >= MAX_EVALUADORES_POR_ESTUDIANTE) {
        alert(`Este estudiante ya tiene el máximo de ${MAX_EVALUADORES_POR_ESTUDIANTE} formadores asignados.`);
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
        alert('Error al asignar: ' + err.message);
    }
}

async function desasignarEvaluador(evaluadorId, estudianteId) {
    if (!confirm('¿Seguro que deseas quitar la asignación de este evaluador?')) return;
    
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
        alert('Error al desasignar: ' + err.message);
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
                alert('El archivo está vacío o no tiene datos válidos.');
                return;
            }
            
            procesarArchivoAsignaciones(rows);
        } catch (err) {
            alert('Error al leer el archivo: ' + err.message);
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
        alert('No se encontraron registros válidos en el archivo.');
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
        <div style="overflow-x:auto; max-height:400px; overflow-y:auto; border:1px solid #dee2e6; border-radius:6px;">
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Cédula</th>
                        <th>Nombre Estudiante</th>
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
                                <td>${r.cedula}</td>
                                <td>${r.nombre}</td>
                                <td>${r.ev1 ? r.ev1.nombre_completo : '<em style="color:#c62828">' + r.formador1 + '</em>'}</td>
                                <td>${r.ev2 ? r.ev2.nombre_completo : (r.formador2 ? '<em style="color:#c62828">' + r.formador2 + '</em>' : '-')}</td>
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
                estudiantes.push({ id: estId, cedula: reg.cedula, nombre_completo: reg.nombre });
                creados++;
            } else {
                const { data: nuevoEst, error: errEst } = await supabaseClient
                    .from('estudiantes')
                    .insert({ cedula: reg.cedula, nombre_completo: reg.nombre, curso_id: cursoActual.id })
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
    
    alert(`Importación completada:\n• ${creados} estudiantes creados\n• ${asignacionesReemplazadas} asignaciones reemplazadas\n• ${asignacionesNuevas} asignaciones nuevas`);
    
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
        alert('Archivo Excel exportado (datos demo)');
        return;
    }
    
    exportarMatrizGeneral();
    exportarFichasIndividuales();
    alert('Archivos Excel exportados exitosamente');
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
        const promedio = evasEst.length > 0 
            ? evasEst.reduce((sum, e) => sum + (e.nota_individual || 0), 0) / evasEst.length 
            : null;
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
        notaCell.value = promedio ? parseFloat(promedio.toFixed(2)) : null;
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
                const desc = eva[`${cr.key}_descripcion`] || '';
                
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
    const nivel = Math.round(Math.min(5, Math.max(0, puntaje)));
    return criterio.niveles[nivel] || '';
}

async function exportarRespuestasCrudas() {
    const evaluadoresUnicos = [...new Set(evaluaciones.filter(e => e.estado === 'completada').map(e => e.evaluador_id))];
    
    if (evaluadoresUnicos.length === 0) {
        alert('No hay evaluaciones completadas para exportar');
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
    alert('Archivo de respuestas crudas exportado exitosamente');
}
