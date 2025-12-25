# Recipe Tracker - Launch Cleanup Plan

**Document Version:** 1.1  
**Created:** December 25, 2025  
**Estimated Total Effort:** 18-20 hours  

---

## Executive Summary

This document outlines the comprehensive cleanup plan required before launching the Recipe Tracker application. The plan addresses **25 identified issues** across 5 categories: Critical Infrastructure, Security, Performance, User Experience, and Production Readiness.

### Issues Covered (25 Total)

| # | Issue | Phase | Priority |
|---|-------|-------|----------|
| 1 | Database not provisioned | 1 | Critical |
| 2 | Recipe images stored as base64 | 1 | Critical |
| 3 | Public endpoints unprotected | 1 | Critical |
| 4 | Missing rate limiting on public endpoints | 1 | Critical |
| 5 | View count inflation | 1 | Critical |
| 6 | Basic sanitization function | 2 | Security |
| 7 | Missing URL validation (SSRF risk) | 2 | Security |
| 8 | Profanity filter bypass-able | 2 | Security |
| 9 | PDF export missing sanitization | 2 | Security |
| 10 | No global rate limiting | 2 | Security |
| 11 | No pagination on recipe endpoints | 2 | Performance |
| 12 | N+1 queries in getRecipeWithStats | 2 | Performance |
| 13 | Public recipes filtering in JavaScript | 2 | Performance |
| 14 | No database connection pooling config | 2 | Performance |
| 15 | No error recovery for AI processing | 3 | UX |
| 16 | Missing loading states on buttons | 3 | UX |
| 17 | No search for public recipes | 3 | UX |
| 18 | Missing SEO meta tags | 4 | UX |
| 19 | No keyboard navigation for recipe cards | 3 | UX |
| 20 | Inconsistent error messages | 4 | Code Quality |
| 21 | Missing TypeScript strict checks | 4 | Code Quality |
| 22 | Duplicate HEIC conversion logic | 3 | Code Quality |
| 23 | Missing error monitoring/logging | 4 | Production |
| 24 | No health check endpoint | 4 | Production |
| 25 | HubSpot errors not gracefully handled | 4 | Production |

### Phase Overview (4 Phases)

| Phase | Focus Area | Duration | Dependencies |
|-------|-----------|----------|--------------|
| Phase 1 | Critical Infrastructure | ~5 hours | None |
| Phase 2 | Security & Performance | ~6 hours | Phase 1 complete |
| Phase 3 | Frontend Polish & UX | ~4 hours | Phase 2 API changes complete |
| Phase 4 | Production Readiness & Testing | ~5 hours | Phases 1-3 complete |

---

## Phase 1: Critical Infrastructure (5 hours)

### 1.1 Provision Production Database

**Issue #1: Database not provisioned**

**Current Problem:**
- Database status shows not provisioned
- App uses PostgreSQL but production database not set up
- Migrations not applied to production

**Implementation Steps:**

1. **Provision PostgreSQL database**
   ```
   - Use Replit's built-in PostgreSQL (Neon-backed)
   - Run create_postgresql_database_tool
   - Verify DATABASE_URL environment variable is set
   ```

2. **Run database migrations**
   ```bash
   npx drizzle-kit push
   ```

3. **Verify tables created**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

**Verification Criteria:**
- [ ] DATABASE_URL environment variable exists
- [ ] All tables created (recipes, users, families, etc.)
- [ ] Application connects successfully on startup
- [ ] CRUD operations work correctly

**Rollback Plan:**
- Database can be re-provisioned if issues arise
- Drizzle migrations are idempotent

---

### 1.2 Migrate Recipe Images from Base64 to Object Storage

**Issue #2: Recipe images stored as base64 in database**

**Current Problem:**
- AI-generated recipe images stored as base64 strings in `imageUrl` field
- Base64 images are ~33% larger than binary
- Single recipe image can be 500KB-2MB, bloating the database
- Queries slow when loading recipes with embedded images
- Risk of hitting request/response size limits

**Files Affected:**
- `server/routes.ts` - AI processing endpoint
- `server/storage.ts` - Recipe CRUD operations
- `client/src/pages/recipe-detail.tsx` - Image display
- `client/src/pages/home.tsx` - Recipe card images

**Implementation Steps:**

1. **Set up Object Storage bucket**
   ```typescript
   // Use Replit Object Storage integration
   // Create bucket with public read access for images
   // Configure proper CORS headers
   ```

