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
npm run dev          # Start with auto-reload (tsx watch src/app.ts)
npm run seed:topics  # Seed topic categories into MongoDB
```

The server starts on `http://localhost:5000` by default.  
Swagger UI is available at `http://localhost:5000/api-docs`.

## Testing

```bash
# Run the full test suite
npm run test

# Run a single test file
npx jest src/tests/auth.test.ts --runInBand --forceExit
```

Each test suite connects to MongoDB and **drops the database** after it finishes. Use a separate `DATABASE_URL` for testing if needed.

Test files live in `src/tests/`:

| File | Coverage |
|---|---|
| `auth.test.ts` | Register, login, token refresh, logout |
| `posts.test.ts` | Post CRUD |
| `comments.test.ts` | Comment CRUD |
| `likes.test.ts` | Like / unlike |
| `user.test.ts` | Profile, follow, unfollow |
| `chats.test.ts` | Chat room creation and retrieval |
| `messages.test.ts` | Message creation and retrieval |

## Architecture

```
src/
├── app.ts              # Entry point (starts server)
├── server.ts           # Express app setup, middleware, route mounting
├── config/
│   ├── config.ts       # Zod-validated env config
│   └── passport.ts     # Google OAuth strategy
├── controllers/        # Business logic (one class per resource)
├── models/             # Mongoose schemas (User, Post, Comment, Like, Chat, Message, Topic)
├── routes/             # Express routers with Swagger JSDoc annotations
├── middlewares/
│   ├── authMiddleware.ts   # JWT verification, injects req.user
│   └── uploadMiddleware.ts # Multer single-file upload (images only, 5 MB max)
├── scripts/
│   └── seedTopics.ts   # One-off topic seeding script
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
| GET | `/chats` | List chats |
| GET | `/chats/user/:userId` | Get chats for a user |
| POST | `/chats` | Create a chat room |
| DELETE | `/chats/:id` | Delete a chat |
| GET | `/messages` | List messages |
| POST | `/messages` | Send a message |
| DELETE | `/messages/:id` | Delete a message |

### Topics — `/topics`

| Method | Path | Description |
|---|---|---|
| GET | `/topics` | List all topics |
