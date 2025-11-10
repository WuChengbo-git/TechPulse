# Legacy Pages Backup

This directory contains backup copies of the traditional view pages that were removed from the main navigation.

## Backed up pages (2025-11-10):

- **Overview.tsx** - Legacy overview dashboard
- **Dashboard.tsx** - Project cards list view
- **GitHubPage.tsx** - GitHub projects view
- **ArxivPage.tsx** - arXiv papers view
- **HuggingFacePage.tsx** - HuggingFace models view
- **ZennPage.tsx** - Zenn articles view
- **Analytics.tsx** - Data analytics view

## To restore these pages:

1. Uncomment the import statements in `src/App.tsx`:
   ```typescript
   import Overview from './pages/legacy_backup/Overview'
   import Dashboard from './pages/legacy_backup/Dashboard'
   // ... etc
   ```

2. Uncomment the route definitions in `src/App.tsx`:
   ```typescript
   <Route path="/dashboard" element={<Overview />} />
   <Route path="/github" element={<GitHubPage />} />
   // ... etc
   ```

3. Add the menu items back to `src/components/Sidebar.tsx`

4. Update the path mappings in `src/App.tsx` (pathMap and keyToPath)

## Why were these removed?

The new v0.4.0 interface provides a cleaner, more focused user experience with:
- 🎯 Today's Picks (DiscoverPage)
- 🔍 Data Exploration (ExplorePage)
- ⭐ My Collections (CollectionsPage)
- 📈 Trend Analysis (TrendsPage)
- 💬 AI Assistant (Chat)

The legacy pages can be restored at any time if needed for specific use cases.
