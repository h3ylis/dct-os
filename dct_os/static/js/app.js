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
let modalSaving = false;

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
let editingDocket = null;
// The scan association to persist for the docket currently open in the modal.
// Set from the existing docket on open, from a browse file when one is picked,
// and to nulls on unassign — so Save writes exactly the user's intent rather
// than re-deriving it from stale browse state (which re-attached a scan after
// the user had just unassigned it).
let currentScan = { hash: null, filename: null, filepath: null };

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
    if (!activeProjectId && activePanel !== 'resources' && activePanel !== 'dashboard') return;

    switch (activePanel) {
        case 'dashboard': await loadDashboard(); break;
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

// --- Dashboard ---

// Drill handlers, indexed in render order so the inline onclick just references
// an index — no string-escaping of supplier names, WO numbers etc. in markup.
let _dashTileDrills = [];
let _dashDrills = [];
let _dashDrillField = 'cost_codes';  // which docket column the active chip filters

// Categorical palette for the work-order donut (deliberately NOT the budget
// green/amber/red so a WO slice can't be mistaken for a burn-rate signal).
const DASH_WO_PALETTE = ['#2f6695', '#1f9e75', '#d6920f', '#8a6fc7', '#d4708a', '#9aa6b3'];

async function loadDashboard() {
    const root = document.getElementById('dashboard-body');
    if (!root) return;

    if (!activeProjectId) {
        root.innerHTML = `<div class="empty-state">
            <h2>Select a project to get started</h2>
            <p>The dashboard shows a live overview of the whole project — spend, budgets, work orders, POs and claims.</p>
        </div>`;
        return;
    }

    // One fetch feeds every panel.
    let dash;
    try {
        dash = await apiFetch(`/api/projects/${activeProjectId}/dashboard`);
    } catch (e) {
        root.innerHTML = `<div class="empty-state"><h2>Could not load the dashboard</h2>
            <p>Try selecting the project again.</p></div>`;
        return;
    }

    const report = dash.cost_codes || [];
    const t = dash.tiles || {};
    const overBudget = (t.remaining || 0) < 0;

    // A registrar: stash a drill closure, return its index for the inline onclick.
    const drills = [];
    const reg = fn => { drills.push(fn); return drills.length - 1; };

    // Headline tiles: each one drills through to the screen that owns its data.
    const tiles = [
        { k: 'Total Budget', v: t.total_budget || 0, money: true, drill: () => showPanel('cost-codes') },
        { k: 'Total Spent', v: t.total_spent || 0, money: true, drill: () => showPanel('cost-codes') },
        { k: 'Remaining', v: Math.abs(t.remaining || 0), money: true, neg: overBudget, drill: () => showPanel('cost-codes') },
        { k: 'Dockets entered', v: t.total_dockets || 0, money: false, drill: () => showPanel('dockets') },
        { k: 'Suppliers', v: t.supplier_count || 0, money: false, drill: () => showPanel('reports') },
    ];
    _dashTileDrills = tiles.map(tile => tile.drill);

    const tilesHtml = tiles.map((tile, i) => `
        <div class="dash-tile${tile.neg ? ' over' : ''}" onclick="dashboardTileDrill(${i})"
             data-tip="Click to open the detail" data-tip-pos="below">
            <div class="dash-tile-k">${tile.k}</div>
            <div class="dash-tile-v" id="dash-tile-v-${i}">${tile.money ? currency(0) : '0'}</div>
        </div>`).join('');

    // Cost-code burn-down rows (unchanged behaviour — reuses the .dash-fill CSS).
    let rowsHtml;
    if (report.length === 0) {
        rowsHtml = `<div class="dash-empty">No cost codes yet — add cost codes with budgets to see the burn-down.</div>`;
    } else {
        rowsHtml = report.map((r, i) => {
            const budget = r.budget_amount || 0;
            const actual = r.actual_spend || 0;
            const hasBudget = budget > 0;
            const ratio = hasBudget ? actual / budget : 0;
            const fillPct = hasBudget ? Math.min(ratio * 100, 100) : 0;
            const cls = !hasBudget ? '' : ratio > 1 ? 'burn-over' : ratio >= 0.8 ? 'burn-warn' : 'burn-ok';
            const pctLabel = hasBudget ? Math.round(ratio * 100) + '%' : 'no budget';
            // Width is set inline so the bar is always correct; the "flood" is a
            // pure-CSS scaleX animation that needs no JS to leave the right resting state.
            const idx = reg(() => dashboardDrill('cost_codes',
                { filterType: 'text', type: 'contains', filter: r.code }, 'Cost code ' + r.code));
            return `<div class="dash-row" onclick="dashDrill(${idx})"
                         data-tip="${currency(actual)} of ${currency(budget)} — click to see its dockets" data-tip-pos="below">
                <span class="dash-code">${esc(r.code)}</span>
                <span class="dash-name">${esc(r.description || '')}</span>
                <span class="dash-bar">
                    <span class="dash-fill ${cls}" style="width:${fillPct}%;animation-delay:${i * 45}ms"></span>
                    <span class="dash-pct${hasBudget ? '' : ' muted'}">${pctLabel}</span>
                </span>
            </div>`;
        }).join('');
    }

    // Header carries no project name — the sidebar highlight is the project
    // signal (the app dropped the name from the header in v1.0).
    root.innerHTML = `
        <div class="dash-head">
            <div class="dash-sub">Live project overview</div>
        </div>
        <div class="dash-tiles">${tilesHtml}</div>

        <div class="dash-card dash-card-wide">
            <div class="dash-card-head">
                <span class="dash-card-title">Spend over time</span>
                <span class="dash-card-hint">Cumulative weekly spend vs total budget</span>
            </div>
            ${dashSpendChart(dash.spend_series || [], t.total_budget || 0)}
        </div>

        <div class="dash-cards">
            <div class="dash-card">
                <div class="dash-card-head">
                    <span class="dash-card-title">Cost by work order</span>
                    <span class="dash-card-hint">Click a work order to see its dockets</span>
                </div>
                ${dashWoDonut(dash.wo_costs || [], DASH_WO_PALETTE, reg)}
            </div>
            <div class="dash-card">
                <div class="dash-card-head">
                    <span class="dash-card-title">Claimed vs to-claim</span>
                    <span class="dash-card-hint">Cash already claimed against what's left</span>
                </div>
                ${dashClaimSplit(dash.claimed || 0, dash.to_claim || 0, reg)}
            </div>
            <div class="dash-card">
                <div class="dash-card-head">
                    <span class="dash-card-title">PO drawdown</span>
                    <span class="dash-card-hint">Drawn against committed, per active PO</span>
                </div>
                ${dashPoDrawdown(dash.po_drawdown || [], reg)}
            </div>
            <div class="dash-card">
                <div class="dash-card-head">
                    <span class="dash-card-title">Top suppliers by spend</span>
                    <span class="dash-card-hint">Click a supplier to see its dockets</span>
                </div>
                ${dashTopSuppliers(dash.top_suppliers || [], reg)}
            </div>
        </div>

        <div class="dash-board-head">
            <span class="dash-board-title">Cost code burn-down</span>
            <span class="dash-board-hint">Click any bar to jump to its dockets</span>
        </div>
        <div class="dash-grid">${rowsHtml}</div>
    `;

    _dashDrills = drills;

    // The flood: bars rise from zero via CSS (see .dash-fill); tiles count up.
    tiles.forEach((tile, i) => {
        animateCount(document.getElementById('dash-tile-v-' + i), tile.v, { money: tile.money, neg: tile.neg });
    });
}

// Count a tile up to its target. The count-up is a progressive enhancement —
// a setTimeout safety net forces the correct final value even if rAF is paused
// (e.g. the tab is in the background), so a tile never rests on a wrong number.
function animateCount(el, target, opts) {
    if (!el) return;
    opts = opts || {};
    const dur = 700;
    const fmt = (val) => {
        if (opts.money) {
            const s = currency(val);
            return opts.neg ? '(' + s + ')' : s;
        }
        return Math.round(val).toLocaleString();
    };
    if (!target) { el.textContent = fmt(0); return; }
    let raf = null;
    const safety = setTimeout(() => {
        if (raf) cancelAnimationFrame(raf);
        el.textContent = fmt(target);
    }, dur + 250);
    el.textContent = fmt(0);
    const start = performance.now();
    function frame(now) {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(target * eased);
        if (t < 1) { raf = requestAnimationFrame(frame); }
        else { clearTimeout(safety); el.textContent = fmt(target); }
    }
    raf = requestAnimationFrame(frame);
}

function dashboardTileDrill(i) {
    const fn = _dashTileDrills[i];
    if (typeof fn === 'function') fn();
}

// Slice / bar / supplier drill — closures registered by index in render order.
function dashDrill(i) {
    const fn = _dashDrills[i];
    if (typeof fn === 'function') fn();
}

// Jump to Dockets and filter a column. `field` is the docket grid column,
// `model` an AG-Grid filter model, `label` the removable chip's text.
async function dashboardDrill(field, model, label) {
    showPanel('dockets');
    await loadDockets();
    applyDocketFilter(field, model, label);
}

function applyDocketFilter(field, model, label) {
    if (!docketsGridApi) return;
    _dashDrillField = field;
    const apply = () => {
        docketsGridApi.onFilterChanged();
        const chip = document.getElementById('docket-filter-chip');
        if (chip) {
            chip.querySelector('.chip-text').textContent = label;
            chip.style.display = '';
        }
    };
    const res = docketsGridApi.setColumnFilterModel(field, model);
    if (res && typeof res.then === 'function') res.then(apply);
    else apply();
}

function clearDocketDrill() {
    const chip = document.getElementById('docket-filter-chip');
    if (chip) chip.style.display = 'none';
    if (!docketsGridApi) return;
    const res = docketsGridApi.setColumnFilterModel(_dashDrillField, null);
    const after = () => docketsGridApi.onFilterChanged();
    if (res && typeof res.then === 'function') res.then(after);
    else after();
}

// --- Dashboard panel renderers (inline SVG / CSS only — no chart library) ---

// Cumulative weekly spend as an area + line, with a dashed total-budget line.
function dashSpendChart(series, totalBudget) {
    if (!series.length) {
        return `<div class="dash-card-empty">No dated dockets yet — spend over time appears once dockets are entered.</div>`;
    }
    // viewBox kept close to the real on-screen size so the SVG (and its text)
    // isn't blown up when stretched to the full-width card.
    const W = 1400, H = 200;
    const padL = 28, padR = 28, padT = 18, padB = 10;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const last = series[series.length - 1].cumulative || 0;
    const maxY = Math.max(totalBudget, last, 1) * 1.08;
    const n = series.length;
    const baseY = padT + plotH;
    const xAt = i => padL + (n === 1 ? plotW : plotW * i / (n - 1));
    const yAt = v => padT + plotH * (1 - v / maxY);

    const linePts = series.map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.cumulative).toFixed(1)}`).join(' ');
    const areaPts = `${padL.toFixed(1)},${baseY.toFixed(1)} ${linePts} ${xAt(n - 1).toFixed(1)},${baseY.toFixed(1)}`;

    let budgetLine = '';
    if (totalBudget > 0) {
        const by = yAt(totalBudget).toFixed(1);
        budgetLine = `
            <line class="dash-budget-line" x1="${padL}" y1="${by}" x2="${W - padR}" y2="${by}"></line>
            <text class="dash-budget-tag" x="${W - padR}" y="${(parseFloat(by) - 5).toFixed(1)}" text-anchor="end">Budget ${currency(totalBudget)}</text>`;
    }

    const endX = xAt(n - 1).toFixed(1);
    const endY = yAt(last).toFixed(1);

    return `
        <svg class="dash-spend-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cumulative spend over time">
            <polygon class="dash-spend-area" points="${areaPts}"></polygon>
            <polyline class="dash-spend-line" points="${linePts}"></polyline>
            ${budgetLine}
            <circle class="dash-spend-dot" cx="${endX}" cy="${endY}" r="4"></circle>
        </svg>
        <div class="dash-spend-axis">
            <span>${esc(series[0].week_start || '')}</span>
            <span class="dash-spend-end">${currency(last)} to date</span>
            <span>${esc(series[n - 1].week_start || '')}</span>
        </div>`;
}

// Spend grouped by work order as a conic-gradient donut + clickable legend.
function dashWoDonut(wo, palette, reg) {
    const total = wo.reduce((s, w) => s + (w.amount || 0), 0);
    if (!total) {
        return `<div class="dash-card-empty">No work-order spend yet.</div>`;
    }
    let acc = 0;
    const stops = wo.map((w, i) => {
        const start = (acc / total) * 100;
        acc += w.amount || 0;
        const end = (acc / total) * 100;
        return `${palette[i % palette.length]} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    }).join(', ');

    const legend = wo.map((w, i) => {
        const c = palette[i % palette.length];
        const label = w.number + (w.description ? ' · ' + w.description : '');
        const idx = reg(() => dashboardDrill('wo_numbers',
            { filterType: 'text', type: 'contains', filter: w.number }, 'Work order ' + w.number));
        return `<div class="dash-legend-row" onclick="dashDrill(${idx})"
                     data-tip="Click to see ${esc(w.number)}'s dockets" data-tip-pos="below">
            <span class="dash-swatch" style="background:${c}"></span>
            <span class="dash-legend-name">${esc(label)}</span>
            <span class="dash-legend-val">${currency(w.amount)}</span>
        </div>`;
    }).join('');

    return `
        <div class="dash-donut-wrap">
            <div class="dash-donut" style="background:conic-gradient(${stops})">
                <div class="dash-donut-hole">
                    <div class="dash-donut-total">${currency(total)}</div>
                    <div class="dash-donut-cap">Spent</div>
                </div>
            </div>
            <div class="dash-legend">${legend}</div>
        </div>`;
}

