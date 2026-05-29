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

// Cached data for cascading dropdowns
let cachedWorkOrders = [];
let cachedCostCodes = [];
let cachedPurchaseOrders = [];

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
        [cachedWorkOrders, cachedCostCodes, cachedPurchaseOrders] = await Promise.all([
            apiFetch(`/api/projects/${activeProjectId}/work-orders`),
            apiFetch(`/api/projects/${activeProjectId}/cost-codes`),
            apiFetch(`/api/projects/${activeProjectId}/purchase-orders`),
        ]);
    } catch (e) { /* non-critical */ }
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
    }
}

// --- Dockets Grid ---

function initDocketsGrid() {
    const columnDefs = [
        { field: 'date', headerName: 'Date', width: 110, sort: 'desc' },
        { field: 'docket_number', headerName: 'Docket #', width: 120 },
        { field: 'supplier_name', headerName: 'Supplier', width: 180 },
        { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
        { field: 'wo_number', headerName: 'WO', width: 110 },
        { field: 'cost_code', headerName: 'CC', width: 90 },
        { field: 'po_number', headerName: 'PO', width: 90 },
        { field: 'qty', headerName: 'Qty', width: 80, type: 'numericColumn' },
        { field: 'unit', headerName: 'Unit', width: 70 },
        { field: 'rate', headerName: 'Rate', width: 100, type: 'numericColumn', valueFormatter: currencyFormatter },
        { field: 'amount', headerName: 'Amount', width: 120, type: 'numericColumn', valueFormatter: currencyFormatter },
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
    } catch (e) {
        toast('Failed to load resources', 'error');
    }
}

// --- Modals ---

function openModal(title, html, context) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('open');
    modalContext = context;
    const first = document.querySelector('.modal-body input, .modal-body select');
    if (first) first.focus();
}

function closeModal(event) {
    if (event && event.target !== document.getElementById('modal-overlay')) return;
    document.getElementById('modal-overlay').classList.remove('open');
    modalContext = null;
}

