// DCT-OS Frontend
// Vanilla JS + AG-Grid Community — no framework

const API = '';
let activeProjectId = null;
let activePanel = 'empty';
let projectFilter = 'Active';
let projectSearchTerm = '';

// AG-Grid instances
let docketsGridApi = null;
let costCodesGridApi = null;
let resourcesGridApi = null;
let workOrdersGridApi = null;
let purchaseOrdersGridApi = null;

// Current modal context
let modalContext = null;

// Cached data for dropdowns
let cachedWorkOrders = [];
let cachedCostCodes = [];
let cachedPurchaseOrders = [];
let cachedResources = [];
let cachedSuppliers = [];

// Docket line management
let docketLineCounter = 0;

// Report state
let reportMode = 'date';
let reportDockets = [];

// Folder browse state
let browseFiles = [];
let browseFileIndex = -1;
let browseHashes = {};

// --- Helpers ---

async function apiFetch(url) {
    const resp = await fetch(API + url);
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
    }
    return resp.json();
}

async function apiRequest(method, url, body) {
    const resp = await fetch(API + url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast(err.error || `Error ${resp.status}`, 'error');
        throw new Error(err.error || `HTTP ${resp.status}`);
    }
    return resp.json();
}

function currency(val) {
    if (val == null || val === '') return '';
    return '$' + Number(val).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function currencyFormatter(params) {
    return currency(params.value);
}

function toast(msg, type) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => { el.className = 'toast'; }, 3000);
}

// --- Projects ---

let allProjects = [];

async function loadProjects() {
    try {
        allProjects = await apiFetch('/api/projects?status=' + projectFilter);
        renderProjectList();
    } catch (e) {
        toast('Failed to load projects', 'error');
    }
}

function renderProjectList() {
    const container = document.getElementById('project-list');
    const term = projectSearchTerm.toLowerCase();
    const filtered = allProjects.filter(p =>
        !term || p.name.toLowerCase().includes(term) || (p.code || '').toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#999;font-size:13px">No projects found</div>';
        return;
    }

    container.innerHTML = filtered.map(p => `
        <div class="project-item${p.id === activeProjectId ? ' active' : ''}"
             onclick="selectProject(${p.id})">
            <div class="project-name">${esc(p.name)}</div>
            <div class="project-meta">
                ${p.code ? '<span class="project-code">' + esc(p.code) + '</span>' : ''}
                ${p.client ? '<span>' + esc(p.client) + '</span>' : ''}
            </div>
        </div>
    `).join('');
}

function filterProjects(term) {
    projectSearchTerm = term;
    renderProjectList();
}

function setProjectFilter(status, btn) {
    projectFilter = status;
    document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    loadProjects();
}

async function selectProject(id) {
    activeProjectId = id;
    const project = allProjects.find(p => p.id === id);
    if (project) {
        document.getElementById('active-project-name').textContent = project.name;
    }
    renderProjectList();

    await refreshProjectData();

    if (activePanel === 'empty') {
        showPanel('dockets');
    } else {
        await refreshCurrentPanel();
    }
}

async function refreshProjectData() {
    if (!activeProjectId) return;
    try {
        [cachedWorkOrders, cachedCostCodes, cachedPurchaseOrders, cachedSuppliers] = await Promise.all([
            apiFetch(`/api/projects/${activeProjectId}/work-orders`),
            apiFetch(`/api/projects/${activeProjectId}/cost-codes`),
            apiFetch(`/api/projects/${activeProjectId}/purchase-orders`),
            apiFetch(`/api/projects/${activeProjectId}/suppliers`),
        ]);
    } catch (e) { /* non-critical */ }
    if (cachedResources.length === 0) {
        try { cachedResources = await apiFetch('/api/resources'); } catch (e) {}
    }
}

function supplierDatalistHtml() {
    return '<datalist id="supplier-options">' +
        cachedSuppliers.map(s => '<option value="' + esc(s) + '">').join('') +
        '</datalist>';
}

// --- Panels ---

function showPanel(name) {
    activePanel = name;
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const panel = document.getElementById('panel-' + name);
    const tab = document.getElementById('tab-' + name);
    if (panel) panel.classList.add('active');
    if (tab) tab.classList.add('active');

    refreshCurrentPanel();
}

async function refreshCurrentPanel() {
    if (!activeProjectId && activePanel !== 'resources') return;

    switch (activePanel) {
        case 'dockets': await loadDockets(); await loadSummary(); break;
        case 'cost-codes': await loadCostCodes(); break;
        case 'work-orders': await loadWorkOrders(); break;
        case 'purchase-orders': await loadPurchaseOrders(); break;
        case 'resources': await loadResources(); break;
        case 'reports': loadReportFilters(); break;
    }
}

// --- Dockets Grid (header-level) ---

function initDocketsGrid() {
    const columnDefs = [
        { field: 'date', headerName: 'Date', width: 110, sort: 'desc' },
        { field: 'docket_number', headerName: 'Docket #', width: 120 },
        { field: 'supplier_name', headerName: 'Supplier', width: 180 },
        { field: 'po_number', headerName: 'PO', width: 90 },
        { field: 'line_count', headerName: 'Lines', width: 70, type: 'numericColumn' },
        { field: 'wo_numbers', headerName: 'WOs', width: 130,
            valueFormatter: p => p.value || '' },
        { field: 'cost_codes', headerName: 'CCs', width: 130,
            valueFormatter: p => p.value || '' },
        { field: 'total_amount', headerName: 'Amount', width: 130, type: 'numericColumn', valueFormatter: currencyFormatter },
    ];

    const gridOptions = {
        columnDefs,
        rowData: [],
        defaultColDef: { resizable: true, sortable: true, filter: true },
        animateRows: true,
        pagination: true,
        paginationPageSize: 50,
        suppressCellFocus: true,
        onRowDoubleClicked: params => openDocketDialog(params.data),
    };

    const el = document.getElementById('dockets-grid');
    docketsGridApi = agGrid.createGrid(el, gridOptions);
}