// Per active PO: a drawn-vs-committed bar (amber > 90% drawn, red overdrawn).
function dashPoDrawdown(pos, reg) {
    if (!pos.length) {
        return `<div class="dash-card-empty">No active purchase orders.</div>`;
    }
    return `<div class="dash-bars">` + pos.map(po => {
        const committed = po.committed || 0;
        const drawn = po.drawn || 0;
        const ratio = committed > 0 ? drawn / committed : 0;
        const fillPct = Math.min(ratio * 100, 100);
        const cls = ratio > 1 ? 'po-over' : ratio > 0.9 ? 'po-warn' : 'po-ok';
        const idx = reg(() => dashboardDrill('po_number',
            { filterType: 'text', type: 'contains', filter: po.number }, 'PO ' + po.number));
        const sup = po.supplier_name ? ' · ' + esc(po.supplier_name) : '';
        return `<div class="dash-barrow" onclick="dashDrill(${idx})"
                     data-tip="Click to see ${esc(po.number)}'s dockets" data-tip-pos="below">
            <div class="dash-barrow-top">
                <span class="dash-barrow-label">${esc(po.number)}${sup}</span>
                <span class="dash-barrow-fig">${currency(drawn)} / ${currency(committed)}</span>
            </div>
            <span class="dash-track"><span class="dash-track-fill ${cls}" style="width:${fillPct}%"></span></span>
        </div>`;
    }).join('') + `</div>`;
}

