// NODE_PATH=/tmp/mdfp-documentos-tests/node_modules node --test pruebas/tests/documentos.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { JSDOM } = require('jsdom');
const XLSX = require('xlsx');
const C = require('../documentos-core.js');
const source = fs.readFileSync(path.join(__dirname, '../documentos.js'), 'utf8');
const student = { id: 's', nombre_completo: 'María   Pérez', cedula: '123' };
function file(name, content, folder = 'Maria Perez_42_assignsubmission_file') {
    const f = new File([content], name);
    Object.defineProperty(f, 'webkitRelativePath', { value: `Entregas/${folder}/${name}` });
    return f;
}
function workbook() {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['<img src=x onerror=alert(1)>', 42], ['Total', 5]]), 'Ingresos');
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Costos', 10]]), 'Costos');
    return file('simulador.xlsx', XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }));
}
test('solo el PDF autorizado de Vanessa se clasifica como simulador', () => {
    const name = 'Simulador 2026 plan de negocio (1).pdf';
    const rows = C.group([
        file(name, '%PDF-1.4', 'VANESSA FERNANDA TORRES BARBOSA_73144_assignsubmission_file'),
        file('Plan de negocio.pdf', '%PDF-1.4', 'VANESSA FERNANDA TORRES BARBOSA_73144_assignsubmission_file'),
        file(name, '%PDF-1.4')
    ], []);
    assert.equal(C.selected(rows[0], 'simulador').name, name);
    assert.equal(C.selected(rows[0], 'plan').name, 'Plan de negocio.pdf');
    assert.equal(rows[1].simulador.length, 0);
    assert.equal(C.selected(rows[1], 'plan').name, name);
});
function harness() {
    const dom = new JSDOM(`<main id="main-screen"><div id="view-documentos"></div><button id="docs-eval-plan" disabled>Ver plan de negocio</button><span id="docs-eval-status"></span><button id="docs-eval-retry" hidden>Reintentar</button><div id="docs-viewer-home" hidden><div id="docs-viewer"><div id="docs-viewer-content"></div></div></div><textarea id="comentario-global">Sin perder cambios</textarea><input id="decimal-test" value="4"></main><div id="docs-admin-modal" hidden><header><h3 id="docs-viewer-title"></h3><button id="docs-download-plan" hidden></button><button id="docs-download-excel" hidden></button><button id="docs-admin-close">Volver a calificar</button></header><div id="docs-modal-body"></div></div>`, { runScripts: 'outside-only', url: 'http://localhost' });
    const ctx = dom.getInternalVMContext(), w = dom.window;
    let db = null, metadataFail = false, uploadFail = false, reloadFail = false, removeFail = false, nextMetadata = null, nextDownload = null;
    const calls = { upload: 0, remove: 0, download: 0, confirm: 0, clicks: 0, revoked: 0, scroll: [], downloads: [] }, objects = new Map(), toasts = [], urlBlobs = new Map();
    const bucket = {
        async upload(p, f) { calls.upload++; if (uploadFail) { uploadFail = false; return { error: { message: 'sin conexión' } }; } objects.set(p, f); return { data: { path: p } }; },
        async list(prefix) { return { data: [...objects].filter(([p]) => p.startsWith(prefix + '/')).map(([p, f]) => ({ name: p.slice(prefix.length + 1), metadata: { size: f.size } })) }; },
        async remove(paths) { calls.remove++; if (removeFail) return { error: { message: 'limpieza fallida' } }; paths.forEach(p => objects.delete(p)); return { data: [] }; },
        async download(p) { calls.download++; if (nextDownload) { const pending = nextDownload; nextDownload = null; return await pending; } if (!objects.has(p)) return { error: { message: 'archivo ausente' } }; return { data: objects.get(p) }; },
        async createSignedUrl(p, seconds) { assert.equal(seconds, 300); return { data: { signedUrl: 'https://example.invalid/signed' } }; }
    };
    w.DocumentosCore = C; w.TextDecoder = TextDecoder; w.XLSX = XLSX;
    Object.defineProperty(w, 'crypto', { value: webcrypto });
    w.URL.createObjectURL = blob => { const url = 'blob:http://localhost/' + urlBlobs.size + '-' + Math.random(); urlBlobs.set(url, blob); return url; }; w.URL.revokeObjectURL = url => { calls.revoked++; urlBlobs.delete(url); };
    w.scrollTo = (x, y) => { calls.scroll.push([x, y]); };
    w.HTMLAnchorElement.prototype.click = function () { calls.clicks++; calls.downloads.push({ name: this.download, blob: urlBlobs.get(this.href) }); };
    w.estudiantes = [student]; w.currentUser = { id: 'u' }; w.userProfile = { rol: 'admin' }; w.cursoActual = { id: 'c' }; w.DEMO_MODE = false;
    w.esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    w.confirmar = async () => { calls.confirm++; return true; };
    w.toast = Object.fromEntries(['error', 'warning', 'success'].map(type => [type, msg => toasts.push({ type, msg })]));
    w.supabaseClient = { storage: { from: () => bucket }, from: () => {
        const q = { eq() { return this; }, select() { return this; }, maybeSingle: async () => ({ data: db }),
            async single() { if (metadataFail) { metadataFail = false; return { error: { message: 'registro fallido' } }; } db = { id: 'd', ...q.payload }; return { data: db }; },
            update(data) { this.payload = data; return this; }, insert(data) { this.payload = data; return this; },
            then(resolve, reject) { if (nextMetadata) { const pending = nextMetadata; nextMetadata = null; return pending.then(resolve, reject); } return (reloadFail ? Promise.reject(new Error('recarga')) : Promise.resolve({ data: Array.isArray(db) ? db : db ? [db] : [] })).then(resolve, reject); }
        }; return q;
    } };
    const instrumented = source.replace('return { render, openStudent, clearViewer, reset, init, validate };', 'return { render, openStudent, clearViewer, reset, init, validate, uploadOne, upload, showType, preview, downloadOriginal, setRows: value => { rows = value; }, getRows: () => rows };');
    vm.runInContext(instrumented + '\nglobalThis.api = Documentos;', ctx);
    w.api.init();
    return { w, api: w.api, calls, objects, toasts, get db() { return db; }, set db(value) { db = value; }, failMetadata() { metadataFail = true; }, failUpload() { uploadFail = true; }, failReload() { reloadFail = true; }, failRemove() { removeFail = true; }, delayMetadata(promise) { nextMetadata = promise; }, delayDownload(promise) { nextDownload = promise; } };
}
test('normalización, identificación del sistema y asociación única', () => {
    const row = C.group([file('plan.pdf', '%PDF-1.4'), workbook(), file('.DS_Store', 'x')], [student])[0];
    assert.equal(row.studentId, 's'); assert.equal(row.name, 'Maria Perez'); assert.equal(row.confirmed, false);
    assert.equal(row.plan.length, 1); assert.equal(row.simulador.length, 1); assert.equal(C.rowErrors(row, [row]).length, 0);
});
test('nombres duplicados, carpeta desconocida, varios archivos y entrega incompleta', () => {
    const ambiguous = C.group([file('plan.pdf', '%PDF-'), file('plan2.pdf', '%PDF-')], [student, { ...student, id: 'other' }])[0];
    assert.equal(ambiguous.studentId, ''); assert.equal(ambiguous.choice.plan, '');
    assert(C.rowErrors(ambiguous, [ambiguous]).length >= 2);
    const unknown = C.group([file('plan.docx', 'PK', 'Carpeta desconocida')], [student])[0];
    assert.equal(unknown.recognized, false); assert.equal(unknown.studentId, '');
    unknown.studentId = 's'; assert.equal(C.rowErrors(unknown, [unknown]).length, 0);
});
test('límite por archivo y participante repetido en carpetas confirmadas', () => {
    const row = C.group([file('plan.pdf', '%PDF-')], [student])[0];
    Object.defineProperty(row.plan[0], 'size', { value: C.MAX_FILE + 1 });
    assert(C.rowErrors(row, [row]).some(e => e.includes('50 MiB')));
    assert(C.rowErrors(row, [row, { ...row, confirmed: true }]).some(e => e.includes('repetido')));
});
test('rechaza PDF falso y Excel corrupto; admite Excel real de varias hojas', async () => {
    const h = harness();
    await assert.rejects(() => h.api.validate(file('plan.pdf', 'no PDF')), /formato/);
    await assert.rejects(() => h.api.validate(file('plan.xlsx', Buffer.from([0x50,0x4b,3,4,0]))), /dañado/);
    await h.api.validate(workbook());
});
test('guarda una vez; reintentar no repite el archivo confirmado', async () => {
    const h = harness(), row = C.group([file('plan.pdf', '%PDF-1.4\nficticio')], [student])[0];
    assert.equal(await h.api.uploadOne(row, 'plan', 'c'), 'Guardado');
    assert.match(await h.api.uploadOne(row, 'plan', 'c'), /Ya guardado/);
    assert.equal(h.calls.upload, 1); assert.equal(h.db.tipo, 'plan');
});
test('fallo al registrar conserva documento anterior y reintenta sin repetir subida', async () => {
    const h = harness(), row = C.group([file('plan.pdf', '%PDF-1.4\nnuevo')], [student])[0];
    h.db = { id: 'old', nombre_original: 'anterior.pdf', ruta: 'old', sha256: '0'.repeat(64) };
    h.objects.set('old', new Blob(['anterior'])); h.failMetadata();
    await assert.rejects(() => h.api.uploadOne(row, 'plan', 'c'));
    assert.equal(h.db.ruta, 'old'); assert.equal(h.calls.remove, 0); assert(h.objects.has('old'));
    await h.api.uploadOne(row, 'plan', 'c'); assert.equal(h.calls.upload, 1); assert.equal(h.calls.remove, 1); assert(!h.objects.has('old'));
});
test('fallo de subida permite reintentar; falla de limpieza conserva el nuevo registro', async () => {
    const h = harness(), row = C.group([file('plan.pdf', '%PDF-1.4\nnuevo')], [student])[0];
    h.failUpload(); await assert.rejects(() => h.api.uploadOne(row, 'plan', 'c')); assert.equal(h.db, null);
    await h.api.uploadOne(row, 'plan', 'c'); assert.equal(h.calls.upload, 2);
    row.plan[0] = file('nuevo.pdf', '%PDF-1.4\nsegundo'); h.failRemove();
    assert.match(await h.api.uploadOne(row, 'plan', 'c'), /pendiente limpiar/); assert.equal(h.db.nombre_original, 'nuevo.pdf');
});
test('solo Excel permite abrir el visor del plan y descargar el original con bytes intactos', async () => {
    const h = harness(), f = workbook(); h.objects.set('excel', f);
    h.db = { id: 'd', estudiante_id: 's', curso_id: 'c', tipo: 'simulador', nombre_original: f.name, ruta: 'excel', tamano: f.size };
    await h.api.openStudent(student);
    h.w.document.getElementById('docs-eval-plan').click();
    h.w.document.getElementById('docs-download-excel').click(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.calls.download, 1); assert.equal(h.calls.clicks, 1);
    assert.equal(h.calls.downloads[0].name, f.name);
    assert.deepEqual(Buffer.from(await h.calls.downloads[0].blob.arrayBuffer()), Buffer.from(await f.arrayBuffer()));
    assert.equal(h.w.document.getElementById('docs-admin-modal').hidden, false);
    assert.equal(h.w.document.querySelectorAll('.docs-sheet-scroll').length, 0);
    assert.equal(h.w.document.getElementById('comentario-global').value, 'Sin perder cambios');
    assert.equal(h.w.document.getElementById('decimal-test').value, '4');
});
test('PDF en iframe con descarga; Word solo abre o descarga', async () => {
    const h = harness(), f = file('plan.pdf', '%PDF-1.4\nficticio'); h.objects.set('pdf', f);
    h.db = { id: 'd', tipo: 'plan', nombre_original: f.name, ruta: 'pdf', tamano: f.size };
    await h.api.openStudent(student); const host = h.w.document.getElementById('docs-viewer-content');
    h.w.document.getElementById('docs-eval-plan').click(); await new Promise(resolve => setImmediate(resolve)); assert(host.querySelector('iframe'));
    assert.equal(h.w.document.getElementById('docs-download-plan').textContent, 'Descargar PDF');
    h.db = { ...h.db, nombre_original: 'plan.docx' }; await h.api.openStudent(student);
    assert(host.textContent.includes('Documento Word')); assert.equal(h.w.document.getElementById('docs-download-plan').textContent, 'Descargar Word');
});
test('archivo ausente y recarga fallida muestran error sin borrar rúbrica', async () => {
    const h = harness(); h.db = { id: 'd', tipo: 'plan', nombre_original: 'ausente.pdf', ruta: 'ausente', tamano: 10 };
    await h.api.openStudent(student); const host = h.w.document.getElementById('docs-viewer-content'); h.w.document.getElementById('docs-eval-plan').click(); await new Promise(resolve => setImmediate(resolve));
    assert(host.textContent.includes('No se pudo mostrar')); h.failReload(); await h.api.openStudent(student);
    assert(host.textContent.includes('No se pudieron consultar')); assert.equal(h.w.document.getElementById('comentario-global').value, 'Sin perder cambios');
});
test('cancelar reemplazo no toca el archivo actual', async () => {
    const h = harness(), row = C.group([file('plan.pdf', '%PDF-1.4\nnuevo')], [student])[0];
    h.db = { id: 'old', nombre_original: 'anterior.pdf', ruta: 'old', sha256: '0'.repeat(64) };
    h.w.confirmar = async () => false;
    assert.equal(await h.api.uploadOne(row, 'plan', 'c'), 'Reemplazo omitido');
    assert.equal(h.calls.upload, 0); assert.equal(h.calls.remove, 0); assert.equal(h.db.ruta, 'old');
});
test('respuesta de subida perdida se reconcilia sin volver a enviar el archivo', async () => {
    const h = harness(), row = C.group([file('plan.pdf', '%PDF-1.4\nficticio')], [student])[0];
    const pending = { path: 'c/s/plan/ficticio.pdf', attempted: true, uploaded: false };
    const digest = Buffer.from(await webcrypto.subtle.digest('SHA-256', await row.plan[0].arrayBuffer())).toString('hex');
    row.pending['c/s/plan/' + digest] = pending; h.objects.set(pending.path, row.plan[0]);
    await h.api.uploadOne(row, 'plan', 'c'); assert.equal(h.calls.upload, 0); assert.equal(h.db.ruta, pending.path);
});
test('doble clic en carga masiva produce una sola subida', async () => {
    const h = harness(), row = C.group([file('plan.pdf', '%PDF-1.4\nficticio')], [student])[0];
    h.api.render(); await new Promise(resolve => setImmediate(resolve));
    row.confirmed = true; h.api.setRows([row]);
    const first = h.api.upload(); const second = h.api.upload(); await Promise.all([first, second]);
    assert.equal(h.calls.upload, 1); assert.equal(h.db.estudiante_id, 's');
});
test('revisión local antes de subir permite descargar sin consultar Storage', async () => {
    const h = harness(); h.api.render(); await new Promise(resolve => setImmediate(resolve));
    const input = h.w.document.getElementById('docs-folder');
    Object.defineProperty(input, 'files', { value: [file('plan.pdf', '%PDF-1.4\nficticio')] });
    input.dispatchEvent(new h.w.Event('change'));
    h.w.document.querySelector('[data-local-preview]').click();
    await new Promise(resolve => setImmediate(resolve));
    const panel = h.w.document.getElementById('docs-viewer-content');
    await h.w.document.getElementById('docs-download-plan').onclick();
    assert.equal(h.calls.clicks, 1); assert.equal(h.calls.download, 0); assert.equal(h.calls.upload, 0);
    assert.equal(h.w.document.getElementById('docs-admin-modal').hidden, false);
    h.w.document.getElementById('docs-admin-close').click();
    assert.equal(h.w.document.getElementById('docs-admin-modal').hidden, true);
    assert(h.w.document.querySelector('#docs-viewer-home #docs-viewer'));
});
test('integración de HTML, navegación por rol y formulario completo', async () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost' });
    const ctx = dom.getInternalVMContext(), w = dom.window;
    w.DEMO_MODE = true; w.DEMO_USERS = [{ id: 'u', email: 'demo@example.invalid', nombre_completo: 'Profesor ficticio', rol: 'evaluador' }]; w.DEMO_ESTUDIANTES = [student];
    w.XLSX = XLSX; w.TextDecoder = TextDecoder; w.DocumentosCore = C;
    w.URL.createObjectURL = () => 'blob:ficticio'; w.URL.revokeObjectURL = () => {};
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8'), ctx);
    vm.runInContext(source, ctx);
    vm.runInContext("currentUser = DEMO_USERS[0]; userProfile = DEMO_USERS[0];", ctx);
    await vm.runInContext('showMainScreen()', ctx);
    assert.equal(w.document.querySelector('[data-view="documentos"]').style.display, 'none');
    assert.equal(w.document.getElementById('header-program-title').hidden, true);
    assert.equal(w.document.getElementById('evaluator-branding').hidden, false);
    vm.runInContext('showEvalForm(estudiantes[0])', ctx);
    assert(w.document.querySelector('.eval-workspace .eval-form'));
    assert(w.document.querySelector('.eval-workspace #docs-viewer'));
    assert.equal(w.document.getElementById('docs-viewer-home').hidden, true);
    assert(w.document.getElementById('docs-admin-modal').contains(w.document.getElementById('docs-viewer-title')));
    assert(w.document.getElementById('criterios-container').children.length > 0);
    assert(w.document.getElementById('docs-viewer-content').textContent.includes('No se han cargado'));
    assert.equal(w.document.getElementById('docs-eval-simulador'), null);
    vm.runInContext('switchView("documentos")', ctx);
    assert(!w.document.getElementById('view-documentos').classList.contains('active'));
    vm.runInContext("userProfile = {...DEMO_USERS[0], rol:'admin'};", ctx);
    await vm.runInContext('showMainScreen()', ctx); vm.runInContext('switchView("documentos")', ctx);
    assert(w.document.getElementById('view-documentos').classList.contains('active'));
    assert.equal(w.document.getElementById('header-program-title').hidden, true);
    assert.equal(w.document.getElementById('evaluator-branding').hidden, false);
    assert(w.document.querySelector('.main-header').classList.contains('evaluator-header'));
    assert.equal(w.document.getElementById('user-role').textContent, 'Administrador');
    assert(w.document.getElementById('docs-folder').hasAttribute('webkitdirectory'));
    await new Promise(resolve => setImmediate(resolve));
    dom.window.close();
});
test('visor bajo demanda conserva comentario, puntaje, desplazamiento, foco y caché', async () => {
    const h = harness(), f = file('plan.pdf', '%PDF-1.4\nficticio');
    h.objects.set('pdf', f); h.db = { id: 'd', tipo: 'plan', ruta: 'pdf', nombre_original: f.name, tamano: f.size };
    Object.defineProperty(h.w, 'scrollY', { value: 640 });
    h.w.document.body.style.overflow = 'scroll';
    await h.api.openStudent(student);
    const button = h.w.document.getElementById('docs-eval-plan'), modal = h.w.document.getElementById('docs-admin-modal');
    assert.equal(modal.hidden, true); assert.equal(h.calls.download, 0); assert.equal(button.disabled, false);
    assert.equal(h.w.document.getElementById('docs-download-excel').hidden, true);
    button.focus(); button.click(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(modal.hidden, false); assert.equal(h.calls.download, 1); assert.equal(h.w.document.body.style.overflow, 'hidden');
    assert(h.w.document.getElementById('main-screen').hasAttribute('inert'));
    assert.equal(h.w.document.activeElement.id, 'docs-admin-close');
    h.w.document.dispatchEvent(new h.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(modal.hidden, true); assert.equal(h.w.document.activeElement, button);
    assert.equal(h.w.document.body.style.overflow, 'scroll'); assert(!h.w.document.getElementById('main-screen').hasAttribute('inert'));
    assert.deepEqual(h.calls.scroll, [[0, 640]]);
    assert.equal(h.w.document.getElementById('comentario-global').value, 'Sin perder cambios');
    assert.equal(h.w.document.getElementById('decimal-test').value, '4');
    button.click(); await new Promise(resolve => setImmediate(resolve)); assert.equal(h.calls.download, 1);
    h.w.document.getElementById('docs-admin-close').click(); assert.equal(h.calls.revoked, 0);
    await h.api.openStudent({ id: 'other', nombre_completo: 'Otra persona' }); assert.equal(h.calls.revoked, 1);
});
test('Tab y Shift+Tab permanecen en el visor, y cerrar sesión desbloquea la página', async () => {
    const h = harness(); h.db = { id: 'd', tipo: 'plan', ruta: 'word', nombre_original: 'plan.docx', tamano: 10 };
    await h.api.openStudent(student); h.w.document.getElementById('docs-eval-plan').click();
    const modal = h.w.document.getElementById('docs-admin-modal'), close = h.w.document.getElementById('docs-admin-close');
    const first = h.w.document.getElementById('docs-download-plan'), last = close;
    first.focus(); h.w.document.dispatchEvent(new h.w.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true, bubbles: true }));
    assert.equal(h.w.document.activeElement, last);
    h.w.document.dispatchEvent(new h.w.KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true }));
    assert.equal(h.w.document.activeElement, first);
    h.api.reset(); assert.equal(modal.hidden, true); assert.equal(h.w.document.body.style.overflow, '');
    assert(!h.w.document.getElementById('main-screen').hasAttribute('inert'));
});
test('respuesta tardía de otro participante no actualiza disponibilidad ni título', async () => {
    const h = harness(); let deliver;
    h.delayMetadata(new Promise(resolve => { deliver = resolve; }));
    const first = h.api.openStudent(student); await new Promise(resolve => setImmediate(resolve));
    h.db = null;
    await h.api.openStudent({ id: 'other', nombre_completo: 'Otra persona' });
    deliver({ data: [{ id: 'd', tipo: 'plan', ruta: 'old', nombre_original: 'anterior.pdf', tamano: 10 }] }); await first;
    assert.equal(h.w.document.getElementById('docs-eval-plan').disabled, true);
    assert(h.w.document.getElementById('docs-viewer-title').textContent.includes('Otra persona'));
    assert.equal(h.w.document.getElementById('docs-admin-modal').hidden, true);
});
test('simulador registrado y simulador local se descargan sin visor ni tablas', async () => {
    const h = harness(), f = workbook(); h.objects.set('excel', f);
    h.db = { id: 'd', estudiante_id: 's', curso_id: 'c', tipo: 'simulador', nombre_original: f.name, ruta: 'excel', tamano: f.size };
    h.api.render(); await new Promise(resolve => setImmediate(resolve));
    const registered = h.w.document.querySelector('[data-doc-open]');
    assert.equal(registered.textContent, 'Descargar simulador Excel'); registered.click();
    await new Promise(resolve => setImmediate(resolve)); assert.equal(h.calls.download, 1);
    const input = h.w.document.getElementById('docs-folder'); Object.defineProperty(input, 'files', { value: [f] });
    input.dispatchEvent(new h.w.Event('change'));
    const local = h.w.document.querySelector('[data-local-preview="simulador"]');
    assert.equal(local.textContent, 'Descargar simulador Excel'); local.click();
    await new Promise(resolve => setImmediate(resolve)); assert.equal(h.calls.download, 1); assert.equal(h.calls.clicks, 2);
    assert.equal(h.calls.downloads[1].name, f.name);
    assert.deepEqual(Buffer.from(await h.calls.downloads[1].blob.arrayBuffer()), Buffer.from(await f.arrayBuffer()));
    assert.equal(h.w.document.getElementById('docs-admin-modal').hidden, true);
});
test('descarga fallida permite reintentar y bloquea doble clic mientras está pendiente', async () => {
    const h = harness(), f = workbook(); let deliver;
    h.db = { id: 'd', tipo: 'simulador', nombre_original: f.name, ruta: 'excel', tamano: f.size };
    await h.api.openStudent(student);
    const button = h.w.document.getElementById('docs-download-excel');
    h.delayDownload(new Promise(resolve => { deliver = resolve; })); button.click(); button.click();
    assert.equal(h.calls.download, 1); assert.equal(button.disabled, true);
    deliver({ error: { message: 'sin conexión' } }); await new Promise(resolve => setImmediate(resolve));
    assert.equal(button.disabled, false); assert(h.toasts.some(t => t.type === 'error'));
    h.objects.set('excel', f); button.click(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.calls.clicks, 1); assert.equal(button.disabled, false);
});
test('cambiar participante cancela una descarga tardía y conserva estado del nuevo botón', async () => {
    const h = harness(), f = workbook(); let deliver;
    h.db = { id: 'd', tipo: 'simulador', nombre_original: f.name, ruta: 'excel', tamano: f.size };
    await h.api.openStudent(student); h.delayDownload(new Promise(resolve => { deliver = resolve; }));
    const button = h.w.document.getElementById('docs-download-excel'); button.click();
    h.db = null; await h.api.openStudent({ id: 'other', nombre_completo: 'Otra persona' });
    deliver({ data: f }); await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.calls.clicks, 0); assert.equal(button.disabled, true); assert.equal(h.toasts.length, 0);
});
test('descargar simulador desde el visor mantiene el PDF y bloquea otro clic al redibujarlo', async () => {
    const h = harness(); h.api.render(); await new Promise(resolve => setImmediate(resolve));
    const input = h.w.document.getElementById('docs-folder');
    Object.defineProperty(input, 'files', { value: [file('plan.pdf', '%PDF-1.4\nficticio'), workbook()] });
    input.dispatchEvent(new h.w.Event('change'));
    h.w.document.querySelector('[data-local-preview="plan"]').click(); await new Promise(resolve => setImmediate(resolve));
    const button = h.w.document.getElementById('docs-download-excel'); button.click();
    h.api.showType('plan'); assert.equal(button.disabled, true); button.click();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.calls.clicks, 1); assert.equal(button.disabled, false);
    assert(h.w.document.querySelector('#docs-viewer-content iframe'));
    assert.equal(h.w.document.getElementById('docs-admin-modal').hidden, false);
    assert.equal(h.w.document.querySelectorAll('.docs-sheet-scroll').length, 0);
});
test('cabecera única con PDF y Excel, carga automática y sin acciones redundantes', async () => {
    const h = harness(), pdf = file('negocio.pdf', '%PDF-1.4\nficticio'), excel = workbook();
    h.objects.set('pdf', pdf); h.objects.set('excel', excel);
    h.db = [{ id: 'p', tipo: 'plan', ruta: 'pdf', nombre_original: pdf.name, tamano: pdf.size }, { id: 'e', tipo: 'simulador', ruta: 'excel', nombre_original: excel.name, tamano: excel.size }];
    await h.api.openStudent(student); assert.equal(h.calls.download, 0);
    h.w.document.getElementById('docs-eval-plan').click(); await new Promise(resolve => setImmediate(resolve));
    const panel = h.w.document.getElementById('docs-viewer-content');
    assert(panel.querySelector('iframe')); assert.equal(panel.querySelectorAll('button').length, 0);
    assert.equal(h.w.document.getElementById('docs-download-plan').textContent, 'Descargar PDF');
    assert.equal(h.w.document.getElementById('docs-download-excel').hidden, false);
    await h.w.document.getElementById('docs-download-excel').onclick();
    await h.w.document.getElementById('docs-download-plan').onclick();
    assert.deepEqual(h.calls.downloads.map(d => d.name), [excel.name, pdf.name]);
    assert.equal(h.calls.download, 2); assert(panel.querySelector('iframe'));
});
test('PDF con error permite reintentar y mantiene descarga disponible', async () => {
    const h = harness(), pdf = file('plan.pdf', '%PDF-1.4\nficticio');
    h.db = { id: 'p', tipo: 'plan', ruta: 'pdf', nombre_original: pdf.name, tamano: pdf.size };
    await h.api.openStudent(student); h.w.document.getElementById('docs-eval-plan').click(); await new Promise(resolve => setImmediate(resolve));
    const panel = h.w.document.getElementById('docs-viewer-content');
    assert(panel.textContent.includes('No se pudo mostrar el PDF'));
    assert.equal(h.w.document.getElementById('docs-download-plan').hidden, false);
    h.objects.set('pdf', pdf); await panel.querySelector('button').onclick(); assert(panel.querySelector('iframe'));
    panel.querySelector('iframe').onerror(); assert(panel.textContent.includes('No se pudo mostrar el PDF'));
});
