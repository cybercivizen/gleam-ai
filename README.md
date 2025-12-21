# Gleam AI

AI-powered SaaS tool that integrates with Instagram Business accounts to automatically detect positive product reviews from DMs using sentiment analysis and export them as testimonials.

## Tech Stack

- Next.js 16.1 (App Router) + TypeScript 5
- Tailwind CSS v4 + shadcn/ui (New York style)
- TanStack Table v8
- Prisma 7 (PostgreSQL with PrismaPg adapter)
- Instagram Graph API v24.0

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/gleam"
INSTAGRAM_CLIENT_ID="your_instagram_app_id"
INSTAGRAM_CLIENT_SECRET="your_instagram_app_secret"
INSTAGRAM_REDIRECT_URI="http://localhost:3000"  # or ngrok URL
META_VERIFY_TOKEN="your_webhook_verify_token"
NEXT_PUBLIC_IG_LOGIN_EMBEDDING_URL="https://www.instagram.com/oauth/authorize?..."
```

### 3. Database Setup (Prisma 7)

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (development)
npx prisma migrate dev --name init

# View database in Prisma Studio
npx prisma studio

# Reset database (⚠️ dev only)
npx prisma migrate reset --force

# Check migration status
npx prisma migrate status
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Useful Commands

### Development

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Prisma

```bash
npx prisma generate              # Regenerate Prisma Client after schema changes
npx prisma migrate dev           # Create and apply new migration
npx prisma migrate deploy        # Apply migrations in production
npx prisma db push               # Push schema changes without migration (prototyping)
npx prisma studio                # Open visual database editor
```

### shadcn/ui

```bash
npx shadcn@latest add [component]  # Add UI component (e.g., button, table)
npx shadcn@latest add              # Interactive component selector
```

### Webhook Testing (ngrok)

```bash
ngrok http 3000                    # Expose localhost for Instagram webhooks
# Update INSTAGRAM_REDIRECT_URI with ngrok URL
```

## Project Structure

```
app/
  actions.tsx              # Server Actions (Instagram API integration)
  page.tsx                 # Main UI (OAuth flow, message display)
  (messages)/              # Message table components
    columns.tsx            # TanStack Table column definitions
    data-table.tsx         # Reusable data table with pagination
  api/
    webhook/route.ts       # Meta webhook endpoint
    events/route.ts        # SSE endpoint for real-time updates
components/ui/             # shadcn/ui components (auto-generated)
lib/
  prisma.ts                # Prisma Client singleton
  types.ts                 # TypeScript types
  utils.ts                 # Utility functions (cn helper)
prisma/
  schema.prisma            # Database schema
```

## Key Features

- Instagram OAuth 2.0 authentication with long-lived tokens (60 days)
- Real-time message fetching from Instagram DMs
- TanStack Table with pagination and animations for new messages
- SSE (Server-Sent Events) for live updates
- Webhook integration for real-time Instagram events
- Prisma 7 with PostgreSQL adapter pattern

## Import Aliases

```typescript
@/components → components/
@/lib → lib/
@/ui → components/ui/
```