// Top suppliers by spend — horizontal bars scaled to the biggest spender.
function dashTopSuppliers(suppliers, reg) {
    if (!suppliers.length) {
        return `<div class="dash-card-empty">No supplier spend yet.</div>`;
    }
    const max = suppliers[0].amount || 1;
    return `<div class="dash-bars">` + suppliers.map(s => {
        const pct = Math.max((s.amount || 0) / max * 100, 2);
        const idx = reg(() => dashboardDrill('supplier_name',
            { filterType: 'text', type: 'contains', filter: s.name }, 'Supplier ' + s.name));
        return `<div class="dash-barrow" onclick="dashDrill(${idx})"
                     data-tip="Click to see ${esc(s.name)}'s dockets" data-tip-pos="below">
            <div class="dash-barrow-top">
                <span class="dash-barrow-label">${esc(s.name)}</span>
                <span class="dash-barrow-fig">${currency(s.amount)}</span>
            </div>
            <span class="dash-track"><span class="dash-track-fill supplier" style="width:${pct}%"></span></span>
        </div>`;
    }).join('') + `</div>`;
}

// Claimed vs to-claim as a single split bar + two clickable figures.
function dashClaimSplit(claimed, toClaim, reg) {
    const total = (claimed || 0) + (toClaim || 0);
    if (!total) {
        return `<div class="dash-card-empty">No spend to claim yet.</div>`;
    }
    const claimedPct = claimed / total * 100;
    const toClaimPct = toClaim / total * 100;
    const idxC = reg(() => dashboardDrill('claimed_reference',
        { filterType: 'text', type: 'notBlank' }, 'Claimed dockets'));
    const idxT = reg(() => dashboardDrill('claimed_reference',
        { filterType: 'text', type: 'blank' }, 'Unclaimed dockets'));
    return `
        <div class="dash-split">
            <span class="dash-split-seg claimed" style="width:${claimedPct}%" onclick="dashDrill(${idxC})"
                  data-tip="Claimed — click to see these dockets" data-tip-pos="above"></span>
            <span class="dash-split-seg toclaim" style="width:${toClaimPct}%" onclick="dashDrill(${idxT})"
                  data-tip="Still to claim — click to see these dockets" data-tip-pos="above"></span>
        </div>
        <div class="dash-split-keys">
            <div class="dash-split-key" onclick="dashDrill(${idxC})">
                <span class="dash-swatch claimed"></span>
                <span class="dash-split-k">Claimed</span>
                <span class="dash-split-v">${currency(claimed)}</span>
            </div>
            <div class="dash-split-key" onclick="dashDrill(${idxT})">
                <span class="dash-swatch toclaim"></span>
                <span class="dash-split-k">To claim</span>
                <span class="dash-split-v">${currency(toClaim)}</span>
            </div>
        </div>`;
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
        { field: 'description', headerName: 'Item', flex: 1, minWidth: 180,
            headerTooltip: 'What the resource is (e.g. 20T Excavator, Plant Operator)' },
        { field: 'details', headerName: 'Description', flex: 1, minWidth: 200,
            headerTooltip: 'Make, model, attachments — helps match docket and invoice wording' },
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
    // Focus the first field the user can actually see — skip hidden and file
    // inputs (the docket modal leads with a hidden folder picker).
    const fields = document.querySelectorAll('.modal-body input, .modal-body select, .modal-body textarea');
    for (const f of fields) {
        if (f.type === 'hidden' || f.type === 'file' || f.offsetParent === null) continue;
        f.focus();
        break;
    }
}

