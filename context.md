# FAQ Portal - Context & Understanding

## What is this project?

A **crowdsourced FAQ portal** built with the MERN stack (MongoDB, Express.js, React, Node.js).

The idea is: anyone can submit a question+answer pair (FAQ), the community can upvote/downvote, comment, and discuss. Admins moderate all submissions before they go live.

---

## The Big Picture

### Core Flow
```
User submits FAQ → Status: PENDING
                       ↓
              Admin reviews it
               ↙          ↘
       APPROVED          REJECTED
       (public)          (hidden, author notified)
```

### Who does what

| Actor  | Can do |
|--------|--------|
| Guest  | Browse approved FAQs, search, view FAQ details |
| User   | All guest + submit FAQ, vote, comment, bookmark, edit profile |
| Admin  | All user + approve/reject, manage categories, manage users, view stats |

---

## Data Models

### User
```
name: String (required)
email: String (unique, required)
password: String (hashed, required)
role: String (enum: 'user' | 'admin', default: 'user')
avatar: String (URL, optional)
bio: String (optional)
bookmarks: [ObjectId → FAQ] (ref)
createdAt, updatedAt
```

### FAQ
```
question: String (required)
answer: String (required, markdown)
category: ObjectId → Category
tags: [String]
author: ObjectId → User
upvotes: Number (default: 0)
downvotes: Number (default: 0)
viewCount: Number (default: 0)
status: String (enum: 'pending' | 'approved' | 'rejected', default: 'pending')
rejectionReason: String (optional, set by admin)
createdAt, updatedAt
```

### Category
```
name: String (required, unique)
slug: String (unique, auto-generated)
description: String
icon: String (lucide-react icon name)
color: String (hex color, e.g. #3b82f6)
faqCount: Number (denormalized, for performance)
createdAt, updatedAt
```

### Comment
```
faq: ObjectId → FAQ
user: ObjectId → User
content: String (required)
parentComment: ObjectId → Comment (for replies, 1 level deep)
createdAt, updatedAt
```

### Vote
```
faq: ObjectId → FAQ
user: ObjectId → User
type: String (enum: 'up' | 'down')
(unique: faq + user compound index)
```

### Report
```
faq: ObjectId → FAQ
reporter: ObjectId → User
reason: String (enum: 'spam' | 'inappropriate' | 'incorrect' | 'other')
description: String (optional)
status: String (enum: 'pending' | 'reviewed', default: 'pending')
createdAt
```

---

## API Endpoints

### Auth
| Method | Endpoint               | Access | Description |
|--------|------------------------|--------|-------------|
| POST   | /api/auth/register     | Public | Register new user |
| POST   | /api/auth/login        | Public | Login, returns JWT |
| POST   | /api/auth/logout       | Auth   | Clear token |
| POST   | /api/auth/forgot-password | Public | Send reset email |
| POST   | /api/auth/reset-password  | Public | Reset with token |

### Users
| Method | Endpoint               | Access | Description |
|--------|------------------------|--------|-------------|
| GET    | /api/users/profile     | Auth   | Get own profile |
| PUT    | /api/users/profile     | Auth   | Update profile |
| PUT    | /api/users/avatar      | Auth   | Upload avatar |
| PUT    | /api/users/change-password | Auth | Change password |
| GET    | /api/users/my-faqs     | Auth   | Get my submitted FAQs |
| GET    | /api/users/bookmarks   | Auth   | Get bookmarked FAQs |
| POST   | /api/users/bookmarks/:faqId | Auth | Bookmark a FAQ |
| DELETE | /api/users/bookmarks/:faqId | Auth | Remove bookmark |

### FAQs
| Method | Endpoint               | Access | Description |
|--------|------------------------|--------|-------------|
| GET    | /api/faqs              | Public | List approved FAQs (paginated, filterable) |
| GET    | /api/faqs/trending     | Public | Top voted FAQs |
| GET    | /api/faqs/random       | Public | 5 random approved FAQs |
| GET    | /api/faqs/search       | Public | Search by keyword |
| GET    | /api/faqs/:id          | Public | Get single FAQ (increments view) |
| POST   | /api/faqs              | Auth   | Submit new FAQ |
| PUT    | /api/faqs/:id          | Auth+  | Edit own FAQ (only if pending) |
| DELETE | /api/faqs/:id          | Auth+  | Delete own FAQ |
| POST   | /api/faqs/:id/vote     | Auth   | Toggle upvote/downvote |
| POST   | /api/faqs/:id/report   | Auth   | Report a FAQ |

### Admin FAQs
| Method | Endpoint               | Access | Description |
|--------|------------------------|--------|-------------|
| GET    | /api/admin/faqs/pending | Admin  | List pending FAQs |
| GET    | /api/admin/faqs/all    | Admin  | List all FAQs (all statuses) |
| PATCH  | /api/admin/faqs/:id/approve | Admin | Approve a FAQ |
| PATCH  | /api/admin/faqs/:id/reject | Admin | Reject with reason |
| GET    | /api/admin/stats       | Admin  | Dashboard statistics |

### Categories
| Method | Endpoint               | Access | Description |
|--------|------------------------|--------|-------------|
| GET    | /api/categories        | Public | List all categories |
| GET    | /api/categories/:slug  | Public | Get category with FAQs |
| POST   | /api/categories        | Admin  | Create category |
| PUT    | /api/categories/:id    | Admin  | Update category |
| DELETE | /api/categories/:id    | Admin  | Delete category |

