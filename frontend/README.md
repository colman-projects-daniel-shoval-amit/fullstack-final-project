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
| Real-time | Socket.io client v4 |
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
├── hooks/
│   └── useSocket.ts      # Socket.io-client singleton hook (autoConnect:false, Strict Mode safe)
├── services/
│   ├── axiosInstance.ts  # Axios instance — injects Bearer token, handles 401 refresh
│   ├── authService.ts
│   ├── postService.ts
│   ├── commentService.ts
│   ├── likeService.ts
│   ├── userService.ts    # getMe, updateInterests, uploadAvatar, changePassword, follow/unfollow
│   ├── topicService.ts
│   └── chatService.ts    # getMyChats, getChatWithMessages, createChat, sendMessage, getAllUsers
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
│   ├── MessagesPage.tsx      # Real-time two-column chat UI (sidebar + message thread)
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
| `/messages/:chatId?` | `MessagesPage` | Protected; `chatId` is optional — omitting it shows the empty-state placeholder |

All protected routes are wrapped in `AuthGuard`, which redirects to `/auth` if no token is present.

## Real-Time Chat

`MessagesPage` is a two-column WhatsApp-style interface: a resizable chat list sidebar on the left and a live message thread on the right.

### Socket architecture

The page uses the **Personal User Room** pattern to avoid pre-joining every chat room on load:

1. On mount the client emits `join_user_room` with the logged-in user's ID. The server places the socket in a room named after the user. This is the only room that must be joined regardless of which chat is open.
2. When the user opens a chat the client emits `join_chat` with that `chatId` to join the active room.
3. The server broadcasts two events when a message is saved:
   - `new_message` → active chat room (updates the message thread in real time)
   - `chat_list_update` → every participant's personal room (bumps that chat to the top of every participant's sidebar instantly)

### URL-driven state

The active chat ID lives in the URL (`/messages/:chatId?`) rather than component state. This means the active chat survives page refresh, and the browser back/forward buttons work naturally. Clicking a chat or creating a new one navigates with `useNavigate` instead of `setState`.

### Duplicate chat prevention

`POST /chats` uses a `$all + $size: 2` Mongoose query to find an existing 1-on-1 chat before creating a new one, returning `200` for an existing chat and `201` for a new one. The frontend redirect works identically for both.

### Path alias

`@/*` resolves to `src/*` (configured in `vite.config.ts` and `tsconfig.json`). Always use `@/` imports instead of relative paths for anything outside the current directory.