2. **Create image upload utility**
   ```typescript
   // server/imageStorage.ts
   import { Storage } from '@google-cloud/storage';
   
   export async function uploadRecipeImage(
     base64Data: string, 
     recipeId: string
   ): Promise<string> {
     const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
     const filename = `recipes/${recipeId}-${Date.now()}.jpg`;
     
     await bucket.file(filename).save(buffer, {
       contentType: 'image/jpeg',
       public: true,
     });
     
     return `https://storage.googleapis.com/${bucketName}/${filename}`;
   }
   ```

3. **Modify AI processing endpoint**
   ```typescript
   // In POST /api/recipes/process
   // After AI returns base64 image:
   let imageUrl = null;
   if (aiResult.imageBase64) {
     try {
       imageUrl = await uploadRecipeImage(aiResult.imageBase64, recipe.id);
     } catch (err) {
       console.error('Image upload failed:', err);
       // Recipe saves without image - graceful degradation
     }
   }
   ```

4. **Create migration script for existing recipes**
   ```typescript
   // scripts/migrate-images.ts
   const recipes = await db.select().from(recipesTable)
     .where(sql`image_url LIKE 'data:image%'`);
   
   for (const recipe of recipes) {
     const newUrl = await uploadRecipeImage(recipe.imageUrl, recipe.id);
     await db.update(recipesTable)
       .set({ imageUrl: newUrl })
       .where(eq(recipesTable.id, recipe.id));
     console.log(`Migrated: ${recipe.name}`);
   }
   ```

**Verification Criteria:**
- [ ] New recipes created via AI have Object Storage URLs (not base64)
- [ ] Existing recipes with base64 images are migrated
- [ ] Images load correctly on recipe detail pages
- [ ] Images display correctly on recipe cards/thumbnails
- [ ] Failed image uploads don't crash recipe creation
- [ ] Database query times improve (measure before/after)

**Rollback Plan:**
- Keep original base64 detection in image display components
- Migration script logs allow re-running on failures
- Object Storage URLs and base64 both render correctly

---

### 1.3 Add Rate Limiting to Public Endpoints

**Issues #3 & #4: Public endpoints unprotected, missing rate limiting**

**Current Problem:**
- `/api/public/recipes` has no authentication or rate limiting
- Vulnerable to scraping and abuse
- Could overwhelm the database with unlimited requests

**Files Affected:**
- `server/routes.ts` - Add rate limiter middleware

**Implementation Steps:**

1. **Create public endpoint rate limiter**
   ```typescript
   import rateLimit from 'express-rate-limit';
   
   const publicRateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // 100 requests per window per IP
     message: { message: "Too many requests, please try again later" },
     standardHeaders: true,
     legacyHeaders: false,
     keyGenerator: (req) => req.ip || 'unknown',
   });
   ```

2. **Apply to public endpoints**
   ```typescript
   app.get("/api/public/recipes", publicRateLimiter, async (req, res) => {
     // ... existing handler
   });
   ```

**Verification Criteria:**
- [ ] Public endpoint returns 429 after exceeding limit
- [ ] Rate limit headers present in responses (`RateLimit-*`)
- [ ] Legitimate users not affected under normal use
- [ ] Different IPs have independent rate limits

**Rollback Plan:**
- Remove middleware from route if issues arise
- Increase limits if legitimate users are affected

---

### 1.4 Fix View Count Inflation

**Issue #5: View count increments on every request**

**Current Problem:**
- `/api/recipes/:id/stats` increments view count on every call
- Page refreshes, back-button navigation all inflate counts
- No debouncing or session tracking

**Files Affected:**
- `server/routes.ts` - Stats endpoint
- `server/storage.ts` - View tracking logic (optional)

**Implementation Steps:**

1. **Add session-based view tracking**
   ```typescript
   // In GET /api/recipes/:id/stats handler
   // Initialize session tracking array if not exists
   if (!req.session.viewedRecipes) {
     req.session.viewedRecipes = [];
   }
   
   // Only increment if not already viewed in this session
   if (!req.session.viewedRecipes.includes(id)) {
     await storage.incrementViewCount(id);
     req.session.viewedRecipes.push(id);
   }
   ```

2. **Update session type definition**
   ```typescript
   // In session configuration
   declare module 'express-session' {
     interface SessionData {
       viewedRecipes: string[];
     }
   }
   ```

**Verification Criteria:**
- [ ] Refreshing page doesn't increment view count
- [ ] Different users viewing same recipe both count
- [ ] Same user viewing different recipes counts for each
- [ ] View counts display correctly on recipe pages
- [ ] Session clears appropriately (new session = new views)

**Rollback Plan:**
- Revert to simple increment if session tracking causes issues
- View counts may be inflated but app remains functional

---

## Phase 2: Security & Performance (6 hours)

### 2.1 Add Global Rate Limiting

**Issue #10: No global rate limiting**

**Current Problem:**
- No protection against brute-force attacks
- No protection against general API abuse
- Individual rate limiters exist but no global protection

**Files Affected:**
- `server/routes.ts` - Add global middleware

**Implementation Steps:**

1. **Add global rate limiter**
   ```typescript
   const globalRateLimiter = rateLimit({
     windowMs: 60 * 1000, // 1 minute
     max: 100, // 100 requests per minute per IP
     message: { message: "Too many requests, please slow down" },
     standardHeaders: true,
     legacyHeaders: false,
     skip: (req) => {
       // Skip for health check endpoint
       return req.path === '/api/health';
     },
   });
   
   // Apply to all API routes
   app.use('/api', globalRateLimiter);
   ```

**Verification Criteria:**
- [ ] More than 100 requests/minute from same IP returns 429
- [ ] Normal usage not affected
- [ ] Rate limit headers in all API responses
- [ ] Health check endpoint excluded from rate limiting

---

### 2.2 Upgrade HTML Sanitization

**Issue #6: Basic sanitization function**

**Current Problem:**
- Current `sanitizeHtml` only escapes `<`, `>`, `&`, `"`, `'`
- Doesn't handle all XSS vectors (event handlers, javascript: URLs, etc.)
- Comments and recipe content could contain malicious scripts

**Files Affected:**
- `server/routes.ts` - sanitizeHtml function

**Implementation Steps:**

1. **Install proper sanitization library**
   ```bash
   npm install isomorphic-dompurify
   ```

2. **Update sanitization function**
   ```typescript
   import DOMPurify from 'isomorphic-dompurify';
   
   function sanitizeHtml(input: string): string {
     return DOMPurify.sanitize(input, {
       ALLOWED_TAGS: [], // Strip ALL HTML tags
       ALLOWED_ATTR: [], // Strip ALL attributes
       KEEP_CONTENT: true, // Keep text content
     });
   }
   ```

3. **Apply to all user inputs**
   - Recipe names, descriptions
   - Comments
   - Family names
   - User-provided text

**Verification Criteria:**
- [ ] `<script>alert('xss')</script>` becomes `alert('xss')`
- [ ] `<img onerror="alert('xss')">` is stripped
- [ ] `javascript:alert('xss')` is stripped
- [ ] Normal text content preserved
- [ ] Unicode characters handled correctly
- [ ] Emojis preserved (if allowed)

---

### 2.3 Add URL Validation for AI Processing (SSRF Prevention)

**Issue #7: Missing URL validation (SSRF risk)**

**Current Problem:**
- Users can paste any URL for recipe extraction
- No validation of URL format or destination
- Server could be tricked into accessing internal resources

**Files Affected:**
- `server/routes.ts` - Recipe processing endpoint

**Implementation Steps:**

1. **Create URL validation utility**
   ```typescript
   // server/urlValidator.ts
   const BLOCKED_HOSTS = [
     'localhost',
     '127.0.0.1',
     '0.0.0.0',
     '::1',
     '169.254.169.254', // AWS/GCP metadata
     'metadata.google.internal',
   ];
   
   const BLOCKED_IP_PREFIXES = [
     '10.',        // Private Class A
     '172.16.',    // Private Class B (172.16-31.x.x)
     '172.17.',
     '172.18.',
     '172.19.',
     '172.20.',
     '172.21.',
     '172.22.',
     '172.23.',
     '172.24.',
     '172.25.',
     '172.26.',
     '172.27.',
     '172.28.',
     '172.29.',
     '172.30.',
     '172.31.',
     '192.168.',   // Private Class C
     'fd',         // IPv6 private
     'fe80:',      // IPv6 link-local
   ];
   
   export function isValidRecipeUrl(url: string): { valid: boolean; reason?: string } {
     try {
       const parsed = new URL(url);
       
       // Must be http or https
       if (!['http:', 'https:'].includes(parsed.protocol)) {
         return { valid: false, reason: 'Only HTTP/HTTPS URLs are allowed' };
       }
       
       // Check for blocked hosts
       const hostname = parsed.hostname.toLowerCase();
       if (BLOCKED_HOSTS.includes(hostname)) {
         return { valid: false, reason: 'This URL is not allowed' };
       }
       
       // Check for blocked IP prefixes
       for (const prefix of BLOCKED_IP_PREFIXES) {
         if (hostname.startsWith(prefix)) {
           return { valid: false, reason: 'Private network addresses are not allowed' };
         }
       }
       
       // Block direct IP addresses entirely (be conservative)
       if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
         return { valid: false, reason: 'Direct IP addresses are not allowed' };
       }
       
       // Block file:// and other dangerous protocols
       if (parsed.protocol === 'file:') {
         return { valid: false, reason: 'File URLs are not allowed' };
       }
       
       return { valid: true };
     } catch {
       return { valid: false, reason: 'Invalid URL format' };
     }
   }
   ```

