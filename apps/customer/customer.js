(function buildCustomerPortal(global) {
  "use strict";

  const canonical = global.NEXCOURIER_DEMO_DATA;
  const demo = global.NEXCOURIER_CUSTOMER_DEMO;
  const view = document.querySelector("#appView");
  const sidebar = document.querySelector("#sidebar");
  const searchInput = document.querySelector("#globalSearch");
  const searchResults = document.querySelector("#searchResults");
  const notificationPanel = document.querySelector("#notificationPanel");
  const modalLayer = document.querySelector("#modalLayer");
  const modalTitle = document.querySelector("#modalTitle");
  const modalSubtitle = document.querySelector("#modalSubtitle");
  const modalBody = document.querySelector("#modalBody");
  const modalActions = document.querySelector("#modalActions");
  const toast = document.querySelector("#toast");
  const toastTitle = document.querySelector("#toastTitle");
  const toastMessage = document.querySelector("#toastMessage");

  if (!canonical || !demo || !view) {
    if (view) view.innerHTML = '<div class="empty-state">No se pudo cargar la información de demostración.</div>';
    return;
  }

  const customer = canonical.customer;
  const locker = canonical.customerLocker;
  const amazon = canonical.packages.find(function findPackage(item) { return item.packageId === "NXP-26-018392"; });
  const shein = canonical.packages.find(function findPackage(item) { return item.packageId === "NXP-26-018401"; });
  const state = { packageFilter: "all", invoiceSelected: false, invoiceUploaded: false, calculation: false };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function replace(character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character];
    });
  }

  function icon(name) { return '<svg aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function routeUrl(page, id) { return "?page=" + encodeURIComponent(page) + (id ? "&id=" + encodeURIComponent(id) : ""); }
  function currentRoute() {
    const params = new URLSearchParams(global.location.search);
    return { page: params.get("page") || "dashboard", id: params.get("id") || "" };
  }
  function findPackage(id) { return canonical.packages.find(function match(item) { return item.packageId === id; }); }
  function packageLabel(item) { return item.packageId === shein.packageId ? demo.labels.action : demo.labels.received; }
  function packageMessage(item) { return item.packageId === shein.packageId ? demo.labels.actionMessage : "Recibido en nuestro centro de recepción."; }
  function badge(item) { return '<span class="badge ' + (item.requiresAction ? "badge--attention" : "") + '">' + esc(packageLabel(item)) + '</span>'; }

  function showToast(title, message) {
    toastTitle.textContent = title;
    toastMessage.textContent = message || "";
    toast.hidden = false;
    global.clearTimeout(showToast.timer);
    showToast.timer = global.setTimeout(function hideToast() { toast.hidden = true; }, 4200);
  }

  function showModal(title, subtitle, body, actions) {
    modalTitle.textContent = title;
    modalSubtitle.textContent = subtitle || "";
    modalBody.innerHTML = body;
    modalActions.innerHTML = actions || '<button class="button button--primary" type="button" data-action="close-modal">Cerrar</button>';
    modalLayer.hidden = false;
    document.body.style.overflow = "hidden";
    const focusTarget = modalLayer.querySelector("input, select, textarea, button");
    if (focusTarget) global.setTimeout(function focusModal() { focusTarget.focus(); }, 0);
  }

  function closeModal() {
    modalLayer.hidden = true;
    document.body.style.overflow = "";
  }

  function closeTransient() {
    searchResults.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
    notificationPanel.hidden = true;
    const bell = document.querySelector('[data-action="toggle-notifications"]');
    if (bell) bell.setAttribute("aria-expanded", "false");
  }

  function pageHead(title, subtitle, actions) {
    return '<header class="page-head"><div><h1>' + esc(title) + '</h1><p>' + esc(subtitle) + '</p></div>' + (actions ? '<div class="page-actions">' + actions + '</div>' : "") + '</header>';
  }

  function renderDashboard() {
    const attentionCopy = state.invoiceUploaded ? "Factura recibida — Demo. El paquete puede continuar en esta sesión." : "Necesitamos la factura de compra para continuar con tu paquete.";
    const attentionActions = state.invoiceUploaded ? '<span class="badge badge--success">Factura recibida — Demo</span><button class="button" type="button" data-route="package" data-id="NXP-26-018401">Ver paquete</button>' : '<button class="button button--primary" type="button" data-action="upload-invoice" data-id="NXP-26-018401">Adjuntar factura</button><button class="button" type="button" data-route="package" data-id="NXP-26-018401">Ver paquete</button>';
    return '<section class="welcome-strip"><div><h1>Buenos días, Cliente Demo</h1><p>Este es el estado de tus envíos.</p></div><div class="customer-code"><small>Código NexCourier</small><div><strong>' + esc(customer.customerId) + '</strong><button class="button button--small" type="button" data-copy="' + esc(customer.customerId) + '" aria-label="Copiar código NexCourier">' + icon("copy") + 'Copiar</button></div></div></section>' +
      '<section class="metric-grid" aria-label="Resumen de paquetes"><article class="metric-card"><span>En nuestro centro</span><strong>' + demo.dashboard.atCenter + '</strong></article><article class="metric-card"><span>En camino</span><strong>' + demo.dashboard.inTransit + '</strong></article><article class="metric-card metric-card--attention"><span>Requiere atención</span><strong>' + demo.dashboard.attention + '</strong></article><article class="metric-card"><span>Listos para retirar</span><strong>' + demo.dashboard.ready + '</strong></article></section>' +
      '<div class="dashboard-grid"><div class="dashboard-stack"><section class="panel attention-panel"><header class="panel-head"><h2>' + (state.invoiceUploaded ? "Acción completada — Demo" : "Requiere tu atención") + '</h2><button type="button" data-route="actions">Ver todas</button></header><div class="panel-body attention-body"><div><div class="merchant-line"><span class="merchant-mark">S</span><div><h3>SHEIN</h3><p>NXP-26-018401</p></div></div><p class="attention-copy">' + attentionCopy + '</p></div><div class="card-actions">' + attentionActions + '</div></div></section>' +
      '<section class="panel"><header class="panel-head"><h2>Paquete más reciente</h2><button type="button" data-route="packages">Ver todos</button></header><div class="package-highlight"><div class="status-row"><div><h3>Amazon</h3><span class="package-card__id">NXP-26-018392</span></div>' + badge(amazon) + '</div><p>Recibido en nuestro centro.</p><dl class="info-pairs"><div><dt>Peso</dt><dd>1.24 kg</dd></div><div><dt>Tracking</dt><dd>1Z999AA10123456784</dd></div></dl><button class="button button--navy" type="button" data-route="package" data-id="NXP-26-018392">Ver paquete</button></div></section></div>' +
      '<div class="dashboard-stack"><section class="panel locker-summary"><h3>Mi casillero</h3><strong>NXC-10482</strong><p>Centro de recepción internacional — Demo</p><div class="card-actions"><button class="button button--small" type="button" data-route="locker">Ver datos</button><button class="button button--small" type="button" data-copy="NXC-10482">' + icon("copy") + 'Copiar código</button></div></section><section class="panel"><header class="panel-head"><h2>Actividad reciente</h2></header><div class="panel-body"><ul class="activity-list">' + demo.activity.map(function activity(item) { return '<li><i></i><div><strong>' + esc(item.title) + '</strong><span>' + esc(item.detail) + '</span></div><time>' + esc(item.date) + '</time></li>'; }).join("") + '</ul></div></section></div></div>';
  }

  function packageCard(item) {
    const completedDemo = item.packageId === shein.packageId && state.invoiceUploaded;
    const action = item.requiresAction && !completedDemo ? '<button class="button button--primary" type="button" data-action="upload-invoice" data-id="' + esc(item.packageId) + '">Completar</button>' : completedDemo ? '<span class="badge badge--success">Factura recibida — Demo</span>' : "";
    return '<article class="package-card"><div class="package-card__main"><div class="package-card__head"><h2>' + esc(item.merchant) + '</h2>' + badge(item) + '</div><p class="package-card__id">' + esc(item.packageId) + '</p><p class="package-card__message">' + esc(completedDemo ? "Factura recibida para esta demostración." : packageMessage(item)) + '</p><div class="package-meta"><span>Peso<strong>' + esc(item.weight) + '</strong></span><span>Tracking<strong>' + esc(item.externalTracking) + '</strong></span></div></div><div class="card-actions">' + action + '<button class="button button--navy" type="button" data-route="package" data-id="' + esc(item.packageId) + '">Ver detalle</button></div></article>';
  }

  function renderPackages() {
    const tabs = [["all","Todos"],["center","En nuestro centro"],["transit","En camino"],["attention","Requieren atención"],["ready","Listos"],["finished","Finalizados"]];
    let items = canonical.packages.slice();
    if (state.packageFilter === "center") items = [amazon];
    else if (state.packageFilter === "attention") items = [shein];
    else if (["transit","ready","finished"].includes(state.packageFilter)) items = [];
    return pageHead("Mis paquetes", "Seguí tus compras desde que las recibimos hasta la entrega.") + '<div class="filter-tabs" role="tablist" aria-label="Filtrar paquetes">' + tabs.map(function tab(item) { return '<button type="button" role="tab" aria-selected="' + (state.packageFilter === item[0]) + '" class="' + (state.packageFilter === item[0] ? "is-active" : "") + '" data-package-filter="' + item[0] + '">' + item[1] + '</button>'; }).join("") + '</div><div class="package-list">' + (items.length ? items.map(packageCard).join("") : '<div class="empty-state"><strong>No hay paquetes en este estado.</strong><br>La información se actualizará cuando avance tu envío.</div>') + '</div>';
  }

  function packageTimeline(item) {
    if (item.requiresAction) {
      return [{ label: "Compra identificada", cls: "is-done", note: "Paquete asociado a tu cuenta" }, { label: state.invoiceUploaded ? "Factura recibida — Demo" : "Factura de compra pendiente", cls: state.invoiceUploaded ? "is-done" : "is-current", note: state.invoiceUploaded ? "Preparada en esta sesión" : "Necesitamos tu documento" }, { label: "Preparación para envío", cls: state.invoiceUploaded ? "is-current" : "", note: "Próximo paso" }, { label: "En camino a Paraguay", cls: "", note: "Pendiente" }, { label: "Llegó a Paraguay", cls: "", note: "Pendiente" }, { label: "Listo para retirar", cls: "", note: "Pendiente" }, { label: "Entregado", cls: "", note: "Pendiente" }];
    }
    return [{ label: "Compra identificada", cls: "is-done", note: "Paquete asociado a tu cuenta" }, { label: "Recibido en nuestro centro", cls: "is-done", note: "Peso registrado: 1.24 kg" }, { label: "Preparación para envío", cls: "is-current", note: "Siguiente paso" }, { label: "En camino a Paraguay", cls: "", note: "Pendiente" }, { label: "Llegó a Paraguay", cls: "", note: "Pendiente" }, { label: "Listo para retirar", cls: "", note: "Pendiente" }, { label: "Entregado", cls: "", note: "Pendiente" }];
  }

  function renderPackageDetail(id) {
    const item = findPackage(id) || amazon;
    const actionRequired = item.requiresAction && !state.invoiceUploaded;
    const next = actionRequired ? '<section class="next-step next-step--attention"><h2>¿Qué necesitás hacer?</h2><p>Adjuntar factura de compra.</p><button class="button button--primary" type="button" data-action="upload-invoice" data-id="' + esc(item.packageId) + '">Adjuntar factura</button></section>' : '<section class="next-step"><h2>¿Qué sigue?</h2><p>Estamos preparando tu paquete para el próximo paso de envío. No necesitás realizar ninguna acción.</p></section>';
    return '<section class="detail-hero"><div><a class="back-link" href="?page=packages" data-route="packages">← Volver a mis paquetes</a><h1>' + esc(item.merchant) + '</h1><p>' + esc(item.packageId) + '</p></div>' + badge(item) + '</section>' +
      '<section class="summary-grid" aria-label="Resumen del paquete"><div><span>Tracking</span><strong>' + esc(item.externalTracking) + '</strong></div><div><span>Peso</span><strong>' + esc(item.weight) + '</strong></div><div><span>Ubicación actual</span><strong>' + esc(item.currentLocation ? demo.labels.reception : "Pendiente de actualización — Demo") + '</strong></div></section>' +
      '<div class="detail-layout"><div class="detail-stack">' + next + '<section class="panel"><header class="panel-head"><h2>Seguimiento</h2><span class="badge badge--neutral">Actualización demo</span></header><div class="panel-body"><ol class="timeline">' + packageTimeline(item).map(function step(row) { return '<li class="' + row.cls + '"><i>' + (row.cls === "is-done" ? "✓" : row.cls === "is-current" ? "●" : "") + '</i><div><strong>' + esc(row.label) + '</strong><span>' + esc(row.note) + '</span></div></li>'; }).join("") + '</ol></div></section></div>' +
      '<aside class="detail-stack"><section class="panel"><header class="panel-head"><h2>Información</h2></header><div class="panel-body"><dl class="info-pairs"><div><dt>Tienda</dt><dd>' + esc(item.merchant) + '</dd></div><div><dt>Paquete</dt><dd>' + esc(item.packageId) + '</dd></div><div><dt>Próximo movimiento</dt><dd>' + esc(demo.labels.route) + '</dd></div><div><dt>Modalidad</dt><dd>Aérea · Demo</dd></div></dl></div></section><section class="panel"><header class="panel-head"><h2>Más información</h2></header><div class="panel-body"><div class="section-links"><div class="section-link"><strong>Documentos</strong><span>' + (state.invoiceUploaded && item.requiresAction ? "Factura recibida — Demo" : item.requiresAction ? "Factura pendiente" : "Sin acciones pendientes") + '</span></div><div class="section-link"><strong>Pago</strong><span>Por definir</span></div><div class="section-link"><strong>Entrega</strong><span>Todavía no disponible</span></div><button class="section-link" type="button" data-route="support"><strong>Soporte</strong><span>Estamos para ayudarte</span></button></div></div></section></aside></div>';
  }

  function renderActions() {
    const content = state.invoiceUploaded ? '<div class="empty-state"><strong>Factura recibida — Demo</strong><br>La acción fue completada solamente en esta sesión.</div>' : packageCard(shein);
    return pageHead("Requieren tu atención", "Completá estas acciones para que tus paquetes puedan continuar.") + '<div class="package-list">' + content + '</div>';
  }

  function renderHistory() {
    return pageHead("Historial", "Consultá paquetes anteriores y entregas demostrativas.") + '<div class="history-list">' + demo.history.map(function history(item) { return '<article class="package-card"><div><div class="package-card__head"><h2>' + esc(item.merchant) + '</h2><span class="badge badge--success">' + esc(item.status) + '</span></div><p class="package-card__id">' + esc(item.packageId) + '</p><div class="package-meta"><span>Fecha<strong>' + esc(item.date) + '</strong></span><span>Peso<strong>' + esc(item.weight) + '</strong></span></div></div><div class="card-actions"><button class="button" type="button" data-action="history-demo">Ver resumen</button></div></article>'; }).join("") + '</div>';
  }

  function renderLocker() {
    return pageHead("Mi casillero", "Usá estos datos cuando compres en tus tiendas favoritas.") + '<section class="locker-hero"><div><small>Código NexCourier</small><strong>' + esc(locker.lockerCode) + '</strong><p>Este código permite identificar tus paquetes cuando llegan.</p></div><button class="button button--primary" type="button" data-copy="' + esc(locker.lockerCode) + '">' + icon("copy") + 'Copiar código</button></section><div class="copy-grid"><article class="copy-field"><div><span>Nombre</span><strong>Cliente Demo</strong></div><button class="button button--small" type="button" data-copy="Cliente Demo" aria-label="Copiar nombre">' + icon("copy") + 'Copiar</button></article><article class="copy-field"><div><span>Recepción</span><strong>Dirección demostrativa / Centro de recepción internacional — Demo</strong></div><button class="button button--small" type="button" data-copy="Centro de recepción internacional — Demo" aria-label="Copiar ubicación demostrativa">' + icon("copy") + 'Copiar</button></article></div><section><header class="page-head"><div><h1 style="font-size:18px">¿Cómo usar tu casillero?</h1><p>Tu paquete aparecerá automáticamente cuando lo recibamos e identifiquemos.</p></div></header><ol class="steps"><li>Comprá en tu tienda favorita.</li><li>Usá los datos asignados por NexCourier.</li><li>Incluí siempre tu código NXC-10482.</li><li>Cuando recibamos e identifiquemos el paquete, aparecerá automáticamente en tu cuenta.</li></ol></section>';
  }

  function renderCalculator() {
    return pageHead("Calculadora", "Obtené una referencia demostrativa antes de comprar.") + '<section class="panel form-panel"><form id="calculatorForm"><div class="form-grid"><label class="field"><span>Origen</span><select required><option>Estados Unidos — Demo</option><option>Otro origen — Demo</option></select></label><label class="field"><span>Peso</span><input type="number" min="0.01" step="0.01" placeholder="kg" required></label><label class="field"><span>Largo</span><input type="number" min="0" step="0.1" placeholder="cm" required></label><label class="field"><span>Ancho</span><input type="number" min="0" step="0.1" placeholder="cm" required></label><label class="field"><span>Alto</span><input type="number" min="0" step="0.1" placeholder="cm" required></label><label class="field"><span>Categoría</span><select required><option>Compras generales</option><option>Electrónica — Demo</option><option>Ropa — Demo</option></select></label><label class="field field--full"><span>Valor declarado (opcional)</span><input type="number" min="0" step="0.01" placeholder="USD — opcional"></label></div><div class="form-actions"><button class="button button--primary" type="submit">Calcular demo</button></div></form>' + (state.calculation ? '<div class="estimate-result"><h3>Estimación demostrativa</h3><strong>Monto por definir</strong><p>Tarifas de demostración — precio final sujeto a operación real.</p></div>' : "") + '</section>';
  }

  function renderPayments() {
    return pageHead("Pagos", "Revisá conceptos asociados a tus paquetes. No se procesan pagos reales.") + '<div class="filter-tabs"><button class="is-active" type="button">Pendientes</button><button type="button" data-action="empty-payment-tab">Completados</button></div><section class="panel table-scroll"><table class="simple-table"><thead><tr><th>Paquete</th><th>Concepto</th><th>Estado</th><th>Monto</th><th></th></tr></thead><tbody><tr><td><strong>' + demo.payment.packageId + '</strong><span>Amazon</span></td><td>' + demo.payment.concept + '</td><td><span class="badge badge--attention">' + demo.payment.status + '</span></td><td><strong>' + demo.payment.amount + '</strong></td><td><button class="button button--small" type="button" data-action="payment-detail">Ver detalle</button></td></tr></tbody></table></section>';
  }

  function renderInvoices() {
    return pageHead("Facturas", "Documentos disponibles para tu cuenta en esta demostración.") + '<section class="panel table-scroll"><table class="simple-table"><thead><tr><th>Periodo</th><th>Documento</th><th>Estado</th><th></th></tr></thead><tbody><tr><td><strong>' + demo.invoice.period + '</strong></td><td><strong>' + demo.invoice.title + '</strong><span>' + demo.invoice.reference + '</span></td><td><span class="badge badge--success">' + demo.invoice.status + '</span></td><td><div class="card-actions"><button class="button button--small" type="button" data-action="invoice-preview">Ver demo</button><button class="button button--small" type="button" data-action="invoice-download">Descargar demo</button></div></td></tr></tbody></table></section><p class="notice" style="margin-top:12px">Sin facturación real ni integración SIFEN. Los documentos son únicamente una representación visual.</p>';
  }

  function renderDelivery() {
    return pageHead("Retiro / Delivery", "Elegí cómo recibir tus paquetes cuando estén habilitados.") + '<section class="panel"><header class="panel-head"><h2>Paquetes disponibles</h2></header><div class="panel-body"><div class="notice"><strong>Este paquete todavía no está listo para elegir entrega.</strong><br>Amazon · NXP-26-018392 seguirá mostrando esta opción cuando llegue a Paraguay y esté habilitado.</div></div></section><section class="panel" style="margin-top:16px"><header class="panel-head"><h2>Ejemplo de selección futura</h2><span class="badge badge--neutral">Demo</span></header><div class="panel-body"><p style="margin-top:0;color:var(--ink-500);font-size:10px">¿Cómo querés recibir tu paquete cuando esté disponible?</p><div class="choice-grid"><label class="choice-card"><input type="radio" name="delivery" value="pickup" checked><span><strong>Retirar en sucursal</strong><span>Sucursal Demo</span></span></label><label class="choice-card"><input type="radio" name="delivery" value="delivery"><span><strong>Solicitar delivery</strong><span>Delivery Demo</span></span></label></div><div class="form-actions"><button class="button button--primary" type="button" data-action="delivery-continue">Continuar demo</button></div></div></section>';
  }

  function renderNotifications() {
    return pageHead("Notificaciones", "Novedades importantes sobre tus paquetes.") + '<div class="notification-list">' + demo.notifications.map(function notice(item) { return '<article class="notification-card ' + (item.unread ? "is-unread" : "") + '"><i></i><div><strong>' + esc(item.title) + '</strong><span>' + esc(item.detail) + '</span></div><time>' + esc(item.date) + '</time></article>'; }).join("") + '</div>';
  }

  function renderSupport() {
    const options = [{key:"missing",title:"Mi paquete no aparece",text:"Informanos el tracking para revisar la recepción."},{key:"package",title:"Tengo un problema con un paquete",text:"Contanos qué ocurrió y qué paquete está afectado."},{key:"documents",title:"Consulta sobre documentos",text:"Ayuda con facturas u otros documentos."},{key:"payment",title:"Consulta sobre pago",text:"Revisá un concepto o estado de pago demo."},{key:"delivery",title:"Consulta sobre entrega",text:"Ayuda sobre retiro o delivery."}];
    return pageHead("Ayuda y soporte", "Elegí el tema que mejor describe tu consulta.") + '<div class="support-options">' + options.map(function option(item) { return '<button class="support-option" type="button" data-support="' + item.key + '"><strong>' + item.title + '</strong><span>' + item.text + '</span></button>'; }).join("") + '</div>';
  }

  function renderProfile() {
    return pageHead("Perfil", "Administrá la información visible de tu cuenta demostrativa.") + '<div class="profile-grid"><section class="profile-card"><h2>Información personal</h2><dl><dt>Nombre</dt><dd>Cliente Demo</dd><dt>Email</dt><dd>' + esc(customer.email) + '</dd></dl></section><section class="profile-card"><h2>Seguridad</h2><dl><dt>Sesión</dt><dd>Demo, sin autenticación real</dd><dt>Contraseña</dt><dd>No disponible en esta fase</dd></dl></section><section class="profile-card"><h2>Datos de cuenta</h2><dl><dt>Código</dt><dd>NXC-10482</dd><dt>Casillero</dt><dd>NXC-10482</dd></dl></section><section class="profile-card"><h2>Preferencias</h2><dl><dt>Idioma</dt><dd>Español</dd><dt>Notificaciones</dt><dd>Activadas para la demo</dd></dl></section></div>';
  }

  function renderCurrent() {
    const route = currentRoute();
    const renders = { dashboard: renderDashboard, packages: renderPackages, package: function detail() { return renderPackageDetail(route.id); }, actions: renderActions, history: renderHistory, locker: renderLocker, calculator: renderCalculator, payments: renderPayments, invoices: renderInvoices, delivery: renderDelivery, notifications: renderNotifications, support: renderSupport, profile: renderProfile };
    const renderer = renders[route.page] || renderDashboard;
    view.innerHTML = renderer();
    document.querySelectorAll(".side-nav a").forEach(function active(link) {
      const page = link.dataset.route;
      const isActive = page === route.page || (route.page === "package" && page === "packages");
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    });
    const attentionCount = document.querySelector('.side-nav [data-route="actions"] b');
    if (attentionCount) attentionCount.textContent = state.invoiceUploaded ? "0" : "1";
    document.body.classList.remove("sidebar-open");
    document.title = (route.page === "dashboard" ? "Mi NexCourier" : view.querySelector("h1") ? view.querySelector("h1").textContent : "Mi NexCourier") + " — Demo";
  }

  function navigate(page, id) {
    global.history.pushState({}, "", routeUrl(page, id));
    closeTransient();
    renderCurrent();
    view.focus({ preventScroll: true });
    global.scrollTo({ top: 0, behavior: "auto" });
  }

  function displaySearchResults() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) { searchResults.hidden = true; searchInput.setAttribute("aria-expanded", "false"); return; }
    const matches = canonical.packages.filter(function filter(item) { return [item.packageId, item.externalTracking, item.merchant].some(function includes(value) { return String(value).toLowerCase().includes(query); }); });
    searchResults.innerHTML = matches.length ? matches.map(function result(item) { return '<button class="search-result" type="button" data-route="package" data-id="' + esc(item.packageId) + '"><div><strong>' + esc(item.merchant) + '</strong><span>' + esc(item.packageId) + ' · ' + esc(item.externalTracking) + '</span></div>' + badge(item) + '</button>'; }).join("") : '<div class="search-empty">No encontramos un paquete de tu cuenta con esa búsqueda.</div>';
    searchResults.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
  }

  function renderNotificationPanel() {
    notificationPanel.innerHTML = '<header><strong>Notificaciones</strong><button type="button" data-route="notifications">Ver todas</button></header>' + demo.notifications.slice(0, 3).map(function notification(item) { return '<button class="mini-notification" type="button" data-route="notifications"><strong>' + esc(item.title) + '</strong><span>' + esc(item.detail) + ' · ' + esc(item.date) + '</span></button>'; }).join("");
  }

  function openInvoiceUpload(packageId) {
    state.invoiceSelected = false;
    showModal("Adjuntar factura", "Paquete: " + packageId, '<div class="upload-zone">' + icon("upload") + '<p>PDF, JPG o PNG</p><small>Simulación local: ningún archivo será subido.</small><button class="button button--navy" style="margin-top:14px" type="button" data-action="select-demo-file">Seleccionar archivo demo</button></div><div id="fileReady"></div>', '<button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button--primary" type="button" data-action="send-demo-invoice" disabled>Enviar demo</button>');
  }

  async function copyValue(value) {
    try {
      if (navigator.clipboard && global.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const field = document.createElement("textarea");
        field.value = value; field.style.position = "fixed"; field.style.opacity = "0";
        document.body.appendChild(field); field.select(); document.execCommand("copy"); field.remove();
      }
      showToast("Copiado", value);
    } catch (error) { showToast("No se pudo copiar", "Seleccioná el dato y copialo manualmente."); }
  }

  function supportModal(kind) {
    if (kind === "missing") {
      showModal("Mi paquete no aparece", "Compartí estos datos para preparar una solicitud demostrativa.", '<form id="supportForm"><div class="form-grid"><label class="field field--full"><span>Tracking externo</span><input name="tracking" required placeholder="Tracking de la tienda o transportista"></label><label class="field"><span>Merchant</span><input name="merchant" required placeholder="Tienda"></label><label class="field"><span>Fecha aproximada de compra</span><input name="date" type="date" required></label><label class="field field--full"><span>Nota opcional</span><textarea name="note" placeholder="Información que pueda ayudar"></textarea></label></div></form><p class="notice" style="margin:14px 0 0">Esto no asignará automáticamente la propiedad de ningún paquete.</p>', '<button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button--primary" type="submit" form="supportForm">Crear solicitud demo</button>');
    } else {
      showModal("Consulta de soporte", "Flujo demostrativo sin creación de ticket real.", '<label class="field"><span>Contanos brevemente qué necesitás</span><textarea placeholder="Escribí tu consulta"></textarea></label>', '<button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button--primary" type="button" data-action="send-support-demo">Enviar demo</button>');
    }
  }

  function handleAction(action, element) {
    if (action === "open-sidebar") document.body.classList.add("sidebar-open");
    else if (action === "close-sidebar") document.body.classList.remove("sidebar-open");
    else if (action === "toggle-notifications") { const opening = notificationPanel.hidden; closeTransient(); notificationPanel.hidden = !opening; element.setAttribute("aria-expanded", String(opening)); }
    else if (action === "close-modal") closeModal();
    else if (action === "close-toast") toast.hidden = true;
    else if (action === "upload-invoice") openInvoiceUpload(element.dataset.id || shein.packageId);
    else if (action === "select-demo-file") { state.invoiceSelected = true; document.querySelector("#fileReady").innerHTML = '<div class="file-ready"><span>✓</span><div><strong>factura-shein-demo.pdf</strong><span>Archivo preparado</span></div></div>'; modalActions.querySelector('[data-action="send-demo-invoice"]').disabled = false; }
    else if (action === "send-demo-invoice") { state.invoiceUploaded = true; closeModal(); renderCurrent(); showToast("Factura adjuntada para la demostración.", "No se subió ningún archivo real."); }
    else if (action === "payment-detail") showModal("Detalle de pago", "Información demostrativa para " + demo.payment.packageId, '<div class="detail-list"><div><span>Paquete</span><strong>' + demo.payment.packageId + '</strong></div><div><span>Concepto</span><strong>' + demo.payment.concept + '</strong></div><div><span>Monto demo</span><strong>' + demo.payment.amount + '</strong></div><div><span>Estado</span><strong>' + demo.payment.status + '</strong></div><div><span>Fecha</span><strong>' + demo.payment.date + '</strong></div><div><span>Forma de pago</span><strong>' + demo.payment.method + '</strong></div></div><p class="notice">No existe integración con un proveedor de pagos.</p>', '<button class="button" type="button" data-action="close-modal">Cerrar</button><button class="button button--primary" type="button" data-action="simulate-payment">Simular pago</button>');
    else if (action === "simulate-payment") { closeModal(); showToast("Pago simulado", "No se procesó ningún cobro real."); }
    else if (action === "invoice-preview") showModal("Factura demostrativa", demo.invoice.period, '<div class="detail-list"><div><span>Documento</span><strong>' + demo.invoice.title + '</strong></div><div><span>Referencia</span><strong>' + demo.invoice.reference + '</strong></div><div><span>Estado</span><strong>' + demo.invoice.status + '</strong></div></div><p class="notice">Vista conceptual. No es un documento fiscal real.</p>');
    else if (action === "invoice-download") showToast("Descarga demostrativa", "No se generó ni descargó una factura real.");
    else if (action === "delivery-continue") showModal("Preferencia de entrega", "Selección demostrativa", '<p class="notice"><strong>Preferencia preparada.</strong><br>La opción elegida no se guardará y no solicitará un servicio real.</p>', '<button class="button button--primary" type="button" data-action="confirm-delivery-demo">Confirmar demo</button>');
    else if (action === "confirm-delivery-demo") { closeModal(); showToast("Preferencia registrada para la demo", "No se solicitó retiro ni delivery real."); }
    else if (action === "history-demo") showToast("Resumen demostrativo", "El historial detallado estará disponible con el backend futuro.");
    else if (action === "empty-payment-tab") showToast("Sin pagos completados", "Esta cuenta demo no tiene pagos reales.");
    else if (action === "send-support-demo") { closeModal(); showToast("Consulta preparada para la demostración.", "No se creó ningún ticket real."); }
  }

  document.addEventListener("click", function clickHandler(event) {
    const route = event.target.closest("[data-route]");
    if (route) { event.preventDefault(); if (!modalLayer.hidden) closeModal(); navigate(route.dataset.route, route.dataset.id); return; }
    const copy = event.target.closest("[data-copy]");
    if (copy) { copyValue(copy.dataset.copy); return; }
    const filter = event.target.closest("[data-package-filter]");
    if (filter) { state.packageFilter = filter.dataset.packageFilter; renderCurrent(); return; }
    const support = event.target.closest("[data-support]");
    if (support) { supportModal(support.dataset.support); return; }
    const action = event.target.closest("[data-action]");
    if (action) { handleAction(action.dataset.action, action); return; }
    if (!event.target.closest(".global-search") && !event.target.closest(".notification-wrap")) closeTransient();
  });

  document.addEventListener("submit", function submitHandler(event) {
    event.preventDefault();
    if (event.target.id === "calculatorForm") { state.calculation = true; renderCurrent(); showToast("Estimación preparada", "Resultado demostrativo, sin tarifa real."); }
    else if (event.target.id === "supportForm") { closeModal(); showToast("Solicitud preparada para la demostración.", "No se creó un ticket ni se asignó un paquete."); }
  });
  searchInput.addEventListener("input", displaySearchResults);
  searchInput.addEventListener("keydown", function searchKeyboard(event) { if (event.key === "Escape") closeTransient(); });
  global.addEventListener("popstate", function popState() { closeTransient(); if (!modalLayer.hidden) closeModal(); renderCurrent(); });
  document.addEventListener("keydown", function keyHandler(event) { if (event.key === "Escape") { closeTransient(); document.body.classList.remove("sidebar-open"); if (!modalLayer.hidden) closeModal(); } });

  renderNotificationPanel();
  renderCurrent();
})(window);
