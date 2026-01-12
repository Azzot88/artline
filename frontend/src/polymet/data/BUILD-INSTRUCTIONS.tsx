/**
 * ============================================================================
 * BUILD INSTRUCTIONS - Static Export
 * ============================================================================
 * 
 * This React app is ready to be built as static files and deployed anywhere.
 * No Docker or Nginx configuration needed - just run `npm run build`.
 */

// ============================================================================
// STEP 1: Build the React App
// ============================================================================

/*
Run this command in your terminal:

```bash
npm run build
```

This will create a `dist/` folder with all static files:
- dist/
  ├── index.html
  ├── assets/
  │   ├── index-[hash].js
  │   ├── index-[hash].css
  │   └── [other assets]
  └── [other files]
*/

// ============================================================================
// STEP 2: Configure Backend URL (Optional)
// ============================================================================

/*
The app is configured to use `/api` as the backend base URL.

If you want to change this, create a `.env.production` file:

```env
VITE_API_BASE_URL=https://your-backend.com/api
```

Then rebuild:
```bash
npm run build
```
*/

// ============================================================================
// STEP 3: Deploy Static Files
// ============================================================================

/*
Upload the contents of the `dist/` folder to:

✅ GitHub Pages
✅ Netlify
✅ Vercel
✅ AWS S3 + CloudFront
✅ Any static hosting service
✅ Your own server (Nginx, Apache, etc.)

IMPORTANT: Configure your server for SPA routing!
All routes should serve `index.html` for client-side routing to work.
*/

// ============================================================================
// STEP 4: Server Configuration Examples
// ============================================================================

/*
=== NGINX ===
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/dist;
    index index.html;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (optional - if backend is on same server)
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

=== APACHE (.htaccess) ===
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

=== NETLIFY (_redirects file) ===
```
/*    /index.html   200
/api/*  https://your-backend.com/api/:splat  200
```

=== VERCEL (vercel.json) ===
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-backend.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
*/

// ============================================================================
// STEP 5: GitHub Pages Deployment
// ============================================================================

/*
1. Build the app:
```bash
npm run build
```

2. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

3. Add to package.json:
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  },
  "homepage": "https://yourusername.github.io/repo-name"
}
```

4. Deploy:
```bash
npm run deploy
```

5. Enable GitHub Pages in repo settings:
   - Settings → Pages → Source: gh-pages branch
*/

// ============================================================================
// API Configuration
// ============================================================================

/*
The app uses `/api` as the base URL for all API calls.

Current configuration in `@/polymet/data/api-client.tsx`:
```typescript
const API_BASE_URL = "/api"
```

This means:
- Frontend: https://yourdomain.com
- API calls: https://yourdomain.com/api/...

If your backend is on a different domain, you have 2 options:

OPTION 1: Use environment variable (recommended)
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"
```

Then create `.env.production`:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

OPTION 2: Configure CORS on backend
Allow your frontend domain in backend CORS settings.
*/

// ============================================================================
// Current Routes
// ============================================================================

/*
The app has these routes (all handled by React Router):

- /                     → Workbench (main page)
- /workbench            → Workbench
- /gallery              → Gallery
- /instance/:id         → Instance detail
- /account              → Account settings
- /dashboard            → Admin dashboard
- /model-config         → Model configuration
- /model-config/:id     → Specific model config

All routes are client-side - make sure your server redirects all paths to index.html!
*/

// ============================================================================
// Production Checklist
// ============================================================================

/*
Before deploying to production:

✅ Run `npm run build` successfully
✅ Test the build locally: `npm run preview`
✅ Configure backend URL (if not using `/api`)
✅ Set up CORS on backend (if frontend is on different domain)
✅ Configure SPA routing on your server
✅ Set up SSL certificate (HTTPS)
✅ Test all routes after deployment
✅ Check browser console for errors
✅ Verify API calls are working
*/

// ============================================================================
// Troubleshooting
// ============================================================================

/*
PROBLEM: 404 errors when refreshing pages
SOLUTION: Configure server to serve index.html for all routes (see Step 4)

PROBLEM: API calls failing with CORS errors
SOLUTION: 
  - If same domain: Set up /api proxy on your server
  - If different domain: Configure CORS on backend

PROBLEM: Blank page after deployment
SOLUTION: 
  - Check browser console for errors
  - Verify base URL in vite.config.ts matches your deployment path
  - For GitHub Pages: Set correct "homepage" in package.json

PROBLEM: Assets not loading
SOLUTION: 
  - Check if base path is correct in vite.config.ts
  - For subdirectory deployment: Set base: '/subdirectory/'
*/

// ============================================================================
// Summary
// ============================================================================

/*
🎯 QUICK START:

1. npm run build
2. Upload dist/ folder to your server
3. Configure server for SPA routing
4. Done! 🚀

📦 WHAT YOU GET:
- Fully optimized production build
- Minified JS and CSS
- Code splitting for faster loads
- All assets with cache-busting hashes
- Ready for any static hosting

🔗 BACKEND INTEGRATION:
- API calls go to /api by default
- Configure with VITE_API_BASE_URL env variable
- Or set up reverse proxy on your server

That's it! No Docker, no complex configs - just static files. ✨
*/

export {}