2. **Apply validation in route**
   ```typescript
   if (method === 'url') {
     const validation = isValidRecipeUrl(content);
     if (!validation.valid) {
       return res.status(400).json({ message: validation.reason });
     }
   }
   ```

**Verification Criteria:**
- [ ] `http://localhost/admin` rejected
- [ ] `http://127.0.0.1:8080` rejected
- [ ] `http://169.254.169.254/latest/meta-data` rejected
- [ ] `http://192.168.1.1` rejected
- [ ] `http://10.0.0.1` rejected
- [ ] `https://allrecipes.com/recipe/123` accepted
- [ ] `ftp://example.com/file` rejected
- [ ] Clear error messages for each rejection

---

### 2.4 Harden Profanity Filter

**Issue #8: Profanity filter is bypass-able**

**Current Problem:**
- Simple word list approach
- Can be bypassed with:
  - Leetspeak: `f*ck`, `sh1t`
  - Spacing: `f u c k`
  - Unicode lookalikes: `fυck` (Greek upsilon)
  - Partial matching misses: `shitty`

**Files Affected:**
- `server/routes.ts` - containsProfanity function

**Implementation Steps:**

1. **Enhance profanity detection**
   ```typescript
   // Normalize text before checking
   function normalizeText(text: string): string {
     return text
       .toLowerCase()
       // Remove common leetspeak substitutions
       .replace(/0/g, 'o')
       .replace(/1/g, 'i')
       .replace(/3/g, 'e')
       .replace(/4/g, 'a')
       .replace(/5/g, 's')
       .replace(/7/g, 't')
       .replace(/8/g, 'b')
       .replace(/@/g, 'a')
       .replace(/\$/g, 's')
       .replace(/\*/g, '')
       // Remove spaces between letters
       .replace(/\s+/g, '')
       // Remove common separators
       .replace(/[-_.]/g, '');
   }
   
   function containsProfanity(text: string): boolean {
     const normalized = normalizeText(text);
     
     return profanityList.some(word => {
       // Check exact match
       if (normalized.includes(word)) return true;
       
       // Check original text with word boundaries
       const regex = new RegExp(`\\b${word}\\b`, 'i');
       return regex.test(text.toLowerCase());
     });
   }
   ```

2. **Consider using a library for production**
   ```typescript
   // Alternative: Use a battle-tested library
   import Filter from 'bad-words';
   const filter = new Filter();
   
   function containsProfanity(text: string): boolean {
     return filter.isProfane(text);
   }
   ```

**Verification Criteria:**
- [ ] `f*ck` detected
- [ ] `sh1t` detected
- [ ] `f u c k` detected
- [ ] `shitty` detected
- [ ] Normal recipe text not falsely flagged
- [ ] Common cooking terms not flagged (e.g., "breast", "balls" in meatballs)

---

### 2.5 Sanitize PDF Export Input

**Issue #9: PDF export missing input sanitization**

**Current Problem:**
- Recipe content goes directly into PDF generation
- Could allow PDF injection attacks
- No validation of recipe content before rendering

**Files Affected:**
- `server/routes.ts` - PDF export endpoint

**Implementation Steps:**

1. **Sanitize all text before PDF rendering**
   ```typescript
   // In PDF export handler
   function sanitizeForPdf(text: string): string {
     if (!text) return '';
     
     return text
       // Remove control characters
       .replace(/[\x00-\x1F\x7F]/g, '')
       // Escape potential PDF operators
       .replace(/[()\\]/g, (match) => '\\' + match)
       // Limit length to prevent overflow
       .substring(0, 10000);
   }
   
   // Apply to all content
   doc.fontSize(24).text(sanitizeForPdf(recipe.name), { align: "center" });
   ```

2. **Validate recipe data before rendering**
   ```typescript
   // Validate recipe has required fields
   if (!recipe.name || !recipe.groups || recipe.groups.length === 0) {
     return res.status(400).json({ message: "Recipe data incomplete" });
   }
   ```

**Verification Criteria:**
- [ ] Recipe with `\\n` in name doesn't break PDF
- [ ] Recipe with `(` or `)` in content renders correctly
- [ ] Very long recipe names truncated appropriately
- [ ] PDF generates successfully for normal recipes
- [ ] No error for recipes with special characters

---

### 2.6 Add Pagination to Recipe Endpoints

**Issue #11: No pagination on recipe endpoints**

**Current Problem:**
- All recipe endpoints return full result sets
- `/api/recipes` - All family recipes
- `/api/public/recipes` - All public recipes
- `/api/recipes/saved` - All saved recipes
- Performance degrades as recipe count grows

**Files Affected:**
- `server/routes.ts` - All recipe list endpoints
- `server/storage.ts` - Query methods
- `client/src/pages/home.tsx` - Recipe list display
- `client/src/pages/explore.tsx` - Public recipes display

**Implementation Steps:**

1. **Define pagination types**
   ```typescript
   // shared/schema.ts or server/types.ts
   interface PaginationParams {
     page?: number;
     limit?: number;
   }
   
   interface PaginatedResult<T> {
     data: T[];
     pagination: {
       page: number;
       limit: number;
       total: number;
       totalPages: number;
       hasMore: boolean;
     };
   }
   ```

2. **Update storage methods**
   ```typescript
   async getRecipes(
     familyId: string, 
     params: PaginationParams = {}
   ): Promise<PaginatedResult<Recipe>> {
     const page = params.page || 1;
     const limit = Math.min(params.limit || 20, 100); // Max 100
     const offset = (page - 1) * limit;
     
     const [recipes, countResult] = await Promise.all([
       db.select().from(recipesTable)
         .where(eq(recipesTable.familyId, familyId))
         .orderBy(desc(recipesTable.createdAt))
         .limit(limit)
         .offset(offset),
       db.select({ count: sql<number>`count(*)` })
         .from(recipesTable)
         .where(eq(recipesTable.familyId, familyId))
     ]);
     
     const total = Number(countResult[0].count);
     
     return {
       data: recipes,
       pagination: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit),
         hasMore: page * limit < total,
       },
     };
   }
   ```

