# InkWall — Frontend

The React single-page application for the InkWall social-blogging platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite 6 |
| Language | TypeScript 5 |
| Routing | React Router v6 |
| Styling | Tailwind CSS 3 + `@tailwindcss/typography` |
| UI primitives | Radix UI (Dialog, Label, Slot) |
| HTTP client | Axios (with JWT interceptor + auto token refresh) |
| Rich text editor | TipTap v3 (Markdown, images, links, bubble menu) |
| Markdown rendering | `react-markdown` + `remark-gfm` |
| Icons | Lucide React |

## Prerequisites

- Node.js ≥ 18
- The backend API running (see `backend/README.md`)

## Installation

```bash
cd frontend
npm install
cp .env.example .env   # then set VITE_API_BASE_URL
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL of the backend REST API |

All `VITE_*` variables are inlined at build time by Vite and must be present before running `npm run build`.

## Development

```bash
npm run dev      # Start Vite dev server at http://localhost:5173
npm run build    # Type-check with tsc then bundle with Vite (output: dist/)
npm run preview  # Serve the production build locally
```

## Architecture

```
src/
├── main.tsx              # Entry — wraps app in AuthContext, UserContext, SideNavContext
├── App.tsx               # React Router route definitions + AuthGuard + OnboardingGuard
├── context/
│   ├── AuthContext.tsx   # JWT token state, login/register/logout, Google OAuth callback
│   ├── UserContext.tsx   # Logged-in user profile, follow/unfollow, global profile cache
│   └── SideNavContext.tsx
├── services/
│   ├── axiosInstance.ts  # Axios instance — injects Bearer token, handles 401 refresh
│   ├── authService.ts
│   ├── postService.ts
│   ├── commentService.ts
│   ├── likeService.ts
│   ├── userService.ts    # getMe, updateInterests, uploadAvatar, changePassword, follow/unfollow
│   └── topicService.ts
├── pages/
│   ├── AuthPage.tsx          # Login / register tabs
│   ├── GoogleCallbackPage.tsx
│   ├── OnboardingPage.tsx    # Topic selection on first login
│   ├── HomePage.tsx          # Paginated feed, topic filters, recommended users sidebar
│   ├── PostViewPage.tsx      # Single post with comments and likes
│   ├── PostEditorPage.tsx    # TipTap rich text editor (create + edit)
│   ├── ProfilePage.tsx       # Avatar upload, topic interests, password change
│   ├── MyPostsPage.tsx       # The logged-in user's own posts
│   ├── FollowingPage.tsx     # Feed from followed authors + who-you-follow sidebar
│   └── NotFoundPage.tsx
├── components/
│   ├── AuthGuard.tsx         # Redirects unauthenticated users to /auth
│   ├── PageLayout.tsx        # Navbar + SideNav wrapper
│   ├── Navbar.tsx
│   ├── SideNav.tsx
│   ├── PostCard.tsx
│   ├── PostCardSkeleton.tsx
│   ├── AuthorBadge.tsx       # Avatar + email + follow button inline
│   ├── CommentItem.tsx
│   ├── MarkdownRenderer.tsx
│   └── ui/                   # Radix-based design system (Button, Card, Dialog, Input…)
├── types/
│   └── index.ts              # Shared TypeScript interfaces (Post, User, UserProfile, …)
└── lib/
    └── utils.ts              # cn(), resolveImageUrl(), getDateFromId()
```

### Data flow

```
Page/Component
  → service function (src/services/)
    → axiosInstance (adds Authorization: Bearer <token>)
      → Backend REST endpoint
        → Response updates local state or UserContext
```

### Authentication flow

1. On login/register the backend returns `{ token, refreshToken }` — both stored in `localStorage`.
2. Every Axios request has the access token injected via a request interceptor.
3. On a 401 response the interceptor calls `POST /auth/refresh`, updates storage, and retries the original request transparently.
4. Google OAuth starts at `GET /auth/google` (backend redirect); the callback page at `/auth/callback` reads tokens from the query string and calls `loginWithTokens`.

### Route structure

| Path | Component | Notes |
|---|---|---|
| `/auth` | `AuthPage` | Public |
| `/auth/callback` | `GoogleCallbackPage` | Public |
| `/` | `HomePage` | Protected |
| `/onboarding` | `OnboardingPage` | Protected; redirects to `/` if interests already set |
| `/posts/new` | `PostEditorPage` | Protected |
| `/posts/:id` | `PostViewPage` | Protected |
| `/posts/:id/edit` | `PostEditorPage` | Protected |
| `/profile` | `ProfilePage` | Protected |
| `/my-posts` | `MyPostsPage` | Protected |
| `/following` | `FollowingPage` | Protected |

All protected routes are wrapped in `AuthGuard`, which redirects to `/auth` if no token is present.

### Path alias

`@/*` resolves to `src/*` (configured in `vite.config.ts` and `tsconfig.json`). Always use `@/` imports instead of relative paths for anything outside the current directory.
