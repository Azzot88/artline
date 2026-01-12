# App Layout and Pages Plan

## User Request
Create main app layout with left and right sidebars for multiple pages:
- Workbench (existing)
- User Account page with credit balance
- Admin Dashboard with providers and models
- AI Model Config page for each model
- Gallery in masonry layout for generations

## Related Files
- @/polymet/layouts/workbench-layout (to view - current layout)
- @/polymet/layouts/app-layout (to create - new main layout with sidebars)
- @/polymet/pages/account (to create - user account page)
- @/polymet/pages/dashboard (to create - admin dashboard)
- @/polymet/pages/model-config (to create - model configuration page)
- @/polymet/pages/gallery (to create - masonry gallery)
- @/polymet/components/app-sidebar (to create - left sidebar navigation)
- @/polymet/components/right-sidebar (to create - right sidebar for context)
- @/polymet/data/models-data (to create - mock model data)
- @/polymet/data/generations-data (to create - mock generation data)
- @/polymet/prototypes/ai-workbench-app (to update - add new routes)

## TODO List
- [x] View current workbench-layout to understand existing structure
- [x] Create mock data files (models-data, generations-data)
- [x] Create AppSidebar component (left sidebar with navigation)
- [x] Create RightSidebar component (contextual right sidebar)
- [x] Create main AppLayout with left and right sidebars
- [x] Create Account page with credit balance and user info
- [x] Create Dashboard page with providers and models management
- [x] Create ModelConfig page for individual model configuration
- [x] Create Gallery page with masonry layout
- [x] Update workbench page to work with new layout
- [x] Update prototype with all new routes

## Important Notes
- Left sidebar: Navigation menu (Workbench, Gallery, Account, Dashboard, Model Config)
- Right sidebar: Contextual information (recent generations, quick stats, etc.)
- Use Shadcn sidebar components for consistent design
- Gallery should use masonry layout for varied image sizes
- Dashboard is admin-only with provider/model management
- Model Config page should be dynamic based on model ID
- Maintain existing workbench functionality

  
## Plan Information
*This plan is created when the project is at iteration 12, and date 2026-01-11T01:46:27.434Z*