3. **Update API endpoints**
   ```typescript
   app.get("/api/recipes", isAuthenticated, async (req, res) => {
     const page = parseInt(req.query.page as string) || 1;
     const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
     
     const result = await storage.getRecipes(familyId, { page, limit });
     res.json(result);
   });
   ```

4. **Update frontend to handle pagination**
   ```typescript
   // Option A: Load more button
   const [page, setPage] = useState(1);
   
   const { data } = useQuery({
     queryKey: ['/api/recipes', { page }],
   });
   
   // Option B: Infinite scroll with react-query
   const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
     queryKey: ['/api/recipes'],
     getNextPageParam: (lastPage) => 
       lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
   });
   ```

**Verification Criteria:**
- [ ] Endpoints accept `page` and `limit` query parameters
- [ ] Response includes pagination metadata
- [ ] Default limit is 20
- [ ] Maximum limit is enforced (100)
- [ ] Frontend handles paginated data correctly
- [ ] Existing functionality (search, filter) still works
- [ ] Empty pages handled gracefully

**Rollback Plan:**
- Endpoints still work without pagination params (return first page)
- Frontend can fall back to loading all data

---

### 2.7 Fix N+1 Queries in getRecipeWithStats

**Issue #12: N+1 queries in getRecipeWithStats**

**Current Problem:**
- `getRecipeWithStats` makes 5-6 separate queries per request:
  1. Get recipe
  2. Get creator info
  3. Get view count
  4. Get average rating
  5. Get user's rating
  6. Get save status
- Each recipe detail page = 6 database round trips

**Files Affected:**
- `server/storage.ts` - `getRecipeWithStats` method

**Implementation Steps:**

1. **Combine into optimized query**
   ```typescript
   async getRecipeWithStats(recipeId: string, userId: string) {
     const result = await db.execute(sql`
       SELECT 
         r.*,
         u.first_name as creator_first_name,
         u.last_name as creator_last_name,
         u.profile_image_url as creator_image,
         COALESCE(rv.view_count, 0)::int as view_count,
         COALESCE(
           (SELECT AVG(rating)::numeric(3,2) FROM ratings WHERE recipe_id = r.id), 
           0
         ) as avg_rating,
         COALESCE(
           (SELECT COUNT(*) FROM ratings WHERE recipe_id = r.id), 
           0
         )::int as rating_count,
         (SELECT rating FROM ratings WHERE recipe_id = r.id AND user_id = ${userId}) as user_rating,
         EXISTS(SELECT 1 FROM saved_recipes WHERE recipe_id = r.id AND user_id = ${userId}) as is_saved
       FROM recipes r
       LEFT JOIN users u ON r.created_by_id = u.id
       LEFT JOIN recipe_views rv ON r.id = rv.recipe_id
       WHERE r.id = ${recipeId}
     `);
     
     return result.rows[0] || null;
   }
   ```

**Verification Criteria:**
- [ ] Recipe detail page loads with 1-2 queries (check server logs)
- [ ] All stats display correctly (views, rating, saved status)
- [ ] Creator info displays correctly
- [ ] Page load time improves measurably
- [ ] User-specific data (their rating, save status) correct

**Rollback Plan:**
- Keep original implementation available
- Can revert if JOIN query has issues

---

### 2.8 Move Public Recipes Filtering to SQL

**Issue #13: Public recipes filtering in JavaScript**

**Current Problem:**
```typescript
// Current: Fetches ALL then filters in JS
const recipes = await storage.getPublicRecipes();
return category ? recipes.filter(r => r.category === category) : recipes;
```

**Files Affected:**
- `server/storage.ts` - `getPublicRecipes` method

**Implementation Steps:**

1. **Update storage method**
   ```typescript
   async getPublicRecipes(options: { 
     category?: string; 
     search?: string;
     page?: number;
     limit?: number;
   } = {}): Promise<PaginatedResult<Recipe>> {
     const { category, search, page = 1, limit = 20 } = options;
     const offset = (page - 1) * limit;
     
     let conditions = [eq(recipesTable.isPublic, true)];
     
     if (category) {
       conditions.push(eq(recipesTable.category, category));
     }
     
     if (search) {
       conditions.push(
         or(
           ilike(recipesTable.name, `%${search}%`),
           ilike(recipesTable.description, `%${search}%`)
         )
       );
     }
     
     const whereClause = and(...conditions);
     
     const [recipes, countResult] = await Promise.all([
       db.select().from(recipesTable)
         .where(whereClause)
         .orderBy(desc(recipesTable.createdAt))
         .limit(limit)
         .offset(offset),
       db.select({ count: sql<number>`count(*)` })
         .from(recipesTable)
         .where(whereClause)
     ]);
     
     const total = Number(countResult[0].count);
     
     return {
       data: recipes,
       pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total }
     };
   }
   ```

**Verification Criteria:**
- [ ] Category filtering works correctly
- [ ] No category returns all public recipes
- [ ] Search filtering works
- [ ] Combined category + search works
- [ ] Response times improve for filtered requests

---

### 2.9 Configure Database Connection Pooling

**Issue #14: No database connection pooling configuration**

**Current Problem:**
- Missing explicit connection pool settings
- Could cause issues under load
- Connections may not be properly reused

**Files Affected:**
- `server/db.ts` or database configuration file

**Implementation Steps:**

1. **Configure connection pool**
   ```typescript
   import { Pool } from 'pg';
   import { drizzle } from 'drizzle-orm/node-postgres';
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     max: 20, // Maximum connections in pool
     min: 2,  // Minimum connections to keep
     idleTimeoutMillis: 30000, // Close idle connections after 30s
     connectionTimeoutMillis: 10000, // Timeout for new connections
     maxUses: 7500, // Close connection after N queries (prevents leaks)
   });
   
   // Handle pool errors
   pool.on('error', (err) => {
     console.error('Unexpected database pool error:', err);
   });
   
   export const db = drizzle(pool);
   
   // Graceful shutdown
   process.on('SIGTERM', async () => {
     console.log('Closing database pool...');
     await pool.end();
     process.exit(0);
   });
   ```

