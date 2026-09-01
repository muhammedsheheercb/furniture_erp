# Furniture Shop & Manufacturing ERP

A comprehensive full-stack ERP system built for single owners managing both retail furniture sales and manufacturing units.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: MongoDB Atlas with Mongoose
- **Auth**: NextAuth.js (Credentials)
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

## Features

- **Dashboard**: Real-time KPIs and business overview.
- **Product Catalog**: Manage SKU, categories, and manufacturing status.
- **BOM Management**: Define raw materials and labor for manufactured items.
- **Sales Flow**: Quotations → Orders → Invoices (with PDF).
- **Manufacturing**: Track production stages from cutting to polishing.
- **Inventory**: Real-time raw material tracking with low-stock alerts.
- **CRM**: Customer history and outstanding balance tracking.
- **Expenses**: Operational cost monitoring.

## Getting Started

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```
3. **Setup environment variables**:
   Create a `.env.local` file based on `.env.example`:
   ```env
   MONGODB_URI=your_mongodb_uri
   NEXTAUTH_SECRET=your_secret
   NEXTAUTH_URL=http://localhost:3000
   ```
4. **Seed the database (Optional)**:
   ```bash
   npx ts-node src/scripts/seed.ts
   ```
5. **Run the development server**:
   ```bash
   npm run dev
   ```

## Initial Setup

If you are running for the first time without seeding:

- Navigate to `/register` to create your owner account.
- Once created, you will be redirected to the login page.

## License

MIT
