(function startNexCourierAdmin(global) {
  "use strict";

  const canonical = global.NEXCOURIER_DEMO_DATA;
  const data = global.NEXCOURIER_ADMIN_DEMO;
  const premium = global.NEXCOURIER_PREMIUM_DEMO;
  const view = document.querySelector("#appView");
  const sidebar = document.querySelector("#sidebar");
  const globalSearch = document.querySelector("#globalSearch");
  const searchResults = document.querySelector("#searchResults");
  const notificationPanel = document.querySelector("#notificationPanel");
  const modalLayer = document.querySelector("#modalLayer");
  const toast = document.querySelector("#toast");
  const aiQuickPanel = document.querySelector("#aiQuickPanel");

  if (!canonical || !data || !premium || !view) {
    throw new Error("No se pudo iniciar NexCourier Admin Demo.");
  }

  const state = {
    reception: "idle",
    receptionConfirmed: false,
    documentTab: "Pendiente",
    deliveryTab: "pickup",
    shipmentDeparted: false,
    sidebarCollapsed: false,
    expenseTab: "Todos",
    expenses: [],
    expenseEditor: null,
    pendingExpense: null,
    aiQuickOpen: false,
    coworkerPrompt: "",
    aiQuickPrompt: "",
    aiQuickAnswer: "",
    coworkerAnswer: "",
    toastTimer: null,
  };

  function parseExpenseAmount(value) {
    const normalized = String(value || "").replace(/[^0-9]/g, "");
    return Number(normalized || 0);
  }

  function cloneExpense(item) {
    const copy = JSON.parse(JSON.stringify(item));
    copy.entryMode = copy.entryMode || "simple";
    copy.amountValue = Number.isFinite(copy.amountValue) ? copy.amountValue : parseExpenseAmount(copy.amount);
    copy.description = copy.description || copy.notes || "Gasto registrado para esta demostración.";
    copy.lines = (copy.lines || []).map(function cloneLine(line, index) {
      const quantity = Math.max(0, Number(line.quantity) || 0);
      const unitPrice = Math.max(0, Number(line.unitPrice) || 0);
      return { id: line.id || "LINE-" + (index + 1), description: line.description || "", quantity: quantity, unitPrice: unitPrice, subtotal: quantity * unitPrice };
    });
    copy.relationship = copy.relationship || (copy.shipmentId ? { type: "Shipment", resourceId: copy.shipmentId, label: "Miami → Asunción" } : copy.employeeId ? { type: "Empleado", resourceId: copy.employeeId, label: copy.employeeId === "EMP-COURIER-001" ? "Operador Courier Demo" : "Operador Aduana Demo" } : { type: "Ninguno", resourceId: "", label: "" });
    copy.receiptDocument = copy.receiptDocument || null;
    copy.history = copy.history || [{ date: copy.date + " · 10:00", title: "Gasto creado", detail: copy.responsible + " · Demo" }];
    return copy;
  }

  state.expenses = premium.expenses.map(cloneExpense);

  const titles = {
    dashboard: "Dashboard", reception: "Recepción", packages: "Paquetes",
    package: "Detalle de paquete", unidentified: "No identificados", documents: "Documentos",
    warehouse: "Almacén", shipments: "Envíos", shipment: "Detalle de envío",
    arrivals: "Llegadas Paraguay", customers: "Clientes", customer: "Detalle de cliente",
    support: "Soporte", deliveries: "Retiros / Delivery", payments: "Pagos",
    billing: "Facturación", team: "Equipo", audit: "Auditoría", settings: "Configuración",
    finance: "Finanzas", expenses: "Gastos", expense: "Detalle de gasto",
    receipts: "Comprobantes", reports: "Reportes", personnel: "Personal",
    employee: "Detalle de empleado", attendance: "Asistencia", schedules: "Horarios",
    overtime: "Horas extra", "personnel-payments": "Pagos personal", "ai-coworker": "AI Coworker",
  };

  const premiumPages = ["finance", "expenses", "expense", "receipts", "reports", "personnel", "employee", "attendance", "schedules", "overtime", "personnel-payments", "ai-coworker"];

  function activeMode() {
    return new URLSearchParams(global.location.search).get("mode") === "premium" ? "premium" : "standard";
  }

  function isPremium() {
    return activeMode() === "premium";
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function replace(character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character];
    });
  }

  function icon(name) {
    return '<svg aria-hidden="true"><use href="#i-' + esc(name) + '"></use></svg>';
  }

  function routeHref(page, id) {
    const params = new URLSearchParams({ page: page, mode: activeMode() });
    if (id) params.set("id", id);
    return "?" + params.toString();
  }

  function routeButton(label, page, id, className) {
    return '<button class="button ' + (className || "button--quiet") + '" type="button" data-route="' + esc(page) + '"' + (id ? ' data-id="' + esc(id) + '"' : "") + '>' + esc(label) + "</button>";
  }

  function badgeTone(status) {
    const value = String(status).toLowerCase();
    if (/entregado|confirmado|aprobado|sin incidencias|activo|disponible|recibido/.test(value)) return "success";
    if (/pendiente|requiere|revisión|preparando|por coordinar/.test(value)) return "warning";
    if (/no identificado|retenido|bloque|faltante/.test(value)) return "critical";
    if (/tránsito|camino|paraguay|despacho/.test(value)) return "info";
    return "neutral";
  }

  function badge(label, tone) {
    return '<span class="badge badge--' + esc(tone || badgeTone(label)) + '">' + esc(label) + "</span>";
  }

  function pageHead(title, subtitle, actions, eyebrow) {
    return '<header class="page-head"><div>' + (eyebrow ? '<p class="breadcrumb">' + esc(eyebrow) + "</p>" : "") + "<h1>" + esc(title) + "</h1><p>" + esc(subtitle) + '</p></div><div class="page-actions">' + (actions || "") + "</div></header>";
  }

  function emptyState(title, message) {
    return '<div class="empty-state">' + icon("search") + "<strong>" + esc(title) + "</strong><span>" + esc(message) + "</span></div>";
  }

  function renderStandardDashboard() {
    const metricVisuals = [
      ["blue", "box"], ["critical", "alert"], ["warning", "file"], ["blue", "plane"],
      ["slate", "arrival"], ["success", "check"], ["warning", "truck"],
    ];
    const metricCards = data.metrics.map(function metricCard(metric, index) {
      const visual = metricVisuals[index] || ["slate", "box"];
      return '<button class="metric-card" type="button" data-route="' + esc(metric.page) + '" data-accent="' + esc(visual[0]) + '"><span class="metric-accent" aria-hidden="true"></span><span class="metric-copy"><span class="metric-label">' + esc(metric.label) + '</span><strong>' + esc(metric.value) + '</strong></span><span class="metric-icon" aria-hidden="true">' + icon(visual[1]) + '</span><span class="metric-trend" data-trend="' + esc(metric.trend || "neutral") + '">' + esc(metric.note) + "</span></button>";
    }).join("");
    const priorities = data.priorities.map(function priority(item, index) {
      return '<button class="priority-row" type="button" data-route="' + esc(item.page) + '"' + (item.id ? ' data-id="' + esc(item.id) + '"' : "") + ' data-tone="' + esc(item.tone) + '"><span class="priority-index">' + (index + 1) + '</span><span class="priority-copy"><strong>' + esc(item.title) + "</strong><small>" + esc(item.detail) + '</small></span><span class="row-chevron">' + icon("chevron") + "</span></button>";
    }).join("");
    const activity = data.recentActivity.map(function activityRow(item) {
      return '<button class="activity-row" type="button" data-route="' + esc(item.page) + '"' + (item.id ? ' data-id="' + esc(item.id) + '"' : "") + '><time>' + esc(item.time) + "</time><span><strong>" + esc(item.subject) + " · " + esc(item.title) + "</strong><span>" + esc(item.detail) + "</span></span></button>";
    }).join("");
    const shipment = data.shipments[0];
    const weeklyBars = [["Lun", 52], ["Mar", 68], ["Mié", 61], ["Jue", 78], ["Vie", 82], ["Sáb", 44], ["Hoy", 71]].map(function weeklyBar(item) {
      return '<span class="trend-column' + (item[0] === "Hoy" ? " is-current" : "") + '"><span class="bar-slot"><i style="height:' + esc(item[1]) + '%"><b>' + esc(item[1]) + '</b></i></span><small>' + esc(item[0]) + "</small></span>";
    }).join("");
    const queueRows = [["Listos para retirar", 47, 58, "success", "deliveries"], ["Por despachar", 63, 78, "info", "shipments"], ["Delivery pendiente", 12, 22, "warning", "deliveries"], ["Excepciones abiertas", 11, 18, "critical", "unidentified"]].map(function queueRow(item) {
      return '<button class="queue-row" type="button" data-route="' + esc(item[4]) + '"><span><strong>' + esc(item[0]) + '</strong><small>' + esc(item[1]) + ' paquetes</small></span><span class="queue-track" data-tone="' + esc(item[3]) + '"><i style="width:' + esc(item[2]) + '%"></i></span><b>' + esc(item[2]) + "%</b></button>";
    }).join("");
    return pageHead("Buenos días", "Panorama operativo · Centro de recepción internacional", routeButton("Registrar recepción", "reception", null, "button--primary")) +
      '<section class="operations-pulse"><div><span class="pulse-kicker"><i></i>Operación en curso</span><h2>184 paquetes preparados para el próximo envío</h2><p>174 están listos y 10 requieren revisión antes del cierre de hoy.</p></div><div class="pulse-summary"><span><small>Preparación</small><strong>94.6%</strong></span><span><small>Salida prevista</small><strong>21:30</strong></span></div>' + routeButton("Revisar envío", "shipment", shipment.shipmentId, "button--navy") + '</section>' +
      '<section class="metric-grid" aria-label="Indicadores operativos">' + metricCards + "</section>" +
      '<section class="analytics-grid" aria-label="Analítica operativa"><article class="panel trend-panel"><div class="panel-head"><div><h2>Flujo de recepción</h2><p>Paquetes procesados durante los últimos siete días.</p></div><span class="analytics-total"><strong>456</strong><small>esta semana</small></span></div><div class="chart-shell"><div class="chart-scale" aria-hidden="true"><span>100</span><span>50</span><span>0</span></div><div class="trend-chart" role="img" aria-label="Paquetes procesados: lunes 52, martes 68, miércoles 61, jueves 78, viernes 82, sábado 44 y hoy 71">' + weeklyBars + '</div></div><div class="chart-foot"><span><i></i>Volumen procesado</span><strong>Hoy: 71 paquetes</strong></div></article><div class="analytics-side"><article class="panel queue-panel"><div class="panel-head"><div><h2>Distribución de colas</h2><p>Capacidad operativa utilizada por estado.</p></div></div><div class="queue-list">' + queueRows + '</div></article><article class="growth-card"><div><span class="growth-label">Crecimiento de clientes</span><strong>+8.9%</strong><small>vs. mes anterior · Datos demo</small></div><div class="growth-progress" role="img" aria-label="65 por ciento de avance del objetivo demo"><span>65<small>%</small></span></div><p>Avance del objetivo demo</p></article></div></section>' +
      '<section class="dashboard-grid"><div class="panel priority-panel"><div class="panel-head"><div><h2>Prioridades</h2><p>Trabajo que requiere atención hoy.</p></div><span class="panel-count">3 abiertas</span></div><div class="priority-list">' + priorities + '</div></div><aside class="shipment-spotlight"><span class="spotlight-label">Próximo envío</span><h2>' + esc(shipment.shipmentId) + '</h2><p class="spotlight-route"><span>Miami</span><i></i><span>Asunción</span></p><div class="spotlight-stats"><span><small>Paquetes</small><strong>' + esc(shipment.packageCount) + '</strong></span><span><small>Peso</small><strong>' + esc(shipment.grossWeight) + '</strong></span><span><small>Salida</small><strong>18 Sep · 21:30</strong></span></div><div class="spotlight-readiness"><span><strong>174 listos</strong><small>10 por revisar</small></span><div><i style="width:94.6%"></i></div></div>' + routeButton("Ver envío", "shipment", shipment.shipmentId, "button--primary") + '</aside><div class="panel activity-panel"><div class="panel-head"><div><h2>Actividad reciente</h2><p>Últimos movimientos en la operación.</p></div><button class="text-link" type="button" data-route="audit">Ver auditoría</button></div><div class="activity-list">' + activity + "</div></div></section>";
  }

  function renderDashboard() {
    return renderStandardDashboard() + (isPremium() ? renderPremiumDashboardAdditions() : "");
  }

  function renderPremiumDashboardAdditions() {
    return '<section class="premium-dashboard-stack"><article class="panel ai-brief"><div class="premium-section-mark"><span>✦</span></div><div class="ai-brief-copy"><div class="panel-head"><div><span class="premium-kicker">AI Daily Brief</span><h2>Hoy hay 3 áreas que requieren atención.</h2><p>Resumen determinístico preparado con datos de esta demostración.</p></div>' + badge("Premium", "warning") + '</div><ol class="brief-list"><li><b>1</b><span><strong>Shipment de hoy</strong><small>10 casos requieren revisión</small></span></li><li><b>2</b><span><strong>Paquetes sin identificar</strong><small>4 casos abiertos</small></span></li><li><b>3</b><span><strong>Documentos</strong><small>7 pendientes</small></span></li></ol><div class="card-actions"><button class="button button--navy" type="button" data-route="ai-coworker">Abrir en Coworker</button><button class="button button--quiet" type="button" data-action="toggle-ai-quick">Ver detalle</button></div></div></article>' +
      '<article class="panel command-center"><div class="panel-head"><div><span class="premium-kicker">Centro de control</span><h2>Gestión en una sola vista</h2><p>Operación, finanzas, personal y excepciones.</p></div><span class="demo-label">Datos demo</span></div><div class="command-grid"><button type="button" data-route="shipments"><small>Operación</small><strong>94.6%</strong><span>preparada</span></button><button type="button" data-route="finance"><small>Gastos mes</small><strong>DEMO</strong><span>total simulado</span></button><button type="button" data-route="attendance"><small>Personal hoy</small><strong>17 / 18</strong><span>presentes</span></button><button type="button" data-route="overtime"><small>Horas extra</small><strong>6.5 h</strong><span>pendientes</span></button><button type="button" data-route="expenses"><small>Aeropuerto</small><strong>DEMO</strong><span>gasto mensual</span></button><button type="button" data-route="unidentified"><small>Incidencias</small><strong>11</strong><span>requieren atención</span></button></div><div class="card-actions"><button class="button button--quiet" type="button" data-route="finance">Ver finanzas</button><button class="button button--quiet" type="button" data-route="personnel">Ver personal</button><button class="button button--primary" type="button" data-route="ai-coworker">Abrir AI Coworker</button></div></article></section>';
  }

  function financeMetricCards() {
    return premium.finance.cards.map(function financeCard(item, index) {
      return '<article class="management-metric" data-tone="' + (index === 4 ? "positive" : "neutral") + '"><span>' + esc(item[0]) + '</span><strong>' + esc(item[1]) + '</strong><small>' + esc(item[2]) + '</small></article>';
    }).join("");
  }

  function renderFinance() {
    const familyCards = [
      ["Operativos", "Courier, aeropuerto, carga, warehouse y delivery.", "₲ 74.850.000 demo", "expenses"],
      ["Administrativos", "Alquiler, internet, software, oficina y gerencia.", "₲ 23.480.000 demo", "expenses"],
      ["Personal", "Horas extra, bonos y reembolsos con valores protegidos.", "Valores protegidos", "personnel-payments"],
    ].map(function family(item) {
      return '<article class="panel expense-family"><span class="premium-kicker">' + esc(item[0]) + '</span><h3>' + esc(item[2]) + '</h3><p>' + esc(item[1]) + '</p><button class="button button--small button--quiet" type="button" data-route="' + esc(item[3]) + '">Ver detalle</button></article>';
    }).join("");
    return pageHead("Finanzas", "Control de ingresos, gastos y costos operativos.", badge("Demo Data", "warning")) + '<section class="management-metrics">' + financeMetricCards() + '</section><section class="expense-families">' + familyCards + '</section><section class="panel"><div class="panel-head"><div><h2>Centros de costo</h2><p>Estructura preparada para análisis y reportes Premium.</p></div><button class="button button--small button--quiet" type="button" data-route="reports">Ver reportes</button></div><div class="cost-center-list">' + premium.finance.costCenters.map(function center(item) { return '<span>' + esc(item) + '</span>'; }).join("") + '</div></section>';
  }

  function formatExpenseMoney(value, currency) {
    const amount = Math.max(0, Number(value) || 0);
    const formatted = new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(amount);
    return currency === "USD" ? "USD " + formatted : "₲ " + formatted;
  }

  function expenseDisplayAmount(item) {
    return /protegido/i.test(item.amount || "") && !item.amountValue ? item.amount : formatExpenseMoney(expenseTotal(item), item.currency);
  }

  function expenseTotal(item) {
    if (item.entryMode === "itemized") return item.lines.reduce(function sum(total, line) { return total + (Math.max(0, Number(line.quantity) || 0) * Math.max(0, Number(line.unitPrice) || 0)); }, 0);
    return Math.max(0, Number(item.amountValue) || 0);
  }

  function syncExpenseAmount(item) {
    item.lines.forEach(function syncLine(line) { line.subtotal = Math.max(0, Number(line.quantity) || 0) * Math.max(0, Number(line.unitPrice) || 0); });
    item.amountValue = expenseTotal(item);
    item.amount = formatExpenseMoney(item.amountValue, item.currency);
    return item;
  }

  function findExpense(expenseId) {
    return state.expenses.find(function matchExpense(item) { return item.expenseId === expenseId; });
  }

  function expenseRows() {
    const filtered = state.expenseTab === "Todos" ? state.expenses : state.expenses.filter(function filterExpense(item) { return item.type === state.expenseTab; });
    return filtered.map(function expenseRow(item) {
      return '<tr><td>' + esc(item.date) + '</td><td><span class="cell-title">' + esc(item.category) + '</span><span class="cell-subtitle">' + esc(item.expenseId) + '</span></td><td>' + badge(item.type, item.type === "Operativo" ? "info" : item.type === "Personal" ? "warning" : "neutral") + '</td><td>' + esc(item.costCenter) + '</td><td>' + esc(item.provider) + '</td><td><strong>' + esc(expenseDisplayAmount(item)) + '</strong><span class="cell-subtitle">' + esc(item.entryMode === "itemized" ? item.lines.length + " conceptos" : "Gasto simple") + '</span></td><td>' + esc(item.currency) + '</td><td>' + esc(item.responsible) + '</td><td>' + esc(item.receiptDocument ? "Adjunto demo" : item.receipt) + '</td><td>' + badge(item.approvalStatus) + '</td><td><button class="button button--small button--quiet" type="button" data-route="expense" data-id="' + esc(item.expenseId) + '">Ver</button></td></tr>';
    }).join("");
  }

  function renderExpenses() {
    const tabs = ["Todos", "Operativo", "Administrativo", "Personal"].map(function tab(item) {
      return '<button class="tab' + (state.expenseTab === item ? " is-active" : "") + '" type="button" data-action="expense-tab" data-tab="' + esc(item) + '">' + esc(item === "Operativo" ? "Operativos" : item === "Administrativo" ? "Administrativos" : item) + '</button>';
    }).join("");
    const actions = '<div class="page-action-group"><button class="button button--quiet" type="button" data-action="expense-excel" data-kind="importar">Importar Excel</button><button class="button button--quiet" type="button" data-action="expense-excel" data-kind="exportar">Exportar Excel</button><button class="button button--primary" type="button" data-action="expense-create">Registrar gasto demo</button></div>';
    return pageHead("Gastos", "Centro de gastos operativos, administrativos y de personal.", actions) + '<section class="panel"><div class="tabs">' + tabs + '</div><div class="toolbar premium-toolbar"><button class="button button--quiet" type="button" data-action="filter-demo">Fecha</button><select aria-label="Categoría"><option>Categoría: todas</option></select><select aria-label="Centro de costo"><option>Centro de costo: todos</option></select><select aria-label="Ubicación"><option>Ubicación: todas</option></select><select aria-label="Proveedor"><option>Proveedor: todos</option></select><select aria-label="Responsable"><option>Responsable: todos</option></select><select aria-label="Estado"><option>Estado: todos</option></select></div><div class="table-wrap"><table class="data-table expense-table"><thead><tr><th>Fecha</th><th>Categoría</th><th>Tipo</th><th>Centro de costo</th><th>Proveedor</th><th>Monto</th><th>Moneda</th><th>Responsable</th><th>Comprobante</th><th>Estado</th><th>Acción</th></tr></thead><tbody>' + expenseRows() + '</tbody></table></div></section>';
  }

  function expenseBreakdown(item) {
    if (item.entryMode !== "itemized") return '<div class="simple-expense-amount"><span>Monto</span><strong>' + esc(expenseDisplayAmount(item)) + '</strong><p>' + esc(item.description) + '</p></div>';
    return '<div class="expense-detail-lines">' + item.lines.map(function detailLine(line) {
      return '<div class="expense-detail-line"><div><strong>' + esc(line.description) + '</strong><span>Cantidad ' + esc(line.quantity) + ' · Unitario ' + esc(formatExpenseMoney(line.unitPrice, item.currency)) + '</span></div><b>' + esc(formatExpenseMoney(line.quantity * line.unitPrice, item.currency)) + '</b></div>';
    }).join("") + '<div class="expense-detail-total"><span>Total</span><strong>' + esc(formatExpenseMoney(expenseTotal(item), item.currency)) + '</strong></div></div>';
  }

  function expenseRelationshipCard(item) {
    const relationship = item.relationship || { type: "Ninguno" };
    if (relationship.type === "Ninguno") return '<div class="empty-inline">Este gasto no tiene una relación operativa.</div>';
    const route = relationship.type === "Shipment" ? "shipment" : relationship.type === "Empleado" ? "employee" : "";
    return '<div class="relationship-card"><span>' + badge(relationship.type, "info") + '</span><div><strong>' + esc(relationship.resourceId) + '</strong><small>' + esc(relationship.label) + '</small></div>' + (route ? '<button class="button button--small button--quiet" type="button" data-route="' + route + '" data-id="' + esc(relationship.resourceId) + '">Ver ' + esc(relationship.type.toLowerCase()) + '</button>' : "") + '</div>';
  }

  function renderExpenseDetail(params) {
    const expenseItem = findExpense(params.get("id") || "EXP-DEMO-001");
    if (!expenseItem) return pageHead("Gasto no encontrado", "No existe ese registro demo.", routeButton("Volver", "expenses"));
    const fields = [["Tipo", expenseItem.type], ["Categoría", expenseItem.category], ["Total", expenseDisplayAmount(expenseItem)], ["Moneda", expenseItem.currency], ["Fecha", expenseItem.date], ["Centro de costo", expenseItem.costCenter], ["Proveedor", expenseItem.provider], ["Responsable", expenseItem.responsible], ["Forma de pago", expenseItem.paymentMethod], ["Estado", expenseItem.approvalStatus]];
    const receipt = expenseItem.receiptDocument ? '<div class="receipt-card"><span class="receipt-kind">' + esc(expenseItem.receiptDocument.kind) + '</span><div><strong>' + esc(expenseItem.receiptDocument.name) + '</strong><small>✓ Adjuntado — Demo' + (expenseItem.receiptDocument.number ? ' · ' + esc(expenseItem.receiptDocument.number) : "") + '</small></div><button class="button button--small button--quiet" type="button" data-action="receipt-demo" data-id="' + esc(expenseItem.expenseId) + '">Ver demo</button></div>' : '<div class="empty-inline">Sin comprobante demo adjunto.</div>';
    const history = expenseItem.history.map(function historyItem(item) { return '<li><time>' + esc(item.date) + '</time><i></i><span><strong>' + esc(item.title) + '</strong><span>' + esc(item.detail) + '</span></span></li>'; }).join("");
    const actions = '<div class="page-action-group"><button class="button button--quiet" type="button" data-action="expense-edit" data-id="' + esc(expenseItem.expenseId) + '">Editar</button><button class="button button--primary" type="button" data-action="expense-approve" data-id="' + esc(expenseItem.expenseId) + '"' + (expenseItem.approvalStatus === "Aprobado demo" ? " disabled" : "") + '>' + (expenseItem.approvalStatus === "Aprobado demo" ? "Aprobado demo" : "Aprobar demo") + '</button><button class="button button--quiet" type="button" data-action="expense-more">Más</button></div>';
    return pageHead(expenseItem.category, expenseItem.date + " · " + expenseItem.provider, actions, "Gastos / " + expenseItem.expenseId) +
      '<section class="expense-detail-hero"><div><span>' + badge(expenseItem.type, "info") + badge(expenseItem.approvalStatus) + '</span><strong>' + esc(expenseDisplayAmount(expenseItem)) + '</strong><small>' + esc(expenseItem.entryMode === "itemized" ? expenseItem.lines.length + " conceptos conciliados" : "Gasto simple") + '</small></div><span class="demo-label">Demo Data</span></section>' +
      '<section class="expense-detail-layout"><div class="detail-main"><article class="panel"><div class="panel-head"><div><h2>Resumen</h2><p>Datos principales del registro.</p></div></div><div class="panel-body"><div class="summary-grid expense-summary-grid">' + fields.map(function field(item) { return '<div class="summary-item"><small>' + esc(item[0]) + '</small><strong>' + esc(item[1]) + '</strong></div>'; }).join("") + '</div></div></article><article class="panel"><div class="panel-head"><div><h2>' + (expenseItem.entryMode === "itemized" ? "Desglose" : "Monto") + '</h2><p>' + (expenseItem.entryMode === "itemized" ? "El total se deriva de los conceptos." : "Este registro no requiere conceptos separados.") + '</p></div></div><div class="panel-body">' + expenseBreakdown(expenseItem) + '</div></article><article class="panel"><div class="panel-head"><div><h2>Comprobantes</h2><p>Documento simulado; no existe almacenamiento real.</p></div></div><div class="panel-body">' + receipt + '</div></article></div><aside class="detail-side"><article class="panel"><div class="panel-head"><div><h2>Relación operativa</h2><p>Contexto para análisis de costos.</p></div></div><div class="panel-body">' + expenseRelationshipCard(expenseItem) + '</div></article><article class="panel"><div class="panel-head"><div><h2>Notas</h2></div></div><div class="panel-body"><p class="expense-notes">' + esc(expenseItem.notes || expenseItem.description || "Sin notas internas.") + '</p></div></article><article class="panel"><div class="panel-head"><div><h2>Historial</h2><p>Auditoría local de esta sesión.</p></div></div><div class="panel-body"><ol class="timeline expense-history">' + history + '</ol></div></article></aside></section>';
  }

  function expenseOptions(items, selected) {
    return items.map(function option(item) { return '<option value="' + esc(item) + '"' + (item === selected ? " selected" : "") + '>' + esc(item) + '</option>'; }).join("");
  }

  function newExpenseDraft() {
    return {
      expenseId: "", entryMode: "simple", type: "Operativo", category: "Aeropuerto / Handling",
      costCenter: "Aeropuerto", date: "16 Sep 2026", provider: "Proveedor Handling Demo",
      currency: "PYG", paymentMethod: "Transferencia", responsible: "Supervisor Courier Demo",
      approvalStatus: "Pendiente", amountValue: 450000, description: "Internet oficina — Septiembre.",
      notes: "", lines: [], receiptDocument: null,
      relationship: { type: "Ninguno", resourceId: "", label: "" }, history: [],
    };
  }

  function relationshipResources(type) {
    if (type === "Shipment") return [["NXS-MIA-ASU-260918-A", "Miami → Asunción"], ["NXS-MIA-ASU-260921-B", "Miami → Asunción · Demo"]];
    if (type === "Empleado") return [["EMP-COURIER-001", "Operador Courier Demo"], ["EMP-CUSTOMS-001", "Operador Aduana Demo"]];
    if (type === "Aeropuerto / Centro de costo") return [["Aeropuerto", "Centro de costo Aeropuerto"], ["Centro internacional", "Centro internacional — Demo"]];
    if (type === "Warehouse") return [["WH-MIA-DEMO", "Warehouse Miami — Demo"]];
    if (type === "Sucursal") return [["SUC-ASU-DEMO", "Sucursal Asunción — Demo"]];
    if (type === "Delivery") return [["DEL-DEMO-018", "Ruta de delivery — Demo"]];
    if (type === "Proveedor") return [["PROV-HANDLING-DEMO", "Proveedor Handling Demo"]];
    return [];
  }

  function renderExpenseEditorLines(editor) {
    if (!editor.lines.length) return '<div class="empty-inline expense-lines-empty">Agregá al menos un concepto para calcular el total.</div>';
    return editor.lines.map(function editorLine(line, index) {
      return '<div class="expense-line-editor" data-line-id="' + esc(line.id) + '"><label><span>Concepto</span><input data-line-field="description" data-line-index="' + index + '" value="' + esc(line.description) + '" placeholder="Ej. Handling"></label><label><span>Cantidad</span><input type="number" min="0.01" step="0.01" data-line-field="quantity" data-line-index="' + index + '" value="' + esc(line.quantity) + '"></label><label><span>Precio unitario</span><input type="number" min="0" step="1" data-line-field="unitPrice" data-line-index="' + index + '" value="' + esc(line.unitPrice) + '"></label><div class="line-subtotal"><span>Subtotal</span><strong data-line-subtotal="' + index + '">' + esc(formatExpenseMoney(line.quantity * line.unitPrice, editor.currency)) + '</strong></div><button class="line-remove" type="button" data-action="expense-remove-line" data-line-index="' + index + '" aria-label="Eliminar ' + esc(line.description || "concepto") + '">' + icon("x") + '<span>Eliminar</span></button></div>';
    }).join("");
  }

  function renderExpenseDrawer() {
    const editor = state.expenseEditor;
    if (!editor) return;
    const isEdit = Boolean(editor.expenseId);
    const categories = ["Aeropuerto / Handling", "Transporte aeropuerto", "Warehouse", "Carga aérea", "Documentación operativa", "Courier Partner", "Delivery", "Packaging", "Shipment incident", "Alquiler", "Electricidad", "Internet", "Software", "Oficina", "Combustible", "Marketing", "Mantenimiento", "Viaje de gerencia", "Representación", "Salario", "Horas extra", "Bono", "Adelanto", "Reembolso", "Otros"];
    const relationshipTypes = ["Ninguno", "Shipment", "Empleado", "Aeropuerto / Centro de costo", "Warehouse", "Sucursal", "Delivery", "Proveedor"];
    const resources = relationshipResources(editor.relationship.type);
    const resourceOptions = resources.map(function resourceOption(item) { return '<option value="' + esc(item[0]) + '"' + (item[0] === editor.relationship.resourceId ? " selected" : "") + '>' + esc(item[0] + " · " + item[1]) + '</option>'; }).join("");
    const amountSection = editor.entryMode === "simple" ? '<section class="expense-form-section"><div class="expense-section-head"><div><h3>Monto</h3><p>Un único importe, sin desglose requerido.</p></div></div><label class="field field--wide"><span>Monto total</span><div class="money-input"><b>' + (editor.currency === "USD" ? "USD" : "₲") + '</b><input type="number" min="0" step="1" data-expense-field="amountValue" value="' + esc(editor.amountValue) + '" required></div></label><label class="field field--wide"><span>Descripción</span><input data-expense-field="description" value="' + esc(editor.description) + '" placeholder="Ej. Internet oficina — Septiembre"></label></section>' : '<section class="expense-form-section"><div class="expense-section-head"><div><h3>Desglose del gasto</h3><p>Conceptos controlados; el total se calcula automáticamente.</p></div><span class="demo-label">' + editor.lines.length + ' conceptos</span></div><div class="expense-line-head" aria-hidden="true"><span>Concepto</span><span>Cant.</span><span>Precio unitario</span><span>Subtotal</span><span>Acción</span></div><div class="expense-lines" id="expenseLines">' + renderExpenseEditorLines(editor) + '</div><button class="button button--quiet button--small add-expense-line" type="button" data-action="expense-add-line">+ Agregar concepto</button><div class="expense-editor-totals"><span><small>Subtotal</small><strong data-expense-subtotal>' + esc(formatExpenseMoney(expenseTotal(editor), editor.currency)) + '</strong></span><span><small>Otros ajustes</small><strong>' + esc(formatExpenseMoney(0, editor.currency)) + '</strong></span><span class="is-total"><small>Total</small><strong data-expense-total>' + esc(formatExpenseMoney(expenseTotal(editor), editor.currency)) + '</strong></span></div></section>';
    const receipt = editor.receiptDocument ? '<div class="receipt-card receipt-card--editor"><span class="receipt-kind">' + esc(editor.receiptDocument.kind) + '</span><div><strong>' + esc(editor.receiptDocument.name) + '</strong><small>✓ Adjuntado — Demo</small></div><button class="button button--small button--quiet" type="button" data-action="expense-receipt-view">Ver demo</button><button class="button button--small button--quiet" type="button" data-action="expense-receipt-remove">Quitar</button></div><div class="expense-form-grid receipt-metadata"><label class="field"><span>Número de comprobante</span><input data-receipt-field="number" value="' + esc(editor.receiptDocument.number || "") + '"></label><label class="field"><span>Fecha de comprobante</span><input data-receipt-field="date" value="' + esc(editor.receiptDocument.date || editor.date) + '"></label></div>' : '<button class="receipt-drop" type="button" data-action="expense-receipt-attach">' + icon("file") + '<span><strong>+ Adjuntar comprobante</strong><small>Simulación local · PDF, JPG o PNG</small></span></button>';
    modalLayer.classList.add("is-expense-drawer");
    modalLayer.innerHTML = '<div class="modal-backdrop" data-action="cancel-expense-editor"></div><section class="modal expense-drawer" role="dialog" aria-modal="true" aria-labelledby="expenseEditorTitle"><form id="expenseEditorForm"><header class="expense-drawer-head"><div><span class="premium-kicker">' + (isEdit ? "Editar registro" : "Nuevo registro") + '</span><h2 id="expenseEditorTitle">' + (isEdit ? "Editar gasto" : "Registrar gasto") + '</h2><p>' + (isEdit ? esc(editor.expenseId) : "Crear un gasto operativo, administrativo o de personal.") + '</p></div><button class="modal-close" type="button" data-action="cancel-expense-editor" aria-label="Cerrar">' + icon("x") + '</button></header><div class="expense-drawer-body"><section class="expense-mode-picker"><span>Tipo de registro</span><div><button type="button" data-action="expense-entry-mode" data-mode="simple" class="' + (editor.entryMode === "simple" ? "is-active" : "") + '">Gasto simple</button><button type="button" data-action="expense-entry-mode" data-mode="itemized" class="' + (editor.entryMode === "itemized" ? "is-active" : "") + '">Gasto con desglose</button></div></section><section class="expense-form-section"><div class="expense-section-head"><div><h3>Información general</h3><p>Clasificación y responsable del gasto.</p></div></div><div class="expense-form-grid"><label class="field"><span>Tipo</span><select data-expense-field="type">' + expenseOptions(["Operativo", "Administrativo", "Personal"], editor.type) + '</select></label><label class="field"><span>Categoría</span><select data-expense-field="category">' + expenseOptions(categories, editor.category) + '</select></label><label class="field"><span>Centro de costo</span><select data-expense-field="costCenter">' + expenseOptions(premium.finance.costCenters, editor.costCenter) + '</select></label><label class="field"><span>Fecha</span><input data-expense-field="date" value="' + esc(editor.date) + '" required></label><label class="field field--wide"><span>Proveedor</span><input data-expense-field="provider" value="' + esc(editor.provider) + '" required></label><label class="field"><span>Moneda</span><select data-expense-field="currency">' + expenseOptions(["PYG", "USD"], editor.currency) + '</select></label><label class="field"><span>Forma de pago</span><select data-expense-field="paymentMethod">' + expenseOptions(["Transferencia", "Tarjeta", "Efectivo demo", "Crédito proveedor"], editor.paymentMethod) + '</select></label><label class="field"><span>Responsable</span><select data-expense-field="responsible">' + expenseOptions(["Supervisor Courier Demo", "Supervisor Aduana Demo", "Administración Demo", "RR. HH. Demo", "Gerencia Demo"], editor.responsible) + '</select></label><label class="field"><span>Estado</span><select data-expense-field="approvalStatus">' + expenseOptions(["Pendiente", "En revisión", "Aprobado demo", "Rechazado demo"], editor.approvalStatus) + '</select></label></div></section>' + amountSection + '<section class="expense-form-section"><div class="expense-section-head"><div><h3>Relación operativa</h3><p>Asociación opcional para reportes futuros.</p></div></div><div class="expense-form-grid"><label class="field"><span>Relacionado con</span><select data-relationship-field="type">' + expenseOptions(relationshipTypes, editor.relationship.type) + '</select></label>' + (editor.relationship.type !== "Ninguno" ? '<label class="field"><span>Recurso</span><select data-relationship-field="resourceId">' + resourceOptions + '</select></label>' : "") + '</div>' + (editor.relationship.type !== "Ninguno" && editor.relationship.resourceId ? '<div class="relationship-preview"><strong>' + esc(editor.relationship.resourceId) + '</strong><span>' + esc(editor.relationship.label) + '</span></div>' : "") + '</section><section class="expense-form-section"><div class="expense-section-head"><div><h3>Comprobante</h3><p>Adjunto simulado; no se carga ningún archivo a la red.</p></div></div>' + receipt + '</section><section class="expense-form-section"><div class="expense-section-head"><div><h3>Notas</h3></div></div><label class="field field--wide"><span>Notas internas</span><textarea data-expense-field="notes" placeholder="Notas internas sobre este gasto...">' + esc(editor.notes) + '</textarea></label></section></div><footer class="expense-drawer-footer"><button class="button button--quiet" type="button" data-action="cancel-expense-editor">Cancelar</button><div><span>Total calculado</span><strong data-expense-footer-total>' + esc(formatExpenseMoney(expenseTotal(editor), editor.currency)) + '</strong></div><button class="button button--primary" type="submit">' + (isEdit ? "Revisar cambios" : "Registrar gasto demo") + '</button></footer></form></section>';
    modalLayer.hidden = false;
    document.body.classList.add("modal-open");
  }

  function openExpenseEditor(item) {
    state.expenseEditor = item ? cloneExpense(item) : newExpenseDraft();
    state.expenseEditor._originalTotal = item ? expenseTotal(item) : 0;
    renderExpenseDrawer();
    const firstField = modalLayer.querySelector("[data-expense-field]");
    if (firstField) firstField.focus();
  }

  function updateExpenseDrawerTotals() {
    const editor = state.expenseEditor;
    if (!editor) return;
    syncExpenseAmount(editor);
    editor.lines.forEach(function updateLine(line, index) {
      const node = modalLayer.querySelector('[data-line-subtotal="' + index + '"]');
      if (node) node.textContent = formatExpenseMoney(line.subtotal, editor.currency);
    });
    modalLayer.querySelectorAll("[data-expense-subtotal], [data-expense-total], [data-expense-footer-total]").forEach(function updateTotal(node) {
      node.textContent = formatExpenseMoney(expenseTotal(editor), editor.currency);
    });
  }

  function clearExpenseActionAndRender(page, id) {
    const params = new URLSearchParams({ page: page, mode: "premium" });
    if (id) params.set("id", id);
    global.history.replaceState({}, "", "?" + params.toString());
    closeModal();
    renderCurrent();
  }

  function validateExpenseDraft(editor) {
    if (!editor.provider.trim()) return "Ingresá un proveedor.";
    if (editor.entryMode === "simple" && expenseTotal(editor) <= 0) return "Ingresá un monto mayor que cero.";
    if (editor.entryMode === "itemized" && !editor.lines.length) return "Agregá al menos un concepto.";
    if (editor.entryMode === "itemized" && editor.lines.some(function invalidLine(line) { return !line.description.trim() || Number(line.quantity) <= 0 || Number(line.unitPrice) < 0; })) return "Completá cada concepto con cantidad positiva y precio válido.";
    return "";
  }

  function showExpenseSaveConfirmation() {
    const editor = syncExpenseAmount(cloneExpense(state.expenseEditor));
    const error = validateExpenseDraft(editor);
    if (error) { showToast("Revisá el gasto", error); return; }
    state.pendingExpense = editor;
    const receiptCount = editor.receiptDocument ? 1 : 0;
    if (!editor.expenseId) {
      const body = '<div class="expense-confirm-card"><span>' + badge(editor.type, "info") + '</span><h3>' + esc(editor.category) + '</h3><strong>' + esc(formatExpenseMoney(expenseTotal(editor), editor.currency)) + '</strong><ul><li>' + (editor.entryMode === "itemized" ? esc(editor.lines.length) + " conceptos" : "Gasto simple") + '</li><li>' + receiptCount + ' comprobante demo</li><li>Relacionado con: ' + esc(editor.relationship.resourceId || "Ninguno") + '</li></ul></div><div class="notice-box"><strong>Solo demostración</strong><span>No se enviarán datos al backend ni se almacenarán archivos.</span></div>';
      showModal("Registrar gasto", "Revisá el resumen antes de confirmar.", body, '<button class="button button--quiet" type="button" data-action="return-expense-editor">Volver</button><button class="button button--primary" type="button" data-action="confirm-expense-register">Confirmar demo</button>');
      return;
    }
    const changed = editor._originalTotal !== expenseTotal(editor);
    if (changed) {
      const difference = expenseTotal(editor) - editor._originalTotal;
      const body = '<div class="amount-comparison"><div><small>Monto anterior</small><strong>' + esc(formatExpenseMoney(editor._originalTotal, editor.currency)) + '</strong></div><div><small>Monto nuevo</small><strong>' + esc(formatExpenseMoney(expenseTotal(editor), editor.currency)) + '</strong></div><div class="' + (difference >= 0 ? "is-positive" : "is-negative") + '"><small>Diferencia</small><strong>' + (difference >= 0 ? "+" : "−") + esc(formatExpenseMoney(Math.abs(difference), editor.currency)) + '</strong></div></div><form id="expenseEditConfirmForm"><label class="field field--wide"><span>Motivo del cambio</span><textarea name="reason" required placeholder="Ej. Ajuste de comprobante"></textarea></label></form>';
      showModal("Guardar cambio demo", "El total cambió y requiere justificación.", body, '<button class="button button--quiet" type="button" data-action="return-expense-editor">Cancelar</button><button class="button button--primary" type="submit" form="expenseEditConfirmForm">Guardar cambio demo</button>');
    } else {
      showModal("Guardar cambios", "Confirmá la actualización de este gasto demo.", '<div class="expense-confirm-card"><h3>' + esc(editor.expenseId) + '</h3><strong>' + esc(formatExpenseMoney(expenseTotal(editor), editor.currency)) + '</strong><p>Los cambios vivirán únicamente en esta sesión.</p></div>', '<button class="button button--quiet" type="button" data-action="return-expense-editor">Volver</button><button class="button button--primary" type="button" data-action="confirm-expense-edit">Guardar cambio demo</button>');
    }
  }

  function commitExpenseRegistration() {
    const item = state.pendingExpense;
    item.expenseId = "EXP-DEMO-" + String(state.expenses.length + 1).padStart(3, "0");
    item.receipt = item.receiptDocument ? "Adjunto demo" : "Sin adjunto";
    item.history = [{ date: "18 Sep · 14:20", title: "Gasto creado", detail: "Admin Demo · Registro de demostración" }];
    syncExpenseAmount(item);
    state.expenses.unshift(item);
    state.pendingExpense = null;
    state.expenseEditor = null;
    clearExpenseActionAndRender("expense", item.expenseId);
    showToast("Gasto registrado para la demostración.", "No se realizaron cambios de backend.");
  }

  function commitExpenseEdit(reason) {
    const item = state.pendingExpense;
    const index = state.expenses.findIndex(function findIndex(expenseItem) { return expenseItem.expenseId === item.expenseId; });
    if (index < 0) return;
    const previous = state.expenses[index];
    const oldTotal = expenseTotal(previous);
    const newTotal = expenseTotal(item);
    item.history = previous.history.slice();
    item.history.push({ date: "18 Sep · 14:22", title: oldTotal === newTotal ? "Datos del gasto actualizados" : "Monto actualizado", detail: oldTotal === newTotal ? "Admin Demo · Edición confirmada" : "Anterior: " + formatExpenseMoney(oldTotal, item.currency) + " · Nuevo: " + formatExpenseMoney(newTotal, item.currency) + " · Admin Demo · Motivo: " + reason });
    state.expenses[index] = syncExpenseAmount(item);
    state.pendingExpense = null;
    state.expenseEditor = null;
    clearExpenseActionAndRender("expense", item.expenseId);
    showToast("Gasto actualizado para la demostración.", "El evento fue agregado al historial local.");
  }

  function renderReception() {
    let result = '<div class="notice-box"><strong>Listo para recibir</strong><span>Escaneá o ingresá el tracking del transportista. La consulta usa datos determinísticos de demostración.</span></div>';
    if (state.reception === "known" && !state.receptionConfirmed) {
      const pack = data.packages[0];
      result = '<div class="lookup-result"><div class="lookup-state">' + icon("check") + '<span><strong>Cliente encontrado</strong><span>Coincidencia de demo confirmada por código de casillero.</span></span></div><div class="lookup-body"><div class="found-customer"><span class="avatar">CD</span><span><strong>' + esc(pack.customerName) + '</strong><span>' + esc(pack.customerId) + '</span></span>' + badge("Identificado", "success") + '</div><div class="summary-grid"><div class="summary-item"><small>Paquete interno</small><strong>' + esc(pack.packageId) + '</strong></div><div class="summary-item"><small>Comercio</small><strong>' + esc(pack.merchant) + '</strong></div></div><form id="receptionForm"><div class="form-grid"><div class="field"><label for="weight">Peso</label><input id="weight" name="weight" value="1.24 kg" required></div><div class="field"><label for="length">Largo</label><input id="length" value="32 cm" required></div><div class="field"><label for="width">Ancho</label><input id="width" value="20 cm" required></div><div class="field"><label for="height">Alto</label><input id="height" value="12 cm" required></div><div class="field"><label for="location">Ubicación</label><input id="location" value="A-18" required></div><div class="field"><label for="warehouse">Warehouse</label><input id="warehouse" value="Centro internacional — Demo" readonly></div><div class="field field--wide"><label for="employeeNote">Nota del empleado <span class="raw-code">Opcional</span></label><textarea id="employeeNote" placeholder="Agregar una observación de demo..."></textarea></div></div><div class="photo-grid"><button type="button" class="photo-placeholder" data-action="photo-demo">' + icon("file") + '<strong>Foto de etiqueta</strong><span>Placeholder demo</span></button><button type="button" class="photo-placeholder" data-action="photo-demo">' + icon("box") + '<strong>Foto del paquete</strong><span>Placeholder demo</span></button></div><div class="form-actions"><button class="button button--primary" type="submit">Confirmar recepción</button></div></form></div></div>';
    } else if (state.reception === "exception") {
      result = '<div class="lookup-result"><div class="lookup-state lookup-state--warning">' + icon("alert") + '<span><strong>No pudimos identificar al cliente</strong><span>La propiedad del paquete no se asignará sin confirmación.</span></span></div><div class="lookup-body"><div class="summary-grid"><div class="summary-item"><small>Tracking</small><strong>' + esc(data.reception.exceptionTracking) + '</strong></div><div class="summary-item"><small>Peso</small><strong>0.82 kg</strong></div></div><div class="notice-box notice-box--warning"><strong>Nunca adivinar la propiedad</strong><span>Este escenario de demo debe pasar a una cola de revisión independiente.</span></div><div class="form-actions"><button class="button button--quiet" type="button" data-route="unidentified">Revisar datos</button><button class="button button--navy" type="button" data-action="send-unidentified">Enviar a no identificados</button></div></div></div>';
    } else if (state.receptionConfirmed) {
      result = '<div class="success-screen"><span class="success-mark">' + icon("check") + '</span><h2>Recepción confirmada</h2><p>La operación fue actualizada únicamente en esta sesión de demostración.</p><div class="confirm-summary"><div><small>Paquete</small><strong>NXP-26-018392</strong></div><div><small>Cliente</small><strong>NXC-10482</strong></div><div><small>Peso</small><strong>1.24 kg</strong></div><div><small>Ubicación</small><strong>A-18</strong></div></div><div class="notice-box"><strong>Siguiente paso</strong><span>El cliente podrá ver este paquete cuando el sistema conectado sea implementado.</span></div><div class="form-actions"><button class="button button--quiet" type="button" data-action="reset-reception">Registrar otro</button>' + routeButton("Ver paquete", "package", canonical.packages[0].packageId, "button--primary") + "</div></div>";
    }
    return pageHead("Recepción", "Registrar un paquete recibido físicamente.", badge("Flujo simulado", "neutral")) + '<section class="reception-grid"><div class="panel scan-panel"><div class="panel-head"><div><h2>Escanear paquete</h2><p>Identificá primero; confirmá después.</p></div></div><div class="panel-body"><form id="lookupForm"><label class="field" for="trackingInput"><span>Tracking externo</span><div class="scan-entry"><input id="trackingInput" name="tracking" value="' + esc(data.reception.knownTracking) + '" autocomplete="off"><button class="button button--primary" type="submit">Buscar / Escanear</button></div></label><p class="scan-hint">Probá también <button class="text-link" type="button" data-action="use-exception-tracking">' + esc(data.reception.exceptionTracking) + '</button> para el flujo sin identificar.</p></form><ol class="workflow-list"><li><b>1</b><span><strong>Identificar</strong><span>Tracking y posible cliente</span></span></li><li><b>2</b><span><strong>Registrar</strong><span>Peso, dimensiones y ubicación</span></span></li><li><b>3</b><span><strong>Confirmar</strong><span>Crear el movimiento operativo</span></span></li></ol></div></div><div id="receptionResult">' + result + "</div></section>";
  }

  function packageTableRows(packages) {
    if (!packages.length) return '<tr><td colspan="10">' + emptyState("No encontramos paquetes", "Revisá la búsqueda o limpiá los filtros.") + "</td></tr>";
    return packages.map(function packageRow(pack) {
      return '<tr data-row-route="package" data-id="' + esc(pack.packageId) + '"><td><button class="text-link" type="button" data-route="package" data-id="' + esc(pack.packageId) + '"><strong>' + esc(pack.packageId) + '</strong></button></td><td><span class="cell-title">' + esc(pack.customerName) + '</span><span class="cell-subtitle">' + esc(pack.customerId) + '</span></td><td>' + esc(pack.merchant) + '</td><td><span class="cell-title">' + esc(pack.externalTracking.length > 15 ? pack.externalTracking.slice(0, 12) + "…" : pack.externalTracking) + '</span><span class="cell-subtitle">Externo</span></td><td>' + esc(pack.weight) + '</td><td>' + badge(pack.adminStatus) + '</td><td>' + esc(pack.location || "—") + '</td><td><span class="cell-subtitle">' + esc(pack.shipmentId || "Sin asignar") + '</span></td><td>' + esc(pack.lastMovement) + '</td><td><button class="button button--small button--quiet" type="button" data-route="package" data-id="' + esc(pack.packageId) + '">Ver</button></td></tr>';
    }).join("");
  }

  function renderPackages() {
    return pageHead("Paquetes", "Control operativo de paquetes y últimos movimientos.", routeButton("Registrar recepción", "reception", null, "button--primary")) + '<section class="panel"><div class="toolbar"><label class="toolbar-search">' + icon("search") + '<span class="sr-only">Buscar paquetes</span><input id="packageSearch" type="search" placeholder="Package ID, tracking, cliente o casillero"></label><select id="statusFilter" aria-label="Filtrar por estado"><option value="">Estado: todos</option><option>Recibido</option><option>Requiere documento</option><option>Listo para despacho</option><option>En tránsito</option><option>Llegó a Paraguay</option><option>Listo para retiro</option><option>Entregado</option></select><select aria-label="Filtrar por warehouse"><option>Warehouse: todos</option><option>Centro internacional — Demo</option><option>Paraguay — Demo</option></select><select aria-label="Filtrar por shipment"><option>Shipment: todos</option><option>' + esc(canonical.shipment.shipmentId) + '</option></select><select aria-label="Filtrar por acción"><option>Acción: todas</option><option>Requiere acción</option></select><button class="button button--quiet" type="button" data-action="filter-demo">Fecha</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Paquete</th><th>Cliente</th><th>Comercio</th><th>Tracking</th><th>Peso</th><th>Estado</th><th>Ubicación</th><th>Shipment</th><th>Último movimiento</th><th>Acciones</th></tr></thead><tbody id="packageRows">' + packageTableRows(data.packages) + "</tbody></table></div></section>";
  }

  function renderPackageDetail(params) {
    const id = params.get("id") || canonical.packages[0].packageId;
    const pack = data.packages.find(function findPack(item) { return item.packageId === id; });
    if (!pack) return pageHead("Paquete no encontrado", "No existe un paquete demo con ese identificador.", routeButton("Volver a paquetes", "packages", null, "button--quiet")) + emptyState("Paquete no encontrado", "Verificá el identificador de la URL.");
    const canonicalPrimary = pack.packageId === canonical.packages[0].packageId;
    const canonicalDocument = pack.packageId === canonical.packages[1].packageId;
    const actions = '<button class="button button--quiet" type="button" data-action="demo-soon" data-label="Edición de paquete">Editar</button><button class="button button--navy" type="button" data-action="assign-shipment">Agregar a envío</button><button class="button button--quiet" type="button" data-action="request-document" data-package="' + esc(pack.packageId) + '">Solicitar documento</button><button class="button button--quiet" type="button" data-action="demo-soon" data-label="Más acciones">Más</button>';
    const timeline = canonicalPrimary ? '<li><time>18 Sep · 10:42</time><i></i><span><strong>Recepción confirmada</strong><span>Peso y ubicación registrados.</span></span></li><li><time>18 Sep · 10:39</time><i></i><span><strong>Tracking escaneado</strong><span>' + esc(pack.externalTracking) + '</span></span></li><li><time>18 Sep · 10:38</time><i></i><span><strong>Cliente identificado</strong><span>' + esc(pack.customerId) + '</span></span></li>' : '<li><time>Hoy · 10:31</time><i></i><span><strong>' + esc(pack.adminStatus) + '</strong><span>Movimiento de demostración.</span></span></li><li><time>Hoy · 10:18</time><i></i><span><strong>Paquete registrado</strong><span>Centro internacional — Demo</span></span></li>';
    const documentStatus = canonicalDocument ? '<div class="document-row"><span><strong>Factura de compra</strong><small>Necesitamos la factura de este paquete.</small></span>' + badge("Pendiente del cliente", "warning") + '</div><button class="button button--small button--quiet" type="button" data-action="request-document" data-package="' + esc(pack.packageId) + '">Preparar solicitud</button>' : '<div class="document-row"><span><strong>Factura</strong><small>No requerida · Demo</small></span>' + badge("Sin bloqueo", "success") + "</div>";
    const shipmentBlock = pack.shipmentId ? '<div class="shipment-link-row"><span><strong>' + esc(pack.shipmentId) + '</strong><small>' + esc(canonical.shipment.route) + '</small></span><button class="button button--small button--quiet" type="button" data-route="shipment" data-id="' + esc(pack.shipmentId) + '">Ver</button></div>' : '<div class="notice-box"><strong>No asignado todavía</strong><span>Este paquete aún no forma parte de un envío internacional.</span></div><button class="button button--small button--primary" type="button" data-action="assign-shipment">Agregar a envío</button>';
    return pageHead(pack.packageId, pack.merchant, actions, "Paquetes / Detalle") + '<section class="detail-layout"><div class="detail-main"><div class="panel"><div class="panel-head"><div><h2>Resumen</h2><p>Identificadores y posición operativa.</p></div>' + badge(pack.adminStatus) + '</div><div class="panel-body"><div class="summary-grid"><div class="summary-item"><small>Cliente</small><strong>' + esc(pack.customerName) + '</strong></div><div class="summary-item"><small>Código de cliente</small><strong>' + esc(pack.customerId) + '</strong></div><div class="summary-item"><small>Tracking externo</small><strong>' + esc(pack.externalTracking) + '</strong></div><div class="summary-item"><small>Peso</small><strong>' + esc(pack.weight) + '</strong></div><div class="summary-item"><small>Dimensiones</small><strong>' + esc(pack.dimensions || "Por definir · Demo") + '</strong></div><div class="summary-item"><small>Ubicación</small><strong>' + esc(pack.location || "Por definir") + '</strong></div><div class="summary-item"><small>Warehouse</small><strong>' + esc(pack.warehouse || "Demo") + '</strong></div><div class="summary-item"><small>Estado interno</small><strong class="raw-code">' + esc(pack.status) + '</strong></div></div></div></div><div class="panel"><div class="panel-head"><div><h2>Timeline</h2><p>Trazabilidad del paquete.</p></div></div><div class="panel-body"><ol class="timeline">' + timeline + '</ol></div></div></div><aside class="detail-side"><div class="panel"><div class="panel-head"><h3>Documentos</h3></div><div class="panel-body">' + documentStatus + '<div class="photo-grid"><button class="photo-placeholder" type="button" data-action="photo-demo">' + icon("file") + '<strong>Etiqueta</strong><span>Imagen demo</span></button><button class="photo-placeholder" type="button" data-action="photo-demo">' + icon("box") + '<strong>Paquete</strong><span>Imagen demo</span></button></div></div></div><div class="panel"><div class="panel-head"><h3>Envío</h3></div><div class="panel-body">' + shipmentBlock + '</div></div><div class="panel"><div class="panel-head"><h3>Cliente</h3></div><div class="panel-body"><div class="customer-card-row"><span><strong>' + esc(pack.customerName) + '</strong><small>' + esc(pack.customerId) + '</small></span><button class="button button--small button--quiet" type="button" data-route="customer" data-id="' + esc(pack.customerId) + '">Ver cliente</button></div></div></div></aside></section>';
  }

  function renderUnidentified() {
    const cards = data.unidentified.map(function unidentifiedCard(item) {
      const match = item.possibleCustomerId ? '<section class="possible-match"><div class="candidate-head"><span>Candidato sugerido</span><strong>Sin asignar</strong></div><a href="' + routeHref("customer", item.possibleCustomerId) + '" data-route="customer" data-id="' + esc(item.possibleCustomerId) + '">' + esc(item.possibleCustomerId) + ' · ' + esc(item.possibleCustomerName) + '</a><p>Evidencia disponible</p><ul class="evidence-list">' + item.evidence.map(function evidence(reason) { return "<li>" + esc(reason) + "</li>"; }).join("") + '</ul><span class="confirmation-flag">Requiere confirmación</span></section>' : '<section class="possible-match possible-match--empty"><div class="candidate-head"><span>Coincidencia</span><strong>Sin candidato</strong></div><p>Buscar por etiqueta, comercio o datos del casillero antes de asignar.</p><span class="confirmation-flag">Requiere confirmación</span></section>';
      return '<article class="unidentified-card"><header class="unidentified-card__head"><div><span class="case-label">' + esc(item.scenario) + '</span><h3>' + esc(item.tracking) + '</h3><p>' + esc(item.caseId) + '</p></div><span class="unassigned-state"><i></i>Propietario sin asignar</span></header><div class="unidentified-card__body"><div class="case-package"><div class="case-facts"><div><small>Recibido</small><strong>' + esc(item.received) + '</strong></div><div><small>Peso</small><strong>' + esc(item.weight) + '</strong></div><div><small>Ubicación</small><strong>' + esc(item.location) + '</strong></div></div><button class="label-preview" type="button" data-action="photo-demo">' + icon("file") + '<span><strong>Etiqueta del paquete</strong><small>Vista previa disponible · Demo</small></span><b>Ver</b></button></div>' + match + '</div><footer class="unidentified-card__actions"><span>La asignación siempre requiere revisión y confirmación humana.</span><div class="card-actions"><button class="button button--small button--quiet" type="button" data-action="customer-search-demo">Buscar cliente</button>' + (item.possibleCustomerId ? '<button class="button button--small button--navy" type="button" data-action="review-match" data-case="' + esc(item.caseId) + '">Revisar coincidencia</button>' : '<button class="button button--small button--navy" type="button" data-action="create-case">Crear caso</button>') + '</div></footer></article>';
    }).join("");
    return pageHead("Paquetes sin identificar", "Paquetes recibidos físicamente cuyo propietario todavía no pudo confirmarse.", routeButton("Nueva recepción", "reception", null, "button--primary")) + '<section class="ownership-rule">' + icon("alert") + '<div><strong>Control de propiedad</strong><span>Ninguna sugerencia asigna un propietario automáticamente. Cada coincidencia debe verificarse y confirmarse por una persona.</span></div><b>4 casos abiertos</b></section><section class="unidentified-list">' + cards + "</section>";
  }

  function documentRows() {
    const rows = data.documents.filter(function filterDocument(item) { return item.status === state.documentTab; });
    if (!rows.length) return '<tr><td colspan="7">' + emptyState("No hay solicitudes", "Esta cola de demo no tiene elementos.") + "</td></tr>";
    return rows.map(function documentRow(item) {
      return '<tr><td><button class="text-link" type="button" data-route="package" data-id="' + esc(item.packageId) + '"><strong>' + esc(item.packageId) + '</strong></button></td><td>' + esc(item.merchant) + '</td><td><span class="cell-title">' + esc(item.customerName) + '</span><span class="cell-subtitle">' + esc(item.customerId) + '</span></td><td>' + esc(item.document) + '</td><td>' + badge(item.statusLabel) + '</td><td>' + esc(item.age) + '</td><td><div class="table-actions"><button class="button button--small button--quiet" type="button" data-route="package" data-id="' + esc(item.packageId) + '">Ver paquete</button>' + (item.status === "Pendiente" ? '<button class="button button--small button--navy" type="button" data-action="request-document" data-package="' + esc(item.packageId) + '">Preparar solicitud</button><button class="button button--small button--quiet" type="button" data-action="document-received">Marcar recibido</button>' : "") + "</div></td></tr>";
    }).join("");
  }

  function renderDocuments() {
    const tabs = [["Pendiente", "Pendientes"], ["Recibido", "Recibidos"], ["Revisión", "En revisión"], ["Aprobado", "Aprobados"]].map(function documentTab(tab) {
      return '<button class="tab' + (state.documentTab === tab[0] ? " is-active" : "") + '" type="button" data-action="document-tab" data-tab="' + esc(tab[0]) + '">' + esc(tab[1]) + "</button>";
    }).join("");
    return pageHead("Documentos", "Excepciones documentales que requieren seguimiento operativo.", badge("7 pendientes", "warning")) + '<section class="panel"><div class="tabs" role="tablist" aria-label="Estados de documentos">' + tabs + '</div><div class="table-wrap"><table class="data-table"><thead><tr><th>Paquete</th><th>Comercio</th><th>Cliente</th><th>Requerido</th><th>Estado</th><th>Antigüedad</th><th>Acciones</th></tr></thead><tbody id="documentRows">' + documentRows() + "</tbody></table></div></section>";
  }

  function renderShipments() {
    const cards = data.shipments.map(function shipmentCard(item) {
      const isMain = item.shipmentId === canonical.shipment.shipmentId;
      const status = isMain && state.shipmentDeparted ? "En tránsito" : item.adminStatus;
      const progress = Math.round(((item.ready || item.packageCount) / item.packageCount) * 100);
      return '<article class="shipment-card"><div class="panel-head"><div><span class="demo-label">' + esc(item.mode) + '</span><h3>' + esc(item.shipmentId) + '</h3><p>' + esc(item.route) + '</p></div>' + badge(status) + '</div><div class="mini-stats"><span><small>Salida</small><strong>' + esc(item.scheduledDeparture) + '</strong></span><span><small>Paquetes</small><strong>' + esc(item.packageCount) + '</strong></span><span><small>Peso</small><strong>' + esc(item.grossWeight) + '</strong></span></div><div class="readiness-track"><i style="width:' + progress + '%"></i></div><div class="readiness-caption"><span>' + esc(item.ready || item.packageCount) + ' sin bloqueo</span><strong>' + esc(item.review || 0) + ' requieren revisión</strong></div><div class="card-actions"><button class="button button--small button--primary" type="button" data-route="shipment" data-id="' + esc(item.shipmentId) + '">Ver envío</button><button class="button button--small button--quiet" type="button" data-route="packages">Ver paquetes</button>' + (isMain ? '<button class="button button--small button--quiet" type="button" data-action="close-shipment">Cerrar envío</button>' : "") + "</div></article>";
    }).join("");
    return pageHead("Envíos internacionales", "Preparación, control y salida de shipments internacionales.", '<button class="button button--primary" type="button" data-action="demo-soon" data-label="Nuevo envío">Nuevo envío</button>') + '<section class="shipment-list">' + cards + "</section>";
  }

  function renderShipmentDetail(params) {
    const id = params.get("id") || canonical.shipment.shipmentId;
    const shipment = data.shipments.find(function findShipment(item) { return item.shipmentId === id; });
    if (!shipment) return pageHead("Envío no encontrado", "No existe un shipment demo con ese identificador.", routeButton("Volver a envíos", "shipments", null, "button--quiet")) + emptyState("Envío no encontrado", "Verificá el identificador de la URL.");
    const isMain = shipment.shipmentId === canonical.shipment.shipmentId;
    const status = isMain && state.shipmentDeparted ? "En tránsito" : shipment.adminStatus;
    const checks = (shipment.checks || [{ label: "Paquetes incluidos", value: shipment.packageCount, tone: "success" }, { label: "Total a revisar", value: shipment.review, tone: shipment.review ? "warning" : "success" }]).map(function checkCard(check) {
      return '<article class="check-card" data-tone="' + esc(check.tone) + '"><span>' + esc(check.label) + '</span><strong>' + esc(check.value) + "</strong></article>";
    }).join("");
    const manifestRows = data.packages.filter(function shipmentPackage(pack) { return pack.shipmentId === shipment.shipmentId; }).map(function packRow(pack) {
      return '<tr><td><button class="text-link" type="button" data-route="package" data-id="' + esc(pack.packageId) + '"><strong>' + esc(pack.packageId) + '</strong></button></td><td>' + esc(pack.customerId) + '</td><td>' + esc(pack.merchant) + '</td><td>' + esc(pack.weight) + '</td><td>' + badge(pack.adminStatus) + "</td></tr>";
    }).join("") || '<tr><td colspan="5">' + emptyState("Lista resumida", "El manifest completo no se incluye en esta demostración.") + "</td></tr>";
    return pageHead(shipment.shipmentId, shipment.route, '<button class="button button--quiet" type="button" data-action="view-manifest">Ver manifest</button>' + (isMain && !state.shipmentDeparted ? '<button class="button button--primary" type="button" data-action="depart-shipment">Marcar como despachado</button>' : ""), "Envíos / Detalle") + '<section class="shipment-summary"><article class="summary-stat"><small>Estado</small><strong>' + badge(status) + '</strong></article><article class="summary-stat"><small>Paquetes</small><strong>' + esc(shipment.packageCount) + '</strong></article><article class="summary-stat"><small>Peso bruto</small><strong>' + esc(shipment.grossWeight) + '</strong></article><article class="summary-stat"><small>Salida</small><strong>' + esc(shipment.scheduledDeparture) + '</strong></article><article class="summary-stat"><small>Modo</small><strong>' + esc(shipment.mode) + '</strong></article></section><section class="two-column-grid"><div class="panel"><div class="panel-head"><div><h2>Readiness operativo</h2><p>Validaciones determinísticas antes del cierre.</p></div>' + badge((shipment.review || 0) + " por revisar", shipment.review ? "warning" : "success") + '</div><div class="panel-body"><div class="readiness-grid">' + checks + '</div><div class="form-actions"><button class="button button--quiet" type="button" data-route="documents">Ver ' + esc(shipment.review || 0) + ' casos</button><button class="button button--quiet" type="button" data-action="view-manifest">Ver manifest</button>' + (isMain ? '<button class="button button--navy" type="button" data-action="close-shipment">Cerrar envío</button>' : "") + '</div></div></div><div class="panel"><div class="panel-head"><div><h2>Actividad</h2><p>Movimientos del shipment.</p></div></div><div class="panel-body"><ol class="timeline"><li><time>Hoy · 10:06</time><i></i><span><strong>Validación operativa actualizada</strong><span>174 paquetes sin bloqueo.</span></span></li><li><time>Hoy · 09:58</time><i></i><span><strong>Manifest preparado</strong><span>Versión de demostración.</span></span></li><li><time>Hoy · 08:12</time><i></i><span><strong>Preparación iniciada</strong><span>Centro internacional — Demo</span></span></li></ol></div></div></section><section class="panel"><div class="panel-head"><div><h2>Lista de paquetes</h2><p>Vista resumida del contenido del shipment.</p></div><button class="button button--small button--quiet" type="button" data-route="packages">Ver todos</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Paquete</th><th>Cliente</th><th>Comercio</th><th>Peso</th><th>Estado</th></tr></thead><tbody>' + manifestRows + "</tbody></table></div></section>";
  }

  function renderArrivals() {
    const arrival = data.arrival;
    const stats = [["Esperados", arrival.expected, false], ["Escaneados", arrival.scanned, false], ["Coinciden", arrival.matched, false], ["Faltantes", arrival.missing, true], ["Extra", arrival.extra, true], ["Duplicados", arrival.duplicate, false]].map(function arrivalStat(item) {
      return '<article class="arrival-stat' + (item[2] ? " is-issue" : "") + '"><small>' + esc(item[0]) + "</small><strong>" + esc(item[1]) + "</strong></article>";
    }).join("");
    return pageHead("Llegadas Paraguay", "Conciliar lo esperado con lo recibido físicamente.", badge("Recepción parcial", "warning")) + '<section class="panel arrival-panel"><div class="panel-head arrival-head"><div><span class="case-label">Reconciliación activa</span><h2>' + esc(arrival.shipmentId) + '</h2><p>' + esc(arrival.route) + ' · Llegada de demostración</p></div><div class="arrival-head__meta"><small>Última lectura</small><strong>Hoy · 10:48</strong></div></div><div class="panel-body"><div class="arrival-overview">' + stats + '</div><div class="reconciliation-grid"><section class="scan-progress"><div class="scan-progress-head"><span><small>Progreso de escaneo</small><strong>' + esc(arrival.scanned) + ' de ' + esc(arrival.expected) + ' paquetes</strong></span><b>98.9%</b></div><div class="progress-bar"><i style="width:98.9%"></i></div><div class="scan-progress__footer"><span class="scan-status-note"><i></i>Faltan 2 lecturas para completar el total esperado.</span><div class="arrival-actions"><button class="button button--primary" type="button" data-action="start-arrival">Iniciar recepción</button><button class="button button--quiet" type="button" data-route="packages">Ver paquetes</button></div></div></section><section class="discrepancy-panel"><div class="discrepancy-heading"><div><h3>Discrepancias detectadas</h3><p>Elementos que requieren control antes de cerrar.</p></div><button class="button button--small button--quiet" type="button" data-action="show-discrepancies">Revisar</button></div><ul class="discrepancy-list">' + arrival.discrepancies.map(function discrepancy(item, index) { return '<li><span class="discrepancy-count" aria-hidden="true">' + (index === 0 ? "3" : "1") + '</span><span><strong>' + (index === 0 ? "3 esperados no escaneados" : "1 tracking no incluido en manifest") + '</strong><small>' + (index === 0 ? "Pendientes de lectura física" : "No figura en el manifest de origen") + '</small></span></li>'; }).join("") + '</ul><p class="arrival-demo-note">Datos de demostración; no representan una llegada real.</p></section></div></div></section>';
  }

  function customerRows(customers) {
    if (!customers.length) return '<tr><td colspan="7">' + emptyState("No encontramos clientes", "Probá con otro nombre o código.") + "</td></tr>";
    return customers.map(function customerRow(customer) {
      return '<tr><td><button class="text-link" type="button" data-route="customer" data-id="' + esc(customer.customerId) + '"><strong>' + esc(customer.name) + '</strong></button></td><td><span class="cell-title">' + esc(customer.customerId) + '</span><span class="cell-subtitle">Casillero: ' + esc(customer.lockerCode) + '</span></td><td>' + esc(customer.email) + '</td><td>' + esc(customer.activePackages) + '</td><td>' + (customer.pendingActions ? badge(customer.pendingActions + " pendiente", "warning") : badge("Sin pendientes", "success")) + '</td><td>' + badge(customer.status) + '</td><td><button class="button button--small button--quiet" type="button" data-route="customer" data-id="' + esc(customer.customerId) + '">Ver cliente</button></td></tr>';
    }).join("");
  }

  function renderCustomers() {
    return pageHead("Clientes", "Búsqueda operativa por cliente y código de casillero.", '<button class="button button--primary" type="button" data-action="demo-soon" data-label="Alta de cliente">Nuevo cliente</button>') + '<section class="panel"><div class="toolbar"><label class="toolbar-search">' + icon("search") + '<span class="sr-only">Buscar clientes</span><input id="customerSearch" type="search" placeholder="Nombre, Customer ID o email"></label><select aria-label="Estado del cliente"><option>Estado: todos</option><option>Activo</option></select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Cliente</th><th>Customer ID / casillero</th><th>Email / shell</th><th>Paquetes activos</th><th>Acciones pendientes</th><th>Estado</th><th>Acción</th></tr></thead><tbody id="customerRows">' + customerRows(data.customers) + "</tbody></table></div></section>";
  }

  function renderCustomerDetail(params) {
    const id = params.get("id") || canonical.customer.customerId;
    const customer = data.customers.find(function findCustomer(item) { return item.customerId === id; });
    if (!customer) return pageHead("Cliente no encontrado", "No existe un cliente demo con ese identificador.", routeButton("Volver a clientes", "customers", null, "button--quiet")) + emptyState("Cliente no encontrado", "Verificá el código del cliente.");
    const packages = data.packages.filter(function customerPackage(pack) { return pack.customerId === customer.customerId; });
    const rows = packages.map(function customerPackageRow(pack) {
      return '<tr><td><button class="text-link" type="button" data-route="package" data-id="' + esc(pack.packageId) + '"><strong>' + esc(pack.packageId) + '</strong></button></td><td>' + esc(pack.merchant) + '</td><td>' + esc(pack.weight) + '</td><td>' + badge(pack.adminStatus) + '</td><td>' + esc(pack.lastMovement) + "</td></tr>";
    }).join("") || '<tr><td colspan="5">' + emptyState("Sin paquetes activos", "Este cliente demo no tiene paquetes en curso.") + "</td></tr>";
    return pageHead(customer.name, "Vista operativa del cliente y sus paquetes activos.", '<button class="button button--quiet" type="button" data-action="support-note">Agregar nota</button><button class="button button--primary" type="button" data-action="demo-soon" data-label="Edición de cliente">Editar cliente</button>', "Clientes / Detalle") + '<section class="customer-overview panel"><div class="customer-identity"><span class="avatar">' + esc(customer.name.split(" ").map(function initials(part) { return part[0]; }).slice(0, 2).join("")) + '</span><div><span class="customer-status">' + badge(customer.status) + '</span><h2>' + esc(customer.name) + '</h2><p><span>Customer ID <strong>' + esc(customer.customerId) + '</strong></span><span>Casillero <strong>' + esc(customer.lockerCode) + '</strong></span></p></div></div><div class="customer-stats"><article><small>Paquetes activos</small><strong>' + esc(customer.activePackages) + '</strong><span>En operación</span></article><article data-tone="warning"><small>Acciones pendientes</small><strong>' + esc(customer.pendingActions) + '</strong><span>' + (customer.pendingActions ? "Requiere atención" : "Sin bloqueos") + '</span></article><article><small>Preferencia de entrega</small><strong>' + esc(customer.preference) + '</strong><span>Configuración actual</span></article><article class="customer-contact"><small>Contacto</small><strong>' + esc(customer.email) + '</strong><span>Email registrado</span></article></div></section><section class="two-column-grid"><div class="panel"><div class="panel-head"><div><h2>Paquetes actuales</h2><p>Estado operativo compartido.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Paquete</th><th>Comercio</th><th>Peso</th><th>Estado</th><th>Movimiento</th></tr></thead><tbody>' + rows + '</tbody></table></div></div><aside class="panel"><div class="panel-head"><div><h2>Seguimiento</h2><p>Shell operativo sin datos sensibles.</p></div></div><div class="panel-body"><div class="document-row"><span><strong>Historial</strong><small>Movimientos de paquetes demo</small></span>' + badge("Disponible", "neutral") + '</div><div class="document-row"><span><strong>Acciones pendientes</strong><small>' + (customer.pendingActions ? "Documento requerido" : "Sin bloqueos") + '</small></span>' + badge(customer.pendingActions ? "1 pendiente" : "Al día", customer.pendingActions ? "warning" : "success") + '</div><div class="document-row"><span><strong>Notas de soporte</strong><small>Sin notas privadas cargadas</small></span><button class="button button--small button--quiet" type="button" data-action="support-note">Agregar</button></div><div class="document-row"><span><strong>Preferencia de entrega</strong><small>Configuración futura</small></span>' + badge(customer.preference, "neutral") + "</div></div></aside></section>";
  }

  function deliveryRows() {
    const rows = data.deliveries.filter(function deliveryFilter(item) { return item.tab === state.deliveryTab; });
    if (!rows.length) return '<tr><td colspan="7">' + emptyState("No hay entregas", "No existen operaciones en esta cola de demo.") + "</td></tr>";
    return rows.map(function deliveryRow(item) {
      return '<tr><td><button class="text-link" type="button" data-route="package" data-id="' + esc(item.packageId) + '"><strong>' + esc(item.packageId) + '</strong></button></td><td><span class="cell-title">' + esc(item.customerName) + '</span><span class="cell-subtitle">' + esc(item.customerId) + '</span></td><td>' + esc(item.method) + '</td><td>' + badge(item.status) + '</td><td>' + badge(item.payment) + '</td><td>Demo · Por definir</td><td><button class="button button--small button--quiet" type="button" data-action="delivery-demo">Gestionar</button></td></tr>';
    }).join("");
  }

  function renderDeliveries() {
    const tabs = [["pickup", "Listos para retiro"], ["pending", "Delivery pendiente"], ["route", "En camino"], ["delivered", "Entregados"]].map(function deliveryTab(item) {
      return '<button class="tab' + (state.deliveryTab === item[0] ? " is-active" : "") + '" type="button" data-action="delivery-tab" data-tab="' + esc(item[0]) + '">' + esc(item[1]) + "</button>";
    }).join("");
    return pageHead("Retiros / Delivery", "Coordinación operativa de la última etapa.", badge("Demo · sin proveedor real", "neutral")) + '<section class="panel"><div class="tabs" role="tablist" aria-label="Etapas de entrega">' + tabs + '</div><div class="table-wrap"><table class="data-table"><thead><tr><th>Paquete</th><th>Cliente</th><th>Modalidad</th><th>Estado</th><th>Pago</th><th>Sucursal / Delivery</th><th>Acción</th></tr></thead><tbody id="deliveryRows">' + deliveryRows() + "</tbody></table></div></section>";
  }

  function simpleTable(headers, rows) {
    return '<div class="table-wrap"><table class="data-table"><thead><tr>' + headers.map(function header(item) { return "<th>" + esc(item) + "</th>"; }).join("") + "</tr></thead><tbody>" + rows.map(function row(items) { return "<tr>" + items.map(function cell(item) { return "<td>" + item + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }

  function renderWarehouse() {
    const locations = data.warehouse.locations.map(function locationCard(item) {
      const percent = Math.round((item.occupied / item.capacity) * 100);
      return '<article class="location-card"><span class="demo-label">Zona ' + esc(item.zone) + '</span><h3>' + esc(item.purpose) + '</h3><p>' + esc(item.occupied) + ' de ' + esc(item.capacity) + ' posiciones demo.</p><div class="occupancy"><div class="progress-bar"><i style="width:' + percent + '%"></i></div><strong>' + percent + "%</strong></div></article>";
    }).join("");
    return pageHead("Almacén", "Ubicaciones y ocupación operativa de demostración.", '<button class="button button--primary" type="button" data-action="warehouse-lookup">Buscar paquete</button>') + '<section class="panel"><div class="panel-head"><div><h2>Ocupación general</h2><p>Centro internacional — Demo</p></div><strong>68%</strong></div><div class="panel-body"><div class="progress-bar"><i style="width:68%"></i></div></div></section><section class="location-grid">' + locations + "</section>";
  }

  function renderSupport() {
    const rows = data.supportCases.map(function supportRow(item) { return ["<strong>" + esc(item.id) + "</strong>", esc(item.customer), '<button class="text-link" type="button" data-route="package" data-id="' + esc(item.packageId) + '">' + esc(item.packageId) + "</button>", esc(item.subject), badge(item.status), esc(item.age), '<button class="button button--small button--quiet" type="button" data-action="support-demo">Abrir</button>']; });
    return pageHead("Soporte", "Casos vinculados a clientes y paquetes.", '<button class="button button--primary" type="button" data-action="create-case">Crear caso</button>') + '<section class="panel">' + simpleTable(["Caso", "Cliente", "Paquete", "Motivo", "Estado", "Antigüedad", "Acción"], rows) + "</section>";
  }

  function renderPayments() {
    const rows = data.payments.map(function paymentRow(item) { return ['<button class="text-link" type="button" data-route="package" data-id="' + esc(item.packageId) + '">' + esc(item.packageId) + "</button>", esc(item.customer), esc(item.concept), esc(item.amount), badge(item.status), '<button class="button button--small button--quiet" type="button" data-action="payment-demo">Revisar</button>']; });
    return pageHead("Pagos", "Control demo de pendientes, confirmaciones y revisiones.", badge("Sin integración de pago", "neutral")) + '<section class="shipment-summary"><article class="summary-stat"><small>Pendientes</small><strong>1</strong></article><article class="summary-stat"><small>Confirmados</small><strong>1</strong></article><article class="summary-stat"><small>En revisión</small><strong>1</strong></article></section><section class="panel">' + simpleTable(["Paquete", "Cliente", "Concepto", "Monto", "Estado", "Acción"], rows) + "</section>";
  }

  function renderBilling() {
    const rows = data.invoices.map(function invoiceRow(item) { return ["<strong>" + esc(item.reference) + "</strong>", esc(item.customer), '<button class="text-link" type="button" data-route="package" data-id="' + esc(item.packageId) + '">' + esc(item.packageId) + "</button>", badge(item.status), esc(item.system), '<button class="button button--small button--quiet" type="button" data-action="billing-demo">Ver</button>']; });
    return pageHead("Facturación", "Documentos emitidos y pendientes de demostración.", badge("Sin implementación SIFEN", "neutral")) + '<section class="panel">' + simpleTable(["Documento", "Cliente", "Paquete", "Estado", "Sistema", "Acción"], rows) + "</section>";
  }

  function renderTeam() {
    const rows = data.team.map(function teamRow(item) {
      const initials = item.name.split(" ").filter(Boolean).map(function initial(part) { return part[0]; }).slice(0, 2).join("");
      return ['<span class="profile-summary"><span class="avatar">' + esc(initials) + '</span><strong>' + esc(item.name) + "</strong></span>", esc(item.role), esc(item.location), badge(item.status), '<button class="button button--small button--quiet" type="button" data-action="team-demo">Ver</button>'];
    });
    return pageHead("Equipo", "Roles y disponibilidad operativa de ejemplo.", '<button class="button button--primary" type="button" data-action="demo-soon" data-label="Gestión de equipo">Gestionar equipo</button>') + '<section class="panel team-panel">' + simpleTable(["Empleado demo", "Rol", "Ubicación", "Estado", "Acción"], rows) + "</section>";
  }

  function renderAudit() {
    const rows = data.audit.map(function auditRow(item) { return [esc(item.time), "<strong>" + esc(item.action) + "</strong>", esc(item.subject), esc(item.actor), badge("Registrado", "neutral")]; });
    return pageHead("Auditoría", "Trazabilidad de cambios operativos recientes.", '<button class="button button--quiet" type="button" data-action="audit-filter">Filtrar actividad</button>') + '<section class="panel">' + simpleTable(["Fecha", "Acción", "Objeto", "Actor demo", "Registro"], rows) + "</section>";
  }

  function renderSettings() {
    const settings = [["Warehouses", "Centros y zonas operativas", "1 entorno demo"], ["Sucursales", "Puntos de retiro", "Por definir"], ["Notificaciones", "Eventos operativos", "Demo local"], ["Estados", "Etiquetas para clientes y Admin", "Contrato compartido"], ["Seguridad", "Roles y acceso", "Configuración futura"], ["Integraciones", "Backend y servicios externos", "No conectado"]].map(function setting(item) { return '<article class="setting-card"><span class="demo-label">Configuración demo</span><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p><div class="document-row"><span><small>' + esc(item[2]) + '</small></span><button class="button button--small button--quiet" type="button" data-action="settings-demo">Revisar</button></div></article>'; }).join("");
    return pageHead("Configuración", "Parámetros operativos previstos para el sistema conectado.", badge("Demo / futuro", "neutral")) + '<section class="settings-grid">' + settings + "</section>";
  }

  function renderReceipts() {
    const rows = premium.receipts.map(function receiptRow(item) {
      return ["<strong>" + esc(item[0]) + "</strong>", '<button class="text-link" type="button" data-route="expense" data-id="' + esc(item[1]) + '">' + esc(item[1]) + "</button>", esc(item[2]), esc(item[3]), esc(item[5]), badge(item[4]), '<button class="button button--small button--quiet" type="button" data-action="receipt-demo">Ver</button>'];
    });
    return pageHead("Comprobantes", "Control visual de documentos asociados a gastos demo.", badge("Sin OCR · Demo", "neutral")) + '<section class="management-metrics management-metrics--four"><article class="management-metric"><span>Pendientes</span><strong>1</strong><small>Demo</small></article><article class="management-metric"><span>Adjuntos</span><strong>2</strong><small>Demo</small></article><article class="management-metric"><span>Necesitan revisión</span><strong>1</strong><small>Demo</small></article><article class="management-metric"><span>Aprobados</span><strong>1</strong><small>Demo</small></article></section><section class="panel">' + simpleTable(["Comprobante", "Gasto", "Proveedor", "Categoría", "Fecha", "Estado", "Acción"], rows) + '</section>';
  }

  function renderReports() {
    const cards = premium.reports.map(function reportCard(item) {
      return '<article class="panel report-card"><span class="premium-kicker">Reporte demo</span><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p><div class="card-actions"><button class="button button--small button--quiet" type="button" data-action="report-preview" data-file="' + esc(item[2]) + '">Ver reporte</button><button class="button button--small button--primary" type="button" data-action="prepare-excel" data-file="' + esc(item[2]) + '">Preparar Excel</button></div></article>';
    }).join("");
    return pageHead("Reportes", "Vistas gerenciales y preparación local de entregables.", badge("Demo · XLSX no conectado", "warning")) + '<section class="report-grid">' + cards + '</section>';
  }

  function employeeRows() {
    return premium.employees.map(function employeeRow(item) {
      return '<tr><td><button class="text-link" type="button" data-route="employee" data-id="' + esc(item.employeeId) + '"><strong>' + esc(item.name) + '</strong></button><span class="cell-subtitle">' + esc(item.employeeId) + '</span></td><td>' + badge(item.family, item.family === "Courier" ? "info" : "warning") + '</td><td>' + esc(item.role) + '</td><td>' + esc(item.worksite) + '</td><td>' + esc(item.shift) + '</td><td>' + esc(item.entry) + ' · ' + esc(item.method) + '</td><td>' + badge(item.attendanceStatus) + '</td><td><button class="button button--small button--quiet" type="button" data-route="employee" data-id="' + esc(item.employeeId) + '">Ver</button></td></tr>';
    }).join("");
  }

  function renderPersonnel() {
    return pageHead("Personal", "Gestión demo de equipos Courier y Aduana.", badge("Premium", "warning")) + '<section class="management-metrics management-metrics--five"><article class="management-metric"><span>Empleados activos</span><strong>18</strong><small>Demo</small></article><article class="management-metric"><span>Presentes hoy</span><strong>17</strong><small>94%</small></article><article class="management-metric"><span>Ausentes</span><strong>1</strong><small>Demo</small></article><article class="management-metric"><span>Tardanzas</span><strong>2</strong><small>Revisar</small></article><article class="management-metric"><span>Horas extra pendientes</span><strong>6.5 h</strong><small>Demo</small></article></section><section class="family-split"><article class="panel"><span class="premium-kicker">Courier</span><h3>Recepción, Warehouse, Operación y Delivery</h3><p>Permisos operativos separados del equipo Aduana.</p></article><article class="panel"><span class="premium-kicker">Aduana / Customs</span><h3>Documentación, Revisión, Manifest y Compliance</h3><p>Permisos operativos separados del equipo Courier.</p></article></section><section class="panel"><div class="panel-head"><div><h2>Empleados demo</h2><p>Identidades ficticias para presentación.</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Empleado</th><th>Familia</th><th>Rol</th><th>Sede</th><th>Turno</th><th>Entrada</th><th>Estado</th><th>Acción</th></tr></thead><tbody>' + employeeRows() + '</tbody></table></div></section>';
  }

  function renderEmployeeDetail(params) {
    const employee = premium.employees.find(function findEmployee(item) { return item.employeeId === (params.get("id") || "EMP-COURIER-001"); });
    if (!employee) return pageHead("Empleado no encontrado", "No existe ese registro demo.", routeButton("Volver", "personnel"));
    const tabs = ["Resumen", "Asistencia", "Horario", "Horas extra", "Pagos", "Avisos", "Auditoría"].map(function employeeTab(item, index) { return '<button class="tab' + (index === 0 ? " is-active" : "") + '" type="button" data-action="employee-tab">' + esc(item) + '</button>'; }).join("");
    return pageHead(employee.name, employee.role + " · " + employee.family, badge(employee.status, "success"), "Personal / Empleado") + '<div class="tabs employee-tabs">' + tabs + '</div><section class="detail-layout"><div class="detail-main"><article class="panel"><div class="panel-head"><div><h2>Hoy</h2><p>Registro de asistencia simulado.</p></div>' + badge(employee.attendanceStatus) + '</div><div class="panel-body"><div class="summary-grid"><div class="summary-item"><small>Turno</small><strong>' + esc(employee.shift) + '</strong></div><div class="summary-item"><small>Entrada</small><strong>' + esc(employee.entry) + '</strong></div><div class="summary-item"><small>Método</small><strong>' + esc(employee.method) + '</strong></div><div class="summary-item"><small>Esta semana</small><strong>' + esc(employee.weekHours) + '</strong></div><div class="summary-item"><small>Horas extra</small><strong>' + esc(employee.overtime) + '</strong></div><div class="summary-item"><small>Sede</small><strong>' + esc(employee.worksite) + '</strong></div></div></div></article><article class="panel app-connection"><div class="panel-head"><div><span class="premium-kicker">NexCourier Employee App</span><h2>Conexión futura</h2><p>Visualización informativa; no existe device binding real.</p></div></div><div class="panel-body"><div class="summary-grid"><div class="summary-item"><small>Device</small><strong>' + esc(employee.device) + '</strong></div><div class="summary-item"><small>Última asistencia</small><strong>' + esc(employee.entry) + ' · ' + esc(employee.method) + '</strong></div><div class="summary-item"><small>Role experience</small><strong>' + esc(employee.roleExperience) + '</strong></div><div class="summary-item"><small>App access</small><strong>' + esc(employee.appAccess) + '</strong></div></div></div></article></div><aside class="panel"><div class="panel-head"><div><h2>Control de acceso</h2><p>Concepto demo.</p></div></div><div class="panel-body"><div class="notice-box"><strong>Permisos por familia</strong><span>' + esc(employee.family) + ' mantiene permisos separados y no intercambiables.</span></div><button class="button button--quiet" type="button" data-action="protected-role-change">Cambiar rol demo</button></div></aside></section>';
  }

  function renderAttendance() {
    const rows = premium.employees.map(function attendanceRow(item) { return ['<button class="text-link" type="button" data-route="employee" data-id="' + esc(item.employeeId) + '">' + esc(item.name) + "</button>", esc(item.family), esc(item.shift), esc(item.entry), esc(item.exit), badge(item.method, "neutral"), badge(item.attendanceStatus), '<button class="button button--small button--quiet" type="button" data-action="attendance-detail" data-id="' + esc(item.employeeId) + '">Ver evento</button>']; });
    return pageHead("Asistencia", "Estado del turno actual con NFC y Dynamic QR simulados.", '<button class="button button--quiet" type="button" data-action="review-correction">Revisar corrección</button>') + '<section class="management-metrics management-metrics--five"><article class="management-metric"><span>Esperados hoy</span><strong>18</strong><small>Demo</small></article><article class="management-metric"><span>Presentes</span><strong>17</strong><small>Demo</small></article><article class="management-metric"><span>Ausentes</span><strong>1</strong><small>Demo</small></article><article class="management-metric"><span>Tardanzas</span><strong>2</strong><small>Demo</small></article><article class="management-metric"><span>Horas extra</span><strong>6.5 h</strong><small>Demo</small></article></section><section class="notice-box"><strong>Simulación segura</strong><span>Empleado autenticado + dispositivo registrado + geofence + NFC seguro o QR dinámico + timestamp del servidor. No usa GPS, NFC ni QR reales.</span></section><section class="panel"><div class="panel-head"><div><h2>Turno actual</h2><p>Registros determinísticos de demostración.</p></div></div>' + simpleTable(["Empleado", "Tipo", "Turno", "Entrada", "Salida", "Método", "Estado", "Acción"], rows) + '</section>';
  }

  function renderSchedules() {
    const rows = premium.employees.map(function scheduleRow(item) { return [esc(item.name), esc(item.role), esc(item.shift), esc(item.shift), esc(item.shift), esc(item.shift), esc(item.shift), item.family === "Courier" ? "08:00–13:00" : "—", '<button class="button button--small button--quiet" type="button" data-action="edit-schedule" data-id="' + esc(item.employeeId) + '">Editar</button>']; });
    return pageHead("Horarios", "Planificación semanal local para la demostración.", badge("Sesión local", "neutral")) + '<section class="panel">' + simpleTable(["Empleado", "Rol", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Acción"], rows) + '</section>';
  }

  function renderOvertime() {
    const rows = premium.overtime.map(function overtimeRow(item) { return [esc(item[0]), esc(item[1]), esc(item[2]), esc(item[3]), "<strong>" + esc(item[4]) + "</strong>", esc(item[5]), badge(item[6]), '<div class="table-actions"><button class="button button--small button--quiet" type="button" data-action="overtime-review">Revisar</button><button class="button button--small button--primary" type="button" data-action="overtime-approve">Aprobar demo</button><button class="button button--small button--danger" type="button" data-action="overtime-reject">Rechazar demo</button></div>']; });
    return pageHead("Horas extra", "Revisión gerencial sin cálculo de nómina.", badge("6.5 h · Demo", "warning")) + '<section class="panel">' + simpleTable(["Empleado", "Fecha", "Programado", "Trabajado", "Horas extra", "Motivo", "Estado", "Acciones"], rows) + '</section>';
  }

  function renderPersonnelPayments() {
    const rows = premium.payments.map(function paymentRow(item) { return [esc(item[0]), esc(item[1]), esc(item[2]), esc(item[3]), esc(item[4]), esc(item[5]), badge(item[6]), '<button class="button button--small button--quiet" type="button" data-action="personnel-payment-review">Revisar</button>']; });
    return pageHead("Pagos personal", "Vista de gestión con importes protegidos.", badge("Sin nómina real", "neutral")) + '<section class="notice-box notice-box--warning"><strong>Datos protegidos</strong><span>No se muestran salarios reales ni se realizan cálculos de payroll.</span></section><section class="panel">' + simpleTable(["Empleado", "Período", "Horas", "Horas extra", "Bono demo", "Deducción demo", "Estado", "Acción"], rows) + '</section>';
  }

  function normalizeText(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function aiAnswer(prompt, channel) {
    const query = normalizeText(prompt);
    if (/cambia|cambiar|modifica|entrada.*07:58|asistencia.*empleado/.test(query)) {
      return '<div class="ai-safety"><span class="premium-kicker">Acción protegida</span><h3>Este registro no puede cambiarse automáticamente.</h3><p>Puedo preparar una solicitud de corrección para aprobación gerencial.</p><div class="confirm-summary"><div><small>Empleado</small><strong>Operador Courier Demo</strong></div><div><small>Actual</small><strong>08:17</strong></div><div><small>Solicitado</small><strong>07:58</strong></div><div><small>Requiere</small><strong>Aprobación gerencial</strong></div></div><button class="button button--primary" type="button" data-action="prepare-correction">Preparar corrección</button></div>';
    }
    if (/excel.*asistencia|asistencia.*excel/.test(query)) {
      return workbookResult("NexCourier_Asistencia_Septiembre.xlsx", ["Resumen", "Courier", "Aduana", "Horas extra", "Tardanzas", "Ausencias"], "18 empleados demo · registros de asistencia · septiembre 2026");
    }
    if (/excel|reporte.*septiembre/.test(query) && /gasto|septiembre/.test(query)) {
      return workbookResult("NexCourier_Gastos_Septiembre.xlsx", ["Resumen", "Aeropuerto", "Administración", "Personal", "Proveedores", "Gráficos"], "12 gastos demo · septiembre 2026 · 6 centros de costo");
    }
    if (/reporte mensual|gerencia/.test(query)) {
      return '<div class="ai-result"><span class="premium-kicker">Reporte mensual de gerencia</span><h3>Resumen preparado</h3><div class="result-sections"><section><strong>Operación</strong><p>82 recibidos hoy · 4 no identificados · 7 documentos pendientes.</p></section><section><strong>Finanzas</strong><p>Gastos operativos, administrativos y de personal identificados como DEMO DATA.</p></section><section><strong>Personal</strong><p>18 empleados · 17 presentes · 2 tardanzas · 6.5 h extra demo.</p></section></div><div class="notice-box notice-box--warning"><strong>Recomendación</strong><span>Revisar costos de aeropuerto y tendencia de horas extra.</span></div><div class="card-actions"><button class="button button--quiet" type="button" data-route="reports">Ver reporte</button><button class="button button--primary" type="button" data-action="prepare-excel" data-file="NexCourier_Gerencia_Septiembre.xlsx">Preparar Excel</button></div></div>';
    }
    if (/categoria.*subio|gastos crecieron/.test(query)) return '<div class="ai-result"><h3>Software muestra el mayor crecimiento demo</h3><p>Variación simulada de +18% frente a agosto.</p><div class="evidence-box"><strong>Evidencia</strong><span>Categoría: Software</span><span>2 registros demo · Sep 2026</span></div><button class="button button--quiet" type="button" data-route="expenses">Ver gastos</button></div>';
    if (/administracion/.test(query)) return '<div class="ai-result"><h3>Administración · DEMO ₲ 23.480.000</h3><p>Alquiler, internet, software, oficina y gerencia componen el total simulado.</p><div class="evidence-box"><strong>Evidencia</strong><span>Cost Center: Administración + Gerencia</span><span>4 registros demo · Sep 2026</span></div><button class="button button--quiet" type="button" data-route="expenses">Ver movimientos</button></div>';
    if (/gasto.*personal|personal.*gasto/.test(query)) return '<div class="ai-result"><h3>Gastos de personal · valores protegidos</h3><p>2 registros demo: horas extra y reembolso. No se muestran salarios ni cálculos de nómina.</p><div class="evidence-box"><strong>Evidencia</strong><span>Cost Center: Operación Paraguay</span><span>Importes enmascarados</span></div><button class="button button--quiet" type="button" data-route="personnel-payments">Ver gestión</button></div>';
    if (/pendiente.*aprobacion|gastos pendientes/.test(query)) return '<div class="ai-result"><h3>4 gastos requieren aprobación o revisión</h3><p>EXP-DEMO-001, EXP-DEMO-005, EXP-DEMO-010 y EXP-DEMO-011.</p><div class="evidence-box"><strong>Evidencia</strong><span>Estado: Pendiente</span><span>Datos demo · Sep 2026</span></div><button class="button button--quiet" type="button" data-route="expenses">Ver pendientes</button></div>';
    if (/analiza.*gasto|gastos.*septiembre/.test(query)) return '<div class="ai-result"><h3>Análisis de gastos · Septiembre</h3><p>Operación concentra el mayor volumen demo; aeropuerto y carga aérea son los principales impulsores. Administración permanece estable y personal está protegido.</p><div class="evidence-box"><strong>Evidencia</strong><span>12 gastos demo</span><span>6 centros de costo</span><span>PYG + USD, sin conversión contable real</span></div><button class="button button--quiet" type="button" data-route="finance">Ver finanzas</button></div>';
    if (/compara|agosto.*septiembre/.test(query)) return '<div class="ai-result"><h3>Septiembre sube 8,4% demo vs. agosto</h3><p>La variación se concentra en aeropuerto, software y horas extra.</p><div class="evidence-box"><strong>Evidencia</strong><span>Comparativo mensual simulado</span><span>Sin contabilidad real</span></div><button class="button button--quiet" type="button" data-route="reports">Ver comparativo</button></div>';
    if (/exp-demo-001|que contiene.*001|qué contiene.*001/.test(query)) {
      return '<div class="ai-result"><span class="premium-kicker">EXP-DEMO-001</span><h3>Aeropuerto / Handling</h3><p>Total: <strong>₲ 18.400.000</strong></p><div class="breakdown-list"><span><b>Handling</b><strong>₲ 8.500.000</strong></span><span><b>Carga / descarga</b><strong>₲ 3.200.000</strong></span><span><b>Almacenaje</b><strong>₲ 2.700.000</strong></span><span><b>Documentación</b><strong>₲ 1.500.000</strong></span><span><b>Transporte interno</b><strong>₲ 2.500.000</strong></span></div><div class="evidence-box"><strong>Evidencia</strong><span>Expense record</span><span>5 expense lines</span><span>Receipt demo</span></div><button class="button button--quiet" type="button" data-route="expense" data-id="EXP-DEMO-001">Ver gasto</button></div>';
    }
    if (/aeropuerto/.test(query)) {
      return '<div class="ai-result"><span class="premium-kicker">Gastos aeropuerto · Septiembre</span><h3>DEMO ₲ 35.450.000</h3><div class="breakdown-list"><span><b>Handling</b><strong>42%</strong></span><span><b>Transporte</b><strong>21%</strong></span><span><b>Documentación</b><strong>18%</strong></span><span><b>Otros</b><strong>19%</strong></span></div><div class="evidence-box"><strong>Evidencia</strong><span>Cost Center: Aeropuerto</span><span>Período: Sep 2026</span><span>12 demo expense records</span></div><div class="card-actions"><button class="button button--quiet" type="button" data-route="expenses">Ver movimientos</button><button class="button button--primary" type="button" data-action="prepare-excel" data-file="NexCourier_Aeropuerto_Septiembre.xlsx">Preparar Excel</button></div></div>';
    }
    if (/tarde|tardanza/.test(query)) return '<div class="ai-result"><h3>2 tardanzas hoy</h3><p>Supervisor Aduana Demo registró 08:12. Otro registro demo está agregado al total gerencial.</p><div class="evidence-box"><strong>Evidencia</strong><span>Asistencia · 18 empleados demo</span><span>Turno base · 08:00–17:00</span></div><button class="button button--quiet" type="button" data-route="attendance">Ver asistencia</button></div>';
    if (/resumi.*asistencia|asistencia de hoy/.test(query)) return '<div class="ai-result"><h3>Asistencia de hoy</h3><p>17 presentes · 1 ausente · 2 tardanzas · 6.5 h extra demo.</p><div class="evidence-box"><strong>Evidencia</strong><span>18 empleados demo esperados</span><span>NFC y Dynamic QR simulados</span></div><button class="button button--quiet" type="button" data-route="attendance">Ver asistencia</button></div>';
    if (/cuantas horas trabajo|horas trabajo operador courier/.test(query)) return '<div class="ai-result"><h3>Operador Courier Demo · 39h 22m</h3><p>Total semanal simulado. Incluye 2h 10m extra pendientes.</p><div class="evidence-box"><strong>Evidencia</strong><span>EMP-COURIER-001</span><span>Semana demo actual</span></div><button class="button button--quiet" type="button" data-route="employee" data-id="EMP-COURIER-001">Ver empleado</button></div>';
    if (/revisa.*asistencia|asistencia.*semana/.test(query)) return '<div class="ai-result"><h3>Asistencia semanal revisada</h3><p>Courier concentra 5h 30m extra demo; Aduana registra 1 tardanza visible y 1 adicional agregada.</p><div class="evidence-box"><strong>Evidencia</strong><span>18 empleados demo</span><span>Semana actual</span></div><button class="button button--quiet" type="button" data-route="attendance">Ver asistencia</button></div>';
    if (/empleados.*hora.*extra|mas horas extra/.test(query)) return '<div class="ai-result"><h3>Supervisor Courier Demo lidera horas extra</h3><p>3h 20m demo, seguido de Operador Courier Demo con 2h 10m.</p><div class="evidence-box"><strong>Evidencia</strong><span>3 registros demo</span><span>Sin cálculo de nómina</span></div><button class="button button--quiet" type="button" data-route="overtime">Ver detalle</button></div>';
    if (/ausente/.test(query)) return '<div class="ai-result"><h3>1 ausencia demo</h3><p>La identidad permanece omitida en esta presentación.</p><div class="evidence-box"><strong>Evidencia</strong><span>17 de 18 presentes</span><span>Período: hoy</span></div></div>';
    if (/hora.*extra|cuantas horas/.test(query)) return '<div class="ai-result"><h3>6.5 h extra pendientes</h3><p>Courier concentra la mayor parte de las horas pendientes de aprobación.</p><div class="evidence-box"><strong>Evidencia</strong><span>3 registros demo</span><span>Sin cálculo de nómina</span></div><button class="button button--quiet" type="button" data-route="overtime">Ver horas extra</button></div>';
    if (/018401|que falta/.test(query)) return '<div class="ai-result"><h3>NXP-26-018401 requiere atención</h3><p>Falta la factura de compra antes de continuar.</p><div class="evidence-box"><strong>Evidencia</strong><span>Estado: DOCUMENT_REQUIRED</span><span>Cliente: NXC-10482</span></div><button class="button button--quiet" type="button" data-route="package" data-id="NXP-26-018401">Ver paquete</button></div>';
    if (/018392|busca/.test(query)) return '<div class="ai-result"><h3>NXP-26-018392 localizado</h3><p>Amazon · 1.24 kg · recibido en Centro internacional — Demo.</p><div class="evidence-box"><strong>Evidencia</strong><span>Ubicación A-18</span><span>Cliente NXC-10482</span></div><button class="button button--quiet" type="button" data-route="package" data-id="NXP-26-018392">Ver paquete</button></div>';
    if (/shipment|listo/.test(query)) return '<div class="ai-result"><h3>Shipment 94.6% preparado</h3><p>174 paquetes listos y 10 casos requieren revisión.</p><div class="evidence-box"><strong>Evidencia</strong><span>NXS-MIA-ASU-260918-A</span><span>Salida demo 21:30</span></div><button class="button button--quiet" type="button" data-route="shipment" data-id="NXS-MIA-ASU-260918-A">Revisar shipment</button></div>';
    if (/operacion|atencion|miami/.test(query)) return '<div class="ai-result"><h3>3 áreas requieren atención</h3><p>Shipment: 10 revisiones · No identificados: 4 · Documentos: 7.</p><div class="evidence-box"><strong>Evidencia</strong><span>Dashboard operativo actual</span><span>Datos determinísticos demo</span></div></div>';
    return '<div class="ai-result"><h3>Resumen contextual preparado</h3><p>La consulta se procesó localmente sobre ' + esc(channel) + '. Probá con gastos de aeropuerto, asistencia, shipment o un reporte mensual.</p><div class="evidence-box"><strong>Contexto</strong><span>Sin llamadas a IA externa</span><span>Demo determinística</span></div></div>';
  }

  function workbookResult(file, sheets, evidence) {
    return '<div class="workbook-result"><span class="premium-kicker">Reporte preparado</span><h3>' + esc(file) + '</h3><ol>' + sheets.map(function sheet(item, index) { return '<li><b>' + (index + 1) + '</b><span>' + esc(item) + '</span></li>'; }).join("") + '</ol><div class="evidence-box"><strong>Evidencia</strong><span>' + esc(evidence) + '</span></div><p class="demo-disclaimer">Demo — XLSX generation not connected yet.</p><div class="card-actions"><button class="button button--quiet" type="button" data-action="report-preview" data-file="' + esc(file) + '">Ver preview</button><button class="button button--primary" type="button" data-action="simulate-download">Simular descarga</button></div></div>';
  }

  function renderAiQuick(route) {
    if (!aiQuickPanel || !isPremium()) return;
    const context = { mode: "premium", page: route.page, module: /finance|expense|receipt|report/.test(route.page) ? "finance" : /person|attendance|schedule|overtime/.test(route.page) ? "personnel" : "operations", resourceType: route.page === "expense" ? "expense" : route.page === "employee" ? "employee" : route.page, resourceId: route.params.get("id") || null, selectedRecords: [], filters: {}, role: "admin", locale: "es" };
    aiQuickPanel.innerHTML = '<header><div><span class="premium-kicker">✦ AI Quick</span><h2>Asistencia contextual</h2></div><button class="icon-btn" type="button" data-action="toggle-ai-quick" aria-label="Cerrar">' + icon("x") + '</button></header><div class="ai-context"><strong>Contexto activo</strong><span>' + esc(context.module) + ' · ' + esc(context.page) + (context.resourceId ? " · " + esc(context.resourceId) : "") + '</span></div><div class="prompt-chips"><button type="button" data-action="ai-suggestion">¿Qué requiere atención hoy?</button><button type="button" data-action="ai-suggestion">¿Cuánto gastamos en aeropuerto este mes?</button><button type="button" data-action="ai-suggestion">¿Quién llegó tarde hoy?</button></div><div class="ai-quick-answer">' + (state.aiQuickAnswer || '<div class="ai-empty"><strong>Preguntá sobre esta pantalla</strong><span>Las respuestas usan datos demo y muestran evidencia.</span></div>') + '</div><form id="aiQuickForm"><label class="sr-only" for="aiQuickInput">Pregunta</label><textarea id="aiQuickInput" name="prompt" placeholder="Escribí una pregunta..." required>' + esc(state.aiQuickPrompt) + '</textarea><button class="button button--primary" type="submit">Consultar</button></form>';
    aiQuickPanel.hidden = !state.aiQuickOpen;
  }

  function renderAiCoworker() {
    const answer = state.coworkerAnswer || '<div class="coworker-welcome"><span class="premium-kicker">Workspace de gestión</span><h2>Un plan visible antes de cada resultado</h2><p>Elegí una tarea o escribí una instrucción. Nada sensible se ejecuta sin confirmación humana.</p></div>';
    return pageHead("AI Coworker", "Workspace determinístico para análisis, evidencia y acciones preparadas.", badge("Premium · Demo local", "warning")) + '<section class="coworker-layout"><aside class="panel coworker-conversation"><div class="panel-head"><div><h2>Conversación</h2><p>Instrucciones de gestión.</p></div></div><div class="prompt-chips prompt-chips--stack"><button type="button" data-action="coworker-suggestion">Revisá la operación de hoy.</button><button type="button" data-action="coworker-suggestion">Analizá los gastos de septiembre.</button><button type="button" data-action="coworker-suggestion">Preparame el reporte mensual de gerencia.</button><button type="button" data-action="coworker-suggestion">Preparame el Excel de asistencia.</button><button type="button" data-action="coworker-suggestion">Cambiale la asistencia al empleado.</button></div><form id="coworkerForm"><textarea name="prompt" placeholder="Asigná una tarea..." required>' + esc(state.coworkerPrompt) + '</textarea><button class="button button--primary" type="submit">Preparar plan</button></form></aside><main class="panel coworker-results"><div class="panel-head"><div><h2>Plan / Resultados</h2><p>Pasos, hallazgos y entregables.</p></div></div><div class="coworker-output">' + answer + '</div></main><aside class="panel coworker-evidence"><div class="panel-head"><div><h2>Evidencia</h2><p>Fuentes y límites.</p></div></div><div class="panel-body"><div class="document-row"><span><strong>Operación</strong><small>Registros canónicos demo</small></span>' + badge("Local", "success") + '</div><div class="document-row"><span><strong>Finanzas</strong><small>12 gastos simulados</small></span>' + badge("Demo", "warning") + '</div><div class="document-row"><span><strong>Personal</strong><small>Identidades ficticias</small></span>' + badge("Demo", "warning") + '</div><div class="notice-box"><strong>Sin red</strong><span>No hay LLM, RAG, embeddings ni llamadas externas.</span></div></div></aside></section>';
  }

  const renderers = {
    dashboard: renderDashboard,
    reception: renderReception,
    packages: renderPackages,
    package: renderPackageDetail,
    unidentified: renderUnidentified,
    documents: renderDocuments,
    warehouse: renderWarehouse,
    shipments: renderShipments,
    shipment: renderShipmentDetail,
    arrivals: renderArrivals,
    customers: renderCustomers,
    customer: renderCustomerDetail,
    support: renderSupport,
    deliveries: renderDeliveries,
    payments: renderPayments,
    billing: renderBilling,
    team: renderTeam,
    audit: renderAudit,
    settings: renderSettings,
    finance: renderFinance,
    expenses: renderExpenses,
    expense: renderExpenseDetail,
    receipts: renderReceipts,
    reports: renderReports,
    personnel: renderPersonnel,
    employee: renderEmployeeDetail,
    attendance: renderAttendance,
    schedules: renderSchedules,
    overtime: renderOvertime,
    "personnel-payments": renderPersonnelPayments,
    "ai-coworker": renderAiCoworker,
  };

  function currentRoute() {
    const params = new URLSearchParams(global.location.search);
    const requestedPage = params.get("page");
    let page = requestedPage === "configuration" ? "settings" : renderers[requestedPage] ? requestedPage : "dashboard";
    if (!isPremium() && premiumPages.includes(page)) page = "dashboard";
    return { page: page, params: params };
  }

  function updateNavigation(page) {
    const navPage = page === "package" ? "packages" : page === "shipment" ? "shipments" : page === "customer" ? "customers" : page;
    document.querySelectorAll("#mainNav [data-route]").forEach(function setCurrent(link) {
      const active = link.dataset.route === navPage;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    });
  }

  function renderCurrent() {
    const route = currentRoute();
    document.body.dataset.mode = activeMode();
    document.querySelectorAll("[data-premium-only]").forEach(function togglePremium(element) {
      element.hidden = !isPremium();
    });
    document.querySelectorAll('[data-action="set-mode"]').forEach(function toggleMode(button) {
      button.classList.toggle("is-active", button.dataset.mode === activeMode());
      button.setAttribute("aria-pressed", String(button.dataset.mode === activeMode()));
    });
    const productChip = document.querySelector("#productChip");
    if (productChip) {
      productChip.textContent = isPremium() ? "Premium" : "Standard";
      productChip.classList.toggle("is-premium", isPremium());
    }
    view.innerHTML = renderers[route.page](route.params);
    updateNavigation(route.page);
    document.title = titles[route.page] + " — NexCourier Admin " + (isPremium() ? "Premium" : "Standard") + " Demo";
    renderAiQuick(route);
    view.focus({ preventScroll: true });
    global.scrollTo(0, 0);
    if (isPremium() && route.params.get("action") === "new" && route.page === "expenses") openExpenseEditor();
    if (isPremium() && route.params.get("action") === "edit" && route.page === "expense") {
      const expenseItem = findExpense(route.params.get("id") || "EXP-DEMO-001");
      if (expenseItem) openExpenseEditor(expenseItem);
    }
  }

  function navigate(page, id) {
    global.history.pushState({}, "", routeHref(page, id));
    closeTransient();
    document.body.classList.remove("sidebar-open");
    renderCurrent();
  }

  function navigateExpenseAction(action, id) {
    const params = new URLSearchParams({ page: id ? "expense" : "expenses", mode: "premium", action: action });
    if (id) params.set("id", id);
    global.history.pushState({}, "", "?" + params.toString());
    closeTransient();
    renderCurrent();
  }

  function closeTransient() {
    searchResults.hidden = true;
    globalSearch.setAttribute("aria-expanded", "false");
    notificationPanel.hidden = true;
    const bell = document.querySelector('[data-action="toggle-notifications"]');
    if (bell) bell.setAttribute("aria-expanded", "false");
  }

  function showToast(title, message) {
    toast.innerHTML = icon("check") + '<span><strong>' + esc(title) + '</strong><span>' + esc(message) + '</span></span><button type="button" data-action="close-toast" aria-label="Cerrar mensaje">' + icon("x") + "</button>";
    toast.hidden = false;
    global.clearTimeout(state.toastTimer);
    state.toastTimer = global.setTimeout(function hideToast() { toast.hidden = true; }, 4200);
  }

  function showModal(title, subtitle, body, actions) {
    modalLayer.classList.remove("is-expense-drawer");
    modalLayer.innerHTML = '<div class="modal-backdrop" data-action="close-modal"></div><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><button class="modal-close" type="button" data-action="close-modal" aria-label="Cerrar">' + icon("x") + '</button><div class="modal-head"><h2 id="modalTitle">' + esc(title) + '</h2><p>' + esc(subtitle) + '</p></div><div class="modal-body">' + body + '</div><div class="modal-actions">' + actions + "</div></section>";
    modalLayer.hidden = false;
    document.body.classList.add("modal-open");
    const focusTarget = modalLayer.querySelector("button:not(.modal-close)") || modalLayer.querySelector(".modal-close");
    if (focusTarget) focusTarget.focus();
  }

  function closeModal() {
    modalLayer.hidden = true;
    modalLayer.innerHTML = "";
    modalLayer.classList.remove("is-expense-drawer");
    document.body.classList.remove("modal-open");
  }

  function documentRequestModal(packageId) {
    const pack = data.packages.find(function findDocumentPack(item) { return item.packageId === packageId; }) || data.packages[1];
    const body = '<div class="confirm-summary"><div><small>Cliente</small><strong>' + esc(pack.customerName) + '</strong></div><div><small>Paquete</small><strong>' + esc(pack.packageId) + '</strong></div><div><small>Documento</small><strong>Factura de compra</strong></div></div><label class="field" for="documentMessage"><span>Mensaje</span><textarea id="documentMessage">Necesitamos la factura de este paquete para continuar con el proceso.</textarea></label><div class="notice-box"><strong>Simulación segura</strong><span>No se enviará ningún mensaje real.</span></div>';
    showModal("Solicitar documento", "Preparar una solicitud para el cliente.", body, '<button class="button button--quiet" type="button" data-action="close-modal">Cancelar</button><button class="button button--primary" type="button" data-action="simulate-document-request">Simular solicitud</button>');
  }

  function searchCatalog(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const results = [];
    data.packages.forEach(function searchPackage(pack) {
      if ([pack.packageId, pack.externalTracking, pack.customerId, pack.customerName, pack.merchant].join(" ").toLowerCase().includes(normalized)) {
        results.push({ type: "Paquete", title: pack.packageId, detail: pack.merchant + " · Tracking " + pack.externalTracking, page: "package", id: pack.packageId });
      }
    });
    data.customers.forEach(function searchCustomer(customer) {
      if ([customer.customerId, customer.lockerCode, customer.name, customer.email].join(" ").toLowerCase().includes(normalized)) {
        results.push({ type: "Cliente", title: customer.customerId, detail: customer.name + " · Casillero " + customer.lockerCode, page: "customer", id: customer.customerId });
      }
    });
    data.shipments.forEach(function searchShipment(shipment) {
      if ([shipment.shipmentId, shipment.route].join(" ").toLowerCase().includes(normalized)) {
        results.push({ type: "Shipment", title: shipment.shipmentId, detail: shipment.route + " · " + shipment.adminStatus, page: "shipment", id: shipment.shipmentId });
      }
    });
    return results.slice(0, 7);
  }

  function displaySearchResults() {
    const query = globalSearch.value;
    const results = searchCatalog(query);
    if (!query.trim()) {
      searchResults.hidden = true;
      globalSearch.setAttribute("aria-expanded", "false");
      return;
    }
    searchResults.innerHTML = '<div class="search-caption">Resultados de demo</div>' + (results.length ? results.map(function searchResult(item) {
      return '<button class="search-result" type="button" role="option" data-route="' + esc(item.page) + '" data-id="' + esc(item.id) + '"><span class="result-type">' + esc(item.type) + '</span><span><strong>' + esc(item.title) + '</strong><small>' + esc(item.detail) + "</small></span></button>";
    }).join("") : '<div class="empty-search"><strong>Sin resultados</strong><span>No encontramos coincidencias en los datos demo.</span></div>');
    searchResults.hidden = false;
    globalSearch.setAttribute("aria-expanded", "true");
  }

  function displayNotifications() {
    notificationPanel.innerHTML = '<div class="notification-head"><strong>Notificaciones</strong><span class="demo-label">Demo</span></div><div class="notification-list">' + data.notifications.map(function notificationItem(item) {
      return '<button class="notification-item" type="button" data-route="' + esc(item.page) + '"' + (item.id ? ' data-id="' + esc(item.id) + '"' : "") + '><i class="notification-dot' + (item.unread ? "" : " is-read") + '"></i><span><strong>' + esc(item.title) + '</strong><small>' + esc(item.detail) + '</small><span class="notification-time">' + esc(item.time) + "</span></span></button>";
    }).join("") + "</div>";
  }

  function filterPackageTable() {
    const query = (document.querySelector("#packageSearch") || {}).value || "";
    const status = (document.querySelector("#statusFilter") || {}).value || "";
    const normalized = query.trim().toLowerCase();
    const matches = data.packages.filter(function packageFilter(pack) {
      const textMatches = !normalized || [pack.packageId, pack.externalTracking, pack.customerId, pack.customerName, pack.merchant].join(" ").toLowerCase().includes(normalized);
      return textMatches && (!status || pack.adminStatus === status);
    });
    const rows = document.querySelector("#packageRows");
    if (rows) rows.innerHTML = packageTableRows(matches);
  }

  function filterCustomerTable() {
    const input = document.querySelector("#customerSearch");
    const normalized = input ? input.value.trim().toLowerCase() : "";
    const matches = data.customers.filter(function customerFilter(customer) {
      return !normalized || [customer.customerId, customer.lockerCode, customer.name, customer.email].join(" ").toLowerCase().includes(normalized);
    });
    const rows = document.querySelector("#customerRows");
    if (rows) rows.innerHTML = customerRows(matches);
  }

  function updateExpenseEditorFromControl(control) {
    const editor = state.expenseEditor;
    if (!editor) return false;
    if (control.dataset.expenseField) {
      const field = control.dataset.expenseField;
      editor[field] = field === "amountValue" ? Math.max(0, Number(control.value) || 0) : control.value;
      updateExpenseDrawerTotals();
      return true;
    }
    if (control.dataset.lineField) {
      const line = editor.lines[Number(control.dataset.lineIndex)];
      if (!line) return true;
      const field = control.dataset.lineField;
      line[field] = field === "description" ? control.value : Math.max(0, Number(control.value) || 0);
      updateExpenseDrawerTotals();
      return true;
    }
    if (control.dataset.relationshipField) {
      const field = control.dataset.relationshipField;
      editor.relationship[field] = control.value;
      if (field === "type") {
        const first = relationshipResources(control.value)[0] || ["", ""];
        editor.relationship.resourceId = first[0];
        editor.relationship.label = first[1];
      } else {
        const resource = relationshipResources(editor.relationship.type).find(function findResource(item) { return item[0] === control.value; });
        editor.relationship.label = resource ? resource[1] : "";
      }
      renderExpenseDrawer();
      return true;
    }
    if (control.dataset.receiptField && editor.receiptDocument) {
      editor.receiptDocument[control.dataset.receiptField] = control.value;
      return true;
    }
    return false;
  }

  function handleSubmit(event) {
    if (event.target.id === "expenseEditorForm") {
      event.preventDefault();
      showExpenseSaveConfirmation();
    } else if (event.target.id === "expenseEditConfirmForm") {
      event.preventDefault();
      const reason = new FormData(event.target).get("reason").trim();
      if (!reason) { showToast("Motivo requerido", "Indicá por qué cambió el monto."); return; }
      commitExpenseEdit(reason);
    } else if (event.target.id === "lookupForm") {
      event.preventDefault();
      const tracking = new FormData(event.target).get("tracking").trim();
      state.receptionConfirmed = false;
      state.reception = tracking === data.reception.knownTracking ? "known" : tracking === data.reception.exceptionTracking ? "exception" : "not-found";
      if (state.reception === "not-found") {
        showToast("Tracking sin resultados", "No hay coincidencias en los datos de demostración.");
        state.reception = "idle";
      }
      renderCurrent();
      const result = document.querySelector("#receptionResult");
      if (result) result.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (event.target.id === "receptionForm") {
      event.preventDefault();
      const body = '<div class="confirm-summary"><div><small>Paquete</small><strong>NXP-26-018392</strong></div><div><small>Cliente</small><strong>NXC-10482</strong></div><div><small>Peso</small><strong>1.24 kg</strong></div><div><small>Ubicación</small><strong>A-18</strong></div></div><div class="notice-box"><strong>Acción de demostración</strong><span>No existe una escritura a backend.</span></div>';
      showModal("Confirmar recepción", "Revisá los datos antes de continuar.", body, '<button class="button button--quiet" type="button" data-action="close-modal">Cancelar</button><button class="button button--primary" type="button" data-action="confirm-reception">Confirmar demo</button>');
    } else if (event.target.id === "aiQuickForm") {
      event.preventDefault();
      state.aiQuickPrompt = new FormData(event.target).get("prompt").trim();
      state.aiQuickAnswer = aiAnswer(state.aiQuickPrompt, "AI Quick");
      renderAiQuick(currentRoute());
    } else if (event.target.id === "coworkerForm") {
      event.preventDefault();
      state.coworkerPrompt = new FormData(event.target).get("prompt").trim();
      state.coworkerAnswer = '<div class="coworker-plan"><span class="premium-kicker">Plan preparado</span><ol><li>Revisar contexto y período</li><li>Consultar registros demo</li><li>Agrupar hallazgos</li><li>Mostrar evidencia</li><li>Preparar acciones para confirmación</li></ol></div>' + aiAnswer(state.coworkerPrompt, "AI Coworker");
      renderCurrent();
    }
  }

  function handleAction(action, element) {
    if (action === "open-sidebar") document.body.classList.add("sidebar-open");
    else if (action === "set-mode") {
      const params = new URLSearchParams(global.location.search);
      const nextMode = element.dataset.mode === "premium" ? "premium" : "standard";
      params.set("mode", nextMode);
      if (nextMode === "standard" && premiumPages.includes(params.get("page"))) params.set("page", "dashboard");
      global.history.pushState({}, "", "?" + params.toString());
      state.aiQuickOpen = false;
      renderCurrent();
    } else if (action === "toggle-ai-quick") {
      state.aiQuickOpen = !state.aiQuickOpen;
      renderAiQuick(currentRoute());
    } else if (action === "ai-suggestion") {
      state.aiQuickPrompt = element.textContent.trim();
      state.aiQuickAnswer = aiAnswer(state.aiQuickPrompt, "AI Quick");
      state.aiQuickOpen = true;
      renderAiQuick(currentRoute());
    } else if (action === "coworker-suggestion") {
      state.coworkerPrompt = element.textContent.trim();
      state.coworkerAnswer = '<div class="coworker-plan"><span class="premium-kicker">Plan preparado</span><ol><li>Revisar contexto y período</li><li>Consultar registros demo</li><li>Agrupar hallazgos</li><li>Mostrar evidencia</li><li>Preparar acciones para confirmación</li></ol></div>' + aiAnswer(state.coworkerPrompt, "AI Coworker");
      renderCurrent();
    } else if (action === "expense-tab") {
      state.expenseTab = element.dataset.tab;
      renderCurrent();
    } else if (action === "expense-create") {
      navigateExpenseAction("new");
    } else if (action === "expense-edit") {
      navigateExpenseAction("edit", element.dataset.id || currentRoute().params.get("id") || "EXP-DEMO-001");
    } else if (action === "cancel-expense-editor") {
      state.expenseEditor = null;
      state.pendingExpense = null;
      clearExpenseActionAndRender(currentRoute().page, currentRoute().params.get("id"));
    } else if (action === "return-expense-editor") {
      renderExpenseDrawer();
    } else if (action === "expense-entry-mode") {
      state.expenseEditor.entryMode = element.dataset.mode;
      if (state.expenseEditor.entryMode === "itemized" && !state.expenseEditor.lines.length) state.expenseEditor.lines.push({ id: "LINE-" + Date.now(), description: "", quantity: 1, unitPrice: 0, subtotal: 0 });
      renderExpenseDrawer();
    } else if (action === "expense-add-line") {
      state.expenseEditor.lines.push({ id: "LINE-" + Date.now(), description: "", quantity: 1, unitPrice: 0, subtotal: 0 });
      renderExpenseDrawer();
      const concepts = modalLayer.querySelectorAll('[data-line-field="description"]');
      if (concepts.length) concepts[concepts.length - 1].focus();
    } else if (action === "expense-remove-line") {
      state.expenseEditor.lines.splice(Number(element.dataset.lineIndex), 1);
      renderExpenseDrawer();
    } else if (action === "expense-receipt-attach") {
      state.expenseEditor.receiptDocument = { name: "factura-aeropuerto-sep.pdf", kind: "PDF", number: "FAC-DEMO-2409", date: state.expenseEditor.date };
      renderExpenseDrawer();
      showToast("Comprobante adjuntado — Demo", "No se cargó ningún archivo a la red.");
    } else if (action === "expense-receipt-remove") {
      state.expenseEditor.receiptDocument = null;
      renderExpenseDrawer();
    } else if (action === "expense-receipt-view" || action === "receipt-demo") {
      const source = state.expenseEditor && state.expenseEditor.receiptDocument ? state.expenseEditor : findExpense(element.dataset.id || currentRoute().params.get("id"));
      const file = source && source.receiptDocument;
      showModal("Comprobante demo", file ? file.name : "Sin comprobante", file ? '<div class="receipt-preview-demo"><span class="receipt-kind">' + esc(file.kind) + '</span><strong>' + esc(file.name) + '</strong><p>Vista simulada. El archivo no existe en almacenamiento real.</p></div>' : '<div class="empty-inline">No hay un documento demo adjunto.</div>', '<button class="button button--primary" type="button" data-action="' + (state.expenseEditor ? "return-expense-editor" : "close-modal") + '">Cerrar</button>');
    } else if (action === "confirm-expense-register") {
      commitExpenseRegistration();
    } else if (action === "confirm-expense-edit") {
      commitExpenseEdit("Edición de datos generales");
    } else if (action === "expense-excel") {
      showToast((element.dataset.kind === "importar" ? "Importar" : "Exportar") + " Excel", "Disponible en la siguiente fase; no se procesó ningún archivo.");
    } else if (action === "expense-more") {
      showToast("Más acciones", "Duplicar y anular estarán disponibles en una fase posterior.");
    } else if (action === "prepare-excel") {
      const file = element.dataset.file || "NexCourier_Gastos_Septiembre.xlsx";
      const body = '<div class="report-progress"><p>✓ Recopilando gastos</p><p>✓ Agrupando categorías</p><p>✓ Calculando subtotales</p><p>✓ Preparando gráficos</p><p>✓ Generando estructura</p></div>' + workbookResult(file, file.indexOf("Asistencia") >= 0 ? ["Resumen", "Courier", "Aduana", "Horas extra", "Tardanzas", "Ausencias"] : ["Resumen", "Aeropuerto", "Administración", "Personal", "Proveedores", "Gráficos"], "Datos determinísticos de esta demostración");
      showModal("Reporte preparado", "Preparación local finalizada.", body, '<button class="button button--quiet" type="button" data-action="close-modal">Cerrar</button><button class="button button--primary" type="button" data-action="simulate-download">Simular descarga</button>');
    } else if (action === "report-preview") {
      showModal("Preview del reporte", element.dataset.file || "Reporte demo", '<div class="workbook-preview"><div><strong>Resumen</strong><span>Totales y variación demo</span></div><div><strong>Detalle</strong><span>Registros y categorías</span></div><div><strong>Gráficos</strong><span>Estructura visual preparada</span></div></div><div class="notice-box"><strong>Demo</strong><span>No se generó un archivo XLSX real.</span></div>', '<button class="button button--primary" type="button" data-action="close-modal">Entendido</button>');
    } else if (action === "simulate-download") {
      closeModal();
      showToast("Descarga simulada", "No se generó ni descargó un XLSX real.");
    } else if (action === "expense-approve") {
      const expenseItem = findExpense(element.dataset.id);
      if (!expenseItem) return;
      const receiptLabel = expenseItem.receiptDocument ? "Adjunto demo" : "Sin comprobante";
      showModal("Aprobar gasto", "La aprobación requiere confirmación humana explícita.", '<div class="confirm-summary"><div><small>Registro</small><strong>' + esc(expenseItem.expenseId) + '</strong></div><div><small>Monto</small><strong>' + esc(formatExpenseMoney(expenseTotal(expenseItem), expenseItem.currency)) + '</strong></div><div><small>Proveedor</small><strong>' + esc(expenseItem.provider) + '</strong></div><div><small>Comprobante</small><strong>' + esc(receiptLabel) + '</strong></div></div><div class="notice-box notice-box--warning"><strong>Acción sensible</strong><span>El resultado solo vive en esta sesión de demostración.</span></div>', '<button class="button button--quiet" type="button" data-action="close-modal">Cancelar</button><button class="button button--primary" type="button" data-action="confirm-expense-approval" data-id="' + esc(expenseItem.expenseId) + '">Aprobar demo</button>');
    } else if (action === "confirm-expense-approval") {
      const expenseItem = findExpense(element.dataset.id);
      if (!expenseItem) return;
      expenseItem.approvalStatus = "Aprobado demo";
      expenseItem.history.push({ date: "18 Sep · 14:26", title: "Gasto aprobado demo", detail: "Admin Demo · Confirmación humana" });
      closeModal();
      renderCurrent();
      showToast("Gasto aprobado para demostración.", "El evento fue agregado a la auditoría local.");
    } else if (action === "review-correction" || action === "prepare-correction") {
      const correction = premium.correction;
      showModal("Solicitud de corrección", "Requiere aprobación de un responsable.", '<div class="confirm-summary"><div><small>Empleado</small><strong>' + esc(correction.employee) + '</strong></div><div><small>Actual</small><strong>' + esc(correction.current) + '</strong></div><div><small>Solicitado</small><strong>' + esc(correction.requested) + '</strong></div><div><small>Motivo</small><strong>' + esc(correction.reason) + '</strong></div></div><div class="notice-box notice-box--warning"><strong>No aplicado</strong><span>La corrección permanece pendiente hasta la confirmación.</span></div>', '<button class="button button--danger" type="button" data-action="reject-correction">Rechazar demo</button><button class="button button--primary" type="button" data-action="approve-correction">Aprobar demo</button>');
    } else if (action === "approve-correction" || action === "reject-correction" || action === "confirm-sensitive-demo") {
      closeModal();
      showToast("Resultado registrado en auditoría demo", "Acción simulada para esta sesión; no hubo escritura persistente.");
    } else if (action === "attendance-detail") {
      const employee = premium.employees.find(function findAttendance(item) { return item.employeeId === element.dataset.id; }) || premium.employees[0];
      showModal("Evento de entrada", "Registro de asistencia simulado.", '<div class="confirm-summary"><div><small>Empleado</small><strong>' + esc(employee.name) + '</strong></div><div><small>Hora</small><strong>' + esc(employee.entry) + '</strong></div><div><small>Método</small><strong>' + esc(employee.method) + '</strong></div><div><small>Device</small><strong>Registered demo device</strong></div><div><small>Location</small><strong>Authorized demo location</strong></div><div><small>Verification</small><strong>Passed</strong></div></div><div class="notice-box"><strong>Sin hardware real</strong><span>No se recopiló GPS ni información de dispositivo.</span></div>', '<button class="button button--primary" type="button" data-action="close-modal">Cerrar</button>');
    } else if (action === "edit-schedule") {
      showModal("Editar horario", "Los cambios viven solo en esta sesión demo.", '<div class="form-grid"><label class="field"><span>Entrada</span><input value="08:00"></label><label class="field"><span>Salida</span><input value="17:00"></label></div>', '<button class="button button--quiet" type="button" data-action="close-modal">Cancelar</button><button class="button button--primary" type="button" data-action="confirm-sensitive-demo">Guardar demo</button>');
    } else if (action === "protected-role-change") {
      showModal("Cambio de rol protegido", "AI no puede cambiar permisos automáticamente.", '<div class="notice-box notice-box--warning"><strong>Requiere administrador autorizado</strong><span>Se puede preparar la solicitud, pero el cambio no se ejecuta en esta demo.</span></div>', '<button class="button button--primary" type="button" data-action="close-modal">Entendido</button>');
    } else if (action === "close-sidebar") document.body.classList.remove("sidebar-open");
    else if (action === "collapse-sidebar") {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      sidebar.classList.toggle("is-collapsed", state.sidebarCollapsed);
      document.querySelector(".admin-layout").classList.toggle("sidebar-is-collapsed", state.sidebarCollapsed);
    } else if (action === "toggle-notifications") {
      const opening = notificationPanel.hidden;
      closeTransient();
      notificationPanel.hidden = !opening;
      element.setAttribute("aria-expanded", String(opening));
    } else if (action === "profile-demo") showToast("Admin Demo", "Perfil operativo simulado, sin autenticación real.");
    else if (action === "close-modal") closeModal();
    else if (action === "close-toast") toast.hidden = true;
    else if (action === "use-exception-tracking") {
      const input = document.querySelector("#trackingInput");
      input.value = data.reception.exceptionTracking;
      input.focus();
    } else if (action === "reset-reception") { state.reception = "idle"; state.receptionConfirmed = false; renderCurrent(); }
    else if (action === "confirm-reception") { closeModal(); state.receptionConfirmed = true; state.reception = "idle"; renderCurrent(); showToast("Recepción confirmada", "NXP-26-018392 actualizado en esta sesión demo."); }
    else if (action === "send-unidentified") { showToast("Enviado a revisión", "El paquete quedó sin propietario asignado."); navigate("unidentified"); }
    else if (action === "photo-demo") showToast("Imagen de demostración", "La captura y almacenamiento de fotos no están conectados.");
    else if (action === "filter-demo") showToast("Filtro de fecha", "El selector avanzado se conectará al backend futuro.");
    else if (action === "document-tab") { state.documentTab = element.dataset.tab; renderCurrent(); }
    else if (action === "delivery-tab") { state.deliveryTab = element.dataset.tab; renderCurrent(); }
    else if (action === "request-document") documentRequestModal(element.dataset.package || canonical.packages[1].packageId);
    else if (action === "simulate-document-request") { closeModal(); showToast("Solicitud preparada", "Simulación completada; no se envió ningún mensaje real."); }
    else if (action === "document-received") showToast("Documento marcado como recibido", "Cambio temporal de demostración.");
    else if (action === "depart-shipment") {
      const shipment = canonical.shipment;
      const body = '<div class="confirm-summary"><div><small>Shipment</small><strong>' + esc(shipment.shipmentId) + '</strong></div><div><small>Ruta</small><strong>' + esc(shipment.route) + '</strong></div><div><small>Paquetes</small><strong>184</strong></div><div><small>Nuevo estado</small><strong>En tránsito</strong></div></div><div class="notice-box notice-box--warning"><strong>Acción de demostración</strong><span>184 paquetes serán mostrados como “En tránsito” únicamente en esta sesión.</span></div>';
      showModal("Confirmar salida del envío", "Validación final antes de simular la salida.", body, '<button class="button button--quiet" type="button" data-action="close-modal">Cancelar</button><button class="button button--primary" type="button" data-action="confirm-departure">Confirmar demo</button>');
    } else if (action === "confirm-departure") { closeModal(); state.shipmentDeparted = true; renderCurrent(); showToast("Envío actualizado", "Estado cambiado a En tránsito para la demostración."); }
    else if (action === "close-shipment") showModal("Cerrar envío", "Validación operativa requerida.", '<div class="notice-box notice-box--warning"><strong>10 casos requieren revisión</strong><span>Resuelva documentos y ubicaciones antes del cierre.</span></div>', '<button class="button button--quiet" type="button" data-action="close-modal">Cancelar</button><button class="button button--navy" type="button" data-route="documents">Ver casos</button>');
    else if (action === "view-manifest") showToast("Manifest demo", "La generación documental real aún no está conectada.");
    else if (action === "show-discrepancies") showToast("2 tipos de discrepancia", "3 faltantes esperados y 1 tracking extra.");
    else if (action === "start-arrival") showToast("Recepción de llegada iniciada", "Simulación local; no se conectó un escáner.");
    else if (action === "review-match") showModal("Revisar coincidencia", "La asignación requiere confirmación humana.", '<div class="confirm-summary"><div><small>Caso</small><strong>' + esc(element.dataset.case) + '</strong></div><div><small>Posible cliente</small><strong>NXC-10482</strong></div><div><small>Evidencia</small><strong>Código parcial · nombre similar</strong></div></div><div class="notice-box notice-box--warning"><strong>No asignado</strong><span>La demostración conserva el paquete en la cola hasta confirmar.</span></div>', '<button class="button button--quiet" type="button" data-action="close-modal">Cancelar</button><button class="button button--navy" type="button" data-action="confirm-match-demo">Confirmar demo</button>');
    else if (action === "confirm-match-demo") { closeModal(); showToast("Coincidencia revisada", "Confirmación simulada; la fuente canónica no fue modificada."); }
    else if (action === "demo-soon") showToast(element.dataset.label || "Función demo", "Próximamente en el sistema conectado.");
    else if (["assign-shipment", "customer-search-demo", "create-case", "support-note", "delivery-demo", "warehouse-lookup", "support-demo", "payment-demo", "billing-demo", "team-demo", "audit-filter", "settings-demo", "employee-tab", "overtime-review", "overtime-approve", "overtime-reject", "personnel-payment-review"].includes(action)) showToast("Acción de demostración", "Interacción preparada como shell; no realiza cambios externos.");
  }

  document.addEventListener("click", function clickHandler(event) {
    const route = event.target.closest("[data-route]");
    if (route) {
      event.preventDefault();
      if (!modalLayer.hidden) closeModal();
      navigate(route.dataset.route, route.dataset.id);
      return;
    }
    const action = event.target.closest("[data-action]");
    if (action) handleAction(action.dataset.action, action);
    if (!event.target.closest(".global-search") && !event.target.closest(".notification-wrap")) closeTransient();
  });

  document.addEventListener("submit", handleSubmit);
  document.addEventListener("input", function inputHandler(event) {
    if (updateExpenseEditorFromControl(event.target)) return;
    if (event.target === globalSearch) displaySearchResults();
    else if (event.target.id === "packageSearch") filterPackageTable();
    else if (event.target.id === "customerSearch") filterCustomerTable();
  });
  document.addEventListener("change", function changeHandler(event) {
    if (updateExpenseEditorFromControl(event.target)) return;
    if (event.target.id === "statusFilter") filterPackageTable();
  });
  document.addEventListener("keydown", function keyboardHandler(event) {
    if (event.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) {
      event.preventDefault();
      globalSearch.focus();
    }
    if (event.key === "Escape") {
      if (!modalLayer.hidden) closeModal();
      closeTransient();
      document.body.classList.remove("sidebar-open");
    }
  });
  global.addEventListener("popstate", function handlePopState() {
    if (!modalLayer.hidden) closeModal();
    state.expenseEditor = null;
    state.pendingExpense = null;
    renderCurrent();
  });

  displayNotifications();
  renderCurrent();
})(window);
