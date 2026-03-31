# SEO SSR/Prerendering Implementation Plan

## Current State

The H.E.R.S.365 application is a client-side React SPA (Single Page Application) with:

- Vite as the build tool
- React Router for client-side routing
- No server-side rendering

This limits SEO effectiveness because search engine crawlers may not fully execute JavaScript to render content.

## Options for Better SEO

### Option 1: Static Site Generation (SSG) with Vike

**Pros:**

- Full SSR/SSG support for React
- Works with existing Vite setup
- Excellent SEO performance
- Can still use React Router patterns

**Cons:**

- Requires migration from vanilla Vite
- Learning curve for team

**Implementation:**

```bash
npm install vike
```

### Option 2: Prerendering with vite-plugin-ssr (vike)

**Pros:**

- Prerender specific pages at build time
- Less invasive than full SSR
- Good for static content pages

**Cons:**

- Limited dynamic content handling

### Option 3: Next.js Migration

**Pros:**

- Industry-standard React SSR framework
- Excellent SEO out of the box
- Rich ecosystem

**Cons:**

- Major architectural change
- Requires rewrites of components
- Loses Vite benefits

### Option 4: Maintain Current Setup + Improvements

**Pros:**

- No architectural changes needed
- Current SEO fixes already implemented
- Can improve with better content

**Cons:**

- Limited SEO compared to SSR

## Recommended Approach

Given the current state and effort required, I recommend **Option 1 (Vike)** as it:

1. Keeps the Vite build system
2. Provides full SSR capabilities
3. Is less disruptive than migrating to Next.js
4. Works well with the existing React Router setup

## Implementation Steps (if pursuing Vike)

1. Install Vike:

   ```bash
   npm install vike react-streaming
   ```

2. Create SSR entry point (`src/entry-server.tsx`)

3. Update `vite.config.ts` with SSR config

4. Create server entry (`server/index.ts`)

5. Configure prerendering for static pages

## Immediate Next Steps

1. Install dependencies: `npm install react-helmet-async`
2. Run `npm install` to install new dependencies
3. Test the current SEO implementation
4. Monitor Google Search Console for indexing
5. Consider Vike implementation if SEO remains insufficient

## Files Modified

- `hers365-app/client/public/robots.txt` - NEW
- `hers365-app/client/public/sitemap.xml` - NEW
- `hers365-app/client/package.json` - Added react-helmet-async
- `hers365-app/client/src/components/SEO.tsx` - NEW
- `hers365-app/client/src/data/seo-config.ts` - NEW
- `hers365-app/client/src/App.tsx` - Integrated SEO
- `hers365-app/client/index.html` - Added Twitter Cards + og:image

## Testing Checklist

- [ ] Run `npm install` to install react-helmet-async
- [ ] Verify robots.txt accessible at `/robots.txt`
- [ ] Verify sitemap.xml accessible at `/sitemap.xml`
- [ ] Test meta tags with browser DevTools
- [ ] Submit sitemap to Google Search Console
- [ ] Test social sharing with Open Graph debugger
