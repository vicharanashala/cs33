# FAQ Portal - Context & Understanding

_Last updated: 2026-05-30_

---

## What is this project?

A **crowdsourced FAQ portal** built with the MERN stack (MongoDB, Express.js, React, Node.js).

Anyone can submit a question+answer pair (FAQ), the community can upvote/downvote, comment, and discuss. Admins and moderators review submissions before they go live. The app also features a reputation system, badges, follow/unfollow between users, activity feed, leaderboard, bookmarks, and real-time notifications via WebSocket.

---

## Architecture

```
faq-portal/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/      # common/, faq/, layout/
│       ├── context/         # AuthContext, ThemeContext, SocketContext
│       ├── hooks/           # useAsync, useDocumentMeta
│       ├── pages/           # All route pages
│       └── services/        # api.js (axios layer)
└── server/                  # Node.js + Express backend
    ├── config/              # db.js, socket.js, cloudinary.js
    ├── controllers/         # auth, faq, user, category, comment, admin, etc.
    ├── middleware/          # auth, errorHandler, rateLimiters, validators, upload
    ├── models/              # User, FAQ, Category, Notification, Report
    ├── routes/              # api routes
    └── utils/               # AppError, email, badges, notifications, seed
```

**Dev servers:** Client on port 5173 (Vite), Server on port 5000 (Node/Express)  
**Auth:** JWT stored in localStorage, 7-day expiry  
**Real-time:** Socket.IO for live answer notifications and notification bell  
**Database:** MongoDB with Mongoose ODM

---

## Data Models

### User
```
name, username, email, password (hashed)
role: 'user' | 'moderator' | 'admin'
avatar, bio
reputation (Number, default 0)
badges: [{ name, awardedAt }]
following: [ObjectId → User]
followerCount, followingCount
savedFAQs: [ObjectId → FAQ]
notifications: [{ type, message, faqId, read, createdAt }]
isSuspended, emailVerified, emailVerifyToken, resetPasswordToken
createdAt, updatedAt
```

### FAQ
```
question, answer (markdown)
category: ObjectId → Category
tags: [String]
author: ObjectId → User
upvotes, downvotes, viewCount, votes (net = upvotes - downvotes)
status: 'pending' | 'approved' | 'rejected'
rejectionReason, isPinned, isWiki
answers: [{
  _id, author, content, votes,
  isAccepted, createdAt, updatedAt
}]  ← embedded subdocument
answerCount, commentsCount
createdAt, updatedAt
```

### Category
```
name, slug, description
icon (lucide-react name), color (hex)
faqCount (denormalized)
createdAt
```

### Notification
```
user: ObjectId → User
type: 'answer' | 'comment' | 'vote' | 'accept' | 'badge' | 'follow' | 'mod'
message, faqId: ObjectId → FAQ
read, createdAt
```

### Report
```
faq: ObjectId → FAQ
reporter: ObjectId → User
reason: 'spam' | 'inappropriate' | 'incorrect' | 'other'
description, status: 'pending' | 'reviewed'
createdAt
```

---

## API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| POST | /api/auth/logout | Auth |
| GET | /api/auth/me | Auth |
| POST | /api/auth/forgot-password | Public |
| PUT | /api/auth/reset-password/:token | Public |
| GET | /api/auth/verify-email/:token | Public |

### Users
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/users/:idOrUsername | Public |
| PUT | /api/users/:id/profile | Auth |
| PUT | /api/users/:id/password | Auth |
| POST | /api/users/:id/follow | Auth |
| DELETE | /api/users/:id/follow | Auth |
| POST | /api/users/saved/:faqId | Auth |
| GET | /api/users/saved | Auth |
| GET | /api/users/feed/activity | Auth |
| GET | /api/users/leaderboard | Public |
| GET | /api/users/:idOrUsername/activity | Public |
| GET | /api/users/:idOrUsername/answers | Public |

### FAQs
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/faqs | Public (paginated) |
| GET | /api/faqs/search | Public |
| GET | /api/faqs/trending | Public |
| GET | /api/faqs/:id | Public |
| GET | /api/faqs/:id/meta | Public |
| POST | /api/faqs | Auth |
| PUT | /api/faqs/:id | Auth (owner, pending only) |
| DELETE | /api/faqs/:id | Auth (owner) |
| POST | /api/faqs/:id/vote | Auth |
| PUT | /api/faqs/:id/vote | Auth (alias) |
| PUT | /api/faqs/:id/pin | Mod+ |
| PUT | /api/faqs/:id/wiki | Mod+ |
| POST | /api/faqs/:id/answers | Auth |
| PUT | /api/faqs/:id/answers/:answerId | Auth (owner) |
| DELETE | /api/faqs/:id/answers/:answerId | Auth (owner) |
| PATCH | /api/faqs/:id/answers/:answerId/accept | Auth (FAQ author) |
| POST | /api/faqs/:id/comments | Auth |
| DELETE | /api/faqs/:id/comments/:commentId | Auth |
| POST | /api/faqs/:id/report | Auth |

