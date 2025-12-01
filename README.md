# Course Platform Backend (Node.js + MongoDB)

## Features
- User auth (register/login) with JWT
- Roles (user, admin)
- CRUD courses (admin)
- Orders (purchase courses)
- Cloudinary image upload (optional)
- Structured, ready-to-run project for graduation thesis

## Setup
1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run locally:
   ```bash
   npm run dev
   ```
4. API base: `http://localhost:5000/api`

## Notes
- This starter focuses on backend APIs. Connect your React frontend to these endpoints.
- Add Stripe or other payment gateway as needed.
