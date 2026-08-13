# Project: Assure-Backend

## Tech Stack
- Node.js 20+, Express.js
- Sequelize ORM, MySQL2
- JSON Web Tokens (JWT) & bcryptjs for Auth
- Razorpay SDK (Payments)

## Commands
- **Dev Server:** `npm run dev`
- **Start:** `npm start`

## Code Conventions
- **Modular Architecture:** Keep features logically separated in `src/modules/` (e.g., `src/modules/admin`, `src/modules/orders`).
- **Async/Await:** Always use `async/await` with `try/catch` blocks in controllers to handle errors gracefully.
- **Response Format:** Standardize all API responses: `{ success: boolean, message: string, data: object/array }`.
- **Environment Variables:** Never hardcode secrets. Always use `process.env.VARIABLE_NAME`.

## CRITICAL SAFETY & BOUNDARIES (Database & Schemas)
- **NEVER use `sequelize.sync({ force: true })`** — This will drop all tables and destroy live data. During initial dev, `sequelize.sync({ alter: true })` is acceptable, but eventually, all schema changes MUST go through formal Sequelize Migrations.
- **Role Isolation:** Always respect the 5-portal isolation rule. Do NOT merge Admins, Customers, Vendors, Technicians, and Drones into a single table. They must remain isolated per the Master PRD.
- **Data Privacy:** NEVER log plain-text passwords, JWT tokens, or full user objects to the console (`console.log`).
- **Security:** Always hash passwords with `bcryptjs` before a `save()` or `create()` operation.
- **Validation:** Always validate `req.body` payload before interacting with the database to prevent SQL injection or bad data insertion.
- **Environment:** Never commit `.env` files, database credentials, or secret keys.
- **Migrations:** Do not modify database schemas or add new migrations without discussing the impact first.
- **Rate Limiting:** Always ensure sensitive endpoints (like login/register/OTP) are protected by authentication middleware and rate limiting.
- **Dependencies:** Avoid introducing large dependencies without checking the performance or architecture implications.
- **DB Fields:** show me the fields what ever you are about to add or modify in the DB, first show, then i will approve or i will check modify, do not blindly add the fields directly without showing me first - is this clear.
- **DB Queries:** show me the queries what ever you are about to execute in the DB, first show, then i will approve or i will check modify, do not blindly execute the queries directly without showing me first - is this clear.
- **DB Updates:** If you have to update something in the DB, first check what fields are available in the DB, then check what fields are required, then show me the fields what ever you are about to add or modify in the DB, first show, then i will approve or i will check modify, do not blindly add the fields directly without showing me first - is this clear.