# NexCourier Friday demo contract

> **DEMO DATA ONLY — NOT PRODUCTION DATA.**
>
> **NO REAL BACKEND EXISTS YET.** All Friday web behavior must use the deterministic static dataset in `shared/data/demo-data.js`.

## One connected demo story

The public website, Mi NexCourier, and NexCourier Admin are separate web experiences that share one customer, one primary package, and one international shipment. Future feature branches must preserve these identifiers and must not create parallel copies of the demo data.

## Demo customer

| Concept | Value |
| --- | --- |
| Customer code | `NXC-10482` |
| Name | Cliente Demo |
| Email | `cliente.demo@example.com` |
| Locker code | `NXC-10482` |
| Locker location | Centro de recepción internacional — Demo |

The locker location is intentionally non-operational demo wording. Do not replace it with a fabricated street address.

## Packages

### Primary package

| Concept | Value |
| --- | --- |
| Internal package ID | `NXP-26-018392` |
| Merchant | Amazon |
| External carrier tracking | `1Z999AA10123456784` |
| Weight | 1.24 kg |
| Operational status | `RECEIVED_ORIGIN` |
| Customer label | Recibido en nuestro centro de recepción |
| Current location | Centro de recepción internacional — Demo |
| Requires action | No |

### Package requiring action

| Concept | Value |
| --- | --- |
| Internal package ID | `NXP-26-018401` |
| Merchant | SHEIN |
| External carrier tracking | `9405511200000000000000` |
| Weight | 0.82 kg |
| Operational status | `DOCUMENT_REQUIRED` |
| Customer label | Requiere tu atención |
| Required action | `MISSING_INVOICE` |
| Customer message | Necesitamos la factura de este paquete. |

## Shipment

| Concept | Value |
| --- | --- |
| Shipment ID | `NXS-MIA-ASU-260918-A` |
| Route | Miami → Asunción |
| Mode | `AIR` |
| Scheduled departure | 18 Sep 2026 · 21:30 |
| Package count | 184 |
| Gross weight | 312 kg |
| Status | `PREPARING` |

## Identifier rule

These identifiers represent different concepts and must remain separate:

- Customer code: `NXC-10482`
- External tracking: the carrier-provided tracking number
- Internal package ID: `NXP-26-018392`
- Shipment ID: `NXS-MIA-ASU-260918-A`

Never reuse one identifier as another.

## Demo state sequence

The allowed primary sequence is:

`RECEIVED_ORIGIN` → `READY_FOR_SHIPMENT` → `IN_TRANSIT` → `ARRIVED_PARAGUAY` → `READY_FOR_PICKUP` → `DELIVERED`

Allowed exception states:

- `DOCUMENT_REQUIRED`
- `UNIDENTIFIED`

| Code | Customer-facing label | Admin / operations label |
| --- | --- | --- |
| `RECEIVED_ORIGIN` | Recibido en nuestro centro de recepción | Recepción confirmada en origen |
| `READY_FOR_SHIPMENT` | Preparando envío a Paraguay | Listo para asignar a envío |
| `IN_TRANSIT` | En camino a Paraguay | Despachado / En tránsito |
| `ARRIVED_PARAGUAY` | Llegó a Paraguay | Arribado a Paraguay |
| `READY_FOR_PICKUP` | Listo para retirar | Habilitado para retiro o entrega |
| `DELIVERED` | Entregado | Entrega cerrada |
| `DOCUMENT_REQUIRED` | Requiere tu atención | Documento requerido |
| `UNIDENTIFIED` | Pendiente de identificación | No identificado |

Customer experiences must show the plain-language label as the primary status. Raw operational codes may appear only as secondary technical context when useful.

## Demo notifications

1. Nuevo paquete recibido
2. Tu paquete está en camino a Paraguay
3. Tu paquete llegó a Paraguay
4. Tu paquete está listo para retirar

## Product behavior and terminology

- A customer pre-alert is not mandatory. Reception and employee identification are the normal path for a package to appear.
- Ask the customer only for missing information or an explicit next action, such as an invoice, declared value, payment, delivery choice, or customs document.
- Use **Mi NexCourier** for the private customer experience.
- Use **NexCourier Admin** or **Operaciones** for the internal employee experience.
- Use **casillero** for the customer code and assigned receiving details; never publish a fabricated warehouse address.
- Use **paquete** for an individual parcel and **envío internacional** for the grouped movement toward Paraguay.

## Visual source

The existing public website under `apps/website/` is the visual source of truth. Shared shells derive their palette and typography from it:

- Navy: `#071C3F`
- Deep navy: `#04152E`
- Blue: `#1468E8`
- Gold: `#C8A24C`
- Light neutral: `#F7F9FC`
- Headings: Manrope
- Body: Inter

Feature branches must evolve the baseline without replacing it with a generic template or performing an unrequested framework migration.

## Local routes

Serve the repository root so all paths use the same origin:

- Public website: `/apps/website/`
- Customer portal: `/apps/customer/`
- Admin / Operations: `/apps/admin/`
- Development-only launcher: `/`

The public production-style navbar must not expose an Admin link. Cross-experience links in the customer and admin shells are explicitly labeled local demo navigation and are not product navigation.

## Branch contract

The Public Website, Customer Portal, and Admin / Operations feature branches must all start at the exact foundation commit recorded as `DEMO_FOUNDATION_SHA`. Integration and state simulation happen later, only after the three feature implementations are approved.
