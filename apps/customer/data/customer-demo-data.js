(function exposeCustomerDemoExtensions(global) {
  "use strict";

  global.NEXCOURIER_CUSTOMER_DEMO = Object.freeze({
    labels: Object.freeze({
      reception: "Centro de recepción internacional — Demo",
      received: "Recibido en nuestro centro de recepción",
      action: "Requiere tu atención",
      actionMessage: "Necesitamos la factura de este paquete.",
      route: "Miami → Asunción",
    }),
    dashboard: Object.freeze({ atCenter: "2 demo", inTransit: "1 demo", attention: "1", ready: "0" }),
    activity: Object.freeze([
      { title: "Paquete recibido", detail: "NXP-26-018392", date: "Hoy · 09:42" },
      { title: "Peso registrado", detail: "1.24 kg", date: "Hoy · 09:46" },
      { title: "Documento requerido", detail: "NXP-26-018401", date: "Ayer · 16:20" },
    ]),
    history: Object.freeze([
      { packageId: "NXP-DEMO-018210", merchant: "Tienda Demo", status: "Entregado", date: "28 Ago 2026", weight: "0.64 kg" },
      { packageId: "NXP-DEMO-018155", merchant: "Comercio Demo", status: "Entregado", date: "12 Ago 2026", weight: "1.10 kg" },
    ]),
    notifications: Object.freeze([
      { title: "Nuevo paquete recibido", detail: "Amazon · NXP-26-018392", date: "Hoy · 09:42", unread: true },
      { title: "Necesitamos tu factura", detail: "SHEIN · NXP-26-018401", date: "Ayer · 16:20", unread: true },
      { title: "Tu paquete está en camino a Paraguay", detail: "Notificación demostrativa", date: "12 Sep · 11:05" },
      { title: "Tu paquete llegó a Paraguay", detail: "Notificación demostrativa", date: "08 Sep · 14:30" },
      { title: "Tu paquete está listo para retirar", detail: "Notificación demostrativa", date: "02 Sep · 10:15" },
    ]),
    payment: Object.freeze({ packageId: "NXP-26-018392", concept: "Servicio de transporte — Demo", amount: "Por definir", status: "Pendiente demo", date: "18 Sep 2026", method: "Método por elegir" }),
    invoice: Object.freeze({ period: "Septiembre 2026", title: "Factura demostrativa", status: "Disponible", reference: "DOC-DEMO-SEP-01" }),
  });
})(window);
