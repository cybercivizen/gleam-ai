# Gleam AI - AI Coding Instructions

## Project Overview

Gleam AI is an AI-powered SaaS tool that integrates with Instagram Business accounts to read direct messages, automatically detect positive product reviews using sentiment analysis, and export them as testimonials for marketing.

## Tech Stack

- **Framework**: Next.js 16.1 (App Router architecture)
- **Language**: TypeScript 5 with strict mode enabled
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Components**: shadcn/ui (New York style) with Radix UI primitives
- **Icons**: lucide-react
- **Fonts**: Geist Sans and Geist Mono (Vercel fonts)

## Architecture & Structure

### Directory Organization

- `app/` - Next.js App Router pages and layouts (file-based routing)
- `components/ui/` - shadcn/ui components (auto-generated, avoid manual edits)
- `lib/` - Utility functions and shared logic
- `public/` - Static assets

### Import Aliases

All imports use TypeScript path aliases configured in [tsconfig.json](tsconfig.json):

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
```

### Adding UI Components

Use shadcn CLI to add pre-built components (never manually create UI components):

```bash
npx shadcn@latest add [component-name]
```

Components are installed to `components/ui/` with the New York style preset. They're built on Radix UI primitives and styled with Tailwind CSS.

## Styling Conventions

### Design System

- **CSS Framework**: Tailwind CSS v4 with `@import "tailwindcss"` syntax in [app/globals.css](app/globals.css)
- **Animations**: tw-animate-css plugin for pre-built animations
- **Theme**: Uses CSS custom properties with OKLCH color space for improved color accuracy
- **Dark Mode**: Class-based dark mode with `.dark` variant (`@custom-variant dark (&:is(.dark *))`)

### Color Tokens

All colors use semantic tokens (e.g., `bg-primary`, `text-foreground`) defined in [app/globals.css](app/globals.css). Never use arbitrary color values—use the design system tokens.

### Component Styling

Always use the `cn()` utility from [lib/utils.ts](lib/utils.ts) to merge Tailwind classes:

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

Example from [components/ui/button.tsx](components/ui/button.tsx):

```tsx
const buttonVariants = cva("base-classes", {
  variants: { variant: {...}, size: {...} },
  defaultVariants: { variant: "default", size: "default" }
})
```

### Server vs Client Components

- Default to Server Components (no `"use client"` directive)
- Add `"use client"` only when using hooks, event handlers, or browser APIs
- Current [app/page.tsx](app/page.tsx) is a Server Component with minimal client interactivity

## Key Files Reference

- [package.json](package.json) - Dependencies and scripts
- [tsconfig.json](tsconfig.json) - TypeScript config with path aliases
- [components.json](components.json) - shadcn/ui configuration (style, aliases, paths)
- [app/layout.tsx](app/layout.tsx) - Root layout with fonts and metadata
- [app/globals.css](app/globals.css) - Global styles, Tailwind imports, design tokens
- [lib/utils.ts](lib/utils.ts) - Shared utilities (currently just `cn()` helper)

## Instagram Integration Notes

The app's core feature is Instagram DM sentiment analysis for testimonial extraction. When implementing Instagram-related features:

- Use Instagram Business API (Graph API) for accessing DMs
- Consider rate limiting and API quotas
- Handle OAuth authentication flow for Instagram Business accounts
- Plan for webhook integration to receive real-time messages
