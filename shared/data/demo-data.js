(function exposeNexCourierDemoData(global) {
  "use strict";

  const demoData = {
    meta: {
      label: "DEMO DATA ONLY",
      warning: "NOT PRODUCTION DATA",
      production: false,
    },
    customer: {
      customerId: "NXC-10482",
      name: "Cliente Demo",
      email: "cliente.demo@example.com",
    },
    customerLocker: {
      lockerCode: "NXC-10482",
      location: "Centro de recepción internacional — Demo",
    },
    packages: [
      {
        packageId: "NXP-26-018392",
        merchant: "Amazon",
        externalTracking: "1Z999AA10123456784",
        weight: "1.24 kg",
        status: "RECEIVED_ORIGIN",
        customerStatus: "Recibido en nuestro centro de recepción",
        currentLocation: "Centro de recepción internacional — Demo",
        requiresAction: false,
      },
      {
        packageId: "NXP-26-018401",
        merchant: "SHEIN",
        externalTracking: "9405511200000000000000",
        weight: "0.82 kg",
        status: "DOCUMENT_REQUIRED",
        customerStatus: "Requiere tu atención",
        requiresAction: true,
        requiredAction: "MISSING_INVOICE",
        customerMessage: "Necesitamos la factura de este paquete.",
      },
    ],
    shipment: {
      shipmentId: "NXS-MIA-ASU-260918-A",
      route: "Miami → Asunción",
      mode: "AIR",
      scheduledDeparture: "18 Sep 2026 · 21:30",
      packageCount: 184,
      grossWeight: "312 kg",
      status: "PREPARING",
    },
    notifications: [
      "Nuevo paquete recibido",
      "Tu paquete está en camino a Paraguay",
      "Tu paquete llegó a Paraguay",
      "Tu paquete está listo para retirar",
    ],
    statusCatalog: {
      RECEIVED_ORIGIN: {
        customer: "Recibido en nuestro centro de recepción",
        admin: "Recepción confirmada en origen",
      },
      READY_FOR_SHIPMENT: {
        customer: "Preparando envío a Paraguay",
        admin: "Listo para asignar a envío",
      },
      IN_TRANSIT: {
        customer: "En camino a Paraguay",
        admin: "Despachado / En tránsito",
      },
      ARRIVED_PARAGUAY: {
        customer: "Llegó a Paraguay",
        admin: "Arribado a Paraguay",
      },
      READY_FOR_PICKUP: {
        customer: "Listo para retirar",
        admin: "Habilitado para retiro o entrega",
      },
      DELIVERED: {
        customer: "Entregado",
        admin: "Entrega cerrada",
      },
      DOCUMENT_REQUIRED: {
        customer: "Requiere tu atención",
        admin: "Documento requerido",
      },
      UNIDENTIFIED: {
        customer: "Pendiente de identificación",
        admin: "No identificado",
      },
    },
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

  global.NEXCOURIER_DEMO_DATA = deepFreeze(demoData);
})(window);
