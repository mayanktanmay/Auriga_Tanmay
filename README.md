# FairShare

FairShare is a simple full-stack app for tracking shared contributions and settling group expenses fairly.

## Stack

- React + Vite + Tailwind CSS
- Node.js + Express
- In-memory JavaScript storage
- Axios

## Run locally

Prerequisites: Node.js 18+.

```bash
cp .env.example server/.env
npm run install:all
npm run dev
```

The Vite client runs at `http://localhost:5173` and proxies API requests to the Express server at `http://localhost:5000`. The API starts immediately and stores pools, members, payments, and settlements in memory.

You can also run each side separately with `npm run dev --prefix server` and `npm run dev --prefix client`. Data resets whenever the backend restarts.

## API

- `POST /api/pools` create a pool
- `GET /api/pools/:poolId` fetch a pool
- `GET /api/pools/:poolId/summary` calculate totals, equal share, and member balances
- `POST /api/pools/:poolId/import` clean and import pasted contribution rows
- `POST /api/pools/:poolId/members` add a member
- `PUT /api/pools/:poolId/members/:memberId` edit a member
- `DELETE /api/pools/:poolId/members/:memberId` delete a member
- `PUT /api/pools/:poolId/members/:memberId/payment` record a payment
- `GET|POST /api/pools/:poolId/settlement` read or generate suggested settlements
- `PATCH /api/pools/:poolId/settlement/:settlementId` mark a settlement complete

Financial calculations stay on the backend. Settlement uses a two-pointer matching algorithm to minimize the number of transfers between debtors and creditors.

## Contribution import

From the pool dashboard, open **Import past contributions** and paste one row per line in `name, amount` format. The importer accepts formats such as `₹1,250`, `Rs. 750`, and `1250.50`. It removes exact duplicate rows, merges case/spacing and one-character spelling variations into existing members, and rejects empty names, negative amounts, and malformed values. The dashboard reports imported rows, added amount, duplicates removed, merged names, and rejected rows with reasons.