**Verification Criteria:**
- [ ] Pool configuration applied
- [ ] Connections reused (check pool stats)
- [ ] Graceful shutdown works
- [ ] No connection leaks under load
- [ ] Error handling for pool issues

---

## Phase 3: Frontend Polish & UX (4 hours)

### 3.1 Add Error Recovery for AI Processing Wizard

**Issue #15: No error recovery for failed AI processing**

**Current Problem:**
- If AI processing fails, users lose their input
- Must start over from scratch
- No way to retry with same content

**Files Affected:**
- `client/src/pages/add-recipe.tsx`

**Implementation Steps:**

1. **Preserve input on error**
   ```typescript
   const processRecipeMutation = useMutation({
     mutationFn: async (data) => { /* ... */ },
     onSuccess: (data) => {
       setCreatedRecipeId(data.id);
       setStep("visibility");
     },
     onError: (error: Error) => {
       // DON'T go to error step - stay on input with error message
       setErrorMessage(error.message);
       toast({
         title: "Processing Failed",
         description: error.message || "Please try again or modify your input",
         variant: "destructive",
       });
       // Keep user on input step with their data preserved
       setStep("input");
     },
   });
   ```

2. **Show inline error on input step**
   ```typescript
   {step === "input" && (
     <Card>
       {errorMessage && (
         <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 flex items-center gap-2">
           <AlertCircle className="h-4 w-4" />
           <span>{errorMessage}</span>
         </div>
       )}
       {/* ... rest of input form */}
     </Card>
   )}
   ```

3. **Clear error when user modifies input**
   ```typescript
   const handleInputChange = (value: string) => {
     setInputValue(value);
     setErrorMessage(""); // Clear error on new input
   };
   ```

**Verification Criteria:**
- [ ] Failed processing keeps user on input step
- [ ] Previous input (text/URL/files) preserved
- [ ] Error message displayed clearly
- [ ] User can modify and retry immediately
- [ ] Error clears when user types new input
- [ ] Can still start fresh with "Start Over" button

---

### 3.2 Add Loading States to All Mutation Buttons

**Issue #16: Missing loading states on several buttons**

**Current Problem:**
- Some buttons don't show loading state during mutations
- Users may click multiple times
- Unclear if action is in progress

**Files Affected:**
- `client/src/pages/recipe-detail.tsx`
- `client/src/pages/home.tsx`
- `client/src/components/*.tsx`

**Implementation Steps:**

1. **Audit all mutation buttons**
   - [ ] Save/Unsave recipe
   - [ ] Rate recipe
   - [ ] Mark as cooked
   - [ ] Add comment
   - [ ] Hide comment
   - [ ] Change visibility
   - [ ] Delete recipe
   - [ ] Invite family member

2. **Add loading states pattern**
   ```typescript
   import { Loader2 } from "lucide-react";
   
   // For each mutation button:
   <Button 
     onClick={() => saveMutation.mutate()}
     disabled={saveMutation.isPending}
     data-testid="button-save-recipe"
   >
     {saveMutation.isPending ? (
       <>
         <Loader2 className="h-4 w-4 animate-spin mr-2" />
         Saving...
       </>
     ) : (
       <>
         <Bookmark className="h-4 w-4 mr-2" />
         Save Recipe
       </>
     )}
   </Button>
   ```

**Verification Criteria:**
- [ ] All mutation buttons show loading spinner when pending
- [ ] Buttons are disabled while loading
- [ ] No double-submissions possible
- [ ] Loading text indicates action in progress
- [ ] Original icon/text restored after completion

---

### 3.3 Add Search to Public Recipes Page

**Issue #17: No recipe search for public recipes**

**Current Problem:**
- Public recipes page only has category filter
- No way to search by recipe name
- Hard to find specific recipes

**Files Affected:**
- `client/src/pages/explore.tsx` (or public recipes page)
- `server/routes.ts` - Add search parameter
- `server/storage.ts` - Add search to query (covered in 2.8)

**Implementation Steps:**

1. **Update API endpoint to accept search**
   ```typescript
   app.get("/api/public/recipes", publicRateLimiter, async (req, res) => {
     const category = req.query.category as string;
     const search = req.query.search as string;
     const page = parseInt(req.query.page as string) || 1;
     const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
     
     const result = await storage.getPublicRecipes({ category, search, page, limit });
     res.json(result);
   });
   ```

2. **Add search input to frontend**
   ```typescript
   import { useDebounce } from "@/hooks/use-debounce";
   
   const [searchTerm, setSearchTerm] = useState("");
   const debouncedSearch = useDebounce(searchTerm, 300);
   
   const { data, isLoading } = useQuery({
     queryKey: ["/api/public/recipes", { category, search: debouncedSearch }],
   });
   
   return (
     <div>
       <div className="flex gap-4 mb-6">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder="Search recipes..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="pl-10"
             data-testid="input-search-recipes"
           />
         </div>
         {/* Category filter */}
       </div>
       
       {/* Recipe grid */}
     </div>
   );
   ```

3. **Create useDebounce hook if not exists**
   ```typescript
   // client/src/hooks/use-debounce.ts
   export function useDebounce<T>(value: T, delay: number): T {
     const [debouncedValue, setDebouncedValue] = useState(value);
     
     useEffect(() => {
       const timer = setTimeout(() => setDebouncedValue(value), delay);
       return () => clearTimeout(timer);
     }, [value, delay]);
     
     return debouncedValue;
   }
   ```

**Verification Criteria:**
- [ ] Search input visible on public recipes page
- [ ] Typing filters results after 300ms debounce
- [ ] Search works with category filter combined
- [ ] Empty search shows all results
- [ ] No results shows appropriate message
- [ ] Loading state while searching

---

### 3.4 Add Keyboard Navigation to Recipe Cards

**Issue #19: No keyboard navigation for recipe cards**

**Current Problem:**
- Recipe cards not keyboard accessible
- Can't tab through and select with Enter
- Accessibility concern for users without mouse

**Files Affected:**
- Recipe card components (wherever cards are rendered)

**Implementation Steps:**

1. **Make cards focusable and keyboard navigable**
   ```typescript
   import { useLocation } from "wouter";
   
   function RecipeCard({ recipe }: { recipe: Recipe }) {
     const [, navigate] = useLocation();
     
     const handleKeyDown = (e: React.KeyboardEvent) => {
       if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         navigate(`/recipe/${recipe.id}`);
       }
     };
     
     return (
       <Card 
         tabIndex={0}
         role="article"
         aria-label={`Recipe: ${recipe.name}`}
         onKeyDown={handleKeyDown}
         onClick={() => navigate(`/recipe/${recipe.id}`)}
         className="cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none hover-elevate"
         data-testid={`card-recipe-${recipe.id}`}
       >
         {/* Card content */}
       </Card>
     );
   }
   ```

