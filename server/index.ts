import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

// Domain configuration for production
const MAIN_DOMAIN = "familyrecipe.app";
const ADMIN_DOMAIN = "admin.familyrecipe.app";

// Hostname-based routing for admin subdomain in production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    const host = req.hostname || req.get("host")?.split(":")[0] || "";
    const path = req.path;
    
    // If on main domain and accessing /admin, redirect to admin subdomain
    if (host === MAIN_DOMAIN && path.startsWith("/admin")) {
      const redirectUrl = `https://${ADMIN_DOMAIN}${req.originalUrl}`;
      return res.redirect(301, redirectUrl);
    }
    
    // If on admin subdomain and accessing non-admin path (except API/assets), redirect to main domain
    if (host === ADMIN_DOMAIN && !path.startsWith("/admin") && !path.startsWith("/api") && !path.startsWith("/assets")) {
      // Redirect root to /admin on admin subdomain
      if (path === "/") {
        return res.redirect(301, "/admin");
      }
      const redirectUrl = `https://${MAIN_DOMAIN}${req.originalUrl}`;
      return res.redirect(301, redirectUrl);
    }
    
    next();
  });
}

// Enable gzip compression for all responses
app.use(compression({
  level: 6, // balanced compression level
  threshold: 1024, // only compress responses > 1KB
  filter: (req, res) => {
    // Skip compression for event-stream
    if (req.headers['accept'] === 'text/event-stream') {
      return false;
    }
    return compression.filter(req, res);
  }
}));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "50mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