### Comments
| Method | Endpoint               | Access | Description |
|--------|------------------------|--------|-------------|
| GET    | /api/faqs/:faqId/comments | Public | List comments for a FAQ |
| POST   | /api/faqs/:faqId/comments | Auth  | Add comment |
| PUT    | /api/comments/:id      | Auth+  | Edit own comment |
| DELETE | /api/comments/:id      | Auth+  | Delete own comment |
| POST   | /api/comments/:id/reply | Auth  | Reply to a comment |

### Admin Users
| Method | Endpoint               | Access | Description |
|--------|------------------------|--------|-------------|
| GET    | /api/admin/users       | Admin  | List all users |
| GET    | /api/admin/users/:id   | Admin  | Get user details |
| PATCH  | /api/admin/users/:id/role | Admin | Change user role |
| DELETE | /api/admin/users/:id   | Admin  | Delete user |

---

## Client Routes

| Route                  | Component               | Access  | Description |
|------------------------|-------------------------|---------|-------------|
| /                      | HomePage                | Public  | Hero, categories, trending |
| /faq/:id               | FAQDetailPage           | Public  | Full FAQ + comments |
| /category/:slug        | CategoryPage            | Public  | FAQs by category |
| /search?q=...          | SearchPage              | Public  | Search results |
| /login                 | LoginPage               | Guest   | Login form |
| /register              | RegisterPage            | Guest   | Register form |
| /submit                | SubmitFAQPage           | Auth    | Submit new FAQ |
| /profile               | ProfilePage             | Auth    | Own profile + FAQs |
| /profile/edit          | ProfileEditPage         | Auth    | Edit profile |
| /bookmarks             | BookmarksPage           | Auth    | Saved FAQs |
| /admin                 | AdminDashboardPage      | Admin   | Overview stats |
| /admin/faqs            | AdminFAQsPage           | Admin   | Pending queue |
| /admin/categories      | AdminCategoriesPage     | Admin   | Manage categories |
| /admin/users           | AdminUsersPage          | Admin   | Manage users |

---

## Query Parameters for FAQ List

```
GET /api/faqs?page=1&limit=10&category=id&sort=newest|votes|views&search=keyword
```

- **page**: pagination page number
- **limit**: items per page (default 10)
- **category**: filter by category ID
- **sort**: newest (default), votes (upvotes), views (viewCount)
- **search**: keyword search in question + answer

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "FAQ created successfully"
}
```

### Paginated
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error
```json
{
  "success": false,
  "error": "FAQ not found"
}
```

---

## Tech Stack

### Backend
- **Node.js** v18+ - runtime
- **Express.js** - web framework
- **MongoDB** + **Mongoose** - database + ODM
- **JWT** (jsonwebtoken) - authentication
- **bcryptjs** - password hashing
- **express-validator** - input validation
- **multer** - file uploads (avatars)
- **nodemailer** - emails (optional)
- **helmet** - security headers
- **morgan** - HTTP logging
- **cors** - cross-origin
- **dotenv** - env variables

### Frontend
- **React 18** + **Vite** - UI framework + build tool
- **react-router-dom v6** - routing
- **axios** - HTTP client
- **react-hot-toast** - toast notifications
- **lucide-react** - icons
- **react-markdown** - render FAQ answers
- **timeago.js** - relative timestamps
- **CSS Modules** - scoped styling

---

## Security Considerations

- Passwords hashed with bcryptjs (10 rounds)
- JWT expires in 7 days, stored in localStorage
- Auth middleware protects all write routes
- Role middleware restricts admin routes
- Input validation on all endpoints (express-validator)
- Helmet sets security headers
- Rate limiting on login (100 req/15min per IP)
- XSS: React escapes output by default
- Comments and answers support markdown (sanitized with remark-gfm)

---

## File Upload Strategy

- Avatar uploads via Multer (local disk storage)
- Files saved to `uploads/avatars/` directory
- Served statically via Express
- In production: replace with Cloudinary/S3

---

## Email Notifications (Optional)

Triggered by nodemailer when:
1. FAQ is approved → email to author
2. FAQ is rejected → email to author with reason

Gmail SMTP for dev, SendGrid for production.

---

## Key Implementation Details

1. **Vote toggle**: If user votes up then votes up again → remove vote (toggle off). If votes up then down → switch to down.
2. **FAQ edit**: Only allowed when status is 'pending' (not yet reviewed). Once approved/rejected, author cannot edit.
3. **Category deletion**: Only allowed if no FAQs are linked to it.
4. **User deletion**: Deletes all their FAQs and comments too (cascade).
5. **Rejection reason**: Required when rejecting a FAQ. Stored in FAQ.rejectionReason.
6. **View count**: Incremented every time someone hits GET /api/faqs/:id (simple, no dedup).
7. **Slug generation**: Category name slugified (lowercase, hyphens). Used in URL: /category/:slug.
8. **Markdown answers**: Users write answers in markdown. Rendered with react-markdown + remark-gfm.

---

## Current State

- ✅ Folder structure created
- ✅ todo.md and context.md created
- ⬜ Nothing else implemented yet — starting from scratch

---

## Implementation Priority

### Phase 1: Backend Foundation
1. Server setup (package.json, index.js, db connection)
2. User model + auth (register, login, JWT)
3. FAQ model + CRUD routes
4. Category model + CRUD routes
5. Middleware (auth, role, error handler)
6. Voting system

### Phase 2: Backend Extra
7. Comments system
8. Admin endpoints (approve/reject, user management)
9. Search + filter + pagination
10. Profile + bookmarks

### Phase 3: Frontend Foundation
11. Vite + React setup
12. Routing structure
13. Auth context + services
14. Layout components (Navbar, Footer)
15. Home page + FAQ list

### Phase 4: Frontend Features
16. FAQ detail page + voting + comments
17. Submit FAQ form
18. Search + category filter
19. Profile page
20. Admin dashboard

---

_Last updated: 2026-05-28_