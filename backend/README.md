# InkWall — Backend API

A REST API for the InkWall social-blogging platform, built with Node.js, Express 5, TypeScript, and MongoDB.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Language | TypeScript 5 (executed via `tsx`) |
| Database | MongoDB via Mongoose 9 |
| Authentication | JWT (access + refresh tokens) · Google OAuth 2.0 via Passport.js |
| Password hashing | bcrypt |
| File uploads | Multer (disk storage, `uploads/` directory) |
| Validation | Zod (env vars at startup) |
| API docs | Swagger UI (`swagger-jsdoc` + `swagger-ui-express`) |
| Testing | Jest + Supertest + ts-jest |

## Prerequisites

- Node.js ≥ 18
- MongoDB running locally (`mongodb://localhost:27017`) or a remote connection string
- (Optional) Google OAuth credentials for social login

## Installation

```bash
cd backend
npm install
cp .env.example .env   # then fill in values
```

## Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `PORT` | `5000` | No | Port the server listens on |
| `DATABASE_URL` | `mongodb://localhost:27017/finalproj` | No | MongoDB connection string |
| `JWT_SECRET` | `secret` | **Yes (prod)** | Secret used to sign access tokens |
| `JWT_EXPIRES_IN` | `36000` | No | Access token lifetime in seconds |
| `REFRESH_TOKEN_EXPIRES_IN` | `36000` | No | Refresh token lifetime in seconds |
| `GOOGLE_CLIENT_ID` | _(empty)_ | No | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | _(empty)_ | No | Google OAuth app client secret |
| `GOOGLE_CALLBACK_URL` | `http://localhost:3000/auth/google/callback` | No | OAuth redirect URI |
| `FRONTEND_URL` | `http://localhost:5173` | No | Allowed CORS origin |

All variables are validated with Zod at startup; the process exits immediately if required values are missing.

## Development

```bash
npm run dev       # Start with auto-reload (tsx watch src/app.ts)
npm run seed:all  # Populate the database with demo data (see below)
```

The server starts on `http://localhost:5000` by default.  
Swagger UI is available at `http://localhost:5000/api-docs`.

### Seeding demo data

```bash
cd backend
npm run seed:all
```

`seed:all` is the single master seeder. It inserts:

- **45 topic categories** (Technology, Design, Science, etc.)
- **4 demo users** — the primary account is `jhhojh10@gmail.com` / `qwe123`
- **10 blog posts** with rich Markdown content (headings, code blocks, tables)
- **~26 comments** distributed across posts
- Pre-wired follow relationships between demo users

## Testing

```bash
# Run the full test suite
npm run test

# Run a single test file
npx jest src/tests/auth.test.ts --runInBand --forceExit
```

### Test database isolation

The test runner automatically redirects all database operations to a dedicated **`finalproj_test`** database (the database name from `DATABASE_URL` is replaced with `finalproj_test` when `NODE_ENV=test`). A `safeDropDatabase()` guard refuses to drop any database whose name does not end in `_test`, so running the test suite can never affect your local development data.

Test files live in `src/tests/`:

| File | Coverage |
|---|---|
| `auth.test.ts` | Register, login, token refresh, logout |
| `posts.test.ts` | Post CRUD, delete authorization |
| `comments.test.ts` | Comment CRUD |
| `likes.test.ts` | Like / unlike |
| `user.test.ts` | Profile, follow/unfollow, password change, recommended users |
| `chats.test.ts` | Chat CRUD, deduplication, `GET /chats/unread`, `PUT /chats/:id/read` with auth + participant checks |
| `messages.test.ts` | Message creation (`readBy` field), participant enforcement, delete authorization |
| `socket.test.ts` | Socket.io real-time broadcasts (`new_message`, `chat_list_update`) |

## Real-Time Chat Architecture

The chat feature uses **Socket.io v4** layered on top of the existing REST API.

### Personal User Room pattern

Rather than having every client join a socket room for each of their chats (which does not scale), the server uses two room types:

| Room | Name | Purpose |
|---|---|---|
| Personal user room | `userId` | Receives `chat_list_update` events for the sidebar — the client joins this room once on mount |
| Active chat room | `chatId` | Receives `new_message` events for the open message thread — joined when the user opens a chat |