**Verification Criteria:**
- [ ] Can tab through recipe cards with keyboard
- [ ] Enter key opens recipe detail
- [ ] Space key opens recipe detail
- [ ] Focus ring visible on focused card
- [ ] Screen reader announces recipe name
- [ ] Tab order is logical (left to right, top to bottom)

---

### 3.5 Consolidate Duplicate HEIC Conversion Functions

**Issue #22: Duplicate HEIC conversion logic**

**Current Problem:**
- `convertToJpegBase64` and `convertHeicToJpeg` have overlapping logic
- Both in add-recipe.tsx
- Maintenance burden, potential for bugs if one is updated but not the other

**Files Affected:**
- `client/src/pages/add-recipe.tsx`
- `client/src/lib/imageUtils.ts` (new file)

**Implementation Steps:**

1. **Create shared image utility**
   ```typescript
   // client/src/lib/imageUtils.ts
   import heic2any from "heic2any";
   
   interface ConvertedImage {
     file: File;
     base64: string;
     blob: Blob;
   }
   
   export async function convertImageToJpeg(file: File): Promise<ConvertedImage> {
     let imageBlob: Blob = file;
     
     // Check if HEIC/HEIF
     const isHeic = file.type === "image/heic" || 
                    file.type === "image/heif" || 
                    file.name.toLowerCase().endsWith(".heic") ||
                    file.name.toLowerCase().endsWith(".heif");
     
     // Convert HEIC to JPEG
     if (isHeic) {
       try {
         const convertedBlob = await heic2any({
           blob: file,
           toType: "image/jpeg",
           quality: 0.85,
         });
         imageBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
       } catch (e) {
         console.error("HEIC conversion failed:", e);
         throw new Error("Failed to convert HEIC image");
       }
     }
     
     // Resize if needed and convert to base64
     return new Promise((resolve, reject) => {
       const img = new Image();
       img.onload = () => {
         const maxDim = 2048;
         let width = img.width;
         let height = img.height;
         
         if (width > maxDim || height > maxDim) {
           if (width > height) {
             height = (height / width) * maxDim;
             width = maxDim;
           } else {
             width = (width / height) * maxDim;
             height = maxDim;
           }
         }
         
         const canvas = document.createElement("canvas");
         canvas.width = width;
         canvas.height = height;
         
         const ctx = canvas.getContext("2d");
         if (!ctx) {
           reject(new Error("Could not get canvas context"));
           return;
         }
         
         ctx.drawImage(img, 0, 0, width, height);
         
         canvas.toBlob((blob) => {
           if (!blob) {
             reject(new Error("Failed to create blob"));
             return;
           }
           
           const base64 = canvas.toDataURL("image/jpeg", 0.85);
           const newFileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
           const newFile = new File([blob], newFileName, { type: "image/jpeg" });
           
           resolve({ file: newFile, base64, blob });
         }, "image/jpeg", 0.85);
       };
       
       img.onerror = () => reject(new Error("Failed to load image"));
       img.src = URL.createObjectURL(imageBlob);
     });
   }
   
   export function isHeicImage(file: File): boolean {
     return file.type === "image/heic" || 
            file.type === "image/heif" || 
            file.name.toLowerCase().endsWith(".heic") ||
            file.name.toLowerCase().endsWith(".heif");
   }
   ```

2. **Update add-recipe.tsx to use utility**
   ```typescript
   import { convertImageToJpeg, isHeicImage } from "@/lib/imageUtils";
   
   // Replace both functions with single import
   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const files = e.target.files;
     if (files && files.length > 0) {
       const fileArray = Array.from(files);
       const hasHeic = fileArray.some(isHeicImage);
       
       setStep("input");
       
       if (hasHeic) {
         setIsConvertingHeic(true);
       }
       
       try {
         const converted = await Promise.all(fileArray.map(convertImageToJpeg));
         setSelectedFiles(converted.map(c => c.file));
         setPreviewUrls(converted.map(c => URL.createObjectURL(c.blob)));
       } catch (err) {
         setErrorMessage("Failed to process image. Please try a different photo.");
         setStep("error");
       } finally {
         setIsConvertingHeic(false);
       }
     }
   };
   ```

**Verification Criteria:**
- [ ] HEIC images still convert correctly
- [ ] Regular JPEG/PNG images work unchanged
- [ ] Preview images display correctly
- [ ] Base64 for AI processing works
- [ ] File upload for storage works
- [ ] No duplicate code in add-recipe.tsx

---

## Phase 4: Production Readiness & Testing (5 hours)

### 4.1 Add SEO Meta Tags to All Pages

**Issue #18: Missing SEO meta tags on most pages**

**Current Problem:**
- Only recipe detail page has proper meta tags
- Home page missing SEO optimization
- Public recipes page missing SEO
- Poor social sharing appearance

**Files Affected:**
- `client/src/pages/home.tsx`
- `client/src/pages/explore.tsx`
- `client/src/pages/landing.tsx`
- `client/index.html`
- `client/src/components/seo.tsx` (new)

**Implementation Steps:**

1. **Install react-helmet**
   ```bash
   npm install react-helmet-async
   ```

2. **Add HelmetProvider to App**
   ```typescript
   // client/src/App.tsx
   import { HelmetProvider } from 'react-helmet-async';
   
   export default function App() {
     return (
       <HelmetProvider>
         <QueryClientProvider client={queryClient}>
           {/* ... */}
         </QueryClientProvider>
       </HelmetProvider>
     );
   }
   ```

3. **Create SEO component**
   ```typescript
   // client/src/components/seo.tsx
   import { Helmet } from 'react-helmet-async';
   
   interface SEOProps {
     title: string;
     description: string;
     image?: string;
     url?: string;
     type?: 'website' | 'article';
   }
   
   export function SEO({ title, description, image, url, type = 'website' }: SEOProps) {
     const siteTitle = "Recipe Tracker";
     const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
     const defaultImage = "/og-image.png"; // Create a default OG image
     
     return (
       <Helmet>
         <title>{fullTitle}</title>
         <meta name="description" content={description} />
         
         {/* Open Graph */}
         <meta property="og:title" content={fullTitle} />
         <meta property="og:description" content={description} />
         <meta property="og:image" content={image || defaultImage} />
         <meta property="og:type" content={type} />
         {url && <meta property="og:url" content={url} />}
         
         {/* Twitter */}
         <meta name="twitter:card" content="summary_large_image" />
         <meta name="twitter:title" content={fullTitle} />
         <meta name="twitter:description" content={description} />
         <meta name="twitter:image" content={image || defaultImage} />
       </Helmet>
     );
   }
   ```