function closeModal(event) {
    if (event && event.target !== document.getElementById('modal-overlay')) return;
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('open');
    overlay.querySelector('.modal').classList.remove('modal-wide');
    const saveBtn = document.getElementById('modal-save');
    saveBtn.style.display = '';
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
    document.getElementById('modal-delete').style.display = 'none';
    modalContext = null;
    modalSaving = false;
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
    // Guard against a second save while one is in flight — an impatient
    // double/triple-click on a slow connection would otherwise fire several
    // POSTs and create duplicate records. One entry screen = one save.
    if (!modalContext || modalSaving) return;
    modalSaving = true;
    const saveBtn = document.getElementById('modal-save');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }
    try {
        await modalContext.save();
        // Capture the success message BEFORE closeModal() — it nulls modalContext,
        // so reading modalContext.successMsg afterwards throws and (silently, via the
        // catch below) skips the success toast.
        const successMsg = (modalContext && modalContext.successMsg) || 'Saved';
        closeModal();
        await refreshProjectData();
        await refreshCurrentPanel();
        toast(successMsg, 'success');
        // The modal closes on save — no auto-advance. The entered scan drops off
        // the browse list (it's now assigned), and the user reopens a fresh
        // docket for the next one.
    } catch (e) {
        // Validation or API error (already toasted) — re-enable so the user
        // can fix the problem and try again.
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; }
    } finally {
        modalSaving = false;
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
            <div class="input-prefix">
                <span class="input-prefix-symbol">$</span>
                <input type="number" id="f-cc-budget" step="0.01" placeholder="0.00" value="${e.budget_amount || ''}">
            </div>
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
            <label data-tip="Type the supplier — names you've used autocomplete; a new one is saved as you type" data-tip-pos="below">Supplier</label>
            <input type="text" id="f-po-supplier" value="${esc(e.supplier_name || '')}" oninput="supplierAutocomplete(event)" autocomplete="off" placeholder="Type a supplier name">
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
        <div class="form-group">
            <label data-tip="Make, model, attachments — helps match the wording on dockets and invoices" data-tip-pos="below">Description</label>
            <input type="text" id="f-res-details" value="${esc(e.details || '')}" placeholder="e.g. Cat 314, rubber tracked, long arm">
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
            <label data-tip="The supplier who provides this resource (optional) — type a new one or autocomplete an existing" data-tip-pos="below">Supplier</label>
            <input type="text" id="f-res-supplier" value="${esc(e.supplier_name || '')}" oninput="supplierAutocomplete(event)" autocomplete="off" placeholder="Type a supplier name">
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
                details: document.getElementById('f-res-details').value || null,
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
    editingDocket = existing || null;
    // Seed the scan association from the docket being opened (nulls for a new
    // one). Picking a browse file or unassigning updates this; Save persists it.
    currentScan = {
        hash: e.source_hash || null,
        filename: e.source_filename || null,
        filepath: e.source_filepath || null,
    };
    const today = new Date().toISOString().slice(0, 10);
    docketLineCounter = 0;

    const poOptions = cachedPurchaseOrders
        .filter(p => p.is_active)
        .map(p => `<option value="${p.id}"${e.purchase_order_id === p.id ? ' selected' : ''}>${esc(p.number)} — ${esc(p.supplier_name || '')}</option>`)
        .join('');

    const savedFolderPath = localStorage.getItem('dctos_folder_path') || '';

    const html = `
        <div class="docket-entry" id="docket-entry">
            <div class="pdf-pane" id="docket-pdf-pane">
                <div id="browse-list-view" class="browse-view">
                    <div class="pdf-toolbar">
                        <span style="font-size:13px;font-weight:500;flex:1">Source documents</span>
                        <button class="pdf-tb-btn pdf-tb-close" onclick="togglePdfPane()" title="Close">&times;</button>
                    </div>
                    <div class="browse-folder-bar">
                        <button class="pdf-tb-btn browse-pick-btn" onclick="pickFolder()" title="Choose the folder of scanned dockets">&#128193; Choose folder…</button>
                        <span id="browse-folder-display" class="browse-folder-display" title="${esc(savedFolderPath)}">${esc(savedFolderPath)}</span>
                    </div>
                    <div id="browse-manual-row" class="browse-folder-bar" style="display:none">
                        <input type="text" id="browse-folder-path" class="browse-folder-input" placeholder="Type the full folder path (e.g. C:\\Projects\\Scans)">
                        <button class="pdf-tb-btn" onclick="manualLoadFolder()" title="Load scans from this path">Load</button>
                    </div>
                    <div id="browse-path-status" class="browse-path-status" style="display:none"></div>
                    <div id="browse-file-list" class="browse-file-list">
                        <div class="pdf-placeholder">
                            <div style="font-size:36px;margin-bottom:8px;opacity:0.4">&#128193;</div>
                            <div>Choose a folder to see scans</div>
                        </div>
                    </div>
                    <div id="browse-progress" class="browse-progress" style="display:none">
                        <span id="browse-progress-text">0 / 0</span>
                        <div class="browse-progress-track"><div class="browse-progress-fill" id="browse-progress-fill"></div></div>
                    </div>
                </div>

                <div id="browse-viewer-view" class="browse-view" style="display:none">
                    <div class="pdf-toolbar">
                        <button class="pdf-tb-btn" onclick="showBrowseList()" title="Back to file list">&#9664; List</button>
                        <span id="browse-viewer-filename" style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 6px"></span>
                        <span id="browse-viewer-counter" style="font-size:11px;color:var(--text-muted);white-space:nowrap"></span>
                        <button class="pdf-tb-btn pdf-tb-close" onclick="togglePdfPane()" title="Close">&times;</button>
                    </div>
                    <div class="pdf-viewer" id="pdf-viewer"></div>
                    <div class="browse-viewer-nav">
                        <button class="pdf-tb-btn" onclick="browsePrevPending()" title="Previous pending">&#9664; Prev</button>
                        <button class="pdf-tb-btn" onclick="browseNextPending()" title="Next pending">Next &#9654;</button>
                    </div>
                    <div class="docket-fingerprint" id="browse-viewer-fp" style="display:none">
                        <span class="fp-label">Fingerprint:</span>
                        <span class="fp-hash" id="browse-viewer-hash"></span>
                    </div>
                </div>

                <div id="edit-scan-view" class="browse-view" style="display:none">
                    <div class="pdf-toolbar">
                        <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" id="edit-scan-filename"></span>
                        <span id="edit-scan-status" style="font-size:11px;white-space:nowrap"></span>
                        <button class="pdf-tb-btn pdf-tb-close" onclick="togglePdfPane()" title="Close">&times;</button>
                    </div>
                    <div class="pdf-viewer" id="edit-scan-viewer"></div>
                    <div class="docket-fingerprint" id="edit-scan-fp" style="display:none">
                        <span class="fp-label">Fingerprint:</span>
                        <span class="fp-hash" id="edit-scan-hash"></span>
                    </div>
                    <div class="browse-unassign-row">
                        <button class="btn-sm btn-danger-outline" onclick="unassignScan()" style="flex:1">&#128279; Unassign scan</button>
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
                        <label data-tip="Type to autocomplete from your suppliers — press Tab or → to accept" data-tip-pos="below">Supplier</label>
                        <input type="text" id="f-dk-supplier" value="${esc(e.supplier_name || '')}" oninput="onSupplierInput(event)" autocomplete="off">
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
            // Drop blank lines (a stray empty row shouldn't block or save).
            const allLines = collectDocketLines();
            const lines = allLines.filter(l =>
                l.resource_id || (l.description && l.description.trim()) || l.qty > 0
            );
            const body = {
                date: document.getElementById('f-dk-date').value,
                docket_number: document.getElementById('f-dk-number').value || null,
                supplier_name: document.getElementById('f-dk-supplier').value || null,
                purchase_order_id: parseInt(document.getElementById('f-dk-po').value) || null,
                notes: document.getElementById('f-dk-notes').value || null,
                lines: lines,
                source_hash: currentScan.hash,
                source_filename: currentScan.filename,
                source_filepath: currentScan.filepath,
            };
            if (!body.date) { toast('Date is required', 'error'); throw new Error('validation'); }
            if (body.lines.length === 0) { toast('Add at least one line with a quantity', 'error'); throw new Error('validation'); }
            // Every line that has content needs a quantity — a qty of 0 means
            // a value was missed (the classic "typed the qty into the wrong box").
            const noQty = lines.findIndex(l => !(l.qty > 0));
            if (noQty !== -1) {
                toast('Line ' + (noQty + 1) + ' needs a quantity', 'error');
                throw new Error('validation');
            }
            // Backstop for the browser-can't-see-the-real-path trap: if we're
            // about to store a scan path that isn't absolute (a drive letter,
            // UNC, or POSIX root), it won't reopen later. Warn but don't block —
            // the docket data is fine; only the scan link would be broken.
            if (body.source_filepath && !/^([a-zA-Z]:[\\/]|\\\\|\/)/.test(body.source_filepath)) {
                toast('Scan saved, but the folder path looks incomplete — paste the full path so it reopens', 'error');
            }
            if (isEdit) {
                await apiRequest('PUT', `/api/dockets/${existing.id}`, body);
            } else {
                await apiRequest('POST', `/api/projects/${activeProjectId}/dockets`, body);
            }
            await loadSummary();
            // If we actually saved a scan against this docket, mark it so it
            // drops off the browse list. Don't mark after an unassign (no scan).
            if (currentScan.hash && browseFiles.length > 0 && browseFileIndex >= 0) {
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

    // New docket with a supplier already typed → narrow the PO list. (Editing
    // keeps the docket's saved PO selection untouched.)
    if (!isEdit) filterDocketPOs();

    // Populate existing lines or add one empty line
    if (e.lines && e.lines.length > 0) {
        e.lines.forEach(ln => addDocketLine(ln));
    } else {
        addDocketLine();
    }

    // Restore side panel state. The panel itself stays CLOSED by default
    // regardless of whether this docket has a scan — the user deploys it with
    // the toggle. We only pre-render the (pending-only) file list so it's ready
    // the moment they open it.
    if (browseFiles.length > 0) {
        renderBrowseFileList();
    }

    // Focus the first real field explicitly so the cursor lands on Date.
    document.getElementById('f-dk-date')?.focus();
}

function addDocketLine(data) {
    // Fresh line (no data) carries the WO + CC down from the last line — the
    // fast repeat-entry feel from earlier DCT versions. Explicit data (editing
    // an existing docket) is used as-is.
    if (!data) {
        const rows = document.querySelectorAll('#docket-lines-body tr');
        if (rows.length) {
            const last = rows[rows.length - 1].id.replace('dkline-', '');
            const woEl = document.getElementById(`ln-wo-${last}`);
            const ccEl = document.getElementById(`ln-cc-${last}`);
            data = {
                work_order_id: woEl && woEl.value ? parseInt(woEl.value) : null,
                cost_code_id: ccEl && ccEl.value ? parseInt(ccEl.value) : null,
            };
        }
    }
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
            <option value="">--</option>
            <option value="__new__">+ New item…</option>${resOpts}
        </select></td>
        <td class="col-desc"><input type="text" id="ln-desc-${idx}" value="${esc(d.description || '')}" onblur="onLineDescBlur(${idx})" placeholder="${esc((d.resource_id && (r => r && (r.details || r.description))(cachedResources.find(r => r.id === d.resource_id))) || 'Description')}"><input type="hidden" id="ln-rate-${idx}" value="${d.rate || ''}"></td>
        <td class="col-qty"><input type="number" id="ln-qty-${idx}" step="0.01" value="${d.qty || ''}" placeholder="0" onkeydown="onLineKeydown(event, ${idx})"></td>
        <td class="col-unit"><input type="text" id="ln-unit-${idx}" value="${esc(d.unit || '')}" placeholder="Hr" onkeydown="onLineKeydown(event, ${idx})"></td>
        <td class="col-rm"><button class="btn-line-remove" onclick="removeDocketLine(${idx})" title="Remove line">&times;</button></td>
    `;
    document.getElementById('docket-lines-body').appendChild(tr);

    // Baseline for the "update resource description?" prompt
    const descEl = document.getElementById(`ln-desc-${idx}`);
    if (d.resource_id) {
        const r = cachedResources.find(x => x.id === d.resource_id);
        descEl.dataset.resdetails = (r && r.details) || '';
    }

    if (d.work_order_id) {
        onLineWOChange(idx);
    }
}