### Event reference

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join_user_room` | client → server | `userId` | Client joins its personal room |
| `join_chat` | client → server | `chatId` | Client joins the active chat room |
| `new_message` | server → client | `Message` | Broadcast to the active chat room when a message is saved |
| `chat_list_update` | server → client | `Message` | Broadcast to every participant's personal room — triggers sidebar reordering |

### Sidebar sort

Chats are sorted by `updatedAt` descending. Sending a message touches the parent chat's `updatedAt` timestamp and emits `chat_list_update` so every participant's sidebar reorders instantly without a page refresh.

## Architecture

```
src/
├── app.ts              # Entry point — HTTP server + Socket.io setup
├── server.ts           # Express app setup, middleware, route mounting
├── socket.ts           # setIo / getIo singleton (avoids circular deps)
├── config/
│   ├── config.ts       # Zod-validated env config (auto-switches DB to finalproj_test in test)
│   └── passport.ts     # Google OAuth strategy
├── controllers/        # Business logic (one class per resource)
├── models/             # Mongoose schemas (User, Post, Comment, Like, Chat, Message, Topic)
├── routes/             # Express routers with Swagger JSDoc annotations
├── middlewares/
│   ├── authMiddleware.ts   # JWT verification, injects req.user
│   └── uploadMiddleware.ts # Multer single-file upload (images only, 5 MB max)
├── scripts/
│   └── seedAll.ts      # Master seeder (topics, users, posts, comments)
└── tests/              # Jest + Supertest suites
```

### Request lifecycle

```
Client → Swagger/Static → Auth router (unprotected)
                        → authenticate middleware (JWT)
                        → Resource router → Controller → Mongoose → MongoDB
```

All routes except `/auth/*` and `/uploads/*` require a valid `Authorization: Bearer <token>` header.

## API Endpoints

All protected endpoints require `Authorization: Bearer <access_token>`.

### Auth — `POST /auth/...`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register with email + password |
| POST | `/auth/login` | No | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | No | Exchange refresh token for new access token |
| POST | `/auth/logout` | No | Invalidate refresh token |
| GET | `/auth/google` | No | Start Google OAuth flow |
| GET | `/auth/google/callback` | No | Google OAuth callback |

### Users — `GET|PATCH|POST|DELETE /users/...`

| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Get own profile (populated interests, following, followers) |
| PATCH | `/users/me` | Update own interests (array of topic IDs) |
| PATCH | `/users/me/password` | Change password (email/password accounts only) |
| POST | `/users/me/avatar` | Upload profile picture (`multipart/form-data`, field: `image`) |
| GET | `/users/recommended` | Get up to 5 recommended users based on shared interests |
| POST | `/users/:id/follow` | Follow a user |
| DELETE | `/users/:id/follow` | Unfollow a user |
| GET | `/users` | List all users (paginated) |
| GET | `/users/:id` | Get user by ID |
| DELETE | `/users/:id` | Delete user by ID |

### Posts — `/posts`

| Method | Path | Description |
|---|---|---|
| GET | `/posts` | List posts (paginated, filterable by `topics[]` and `authorIds[]`) |
| GET | `/posts/:id` | Get post by ID |
| POST | `/posts` | Create post |
| PUT | `/posts/:id` | Update post |

### Comments — `/comments`

| Method | Path | Description |
|---|---|---|
| GET | `/comments` | List comments |
| GET | `/comments/:id` | Get comment by ID |
| POST | `/comments` | Create comment |
| PUT | `/comments/:id` | Update comment |
| DELETE | `/comments/:id` | Delete comment |

### Likes — `/likes`

| Method | Path | Description |
|---|---|---|
| GET | `/likes` | List likes |
| POST | `/likes` | Like a post or comment |
| DELETE | `/likes/:id` | Remove a like |

### File Upload — `/upload`

| Method | Path | Description |
|---|---|---|
| POST | `/upload` | Upload an image file (field: `image`), returns `{ url }` |

Uploaded files are served as static assets from `/uploads/<filename>`.

### Chats & Messages — `/chats`, `/messages`

| Method | Path | Description |
|---|---|---|
| GET | `/chats` | List own chats (populated participants, `unreadCount` per chat) |
| GET | `/chats/unread` | Returns `{ unreadChatIds }` — chat IDs with at least one unread message |
| GET | `/chats/user/:userId` | Get chats for a user (caller must be that user) |
| GET | `/chats/:id` | Get chat with messages (participant-only) |
| POST | `/chats` | Create a chat room (deduplicates 1-on-1 chats, returns 200 if exists) |
| PUT | `/chats/:id/read` | Mark all messages in a chat as read for the caller |
| DELETE | `/chats/:id` | Delete a chat (participant-only) |
| GET | `/messages` | List messages (scoped to caller's chats) |
| POST | `/messages` | Send a message (adds sender to `readBy` automatically) |
| DELETE | `/messages/:id` | Delete a message (sender-only) |

### Topics — `/topics`

| Method | Path | Description |
|---|---|---|
| GET | `/topics` | List all topics |
