# General Implementation Plan: UI Refactoring

This plan outlines the changes required to align the current UI with the target vision, based on the audit of the baseline inventory and specific user feedback.

## User Review Required
> [!IMPORTANT]
> **Layout Architecture Change**: The Navbar will become the top-level Global Navigation (full width, fixed), with the Sidebar becoming a secondary context-driven panel underneath it. This fundamentally changes the `base.html` structure.

## Proposed Changes

### 1. Global Layout Architecture
Refactor the main layout (`base.html`) to establish a hierarchy where the Navbar is global and the Sidebar is contextual.

#### [MODIFY] [base.html](file:///Users/nick/Downloads/Output/ArtLine/app/templates/base.html)
- **Navbar Integration**: Move `{% include 'partials/navbar.html' %}` *outside* and *above* the `.d-flex` wrapper.
- **Styling**: Ensure Navbar is `fixed-top` (or sticky) and spans 100% width.
- **Sidebar Positioning**: Adjust sidebar container to sit *below* the Navbar (padding-top required on body/main).
- **Infinite Scrolling**: Ensure the central content area scrolls independently while Navbar remains fixed.

### 2. Global Navigation (Navbar)
Transform the Navbar into the primary branding and user session controller.

#### [MODIFY] [navbar.html](file:///Users/nick/Downloads/Output/ArtLine/app/templates/partials/navbar.html)
- **Positioning**: Full width.
- **Brand**: Add "ArtLine" brand/logo element here (since it's being removed from Sidebar).
- **User Actions**: Move the User Dropdown (Avatar + Email) from Sidebar to the right side of the Navbar.
- **Localization**: Ensure Language Switcher is accessible here (or keep floating, but Navbar is preferred for "Global" controls).

### 3. Secondary Navigation (Sidebar)
Refocus the Sidebar on context-specific actions and navigation.

#### [MODIFY] [sidebar.html](file:///Users/nick/Downloads/Output/ArtLine/app/templates/partials/sidebar.html)
- **Remove Brand**: Remove the top "ArtLine" header/logo (Moved to Navbar).
- **Remove User Menu**: Remove the bottom User Dropdown (Moved to Navbar).
- **Rename Items**:
    - `Workbench` -> **"Мастерская"** (Workshop).
    - `My Session` -> **"Генерации"** (Generations).
        - *Action*: Update link to open Gallery.
- **Structure**: Ensure it remains as the "Secondary navigation panel".

### 4. Component & Text Updates

#### [MODIFY] [landing.html](file:///Users/nick/Downloads/Output/ArtLine/app/templates/landing.html) / [auth templates](file:///Users/nick/Downloads/Output/ArtLine/app/templates/auth_login.html)
- **Auth Buttons**:
    - "Sign In" -> **"Войти"**
    - "Sign Up" / "Create Account" -> **"Регистрация"**

#### [MODIFY] [job_row.html](file:///Users/nick/Downloads/Output/ArtLine/app/templates/partials/job_row.html) / [result_card.html](file:///Users/nick/Downloads/Output/ArtLine/app/templates/partials/result_card.html)
- **Status Text Translations**:
    - `Queued` -> **"Отправлено"**
    - `Running` -> **"Загружено {{ progress }}%"**

#### [MODIFY] [base.html](file:///Users/nick/Downloads/Output/ArtLine/app/templates/base.html) (Language Logic)
- **Language Visibility**:
    - Restrict `EN` option to Admins only.
    - Regular users see: `RU`, `KK`, `KY`.

## Verification Plan

### Manual Verification
1.  **Layout Test**: Verify Navbar is fixed at top, full width, and Sidebar sits correctly below it without overlapping content.
2.  **Navigation Flow**: Click "Генерации" -> Verify Gallery opens/scrolls.
3.  **Auth Flow**: Verify Button text on Landing/Login pages.
4.  **Job Status**: Start a generation -> Observe "Отправлено" -> "Загружено X%".
5.  **Language**: Open as Guest -> Verify `EN` is hidden. Login as Admin -> Verify `EN` is visible.
### 5. Model Configuration Page Redesign (`model-config.tsx`)
Refactor the monolithic configuration page into a modern, component-driven UI using `shadcn/ui`.

#### Analysis (Current State)
- **Monolithic**: Single file (600+ lines) handling data fetching, form state, and UI.
- **UX**: Long list of checkboxes for Capabilities. "Fetch Schema" action is utilitarian.
- **Visuals**: Basic cards. Visual hierarchy is flat.

#### Proposed Design (UI/UX Pro Max)
- **Split Architecture**: Break down into focused components:
  - `ModelHeader`: Sticky header with actions (Save, Reset, JSON).
  - `ModelBasicSettings`: Cover image, name, description, usage limits.
  - `ModelCapabilities`: Visual selection (Toggle Group or Cards) for generation modes.
  - `ModelSchemaConfig`: The complex "Fetch" interactions and parameter mapping.
- **Layout**: Use a **Two-Column** grid with "Sticky Sidebar" for quick actions/stats.
  - **Left (Main)**: Schema, Parameters, Description.
  - **Right (Sidebar)**: Status, Cost, Capabilities, Metadata.
- **Interactions**:
  - **Capabilities**: Use `ToggleGroup` or distinctive visual cards instead of a laundry list of checkboxes.
  - **Fetch Schema**: Use a "Wizard" or "Connector" style UI. show "Connected" state when `model_ref` matches schema.
  - **Icons**: Use consistent Lucide icons (Activity, Layers, Database).

#### [NEW] Components
- `frontend/src/polymet/pages/model-config/layout.tsx` (Main Layout)
- `frontend/src/polymet/pages/model-config/basic-settings.tsx`
- `frontend/src/polymet/pages/model-config/capabilities-card.tsx`
- `frontend/src/polymet/pages/model-config/schema-connector.tsx`
