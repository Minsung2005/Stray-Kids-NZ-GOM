# GO Manager

Mobile-first group-order management for K-pop merch organisers in New Zealand. The static demo ships with seeded Stray Kids and ITZY orders, hash-based routes, joiner claim flows, a shop, private order lookup, rules, and an admin workspace.

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`. Demo data is stored in browser `localStorage`; reset the demo by clearing site storage.

Run the domain logic tests with:

```bash
npm test
```

## Routes

- `#orders` active group orders and artist filters
- `#go/<id>` claim flow with set, batch, and merch items
- `#shop` leftover stock
- `#my-orders` username/passcode lookup surface
- `#rules` public house rules
- `#admin` organiser queues and enhancement tools

## Supabase setup

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
2. Set the admin email in the database with `alter database postgres set app.admin_email = 'you@example.com';`.
3. Configure Auth with email/password for the organiser account.
4. Put the project URL and anon key in [`config.js`](config.js). Only the public anon key belongs in this file; never commit a service-role key.
5. Create a Storage bucket called `go-manager` for payment screenshots and item images. Add Storage policies matching the admin/public rules in the SQL editor.

The app remains usable in demo mode when the config is empty. When configured, the Supabase client subscribes to Postgres changes and the header realtime indicator becomes live. Production writes should be connected to the typed table helpers before enabling the admin tools for real users.

## GitHub Pages

The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) deploys the repository root to Pages whenever `main` changes. In repository settings, set Pages to **GitHub Actions**. Since this is a static site, hash routes work without server rewrites.

## Included organiser tools

The admin surface includes payment confirmation/rejection, a shipping queue, reminder, export, packing-list and profit/cost entry points, with demo feedback states. The schema provides claims, payment proofs, credits, shipment requests, store orders, blocked users and a claim edit log so those tools can be wired to live data without changing the public routes.

From Admin → GOs → Manage, organisers can add multiple dropdowns (items) to one group order, attach a picture to each dropdown, and move dropdowns up or down to control their public order.

Dropdowns can also be deleted. Set dropdowns accept a set count and member options; joiners select the members they want and see the number of complete sets still available.

New group orders include a sets-on-hand field. Set-based dropdowns secure at 80% of the configured set count for every member and show a visible `Secured` label on the GO once that threshold is reached.
