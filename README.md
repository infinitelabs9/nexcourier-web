# NexCourier Web

Static foundation for the NexCourier Friday demo. The repository contains three separate web experiences backed by one deterministic demo-data contract; it does not contain a real backend.

## Applications

- `apps/website/` — public/commercial website
- `apps/customer/` — Mi NexCourier foundation shell
- `apps/admin/` — NexCourier Admin foundation shell
- `shared/` — shared demo assets, styles, data, and JavaScript

## Run locally

From the repository root:

```powershell
py -m http.server 5600
```

Then open:

- <http://localhost:5600/apps/website/>
- <http://localhost:5600/apps/customer/>
- <http://localhost:5600/apps/admin/>

The root page is a development-only launcher. See `docs/NEXCOURIER_FRIDAY_DEMO_CONTRACT.md` before implementing any feature branch.