4. **Add to each page**
   ```typescript
   // Home page
   <SEO 
     title="My Recipes" 
     description="View and manage your family's recipe collection" 
   />
   
   // Explore page
   <SEO 
     title="Discover Recipes" 
     description="Explore public recipes shared by families around the world" 
   />
   
   // Recipe detail (dynamic)
   <SEO 
     title={recipe.name}
     description={recipe.description || `A delicious ${recipe.category} recipe`}
     image={recipe.imageUrl}
     type="article"
   />
   ```

**Verification Criteria:**
- [ ] Each page has unique, descriptive title
- [ ] Meta descriptions present on all pages
- [ ] Open Graph tags render correctly (test with og debugger)
- [ ] Twitter cards display properly
- [ ] Recipe pages have dynamic content
- [ ] Images display in social previews

---

### 4.2 Add Health Check Endpoint

**Issue #24: No health check endpoint**

**Current Problem:**
- No endpoint for deployment health checks
- Can't verify app is running correctly
- No way to check database connectivity

**Files Affected:**
- `server/routes.ts`

**Implementation Steps:**

1. **Add health check endpoint**
   ```typescript
   // Add at the beginning of routes (before auth middleware)
   app.get("/api/health", async (req: Request, res: Response) => {
     const healthCheck = {
       status: "healthy",
       timestamp: new Date().toISOString(),
       uptime: process.uptime(),
       version: process.env.npm_package_version || "1.0.0",
       checks: {
         database: "unknown",
         memory: "ok",
       },
     };
     
     try {
       // Check database connectivity
       await db.execute(sql`SELECT 1`);
       healthCheck.checks.database = "connected";
       
       // Check memory usage
       const memUsage = process.memoryUsage();
       const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
       healthCheck.checks.memory = heapUsedMB < 512 ? "ok" : "warning";
       
       res.json(healthCheck);
     } catch (error) {
       healthCheck.status = "unhealthy";
       healthCheck.checks.database = "disconnected";
       
       res.status(503).json(healthCheck);
     }
   });
   ```

**Verification Criteria:**
- [ ] `/api/health` returns 200 when healthy
- [ ] Returns 503 when database down
- [ ] Response includes useful diagnostics
- [ ] No authentication required
- [ ] Fast response time (< 100ms)

---

### 4.3 Add HubSpot Retry Logic with Exponential Backoff

**Issue #25: HubSpot errors not gracefully handled**

**Current Problem:**
- HubSpot sync failures are logged but not retried
- Temporary network issues cause permanent sync failures
- No exponential backoff

**Files Affected:**
- `server/hubspot.ts`

**Implementation Steps:**

1. **Add retry wrapper with p-retry**
   ```typescript
   import pRetry from 'p-retry';
   
   interface RetryOptions {
     operation: string;
     retries?: number;
   }
   
   async function withRetry<T>(
     fn: () => Promise<T>, 
     options: RetryOptions
   ): Promise<T | null> {
     const { operation, retries = 3 } = options;
     
     try {
       return await pRetry(fn, {
         retries,
         minTimeout: 1000,
         maxTimeout: 10000,
         factor: 2, // Exponential backoff
         onFailedAttempt: (error) => {
           console.log(
             `HubSpot ${operation}: attempt ${error.attemptNumber} failed. ` +
             `${error.retriesLeft} retries left. Error: ${error.message}`
           );
         },
       });
     } catch (error) {
       console.error(`HubSpot ${operation} failed after all retries:`, error);
       return null;
     }
   }
   ```

2. **Apply to all HubSpot operations**
   ```typescript
   export async function syncUserToHubSpot(user: User): Promise<string | null> {
     if (!user.email) {
       console.log('Skipping HubSpot sync for user without email');
       return null;
     }
     
     return withRetry(async () => {
       const client = await getHubSpotClient();
       // ... existing implementation
     }, { operation: 'syncUser' });
   }
   
   export async function syncRecipeToHubSpot(recipe: Recipe, familyName: string): Promise<string | null> {
     return withRetry(async () => {
       // ... existing implementation
     }, { operation: 'syncRecipe' });
   }
   
   // Apply to all other HubSpot functions...
   ```

**Verification Criteria:**
- [ ] Temporary failures are retried (up to 3 times)
- [ ] Exponential backoff between retries (1s, 2s, 4s)
- [ ] Permanent failures logged appropriately
- [ ] App continues working if HubSpot is down
- [ ] Successful retries complete operation

---

### 4.4 Standardize Error Messages

**Issue #20: Inconsistent error messages**

**Current Problem:**
- Some errors return technical details
- Others return vague messages
- Inconsistent format across endpoints

**Files Affected:**
- `server/routes.ts` - All error responses

**Implementation Steps:**

1. **Create standardized error handler**
   ```typescript
   // server/errors.ts
   export class AppError extends Error {
     constructor(
       public statusCode: number,
       public userMessage: string,
       public internalMessage?: string
     ) {
       super(userMessage);
       this.name = 'AppError';
     }
   }
   
   // Common errors
   export const Errors = {
     notFound: (resource: string) => 
       new AppError(404, `${resource} not found`),
     unauthorized: () => 
       new AppError(401, "Please log in to continue"),
     forbidden: () => 
       new AppError(403, "You don't have permission to do this"),
     badRequest: (message: string) => 
       new AppError(400, message),
     serverError: (internalMessage?: string) => 
       new AppError(500, "Something went wrong. Please try again.", internalMessage),
   };
   
   export function handleError(res: Response, error: unknown) {
     if (error instanceof AppError) {
       if (error.internalMessage) {
         console.error(`[${error.statusCode}] ${error.internalMessage}`);
       }
       return res.status(error.statusCode).json({ message: error.userMessage });
     }
     
     // Log unexpected errors
     console.error("Unexpected error:", error);
     return res.status(500).json({ 
       message: "Something went wrong. Please try again." 
     });
   }
   ```

2. **Update all catch blocks**
   ```typescript
   // Before
   } catch (error) {
     console.error("Error fetching recipe:", error);
     res.status(500).json({ message: "Failed to fetch recipe" });
   }
   
   // After
   } catch (error) {
     handleError(res, error);
   }
   ```

**Verification Criteria:**
- [ ] All error responses have consistent format `{ message: string }`
- [ ] No stack traces or internal details exposed to client
- [ ] User-friendly messages for common errors
- [ ] Technical details logged server-side
- [ ] Status codes appropriate for error type

