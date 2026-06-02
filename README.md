# Cessland Homes

Normal Node/Express/MongoDB version of the Cessland Homes property management app.

## Setup

1. Copy `.env.example` to `.env`.
2. Put your MongoDB Atlas connection string in `MONGO_URI`.
3. Install dependencies:

```bash
npm install
```

4. Seed the first admin user:

```bash
npm run seed
```

5. Start the app:

```bash
npm run dev
```

Default seeded login:

- Email: `admin@cessland.com`
- Password: `Admin123!`

## Static prototypes

The previous static screens are kept in `public/`:

- `/login.html`
- `/dashboard-prototype.html`
- `/prototype.html`
