# Gleam AI - AI Coding Instructions

## Project Overview

Gleam AI is an AI-powered SaaS tool that integrates with Instagram Business accounts to read direct messages, automatically detect positive product reviews using sentiment analysis, and export them as testimonials for marketing.

## Tech Stack

- **Framework**: Next.js 16.1 (App Router architecture)
- **Language**: TypeScript 5 with strict mode enabled
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Components**: shadcn/ui (New York style) with Radix UI primitives
- **Data Tables**: TanStack Table v8 (`@tanstack/react-table`)
- **Icons**: lucide-react
- **Fonts**: Geist Sans and Geist Mono (Vercel fonts)

## Architecture & Structure

### Directory Organization

- `app/` - Next.js App Router pages and layouts (file-based routing)
  - `app/actions.tsx` - Server Actions for Instagram API integration (marked with `"use server"`)
  - `app/(messages)/` - Route group for message-related components (columns, data-table)
  - `app/api/webhook/` - Meta webhook endpoint for real-time Instagram events
- `components/ui/` - shadcn/ui components (auto-generated, avoid manual edits)
- `lib/` - Utility functions and shared logic
  - `lib/types.ts` - TypeScript type definitions (`Message` type)
- `public/` - Static assets

### Import Aliases

All imports use TypeScript path aliases configured in `tsconfig.json`:

- `@/components` → `components/`
- `@/lib` → `lib/`
- `@/hooks` → `hooks/`
- `@/ui` → `components/ui/`

Example: `import { Button } from "@/components/ui/button"`

## Development Workflow

### Running the App

```bash
npm run dev     # Start development server on localhost:3000
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
npm i           # Install dependencies
```

### Adding UI Components

Use shadcn CLI to add pre-built components (never manually create UI components):

```bash
npx shadcn@latest add [component-name]
```

Components are installed to `components/ui/` with the New York style preset. They're built on Radix UI primitives and styled with Tailwind CSS.

## Styling Conventions

### Design System

- **CSS Framework**: Tailwind CSS v4 with `@import "tailwindcss"` syntax in `app/globals.css`
- **Animations**: tw-animate-css plugin for pre-built animations
- **Theme**: Uses CSS custom properties with OKLCH color space for improved color accuracy
- **Dark Mode**: Class-based dark mode with `.dark` variant (`@custom-variant dark (&:is(.dark *))`)

### Color Tokens

All colors use semantic tokens (e.g., `bg-primary`, `text-foreground`) defined in `app/globals.css`. Never use arbitrary color values—use the design system tokens.

### Component Styling

Always use the `cn()` utility from `lib/utils.ts` to merge Tailwind classes:

```tsx
import { cn } from "@/lib/utils";
<div className={cn("base-classes", conditionalClasses, className)} />;
```

## Component Patterns

### UI Components (shadcn/ui)

All UI components in `components/ui/` follow these patterns:

- Use `class-variance-authority` (CVA) for variant-based styling
- Support `asChild` prop for Radix Slot composition
- Forward all props to underlying elements
- Include comprehensive TypeScript types

Example from `components/ui/button.tsx`:

```tsx
const buttonVariants = cva("base-classes", {
  variants: { variant: {...}, size: {...} },
  defaultVariants: { variant: "default", size: "default" }
})
```

### Server vs Client Components

- **Default to Server Components** (no `"use client"` directive)
- Add `"use client"` only when using hooks, event handlers, or browser APIs
- **Server Actions Pattern**: `app/actions.tsx` uses `"use server"` for backend operations
  - All Instagram API calls are server-side functions
  - Cookie management via Next.js `cookies()` API
  - Functions return `{ success: boolean, data/error }` response pattern
- **Client Component**: `app/page.tsx` manages OAuth flow and UI state with React hooks

## Instagram Integration Architecture

### Authentication Flow (OAuth 2.0)

1. **Initial Authorization**: User clicks "Sign in with Instagram" → redirects to Instagram OAuth endpoint with `client_id`, `redirect_uri`, `response_type=code`, and scopes
2. **Token Exchange** (in `app/actions.tsx`):
   - `setupAccessToken(code)` orchestrates the flow:
     - `getShortLivedToken(code)` → exchanges auth code for short-lived token
     - `getLongLivedToken(shortLivedToken)` → converts to 60-day long-lived token
   - Stores token in HTTP-only cookies with 60-day expiration
