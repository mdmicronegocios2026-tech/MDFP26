'use strict';

const Documentos = (() => {
    const C = DocumentosCore;
    let rows = [], records = [], loading = false, uploading = false, generation = 0;
    let panelStudent = null, panelRecords = [], panelType = 'plan';
    let contextMode = 'evaluation', metadataState = 'idle', modalMode = null;
    let returnFocus = null, savedScroll = null, savedOverflow = '', backgroundWasInert = false;
    const blobs = new Map();
    const downloading = new WeakMap();
    const $ = id => document.getElementById(id);
    const mb = n => (n / 1000000).toFixed(1) + ' MB';
    const message = err => err?.message || 'No se pudo conectar con el servicio.';
    const bucket = () => supabaseClient.storage.from('entregas');
    const admin = () => userProfile?.rol === 'admin';
    function check(result) { if (result.error) throw result.error; return result.data; }
    async function metadata() {
        const data = check(await supabaseClient.from('documentos').select('*').eq('curso_id', cursoActual.id));
        return data || [];
    }
    function render() {
        if (!admin()) return;
        const host = $('view-documentos');
        host.innerHTML = `<h2>Documentos de los participantes</h2>
            <p>Primero importa los participantes y sus asignaciones. Después selecciona la carpeta descomprimida de entregas.</p>
            <div class="docs-toolbar"><label class="btn btn-primary docs-picker">Seleccionar carpeta
            <input id="docs-folder" type="file" webkitdirectory multiple ${uploading || loading ? 'disabled' : ''}></label>
            <button id="docs-refresh" class="btn btn-secondary" ${uploading || loading ? 'disabled' : ''}>Actualizar documentos</button></div>
            <p id="docs-summary" role="status" aria-live="polite"></p>
            <p>Máximo por archivo: 50 MiB. Los archivos se guardan de forma privada. Confirma cada asociación antes de subir.</p>
            <div id="docs-preview"></div>
            <div class="docs-toolbar"><button id="docs-upload" class="btn btn-success" ${uploading || loading ? 'disabled' : ''}>Subir filas confirmadas / reintentar pendientes</button></div>
            <p id="docs-progress" role="status" aria-live="polite"></p>
            <h3>Documentos registrados</h3><div id="docs-registered"></div>`;
        $('docs-folder').addEventListener('change', async event => {
            rows = C.group([...event.target.files], estudiantes);
            paintRows();
        });
        $('docs-refresh').addEventListener('click', () => refresh());
        $('docs-upload').addEventListener('click', upload);
        paintRows();
        refresh();
    }
    async function refresh() {
        if (!admin() || loading || uploading) return;
        loading = true; controls(true);
        try {
            records = DEMO_MODE ? [] : await metadata();
            if (!admin() || !$('docs-summary')) return;
            paintRows(); paintRegistered();
        } catch (err) {
            if (admin() && $('docs-summary')) {
                $('docs-summary').textContent = 'No se pudieron consultar los documentos. Usa Actualizar para reintentar.';
                toast.error(message(err));
            }
        } finally { loading = false; controls(false); }
    }
    function controls(disabled) {
        $('view-documentos')?.querySelectorAll('input, select, button').forEach(el => { el.disabled = disabled; });
    }
    function paintRegistered() {
        const host = $('docs-registered');
        if (!host) return;
        if (!records.length) { host.textContent = 'Todavía no hay documentos registrados.'; return; }
        host.innerHTML = '<div class="docs-table-scroll"><table><thead><tr><th>Participante</th><th>Tipo</th><th>Archivo</th><th>Tamaño</th><th>Consulta</th></tr></thead><tbody>' +
            records.map((d, index) => `<tr><td>${esc(estudiantes.find(s => s.id === d.estudiante_id)?.nombre_completo || 'Participante')}</td>
            <td>${d.tipo === 'plan' ? 'Plan de negocio' : 'Simulador'}</td><td>${esc(d.nombre_original)}</td><td>${mb(d.tamano)}</td>
            <td><button class="btn btn-secondary" data-doc-open="${index}">${d.tipo === 'simulador' ? (C.extension(d.nombre_original) === 'pdf' ? 'Descargar simulador (PDF)' : 'Descargar simulador Excel') : 'Vista previa y descarga'}</button></td></tr>`).join('') + '</tbody></table></div>';
        host.querySelectorAll('[data-doc-open]').forEach(btn => btn.addEventListener('click', () => {
            const d = records[Number(btn.dataset.docOpen)];
            if (d.tipo === 'simulador') downloadOriginal(d, btn);
            else openAdmin(d.estudiante_id, d.tipo);
        }));
    }
    function paintRows() {
        if (!$('docs-preview')) return;
        const files = rows.flatMap(r => [...r.plan, ...r.simulador]);
        const total = records.reduce((sum, d) => sum + Number(d.tamano), 0);
        $('docs-summary').textContent = `${rows.length} carpetas · ${files.length} archivos admitidos · ${mb(files.reduce((sum, f) => sum + f.size, 0))} en el lote · ${mb(total)} registrados en este curso.`;
        if (!rows.length) { $('docs-preview').textContent = ''; return; }
        $('docs-preview').innerHTML = '<div class="docs-table-scroll"><table><thead><tr><th>Confirmar</th><th>Carpeta / participante</th><th>Plan de negocio</th><th>Simulador financiero</th><th>Revisión</th></tr></thead><tbody>' +
            rows.map(r => `<tr><td><input type="checkbox" data-confirm="${r.id}" ${r.confirmed ? 'checked' : ''} aria-label="Confirmar asociación de ${esc(r.name)}"></td>
            <td><strong>${esc(r.name)}</strong><small>${esc(r.folder)}</small>
            <select data-student="${r.id}" aria-label="Participante para ${esc(r.name)}"><option value="">Seleccionar participante</option>${estudiantes.map(s => `<option value="${esc(s.id)}" ${r.studentId === s.id ? 'selected' : ''}>${esc(s.nombre_completo)} · ${esc(s.cedula)}</option>`).join('')}</select></td>
            ${['plan', 'simulador'].map(type => `<td>${fileChoice(r, type)}<small>${esc(r.status[type] || '')}</small></td>`).join('')}
            <td>${rowNotes(r)}</td></tr>`).join('') + '</tbody></table></div>';
        $('docs-preview').querySelectorAll('[data-confirm]').forEach(el => el.addEventListener('change', () => { rows[Number(el.dataset.confirm)].confirmed = el.checked; paintRows(); }));
        $('docs-preview').querySelectorAll('[data-student]').forEach(el => el.addEventListener('change', () => {
            const r = rows[Number(el.dataset.student)]; r.studentId = el.value; r.confirmed = false; r.status = {}; paintRows();
        }));
        $('docs-preview').querySelectorAll('[data-choice]').forEach(el => el.addEventListener('change', () => {
            const r = rows[Number(el.dataset.row)]; r.choice[el.dataset.choice] = el.value; r.confirmed = false; r.status[el.dataset.choice] = ''; paintRows();
        }));
        $('docs-preview').querySelectorAll('[data-local-preview]').forEach(el => el.addEventListener('click', () => {
            const row = rows[Number(el.dataset.row)], type = el.dataset.localPreview;
            if (type === 'simulador') {
                const file = C.selected(row, type);
                if (file) downloadOriginal({ nombre_original: file.name, localFile: file }, el);
            } else openLocal(row, type);
        }));
        if (uploading) controls(true);
    }
    function fileChoice(r, type) {
        if (!r[type].length) return '<span class="docs-muted">Sin entrega</span>';
        return `<select data-choice="${type}" data-row="${r.id}" aria-label="Archivo ${type} para ${esc(r.name)}"><option value="">Elegir archivo</option>${r[type].map((f, i) => `<option value="${i}" ${r.choice[type] === String(i) ? 'selected' : ''}>${esc(f.name)} (${mb(f.size)})</option>`).join('')}</select>
            ${C.selected(r, type) ? `<button class="docs-local-preview" data-local-preview="${type}" data-row="${r.id}">${type === 'simulador' ? (C.extension(C.selected(r, type).name) === 'pdf' ? 'Descargar simulador (PDF)' : 'Descargar simulador Excel') : 'Vista previa y descarga'}</button>` : ''}`;
    }
    function rowNotes(r) {
        const notes = C.rowErrors(r, rows);
        if (!r.recognized) notes.push('Formato de carpeta desconocido: revisar asociación');
        if (r.matching > 1) notes.push('Nombre duplicado: seleccionar por cédula');
        if (!C.selected(r, 'plan')) notes.push('Falta plan de negocio');
        if (!C.selected(r, 'simulador')) notes.push('Falta simulador');
        if (r.other.length) notes.push(`${r.other.length} archivo(s) no admitido(s), no se subirán`);
        const f = C.selected(r, 'plan');
        if (f && C.extension(f.name) !== 'pdf') notes.push('Word: descarga disponible, sin vista integrada');
        for (const type of ['plan', 'simulador']) {
            const old = records.find(d => d.estudiante_id === r.studentId && d.tipo === type);
            if (old && C.selected(r, type)) notes.push(`Registrado: ${old.nombre_original}; se comprobará si requiere reemplazo`);
        }
        return (notes.length ? notes : ['Lista para confirmar']).map(n => `<small>${esc(n)}</small>`).join('');
    }
    async function validate(file) {
        if (!file.size || file.size > C.MAX_FILE) throw new Error('El archivo está vacío o supera 50 MiB.');
        const ext = C.extension(file.name);
        if (!C.MIME[ext]) throw new Error('Formato no admitido.');
        const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
        const zip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 3 && bytes[3] === 4;
        const ole = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every((v, i) => bytes[i] === v);
        const pdf = new TextDecoder().decode(bytes).includes('%PDF-');
        if ((ext === 'pdf' && !pdf) || (['docx', 'xlsx', 'xlsm'].includes(ext) && !zip) || (['doc', 'xls'].includes(ext) && !ole)) throw new Error('El contenido no coincide con el formato del archivo.');
        if (['xlsx', 'xls', 'xlsm'].includes(ext)) {
            try {
                const book = XLSX.read(await file.arrayBuffer(), { type: 'array', bookSheets: true });
                if (!book.SheetNames?.length) throw new Error();
            } catch (_) { throw new Error('El Excel está dañado, protegido o no se puede interpretar.'); }
        }
    }
    async function hash(file) {
        const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
        return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    async function uploadOne(row, type, courseId) {
        const file = C.selected(row, type);
        await validate(file);
        const sha256 = await hash(file);
        const old = check(await supabaseClient.from('documentos').select('*').eq('estudiante_id', row.studentId).eq('curso_id', courseId).eq('tipo', type).maybeSingle());
        if (old?.sha256 === sha256 && old.nombre_original === file.name) return 'Ya guardado · sin repetir subida';
        if (old && !await confirmar({ titulo: 'Reemplazar documento', mensaje: `Participante: ${estudiantes.find(s => s.id === row.studentId)?.nombre_completo}. Archivo actual: ${old.nombre_original}. Nuevo: ${file.name}. El actual se conservará hasta confirmar el reemplazo.`, confirmarTexto: 'Reemplazar' })) return 'Reemplazo omitido';
        const key = `${courseId}/${row.studentId}/${type}/${sha256}`;
        let pending = row.pending[key];
        if (!pending) {
            pending = { path: `${courseId}/${row.studentId}/${type}/${crypto.randomUUID()}.${C.extension(file.name)}`, attempted: false, uploaded: false };
            row.pending[key] = pending;
        }
        // Tras una respuesta perdida, comprobar el objeto de ruta única antes de repetir.
        if (pending.attempted && !pending.uploaded) {
            const split = pending.path.lastIndexOf('/');
            const found = check(await bucket().list(pending.path.slice(0, split), { search: pending.path.slice(split + 1) }));
            pending.uploaded = found.some(f => f.name === pending.path.slice(split + 1) && Number(f.metadata?.size) === file.size);
        }
        if (!pending.uploaded) {
            pending.attempted = true;
            check(await bucket().upload(pending.path, file, { contentType: C.MIME[C.extension(file.name)], upsert: false, cacheControl: '3600' }));
            pending.uploaded = true;
        }
        const data = { estudiante_id: row.studentId, curso_id: courseId, tipo: type, nombre_original: file.name, ruta: pending.path, tamano: file.size, sha256, creado_en: new Date().toISOString() };
        const op = old ? supabaseClient.from('documentos').update(data).eq('id', old.id).eq('ruta', old.ruta) : supabaseClient.from('documentos').insert(data);
        const saved = check(await op.select('*').single());
        if (!saved?.id) throw new Error('No se pudo confirmar el registro del documento.');
        delete row.pending[key];
        if (old && old.ruta !== saved.ruta) {
            try { check(await bucket().remove([old.ruta])); }
            catch (_) { return 'Guardado · pendiente limpiar archivo anterior'; }
        }
        return 'Guardado';
    }
    async function upload() {
        if (!admin() || uploading || loading) return;
        if (DEMO_MODE) { toast.warning('La carga de archivos requiere conexión con Supabase.'); return; }
        const chosen = rows.filter(r => r.confirmed);
        if (!chosen.length) { toast.warning('Confirma al menos una asociación.'); return; }
        if (chosen.some(r => C.rowErrors(r, chosen).length)) { toast.warning('Corrige los problemas de las filas confirmadas antes de subir.'); return; }
        uploading = true; controls(true);
        const courseId = cursoActual.id;
        const userId = currentUser.id;
        let done = 0, failed = 0;
        try {
            records = await metadata();
            const bytes = chosen.reduce((sum, r) => sum + ['plan', 'simulador'].reduce((n, type) => n + (C.selected(r, type)?.size || 0), 0), 0);
            const current = records.reduce((sum, d) => sum + Number(d.tamano), 0);
            if (current + bytes > C.BUDGET) throw new Error('El lote más los archivos registrados supera el presupuesto de 1 GB. Divide el lote o revisa el almacenamiento antes de continuar.');
            const total = chosen.reduce((sum, r) => sum + ['plan', 'simulador'].filter(t => C.selected(r, t)).length, 0);
            for (const row of chosen) for (const type of ['plan', 'simulador']) {
                if (!C.selected(row, type)) continue;
                if (currentUser?.id !== userId || !admin() || !$('docs-progress')) throw new Error('La sesión cambió. La carga se detuvo; vuelve a seleccionar la carpeta para continuar.');
                row.status[type] = 'Subiendo…'; paintRows();
                $('docs-progress').textContent = `${done} de ${total} procesados. Archivo: ${C.selected(row, type).name}`;
                try { row.status[type] = await uploadOne(row, type, courseId); }
                catch (err) { row.status[type] = 'Error: ' + message(err) + ' Puedes reintentar.'; failed++; }
                done++; paintRows();
            }
            $('docs-progress').textContent = `${done} archivo(s) procesados; ${failed} con error. Los archivos ya guardados no se volverán a subir al reintentar.`;
            try { records = await metadata(); paintRegistered(); }
            catch (_) { toast.warning('Terminó la carga, pero no se pudo actualizar la lista. Usa Actualizar documentos.'); }
        } catch (err) { toast.error(message(err)); }
        finally { uploading = false; paintRows(); controls(false); }
    }
    function clearViewer() {
        hideModal(false);
        generation++;
        for (const entry of blobs.values()) if (entry.url) URL.revokeObjectURL(entry.url);
        blobs.clear(); panelRecords = []; panelStudent = null;
        $('docs-viewer-content')?.replaceChildren();
        metadataState = 'idle'; updateAvailability(); updateDownloadActions();
    }
    function updateAvailability() {
        const button = $('docs-eval-plan');
        if (button) button.disabled = metadataState !== 'ready' || !panelRecords.length;
        const status = $('docs-eval-status');
        if (status) {
            if (metadataState === 'loading') status.textContent = 'Consultando documentos…';
            else if (metadataState === 'error') status.textContent = 'No se pudo consultar la disponibilidad de los documentos.';
            else if (metadataState !== 'ready') status.textContent = '';
            else if (!panelRecords.length) status.textContent = 'Aún no se han cargado documentos para este participante.';
            else status.textContent = ['plan', 'simulador'].filter(type => !panelRecords.some(d => d.tipo === type)).map(type => type === 'plan' ? 'Plan de negocio pendiente de entrega.' : 'Simulador financiero pendiente de entrega.').join(' ');
        }
        if ($('docs-eval-retry')) $('docs-eval-retry').hidden = metadataState !== 'error';
    }
    async function openStudent(student, type = 'plan', evaluation = true) {
        clearViewer();
        contextMode = evaluation ? 'evaluation' : 'admin';
        panelStudent = student; panelType = type;
        metadataState = 'loading'; updateAvailability();
        const token = generation;
        $('docs-viewer-title').textContent = `Plan de negocio · ${student.nombre_completo}`;
        $('docs-viewer-content').textContent = 'Consultando documentos…';
        try {
            if (DEMO_MODE) panelRecords = [];
            else {
                const docs = check(await supabaseClient.from('documentos').select('*').eq('estudiante_id', student.id).eq('curso_id', cursoActual.id));
                if (token !== generation) return;
                panelRecords = docs || [];
            }
            if (token === generation) {
                metadataState = 'ready'; updateAvailability(); showType(type);
            }
        } catch (err) {
            if (token !== generation) return;
            metadataState = 'error'; updateAvailability();
            $('docs-viewer-content').textContent = 'No se pudieron consultar los documentos. ' + message(err);
            const retry = document.createElement('button'); retry.className = 'btn btn-secondary'; retry.textContent = 'Reintentar';
            retry.onclick = () => retryMetadata(student, type, evaluation); $('docs-viewer-content').append(retry);
        }
    }
    async function retryMetadata(student, type, evaluation) {
        const wasOpen = !$('docs-admin-modal').hidden;
        const pending = openStudent(student, type, evaluation);
        if (wasOpen) showModal(evaluation ? 'evaluation' : 'admin');
        await pending;
    }
    function showModal(mode) {
        const modal = $('docs-admin-modal');
        if (modal.hidden) {
            returnFocus = document.activeElement;
            savedScroll = { x: window.scrollX || 0, y: window.scrollY || 0 };
            savedOverflow = document.body.style.overflow;
            backgroundWasInert = Boolean($('main-screen')?.hasAttribute('inert'));
            document.body.style.overflow = 'hidden';
            $('main-screen')?.setAttribute('inert', '');
        }
        modalMode = mode; modal.hidden = false;
        ($('docs-modal-body') || modal).append($('docs-viewer'));
        $('docs-admin-close').textContent = mode === 'evaluation' ? 'Volver a calificar' : 'Cerrar vista previa';
        $('docs-admin-close').focus({ preventScroll: true });
    }
    function hideModal(restore) {
        const modal = $('docs-admin-modal');
        if (!modal) return;
        const wasOpen = !modal.hidden;
        modal.hidden = true;
        if ($('docs-viewer-home') && $('docs-viewer')) $('docs-viewer-home').append($('docs-viewer'));
        if (wasOpen) {
            document.body.style.overflow = savedOverflow;
            if (!backgroundWasInert) $('main-screen')?.removeAttribute('inert');
            if (restore && savedScroll) window.scrollTo(savedScroll.x, savedScroll.y);
            if (restore && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
        }
        savedScroll = null; returnFocus = null; modalMode = null;
    }
    function openEvaluation() {
        if (contextMode !== 'evaluation' || metadataState !== 'ready' || !panelStudent || !panelRecords.length) return;
        showModal('evaluation'); showType('plan');
    }
    function updateDownloadActions() {
        for (const [type, id] of [['plan', 'docs-download-plan'], ['simulador', 'docs-download-excel']]) {
            const button = $(id), doc = panelRecords.find(d => d.tipo === type);
            if (!button) continue;
            button.hidden = !doc;
            button.disabled = !doc || downloading.get(button) === generation;
            if (type === 'plan') button.textContent = doc && C.extension(doc.nombre_original) !== 'pdf' ? 'Descargar Word' : 'Descargar PDF';
            else button.textContent = doc && C.extension(doc.nombre_original) === 'pdf' ? 'Descargar simulador (PDF)' : 'Descargar Excel';
        }
    }
    function showType() {
        panelType = 'plan'; updateDownloadActions();
        const host = $('docs-viewer-content'), d = panelRecords.find(d => d.tipo === 'plan');
        host.replaceChildren();
        if (!d) {
            const note = document.createElement('p'); note.className = 'docs-viewer-message';
            note.textContent = panelRecords.some(d => d.tipo === 'simulador')
                ? 'No se ha cargado el plan de negocio. Puedes descargar el simulador con Descargar Excel.'
                : 'No se han cargado documentos para este participante.';
            host.append(note); return;
        }
        const ext = C.extension(d.nombre_original);
        if (ext !== 'pdf') {
            const note = document.createElement('p'); note.className = 'docs-viewer-message';
            note.textContent = 'Documento Word: utiliza Descargar Word. Para verlo dentro de la plataforma se requiere un PDF.';
            host.append(note); return;
        }
        const view = document.createElement('div'); view.className = 'docs-file-preview'; host.append(view);
        if (blobs.has(d.ruta) || !$('docs-admin-modal').hidden) preview(d, view);
        else view.textContent = 'El PDF está disponible para consultar.';
    }
    async function getBlob(d, token) {
        if (blobs.has(d.ruta)) return blobs.get(d.ruta);
        const blob = check(await bucket().download(d.ruta));
        if (token !== generation) throw new Error('La vista cambió; vuelve a solicitar el archivo.');
        const entry = { blob, url: URL.createObjectURL(blob) };
        blobs.set(d.ruta, entry); return entry;
    }
    async function downloadOriginal(d, button) {
        if (button.disabled) return;
        button.disabled = true; const token = generation;
        downloading.set(button, token);
        let localUrl = null;
        try {
            const { url } = d.localFile ? { url: (localUrl = URL.createObjectURL(d.localFile)) } : await getBlob(d, token);
            if (token !== generation) return;
            const link = document.createElement('a'); link.href = url; link.download = d.nombre_original;
            document.body.append(link); link.click(); link.remove();
        } catch (err) { if (token === generation) toast.error('No se pudo descargar: ' + message(err)); }
        finally {
            if (downloading.get(button) === token) downloading.delete(button);
            if (localUrl) window.setTimeout(() => URL.revokeObjectURL(localUrl), 1000);
            if (token === generation) {
                button.disabled = false;
                updateAvailability(); updateDownloadActions();
            }
        }
    }
    function previewError(d, host, token, err) {
        if (token !== generation || !host.isConnected) return;
        host.replaceChildren(); host.removeAttribute('aria-busy');
        const note = document.createElement('p'); note.className = 'docs-viewer-message';
        note.textContent = 'No se pudo mostrar el PDF. Puedes descargarlo o reintentar. ' + message(err);
        const retry = document.createElement('button'); retry.className = 'btn btn-secondary docs-preview-retry'; retry.textContent = 'Reintentar vista del PDF';
        retry.onclick = () => preview(d, host); host.append(note, retry);
    }
    async function preview(d, host) {
        const token = generation;
        host.textContent = 'Cargando PDF…'; host.setAttribute('aria-busy', 'true');
        try {
            const { url } = await getBlob(d, token);
            if (token !== generation || !host.isConnected) return;
            host.replaceChildren(); host.removeAttribute('aria-busy');
            if (navigator.pdfViewerEnabled === false) {
                host.textContent = 'Este navegador no puede mostrar el PDF integrado. Utiliza Descargar PDF para consultarlo.';
                return;
            }
            const frame = document.createElement('iframe'); frame.src = url + '#view=FitH'; frame.title = 'Plan de negocio PDF';
            frame.onerror = () => previewError(d, host, token, new Error('El navegador no pudo abrir el documento.'));
            host.append(frame);
        } catch (err) { previewError(d, host, token, err); }
    }
    async function openAdmin(id, type) {
        const student = estudiantes.find(s => s.id === id); if (!student) return;
        const pending = openStudent(student, type, false);
        showModal('admin');
        await pending;
    }
    function openLocal(row, type) {
        clearViewer();
        panelStudent = { nombre_completo: row.name };
        for (const kind of ['plan', 'simulador']) {
            const file = C.selected(row, kind);
            if (!file || !file.size || file.size > C.MAX_FILE) continue;
            const ruta = `local/${row.id}/${kind}/${row.choice[kind]}`;
            panelRecords.push({ tipo: kind, nombre_original: file.name, tamano: file.size, ruta, local: true });
            blobs.set(ruta, { blob: file, url: URL.createObjectURL(file) });
        }
        contextMode = 'local';
        showModal('local');
        $('docs-viewer-title').textContent = `Revisión antes de subir · ${row.name}`;
        showType(type);
    }
    function closeAdmin() {
        const keep = modalMode === 'evaluation';
        hideModal(true);
        if (!keep) clearViewer();
    }
    function init() {
        $('docs-download-plan').onclick = () => {
            const doc = panelRecords.find(d => d.tipo === 'plan');
            if (doc) return downloadOriginal(doc, $('docs-download-plan'));
        };
        $('docs-download-excel').onclick = () => {
            const doc = panelRecords.find(d => d.tipo === 'simulador');
            if (doc) return downloadOriginal(doc, $('docs-download-excel'));
        };
        $('docs-admin-close').onclick = closeAdmin;
        if ($('docs-eval-plan')) $('docs-eval-plan').onclick = () => openEvaluation('plan');
        if ($('docs-eval-retry')) $('docs-eval-retry').onclick = () => { if (panelStudent) retryMetadata(panelStudent, panelType, true); };
        $('docs-admin-modal').addEventListener('click', e => { if (e.target.id === 'docs-admin-modal') closeAdmin(); });
        document.addEventListener('keydown', e => {
            const modal = $('docs-admin-modal');
            if (modal.hidden) return;
            if (e.key === 'Escape') { e.preventDefault(); closeAdmin(); return; }
            if (e.key === 'Tab') {
                const focusable = [...modal.querySelectorAll('button:not(:disabled), a[href], select, input:not(:disabled), [tabindex="0"]')].filter(el => !el.closest('[hidden]'));
                const first = focusable[0], last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
            }
        });
    }
    function reset() {
        clearViewer(); rows = []; records = [];
        $('view-documentos')?.replaceChildren();
        if ($('docs-admin-modal')) closeAdmin();
    }
    return { render, openStudent, clearViewer, reset, init, validate };
})();
document.addEventListener('DOMContentLoaded', Documentos.init);
