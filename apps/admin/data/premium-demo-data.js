(function exposeNexCourierPremiumDemo(global) {
  "use strict";

  function expense(id, date, type, category, center, provider, amount, responsible, status, extra) {
    return Object.assign({
      expenseId: id, date: date, type: type, category: category, costCenter: center,
      location: center + " · Demo", provider: provider, amount: amount,
      currency: amount.indexOf("USD") === 0 ? "USD" : "PYG",
      paymentMethod: "Método demo", responsible: responsible,
      receipt: status === "Revisión" ? "Necesita revisión" : "Adjunto demo",
      notes: "Registro financiero simulado. No representa información real.",
      approvalStatus: status,
    }, extra || {});
  }

  const premiumData = {
    meta: { label: "Premium Demo", warning: "DEMO DATA ONLY", period: "Septiembre 2026", locale: "es" },
    finance: {
      cards: [
        ["Ingresos del período", "DEMO ₲ 186.400.000", "Datos simulados"],
        ["Gastos operativos", "DEMO ₲ 74.850.000", "40,2% de ingresos demo"],
        ["Gastos administrativos", "DEMO ₲ 23.480.000", "12,6% de ingresos demo"],
        ["Gastos de personal", "DEMO · valores protegidos", "Sin salarios reales"],
        ["Balance operativo", "DEMO ₲ 88.070.000", "Antes de ajustes contables"],
      ],
      costCenters: ["Centro internacional", "Aeropuerto", "Operación Paraguay", "Administración", "Delivery", "Gerencia"],
    },
    expenses: [
      expense("EXP-DEMO-001", "02 Sep 2026", "Operativo", "Aeropuerto / Handling", "Aeropuerto", "Proveedor Handling Demo", "₲ 18.400.000", "Supervisor Courier Demo", "Pendiente", {
        entryMode: "itemized",
        amountValue: 18400000,
        paymentMethod: "Transferencia",
        lines: [
          { id: "LINE-001", description: "Handling", quantity: 1, unitPrice: 8500000, subtotal: 8500000 },
          { id: "LINE-002", description: "Carga / descarga", quantity: 1, unitPrice: 3200000, subtotal: 3200000 },
          { id: "LINE-003", description: "Almacenaje", quantity: 1, unitPrice: 2700000, subtotal: 2700000 },
          { id: "LINE-004", description: "Documentación", quantity: 1, unitPrice: 1500000, subtotal: 1500000 },
          { id: "LINE-005", description: "Transporte interno", quantity: 1, unitPrice: 2500000, subtotal: 2500000 },
        ],
        shipmentId: "NXS-MIA-ASU-260918-A",
        relationship: { type: "Shipment", resourceId: "NXS-MIA-ASU-260918-A", label: "Miami → Asunción" },
        receiptDocument: { name: "factura-aeropuerto-sep.pdf", kind: "PDF", number: "FAC-DEMO-2409", date: "02 Sep 2026" },
        notes: "Handling y servicios asociados al shipment Miami → Asunción.",
        history: [
          { date: "02 Sep · 09:14", title: "Gasto creado", detail: "Admin Demo · Registro con 5 conceptos" },
          { date: "02 Sep · 09:18", title: "Comprobante adjuntado", detail: "factura-aeropuerto-sep.pdf · Demo" },
        ],
      }),
      expense("EXP-DEMO-002", "04 Sep 2026", "Operativo", "Transporte aeropuerto", "Aeropuerto", "Transporte Demo", "₲ 9.200.000", "Supervisor Courier Demo", "Aprobado demo", { shipmentId: "NXS-MIA-ASU-260918-A" }),
      expense("EXP-DEMO-003", "06 Sep 2026", "Operativo", "Documentación operativa", "Aeropuerto", "Gestión Documental Demo", "₲ 7.850.000", "Supervisor Aduana Demo", "Revisión", { shipmentId: "NXS-MIA-ASU-260918-A" }),
      expense("EXP-DEMO-004", "08 Sep 2026", "Operativo", "Warehouse", "Centro internacional", "Warehouse Partner Demo", "USD 2.480", "Supervisor Courier Demo", "Aprobado demo"),
      expense("EXP-DEMO-005", "10 Sep 2026", "Operativo", "Carga aérea", "Centro internacional", "Air Cargo Demo", "USD 4.900", "Supervisor Courier Demo", "Pendiente", { shipmentId: "NXS-MIA-ASU-260918-A" }),
      expense("EXP-DEMO-006", "11 Sep 2026", "Operativo", "Delivery", "Delivery", "Delivery Partner Demo", "₲ 5.600.000", "Coordinador Delivery Demo", "Aprobado demo"),
      expense("EXP-DEMO-007", "12 Sep 2026", "Administrativo", "Alquiler", "Administración", "Inmobiliaria Demo", "₲ 8.500.000", "Administración Demo", "Aprobado demo"),
      expense("EXP-DEMO-008", "13 Sep 2026", "Administrativo", "Software", "Administración", "Software Demo", "USD 780", "Administración Demo", "Aprobado demo", { entryMode: "simple", amountValue: 780, description: "Software administrativo — Demo" }),
      expense("EXP-DEMO-009", "14 Sep 2026", "Administrativo", "Internet", "Administración", "ISP Demo", "₲ 1.240.000", "Administración Demo", "Revisión"),
      expense("EXP-DEMO-010", "15 Sep 2026", "Administrativo", "Viaje gerencia", "Gerencia", "Agencia Demo", "USD 1.150", "Gerencia Demo", "Pendiente"),
      expense("EXP-DEMO-011", "16 Sep 2026", "Personal", "Horas extra", "Operación Paraguay", "Personal interno demo", "DEMO · protegido", "RR. HH. Demo", "Pendiente", { employeeId: "EMP-COURIER-001" }),
      expense("EXP-DEMO-012", "17 Sep 2026", "Personal", "Reembolso", "Operación Paraguay", "Personal interno demo", "DEMO · protegido", "RR. HH. Demo", "Revisión", { employeeId: "EMP-CUSTOMS-001" }),
    ],
    employees: [
      ["EMP-COURIER-001", "Operador Courier Demo", "Courier", "Recepción", "07:58", "NFC", "Trabajando", "39h 22m demo", "2h 10m demo"],
      ["EMP-COURIER-002", "Supervisor Courier Demo", "Courier", "Warehouse", "07:51", "Dynamic QR", "Trabajando", "41h 05m demo", "3h 20m demo"],
      ["EMP-CUSTOMS-001", "Operador Aduana Demo", "Customs / Aduana", "Documentación", "08:04", "Dynamic QR", "Trabajando", "38h 48m demo", "0h 40m demo"],
      ["EMP-CUSTOMS-002", "Supervisor Aduana Demo", "Customs / Aduana", "Compliance", "08:12", "NFC", "Tardanza", "37h 55m demo", "0h 20m demo"],
    ].map(function employee(row) {
      return { employeeId: row[0], name: row[1], family: row[2], role: row[3], entry: row[4], method: row[5], attendanceStatus: row[6], weekHours: row[7], overtime: row[8], status: "Activo", worksite: "Centro de operaciones — Demo", shift: "08:00–17:00", exit: "—", device: "Registered Demo Device", appAccess: "Activo", roleExperience: row[2] };
    }),
    correction: { employeeId: "EMP-COURIER-001", employee: "Operador Courier Demo", current: "08:17", requested: "07:58", reason: "Olvidé marcar al ingresar.", status: "Pendiente" },
    overtime: [
      ["Operador Courier Demo", "16 Sep", "08:00–17:00", "10h 10m", "2h 10m", "Cierre de recepción demo", "Pendiente"],
      ["Supervisor Courier Demo", "15 Sep", "08:00–17:00", "11h 20m", "3h 20m", "Preparación de shipment demo", "Revisión"],
      ["Operador Aduana Demo", "14 Sep", "08:00–17:00", "8h 40m", "0h 40m", "Documentación demo", "Aprobado demo"],
    ],
    payments: [
      ["Operador Courier Demo", "Sep 2026", "39h 22m", "2h 10m", "DEMO · protegido", "DEMO · protegido", "Preparado demo"],
      ["Operador Aduana Demo", "Sep 2026", "38h 48m", "0h 40m", "DEMO · protegido", "DEMO · protegido", "Revisión demo"],
    ],
    receipts: [
      ["REC-DEMO-001", "EXP-DEMO-001", "Proveedor Handling Demo", "Aeropuerto / handling", "Adjunto", "02 Sep 2026"],
      ["REC-DEMO-003", "EXP-DEMO-003", "Gestión Documental Demo", "Documentación operativa", "Necesita revisión", "06 Sep 2026"],
      ["REC-DEMO-009", "EXP-DEMO-009", "ISP Demo", "Internet", "Pendiente", "14 Sep 2026"],
      ["REC-DEMO-012", "EXP-DEMO-012", "Personal interno demo", "Reembolso", "Aprobado", "17 Sep 2026"],
    ],
    reports: [
      ["Gastos mensuales", "Operativos, administrativos y personal", "NexCourier_Gastos_Septiembre.xlsx"],
      ["Aeropuerto", "Handling, transporte y documentación", "NexCourier_Aeropuerto_Septiembre.xlsx"],
      ["Administración", "Gastos internos por categoría", "NexCourier_Administracion_Septiembre.xlsx"],
      ["Personal", "Vista gerencial con valores protegidos", "NexCourier_Personal_Septiembre.xlsx"],
      ["Asistencia", "Courier, Aduana y excepciones", "NexCourier_Asistencia_Septiembre.xlsx"],
      ["Horas extra", "Pendientes y aprobaciones demo", "NexCourier_Horas_Extra_Septiembre.xlsx"],
      ["Operación", "Recepción, shipments e incidencias", "NexCourier_Operacion_Septiembre.xlsx"],
      ["Comparativo mensual", "Agosto vs. septiembre demo", "NexCourier_Comparativo_Mensual.xlsx"],
    ],
  };

  function deepFreeze(value) {
    Object.freeze(value);
    Object.values(value).forEach(function freezeNested(nested) {
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) deepFreeze(nested);
    });
    return value;
  }

  global.NEXCOURIER_PREMIUM_DEMO = deepFreeze(premiumData);
})(window);
