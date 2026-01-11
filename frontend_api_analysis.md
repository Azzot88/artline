# API & Frontend Contract Analysis

## 1. HTML Page Routes (Template Render)
These routes return full HTML pages using Jinja2 templates.

| Method | Path | Template | Context/Notes |
|--------|------|----------|---------------|
| `GET` | `/` | `dashboard.html` | "Workbench" mode. Includes `app.js` logic inline. |
| `GET` | `/login` | `auth_login.html` | |
| `GET` | `/register` | `auth_signup.html` | |
| `GET` | `/account` | `account.html` | User profile page. |
| `GET` | `/billing` | `billing.html` | Billing/Plans page. |
| `GET` | `/admin/*` | `admin/*.html` | Various admin pages. |

## 2. HTMX Partial Routes
Routes returning HTML fragments.

| Method | Path | Template | Trigger |
|--------|------|----------|---------|
| `GET` | `/jobs/partial` | `partials/job_list.html` | `jobsChanged` event. |
| `GET` | `/balance/partial` | `partials/balance_badge.html` | `balanceChanged` event. |
| `GET` | `/gallery/page/{page}` | `partials/gallery_items.html` | Scroll (infinite loading). |
| `POST` | `/jobs/{id}/sync` | `partials/result_card.html` | `load delay:3s` (Polling) AND `HX-Request: true`. |

## 3. JSON Routes & Hybrid Behavior
Routes that return JSON. Some are hybrid based on headers.

| Method | Path | Format | Notes |
|--------|------|--------|-------|
| `POST` | `/jobs/new` | **JSON Only** | Client (`submitJob` in `dashboard.html`) uses `fetch` with `application/json`. Pydantic model `JobRequest` requires JSON body. |
| `POST` | `/jobs/{id}/sync` | **Hybrid** | Returns **JSON** `{status, synced, result_url}` by default. Returns **HTML** if `HX-Request: true` header is present. |
| `POST` | `/guest/init` | **JSON** | `{ok, guest_id, balance}`. |
| `GET` | `/models/for-ui` | **JSON** | Configuration for UI. |
| `POST` | `/jobs/{id}/public` | **JSON** | `{is_public}`. |
| `POST` | `/jobs/{id}/like` | **JSON** | `{likes}`. |

**Clarification on `/jobs/new`:**
It is **Strictly JSON**. The existing frontend uses `fetch()` in `app.submitJob(event)` to send `application/json`. It does NOT use standard form submission or HTMX for this specific action.

## 4. Deep Dive: Technical Answers

### A. JSON vs Form Data
- **/jobs/new**: Accepts `application/json` ONLY. The backend uses Pydantic `JobRequest` which expects a JSON body. The frontend explicitly stringifies the payload.
- **/jobs/{id}/sync**:
    - **JSON Mode**: Returns `{ "status": string, "synced": bool, "result_url": string | null }`. Fields are stable.
    - **Note**: The code explicitly checks `if request.headers.get("HX-Request"):` to decide whether to return the HTML partial for the card or the JSON status.

### B. Billing Source of Truth
- **Guest**: Balance stored in `GuestProfile.balance` column (DB: `guest_profiles`).
    - **Invariant**: Code checks `if balance < cost` before decrementing. Decrement is done via `user.balance -= cost` in code, might be subject to async race conditions if high concurrency.
- **User**: Balance is calculated dynamically as `SUM(amount)` from `billing_ledger` table.
    - **Invariant**: `get_user_balance` sums ledger. `create_job` adds a *new* negative entry. This is more robust than a single counter but relies on the transaction consistency between the "check" and the "insert".

### C. Likes & Public Policy
- **Likes (`/jobs/{id}/like`)**:
    - **Guest Access**: **YES**. No `user` dependency required. No authentication check.
    - **Mechanism**: Anonymous increment. No unique check enforcing one-like-per-person in the current logic.
- **Public (`/jobs/{id}/public`)**:
    - **Guest Access**: **NO**. explicit `Depends(get_current_user)` dependency is used. Guests calling this will receive `401 Unauthorized` (or a `guest-init` check depending on exact dependency chain, but logic requires `user.id` matching job owner).
    - **Security**: Endpoint queries `Job` where `user_id == current_user.id`. You cannot toggle someone else's job.

### D. Guest Init vs Middleware
- **Middleware**: Automatically sets a `guest_id` **Cookie** (UUID) if missing. It does *not* create the database record.
- **Endpoint (`/guest/init`)**: Explicitly calls `get_or_create_guest` which ensures the **Database Record** exists and returns the current balance in JSON.
- **Is it needed?**: It is useful for the SPA to "boot" and get the initial balance without waiting for a lazy creation trigger.
- **Replacement**: Yes, a `GET /api/me` endpoint could return `{ user: null, guest: { id: "...", balance: 100 } }` and effectively replace `/guest/init`.

---

## 5. Proposed Minimal API Contract (New Frontend/SPA)
Recommended structure to cover all requirements cleanly.

### Auth & Context
- `GET /api/me`: Returns User info OR Guest info (balance).
    - Replaces usage of `/guest/init`.
- `POST /api/auth/login`: Standard JSON login.
- `POST /api/auth/logout`: Logout.

### Workflows
- `GET /api/models`: Schema for Dynamic UI.
- `GET /api/jobs`: List history (pagination supported).
- `POST /api/jobs`: Create job (JSON).
- `GET /api/jobs/{id}`: Poll status (JSON).
- `POST /api/jobs/{id}/cancel`: Optional.

### Social
- `GET /api/gallery`: Public feed.
- `POST /api/jobs/{id}/like`: Anonymous like.

## 6. Test Plan

### API Contract (Pytest)
1.  **JSON Enforcement**: Call `POST /jobs/new` with Form Data -> Expect 422. Call with JSON -> Expect 200/400.
2.  **Hybrid Sync**: Call `POST /jobs/{id}/sync` with/without `HX-Request` header -> Validate return content type (HTML vs JSON).
3.  **Guest Limits**: Verify Guest cannot call `/jobs/{id}/public`.

### E2E (Playwright)
1.  **Guest Flow**: Visit -> Check Balance (from Guest Init) -> Generate -> Balance Decrement.
2.  **User Flow**: Login -> Generate -> Check Ledger.
