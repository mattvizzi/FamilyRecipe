# Recipe Tracker

## Overview

Recipe Tracker is a family recipe management application that allows users to organize, share, and manage recipes within family groups. The app features AI-powered recipe extraction from photos, URLs, and text, enabling users to digitize recipes from cookbooks, handwritten notes, or websites. Built with a React frontend and Express backend, it uses PostgreSQL for data persistence and integrates with Replit's authentication and AI services.

## Recent Changes (December 2024)

- **OpenSea-inspired design rebrand**: Dark minimal aesthetic with flat design, 1px borders for depth, no shadows/glows
- Updated color system: dark neutrals (#0c0c0d base, #1a1a1d cards, #2a2a2d borders), electric blue primary (#2081e2)
- Added monospace font utility (`.font-data`) for numerical data display (times, servings, recipe IDs)
- Removed premium effects: glassmorphism, shadows, glows, gradients, backdrop blur, image zoom
- Implemented complete frontend with landing page, home page (grid/list view), recipe detail with scaling, AI wizard, manual entry form, family settings, and family onboarding
- Created backend API routes for families (CRUD, invite/join) and recipes (CRUD, AI processing, PDF export)
- Added recipe scaling with fraction display (1/2, 1/4, 2/3, etc.) using custom fraction utility
- Fixed family API to return null with 200 status (not 404) for proper onboarding flow
- Added validation for AI-extracted recipe data to ensure proper structure

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with path aliases (`@/` for client src, `@shared/` for shared code)
- **Design System**: OpenSea-inspired dark minimal aesthetic with Inter/JetBrains Mono fonts

The frontend follows a page-based architecture with:
- Protected routes for authenticated users
- Family onboarding flow for new users
- Recipe CRUD operations with form validation via react-hook-form and Zod

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **File Storage**: Google Cloud Storage integration for recipe images

The backend is organized into:
- `server/routes.ts` - Main API routes
- `server/storage.ts` - Database abstraction layer
- `server/replit_integrations/` - Modular integrations for auth, chat, image generation, and object storage

### Data Model
- **Families**: Groups of users who share recipes (with invite codes)
- **Family Members**: Junction table linking users to families
- **Recipes**: Core entity with groups of ingredients/instructions, categories, timing, and servings
- **Users/Sessions**: Managed via Replit Auth integration

### Key Design Decisions
1. **Family-based multi-tenancy**: Recipes belong to families, not individual users, enabling collaborative recipe management
2. **Grouped recipe structure**: Recipes support multiple ingredient/instruction groups (e.g., "Spaghetti" and "Meatballs" as separate groups within one recipe)
3. **AI recipe extraction**: Uses OpenAI integration for parsing recipes from photos, URLs, or raw text
4. **Fraction handling**: Custom utilities for converting between decimals and cooking fractions (1/2, 1/4, etc.)

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema defined in `shared/schema.ts`, migrations in `/migrations`

### Authentication
- **Replit Auth**: OpenID Connect provider requiring `ISSUER_URL`, `REPL_ID`, and `SESSION_SECRET` environment variables

### AI Services
- **OpenAI API**: Via Replit AI Integrations for recipe parsing and image generation
  - Requires `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`

### File Storage
- **Google Cloud Storage**: For recipe images via `@google-cloud/storage`
- **Uppy**: Client-side file upload handling with presigned URLs

### Third-Party Libraries
- **PDFKit**: Server-side PDF generation for recipe exports
- **Framer Motion**: Animations on the frontend
- **shadcn/ui + Radix UI**: Accessible UI component primitives