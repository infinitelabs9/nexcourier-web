(function renderNexCourierDemoShell() {
  "use strict";

  const data = window.NEXCOURIER_DEMO_DATA;
  const root = document.querySelector("[data-demo-root]");

  if (!data || !root) {
    if (root) {
      root.innerHTML = '<p class="load-error">No se pudo cargar el contrato de datos de demo.</p>';
    }
    return;
  }

  const primaryPackage = data.packages[0];
  const actionPackage = data.packages[1];
  const values = {
    customerId: data.customer.customerId,
    customerName: data.customer.name,
    customerEmail: data.customer.email,
    lockerCode: data.customerLocker.lockerCode,
    lockerLocation: data.customerLocker.location,
    packageId: primaryPackage.packageId,
    packageMerchant: primaryPackage.merchant,
    packageStatus: primaryPackage.customerStatus,
    packageAdminStatus: data.statusCatalog[primaryPackage.status].admin,
    packageLocation: primaryPackage.currentLocation,
    actionPackageId: actionPackage.packageId,
    actionPackageStatus: actionPackage.customerStatus,
    actionPackageAdminStatus: data.statusCatalog[actionPackage.status].admin,
    actionPackageMessage: actionPackage.customerMessage,
    shipmentId: data.shipment.shipmentId,
    shipmentRoute: data.shipment.route,
    shipmentStatus: data.shipment.status,
    demoLabel: data.meta.label,
  };

  Object.entries(values).forEach(function setDemoValue(entry) {
    const key = entry[0];
    const value = entry[1];
    document.querySelectorAll('[data-demo="' + key + '"]').forEach(function update(node) {
      node.textContent = value;
    });
  });

  root.dataset.loaded = "true";
})();