---

### 4.5 Add TypeScript Strict Checks

**Issue #21: Missing TypeScript strict mode checks**

**Current Problem:**
- Several places use `any` type
- Non-null assertions (`!`) without proper validation
- Potential runtime errors not caught at compile time

**Files Affected:**
- `tsconfig.json`
- Various files with `any` types

**Implementation Steps:**

1. **Enable stricter TypeScript options**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "noUncheckedIndexedAccess": true
     }
   }
   ```

2. **Fix `any` type usages**
   ```typescript
   // Before
   let connectionSettings: any;
   
   // After
   interface ConnectionSettings {
     settings: {
       access_token?: string;
       expires_at?: string;
       oauth?: {
         credentials?: {
           access_token?: string;
         };
       };
     };
   }
   let connectionSettings: ConnectionSettings | null = null;
   ```

3. **Replace `!` with proper validation**
   ```typescript
   // Before
   const userId = req.user!.claims.sub;
   
   // After
   if (!req.user?.claims?.sub) {
     return res.status(401).json({ message: "Unauthorized" });
   }
   const userId = req.user.claims.sub;
   ```

**Verification Criteria:**
- [ ] No `any` types in production code
- [ ] All `!` assertions replaced with proper checks
- [ ] TypeScript compiles without errors
- [ ] Runtime type errors caught at compile time

---

### 4.6 Add Error Monitoring/Logging

**Issue #23: Missing error monitoring/logging**

**Current Problem:**
- No structured logging
- No error monitoring service
- Hard to track production issues

**Files Affected:**
- `server/index.ts` or main server file
- Various files with console.log

**Implementation Steps:**

1. **Create structured logger**
   ```typescript
   // server/logger.ts
   type LogLevel = 'debug' | 'info' | 'warn' | 'error';
   
   interface LogEntry {
     level: LogLevel;
     message: string;
     timestamp: string;
     context?: Record<string, unknown>;
   }
   
   function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
     const entry: LogEntry = {
       level,
       message,
       timestamp: new Date().toISOString(),
       context,
     };
     
     // In production, send to logging service
     // For now, structured console output
     const output = JSON.stringify(entry);
     
     switch (level) {
       case 'error':
         console.error(output);
         break;
       case 'warn':
         console.warn(output);
         break;
       default:
         console.log(output);
     }
   }
   
   export const logger = {
     debug: (msg: string, ctx?: Record<string, unknown>) => log('debug', msg, ctx),
     info: (msg: string, ctx?: Record<string, unknown>) => log('info', msg, ctx),
     warn: (msg: string, ctx?: Record<string, unknown>) => log('warn', msg, ctx),
     error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
   };
   ```

2. **Add request logging middleware**
   ```typescript
   app.use((req, res, next) => {
     const start = Date.now();
     
     res.on('finish', () => {
       const duration = Date.now() - start;
       logger.info('Request completed', {
         method: req.method,
         path: req.path,
         status: res.statusCode,
         duration,
         userAgent: req.get('user-agent'),
       });
     });
     
     next();
   });
   ```

3. **Replace console.error with logger.error**
   ```typescript
   // Before
   console.error("Error fetching recipe:", error);
   
   // After
   logger.error("Error fetching recipe", { 
     error: error instanceof Error ? error.message : String(error),
     recipeId: id,
     userId,
   });
   ```

**Verification Criteria:**
- [ ] All logs are structured JSON
- [ ] Request/response logging for all endpoints
- [ ] Error logs include context (user, resource IDs)
- [ ] Log levels used appropriately
- [ ] Easy to search/filter logs

---

### 4.7 End-to-End Testing & Verification

**Final verification before launch:**

#### Recipe Creation Flow
- [ ] Create recipe via photo upload
- [ ] Create recipe via URL (verify URL validation)
- [ ] Create recipe via text input
- [ ] Create recipe manually
- [ ] Set visibility (public/private)
- [ ] Verify images stored in Object Storage (not base64)
- [ ] Verify HubSpot sync completes

#### Recipe Interaction Flow
- [ ] View recipe details (single query in logs)
- [ ] Save/unsave recipe (loading state visible)
- [ ] Rate recipe (loading state visible)
- [ ] Mark as cooked
- [ ] Add comment (profanity filter works)
- [ ] Export as PDF (sanitization works)
- [ ] View count doesn't inflate on refresh

#### Public Recipes Flow
- [ ] Browse public recipes (paginated)
- [ ] Filter by category (SQL filtering)
- [ ] Search by name (debounced)
- [ ] Rate limiting works (429 after limit)

#### Accessibility & UX
- [ ] Keyboard navigation works on recipe cards
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Error recovery preserves input

#### Security Verification
- [ ] Rate limiting on all sensitive endpoints
- [ ] SSRF URLs rejected (localhost, private IPs)
- [ ] XSS payloads sanitized
- [ ] No sensitive data in error messages

#### Performance Verification
- [ ] Recipe list loads in < 2s with 50+ recipes
- [ ] Recipe detail loads in < 1s
- [ ] Pagination metadata correct
- [ ] Database connections pooled

#### Production Checks
- [ ] Health check endpoint returns 200
- [ ] SEO meta tags on all pages
- [ ] Structured logging working
- [ ] HubSpot retry logic functional

---

## Rollback Procedures

### If Object Storage Migration Fails
1. Base64 images still render correctly (detection in components)
2. New recipes can temporarily store base64 again
3. Re-run migration script after fixing issues

### If Pagination Breaks Frontend
1. Endpoints still support no-pagination mode (omit params)
2. Frontend can load all data as before
3. Progressive enhancement approach

### If Rate Limiting Too Aggressive
1. Increase limits in configuration
2. Add IP whitelist for known good actors
3. Disable individual limiters if needed

### Database Rollback
1. Drizzle migrations can be reverted
2. Database snapshots available via Replit
3. No destructive schema changes in this cleanup

---

## Success Criteria

The launch cleanup is complete when:

1. **All 25 issues addressed** (verified via checklist above)
2. **All Phase 4 tests pass**
3. **No critical or high-severity issues remaining**
4. **Performance targets met**
5. **Security verification complete**

---

## Post-Launch Monitoring

After launch, monitor for:
- Error rates via structured logs
- Response times for key endpoints
- Rate limit triggers (potential abuse)
- HubSpot sync failures
- Image loading failures
- Database query performance

Set up alerts for:
- Error rate > 1%
- Response time > 3s for any endpoint
- Rate limit triggers > 100/hour
- Database connection failures
- Health check failures
