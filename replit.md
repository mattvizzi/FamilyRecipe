# Recipe Tracker

## Overview

Recipe Tracker is a family recipe management application that allows users to organize, share, and manage recipes within family groups. The app features AI-powered recipe extraction from photos, URLs, and text, enabling users to digitize recipes from cookbooks, handwritten notes, or websites. Built with a React frontend and Express backend, it uses PostgreSQL for data persistence and integrates with Replit's authentication and AI services.

## Recent Changes (December 2024)

### December 25, 2024
- **Route Architecture Refactor**: Split monolithic 1,460-line `routes.ts` into domain-specific routers:
  - `server/routes.ts` - Main entry point (~35 lines), mounts domain routers
  - `server/routes/family.ts` - Family CRUD, invite codes, join operations (6 routes)
  - `server/routes/recipes.ts` - Recipe CRUD, AI processing, comments, ratings, PDF export (18+ routes)
  - `server/routes/admin.ts` - Admin dashboard, HubSpot sync, AI chat (17+ routes)
  - `server/middleware.ts` - Centralized middleware: rate limiters, auth checks, helper utilities
- **Admin Subdomain Routing**: Production admin hosted on `admin.familyrecipe.app` with new URL structure:
  - `/dashboard` - Platform-wide statistics (users, families, recipes, public recipe percentage)
  - `/objects/users` - View all users with family associations and recipe counts
  - `/objects/families` - View all family groups with member/recipe counts and invite codes
  - `/objects/recipes` - Browse all recipes with visibility status and view counts
  - `/objects/comments` - View all recipe comments
  - `/integrations/hubspot` - Monitor CRM synchronization status
  - Server middleware redirects old `/admin/*` paths to new subdomain routes with query string preservation
  - Client-side routing detects hostname and uses appropriate paths
  - Cross-domain redirects use `useEffect` to avoid React render-time side effects
  - Unauthorized users are redirected to main domain (`familyrecipe.app`)
- **Admin Management System**: Complete admin section with PostgreSQL authentication:
  - Admin authentication via `admins` PostgreSQL table (just stores userId)
  - Hidden from search engines via `X-Robots-Tag: noindex` headers and meta tags
  - Bidirectional navigation: "Go to Admin" in main site profile dropdown for admins, "Go to Website" in admin area
- **HubSpot CRM Integration**: Automatic sync of app data to HubSpot:
  - Users sync as Contacts when they register
  - Families sync as Companies when created or updated
  - Recipes sync as Deals in a "FamilyRecipe Pipeline" with Public/Private stages
  - All syncing is non-blocking async to avoid slowing down the app
  - Uses description field to store app IDs for deduplication and lookup
- **CRITICAL CSRF fix**: Fixed AI recipe processing by replacing raw fetch() with apiRequest() helper that handles CSRF tokens
- **Rate limiting**: Added express-rate-limit on expensive endpoints:
  - `/api/recipes/process` (AI processing): 10 requests per 15 minutes per user
  - `/api/recipes/:id/pdf` (PDF export): 20 requests per 5 minutes per user
- **SEO improvements**: Added JSON-LD structured data (schema.org Recipe) to recipe detail pages with:
  - Recipe metadata (author, times, yield, category)
  - Ingredients and HowToStep instructions
  - Optional aggregateRating and image
  - Dynamic meta descriptions and canonical URLs
- **AI-powered SEO optimization**: Auto-generates SEO content during recipe creation:
  - `metaDescription`: 150-160 char compelling description for search results
  - `seoKeywords`: Array of 5-8 relevant search keywords
  - `imageAltText`: AI vision-generated alt text for recipe images
  - Database schema updated with new columns in `recipes` table
- **React Helmet SEO**: Added react-helmet-async for managing page meta tags:
  - Reusable SEO component with title templating and Open Graph support
  - SEO applied to landing page, home page, and public recipes page
  - Recipe detail pages use AI-generated descriptions when available
- **Performance improvements**: Added lazy loading (`loading="lazy"`) to all images
- **Cache invalidation fix**: Added `/api/recipes/saved` to invalidateRecipeQueries() helper
- **Frontend Feature-Based Restructure**: Reorganized client code into feature-based modules:
  - `client/src/features/recipes/` - Recipe pages and components (recipe-card, recipe-detail, add-recipe, etc.)
  - `client/src/features/family/` - Family pages (onboarding, settings, join)
  - `client/src/features/admin/` - Admin pages, components, and use-admin hook
  - `client/src/components/` - Shared components (header, seo, theme-toggle)
  - `client/src/pages/` - Core pages (landing, home, dashboard, not-found)
- **Dead Code Cleanup**: Removed 20 unused UI components and lib files, 3 npm packages (embla-carousel-react, input-otp, react-resizable-panels)

### Earlier in December
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

The frontend follows a feature-based architecture:
- `client/src/features/` - Domain-specific modules (recipes, family, admin) with pages and components
- `client/src/components/` - Shared components (header, seo, theme-toggle, ui primitives)
- `client/src/pages/` - Core pages (landing, home, dashboard, not-found)
- `client/src/hooks/` - Shared hooks (use-auth, use-toast, use-mobile)
- Protected routes for authenticated users with family onboarding flow
- Form validation via react-hook-form and Zod

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **File Storage**: Google Cloud Storage integration for recipe images

The backend is organized into:
- `server/routes.ts` - Main entry point (~35 lines), mounts domain routers
- `server/routes/family.ts` - Family CRUD, invite codes, join operations
- `server/routes/recipes.ts` - Recipe CRUD, AI processing, comments, ratings, PDF export
- `server/routes/admin.ts` - Admin dashboard, HubSpot sync, AI chat
- `server/middleware.ts` - Centralized middleware: rate limiters, auth checks, helper utilities
- `server/storage.ts` - Database abstraction layer
- `server/hubspot.ts` - HubSpot CRM integration service
- `server/replit_integrations/` - Modular integrations for auth and image generation

### Data Model
- **Families**: Groups of users who share recipes (with invite codes)
- **Family Members**: Junction table linking users to families
- **Recipes**: Core entity with groups of ingredients/instructions, categories, timing, and servings
- **Users/Sessions**: Managed via Replit Auth integration

### Key Design Decisions
1. **Family-based multi-tenancy**: Recipes belong to families, not individual users, enabling collaborative recipe management
2. **Grouped recipe structure**: Recipes support multiple ingredient/instruction groups (e.g., "Spaghetti" and "Meatballs" as separate groups within one recipe)
3. **AI recipe extraction**: Uses OpenAI integration for parsing recipes from photos, URLs, or raw text
4. **Fraction handling**: Shared utilities in `shared/lib/fraction.ts` for converting between decimals and cooking fractions (1/2, 1/4, etc.)

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
- **@hubspot/api-client**: HubSpot CRM integration for syncing users, families, and recipes

### CRM Integration
- **HubSpot API**: Via `HUBSPOT_ACCESS_TOKEN` environment variable
  - Syncs Users → Contacts (email, name)
  - Syncs Families → Companies (name, member count)
  - Syncs Recipes → Deals in FamilyRecipe Pipeline (Public/Private stages)
  - Service file: `server/hubspot.ts`