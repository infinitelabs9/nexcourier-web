(function exposeNexCourierAdminDemo(global) {
  "use strict";

  const canonical = global.NEXCOURIER_DEMO_DATA;

  if (!canonical) {
    throw new Error("NexCourier canonical demo data must load before Admin demo data.");
  }

  const primaryPackage = canonical.packages[0];
  const documentPackage = canonical.packages[1];
  const shipment = canonical.shipment;

  const adminData = {
    meta: {
      label: "Entorno Demo",
      location: "Centro internacional — Demo",
      user: "Admin Demo",
      product: "Standard",
    },
    metrics: [
      { label: "Recibidos hoy", value: 82, page: "reception", tone: "neutral", note: "+12 desde las 08:00" },
      { label: "Sin identificar", value: 4, page: "unidentified", tone: "critical", note: "Requieren confirmación" },
      { label: "Documentos pendientes", value: 7, page: "documents", tone: "warning", note: "3 con más de 24 h" },
      { label: "Por despachar", value: 63, page: "shipments", tone: "info", note: "En preparación" },
      { label: "Llegadas Paraguay", value: 104, page: "arrivals", tone: "neutral", note: "2 recepciones activas" },
      { label: "Listos para retirar", value: 47, page: "deliveries", tone: "success", note: "Sin bloqueo" },
      { label: "Delivery pendiente", value: 12, page: "deliveries", tone: "warning", note: "Por coordinar" },
    ],
    priorities: [
      { title: "Shipment de hoy", detail: "10 casos requieren revisión", page: "shipment", id: shipment.shipmentId, tone: "warning" },
      { title: "4 paquetes sin identificar", detail: "Confirmar propietario antes de asignar", page: "unidentified", tone: "critical" },
      { title: "7 paquetes esperan documentación", detail: "Factura o valor declarado pendiente", page: "documents", tone: "warning" },
    ],
    packages: [
      {
        ...primaryPackage,
        customerId: canonical.customer.customerId,
        customerName: canonical.customer.name,
        dimensions: "32 × 20 × 12 cm",
        location: "A-18",
        warehouse: "Centro internacional — Demo",
        shipmentId: null,
        adminStatus: "Recibido",
        lastMovement: "Hoy · 10:42",
        receivedAt: "18 Sep 2026 · 10:42",
      },
      {
        ...documentPackage,
        customerId: canonical.customer.customerId,
        customerName: canonical.customer.name,
        dimensions: "28 × 18 × 9 cm",
        location: "B-04",
        warehouse: "Centro internacional — Demo",
        shipmentId: shipment.shipmentId,
        adminStatus: "Requiere documento",
        lastMovement: "Hoy · 10:18",
        receivedAt: "18 Sep 2026 · 10:18",
      },
      { packageId: "NXP-26-018402", customerId: "NXC-10483", customerName: "Cliente Demo 02", merchant: "eBay", externalTracking: "DEMO-EBAY-018402", weight: "3.20 kg", status: "READY_FOR_SHIPMENT", adminStatus: "Listo para despacho", location: "C-07", warehouse: "Centro internacional — Demo", shipmentId: shipment.shipmentId, lastMovement: "Hoy · 09:54", requiresAction: false },
      { packageId: "NXP-26-018403", customerId: "NXC-10484", customerName: "Cliente Demo 03", merchant: "AliExpress", externalTracking: "DEMO-ALI-018403", weight: "0.46 kg", status: "IN_TRANSIT", adminStatus: "En tránsito", location: "En ruta", warehouse: "Centro internacional — Demo", shipmentId: "NXS-MIA-ASU-260916-B", lastMovement: "Ayer · 22:10", requiresAction: false },
      { packageId: "NXP-26-018404", customerId: "NXC-10485", customerName: "Cliente Demo 04", merchant: "Nike", externalTracking: "DEMO-NIKE-018404", weight: "1.90 kg", status: "ARRIVED_PARAGUAY", adminStatus: "Llegó a Paraguay", location: "Control de llegada", warehouse: "Paraguay — Demo", shipmentId: "NXS-MIA-ASU-260916-B", lastMovement: "Hoy · 08:34", requiresAction: false },
      { packageId: "NXP-26-018405", customerId: "NXC-10483", customerName: "Cliente Demo 02", merchant: "Apple", externalTracking: "DEMO-APPLE-018405", weight: "0.71 kg", status: "READY_FOR_PICKUP", adminStatus: "Listo para retiro", location: "Retiro — Demo", warehouse: "Paraguay — Demo", shipmentId: "NXS-MIA-ASU-260916-B", lastMovement: "Hoy · 08:05", requiresAction: false },
      { packageId: "NXP-26-018406", customerId: "NXC-10486", customerName: "Cliente Demo 05", merchant: "Zara", externalTracking: "DEMO-ZARA-018406", weight: "2.14 kg", status: "DELIVERED", adminStatus: "Entregado", location: "Cerrado", warehouse: "Paraguay — Demo", shipmentId: "NXS-MIA-ASU-260912-C", lastMovement: "17 Sep · 17:21", requiresAction: false },
    ],
    reception: {
      knownTracking: primaryPackage.externalTracking,
      exceptionTracking: documentPackage.externalTracking,
      dimensions: { length: 32, width: 20, height: 12 },
      location: "A-18",
      warehouse: "Centro internacional — Demo",
    },
    unidentified: [
      {
        caseId: "UNID-DEMO-004",
        tracking: documentPackage.externalTracking,
        weight: documentPackage.weight,
        location: "B-04",
        received: "Hoy · 10:18",
        possibleCustomerId: canonical.customer.customerId,
        possibleCustomerName: canonical.customer.name,
        evidence: ["Código parcialmente visible", "Nombre similar"],
        scenario: "Escenario alternativo de recepción",
      },
      { caseId: "UNID-DEMO-003", tracking: "DEMO-UNMATCHED-018409", weight: "1.65 kg", location: "B-09", received: "Hoy · 09:46", possibleCustomerId: null, possibleCustomerName: null, evidence: [], scenario: "Demo" },
      { caseId: "UNID-DEMO-002", tracking: "DEMO-LABEL-018410", weight: "0.38 kg", location: "B-11", received: "Hoy · 09:12", possibleCustomerId: "NXC-10487", possibleCustomerName: "Cliente Demo 06", evidence: ["Código incompleto"], scenario: "Demo" },
      { caseId: "UNID-DEMO-001", tracking: "DEMO-DAMAGED-018411", weight: "4.02 kg", location: "Revisión", received: "Hoy · 08:37", possibleCustomerId: null, possibleCustomerName: null, evidence: [], scenario: "Demo" },
    ],
    documents: [
      { packageId: documentPackage.packageId, merchant: documentPackage.merchant, customerId: canonical.customer.customerId, customerName: canonical.customer.name, document: "Factura de compra", status: "Pendiente", statusLabel: "Pendiente del cliente", age: "2 h" },
      { packageId: "NXP-26-018412", merchant: "Demo Store", customerId: "NXC-10483", customerName: "Cliente Demo 02", document: "Valor declarado", status: "Revisión", statusLabel: "En revisión", age: "5 h" },
      { packageId: "NXP-26-018413", merchant: "Demo Market", customerId: "NXC-10484", customerName: "Cliente Demo 03", document: "Factura de compra", status: "Recibido", statusLabel: "Documento recibido", age: "Hoy" },
      { packageId: "NXP-26-018414", merchant: "Demo Outlet", customerId: "NXC-10485", customerName: "Cliente Demo 04", document: "Comprobante", status: "Aprobado", statusLabel: "Aprobado", age: "Ayer" },
    ],
    shipments: [
      {
        ...shipment,
        adminStatus: "Preparando",
        ready: 174,
        review: 10,
        checks: [
          { label: "Paquetes incluidos", value: 184, tone: "neutral" },
          { label: "Sin incidencias", value: 174, tone: "success" },
          { label: "Documentos pendientes", value: 7, tone: "warning" },
          { label: "Revisión adicional", value: 2, tone: "warning" },
          { label: "Ubicación pendiente", value: 1, tone: "critical" },
          { label: "Total a revisar", value: 10, tone: "critical" },
        ],
      },
      { shipmentId: "NXS-MIA-ASU-260916-B", route: "Miami → Asunción", mode: "AIR", scheduledDeparture: "16 Sep 2026 · 20:10", packageCount: 96, grossWeight: "178 kg", status: "IN_TRANSIT", adminStatus: "En tránsito", ready: 96, review: 0 },
      { shipmentId: "NXS-MIA-ASU-260912-C", route: "Miami → Asunción", mode: "AIR", scheduledDeparture: "12 Sep 2026 · 19:40", packageCount: 121, grossWeight: "226 kg", status: "ARRIVED_PARAGUAY", adminStatus: "Llegó a Paraguay", ready: 121, review: 0 },
    ],
    arrival: {
      shipmentId: shipment.shipmentId,
      route: shipment.route,
      expected: 184,
      scanned: 182,
      matched: 181,
      missing: 3,
      extra: 1,
      duplicate: 0,
      discrepancies: ["3 esperados no escaneados", "1 tracking no incluido en manifest"],
    },
    customers: [
      { customerId: canonical.customer.customerId, lockerCode: canonical.customerLocker.lockerCode, name: canonical.customer.name, email: canonical.customer.email, activePackages: 2, pendingActions: 1, status: "Activo", preference: "Por definir" },
      { customerId: "NXC-10483", lockerCode: "NXC-10483", name: "Cliente Demo 02", email: "No cargado — Demo", activePackages: 2, pendingActions: 0, status: "Activo", preference: "Retiro — Demo" },
      { customerId: "NXC-10484", lockerCode: "NXC-10484", name: "Cliente Demo 03", email: "No cargado — Demo", activePackages: 1, pendingActions: 1, status: "Activo", preference: "Por definir" },
      { customerId: "NXC-10485", lockerCode: "NXC-10485", name: "Cliente Demo 04", email: "No cargado — Demo", activePackages: 1, pendingActions: 0, status: "Activo", preference: "Delivery — Demo" },
    ],
    deliveries: [
      { packageId: "NXP-26-018405", customerId: "NXC-10483", customerName: "Cliente Demo 02", method: "Retiro — Demo", status: "Listo para retiro", payment: "Confirmado", tab: "pickup" },
      { packageId: "NXP-26-018415", customerId: "NXC-10484", customerName: "Cliente Demo 03", method: "Delivery — Demo", status: "Delivery pendiente", payment: "Pendiente", tab: "pending" },
      { packageId: "NXP-26-018416", customerId: "NXC-10485", customerName: "Cliente Demo 04", method: "Delivery — Demo", status: "En camino", payment: "Confirmado", tab: "route" },
      { packageId: "NXP-26-018406", customerId: "NXC-10486", customerName: "Cliente Demo 05", method: "Retiro — Demo", status: "Entregado", payment: "Confirmado", tab: "delivered" },
    ],
    recentActivity: [
      { time: "10:42", title: "Recepción confirmada", subject: primaryPackage.packageId, detail: "Amazon · NXC-10482 · 1.24 kg", page: "package", id: primaryPackage.packageId },
      { time: "10:31", title: "Documento pendiente", subject: documentPackage.packageId, detail: "SHEIN · Factura requerida", page: "package", id: documentPackage.packageId },
      { time: "10:18", title: "Caso sin identificar", subject: "UNID-DEMO-004", detail: "Propietario sin confirmar", page: "unidentified" },
      { time: "09:54", title: "Paquete listo para despacho", subject: "NXP-26-018402", detail: "Asignado a shipment de hoy", page: "shipments" },
    ],
    notifications: [
      { title: "Paquete recibido", detail: primaryPackage.packageId + " · Recepción confirmada", page: "package", id: primaryPackage.packageId, time: "Hace 8 min", unread: true },
      { title: "Documento pendiente", detail: documentPackage.packageId + " · Factura requerida", page: "documents", time: "Hace 19 min", unread: true },
      { title: "Shipment próximo a salir", detail: shipment.shipmentId + " · 10 casos por revisar", page: "shipment", id: shipment.shipmentId, time: "Hace 32 min", unread: true },
      { title: "Discrepancia de llegada", detail: "3 esperados aún no escaneados", page: "arrivals", time: "Hace 1 h", unread: false },
    ],
    warehouse: {
      occupancy: 68,
      locations: [
        { zone: "A", purpose: "Recepción confirmada", occupied: 84, capacity: 120 },
        { zone: "B", purpose: "Excepciones", occupied: 14, capacity: 32 },
        { zone: "C", purpose: "Preparación de envío", occupied: 63, capacity: 96 },
        { zone: "Revisión", purpose: "Control operativo", occupied: 6, capacity: 18 },
      ],
    },
    supportCases: [
      { id: "CASE-DEMO-021", customer: "Cliente Demo", subject: "Factura solicitada", packageId: documentPackage.packageId, status: "Abierto", age: "2 h" },
      { id: "CASE-DEMO-020", customer: "Cliente Demo 03", subject: "Consulta sobre retiro", packageId: "NXP-26-018404", status: "En revisión", age: "4 h" },
      { id: "CASE-DEMO-019", customer: "Cliente Demo 02", subject: "Confirmación de paquete", packageId: "NXP-26-018402", status: "Resuelto", age: "Ayer" },
    ],
    payments: [
      { packageId: "NXP-26-018415", customer: "Cliente Demo 03", concept: "Servicio — Demo", status: "Pendiente", amount: "Por definir" },
      { packageId: "NXP-26-018405", customer: "Cliente Demo 02", concept: "Servicio — Demo", status: "Confirmado", amount: "Demo" },
      { packageId: "NXP-26-018416", customer: "Cliente Demo 04", concept: "Revisión — Demo", status: "Revisión", amount: "Por definir" },
    ],
    invoices: [
      { reference: "DOC-DEMO-0108", customer: "Cliente Demo 02", packageId: "NXP-26-018405", status: "Emitido", system: "Demo — sin SIFEN" },
      { reference: "DOC-DEMO-0109", customer: "Cliente Demo 03", packageId: "NXP-26-018415", status: "Pendiente", system: "Demo — sin SIFEN" },
      { reference: "DOC-DEMO-0110", customer: "Cliente Demo 04", packageId: "NXP-26-018416", status: "Preparado", system: "Demo — sin SIFEN" },
    ],
    team: [
      { name: "Operador Demo 01", role: "Recepción", location: "Centro internacional — Demo", status: "Activo" },
      { name: "Operador Demo 02", role: "Documentos", location: "Centro internacional — Demo", status: "Activo" },
      { name: "Supervisor Demo", role: "Operaciones", location: "Operación — Demo", status: "Disponible" },
    ],
    audit: [
      { time: "Hoy · 10:42", action: "Recepción confirmada", subject: primaryPackage.packageId, actor: "Operador Demo 01" },
      { time: "Hoy · 10:31", action: "Solicitud de documento preparada", subject: documentPackage.packageId, actor: "Operador Demo 02" },
      { time: "Hoy · 09:58", action: "Shipment actualizado", subject: shipment.shipmentId, actor: "Supervisor Demo" },
    ],
  };

  function deepFreeze(value) {
    Object.freeze(value);
    Object.values(value).forEach(function freezeNested(nested) {
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
        deepFreeze(nested);
      }
    });
    return value;
  }

  global.NEXCOURIER_ADMIN_DEMO = deepFreeze(adminData);
})(window);