### Admin
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/admin/dashboard | Admin |
| GET | /api/admin/stats | Admin |
| GET | /api/admin/users | Admin |
| PUT | /api/admin/users/:id/role | Admin |
| PUT | /api/admin/users/:id/suspend | Admin |
| DELETE | /api/admin/users/:id | Admin |
| GET | /api/admin/faqs | Admin (all statuses) |
| PUT | /api/admin/faqs/:id/status | Admin |
| PATCH | /api/admin/faqs/:id/approve | Admin |
| PATCH | /api/admin/faqs/:id/reject | Admin |

### Moderator
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/mod/queue | Mod+ |
| GET | /api/mod/stats | Mod+ |

### Categories
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/categories | Public |
| GET | /api/categories/:idOrSlug | Public |
| POST | /api/categories | Admin |
| PUT | /api/categories/:id | Admin |
| DELETE | /api/categories/:id | Admin |

### Notifications
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/notifications | Auth |
| PATCH | /api/notifications/read/all | Auth |
| PATCH | /api/notifications/:id/read | Auth |
| DELETE | /api/notifications/:id | Auth |

### Reports
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/reports | Mod+ |
| PUT | /api/reports/:id | Mod+ |

### Uploads
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/upload/avatar | Auth (Multer) |

---

## Client Routes

| Route | Component | Access |
|-------|-----------|--------|
| / | HomePage | Public |
| /faqs | FAQListPage | Public |
| /faqs/submit | SubmitFAQPage | Auth |
| /faqs/:id | FAQDetailPage | Public |
| /faqs/:id/edit | EditFAQPage | Auth (owner) |
| /profile/:id | ProfilePage | Public |
| /profile/edit | EditProfilePage | Auth |
| /saved | SavedFAQsPage | Auth |
| /feed | ActivityFeedPage | Auth |
| /leaderboard | LeaderboardPage | Public |
| /mod | ModQueuePage | Mod+ |
| /admin | AdminDashboardPage | Admin |
| /login | LoginPage | Guest |
| /register | RegisterPage | Guest |
| /forgot-password | ForgotPasswordPage | Guest |
| /reset-password/:token | ResetPasswordPage | Guest |
| * | NotFoundPage | Public |

---

## Key Implementation Notes

1. **Vote toggle**: Toggling the same vote removes it; switching from up→down works in one call. Same for answer votes.
2. **FAQ status workflow**: pending → approved/rejected by admin. Author can only edit while status is `pending`.
3. **FAQ answers**: Stored as embedded subdocuments on the FAQ model. Not separate collection.
4. **Accept answer**: Only the FAQ author can accept an answer. `isAccepted: true` set on the answer subdocument.
5. **Follow system**: `followUser`/`unfollowUser` maintain `followerCount`/`followingCount` on both users.
6. **Leaderboard**: Returns top 10 users by `reputation`, includes `faqCount` (approved FAQs authored).
7. **Activity feed**: Returns paginated activity (FAQs submitted + answers given) for followed users.
8. **Rejection reason**: Required when admin rejects a FAQ. Stored in `faq.rejectionReason`.
9. **Badges**: Auto-awarded via `awardBadges.js` utility on reputation changes.
10. **Real-time**: Socket.IO emits `faq:newAnswer` when an answer is posted (client filters out own events).
11. **Notifications**: Created via `createNotification.js` utility; read/unread tracking per user.
12. **Rate limiting**: Per-user (not per-IP) using `req.user._id` when authenticated, falls back to IP.
13. **View count**: Incremented on every `GET /api/faqs/:id` call.
14. **Cloudinary**: Configured in `server/config/cloudinary.js` for avatar/image uploads.

---

## Tech Stack

**Backend:** Node.js 18+, Express.js, MongoDB + Mongoose, JWT (jsonwebtoken), bcryptjs, express-validator, Multer, nodemailer (Ethereal for dev), Socket.IO, helmet, morgan, dotenv, cloudinary

**Frontend:** React 18 + Vite, react-router-dom v6, axios, react-hot-toast, lucide-react, react-markdown + remark-gfm, timeago.js, Socket.IO client

---

## Known Issues / Fixes Applied (2026-05-30)

- Leaderboard route had wrong file order (`/:idOrUsername` before `/leaderboard`) → fixed
- Follow/unfollow didn't maintain `followerCount`/`followingCount` → fixed
- `unfollowUser` missing `User.findById` → fixed
- Profile API missing `isFollowing`, `followerCount`, `followingCount` fields → fixed
- Vote endpoint accepted strings instead of numbers → fixed
- Rate limiter used per-IP instead of per-user → fixed
- WebSocket needed `polling` fallback + `withCredentials` → fixed
- ActivityFeedPage crashed on non-array API response → fixed
- Follow button didn't toggle UI (state mutation issue) → fixed
- Double-invocation from React StrictMode causing duplicate submissions → fixed
- Leaderboard UI hardcoded light-mode colors → fixed with CSS variables