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
            <div class="project-name">
                ${esc(p.name)}
                <button class="project-edit-btn" onclick="event.stopPropagation(); openProjectDialog(allProjects.find(pp => pp.id === ${p.id}))" title="Edit project">&#9998;</button>
            </div>
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
        const apn = document.getElementById('active-project-name');
        if (apn) apn.textContent = project.name;
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
        { field: 'date', headerName: 'Date', width: 110, sort: 'desc',
            headerTooltip: 'Date the work was performed' },
        { field: 'docket_number', headerName: 'Docket #', width: 120,
            headerTooltip: "Supplier's docket or delivery reference" },
        { field: 'supplier_name', headerName: 'Supplier', width: 180,
            headerTooltip: 'Supplier or subcontractor' },
        { field: 'po_number', headerName: 'PO', width: 90,
            headerTooltip: 'Linked purchase order number' },
        { field: 'line_count', headerName: 'Lines', width: 70, type: 'numericColumn',
            headerTooltip: 'Number of line items on this docket' },
        { field: 'wo_numbers', headerName: 'WOs', width: 130,
            valueFormatter: p => p.value || '',
            headerTooltip: 'Work orders charged by this docket' },
        { field: 'cost_codes', headerName: 'CCs', width: 130,
            valueFormatter: p => p.value || '',
            headerTooltip: 'Cost codes charged by this docket' },
        { field: 'total_amount', headerName: 'Amount', width: 130, type: 'numericColumn', valueFormatter: currencyFormatter,
            headerTooltip: 'Sum of all line amounts (Qty x Rate)' },
        { field: 'claimed_reference', headerName: 'Claimed', width: 120,
            valueFormatter: p => p.value || '',
            headerTooltip: 'Claim or invoice reference if this docket has been tagged' },
        { headerName: '', width: 50, sortable: false, filter: false, resizable: false,
            valueGetter: () => '⧈',
            cellStyle: { cursor: 'pointer', textAlign: 'center', fontSize: '16px', color: '#666' },
            onCellClicked: params => copyDocket(params.data),
            tooltipValueGetter: () => 'Copy this docket with today\'s date',
        },
    ];

    const gridOptions = {
        columnDefs,
        rowData: [],
        defaultColDef: { resizable: true, sortable: true, filter: true },
        animateRows: true,
        suppressCellFocus: true,
        tooltipShowDelay: 400,
        onRowDoubleClicked: params => openDocketDialog(params.data),
        getRowStyle: params => {
            if (params.data && params.data.claimed_reference) {
                return { background: '#f0fdf4' };
            }
            return null;
        },
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

function burnBarRenderer(params) {
    const budget = params.data.budget_amount || 0;
    const actual = params.data.actual_spend || 0;
    if (budget <= 0) return '<span class="burn-na">--</span>';
    const pct = Math.min((actual / budget) * 100, 100);
    const overBudget = actual > budget;
    const cls = overBudget ? 'burn-over' : pct > 80 ? 'burn-warn' : 'burn-ok';
    const label = Math.round((actual / budget) * 100) + '%';
    return `<div class="burn-bar"><div class="burn-fill ${cls}" style="width:${pct}%"></div><span class="burn-label">${label}</span></div>`;
}

function varianceFormatter(params) {
    const val = params.value;
    if (val == null) return '';
    const formatted = currency(Math.abs(val));
    if (val < 0) return '<span class="variance-over">(' + formatted + ')</span>';
    return formatted;
}

function initCostCodesGrid() {
    const columnDefs = [
        { field: 'code', headerName: 'Code', width: 100,
            headerTooltip: 'Cost code identifier' },
        { field: 'description', headerName: 'Description', minWidth: 150, flex: 2,
            headerTooltip: 'What this cost code covers' },
        { field: 'budget_amount', headerName: 'Budget', width: 130, flex: 1, type: 'numericColumn', valueFormatter: currencyFormatter,
            headerTooltip: 'Budgeted amount for this cost code' },
        { field: 'actual_spend', headerName: 'Actual', width: 130, flex: 1, type: 'numericColumn', valueFormatter: currencyFormatter,
            headerTooltip: 'Total spend from docket lines charged to this cost code' },
        { field: 'variance', headerName: 'Variance', width: 130, flex: 1, type: 'numericColumn', cellRenderer: params => varianceFormatter(params),
            headerTooltip: 'Budget minus actual — negative means over budget' },
        { field: '_burn', headerName: 'Burn', width: 150, cellRenderer: burnBarRenderer, sortable: false, filter: false,
            headerTooltip: 'Visual burn rate — green under 80%, amber 80-100%, red over budget' },
    ];

    const gridOptions = {
        columnDefs,
        rowData: [],
        defaultColDef: { resizable: true, sortable: true, filter: true },
        animateRows: true,
        suppressCellFocus: true,
        suppressColumnVirtualisation: true,
        tooltipShowDelay: 400,
        onRowDoubleClicked: params => openCostCodeDialog(params.data),
    };

    const el = document.getElementById('cost-codes-grid');
    costCodesGridApi = agGrid.createGrid(el, gridOptions);
}

async function loadCostCodes() {
    if (!activeProjectId || !costCodesGridApi) return;
    try {
        // Load cost report (includes budget, actual_spend, variance)
        const data = await apiFetch(`/api/projects/${activeProjectId}/cost-report`);
        costCodesGridApi.setGridOption('rowData', data);
        // Force AG-Grid to re-render cellRenderer columns (burn bars, variance)
        setTimeout(() => costCodesGridApi.refreshCells({force: true}), 50);
        // Also load plain cost codes for dropdowns
        cachedCostCodes = await apiFetch(`/api/projects/${activeProjectId}/cost-codes`);
        // Update stats bar
        const totalBudget = data.reduce((s, r) => s + (r.budget_amount || 0), 0);
        const totalActual = data.reduce((s, r) => s + (r.actual_spend || 0), 0);
        const remaining = totalBudget - totalActual;
        const burnPct = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;
        document.getElementById('cc-stat-budget').textContent = currency(totalBudget);
        document.getElementById('cc-stat-actual').textContent = currency(totalActual);
        const remEl = document.getElementById('cc-stat-remaining');
        remEl.textContent = currency(Math.abs(remaining));
        remEl.style.color = remaining < 0 ? '#dc3545' : '';
        if (remaining < 0) remEl.textContent = '(' + remEl.textContent + ')';
        const burnEl = document.getElementById('cc-stat-burn');
        burnEl.textContent = burnPct + '%';
        burnEl.style.color = burnPct > 100 ? '#dc3545' : burnPct > 80 ? '#f0ad4e' : '';
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
        tooltipShowDelay: 400,
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
        { field: 'number', headerName: 'PO Number', width: 120,
            headerTooltip: 'Purchase order reference number' },
        { field: 'supplier_name', headerName: 'Supplier', flex: 1, minWidth: 180 },
        { field: 'value', headerName: 'PO Value', width: 130, type: 'numericColumn', valueFormatter: currencyFormatter,
            headerTooltip: 'Total committed value of this purchase order' },
        { field: 'spent', headerName: 'Spent', width: 130, type: 'numericColumn', valueFormatter: currencyFormatter,
            headerTooltip: 'Sum of docket amounts linked to this PO' },
        { field: 'remaining', headerName: 'Remaining', width: 130, type: 'numericColumn', valueFormatter: currencyFormatter,
            cellStyle: params => params.value < 0 ? { color: '#dc2626', fontWeight: '600' } : null,
            headerTooltip: 'PO Value minus Spent — red if overspent' },
        { field: 'raised_date', headerName: 'Raised', width: 110 },
        { field: 'is_active', headerName: 'Active', width: 80,
            valueFormatter: params => params.value ? 'Yes' : 'No',
            headerTooltip: 'Inactive POs are hidden from the docket entry dropdown' },
    ];

    const gridOptions = {
        columnDefs,
        rowData: [],
        defaultColDef: { resizable: true, sortable: true, filter: true },
        animateRows: true,
        suppressCellFocus: true,
        tooltipShowDelay: 400,
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
        { field: 'description', headerName: 'Item', flex: 1, minWidth: 200,
            headerTooltip: 'What the resource is (e.g. 20T Excavator, Plant Operator)' },
        { field: 'unit', headerName: 'Unit', width: 80,
            headerTooltip: 'Unit of measure (Hr, Day, Tonne, m3, etc.)' },
        { field: 'supplier_name', headerName: 'Supplier', width: 200 },
        { field: 'standard_rate', headerName: 'Rate', width: 120, type: 'numericColumn', valueFormatter: currencyFormatter,
            headerTooltip: 'Default rate auto-filled when selecting this resource on a docket line' },
        { field: 'category', headerName: 'Category', width: 140,
            headerTooltip: 'Groups resources in the summary report' },
    ];

    const gridOptions = {
        columnDefs,
        rowData: [],
        defaultColDef: { resizable: true, sortable: true, filter: true },
        animateRows: true,
        suppressCellFocus: true,
        tooltipShowDelay: 400,
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
    // Show/hide delete button
    const delBtn = document.getElementById('modal-delete');
    if (delBtn) delBtn.style.display = context && context.onDelete ? '' : 'none';
    const first = document.querySelector('.modal-body input, .modal-body select');
    if (first) first.focus();
}

function closeModal(event) {
    if (event && event.target !== document.getElementById('modal-overlay')) return;
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('open');
    overlay.querySelector('.modal').classList.remove('modal-wide');
    document.getElementById('modal-save').style.display = '';
    document.getElementById('modal-delete').style.display = 'none';
    modalContext = null;
}

async function deleteModal() {
    if (!modalContext || !modalContext.onDelete) return;
    const name = modalContext.deleteLabel || 'this item';
    if (!confirm('Delete ' + name + '? This cannot be undone.')) return;
    try {
        await modalContext.onDelete();
        closeModal();
        await refreshProjectData();
        await refreshCurrentPanel();
        if (activePanel === 'dockets') await loadSummary();
        toast(modalContext.deleteMsg || 'Deleted', 'success');
    } catch (e) {
        // error already toasted by apiRequest
    }
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
    const ctx = {
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
    };
    if (existing) {
        ctx.onDelete = async () => {
            await apiRequest('DELETE', `/api/projects/${existing.id}`);
            activeProjectId = null;
            showPanel('empty');
            await loadProjects();
        };
        ctx.deleteLabel = existing.name;
        ctx.deleteMsg = 'Project deleted';
    }
    openModal(existing ? 'Edit Project' : 'New Project', html, ctx);
}

function openCostCodeDialog(existing) {
    if (!activeProjectId) { toast('Select a project first', 'error'); return; }
    const e = existing || {};
    const html = `
        <div class="form-group">
            <label data-tip="A short identifier for this cost code (e.g. CC101)" data-tip-pos="below">Code *</label>
            <input type="text" id="f-cc-code" value="${esc(e.code || '')}">
        </div>
        <div class="form-group">
            <label data-tip="What this cost code covers (e.g. Earthworks, Drainage)" data-tip-pos="below">Description</label>
            <input type="text" id="f-cc-desc" value="${esc(e.description || '')}">
        </div>
        <div class="form-group">
            <label data-tip="Budgeted amount — the cost report compares actuals against this" data-tip-pos="below">Budget Amount</label>
            <input type="number" id="f-cc-budget" step="0.01" value="${e.budget_amount || 0}">
        </div>
    `;
    const ctx = {
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
    };
    if (existing) {
        ctx.onDelete = async () => { await apiRequest('DELETE', `/api/cost-codes/${existing.id}`); };
        ctx.deleteLabel = existing.code;
        ctx.deleteMsg = 'Cost code deleted';
    }
    openModal(existing ? 'Edit Cost Code' : 'New Cost Code', html, ctx);
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
    const ctx = {
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
    };
    if (existing) {
        ctx.onDelete = async () => { await apiRequest('DELETE', `/api/work-orders/${existing.id}`); };
        ctx.deleteLabel = existing.number;
        ctx.deleteMsg = 'Work order deleted';
    }
    openModal(existing ? 'Edit Work Order' : 'New Work Order', html, ctx);
}

function openPurchaseOrderDialog(existing) {
    if (!activeProjectId) { toast('Select a project first', 'error'); return; }
    const e = existing || {};
    const html = `
        <div class="form-row">
            <div class="form-group">
                <label data-tip="Your internal purchase order reference number" data-tip-pos="below">PO Number *</label>
                <input type="text" id="f-po-number" value="${esc(e.number || '')}">
            </div>
            <div class="form-group">
                <label data-tip="Total committed value — docket spend is tracked against this" data-tip-pos="below">PO Value</label>
                <input type="number" id="f-po-value" step="0.01" value="${e.value || 0}">
            </div>
        </div>
        <div class="form-group">
            <label data-tip="The supplier this purchase order is issued to" data-tip-pos="below">Supplier</label>
            <input type="text" id="f-po-supplier" value="${esc(e.supplier_name || '')}" list="supplier-options">
            ${supplierDatalistHtml()}
        </div>
        <div class="form-row">
            <div class="form-group">
                <label data-tip="Date the purchase order was raised or approved" data-tip-pos="below">Raised Date</label>
                <input type="date" id="f-po-raised" value="${e.raised_date || ''}">
            </div>
            <div class="form-group">
                <label data-tip="Inactive POs won't appear in the docket entry dropdown" data-tip-pos="below">Active</label>
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
    const ctx = {
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
    };
    if (existing) {
        ctx.onDelete = async () => { await apiRequest('DELETE', `/api/purchase-orders/${existing.id}`); };
        ctx.deleteLabel = 'PO ' + existing.number;
        ctx.deleteMsg = 'Purchase order deleted';
    }
    openModal(existing ? 'Edit Purchase Order' : 'New Purchase Order', html, ctx);
}

function openResourceDialog(existing) {
    const e = existing || {};
    const html = `
        <div class="form-group">
            <label data-tip="What the resource is (e.g. 20T Excavator, Plant Operator)" data-tip-pos="below">Item *</label>
            <input type="text" id="f-res-desc" value="${esc(e.description || '')}">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label data-tip="Unit of measure (e.g. Hr, Day, Tonne, m3, Ea)" data-tip-pos="below">Unit *</label>
                <input type="text" id="f-res-unit" value="${esc(e.unit || '')}" placeholder="Hr, Day, Tonne, m3...">
            </div>
            <div class="form-group">
                <label data-tip="Default rate auto-filled when this resource is selected on a docket line" data-tip-pos="below">Standard Rate</label>
                <input type="number" id="f-res-rate" step="0.01" value="${e.standard_rate || 0}">
            </div>
        </div>
        <div class="form-group">
            <label data-tip="The supplier who provides this resource (optional)" data-tip-pos="below">Supplier</label>
            <input type="text" id="f-res-supplier" value="${esc(e.supplier_name || '')}" list="supplier-options">
            ${supplierDatalistHtml()}
        </div>
        <div class="form-group">
            <label data-tip="Groups resources in the summary report (e.g. Plant, Labour, Materials)" data-tip-pos="below">Category</label>
            <input type="text" id="f-res-category" value="${esc(e.category || '')}" placeholder="Plant, Labour, Materials...">
        </div>
    `;
    const ctx = {
        successMsg: existing ? 'Resource updated' : 'Resource created',
        save: async () => {
            const body = {
                description: document.getElementById('f-res-desc').value,
                unit: document.getElementById('f-res-unit').value,
                supplier_name: document.getElementById('f-res-supplier').value || null,
                standard_rate: parseFloat(document.getElementById('f-res-rate').value) || 0,
                category: document.getElementById('f-res-category').value || null,
            };
            if (!body.description || !body.unit) { toast('Item and unit are required', 'error'); throw new Error('validation'); }
            if (existing) {
                await apiRequest('PUT', `/api/resources/${existing.id}`, body);
            } else {
                await apiRequest('POST', '/api/resources', body);
            }
        },
    };
    if (existing) {
        ctx.onDelete = async () => { await apiRequest('DELETE', `/api/resources/${existing.id}`); };
        ctx.deleteLabel = existing.description;
        ctx.deleteMsg = 'Resource deleted';
    }
    openModal(existing ? 'Edit Resource' : 'New Resource', html, ctx);
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
                <div class="pdf-toolbar">
                    <button class="pdf-tb-btn" onclick="document.getElementById('folder-input').click()" title="Browse folder">&#128193;</button>
                    <input type="file" id="folder-input" webkitdirectory multiple accept=".pdf,.jpg,.jpeg,.png" onchange="onFolderSelected(this)" style="display:none">
                    <select id="pdf-file-select" class="pdf-file-select" onchange="selectBrowseFile(parseInt(this.value))" title="Select file">
                        <option value="-1">No files loaded</option>
                    </select>
                    <div class="pdf-tb-nav" id="pdf-tb-nav" style="display:none">
                        <button class="pdf-tb-btn" onclick="browsePrev()" title="Previous">&#9664;</button>
                        <span class="pdf-tb-counter" id="pdf-nav-info">0/0</span>
                        <button class="pdf-tb-btn" onclick="browseNext()" title="Next">&#9654;</button>
                    </div>
                    <button class="pdf-tb-btn pdf-tb-close" onclick="togglePdfPane()" title="Close">&times;</button>
                </div>
                <div class="pdf-viewer" id="pdf-viewer">
                    <div class="pdf-placeholder">
                        <div style="font-size:36px;margin-bottom:8px;opacity:0.4">&#128196;</div>
                        <div>Click &#128193; to browse a folder</div>
                    </div>
                </div>
            </div>
            <div class="docket-form">
                <div class="pdf-form-toggle" id="pdf-toggle" onclick="togglePdfPane()" title="Source documents">
                    <span class="pdf-form-toggle-icon" id="pdf-toggle-icon">&#128196;</span>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label data-tip="Date the work was performed or the docket was issued" data-tip-pos="below">Date *</label>
                        <input type="date" id="f-dk-date" value="${e.date || today}">
                    </div>
                    <div class="form-group">
                        <label data-tip="Supplier's docket or delivery reference number" data-tip-pos="below">Docket #</label>
                        <input type="text" id="f-dk-number" value="${esc(e.docket_number || '')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label data-tip="The supplier or subcontractor who performed the work" data-tip-pos="below">Supplier</label>
                        <input type="text" id="f-dk-supplier" value="${esc(e.supplier_name || '')}" list="supplier-options" oninput="refreshResourceDropdowns()">
                        ${supplierDatalistHtml()}
                    </div>
                    <div class="form-group">
                        <label data-tip="Link to a purchase order to track drawdown against committed spend" data-tip-pos="below">Purchase Order</label>
                        <select id="f-dk-po" onchange="onDocketPOChange()">
                            <option value="">-- Select PO --</option>
                            ${poOptions}
                        </select>
                    </div>
                </div>
                ${e.claimed_reference ? '<div class="docket-claimed-badge"><span class="claimed-icon">&#10003;</span> Claimed: <strong>' + esc(e.claimed_reference) + '</strong>' + (e.claimed_at ? ' <span class="claimed-date">(' + e.claimed_at.slice(0, 10) + ')</span>' : '') + '</div>' : ''}

                <div class="docket-lines-section">
                    <div class="docket-lines-header">
                        <span class="docket-lines-title">Line Items</span>
                        <button class="btn-sm btn-primary" onclick="addDocketLine()">+ Add Line</button>
                    </div>
                    <div class="docket-lines-scroll">
                        <table class="docket-lines-table">
                            <thead>
                                <tr>
                                    <th class="col-wo" data-tip="Work Order — which scope item this line charges to" data-tip-pos="below">WO</th>
                                    <th class="col-cc" data-tip="Cost Code — which budget category this line charges to" data-tip-pos="below">CC</th>
                                    <th class="col-res" data-tip="Select a resource to auto-fill unit and rate" data-tip-pos="below">Resource</th>
                                    <th class="col-desc" data-tip="Optional extra detail (e.g. 'wet hire, north embankment'). For lines without a resource, type the description here" data-tip-pos="below">Description</th>
                                    <th class="col-qty" data-tip="Quantities only — dockets don't carry prices. Rates are applied from the resource and confirmed at invoice review in the Docket Summary Report" data-tip-pos="below">Qty</th>
                                    <th class="col-unit">Unit</th>
                                    <th class="col-rm"></th>
                                </tr>
                            </thead>
                            <tbody id="docket-lines-body"></tbody>
                        </table>
                    </div>
                </div>

                <div class="form-group" style="margin-top:12px">
                    <label>Notes</label>
                    <textarea id="f-dk-notes" rows="2">${esc(e.notes || '')}</textarea>
                </div>

                <div class="docket-fingerprint" id="docket-fingerprint"${e.source_hash ? '' : ' style="display:none"'}>
                    <span class="fp-label">Fingerprint:</span>
                    <span class="fp-hash" id="fp-hash">${esc(e.source_hash || '')}</span>
                    <span class="fp-file" id="fp-file">${esc(e.source_filename || '')}</span>
                </div>
            </div>
        </div>
    `;

    const isEdit = existing && existing.id;
    const modalTitle = isEdit ? 'Edit Docket' : (existing ? 'New Docket (Copy)' : 'New Docket');

    const ctx = {
        successMsg: isEdit ? 'Docket updated' : 'Docket created',
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
            if (isEdit) {
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
    };
    if (isEdit) {
        ctx.onDelete = async () => { await apiRequest('DELETE', `/api/dockets/${existing.id}`); };
        ctx.deleteLabel = existing.docket_number || ('docket #' + existing.id);
        ctx.deleteMsg = 'Docket deleted';
    }
    openModal(modalTitle, html, ctx, true);

    // Populate existing lines or add one empty line
    if (e.lines && e.lines.length > 0) {
        e.lines.forEach(ln => addDocketLine(ln));
    } else {
        addDocketLine();
    }

    // Restore folder browse state if active
    if (browseFiles.length > 0) {
        renderBrowseFileList();
        if (browseFileIndex >= 0) selectBrowseFile(browseFileIndex);
        // Auto-open PDF pane
        const entry = document.getElementById('docket-entry');
        if (entry && !entry.classList.contains('pdf-open')) {
            entry.classList.add('pdf-open');
            const icon = document.getElementById('pdf-toggle-icon');
            if (icon) icon.style.opacity = '0.4';
        }
    }
}

function addDocketLine(data) {
    const idx = docketLineCounter++;
    const d = data || {};

    const woOpts = cachedWorkOrders
        .filter(w => w.status === 'Active')
        .map(w => `<option value="${w.id}"${d.work_order_id === w.id ? ' selected' : ''}>${esc(w.number)}${w.description ? ' — ' + esc(w.description) : ''}</option>`)
        .join('');

    const ccOpts = cachedCostCodes
        .map(c => `<option value="${c.id}"${d.cost_code_id === c.id ? ' selected' : ''}>${esc(c.code)}</option>`)
        .join('');

    const resOpts = getFilteredResourceOpts(d.resource_id);

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
        <td class="col-desc"><input type="text" id="ln-desc-${idx}" value="${esc(d.description || '')}" placeholder="${esc((d.resource_id && (cachedResources.find(r => r.id === d.resource_id) || {}).description) || 'Description')}"><input type="hidden" id="ln-rate-${idx}" value="${d.rate || ''}"></td>
        <td class="col-qty"><input type="number" id="ln-qty-${idx}" step="0.01" value="${d.qty || ''}" placeholder="0"></td>
        <td class="col-unit"><input type="text" id="ln-unit-${idx}" value="${esc(d.unit || '')}" placeholder="Hr"></td>
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

function getFilteredResourceOpts(selectedId) {
    const supplier = document.getElementById('f-dk-supplier')?.value?.trim().toLowerCase() || '';
    let filtered = cachedResources;
    if (supplier) {
        filtered = cachedResources.filter(r =>
            r.supplier_name && r.supplier_name.trim().toLowerCase() === supplier
        );
        // If no resources match this supplier, fall back to all
        if (filtered.length === 0) filtered = cachedResources;
    }
    return filtered
        .map(r => `<option value="${r.id}"${r.id === selectedId || r.id == selectedId ? ' selected' : ''}>${esc(r.description)}</option>`)
        .join('');
}

function refreshResourceDropdowns() {
    document.querySelectorAll('#docket-lines-body tr').forEach(tr => {
        const resSelect = tr.querySelector('select[id^="ln-res-"]');
        if (!resSelect) return;
        const currentVal = parseInt(resSelect.value) || null;
        resSelect.innerHTML = '<option value="">--</option>' + getFilteredResourceOpts(currentVal);
    });
}

function onLineResourceChange(idx) {
    const resId = parseInt(document.getElementById(`ln-res-${idx}`).value);
    if (!resId) return;
    const res = cachedResources.find(r => r.id === resId);
    if (!res) return;

    const descEl = document.getElementById(`ln-desc-${idx}`);
    const unitEl = document.getElementById(`ln-unit-${idx}`);
    const rateEl = document.getElementById(`ln-rate-${idx}`);

    // Don't duplicate the resource name into Description — show it as a
    // placeholder; the field is for extra detail (e.g. "wet hire, north end")
    descEl.placeholder = res.description;
    unitEl.value = res.unit;
    // Rate is applied silently from the resource — dockets carry quantities
    // only; rates are confirmed at invoice review in the summary report.
    rateEl.value = res.standard_rate || '';
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
    if (!entry) return;
    entry.classList.toggle('pdf-open');
    const icon = document.getElementById('pdf-toggle-icon');
    if (icon) {
        icon.style.opacity = entry.classList.contains('pdf-open') ? '0.4' : '1';
    }
}

// --- Copy Docket ---

async function copyDocket(rowData) {
    if (!activeProjectId) { toast('Select a project first', 'error'); return; }
    try {
        const source = await apiFetch('/api/dockets/' + rowData.id);
        const today = new Date().toISOString().slice(0, 10);
        const copy = {
            date: today,
            docket_number: '',
            supplier_name: source.supplier_name,
            purchase_order_id: source.purchase_order_id,
            notes: '',
            lines: (source.lines || []).map(ln => ({
                work_order_id: ln.work_order_id,
                cost_code_id: ln.cost_code_id,
                resource_id: ln.resource_id,
                description: ln.description,
                qty: ln.qty,
                unit: ln.unit,
                rate: ln.rate,
                amount: ln.amount,
            })),
        };
        openDocketDialog(copy);
        toast('Copied from ' + (source.docket_number || '#' + source.id), 'success');
    } catch (e) {
        toast('Failed to copy docket', 'error');
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
        refreshResourceDropdowns();
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

    const hideClaimed = document.getElementById('rpt-hide-claimed');
    const unclaimedParam = hideClaimed && hideClaimed.checked ? '&unclaimed=1' : '';

    try {
        reportDockets = await apiFetch(
            '/api/projects/' + activeProjectId + '/dockets/by-supplier?supplier=' + encodeURIComponent(supplier) + unclaimedParam
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
    listEl.innerHTML = reportDockets.map(d => {
        const claimed = d.claimed_reference ? ' claimed' : '';
        const tag = d.claimed_reference
            ? ' <span class="chip-claimed-tag">' + esc(d.claimed_reference) + '</span>'
            : '';
        return '<label class="docket-chip' + claimed + '" data-id="' + d.id + '" onclick="toggleDocketChip(this)">' +
            '<input type="checkbox" value="' + d.id + '" style="display:none">' +
            '<span>' + esc(d.docket_number || d.date) + '</span>' +
            '<span class="chip-amount">' + currency(d.total_amount) + '</span>' +
            tag +
            '</label>';
    }).join('');
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

    // New report generation — reset the rate-review session state
    editedRateKeys = new Set();
    ratesUpdatedCount = 0;

    const url = _buildSummaryUrl('/api/projects/' + activeProjectId + '/docket-summary');
    try {
        const data = await apiFetch(url);
        renderDocketSummary(data);
        document.getElementById('rpt-csv-btn').style.display = '';
        document.getElementById('rpt-xlsx-btn').style.display = '';
    } catch (e) {
        toast('Failed to generate report', 'error');
    }
}

let lastSummaryData = null;

// Rate-review session state (reset when a new report is generated)
let editedRateKeys = new Set();
let ratesUpdatedCount = 0;

function rateCellHtml(item) {
    // Free-text rows (no resource) start blank when unrated — inviting the
    // user to type the rate off the invoice.
    const rate = Number(item.rate || 0);
    const blank = !item.resource_id && rate === 0;
    const edited = editedRateKeys.has(String(item.line_ids)) ? ' rate-edited' : '';
    return '<td class="col-right"><input type="number" step="0.01" min="0"' +
        ' class="rate-cell' + edited + '"' +
        ' value="' + (blank ? '' : rate.toFixed(2)) + '"' +
        (blank ? ' placeholder="rate?"' : '') +
        ' data-lines="' + esc(String(item.line_ids || '')) + '"' +
        ' data-resource="' + (item.resource_id || '') + '"' +
        ' data-standard="' + (item.standard_rate != null ? item.standard_rate : '') + '"' +
        ' data-old="' + rate + '"' +
        ' data-desc="' + esc(item.resource_desc || '') + '"' +
        ' data-unit="' + esc(item.unit || '') + '"' +
        ' onchange="onRateCellChange(this)"' +
        ' data-tip="Edit if the invoice shows a different rate" data-tip-pos="left"></td>';
}

function renderDocketSummary(data) {
    lastSummaryData = data;
    const output = document.getElementById('report-output');
    if (!data.groups || data.groups.length === 0) {
        output.innerHTML = '<div class="report-empty">No docket data found for this selection.</div>';
        document.getElementById('rpt-csv-btn').style.display = 'none';
        document.getElementById('rpt-xlsx-btn').style.display = 'none';
        // Hide claim bar
        const claimBar = document.getElementById('rpt-claim-bar');
        if (claimBar) claimBar.style.display = 'none';
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

    const showCats = document.getElementById('rpt-show-categories');
    const categorised = showCats ? showCats.checked : true;

    let html = '<div class="report-header">';
    html += '<h3>' + esc(data.supplier) + '</h3>';
    html += '<div class="report-meta">' + subtitle + '</div>';
    html += '</div>';

    html += '<div class="report-options">';
    html += '<label class="report-option-toggle">';
    html += '<input type="checkbox" id="rpt-show-categories" onchange="rerenderSummary()"' + (categorised ? ' checked' : '') + '>';
    html += ' Show categories</label>';
    html += '</div>';

    html += '<table class="report-table">';
    html += '<thead><tr>';
    if (categorised) html += '<th>Category</th>';
    html += '<th>Resource</th><th>Unit</th>';
    html += '<th class="col-right">Qty</th>';
    html += '<th class="col-right" data-tip="Rates are editable — confirm them against the invoice and DCT-OS keeps your resource rates current" data-tip-pos="below">Rate</th>';
    html += '<th class="col-right">Subtotal</th>';
    html += '<th class="col-right">Dockets</th>';
    html += '</tr></thead><tbody>';

    if (categorised) {
        data.groups.forEach(function(group) {
            html += '<tr class="category-row"><td colspan="7">' + esc(group.category) + '</td></tr>';
            group.items.forEach(function(item) {
                html += '<tr>';
                html += '<td></td>';
                html += '<td>' + esc(item.resource_desc) + '</td>';
                html += '<td>' + esc(item.unit || '') + '</td>';
                html += '<td class="col-right">' + (item.total_qty != null ? Number(item.total_qty).toFixed(2) : '') + '</td>';
                html += rateCellHtml(item);
                html += '<td class="col-right">' + currency(item.subtotal) + '</td>';
                html += '<td class="col-right">' + item.docket_count + '</td>';
                html += '</tr>';
            });
            html += '<tr class="subtotal-row">';
            html += '<td colspan="5" style="text-align:right">' + esc(group.category) + ' Subtotal</td>';
            html += '<td class="col-right">' + currency(group.category_total) + '</td>';
            html += '<td></td></tr>';
        });

        html += '<tr class="grand-total-row">';
        html += '<td colspan="5" style="text-align:right">Grand Total</td>';
        html += '<td class="col-right">' + currency(data.grand_total) + '</td>';
        html += '<td></td></tr>';
    } else {
        // Flat list: all items without category grouping
        var allItems = [];
        data.groups.forEach(function(group) {
            group.items.forEach(function(item) { allItems.push(item); });
        });
        allItems.sort(function(a, b) {
            return (a.resource_desc || '').localeCompare(b.resource_desc || '');
        });
        allItems.forEach(function(item) {
            html += '<tr>';
            html += '<td>' + esc(item.resource_desc) + '</td>';
            html += '<td>' + esc(item.unit || '') + '</td>';
            html += '<td class="col-right">' + (item.total_qty != null ? Number(item.total_qty).toFixed(2) : '') + '</td>';
            html += rateCellHtml(item);
            html += '<td class="col-right">' + currency(item.subtotal) + '</td>';
            html += '<td class="col-right">' + item.docket_count + '</td>';
            html += '</tr>';
        });

        html += '<tr class="grand-total-row">';
        html += '<td colspan="4" style="text-align:right">Grand Total</td>';
        html += '<td class="col-right">' + currency(data.grand_total) + '</td>';
        html += '<td></td></tr>';
    }

    html += '</tbody></table>';

    if (ratesUpdatedCount > 0) {
        html += '<div class="rpt-rate-counter">' + ratesUpdatedCount +
            ' rate' + (ratesUpdatedCount === 1 ? '' : 's') + ' updated this review</div>';
    }

    output.innerHTML = html;

    // Show claim bar when in docket mode
    const claimBar = document.getElementById('rpt-claim-bar');
    if (claimBar) {
        claimBar.style.display = reportMode === 'dockets' ? '' : 'none';
    }
}

function rerenderSummary() {
    if (lastSummaryData) renderDocketSummary(lastSummaryData);
}

// --- Rate review (the rate feedback loop) ---

async function applyRerate(lineIds, newRate, opts) {
    opts = opts || {};
    return apiRequest('POST', '/api/projects/' + activeProjectId + '/rerate', {
        line_ids: lineIds,
        new_rate: newRate,
        resource_id: opts.resource_id || null,
        update_standard: !!opts.update_standard,
        add_resource: opts.add_resource || null,
    });
}

async function refreshSummaryAfterRerate() {
    const url = _buildSummaryUrl('/api/projects/' + activeProjectId + '/docket-summary');
    if (!url) return;
    try {
        const data = await apiFetch(url);
        renderDocketSummary(data);
    } catch (e) { /* keep current view */ }
    // Resource rates changed — refresh the cache used by docket entry
    try { cachedResources = await apiFetch('/api/resources'); } catch (e) { /* non-critical */ }
}

function markRateEdited(lineKey) {
    editedRateKeys.add(String(lineKey));
    ratesUpdatedCount++;
}

function toastWithUndo(msg, undoFn) {
    const el = document.getElementById('toast');
    el.innerHTML = esc(msg) + ' <button class="toast-undo">Undo</button>';
    el.querySelector('.toast-undo').onclick = async () => {
        el.className = 'toast';
        try { await undoFn(); } catch (e) { toast('Undo failed', 'error'); }
    };
    el.className = 'toast show';
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => { el.className = 'toast'; el.innerHTML = ''; }, 8000);
}

async function onRateCellChange(input) {
    const oldRate = parseFloat(input.dataset.old) || 0;
    const newRate = parseFloat(input.value);
    const lineKey = input.dataset.lines;
    const lineIds = lineKey.split(',').map(Number).filter(n => !isNaN(n));

    if (isNaN(newRate) || newRate < 0 || lineIds.length === 0) {
        input.value = oldRate ? oldRate.toFixed(2) : '';
        return;
    }
    if (Math.abs(newRate - oldRate) < 0.005) {
        input.value = oldRate.toFixed(2);
        return;
    }

    const resourceId = parseInt(input.dataset.resource) || null;

    if (!resourceId) {
        // Free-text line — value it, then offer to make it a resource
        try {
            await applyRerate(lineIds, newRate, {});
            markRateEdited(lineKey);
            offerAddResource(input, lineIds, newRate);
        } catch (e) { /* apiRequest already toasted */ }
        return;
    }

    if (newRate > oldRate) {
        // Typing the higher invoice rate IS the acceptance — apply both,
        // confirm with an undo.
        try {
            const res = await applyRerate(lineIds, newRate, {
                resource_id: resourceId, update_standard: true,
            });
            markRateEdited(lineKey);
            const msg = 'Rate updated ' + currency(oldRate) + ' → ' + currency(newRate) +
                (res.standard_updated ? ' · standard rate updated' : '');
            toastWithUndo(msg, async () => {
                await applyRerate(lineIds, oldRate, {});
                if (res.standard_updated && res.old_standard_rate != null) {
                    await apiRequest('PUT', '/api/resources/' + resourceId,
                        { standard_rate: res.old_standard_rate });
                }
                editedRateKeys.delete(String(lineKey));
                ratesUpdatedCount = Math.max(0, ratesUpdatedCount - 1);
                await refreshSummaryAfterRerate();
                toast('Rate change undone');
            });
            await refreshSummaryAfterRerate();
        } catch (e) { input.value = oldRate.toFixed(2); }
        return;
    }

    // Lower than the docket carried — one-off discount, or the new normal?
    showRateGate(input, lineIds, resourceId, oldRate, newRate);
}

function showRateGate(input, lineIds, resourceId, oldRate, newRate) {
    const standard = parseFloat(input.dataset.standard);
    const ref = !isNaN(standard) ? standard : oldRate;
    closeRateGate();

    const overlay = document.createElement('div');
    overlay.id = 'rate-gate-overlay';
    overlay.innerHTML =
        '<div class="rate-gate">' +
        '<p>' + currency(newRate) + ' is below the standard rate (' + currency(ref) + ') for ' +
        '<strong>' + esc(input.dataset.desc) + '</strong>.</p>' +
        '<div class="rate-gate-actions">' +
        '<button class="btn" id="rate-gate-oneoff">One-off for this claim</button>' +
        '<button class="btn btn-primary" id="rate-gate-standard">Update standard rate too</button>' +
        '<button class="btn rate-gate-cancel" id="rate-gate-cancel">Cancel</button>' +
        '</div></div>';
    document.body.appendChild(overlay);

    const lineKey = input.dataset.lines;
    const finish = async (updateStandard) => {
        closeRateGate();
        try {
            await applyRerate(lineIds, newRate, {
                resource_id: resourceId, update_standard: updateStandard,
            });
            markRateEdited(lineKey);
            toast('Rate updated ' + currency(oldRate) + ' → ' + currency(newRate) +
                (updateStandard ? ' · standard rate updated' : ' (one-off)'));
            await refreshSummaryAfterRerate();
        } catch (e) { input.value = oldRate.toFixed(2); }
    };

    document.getElementById('rate-gate-oneoff').onclick = () => finish(false);
    document.getElementById('rate-gate-standard').onclick = () => finish(true);
    document.getElementById('rate-gate-cancel').onclick = () => {
        closeRateGate();
        input.value = oldRate.toFixed(2);
    };
}

function closeRateGate() {
    const el = document.getElementById('rate-gate-overlay');
    if (el) el.remove();
}

function offerAddResource(input, lineIds, rate) {
    closeRateGate();
    const desc = input.dataset.desc;
    const unit = input.dataset.unit;
    const supplier = lastSummaryData ? lastSummaryData.supplier : null;

    const overlay = document.createElement('div');
    overlay.id = 'rate-gate-overlay';
    overlay.innerHTML =
        '<div class="rate-gate">' +
        '<p>Add <strong>' + esc(desc) + '</strong> @ ' + currency(rate) +
        (unit ? '/' + esc(unit) : '') + ' to your resources for next time?</p>' +
        '<div class="rate-gate-actions">' +
        '<button class="btn btn-primary" id="rate-gate-add">Add to resources</button>' +
        '<button class="btn rate-gate-cancel" id="rate-gate-skip">Not now</button>' +
        '</div></div>';
    document.body.appendChild(overlay);

    document.getElementById('rate-gate-add').onclick = async () => {
        closeRateGate();
        try {
            await applyRerate(lineIds, rate, {
                add_resource: {
                    description: desc,
                    unit: unit || 'Ea',
                    supplier_name: supplier,
                },
            });
            toast('Added to resources: ' + desc);
            await refreshSummaryAfterRerate();
        } catch (e) { /* already toasted */ }
    };
    document.getElementById('rate-gate-skip').onclick = async () => {
        closeRateGate();
        await refreshSummaryAfterRerate();
    };
}

function exportSummaryCSV() {
    if (!activeProjectId) return;
    const url = _buildSummaryUrl('/api/projects/' + activeProjectId + '/docket-summary/csv');
    if (url) window.open(url, '_blank');
}

function exportSummaryXLSX() {
    if (!activeProjectId) return;
    const url = _buildSummaryUrl('/api/projects/' + activeProjectId + '/docket-summary/xlsx');
    if (url) window.open(url, '_blank');
}

function exportDocketsXLSX() {
    if (!activeProjectId) return;
    window.open('/api/projects/' + activeProjectId + '/dockets/export-xlsx', '_blank');
}

// --- Claim / Unclaim Dockets ---

async function claimSelectedDockets() {
    if (!activeProjectId) return;
    const ids = getSelectedDocketIds().map(Number);
    if (ids.length === 0) { toast('Select dockets to claim', 'error'); return; }
    const ref = document.getElementById('rpt-claim-ref').value.trim();
    if (!ref) { toast('Enter a claim reference', 'error'); return; }

    try {
        await apiRequest('POST', '/api/projects/' + activeProjectId + '/dockets/claim', {
            docket_ids: ids,
            reference: ref,
        });
        toast(ids.length + ' docket(s) claimed as ' + ref, 'success');
        document.getElementById('rpt-claim-ref').value = '';
        await onReportSupplierChange();
    } catch (e) { /* toasted */ }
}

async function unclaimSelectedDockets() {
    if (!activeProjectId) return;
    const ids = getSelectedDocketIds().map(Number);
    if (ids.length === 0) { toast('Select dockets to unclaim', 'error'); return; }

    try {
        await apiRequest('POST', '/api/projects/' + activeProjectId + '/dockets/unclaim', {
            docket_ids: ids,
        });
        toast(ids.length + ' docket(s) unclaimed', 'success');
        await onReportSupplierChange();
    } catch (e) { /* toasted */ }
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
            const existingMap = {};
            resp.existing.forEach(e => { existingMap[e.source_hash] = e; });
            for (const [name, hash] of Object.entries(browseHashes)) {
                const match = existingMap[hash];
                if (match) {
                    browseHashes[name] = { hash, entered: true, match };
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
    const sel = document.getElementById('pdf-file-select');
    if (!sel) return;
    sel.innerHTML = browseFiles.map((f, i) => {
        const info = browseHashes[f.name] || {};
        const prefix = info.entered ? '✓ ' : '○ ';
        return '<option value="' + i + '"' + (i === browseFileIndex ? ' selected' : '') + '>' +
            prefix + esc(f.name) + '</option>';
    }).join('');

    // Show nav controls
    const nav = document.getElementById('pdf-tb-nav');
    if (nav) nav.style.display = browseFiles.length > 0 ? '' : 'none';
}

function selectBrowseFile(index) {
    if (index < 0 || index >= browseFiles.length) return;
    browseFileIndex = index;
    const file = browseFiles[index];

    // Update dropdown selection
    const sel = document.getElementById('pdf-file-select');
    if (sel) sel.selectedIndex = index;

    // Update counter
    const navEl = document.getElementById('pdf-nav-info');
    if (navEl) navEl.textContent = (index + 1) + '/' + browseFiles.length;

    // Re-render dropdown to update status prefixes
    renderBrowseFileList();

    // Show/hide duplicate warning banner
    const info = browseHashes[file.name] || {};
    let banner = document.getElementById('pdf-dupe-banner');
    if (info.entered && info.match) {
        const m = info.match;
        const ref = m.docket_number ? ('Docket #' + esc(m.docket_number)) : ('Docket ID ' + m.id);
        const dateStr = m.date ? (' on ' + m.date) : '';
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'pdf-dupe-banner';
            banner.className = 'pdf-dupe-banner';
            const toolbar = document.querySelector('.pdf-toolbar');
            if (toolbar) toolbar.parentNode.insertBefore(banner, toolbar.nextSibling);
        }
        banner.innerHTML = '<span class="dupe-icon">&#9888;</span>' +
            '<span class="dupe-text">Already entered as <span class="dupe-ref">' +
            ref + '</span>' + dateStr + '</span>';
    } else if (banner) {
        banner.remove();
    }

    // Update fingerprint display
    const fpEl = document.getElementById('docket-fingerprint');
    const fpHash = document.getElementById('fp-hash');
    const fpFile = document.getElementById('fp-file');
    if (fpEl && fpHash) {
        const hash = info.hash || (typeof info === 'string' ? info : null);
        if (hash) {
            fpHash.textContent = hash;
            if (fpFile) fpFile.textContent = file.name;
            fpEl.style.display = '';
        }
    }

    // Display file in viewer
    const viewer = document.getElementById('pdf-viewer');
    if (!viewer) return;

    const url = URL.createObjectURL(file);
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
        viewer.innerHTML = '<object data="' + url + '" type="application/pdf" style="width:100%;height:100%"><p>PDF cannot be displayed. <a href="' + url + '" target="_blank">Open in new tab</a></p></object>';
    } else {
        viewer.innerHTML = '<img src="' + url + '" alt="' + esc(file.name) + '">';
    }
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

// --- CSV Export / Import ---

function exportDocketsCSV() {
    if (!activeProjectId) { toast('Select a project first', 'error'); return; }
    window.open('/api/projects/' + activeProjectId + '/dockets/export-csv', '_blank');
}

function exportResourcesCSV() {
    window.open('/api/resources/export-csv', '_blank');
}

function exportResourcesXLSX() {
    window.open('/api/resources/export-xlsx', '_blank');
}

async function importResourcesCSV(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    input.value = '';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const resp = await fetch('/api/resources/import-csv', {
            method: 'POST',
            body: formData,
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            toast(err.error || 'Import failed', 'error');
            return;
        }
        const result = await resp.json();
        const msg = result.created + ' resource(s) imported' +
            (result.skipped > 0 ? ', ' + result.skipped + ' duplicate(s) skipped' : '');
        toast(msg, 'success');
        cachedResources = await apiFetch('/api/resources');
        if (activePanel === 'resources') loadResources();
    } catch (e) {
        toast('Import failed: ' + e.message, 'error');
    }
}

async function importDocketsCSV(input) {
    if (!activeProjectId) { toast('Select a project first', 'error'); return; }
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    input.value = '';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const resp = await fetch('/api/projects/' + activeProjectId + '/dockets/import-csv', {
            method: 'POST',
            body: formData,
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            toast(err.error || 'Import failed', 'error');
            return;
        }
        const result = await resp.json();
        const msg = result.created + ' docket(s) imported' +
            (result.skipped > 0 ? ', ' + result.skipped + ' duplicate(s) skipped' : '');
        toast(msg, 'success');
        await refreshProjectData();
        await refreshCurrentPanel();
    } catch (e) {
        toast('Import failed: ' + e.message, 'error');
    }
}

// --- Utilities ---

function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Help Dialog ---

function openHelpDialog() {
    const html = `<div class="help-content">
        <div class="help-section">
            <h4>Getting Started</h4>
            <p>Select a project from the sidebar to begin. Each project tracks its own dockets, cost codes, work orders, and purchase orders.</p>
        </div>
        <div class="help-section">
            <h4>Key Concepts</h4>
            <dl>
                <dt>Docket</dt>
                <dd>A source document (delivery docket, timesheet, invoice) with one or more line items recording work done.</dd>
                <dt>Work Order (WO)</dt>
                <dd>A client-facing scope item. Docket lines are assigned to a WO to track what scope the cost relates to.</dd>
                <dt>Cost Code (CC)</dt>
                <dd>An internal budget category. Each cost code has a budget amount; actual spend is tracked via docket lines.</dd>
                <dt>Purchase Order (PO)</dt>
                <dd>A financial commitment to a supplier. Dockets assigned to a PO draw down its value, showing remaining budget.</dd>
                <dt>Resource</dt>
                <dd>A reusable item (plant, labour, material) with a standard rate. Selecting a resource auto-fills the rate and unit.</dd>
                <dt>Claim Reference</dt>
                <dd>A tag (e.g. invoice number) applied to dockets that have been claimed or invoiced, to prevent double-counting.</dd>
            </dl>
        </div>
        <div class="help-section">
            <h4>Docket Entry</h4>
            <p>Click <strong>+ Add Docket</strong> to open the entry form. Each docket has a header (date, supplier, PO) and one or more line items.</p>
            <p>Use the document toggle <strong>\u{1F4C4}</strong> on the left edge to open the source document viewer. Click the folder icon to browse a folder of PDFs/images and enter them one by one.</p>
            <p>The <strong>WO → CC cascade</strong>: when you select a work order on a line, the cost code dropdown filters to only the valid cost codes for that WO.</p>
            <p>The <strong>copy button</strong> (⧈) in the grid duplicates an existing docket with today's date — useful for recurring daily dockets.</p>
        </div>
        <div class="help-section">
            <h4>Reports &amp; Claims</h4>
            <p>The <strong>Docket Summary Report</strong> aggregates spend by supplier. Use date range or pick specific dockets. Export to CSV for external use.</p>
            <p><strong>Claiming</strong> tags dockets with a reference string (e.g. an invoice number). Claimed dockets show a green tint in the grid and can be filtered out of the picker.</p>
        </div>
        <div class="help-section">
            <h4>Shared Databases</h4>
            <p>Click the <strong>database indicator</strong> in the header (the dot + filename) to switch databases, open a shared file, or create a new one. Your data lives in a single <code>.db</code> file that can sit on a network drive, SharePoint, or OneDrive.</p>
            <p>The dot shows <strong>green</strong> when the file is yours alone and <strong>amber</strong> when someone else has it open. A banner warns you when you open a file that's in use.</p>
            <p><strong>One person enters data at a time.</strong> The database engine allows one writer at a moment — simultaneous entry from two machines can collide. Reading together is fine; coordinate who's entering dockets.</p>
        </div>
        <div class="help-section">
            <h4>Keyboard Shortcuts</h4>
            <dl>
                <dt><kbd>Esc</kbd></dt>
                <dd>Close the current dialog</dd>
                <dt><kbd>Double-click</kbd></dt>
                <dd>Edit any row in the grid</dd>
            </dl>
        </div>
        <div class="help-section">
            <h4>Tips</h4>
            <p>Hover over buttons and labels throughout the app for contextual help.</p>
            <p>All grid columns are sortable, filterable, and resizable — right-click a column header for options.</p>
            <p>PO drawdown updates in real time as dockets are entered against a purchase order.</p>
        </div>
    </div>`;
    openModal('Help', html, { save: async () => {} });
    // Hide the save button for help dialog
    document.getElementById('modal-save').style.display = 'none';
}

// --- Dropdown menus ---

function toggleDropdown(event, menuId) {
    event.stopPropagation();
    const menu = document.getElementById(menuId);
    const wasOpen = menu.classList.contains('open');
    document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
    if (!wasOpen) menu.classList.add('open');
}

document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
});

// --- Keyboard shortcuts ---

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// --- Version Check ---

async function checkForUpdates() {
    try {
        const data = await apiFetch('/api/version');
        if (data.update_available) {
            const banner = document.getElementById('update-banner');
            const text = document.getElementById('update-banner-text');
            if (banner && text) {
                text.innerHTML = 'DCT-OS v' + esc(data.update_available) +
                    ' is available (you have v' + esc(data.version) +
                    '). Run <code>dct-os upgrade</code> to update.';
                banner.style.display = '';
            }
        }
    } catch (e) { /* non-critical */ }
}

function dismissUpdateBanner() {
    const banner = document.getElementById('update-banner');
    if (banner) banner.style.display = 'none';
}

// --- Database Picker ---

let currentDbPath = null;

async function loadDatabaseInfo() {
    try {
        const data = await apiFetch('/api/database');
        currentDbPath = data.current;
        const dot = document.getElementById('db-dot');
        const name = document.getElementById('db-name');
        if (dot && name) {
            name.textContent = data.current_name || 'Local';
            if (data.locked_by) {
                dot.classList.add('locked');
                name.title = 'Locked by ' + data.locked_by.user + ' on ' + data.locked_by.hostname;
            } else {
                dot.classList.remove('locked');
                name.title = data.current;
            }
        }
    } catch (e) { /* non-critical */ }
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function openDatabaseDialog() {
    let dbInfo;
    try {
        dbInfo = await apiFetch('/api/database');
    } catch (e) {
        toast('Could not load database info', 'error');
        return;
    }

    const recent = dbInfo.recent || [];

    let html = '<div class="db-dialog">';

    // Current database + New button row
    html += '<div class="db-current-row">' +
        '<div style="flex:1;min-width:0">' +
        '<div class="db-section-label" style="padding-top:0">Current Database</div>' +
        '<div style="padding:2px 0;font-size:13px;color:var(--text)">' +
        '<strong>' + esc(dbInfo.current_name) + '</strong>' +
        '<div class="db-recent-path">' + esc(dbInfo.current) + '</div></div>' +
        '</div>' +
        '<a class="btn" href="/api/backup" data-tip="Download a snapshot copy of the current database" data-tip-pos="below">Backup</a>' +
        '<button class="btn btn-primary" onclick="showNewDatabaseForm()" id="db-new-btn">+ New Database</button>' +
        '</div>';

    // New database form (hidden by default)
    html += '<div id="db-new-form" style="display:none;padding:8px 0">' +
        '<div class="db-section-label" style="padding-top:0">Create New Database</div>' +
        '<p style="font-size:12px;color:var(--text-muted);margin:0 0 8px">Browse to a folder below, then name your database and click Create.</p>' +
        '<div class="db-new-row">' +
        '<input type="text" id="new-db-dir" placeholder="Directory (browse below or type)" value="' + esc(dbInfo.current_dir) + '">' +
        '<input type="text" id="new-db-name" placeholder="Filename" value="dct_os.db" style="max-width:140px">' +
        '<button class="btn btn-primary btn-sm" onclick="createNewDatabase()">Create</button>' +
        '</div></div>';

    // Recent databases
    if (recent.length > 0) {
        html += '<div class="db-section-label">Recent</div>';
        html += '<div class="db-recent">';
        for (const r of recent) {
            const isActive = r.path === dbInfo.current ? ' active' : '';
            html += '<div class="db-recent-item' + isActive + '" onclick="switchDatabase(\'' + esc(r.path.replace(/\\/g, '\\\\').replace(/'/g, "\\'")) + '\')">' +
                '<span class="db-item-icon">' + (isActive ? '📌' : '🗃️') + '</span>' +
                '<div style="flex:1;min-width:0">' +
                '<div>' + esc(r.name) + '</div>' +
                '<div class="db-recent-path">' + esc(r.path) + '</div>' +
                '</div></div>';
        }
        html += '</div>';
    }

    // Browse section
    html += '<div class="db-section-label">Browse</div>';
    html += '<div id="db-browser-container"></div>';

    html += '</div>';

    openModal('Switch Database', html, { save: async () => {} });
    document.getElementById('modal-save').style.display = 'none';

    // Load the file browser
    loadBrowser(dbInfo.current_dir);
}

function showNewDatabaseForm() {
    const form = document.getElementById('db-new-form');
    const btn = document.getElementById('db-new-btn');
    if (form && btn) {
        const showing = form.style.display !== 'none';
        form.style.display = showing ? 'none' : '';
        btn.textContent = showing ? '+ New Database' : 'Cancel New';
        btn.classList.toggle('btn-primary', showing);
        btn.classList.toggle('btn-danger', !showing);
        if (!showing) {
            const nameInput = document.getElementById('new-db-name');
            if (nameInput) nameInput.focus();
        }
    }
}

async function loadBrowser(path) {
    const container = document.getElementById('db-browser-container');
    if (!container) return;

    container.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:13px">Loading...</div>';

    let data;
    try {
        const url = path ? '/api/browse?path=' + encodeURIComponent(path) : '/api/browse';
        data = await apiFetch(url);
    } catch (e) {
        container.innerHTML = '<div style="padding:12px;color:var(--danger)">Error: ' + esc(e.message) + '</div>';
        return;
    }

    let html = '<div class="db-browser">';

    // Path bar with up button
    html += '<div class="db-browser-path">';
    if (data.parent) {
        html += '<button class="btn btn-sm" onclick="loadBrowser(\'' + esc(data.parent.replace(/\\/g, '\\\\').replace(/'/g, "\\'")) + '\')">↑ Up</button>';
    }
    html += '<span>' + esc(data.path) + '</span>';
    html += '</div>';

    // Shortcuts + drives
    if (data.shortcuts && data.shortcuts.length > 0) {
        html += '<div class="db-browser-shortcuts">';
        for (const s of data.shortcuts) {
            html += '<button class="db-shortcut" onclick="loadBrowser(\'' + esc(s.path.replace(/\\/g, '\\\\').replace(/'/g, "\\'")) + '\')">' + esc(s.name) + '</button>';
        }
        if (data.drives) {
            for (const d of data.drives) {
                html += '<button class="db-shortcut" onclick="loadBrowser(\'' + esc(d.replace(/\\/g, '\\\\').replace(/'/g, "\\'")) + '\')">' + esc(d) + '</button>';
            }
        }
        html += '</div>';
    }

    // Items
    if (data.items && data.items.length > 0) {
        for (const item of data.items) {
            const escapedPath = esc(item.path.replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
            if (item.type === 'directory') {
                html += '<div class="db-item" onclick="loadBrowser(\'' + escapedPath + '\')">' +
                    '<span class="db-item-icon">📁</span>' +
                    '<span class="db-item-name">' + esc(item.name) + '</span>' +
                    '</div>';
            } else {
                html += '<div class="db-item" onclick="switchDatabase(\'' + escapedPath + '\')">' +
                    '<span class="db-item-icon">🗃️</span>' +
                    '<span class="db-item-name">' + esc(item.name) + '</span>' +
                    '<span class="db-item-size">' + formatFileSize(item.size) + '</span>' +
                    '<button class="btn btn-sm btn-primary db-item-action" onclick="event.stopPropagation();switchDatabase(\'' + escapedPath + '\')">Open</button>' +
                    '</div>';
            }
        }
    } else {
        html += '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px">No folders or .db files here</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // Update the new-db directory field to match current browser path
    const dirInput = document.getElementById('new-db-dir');
    if (dirInput) dirInput.value = data.path;
}

async function switchDatabase(path) {
    // First check lock status
    try {
        const resp = await fetch(API + '/api/database/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path }),
        });
        const data = await resp.json();

        if (!resp.ok) {
            toast(data.error || 'Failed to switch database', 'error');
            return;
        }

        // Show lock warning if someone else has it open
        if (data.locked_by) {
            showLockBanner(data.locked_by);
        }

        toast('Switched to ' + path.split(/[/\\]/).pop());
        closeModal();

        // Reload the page to reflect the new database
        window.location.reload();
    } catch (e) {
        toast('Failed to switch: ' + e.message, 'error');
    }
}

async function createNewDatabase() {
    const dir = document.getElementById('new-db-dir').value.trim();
    const name = document.getElementById('new-db-name').value.trim();
    if (!dir) { toast('Enter a directory path', 'error'); return; }
    if (!name) { toast('Enter a filename', 'error'); return; }

    try {
        const resp = await fetch(API + '/api/database/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ directory: dir, filename: name }),
        });
        const data = await resp.json();

        if (!resp.ok) {
            toast(data.error || 'Failed to create database', 'error');
            return;
        }

        toast('Created ' + name);
        closeModal();
        window.location.reload();
    } catch (e) {
        toast('Failed to create: ' + e.message, 'error');
    }
}

function showLockBanner(lockInfo) {
    const banner = document.getElementById('lock-banner');
    const text = document.getElementById('lock-banner-text');
    if (banner && text) {
        text.textContent = '⚠️ This database is also open by ' +
            lockInfo.user + ' on ' + lockInfo.hostname +
            '. Concurrent writes to SQLite may cause errors. Consider coordinating or upgrading to the multi-user edition.';
        banner.style.display = '';
    }
}

function dismissLockBanner() {
    const banner = document.getElementById('lock-banner');
    if (banner) banner.style.display = 'none';
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
    initDocketsGrid();
    initCostCodesGrid();
    initWorkOrdersGrid();
    initPurchaseOrdersGrid();
    initResourcesGrid();
    loadProjects();

    showPanel('empty');

    // Load database indicator (non-blocking)
    loadDatabaseInfo();

    // Check for updates after a short delay (non-blocking)
    setTimeout(checkForUpdates, 3000);
});