async function saveModal() {
    if (!modalContext) return;
    try {
        await modalContext.save();
        closeModal();
        await refreshProjectData();
        await refreshCurrentPanel();
        toast(modalContext.successMsg || 'Saved', 'success');
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
            <input type="text" id="f-po-supplier" value="${esc(e.supplier_name || '')}">
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
            <input type="text" id="f-res-supplier" value="${esc(e.supplier_name || '')}">
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

function openDocketDialog(existing) {
    if (!activeProjectId) { toast('Select a project first', 'error'); return; }
    const e = existing || {};
    const today = new Date().toISOString().slice(0, 10);

    const woOptions = cachedWorkOrders
        .filter(w => w.status === 'Active')
        .map(w => `<option value="${w.id}"${e.work_order_id === w.id ? ' selected' : ''}>${esc(w.number)} — ${esc(w.description || '')}</option>`)
        .join('');

    const ccOptions = cachedCostCodes
        .map(c => `<option value="${c.id}"${e.cost_code_id === c.id ? ' selected' : ''}>${esc(c.code)} — ${esc(c.description || '')}</option>`)
        .join('');

    const poOptions = cachedPurchaseOrders
        .filter(p => p.is_active)
        .map(p => `<option value="${p.id}"${e.purchase_order_id === p.id ? ' selected' : ''}>${esc(p.number)} — ${esc(p.supplier_name || '')}</option>`)
        .join('');

    const html = `
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
        <div class="form-group">
            <label>Work Order</label>
            <select id="f-dk-wo" onchange="onDocketWOChange()">
                <option value="">— Select WO —</option>
                ${woOptions}
            </select>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Cost Code</label>
                <select id="f-dk-cc">
                    <option value="">— Select CC —</option>
                    ${ccOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Purchase Order</label>
                <select id="f-dk-po">
                    <option value="">— Select PO —</option>
                    ${poOptions}
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Supplier</label>
            <input type="text" id="f-dk-supplier" value="${esc(e.supplier_name || '')}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <input type="text" id="f-dk-desc" value="${esc(e.description || '')}">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Qty</label>
                <input type="number" id="f-dk-qty" step="0.01" value="${e.qty || 0}" oninput="calcDocketAmount()">
            </div>
            <div class="form-group">
                <label>Unit</label>
                <input type="text" id="f-dk-unit" value="${esc(e.unit || '')}" placeholder="Hr, Day, Tonne...">
            </div>
            <div class="form-group">
                <label>Rate</label>
                <input type="number" id="f-dk-rate" step="0.01" value="${e.rate || 0}" oninput="calcDocketAmount()">
            </div>
        </div>
        <div class="form-group">
            <label>Amount</label>
            <input type="number" id="f-dk-amount" step="0.01" value="${e.amount || 0}">
        </div>
        <div class="form-group">
            <label>Notes</label>
            <textarea id="f-dk-notes" rows="2">${esc(e.notes || '')}</textarea>
        </div>
    `;
    openModal(existing ? 'Edit Docket' : 'New Docket', html, {
        successMsg: existing ? 'Docket updated' : 'Docket created',
        save: async () => {
            const body = {
                date: document.getElementById('f-dk-date').value,
                docket_number: document.getElementById('f-dk-number').value || null,
                work_order_id: parseInt(document.getElementById('f-dk-wo').value) || null,
                cost_code_id: parseInt(document.getElementById('f-dk-cc').value) || null,
                purchase_order_id: parseInt(document.getElementById('f-dk-po').value) || null,
                supplier_name: document.getElementById('f-dk-supplier').value || null,
                description: document.getElementById('f-dk-desc').value || null,
                qty: parseFloat(document.getElementById('f-dk-qty').value) || 0,
                unit: document.getElementById('f-dk-unit').value || null,
                rate: parseFloat(document.getElementById('f-dk-rate').value) || 0,
                amount: parseFloat(document.getElementById('f-dk-amount').value) || 0,
                notes: document.getElementById('f-dk-notes').value || null,
            };
            if (!body.date) { toast('Date is required', 'error'); throw new Error('validation'); }
            if (existing) {
                await apiRequest('PUT', `/api/dockets/${existing.id}`, body);
            } else {
                await apiRequest('POST', `/api/projects/${activeProjectId}/dockets`, body);
            }
            await loadSummary();
        },
    });

    if (e.work_order_id) {
        onDocketWOChange();
    }
}

async function onDocketWOChange() {
    const woId = parseInt(document.getElementById('f-dk-wo').value);
    const ccSelect = document.getElementById('f-dk-cc');
    const poSelect = document.getElementById('f-dk-po');
    const currentCC = ccSelect.value;
    const currentPO = poSelect.value;

    if (!woId) {
        ccSelect.innerHTML = '<option value="">— Select CC —</option>' +
            cachedCostCodes.map(c => `<option value="${c.id}">${esc(c.code)} — ${esc(c.description || '')}</option>`).join('');
        poSelect.innerHTML = '<option value="">— Select PO —</option>' +
            cachedPurchaseOrders.filter(p => p.is_active).map(p => `<option value="${p.id}">${esc(p.number)} — ${esc(p.supplier_name || '')}</option>`).join('');
        return;
    }

    try {
        const [validCCs, validPOs] = await Promise.all([
            apiFetch(`/api/work-orders/${woId}/cost-codes`),
            apiFetch(`/api/purchase-orders?wo=${woId}`).catch(() => null),
        ]);

        if (validCCs && validCCs.length > 0) {
            ccSelect.innerHTML = '<option value="">— Select CC —</option>' +
                validCCs.map(c => `<option value="${c.id}"${c.id == currentCC ? ' selected' : ''}>${esc(c.code)} — ${esc(c.description || '')}</option>`).join('');
            if (validCCs.length === 1) {
                ccSelect.value = validCCs[0].id;
            }
        }

        const woPOs = cachedPurchaseOrders.filter(p => p.is_active);
        try {
            const linkedPOs = await apiFetch(`/api/purchase-orders/${woId}/work-orders`).catch(() => []);
        } catch (e) {}

        poSelect.innerHTML = '<option value="">— Select PO —</option>' +
            woPOs.map(p => `<option value="${p.id}"${p.id == currentPO ? ' selected' : ''}>${esc(p.number)} — ${esc(p.supplier_name || '')}</option>`).join('');
    } catch (e) { /* fallback: keep full lists */ }
}

function calcDocketAmount() {
    const qty = parseFloat(document.getElementById('f-dk-qty').value) || 0;
    const rate = parseFloat(document.getElementById('f-dk-rate').value) || 0;
    document.getElementById('f-dk-amount').value = (qty * rate).toFixed(2);
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