3. **Profile Fetch**: `getUserProfile(accessToken)` retrieves user data and stores username in cookies

### Instagram Graph API Integration

**API Version**: v24.0 (specified in all Graph API calls)

**Core Server Actions** (in `app/actions.tsx`):

- `getConversations(accessToken)` - Fetch all DM conversations
- `getConversationMessages(conversationId, accessToken)` - Get message IDs from a conversation
- `getMessageDetails(messageId, accessToken)` - Fetch full message data (content, timestamp, sender)
- `getAllMessages(accessToken)` - Aggregates all messages using `Promise.all()` for parallel fetching

**Data Flow**:

```
Conversations → Message IDs → Message Details → Formatted Message[]
```

**Message Type** (from `lib/types.ts`):

```tsx
type Message = {
  username: string; // Formatted with "@" prefix
  content: string; // Message text
  timestamp: string; // Formatted as "YYYY-MM-DD HH:MM AM/PM"
};
```

### Webhook Integration

**Endpoint**: `app/api/webhook/route.ts`

- `GET` handler: Webhook verification (checks `META_VERIFY_TOKEN`)
- `POST` handler: Receives real-time Instagram events (logs to console, returns 200)
- **Future**: Integrate AI sentiment analysis on incoming webhook events

### Environment Variables Required

```bash
INSTAGRAM_CLIENT_ID           # Instagram App ID
INSTAGRAM_CLIENT_SECRET       # Instagram App Secret
INSTAGRAM_REDIRECT_URI        # OAuth callback URL (e.g., ngrok URL)
META_VERIFY_TOKEN            # Webhook verification token
NEXT_PUBLIC_IG_LOGIN_EMBEDDING_URL  # Full OAuth URL (optional, has fallback in code)
```

**Development Setup**: Use ngrok for local webhook testing (see terminal history: `ngrok config add-authtoken`)

## Data Presentation Pattern

### TanStack Table Integration

**Pattern**: Reusable `<DataTable>` component in `app/(messages)/data-table.tsx`

```tsx
// Define columns (type-safe with ColumnDef<T>)
export const columns: ColumnDef<Message>[] = [
  { accessorKey: "username", header: "Username" },
  { accessorKey: "content", header: "Message" },
  { accessorKey: "timestamp", header: "Timestamp" },
];

// Usage with loading state
<DataTable columns={columns} data={messages} isLoading={isTableLoading} />;
```

**Features**:

- Built-in pagination (`getPaginationRowModel()`)
- Loading state with `Loader2` icon from lucide-react
- Pagination controls in footer (Next/Previous buttons)

## Key Files Reference

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript config with path aliases
- `components.json` - shadcn/ui configuration (style, aliases, paths)
- `app/layout.tsx` - Root layout with fonts and metadata
- `app/page.tsx` - Main UI with OAuth handling and message display (Client Component)
- `app/actions.tsx` - Server Actions for Instagram API (all async operations)
- `app/api/webhook/route.ts` - Meta webhook endpoint for real-time events
- `app/(messages)/columns.tsx` - TanStack Table column definitions
- `app/(messages)/data-table.tsx` - Reusable table component with pagination
- `lib/types.ts` - Shared TypeScript types
- `lib/utils.ts` - Shared utilities (`cn()` helper)
- `app/globals.css` - Global styles, Tailwind imports, design tokens

## Project-Specific Patterns

### Error Handling Pattern

All Instagram API calls follow this structure:

```tsx
try {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Instagram API error details:", errorData);
    throw new Error(
      `Instagram API error: ${response.statusText} - ${JSON.stringify(
        errorData
      )}`
    );
  }
  const data = await response.json();
  return { success: true, data };
} catch (error) {
  console.error("Failed to...", error);
  return {
    success: false,
    error: error instanceof Error ? error.message : "Generic error",
  };
}
```

### Parallel Data Fetching

When fetching multiple resources, use `Promise.all()` for efficiency:

```tsx
const allMessagesArrays = await Promise.all(
  allMessagesIds.map(async (msgId: string) => {
    const messageDetails = await getMessageDetails(msgId, accessToken);
    return messageDetails;
  })
);
```

### Cookie Management

Tokens stored with consistent settings:

```tsx
cookieStore.set("key", value, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 60, // 60 days
});
```
