(function (root) {
    'use strict';
    const MAX_FILE = 50 * 1024 * 1024;
    const BUDGET = 1000 * 1000 * 1000;
    const MIME = {
        pdf: 'application/pdf', doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12'
    };
    function normalize(name) {
        return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
    }
    function extension(name) { return String(name).split('.').pop().toLowerCase(); }
    function kind(name) {
        const ext = extension(name);
        return ['pdf', 'doc', 'docx'].includes(ext) ? 'plan' : ['xls', 'xlsx', 'xlsm'].includes(ext) ? 'simulador' : null;
    }
    function ignored(path) { return path.split('/').some(part => part.startsWith('.') || part === '__MACOSX' || part.startsWith('~$')); }
    function group(files, students) {
        const groups = new Map();
        for (const file of files) {
            const path = file.webkitRelativePath || file.name;
            if (ignored(path)) continue;
            const parts = path.split('/');
            const index = parts.findIndex(p => /^(.+)_(\d+)_assignsubmission_file$/.test(p));
            const folder = index >= 0 ? parts.slice(0, index + 1).join('/') : parts.slice(0, -1).join('/') || '(sin carpeta)';
            if (!groups.has(folder)) {
                const segment = index >= 0 ? parts[index] : folder.split('/').pop();
                const match = segment.match(/^(.+)_(\d+)_assignsubmission_file$/);
                const name = match ? match[1] : segment;
                const matches = students.filter(s => normalize(s.nombre_completo) === normalize(name));
                groups.set(folder, { folder, name, recognized: Boolean(match), studentId: matches.length === 1 ? matches[0].id : '',
                    matching: matches.length, confirmed: false, plan: [], simulador: [], other: [], choice: { plan: '', simulador: '' },
                    status: {}, pending: {} });
            }
            const row = groups.get(folder);
            // Entrega excepcional autorizada: el simulador de Vanessa llegó como PDF.
            const simulatorPdf = normalize(row.name) === 'vanessa fernanda torres barbosa'
                && normalize(file.name) === 'simulador 2026 plan de negocio (1).pdf';
            const type = simulatorPdf ? 'simulador' : kind(file.name);
            row[type || 'other'].push(file);
        }
        return [...groups.values()].map((row, id) => {
            for (const type of ['plan', 'simulador']) if (row[type].length === 1) row.choice[type] = '0';
            return { ...row, id };
        });
    }
    function selected(row, type) { return row.choice[type] === '' ? null : row[type][Number(row.choice[type])] || null; }
    function rowErrors(row, rows) {
        const errors = [];
        if (!row.studentId) errors.push('Selecciona un participante');
        if (row.studentId && rows.some(r => r !== row && r.confirmed && r.studentId === row.studentId)) errors.push('Participante repetido en otra carpeta confirmada');
        for (const type of ['plan', 'simulador']) {
            const file = selected(row, type);
            if (row[type].length > 1 && !file) errors.push('Elige un archivo para ' + type);
            if (file && (!file.size || file.size > MAX_FILE)) errors.push(file.name + ': vacío o superior a 50 MiB');
            if (file && file.name.length > 255) errors.push('Nombre de archivo superior a 255 caracteres');
        }
        if (!selected(row, 'plan') && !selected(row, 'simulador')) errors.push('Sin documentos seleccionados');
        return errors;
    }
    const api = { MAX_FILE, BUDGET, MIME, normalize, extension, kind, ignored, group, selected, rowErrors };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.DocumentosCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