// Enter in the last line's Qty/Unit adds a new line (carrying WO+CC) and
// jumps to it — keyboard-driven repeat entry.
function onLineKeydown(event, idx) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const rows = document.querySelectorAll('#docket-lines-body tr');
    const isLast = rows.length && rows[rows.length - 1].id === `dkline-${idx}`;
    if (isLast) {
        addDocketLine();
        const newRows = document.querySelectorAll('#docket-lines-body tr');
        const newIdx = newRows[newRows.length - 1].id.replace('dkline-', '');
        const focusEl = document.getElementById(`ln-qty-${newIdx}`);
        if (focusEl) focusEl.focus();
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
        .map(r => `<option value="${r.id}"${r.id === selectedId || r.id == selectedId ? ' selected' : ''}${r.details ? ` title="${esc(r.details)}"` : ''}>${esc(r.description)}</option>`)
        .join('');
}

function refreshResourceDropdowns() {
    document.querySelectorAll('#docket-lines-body tr').forEach(tr => {
        const resSelect = tr.querySelector('select[id^="ln-res-"]');
        if (!resSelect) return;
        const currentVal = parseInt(resSelect.value) || null;
        resSelect.innerHTML = '<option value="">--</option>' +
            '<option value="__new__">+ New item…</option>' +
            getFilteredResourceOpts(currentVal);
    });
}

function onLineResourceChange(idx) {
    const sel = document.getElementById(`ln-res-${idx}`);

    // "+ New item…" — capture a brand-new resource without leaving the docket
    if (sel.value === '__new__') {
        sel.value = '';
        openQuickAddResource(idx);
        return;
    }

    const resId = parseInt(sel.value);
    const descEl = document.getElementById(`ln-desc-${idx}`);
    if (!resId) { if (descEl) delete descEl.dataset.resdetails; return; }
    const res = cachedResources.find(r => r.id === resId);
    if (!res) return;

    const unitEl = document.getElementById(`ln-unit-${idx}`);
    const rateEl = document.getElementById(`ln-rate-${idx}`);

    // Auto-fill the line Description from the resource's Description (its
    // make/model detail) — but never clobber detail the user has typed.
    // Fall back to the item name as a placeholder when there's no detail.
    if (!descEl.value) descEl.value = res.details || '';
    descEl.placeholder = res.details || res.description;
    descEl.dataset.resdetails = res.details || '';  // baseline for #2 prompt
    unitEl.value = res.unit;
    // Rate is applied silently from the resource — dockets carry quantities
    // only; rates are confirmed at invoice review in the summary report.
    rateEl.value = res.standard_rate || '';
}

// #1 — quick-add a resource from a docket line, in an overlay above the
// open docket so the in-progress docket is preserved.
function openQuickAddResource(idx) {
    closeRateGate();
    const overlay = document.createElement('div');
    overlay.id = 'rate-gate-overlay';
    overlay.innerHTML =
        '<div class="rate-gate" style="max-width:520px">' +
        '<h3 style="margin:0 0 14px;font-size:16px">New resource</h3>' +
        '<div class="form-group"><label>Item *</label>' +
        '<input type="text" id="qa-item" placeholder="e.g. 30T Excavator"></div>' +
        '<div class="form-group"><label>Description</label>' +
        '<input type="text" id="qa-details" placeholder="e.g. Cat 330, tilt hitch, wet hire"></div>' +
        '<div class="db-new-row">' +
        '<div class="form-group" style="flex:1"><label>Unit *</label>' +
        '<input type="text" id="qa-unit" placeholder="Hr, Day, Tonne…"></div>' +
        '<div class="form-group" style="flex:1"><label>Standard Rate</label>' +
        '<input type="number" id="qa-rate" step="0.01" value="0"></div></div>' +
        '<div class="form-group"><label>Category</label>' +
        '<input type="text" id="qa-category" placeholder="Plant, Labour, Materials…"></div>' +
        '<div class="rate-gate-actions">' +
        '<button class="btn rate-gate-cancel" id="qa-cancel">Cancel</button>' +
        '<button class="btn btn-primary" id="qa-create">Add resource</button>' +
        '</div></div>';
    document.body.appendChild(overlay);

    // Prefill Item from the line's typed description if there is one
    const lineDesc = document.getElementById(`ln-desc-${idx}`);
    if (lineDesc && lineDesc.value) document.getElementById('qa-item').value = lineDesc.value;
    document.getElementById('qa-item').focus();

    const supplier = document.getElementById('f-dk-supplier')?.value?.trim() || null;

    document.getElementById('qa-cancel').onclick = closeRateGate;
    document.getElementById('qa-create').onclick = async () => {
        const item = document.getElementById('qa-item').value.trim();
        const unit = document.getElementById('qa-unit').value.trim();
        if (!item || !unit) { toast('Item and unit are required', 'error'); return; }
        const body = {
            description: item,
            details: document.getElementById('qa-details').value.trim() || null,
            unit: unit,
            standard_rate: parseFloat(document.getElementById('qa-rate').value) || 0,
            category: document.getElementById('qa-category').value.trim() || null,
            supplier_name: supplier,
        };
        try {
            const created = await apiRequest('POST', '/api/resources', body);
            cachedResources = await apiFetch('/api/resources');
            // Rebuild the line's dropdown to include + select the new item
            const sel = document.getElementById(`ln-res-${idx}`);
            sel.innerHTML = '<option value="">--</option>' +
                '<option value="__new__">+ New item…</option>' +
                getFilteredResourceOpts(created.id);
            sel.value = String(created.id);
            closeRateGate();
            onLineResourceChange(idx);
            toast('Added to resources: ' + item);
        } catch (e) { /* apiRequest toasted */ }
    };
}

