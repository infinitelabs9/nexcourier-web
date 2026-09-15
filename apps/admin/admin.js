(function startNexCourierAdmin(global) {
  "use strict";

  const canonical = global.NEXCOURIER_DEMO_DATA;
  const data = global.NEXCOURIER_ADMIN_DEMO;
  const view = document.querySelector("#appView");
  const sidebar = document.querySelector("#sidebar");
  const globalSearch = document.querySelector("#globalSearch");
  const searchResults = document.querySelector("#searchResults");
  const notificationPanel = document.querySelector("#notificationPanel");
  const modalLayer = document.querySelector("#modalLayer");
  const toast = document.querySelector("#toast");

  if (!canonical || !data || !view) {
    throw new Error("No se pudo iniciar NexCourier Admin Demo.");
  }

  const state = {
    reception: "idle",
    receptionConfirmed: false,
    documentTab: "Pendiente",
    deliveryTab: "pickup",
    shipmentDeparted: false,
    sidebarCollapsed: false,
    toastTimer: null,
  };

  const titles = {
    dashboard: "Dashboard", reception: "Recepción", packages: "Paquetes",
    package: "Detalle de paquete", unidentified: "No identificados", documents: "Documentos",
    warehouse: "Almacén", shipments: "Envíos", shipment: "Detalle de envío",
    arrivals: "Llegadas Paraguay", customers: "Clientes", customer: "Detalle de cliente",
    support: "Soporte", deliveries: "Retiros / Delivery", payments: "Pagos",
    billing: "Facturación", team: "Equipo", audit: "Auditoría", settings: "Configuración",
  };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function replace(character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character];
    });
  }

  function icon(name) {
    return '<svg aria-hidden="true"><use href="#i-' + esc(name) + '"></use></svg>';
  }

  function routeHref(page, id) {
    const params = new URLSearchParams({ page: page });
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

  function renderDashboard() {
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
  };

  function currentRoute() {
    const params = new URLSearchParams(global.location.search);
    const requestedPage = params.get("page");
    const page = requestedPage === "configuration" ? "settings" : renderers[requestedPage] ? requestedPage : "dashboard";
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
    view.innerHTML = renderers[route.page](route.params);
    updateNavigation(route.page);
    document.title = titles[route.page] + " — NexCourier Admin Demo";
    view.focus({ preventScroll: true });
    global.scrollTo(0, 0);
  }

  function navigate(page, id) {
    global.history.pushState({}, "", routeHref(page, id));
    closeTransient();
    document.body.classList.remove("sidebar-open");
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
    modalLayer.innerHTML = '<div class="modal-backdrop" data-action="close-modal"></div><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><button class="modal-close" type="button" data-action="close-modal" aria-label="Cerrar">' + icon("x") + '</button><div class="modal-head"><h2 id="modalTitle">' + esc(title) + '</h2><p>' + esc(subtitle) + '</p></div><div class="modal-body">' + body + '</div><div class="modal-actions">' + actions + "</div></section>";
    modalLayer.hidden = false;
    document.body.classList.add("modal-open");
    const focusTarget = modalLayer.querySelector("button:not(.modal-close)") || modalLayer.querySelector(".modal-close");
    if (focusTarget) focusTarget.focus();
  }

  function closeModal() {
    modalLayer.hidden = true;
    modalLayer.innerHTML = "";
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

  function handleSubmit(event) {
    if (event.target.id === "lookupForm") {
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
    }
  }

  function handleAction(action, element) {
    if (action === "open-sidebar") document.body.classList.add("sidebar-open");
    else if (action === "close-sidebar") document.body.classList.remove("sidebar-open");
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
    else if (["assign-shipment", "customer-search-demo", "create-case", "support-note", "delivery-demo", "warehouse-lookup", "support-demo", "payment-demo", "billing-demo", "team-demo", "audit-filter", "settings-demo"].includes(action)) showToast("Acción de demostración", "Interacción preparada como shell; no realiza cambios externos.");
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
    if (event.target === globalSearch) displaySearchResults();
    else if (event.target.id === "packageSearch") filterPackageTable();
    else if (event.target.id === "customerSearch") filterCustomerTable();
  });
  document.addEventListener("change", function changeHandler(event) {
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
  global.addEventListener("popstate", renderCurrent);

  displayNotifications();
  renderCurrent();
})(window);