async function loadDockets() {
    if (!activeProjectId || !docketsGridApi) return;
    try {
        const data = await apiFetch(`/api/projects/${activeProjectId}/dockets`);
        docketsGridApi.setGridOption('rowData', data);
    } catch (e) {
        toast('Failed to load dockets', 'error');
    }
}

async function loadSummary() {
    if (!activeProjectId) return;
    try {
        const s = await apiFetch(`/api/projects/${activeProjectId}/summary`);
        document.getElementById('stat-count').textContent = s.total_dockets;
        document.getElementById('stat-spend').textContent = currency(s.total_spend);
        document.getElementById('stat-suppliers').textContent = s.supplier_count;
    } catch (e) { /* non-critical */ }
}

// --- Cost Codes Grid ---

function initCostCodesGrid() {
    const columnDefs = [
        { field: 'code', headerName: 'Code', width: 120 },
        { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
        { field: 'budget_amount', headerName: 'Budget', width: 140, type: 'numericColumn', valueFormatter: currencyFormatter },
    ];

    const gridOptions = {
        columnDefs,
        rowData: [],
        defaultColDef: { resizable: true, sortable: true, filter: true },
        animateRows: true,
        suppressCellFocus: true,
        onRowDoubleClicked: params => openCostCodeDialog(params.data),
    };

    const el = document.getElementById('cost-codes-grid');
    costCodesGridApi = agGrid.createGrid(el, gridOptions);
}

async function loadCostCodes() {
    if (!activeProjectId || !costCodesGridApi) return;
    try {
        const data = await apiFetch(`/api/projects/${activeProjectId}/cost-codes`);
        costCodesGridApi.setGridOption('rowData', data);
        cachedCostCodes = data;
    } catch (e) {
        toast('Failed to load cost codes', 'error');
    }
}

// --- Work Orders Grid ---

function initWorkOrdersGrid() {
    const columnDefs = [
        { field: 'number', headerName: 'WO Number', width: 140 },
        { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
        { field: 'status', headerName: 'Status', width: 100 },
    ];

    const gridOptions = {
        columnDefs,
        rowData: [],
        defaultColDef: { resizable: true, sortable: true, filter: true },
        animateRows: true,
        suppressCellFocus: true,
        onRowDoubleClicked: params => openWorkOrderDialog(params.data),
    };

    const el = document.getElementById('work-orders-grid');
    workOrdersGridApi = agGrid.createGrid(el, gridOptions);
}

async function loadWorkOrders() {
    if (!activeProjectId || !workOrdersGridApi) return;
    try {
        const data = await apiFetch(`/api/projects/${activeProjectId}/work-orders`);
        workOrdersGridApi.setGridOption('rowData', data);
        cachedWorkOrders = data;
    } catch (e) {
        toast('Failed to load work orders', 'error');
    }
}

// --- Purchase Orders Grid ---

function initPurchaseOrdersGrid() {
    const columnDefs = [
        { field: 'number', headerName: 'PO Number', width: 120 },
        { field: 'supplier_name', headerName: 'Supplier', flex: 1, minWidth: 180 },
        { field: 'value', headerName: 'PO Value', width: 130, type: 'numericColumn', valueFormatter: currencyFormatter },
        { field: 'spent', headerName: 'Spent', width: 130, type: 'numericColumn', valueFormatter: currencyFormatter },
        { field: 'remaining', headerName: 'Remaining', width: 130, type: 'numericColumn', valueFormatter: currencyFormatter,
            cellStyle: params => params.value < 0 ? { color: '#dc2626', fontWeight: '600' } : null },
        { field: 'raised_date', headerName: 'Raised', width: 110 },
        { field: 'is_active', headerName: 'Active', width: 80,
            valueFormatter: params => params.value ? 'Yes' : 'No' },
    ];

    const gridOptions = {
        columnDefs,
        rowData: [],
        defaultColDef: { resizable: true, sortable: true, filter: true },
        animateRows: true,
        suppressCellFocus: true,
        onRowDoubleClicked: params => openPurchaseOrderDialog(params.data),
    };

    const el = document.getElementById('purchase-orders-grid');
    purchaseOrdersGridApi = agGrid.createGrid(el, gridOptions);
}

async function loadPurchaseOrders() {
    if (!activeProjectId || !purchaseOrdersGridApi) return;
    try {
        const data = await apiFetch(`/api/projects/${activeProjectId}/purchase-orders`);
        purchaseOrdersGridApi.setGridOption('rowData', data);
        cachedPurchaseOrders = data;
    } catch (e) {
        toast('Failed to load purchase orders', 'error');
    }
}

// --- Resources Grid ---

function initResourcesGrid() {
    const columnDefs = [
        { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
        { field: 'unit', headerName: 'Unit', width: 80 },
        { field: 'supplier_name', headerName: 'Supplier', width: 200 },
        { field: 'standard_rate', headerName: 'Rate', width: 120, type: 'numericColumn', valueFormatter: currencyFormatter },
        { field: 'category', headerName: 'Category', width: 140 },
    ];

    const gridOptions = {
        columnDefs,
        rowData: [],
        defaultColDef: { resizable: true, sortable: true, filter: true },
        animateRows: true,
        pagination: true,
        paginationPageSize: 50,
        suppressCellFocus: true,
        onRowDoubleClicked: params => openResourceDialog(params.data),
    };

    const el = document.getElementById('resources-grid');
    resourcesGridApi = agGrid.createGrid(el, gridOptions);
}

async function loadResources() {
    if (!resourcesGridApi) return;
    try {
        const data = await apiFetch('/api/resources');
        resourcesGridApi.setGridOption('rowData', data);
        cachedResources = data;
    } catch (e) {
        toast('Failed to load resources', 'error');
    }
}

// --- Modals ---

function openModal(title, html, context, wide) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = html;
    const overlay = document.getElementById('modal-overlay');
    const modal = overlay.querySelector('.modal');
    modal.classList.toggle('modal-wide', !!wide);
    overlay.classList.add('open');
    modalContext = context;
    const first = document.querySelector('.modal-body input, .modal-body select');
    if (first) first.focus();
}

function closeModal(event) {
    if (event && event.target !== document.getElementById('modal-overlay')) return;
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('open');
    overlay.querySelector('.modal').classList.remove('modal-wide');
    modalContext = null;
}

async function saveModal() {
    if (!modalContext) return;
    const wasBrowsing = browseFiles.length > 0 && browseFileIndex >= 0;
    try {
        await modalContext.save();
        closeModal();
        await refreshProjectData();
        await refreshCurrentPanel();
        toast(modalContext.successMsg || 'Saved', 'success');
        // If folder browsing, auto-open next pending docket
        if (wasBrowsing) {
            browseNextPending();
            openDocketDialog();
        }
    } catch (e) {
        // error already toasted by apiRequest
    }
}

function openProjectDialog(existing) {
    const e = existing || {};
    const html = `
        <div class="form-group">
            <label>Project Name *</label>
            <input type="text" id="f-proj-name" value="${esc(e.name || '')}">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Code</label>
                <input type="text" id="f-proj-code" value="${esc(e.code || '')}">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="f-proj-status">
                    <option value="Active"${e.status === 'Active' || !e.status ? ' selected' : ''}>Active</option>
                    <option value="Complete"${e.status === 'Complete' ? ' selected' : ''}>Complete</option>
                    <option value="On Hold"${e.status === 'On Hold' ? ' selected' : ''}>On Hold</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Client</label>
            <input type="text" id="f-proj-client" value="${esc(e.client || '')}">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Start Date</label>
                <input type="date" id="f-proj-start" value="${e.start_date || ''}">
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="date" id="f-proj-end" value="${e.end_date || ''}">
            </div>
        </div>
    `;
    openModal(existing ? 'Edit Project' : 'New Project', html, {
        successMsg: existing ? 'Project updated' : 'Project created',
        save: async () => {
            const body = {
                name: document.getElementById('f-proj-name').value,
                code: document.getElementById('f-proj-code').value || null,
                client: document.getElementById('f-proj-client').value || null,
                start_date: document.getElementById('f-proj-start').value || null,
                end_date: document.getElementById('f-proj-end').value || null,
                status: document.getElementById('f-proj-status').value,
            };
            if (!body.name) { toast('Name is required', 'error'); throw new Error('validation'); }
            if (existing) {
                await apiRequest('PUT', `/api/projects/${existing.id}`, body);
            } else {
                await apiRequest('POST', '/api/projects', body);
            }
            await loadProjects();
        },
    });
}

function openCostCodeDialog(existing) {
    if (!activeProjectId) { toast('Select a project first', 'error'); return; }
    const e = existing || {};
    const html = `
        <div class="form-group">
            <label>Code *</label>
            <input type="text" id="f-cc-code" value="${esc(e.code || '')}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <input type="text" id="f-cc-desc" value="${esc(e.description || '')}">
        </div>
        <div class="form-group">
            <label>Budget Amount</label>
            <input type="number" id="f-cc-budget" step="0.01" value="${e.budget_amount || 0}">
        </div>
    `;
    openModal(existing ? 'Edit Cost Code' : 'New Cost Code', html, {
        successMsg: existing ? 'Cost code updated' : 'Cost code created',
        save: async () => {
            const body = {
                code: document.getElementById('f-cc-code').value,
                description: document.getElementById('f-cc-desc').value || null,
                budget_amount: parseFloat(document.getElementById('f-cc-budget').value) || 0,
            };
            if (!body.code) { toast('Code is required', 'error'); throw new Error('validation'); }
            if (existing) {
                await apiRequest('PUT', `/api/cost-codes/${existing.id}`, body);
            } else {
                await apiRequest('POST', `/api/projects/${activeProjectId}/cost-codes`, body);
            }
        },
    });
}

function openWorkOrderDialog(existing) {
    if (!activeProjectId) { toast('Select a project first', 'error'); return; }
    const e = existing || {};
    const html = `
        <div class="form-group">
            <label>WO Number *</label>
            <input type="text" id="f-wo-number" value="${esc(e.number || '')}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <input type="text" id="f-wo-desc" value="${esc(e.description || '')}">
        </div>
        <div class="form-group">
            <label>Status</label>
            <select id="f-wo-status">
                <option value="Active"${e.status === 'Active' || !e.status ? ' selected' : ''}>Active</option>
                <option value="Complete"${e.status === 'Complete' ? ' selected' : ''}>Complete</option>
                <option value="On Hold"${e.status === 'On Hold' ? ' selected' : ''}>On Hold</option>
            </select>
        </div>
    `;
    openModal(existing ? 'Edit Work Order' : 'New Work Order', html, {
        successMsg: existing ? 'Work order updated' : 'Work order created',
        save: async () => {
            const body = {
                number: document.getElementById('f-wo-number').value,
                description: document.getElementById('f-wo-desc').value || null,
                status: document.getElementById('f-wo-status').value,
            };
            if (!body.number) { toast('WO number is required', 'error'); throw new Error('validation'); }
            if (existing) {
                await apiRequest('PUT', `/api/work-orders/${existing.id}`, body);
            } else {
                await apiRequest('POST', `/api/projects/${activeProjectId}/work-orders`, body);
            }
        },
    });
}

function openPurchaseOrderDialog(existing) {
    if (!activeProjectId) { toast('Select a project first', 'error'); return; }
    const e = existing || {};
    const html = `
        <div class="form-row">
            <div class="form-group">
                <label>PO Number *</label>
                <input type="text" id="f-po-number" value="${esc(e.number || '')}">
            </div>
            <div class="form-group">
                <label>PO Value</label>
                <input type="number" id="f-po-value" step="0.01" value="${e.value || 0}">
            </div>
        </div>
        <div class="form-group">
            <label>Supplier</label>
            <input type="text" id="f-po-supplier" value="${esc(e.supplier_name || '')}" list="supplier-options">
            ${supplierDatalistHtml()}
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Raised Date</label>
                <input type="date" id="f-po-raised" value="${e.raised_date || ''}">
            </div>
            <div class="form-group">
                <label>Active</label>
                <select id="f-po-active">
                    <option value="1"${e.is_active !== 0 ? ' selected' : ''}>Yes</option>
                    <option value="0"${e.is_active === 0 ? ' selected' : ''}>No</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Notes</label>
            <textarea id="f-po-notes" rows="2">${esc(e.notes || '')}</textarea>
        </div>
    `;
    openModal(existing ? 'Edit Purchase Order' : 'New Purchase Order', html, {
        successMsg: existing ? 'Purchase order updated' : 'Purchase order created',
        save: async () => {
            const body = {
                number: document.getElementById('f-po-number').value,
                supplier_name: document.getElementById('f-po-supplier').value || null,
                value: parseFloat(document.getElementById('f-po-value').value) || 0,
                raised_date: document.getElementById('f-po-raised').value || null,
                is_active: parseInt(document.getElementById('f-po-active').value),
                notes: document.getElementById('f-po-notes').value || null,
            };
            if (!body.number) { toast('PO number is required', 'error'); throw new Error('validation'); }
            if (existing) {
                await apiRequest('PUT', `/api/purchase-orders/${existing.id}`, body);
            } else {
                await apiRequest('POST', `/api/projects/${activeProjectId}/purchase-orders`, body);
            }
        },
    });
}

function openResourceDialog(existing) {
    const e = existing || {};
    const html = `
        <div class="form-group">
            <label>Description *</label>
            <input type="text" id="f-res-desc" value="${esc(e.description || '')}">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Unit *</label>
                <input type="text" id="f-res-unit" value="${esc(e.unit || '')}" placeholder="Hr, Day, Tonne, m3...">
            </div>
            <div class="form-group">
                <label>Standard Rate</label>
                <input type="number" id="f-res-rate" step="0.01" value="${e.standard_rate || 0}">
            </div>
        </div>
        <div class="form-group">
            <label>Supplier</label>
            <input type="text" id="f-res-supplier" value="${esc(e.supplier_name || '')}" list="supplier-options">
            ${supplierDatalistHtml()}
        </div>
        <div class="form-group">
            <label>Category</label>
            <input type="text" id="f-res-category" value="${esc(e.category || '')}" placeholder="Plant, Labour, Materials...">
        </div>
    `;
    openModal(existing ? 'Edit Resource' : 'New Resource', html, {
        successMsg: existing ? 'Resource updated' : 'Resource created',
        save: async () => {
            const body = {
                description: document.getElementById('f-res-desc').value,
                unit: document.getElementById('f-res-unit').value,
                supplier_name: document.getElementById('f-res-supplier').value || null,
                standard_rate: parseFloat(document.getElementById('f-res-rate').value) || 0,
                category: document.getElementById('f-res-category').value || null,
            };
            if (!body.description || !body.unit) { toast('Description and unit are required', 'error'); throw new Error('validation'); }
            if (existing) {
                await apiRequest('PUT', `/api/resources/${existing.id}`, body);
            } else {
                await apiRequest('POST', '/api/resources', body);
            }
        },
    });
}

// --- Docket Dialog (Header + Lines) ---

function openDocketDialog(existing) {
    if (!activeProjectId) { toast('Select a project first', 'error'); return; }
    const e = existing || {};
    const today = new Date().toISOString().slice(0, 10);
    docketLineCounter = 0;

    const poOptions = cachedPurchaseOrders
        .filter(p => p.is_active)
        .map(p => `<option value="${p.id}"${e.purchase_order_id === p.id ? ' selected' : ''}>${esc(p.number)} — ${esc(p.supplier_name || '')}</option>`)
        .join('');

    const html = `
        <div class="docket-entry" id="docket-entry">
            <div class="pdf-pane" id="docket-pdf-pane">
                <div class="pdf-pane-header">
                    <span>Source Documents</span>
                    <button class="pdf-pane-close" onclick="togglePdfPane()">&times;</button>
                </div>
                <div class="pdf-browse-bar">
                    <button class="btn-sm" onclick="document.getElementById('folder-input').click()">Browse Folder</button>
                    <input type="file" id="folder-input" webkitdirectory multiple accept=".pdf,.jpg,.jpeg,.png" onchange="onFolderSelected(this)">
                </div>
                <div class="pdf-file-list" id="pdf-file-list"></div>
                <div class="pdf-nav-bar" id="pdf-nav-bar" style="display:none">
                    <button onclick="browsePrev()">&laquo; Prev</button>
                    <span id="pdf-nav-info">0 / 0</span>
                    <button onclick="browseNext()">Next &raquo;</button>
                </div>
                <div class="pdf-viewer" id="pdf-viewer">
                    <div class="pdf-placeholder">
                        <div style="font-size:32px;margin-bottom:12px">&#128196;</div>
                        <div>Browse a folder to view source documents</div>
                        <div style="font-size:11px;margin-top:4px;color:var(--text-muted)">PDF, JPG, PNG supported</div>
                    </div>
                </div>
            </div>
            <button class="pdf-toggle" id="pdf-toggle" onclick="togglePdfPane()" title="Toggle PDF viewer">&#9664;</button>
            <div class="docket-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Date *</label>
                        <input type="date" id="f-dk-date" value="${e.date || today}">
                    </div>
                    <div class="form-group">
                        <label>Docket #</label>
                        <input type="text" id="f-dk-number" value="${esc(e.docket_number || '')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Supplier</label>
                        <input type="text" id="f-dk-supplier" value="${esc(e.supplier_name || '')}" list="supplier-options">
                        ${supplierDatalistHtml()}
                    </div>
                    <div class="form-group">
                        <label>Purchase Order</label>
                        <select id="f-dk-po" onchange="onDocketPOChange()">
                            <option value="">-- Select PO --</option>
                            ${poOptions}
                        </select>
                    </div>
                </div>

                <div class="docket-lines-section">
                    <div class="docket-lines-header">
                        <span class="docket-lines-title">Line Items</span>
                        <button class="btn-sm btn-primary" onclick="addDocketLine()">+ Add Line</button>
                    </div>
                    <div class="docket-lines-scroll">
                        <table class="docket-lines-table">
                            <thead>
                                <tr>
                                    <th class="col-wo">WO</th>
                                    <th class="col-cc">CC</th>
                                    <th class="col-res">Resource</th>
                                    <th class="col-desc">Description</th>
                                    <th class="col-qty">Qty</th>
                                    <th class="col-unit">Unit</th>
                                    <th class="col-rate">Rate</th>
                                    <th class="col-amt">Amount</th>
                                    <th class="col-rm"></th>
                                </tr>
                            </thead>
                            <tbody id="docket-lines-body"></tbody>
                        </table>
                    </div>
                </div>

                <div class="docket-total-bar">
                    <span>Total</span>
                    <span class="docket-grand-total" id="docket-grand-total">$0.00</span>
                </div>

                <div class="form-group" style="margin-top:12px">
                    <label>Notes</label>
                    <textarea id="f-dk-notes" rows="2">${esc(e.notes || '')}</textarea>
                </div>
            </div>
        </div>
    `;

    openModal(existing ? 'Edit Docket' : 'New Docket', html, {
        successMsg: existing ? 'Docket updated' : 'Docket created',
        save: async () => {
            const body = {
                date: document.getElementById('f-dk-date').value,
                docket_number: document.getElementById('f-dk-number').value || null,
                supplier_name: document.getElementById('f-dk-supplier').value || null,
                purchase_order_id: parseInt(document.getElementById('f-dk-po').value) || null,
                notes: document.getElementById('f-dk-notes').value || null,
                lines: collectDocketLines(),
                source_hash: getCurrentFileHash(),
                source_filename: getCurrentFileName(),
            };
            if (!body.date) { toast('Date is required', 'error'); throw new Error('validation'); }
            if (body.lines.length === 0) { toast('Add at least one line', 'error'); throw new Error('validation'); }
            if (existing) {
                await apiRequest('PUT', `/api/dockets/${existing.id}`, body);
            } else {
                await apiRequest('POST', `/api/projects/${activeProjectId}/dockets`, body);
            }
            await loadSummary();
            // Mark file as entered and advance to next pending
            if (browseFiles.length > 0 && browseFileIndex >= 0) {
                markCurrentFileEntered();
            }
        },
    }, true);

    // Populate existing lines or add one empty line
    if (e.lines && e.lines.length > 0) {
        e.lines.forEach(ln => addDocketLine(ln));
    } else {
        addDocketLine();
    }
    updateGrandTotal();

    // Restore folder browse state if active
    if (browseFiles.length > 0) {
        renderBrowseFileList();
        if (browseFileIndex >= 0) selectBrowseFile(browseFileIndex);
        // Auto-open PDF pane
        const entry = document.getElementById('docket-entry');
        const toggle = document.getElementById('pdf-toggle');
        if (entry && !entry.classList.contains('pdf-open')) {
            entry.classList.add('pdf-open');
            if (toggle) toggle.innerHTML = '&#9654;';
        }
    }
}

function addDocketLine(data) {
    const idx = docketLineCounter++;
    const d = data || {};

    const woOpts = cachedWorkOrders
        .filter(w => w.status === 'Active')
        .map(w => `<option value="${w.id}"${d.work_order_id === w.id ? ' selected' : ''}>${esc(w.number)}</option>`)
        .join('');

    const ccOpts = cachedCostCodes
        .map(c => `<option value="${c.id}"${d.cost_code_id === c.id ? ' selected' : ''}>${esc(c.code)}</option>`)
        .join('');

    const resOpts = cachedResources
        .map(r => `<option value="${r.id}"${d.resource_id === r.id ? ' selected' : ''}>${esc(r.description)}</option>`)
        .join('');

    const tr = document.createElement('tr');
    tr.id = `dkline-${idx}`;
    tr.innerHTML = `
        <td class="col-wo"><select id="ln-wo-${idx}" onchange="onLineWOChange(${idx})" title="Work Order">
            <option value="">--</option>${woOpts}
        </select></td>
        <td class="col-cc"><select id="ln-cc-${idx}" title="Cost Code">
            <option value="">--</option>${ccOpts}
        </select></td>
        <td class="col-res"><select id="ln-res-${idx}" onchange="onLineResourceChange(${idx})" title="Resource">
            <option value="">--</option>${resOpts}
        </select></td>
        <td class="col-desc"><input type="text" id="ln-desc-${idx}" value="${esc(d.description || '')}" placeholder="Description"></td>
        <td class="col-qty"><input type="number" id="ln-qty-${idx}" step="0.01" value="${d.qty || ''}" oninput="updateLineAmount(${idx})" placeholder="0"></td>
        <td class="col-unit"><input type="text" id="ln-unit-${idx}" value="${esc(d.unit || '')}" placeholder="Hr"></td>
        <td class="col-rate"><input type="number" id="ln-rate-${idx}" step="0.01" value="${d.rate || ''}" oninput="updateLineAmount(${idx})" placeholder="0.00"></td>
        <td class="col-amt"><span id="ln-amt-${idx}" class="line-amount">${currency(d.amount || 0)}</span></td>
        <td class="col-rm"><button class="btn-line-remove" onclick="removeDocketLine(${idx})" title="Remove line">&times;</button></td>
    `;
    document.getElementById('docket-lines-body').appendChild(tr);

    if (d.work_order_id) {
        onLineWOChange(idx);
    }
}

function removeDocketLine(idx) {
    const tr = document.getElementById(`dkline-${idx}`);
    if (tr) tr.remove();
    updateGrandTotal();
}

async function onLineWOChange(idx) {
    const woId = parseInt(document.getElementById(`ln-wo-${idx}`).value);
    const ccSelect = document.getElementById(`ln-cc-${idx}`);
    const currentCC = ccSelect.value;

    if (!woId) {
        ccSelect.innerHTML = '<option value="">--</option>' +
            cachedCostCodes.map(c => `<option value="${c.id}"${c.id == currentCC ? ' selected' : ''}>${esc(c.code)}</option>`).join('');
        return;
    }

    try {
        const validCCs = await apiFetch(`/api/work-orders/${woId}/cost-codes`);
        if (validCCs && validCCs.length > 0) {
            ccSelect.innerHTML = '<option value="">--</option>' +
                validCCs.map(c => `<option value="${c.id}"${c.id == currentCC ? ' selected' : ''}>${esc(c.code)}</option>`).join('');
            if (validCCs.length === 1) ccSelect.value = validCCs[0].id;
        }
    } catch (e) { /* keep full list */ }
}

function onLineResourceChange(idx) {
    const resId = parseInt(document.getElementById(`ln-res-${idx}`).value);
    if (!resId) return;
    const res = cachedResources.find(r => r.id === resId);
    if (!res) return;

    const descEl = document.getElementById(`ln-desc-${idx}`);
    const unitEl = document.getElementById(`ln-unit-${idx}`);
    const rateEl = document.getElementById(`ln-rate-${idx}`);

    if (!descEl.value) descEl.value = res.description;
    unitEl.value = res.unit;
    rateEl.value = res.standard_rate || '';
    updateLineAmount(idx);
}

function updateLineAmount(idx) {
    const qty = parseFloat(document.getElementById(`ln-qty-${idx}`).value) || 0;
    const rate = parseFloat(document.getElementById(`ln-rate-${idx}`).value) || 0;
    const amt = qty * rate;
    document.getElementById(`ln-amt-${idx}`).textContent = currency(amt);
    updateGrandTotal();
}

function updateGrandTotal() {
    let total = 0;
    document.querySelectorAll('#docket-lines-body tr').forEach(tr => {
        const idx = tr.id.replace('dkline-', '');
        const qty = parseFloat(document.getElementById(`ln-qty-${idx}`)?.value) || 0;
        const rate = parseFloat(document.getElementById(`ln-rate-${idx}`)?.value) || 0;
        total += qty * rate;
    });
    const el = document.getElementById('docket-grand-total');
    if (el) el.textContent = currency(total);
}

function collectDocketLines() {
    const lines = [];
    document.querySelectorAll('#docket-lines-body tr').forEach((tr, i) => {
        const idx = tr.id.replace('dkline-', '');
        const qty = parseFloat(document.getElementById(`ln-qty-${idx}`).value) || 0;
        const rate = parseFloat(document.getElementById(`ln-rate-${idx}`).value) || 0;
        lines.push({
            work_order_id: parseInt(document.getElementById(`ln-wo-${idx}`).value) || null,
            cost_code_id: parseInt(document.getElementById(`ln-cc-${idx}`).value) || null,
            resource_id: parseInt(document.getElementById(`ln-res-${idx}`).value) || null,
            description: document.getElementById(`ln-desc-${idx}`).value || null,
            qty,
            unit: document.getElementById(`ln-unit-${idx}`).value || null,
            rate,
            sort_order: i,
        });
    });
    return lines;
}

function togglePdfPane() {
    const entry = document.getElementById('docket-entry');
    const toggle = document.getElementById('pdf-toggle');
    if (!entry) return;
    entry.classList.toggle('pdf-open');
    if (toggle) {
        toggle.innerHTML = entry.classList.contains('pdf-open') ? '&#9654;' : '&#9664;';
    }
}

// --- PO auto-fill supplier ---

function onDocketPOChange() {
    const poId = parseInt(document.getElementById('f-dk-po').value);
    const supplierEl = document.getElementById('f-dk-supplier');
    if (!poId || !supplierEl) return;
    // Only auto-fill if supplier is empty
    if (supplierEl.value) return;
    const po = cachedPurchaseOrders.find(p => p.id === poId);
    if (po && po.supplier_name) {
        supplierEl.value = po.supplier_name;
    }
}

// --- Docket Summary Report ---

function loadReportFilters() {
    const sel = document.getElementById('rpt-supplier');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">-- Select Supplier --</option>' +
        cachedSuppliers.map(s => '<option value="' + esc(s) + '"' +
            (s === current ? ' selected' : '') + '>' + esc(s) + '</option>').join('');
}

function setReportMode(mode, btn) {
    reportMode = mode;
    document.querySelectorAll('#rpt-mode-pills .pill').forEach(p => p.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const dateFields = document.querySelectorAll('.rpt-date-fields');
    const picker = document.getElementById('rpt-docket-picker');
    if (mode === 'date') {
        dateFields.forEach(f => f.style.display = '');
        if (picker) picker.style.display = 'none';
    } else {
        dateFields.forEach(f => f.style.display = 'none');
        if (picker) picker.style.display = '';
    }
}

async function onReportSupplierChange() {
    const supplier = document.getElementById('rpt-supplier').value;
    const listEl = document.getElementById('rpt-docket-list');
    if (!supplier || !activeProjectId || !listEl) {
        reportDockets = [];
        if (listEl) listEl.innerHTML = '';
        return;
    }

    try {
        reportDockets = await apiFetch(
            '/api/projects/' + activeProjectId + '/dockets/by-supplier?supplier=' + encodeURIComponent(supplier)
        );
        renderDocketPicker();
    } catch (e) {
        reportDockets = [];
    }
}

function renderDocketPicker() {
    const listEl = document.getElementById('rpt-docket-list');
    if (!listEl) return;
    if (reportDockets.length === 0) {
        listEl.innerHTML = '<div style="padding:8px;color:#999;font-size:12px">No dockets for this supplier</div>';
        return;
    }
    listEl.innerHTML = reportDockets.map(d =>
        '<label class="docket-chip" data-id="' + d.id + '" onclick="toggleDocketChip(this)">' +
        '<input type="checkbox" value="' + d.id + '" style="display:none">' +
        '<span>' + esc(d.docket_number || d.date) + '</span>' +
        '<span class="chip-amount">' + currency(d.total_amount) + '</span>' +
        '</label>'
    ).join('');
}

function toggleDocketChip(label) {
    const cb = label.querySelector('input[type="checkbox"]');
    cb.checked = !cb.checked;
    label.classList.toggle('selected', cb.checked);
}

function toggleAllDockets(checked) {
    document.querySelectorAll('#rpt-docket-list .docket-chip').forEach(chip => {
        const cb = chip.querySelector('input[type="checkbox"]');
        cb.checked = checked;
        chip.classList.toggle('selected', checked);
    });
}

function getSelectedDocketIds() {
    const ids = [];
    document.querySelectorAll('#rpt-docket-list input[type="checkbox"]:checked').forEach(cb => {
        ids.push(cb.value);
    });
    return ids;
}

function _buildSummaryUrl(base) {
    const supplier = document.getElementById('rpt-supplier').value;
    if (!supplier) return null;
    let url = base + '?supplier=' + encodeURIComponent(supplier);

    if (reportMode === 'dockets') {
        const ids = getSelectedDocketIds();
        if (ids.length > 0) url += '&docket_ids=' + ids.join(',');
    } else {
        const dateFrom = document.getElementById('rpt-date-from').value;
        const dateTo = document.getElementById('rpt-date-to').value;
        if (dateFrom) url += '&date_from=' + dateFrom;
        if (dateTo) url += '&date_to=' + dateTo;
    }
    return url;
}

async function runDocketSummary() {
    if (!activeProjectId) { toast('Select a project first', 'error'); return; }
    const supplier = document.getElementById('rpt-supplier').value;
    if (!supplier) { toast('Select a supplier', 'error'); return; }

    if (reportMode === 'dockets') {
        const ids = getSelectedDocketIds();
        if (ids.length === 0) { toast('Select at least one docket', 'error'); return; }
    }

    const url = _buildSummaryUrl('/api/projects/' + activeProjectId + '/docket-summary');
    try {
        const data = await apiFetch(url);
        renderDocketSummary(data);
        document.getElementById('rpt-csv-btn').style.display = '';
    } catch (e) {
        toast('Failed to generate report', 'error');
    }
}

function renderDocketSummary(data) {
    const output = document.getElementById('report-output');
    if (!data.groups || data.groups.length === 0) {
        output.innerHTML = '<div class="report-empty">No docket data found for this selection.</div>';
        document.getElementById('rpt-csv-btn').style.display = 'none';
        return;
    }

    let subtitle = '';
    if (data.docket_ids) {
        subtitle = 'Selected dockets';
    } else if (data.date_from && data.date_to) {
        subtitle = data.date_from + ' to ' + data.date_to;
    } else if (data.date_from) {
        subtitle = 'From ' + data.date_from;
    } else if (data.date_to) {
        subtitle = 'Up to ' + data.date_to;
    } else {
        subtitle = 'All dates';
    }

    let html = '<div class="report-header">';
    html += '<h3>' + esc(data.supplier) + '</h3>';
    html += '<div class="report-meta">' + subtitle + '</div>';
    html += '</div>';

    html += '<table class="report-table">';
    html += '<thead><tr>';
    html += '<th>Resource</th><th>Unit</th>';
    html += '<th class="col-right">Qty</th>';
    html += '<th class="col-right">Avg Rate</th>';
    html += '<th class="col-right">Subtotal</th>';
    html += '<th class="col-right">Dockets</th>';
    html += '</tr></thead><tbody>';

    data.groups.forEach(function(group) {
        html += '<tr class="category-row"><td colspan="6">' + esc(group.category) + '</td></tr>';
        group.items.forEach(function(item) {
            html += '<tr>';
            html += '<td>' + esc(item.resource_desc) + '</td>';
            html += '<td>' + esc(item.unit || '') + '</td>';
            html += '<td class="col-right">' + (item.total_qty != null ? Number(item.total_qty).toFixed(2) : '') + '</td>';
            html += '<td class="col-right">' + currency(item.avg_rate) + '</td>';
            html += '<td class="col-right">' + currency(item.subtotal) + '</td>';
            html += '<td class="col-right">' + item.docket_count + '</td>';
            html += '</tr>';
        });
        html += '<tr class="subtotal-row">';
        html += '<td colspan="4" style="text-align:right">' + esc(group.category) + ' Subtotal</td>';
        html += '<td class="col-right">' + currency(group.category_total) + '</td>';
        html += '<td></td></tr>';
    });

    html += '<tr class="grand-total-row">';
    html += '<td colspan="4" style="text-align:right">Grand Total</td>';
    html += '<td class="col-right">' + currency(data.grand_total) + '</td>';
    html += '<td></td></tr>';

    html += '</tbody></table>';
    output.innerHTML = html;
}

function exportSummaryCSV() {
    if (!activeProjectId) return;
    const url = _buildSummaryUrl('/api/projects/' + activeProjectId + '/docket-summary/csv');
    if (url) window.open(url, '_blank');
}

// --- Folder Browse (Source Document Entry) ---

async function computeFileHash(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function onFolderSelected(input) {
    if (!input.files || input.files.length === 0) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    browseFiles = Array.from(input.files).filter(f =>
        allowed.includes(f.type) || /\.(pdf|jpe?g|png)$/i.test(f.name)
    );
    browseFiles.sort((a, b) => a.name.localeCompare(b.name));

    if (browseFiles.length === 0) {
        toast('No PDF or image files found', 'error');
        return;
    }

    toast('Hashing ' + browseFiles.length + ' files...', 'success');

    // Compute hashes for all files
    browseHashes = {};
    for (const file of browseFiles) {
        browseHashes[file.name] = await computeFileHash(file);
    }

    // Check which hashes exist on server
    if (activeProjectId) {
        try {
            const allHashes = Object.values(browseHashes);
            const resp = await apiRequest('POST',
                '/api/projects/' + activeProjectId + '/check-hashes',
                { hashes: allHashes }
            );
            const existingSet = new Set(resp.existing.map(e => e.source_hash));
            for (const [name, hash] of Object.entries(browseHashes)) {
                if (existingSet.has(hash)) {
                    browseHashes[name] = { hash, entered: true };
                } else {
                    browseHashes[name] = { hash, entered: false };
                }
            }
        } catch (e) {
            // If check fails, mark all as unknown
            for (const name of Object.keys(browseHashes)) {
                browseHashes[name] = { hash: browseHashes[name], entered: false };
            }
        }
    }

    renderBrowseFileList();
    // Auto-select first un-entered file
    const firstPending = browseFiles.findIndex(f =>
        browseHashes[f.name] && !browseHashes[f.name].entered
    );
    selectBrowseFile(firstPending >= 0 ? firstPending : 0);
}

function renderBrowseFileList() {
    const listEl = document.getElementById('pdf-file-list');
    if (!listEl) return;
    listEl.innerHTML = browseFiles.map((f, i) => {
        const info = browseHashes[f.name] || {};
        const statusClass = info.entered ? 'done' : 'pending';
        const statusIcon = info.entered ? '&#10003;' : '&#9679;';
        const activeClass = i === browseFileIndex ? ' active' : '';
        return '<div class="pdf-file-item' + activeClass + '" onclick="selectBrowseFile(' + i + ')">' +
            '<span class="file-status ' + statusClass + '">' + statusIcon + '</span>' +
            '<span class="pdf-file-name" title="' + esc(f.name) + '">' + esc(f.name) + '</span>' +
            '</div>';
    }).join('');
}

function selectBrowseFile(index) {
    if (index < 0 || index >= browseFiles.length) return;
    browseFileIndex = index;
    const file = browseFiles[index];

    // Show nav bar
    const navBar = document.getElementById('pdf-nav-bar');
    if (navBar) navBar.style.display = '';

    // Update file list highlight
    renderBrowseFileList();

    // Update nav bar
    const navEl = document.getElementById('pdf-nav-info');
    if (navEl) navEl.textContent = (index + 1) + ' / ' + browseFiles.length;

    // Display file in viewer
    const viewer = document.getElementById('pdf-viewer');
    if (!viewer) return;

    const url = URL.createObjectURL(file);
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
        viewer.innerHTML = '<embed src="' + url + '" type="application/pdf">';
    } else {
        viewer.innerHTML = '<img src="' + url + '" alt="' + esc(file.name) + '">';
    }

    // Auto-fill the source filename in the docket form if modal is open
    const fnEl = document.getElementById('f-dk-source-filename');
    if (fnEl) fnEl.value = file.name;
}

function browsePrev() {
    if (browseFileIndex > 0) selectBrowseFile(browseFileIndex - 1);
}

function browseNext() {
    if (browseFileIndex < browseFiles.length - 1) selectBrowseFile(browseFileIndex + 1);
}

function browseNextPending() {
    for (let i = browseFileIndex + 1; i < browseFiles.length; i++) {
        const info = browseHashes[browseFiles[i].name];
        if (info && !info.entered) { selectBrowseFile(i); return; }
    }
    // Wrap around
    for (let i = 0; i < browseFileIndex; i++) {
        const info = browseHashes[browseFiles[i].name];
        if (info && !info.entered) { selectBrowseFile(i); return; }
    }
    toast('All files have been entered!', 'success');
}

function markCurrentFileEntered() {
    if (browseFileIndex < 0 || browseFileIndex >= browseFiles.length) return;
    const name = browseFiles[browseFileIndex].name;
    if (browseHashes[name]) browseHashes[name].entered = true;
    renderBrowseFileList();
}

function getCurrentFileHash() {
    if (browseFileIndex < 0 || browseFileIndex >= browseFiles.length) return null;
    const info = browseHashes[browseFiles[browseFileIndex].name];
    return info ? (typeof info === 'string' ? info : info.hash) : null;
}

function getCurrentFileName() {
    if (browseFileIndex < 0 || browseFileIndex >= browseFiles.length) return null;
    return browseFiles[browseFileIndex].name;
}

// --- Utilities ---

function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Keyboard shortcuts ---

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
    initDocketsGrid();
    initCostCodesGrid();
    initWorkOrdersGrid();
    initPurchaseOrdersGrid();
    initResourcesGrid();
    loadProjects();

    showPanel('empty');
});