// #2 — editing a line's Description (for a line tied to a resource) offers to
// update the resource's stored Description too. Aliases are commercial.
function onLineDescBlur(idx) {
    const descEl = document.getElementById(`ln-desc-${idx}`);
    const sel = document.getElementById(`ln-res-${idx}`);
    if (!descEl || !sel) return;
    const resId = parseInt(sel.value);
    if (!resId) return;
    const baseline = descEl.dataset.resdetails || '';
    const val = descEl.value.trim();
    if (!val || val === baseline) return;
    if (document.getElementById('rate-gate-overlay')) return;  // a prompt is already up

    const res = cachedResources.find(r => r.id === resId);
    if (!res) return;

    const overlay = document.createElement('div');
    overlay.id = 'rate-gate-overlay';
    overlay.innerHTML =
        '<div class="rate-gate">' +
        '<p>Update the saved description for <strong>' + esc(res.description) + '</strong> to ' +
        '“' + esc(val) + '”?</p>' +
        '<div class="rate-gate-actions">' +
        '<button class="btn rate-gate-cancel" id="dd-keep">Just this docket</button>' +
        '<button class="btn btn-primary" id="dd-update">Update resource</button>' +
        '</div></div>';
    document.body.appendChild(overlay);

    const settle = () => { descEl.dataset.resdetails = val; closeRateGate(); };
    document.getElementById('dd-keep').onclick = settle;
    document.getElementById('dd-update').onclick = async () => {
        try {
            await apiRequest('PUT', '/api/resources/' + resId, { details: val });
            const r = cachedResources.find(x => x.id === resId);
            if (r) r.details = val;
            toast('Resource description updated');
        } catch (e) { /* toasted */ }
        settle();
    };
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

function openPdfPane() {
    const entry = document.getElementById('docket-entry');
    if (!entry || entry.classList.contains('pdf-open')) return;
    entry.classList.add('pdf-open');
    const icon = document.getElementById('pdf-toggle-icon');
    if (icon) icon.style.opacity = '0.4';
}

function togglePdfPane() {
    const entry = document.getElementById('docket-entry');
    if (!entry) return;
    if (entry.classList.contains('pdf-open')) {
        entry.classList.remove('pdf-open');
        const icon = document.getElementById('pdf-toggle-icon');
        if (icon) icon.style.opacity = '1';
    } else {
        openPdfPane();
        // Editing a docket that already has a scan → show that scan (pulled from
        // the server by filepath, fingerprint re-checked). Everything else —
        // a new docket, or editing one with no scan yet — opens to the list.
        if (editingDocket && editingDocket.source_filepath) {
            showEditScan(editingDocket.id, editingDocket.source_filename, editingDocket.source_hash);
        } else {
            showBrowseList();
        }
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

// Inline type-ahead for any supplier field — type "Bla" and it completes to
// "Blacksoil Earthmoving" with the rest selected; Tab/→/End accepts, any
// other key replaces. A brand-new supplier just keeps typing (no match, no
// completion) and is saved as-is — supplier is free text, the suggestions
// are only a convenience. Stays on the keyboard, no mouse needed.
function supplierAutocomplete(event) {
    const el = event.target;
    const deleting = event.inputType && event.inputType.startsWith('delete');
    const typed = el.value;
    if (!deleting && typed) {
        const match = cachedSuppliers.find(
            s => s.toLowerCase().startsWith(typed.toLowerCase())
        );
        if (match && match.length > typed.length) {
            el.value = match;
            el.setSelectionRange(typed.length, match.length);
        }
    }
}

// Docket supplier also re-filters the PO list and resource dropdowns
function onSupplierInput(event) {
    supplierAutocomplete(event);
    filterDocketPOs();
    refreshResourceDropdowns();
}

// Narrow the PO dropdown to the chosen supplier's active POs. Exactly one →
// auto-select it; several → user picks; none → fall back to all active POs.
function filterDocketPOs() {
    const sel = document.getElementById('f-dk-po');
    if (!sel) return;
    const supplier = (document.getElementById('f-dk-supplier').value || '').trim().toLowerCase();
    const current = sel.value;

    let pos = cachedPurchaseOrders.filter(p => p.is_active);
    if (supplier) {
        const matched = pos.filter(p => (p.supplier_name || '').trim().toLowerCase() === supplier);
        if (matched.length) pos = matched;
    }

    sel.innerHTML = '<option value="">-- Select PO --</option>' +
        pos.map(p => `<option value="${p.id}">${esc(p.number)} — ${esc(p.supplier_name || '')}</option>`).join('');

    if (supplier && pos.length === 1) {
        sel.value = String(pos[0].id);
    } else if (pos.some(p => String(p.id) === current)) {
        sel.value = current;
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

// Show/hide the Reports "Data" export dropdown (only meaningful once a report
// is on screen). Mirrors the Dockets/Resources pages for consistency.
function showReportDataMenu(show) {
    const wrap = document.getElementById('rpt-data-menu-wrap');
    if (wrap) wrap.style.display = show ? '' : 'none';
}

// Debounced auto-run: the report regenerates as soon as a supplier is picked
// and live-refreshes as the filters change — no Generate button to press.
// _reportRunSeq tags each run so a slower, superseded fetch can't render over a
// newer one (or over a cleared report).
let _reportRunTimer = null;
let _reportRunSeq = 0;
function scheduleReportRun() {
    const supplier = document.getElementById('rpt-supplier').value;
    if (!supplier) {
        // Supplier cleared — cancel any pending/in-flight run, wipe the report
        // and hide its export menu.
        clearTimeout(_reportRunTimer);
        _reportRunSeq++;
        const output = document.getElementById('report-output');
        if (output) output.innerHTML = '';
        showReportDataMenu(false);
        const claimBar = document.getElementById('rpt-claim-bar');
        if (claimBar) claimBar.style.display = 'none';
        return;
    }
    clearTimeout(_reportRunTimer);
    _reportRunTimer = setTimeout(() => runDocketSummary({ silent: true }), 200);
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
    // Re-run with the new mode (date filter vs. docket selection).
    scheduleReportRun();
}

async function onReportSupplierChange() {
    const supplier = document.getElementById('rpt-supplier').value;
    const listEl = document.getElementById('rpt-docket-list');
    if (!supplier || !activeProjectId || !listEl) {
        reportDockets = [];
        if (listEl) listEl.innerHTML = '';
        scheduleReportRun();   // clears the output when the supplier is unset
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
    scheduleReportRun();   // show the full report immediately on supplier select
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
    scheduleReportRun();   // narrow the report to the picked dockets, live
}

function toggleAllDockets(checked) {
    document.querySelectorAll('#rpt-docket-list .docket-chip').forEach(chip => {
        const cb = chip.querySelector('input[type="checkbox"]');
        cb.checked = checked;
        chip.classList.toggle('selected', checked);
    });
    scheduleReportRun();
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

async function runDocketSummary(opts) {
    // Called both from the live auto-run (silent) and any direct trigger.
    const silent = opts && opts.silent;
    if (!activeProjectId) { if (!silent) toast('Select a project first', 'error'); return; }
    const supplier = document.getElementById('rpt-supplier').value;
    if (!supplier) { if (!silent) toast('Select a supplier', 'error'); return; }

    // In docket mode, an empty selection means "all of this supplier's dockets"
    // (the URL builder simply omits docket_ids) — so there's always a full
    // report to start from, which the user then narrows by picking dockets.

    // New report generation — reset the rate-review session state
    editedRateKeys = new Set();
    ratesUpdatedCount = 0;

    const seq = ++_reportRunSeq;
    const url = _buildSummaryUrl('/api/projects/' + activeProjectId + '/docket-summary');
    try {
        const data = await apiFetch(url);
        if (seq !== _reportRunSeq) return;   // a newer run (or a clear) superseded this one
        renderDocketSummary(data);           // toggles the export menu itself (hidden when empty)
    } catch (e) {
        if (!silent) toast('Failed to generate report', 'error');
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
        showReportDataMenu(false);
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
    showReportDataMenu(true);   // a real report is on screen — expose its export menu

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

// Docket IDs currently shown in the grid after column filters. Returns null
// when no filter is active (so export falls back to the whole project).
function visibleDocketIds() {
    if (!docketsGridApi) return null;
    const visible = [];
    docketsGridApi.forEachNodeAfterFilterAndSort(n => { if (n.data) visible.push(n.data.id); });
    let total = 0;
    docketsGridApi.forEachNode(() => total++);
    return (visible.length && visible.length < total) ? visible : null;
}

function exportDocketsXLSX() {
    if (!activeProjectId) return;
    let url = '/api/projects/' + activeProjectId + '/dockets/export-xlsx';
    const ids = visibleDocketIds();
    if (ids) url += '?docket_ids=' + ids.join(',');
    window.open(url, '_blank');
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

function switchBrowseView(viewId) {
    ['browse-list-view', 'browse-viewer-view', 'edit-scan-view'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = id === viewId ? '' : 'none';
    });
}

function showBrowseList() {
    switchBrowseView('browse-list-view');
}

function showBrowseViewer() {
    switchBrowseView('browse-viewer-view');
}

function showEditScan(docketId, filename, hash) {
    switchBrowseView('edit-scan-view');
    const fnEl = document.getElementById('edit-scan-filename');
    if (fnEl) fnEl.textContent = filename || '';
    const fpEl = document.getElementById('edit-scan-fp');
    const fpHash = document.getElementById('edit-scan-hash');
    if (fpEl && fpHash && hash) {
        fpHash.textContent = hash;
        fpEl.style.display = '';
    }

    const viewer = document.getElementById('edit-scan-viewer');
    if (!viewer) return;
    viewer.innerHTML = '<div class="pdf-placeholder"><div style="font-size:24px;opacity:0.4">Loading scan...</div></div>';

    const url = API + '/api/scans/' + docketId;
    fetch(url).then(resp => {
        if (!resp.ok) {
            resp.json().then(j => {
                viewer.innerHTML = '<div class="pdf-placeholder"><div style="font-size:24px;opacity:0.4">&#9888;</div><div>' + esc(j.error || 'Failed to load') + '</div></div>';
                const statusEl = document.getElementById('edit-scan-status');
                if (statusEl) {
                    statusEl.innerHTML = '<span style="color:var(--danger)">' +
                        (resp.status === 409 ? 'Hash mismatch' : 'Error') + '</span>';
                }
            }).catch(() => {
                viewer.innerHTML = '<div class="pdf-placeholder"><div>Failed to load scan</div></div>';
            });
            return;
        }
        const ct = resp.headers.get('content-type') || '';
        resp.blob().then(blob => {
            const objUrl = URL.createObjectURL(blob);
            if (ct.includes('pdf')) {
                viewer.innerHTML = '<object data="' + objUrl + '" type="application/pdf" style="width:100%;height:100%"><p>PDF cannot be displayed. <a href="' + objUrl + '" target="_blank">Open in new tab</a></p></object>';
            } else {
                viewer.innerHTML = '<img src="' + objUrl + '" alt="' + esc(filename || 'scan') + '">';
            }
            const statusEl = document.getElementById('edit-scan-status');
            if (statusEl) statusEl.innerHTML = '<span style="color:var(--success)">&#10003; Verified</span>';
        });
    }).catch(() => {
        viewer.innerHTML = '<div class="pdf-placeholder"><div>Network error</div></div>';
    });
}

async function unassignScan() {
    if (!editingDocket || !editingDocket.id) return;
    if (!confirm('Unassign the scan from this docket?')) return;
    try {
        await apiRequest('PUT', '/api/dockets/' + editingDocket.id, {
            source_hash: null,
            source_filename: null,
            source_filepath: null,
        });
        editingDocket.source_hash = null;
        editingDocket.source_filename = null;
        editingDocket.source_filepath = null;
        // Clear the intended association too, so a subsequent Save doesn't
        // re-attach the scan from stale browse state (the bug being fixed).
        currentScan = { hash: null, filename: null, filepath: null };
        // Drop the just-unassigned file's selection so nothing points at it.
        browseFileIndex = -1;
        document.getElementById('f-dk-number').value = '';
        const fpEl = document.getElementById('docket-fingerprint');
        if (fpEl) fpEl.style.display = 'none';
        showBrowseList();
        toast('Scan unassigned', 'success');
    } catch (e) { /* toasted */ }
}


// Open the OS-native folder picker (served by Flask — it runs locally, so it
// CAN see the real filesystem the browser sandbox hides). Every file comes back
// with its true absolute path, so nothing is typed and the stored path always
// reopens. Falls back to manual entry on a headless/hosted box with no GUI.
async function pickFolder() {
    let res;
    try {
        res = await apiRequest('POST', '/api/pick-folder', {});
    } catch (e) {
        showManualFolderEntry('Folder picker unavailable — type the full path');
        return;
    }
    if (res && res.available === false) {
        showManualFolderEntry(res.error || 'Folder picker unavailable here — type the full path');
        return;
    }
    if (!res || res.cancelled) return;
    await loadFolderFiles(res.folder, res.files);
}

// Manual fallback: the server lists + fingerprints a typed folder path. Still
// yields real absolute paths (the server abspath's it), so no relative-path trap.
async function manualLoadFolder() {
    const input = document.getElementById('browse-folder-path');
    const folder = input ? input.value.trim() : '';
    if (!folder) { toast('Enter a folder path', 'error'); return; }
    try {
        const res = await apiRequest('POST', '/api/list-folder', { path: folder });
        await loadFolderFiles(res.folder, res.files);
    } catch (e) { /* toasted */ }
}

function showManualFolderEntry(msg) {
    const row = document.getElementById('browse-manual-row');
    if (row) row.style.display = '';
    const status = document.getElementById('browse-path-status');
    if (status) {
        status.style.display = '';
        status.className = 'browse-path-status warn';
        status.textContent = msg;
    }
}

// Shared loader for both the native picker and the manual fallback. `files` is
// [{name, path, hash}] straight from the server — no client-side hashing needed.
async function loadFolderFiles(folder, files) {
    if (!files || files.length === 0) {
        toast('No PDF or image files in that folder', 'error');
        return;
    }
    browseFiles = files;
    browseFileIndex = -1;

    const disp = document.getElementById('browse-folder-display');
    if (disp) { disp.textContent = folder; disp.title = folder; }
    const manualRow = document.getElementById('browse-manual-row');
    if (manualRow) manualRow.style.display = 'none';
    const status = document.getElementById('browse-path-status');
    if (status) status.style.display = 'none';
    localStorage.setItem('dctos_folder_path', folder);

    // Flag which scans are already tied to a docket (by fingerprint).
    browseHashes = {};
    files.forEach(f => { browseHashes[f.name] = { hash: f.hash, entered: false }; });
    if (activeProjectId) {
        try {
            const resp = await apiRequest('POST',
                '/api/projects/' + activeProjectId + '/check-hashes',
                { hashes: files.map(f => f.hash) });
            const map = {};
            resp.existing.forEach(e => { map[e.source_hash] = e; });
            files.forEach(f => {
                if (map[f.hash]) browseHashes[f.name] = { hash: f.hash, entered: true, match: map[f.hash] };
            });
        } catch (e) { /* leave all pending */ }
    }

    // Land on the list of un-entered scans — the user picks one to enter.
    renderBrowseFileList();
    showBrowseList();
}

function renderBrowseFileList() {
    const container = document.getElementById('browse-file-list');
    if (!container) return;
    if (browseFiles.length === 0) {
        container.innerHTML = '<div class="pdf-placeholder"><div style="font-size:36px;margin-bottom:8px;opacity:0.4">&#128193;</div><div>Select a folder to see scans</div></div>';
        return;
    }
    // Only un-assigned scans appear in the list. Once a scan's fingerprint is
    // tied to a docket it drops off — keep the original array index on each
    // entry so selectBrowseFile() still resolves the right File object.
    const pending = browseFiles
        .map((f, i) => ({ f, i }))
        .filter(({ f }) => !(browseHashes[f.name] && browseHashes[f.name].entered));
    if (pending.length === 0) {
        container.innerHTML = '<div class="pdf-placeholder"><div style="font-size:36px;margin-bottom:8px;opacity:0.4">&#10003;</div><div>All scans in this folder are entered</div></div>';
        updateBrowseProgress();
        return;
    }
    container.innerHTML = pending.map(({ f, i }) => {
        const active = i === browseFileIndex;
        const cls = 'browse-file-item pending' + (active ? ' active' : '');
        return '<div class="' + cls + '" onclick="selectBrowseFile(' + i + ')" title="' + esc(f.name) + '">' +
            '<span class="browse-file-icon">&#9711;</span>' +
            '<span class="browse-file-name">' + esc(f.name) + '</span>' +
            '</div>';
    }).join('');
    updateBrowseProgress();
}

function updateBrowseProgress() {
    const bar = document.getElementById('browse-progress');
    if (!bar) return;
    if (browseFiles.length === 0) { bar.style.display = 'none'; return; }
    const entered = browseFiles.filter(f => browseHashes[f.name]?.entered).length;
    const total = browseFiles.length;
    bar.style.display = '';
    const textEl = document.getElementById('browse-progress-text');
    if (textEl) textEl.textContent = entered + ' / ' + total + ' entered';
    const fill = document.getElementById('browse-progress-fill');
    if (fill) fill.style.width = (total > 0 ? Math.round(entered / total * 100) : 0) + '%';
}

function selectBrowseFile(index) {
    if (index < 0 || index >= browseFiles.length) return;
    browseFileIndex = index;
    const file = browseFiles[index];
    const info = browseHashes[file.name] || {};
    const hash = info.hash || (typeof info === 'string' ? info : null);

    // This file becomes the scan that Save will store against the docket.
    currentScan = { hash: file.hash, filename: file.name, filepath: file.path };

    // Update viewer toolbar
    const fnEl = document.getElementById('browse-viewer-filename');
    if (fnEl) fnEl.textContent = file.name;
    const ctrEl = document.getElementById('browse-viewer-counter');
    if (ctrEl) {
        const pending = browseFiles.filter(f => !browseHashes[f.name]?.entered).length;
        ctrEl.textContent = (index + 1) + '/' + browseFiles.length + ' (' + pending + ' pending)';
    }

    // Update viewer fingerprint
    const vfpEl = document.getElementById('browse-viewer-fp');
    const vfpHash = document.getElementById('browse-viewer-hash');
    if (vfpEl && vfpHash && hash) {
        vfpHash.textContent = hash;
        vfpEl.style.display = '';
    }

    // Update form fingerprint
    const fpEl = document.getElementById('docket-fingerprint');
    const fpHash = document.getElementById('fp-hash');
    const fpFile = document.getElementById('fp-file');
    if (fpEl && fpHash && hash) {
        fpHash.textContent = hash;
        if (fpFile) fpFile.textContent = file.name;
        fpEl.style.display = '';
    }

    // Render the file in the viewer — served by Flask from its real path (the
    // file lives on disk; we never held a browser File object for it).
    const viewer = document.getElementById('pdf-viewer');
    if (viewer) {
        const url = API + '/api/scan-file?path=' + encodeURIComponent(file.path);
        if (/\.pdf$/i.test(file.name)) {
            viewer.innerHTML = '<object data="' + url + '" type="application/pdf" style="width:100%;height:100%"><p>PDF cannot be displayed. <a href="' + url + '" target="_blank">Open in new tab</a></p></object>';
        } else {
            viewer.innerHTML = '<img src="' + url + '" alt="' + esc(file.name) + '">';
        }
    }

    showBrowseViewer();
    renderBrowseFileList();
}

function browsePrevPending() {
    for (let i = browseFileIndex - 1; i >= 0; i--) {
        const info = browseHashes[browseFiles[i].name];
        if (info && !info.entered) { selectBrowseFile(i); return; }
    }
    for (let i = browseFiles.length - 1; i > browseFileIndex; i--) {
        const info = browseHashes[browseFiles[i].name];
        if (info && !info.entered) { selectBrowseFile(i); return; }
    }
    toast('No more pending files', 'success');
}

function browseNextPending() {
    for (let i = browseFileIndex + 1; i < browseFiles.length; i++) {
        const info = browseHashes[browseFiles[i].name];
        if (info && !info.entered) { selectBrowseFile(i); return; }
    }
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

// --- CSV Export / Import ---

function exportDocketsCSV() {
    if (!activeProjectId) { toast('Select a project first', 'error'); return; }
    let url = '/api/projects/' + activeProjectId + '/dockets/export-csv';
    const ids = visibleDocketIds();
    if (ids) url += '?docket_ids=' + ids.join(',');
    window.open(url, '_blank');
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
            <h4>Dashboard</h4>
            <p>The <strong>Dashboard</strong> pill in the header opens an at-a-glance view of the whole project: headline tiles (total budget, spent, remaining, dockets, suppliers), a <strong>spend-over-time</strong> line against budget, a <strong>cost-by-work-order</strong> donut, <strong>PO drawdown</strong> and <strong>top-supplier</strong> bars, a <strong>claimed-vs-to-claim</strong> split, and a live <strong>cost-code burn-down</strong> — green under 80%, amber to 100%, red over budget.</p>
            <p>Everything is a drill-down: click any bar, slice, or supplier to jump straight to its dockets (the list filters, with a removable chip), or click a tile to open the screen that owns it.</p>
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
                <dt><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd></dt>
                <dd>New <strong>D</strong>ocket</dd>
                <dt><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd></dt>
                <dd>New <strong>P</strong>urchase Order</dd>
                <dt><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>W</kbd></dt>
                <dd>New <strong>W</strong>ork Order</dd>
                <dt><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd></dt>
                <dd>New <strong>C</strong>ost Code</dd>
                <dt><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd></dt>
                <dd>New <strong>R</strong>esource</dd>
                <dt><kbd>Enter</kbd></dt>
                <dd>In a docket's last line (Qty/Unit), add the next line</dd>
                <dt><kbd>Tab</kbd> / <kbd>→</kbd></dt>
                <dd>Accept the supplier autocomplete suggestion</dd>
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
    if (e.key === 'Escape') { closeRateGate(); closeModal(); return; }

    // Quick-create shortcuts. Alt+Shift+<letter> — Ctrl+Shift+R and
    // Ctrl+Shift+W are reserved by the browser (reload / close window), so
    // Alt+Shift keeps one consistent, conflict-free modifier across all five.
    if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const overlayOpen = document.getElementById('modal-overlay').classList.contains('open')
            || document.getElementById('rate-gate-overlay');
        if (overlayOpen) return;  // don't stack dialogs
        const needsProject = () => {
            if (!activeProjectId) { toast('Select a project first', 'error'); return false; }
            return true;
        };
        switch (e.key.toLowerCase()) {
            case 'd': e.preventDefault(); if (needsProject()) openDocketDialog(); break;
            case 'p': e.preventDefault(); if (needsProject()) openPurchaseOrderDialog(); break;
            case 'w': e.preventDefault(); if (needsProject()) openWorkOrderDialog(); break;
            case 'c': e.preventDefault(); if (needsProject()) openCostCodeDialog(); break;
            case 'r': e.preventDefault(); openResourceDialog(); break;  // resources are global
        }
    }
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
