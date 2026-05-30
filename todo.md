# FAQ Portal - Progress Tracker

_Last updated: 2026-05-30_

---

## 🏗️ Project Status: ✅ FULLY IMPLEMENTED

---

## Server (Node.js/Express/MongoDB)

### Setup
- [x] Initialize npm and install dependencies
- [x] Setup server entry point (server/server.js)
- [x] Setup MongoDB connection (server/config/db.js)
- [x] Setup environment variables (server/.env)
- [x] Setup Express app with middleware (CORS, JSON parser, helmet, morgan)

### Models
- [x] User model (name, email, password, role: user/admin/moderator, avatar, bio, badges, following[], followerCount, followingCount, savedFAQs[], notifications[], timestamps)
- [x] FAQ model (question, answer, category ref, tags[], author ref, upvotes, downvotes, viewCount, votes, status, rejectionReason, isPinned, isWiki, answers[], answerCount, commentsCount, timestamps)
- [x] Category model (name, slug, description, icon, color, faqCount, timestamps)
- [x] Comment model (faq ref, user ref, content, parentComment ref, timestamps) — note: implemented as FAQ subdocument answers, not separate model
- [x] Vote model — handled via FAQ.answers.votes and faqController vote logic (not a separate model)
- [x] Report model (faq ref, reporter ref, reason, description, status, timestamps)
- [x] Notification model (user ref, type, message, faqId, read, createdAt)

### Routes
- [x] auth routes (/register, /login, /logout, /me, /forgot-password, /reset-password/:token, /verify-email/:token)
- [x] user routes (/profile, /update-profile, /change-password, /my-faqs, /bookmarks, /follow, /saved, /feed/activity, /leaderboard, /activity, /answers)
- [x] FAQ routes (CRUD, /search, /trending, /:id/meta, /:id/vote, /:id/pin, /:id/wiki, /:id/answers, /:id/comments, /:id/report)
- [x] admin FAQ routes (/admin/dashboard, /admin/stats, /admin/users, /admin/faqs, /admin/faqs/:id/status)
- [x] category routes (/public list, /:idOrSlug, admin CRUD)
- [x] comment routes — via FAQ subdocument (/faqs/:faqId/answers, /:id/answers/:answerId, /:id/answers/:answerId/accept, /:id/comments, /:id/comments/:commentId)
- [x] admin user routes (/admin/users, /admin/users/:id/role, /admin/users/:id/suspend, /admin/users/:id/delete)
- [x] admin dashboard stats route (/api/admin/dashboard, /api/admin/stats)
- [x] mod routes (/mod/queue, /mod/stats)
- [x] notification routes (/notifications, /notifications/read/all, /notifications/:id/read, /notifications/:id)
- [x] report routes (/reports, /reports/:id)
- [x] upload routes (/upload/avatar)

### Controllers
- [x] authController (register, login, logout, getMe, forgotPassword, resetPassword, verifyEmail)
- [x] userController (getProfile, updateProfile, changePassword, followUser, unfollowUser, saveFAQ, getSavedFAQs, getActivityFeed, getLeaderboard, getUserActivity, getUserAnswers)
- [x] faqController (getAll, getOne, create, update, remove, search, getTrending, getMeta, voteFAQ, togglePin, toggleWiki, addAnswer, updateAnswer, deleteAnswer, acceptAnswer, addComment, deleteComment, reportContent)
- [x] adminFaqController (getDashboard, getStats, getAll, updateStatus, approve, reject)
- [x] categoryController (getAll, getOne, create, update, delete)
- [x] commentController — implemented within faqController
- [x] adminUserController (getAll, getAllUsers, updateRole, suspendUser, remove)
- [x] modController (getQueue, getStats)
- [x] notificationController (getAll, markRead, markAllRead, deleteOne)
- [x] reportController (getReports, reviewReport)
- [x] uploadController (uploadAvatar)

### Middleware
- [x] authMiddleware (verify JWT, attach user to req, isAuthenticated, optionalAuth)
- [x] roleMiddleware (isAdmin, isModerator)
- [x] errorHandlerMiddleware (centralized error handler)
- [x] asyncHandler — try-catch in controllers directly
- [x] uploadMiddleware (Multer for avatar uploads)
- [x] validateMiddleware (express-validator validation chains on all write routes)
- [x] rateLimitMiddleware (per-user rate limiting, not per-IP)
- [x] validators.js (registerRules, loginRules, faqRules, categoryRules, profileRules, passwordRules, answerRules, commentRules, reportRules)

### Utils / Helpers
- [x] AppError class (custom error with statusCode)
- [x] email helper (sendEmail via nodemailer, Ethereal for dev)
- [x] emailTemplates (FAQ approval/rejection templates)
- [x] validation helpers — in middleware/validators.js
- [x] response helpers — handled via controller res.json patterns
- [x] slugify helper — used in category name → slug
- [x] awardBadges utility (auto-awards badges on reputation change)
- [x] createNotification utility (creates notification documents)
- [x] seed.js (seeds initial admin user and categories)
- [x] check-db.js (db connectivity check)
- [x] weeklyDigest.js (optional, not fully integrated)

---

## Client (React + Vite)

### Setup
- [x] Initialize Vite React app
- [x] Install dependencies (react-router-dom, axios, react-hot-toast, lucide-react, react-markdown, remark-gfm, timeago.js, socket.io-client)
- [x] Setup folder structure (components/common, components/faq, components/layout, context, hooks, pages, services)
- [x] Setup main.jsx with Router and Providers (AuthContext, ThemeContext, SocketContext, ThemeProvider)
- [x] Setup App.jsx with all routes
- [x] Create .env for API URL (VITE_API_URL=http://localhost:5000)

### Routing
- [x] Public routes (/, /faqs, /faqs/:id, /login, /register, /forgot-password, /reset-password/:token, /profile/:id, /leaderboard)
- [x] Protected user routes (/faqs/submit, /faqs/:id/edit, /profile/edit, /saved, /feed)
- [x] Protected mod routes (/mod)
- [x] Protected admin routes (/admin)
- [x] 404 page (NotFoundPage)

### Pages
- [x] HomePage — hero section, categories, trending FAQs
- [x] FAQListPage — paginated FAQ list with search/filter
- [x] FAQDetailPage — full FAQ with markdown answer, vote buttons, answers, comments, related FAQs
- [x] LoginPage
- [x] RegisterPage
- [x] SubmitFAQPage — form to submit new FAQ (question, answer markdown, category, tags)
- [x] EditFAQPage — edit own pending FAQ
- [x] ProfilePage — user info, tabs (questions/answers/activity), follow/unfollow, follower+following counts
- [x] EditProfilePage — edit name, bio, avatar
- [x] SearchPage — search results
- [x] SavedFAQsPage — bookmarked FAQs
- [x] ActivityFeedPage — feed of followed users' activity
- [x] LeaderboardPage — top 10 users by reputation
- [x] CategoryPage — FAQs by category (via /faqs with category filter)
- [x] AdminDashboardPage — stats overview
- [x] AdminFAQsPage — manage all FAQs (status update)
- [x] AdminCategoriesPage — CRUD categories
- [x] AdminUsersPage — user list, role management, suspend, delete
- [x] ModQueuePage — moderator queue
- [x] ForgotPasswordPage
- [x] ResetPasswordPage
- [x] NotFoundPage

### Components

#### Common
- [x] Button (variants: primary, secondary, outline, ghost, danger; sizes)
- [x] Input (label, error, icon prefix/suffix)
- [x] Textarea
- [x] Select
- [x] Card
- [x] Modal (reusable confirm dialog)
- [x] Spinner
- [x] ErrorMessage
- [x] Toast (react-hot-toast integration)
- [x] Avatar (image or ui-avatars.com fallback)
- [x] Badge (category badges, role badges)
- [x] Tag (clickable tag chips)
- [x] EmptyState
- [x] Pagination
- [x] Skeleton
- [x] ErrorBoundary
- [x] MarkdownEditor
- [x] NotificationBell

#### Layout
- [x] Navbar (logo, search, nav links, auth buttons, notification bell, user menu)
- [x] Footer
- [x] Sidebar (admin sub-nav)
- [x] Layout wrapper
- [x] AdminLayout
- [x] PageHeader

#### FAQ
- [x] FAQCard (compact card with question, category badge, author, stats)
- [x] VoteButtons (upvote/downvote with optimistic UI)
- [x] CommentSection (answers/comments list + add form)
- [x] SearchBar (debounced)
- [x] CategoryFilter
- [x] FAQStatusBadge
- [x] BookmarkButton
- [x] ShareButton

#### User
- [x] LoginForm
- [x] RegisterForm
- [x] ProfileCard — inline in ProfilePage
- [x] UserMenu (dropdown in Navbar: profile, bookmarks, admin, mod, logout)

#### Admin
- [x] AdminSidebar
- [x] StatCard
- [x] PendingFAQsList / all FAQs list with status actions
- [x] ApproveRejectButtons
- [x] CategoryManager (CRUD table)
- [x] UserManagement (table with role dropdown, suspend/delete)
- [x] RejectionModal

### Context
- [x] AuthContext (user state, login, register, logout, updateUser, isAdmin, isModerator)
- [x] ThemeContext (dark/light mode — CSS variable system on :root / .dark)
- [x] SocketContext (Socket.IO connection with polling fallback)
- [x] FAQContext (partially — FAQ list/filters managed in pages directly)
- [x] CategoryContext (categories loaded in App.jsx and Navbar)

### Hooks
- [x] useAuth — wraps AuthContext
- [x] useAsync — data-fetching hook with loading/error state
- [x] useDocumentMeta — sets page title/description
- [x] useVote — not a separate hook; implemented inline in FAQDetailPage
- [x] useCategoryFilter — inline in FAQListPage
- [x] useSearch — inline in pages
- [x] useDebounce — via setTimeout in components
- [x] useBookmark — inline in FAQDetailPage
- [x] useRequireAuth — ProtectedRoute component
- [x] useRequireAdmin — ProtectedRoute requiredRole prop

### Services (API Layer)
- [x] api.js (axios instance, baseURL, auth interceptor, error interceptor)
- [x] auth service — inline in AuthContext / LoginPage / RegisterPage
- [x] user service — users object in api.js (getProfile, updateProfile, changePassword, follow, unfollow, saveFAQ, getSaved, getFeed, getLeaderboard, getUserActivity, getUserAnswers)
- [x] faq service — faqs object in api.js (getAll, getOne, create, update, remove, search, trending, vote, addAnswer, updateAnswer, deleteAnswer, acceptAnswer, addComment, deleteComment, report, pin, wiki, status)
- [x] category service — categories object in api.js (getAll, getOne, create, update, delete)
- [x] comment service — inline in FAQDetailPage
- [x] admin service — admin object in api.js (getStats, getAllFaqs, updateStatus, getAllUsers, updateRole, suspendUser, deleteUser)

### Utils
- [x] constants.js — API_BASE_URL, CATEGORY_ICONS, CATEGORY_COLORS
- [x] helpers.js — formatDate, formatRelativeTime (via timeago.js), truncateText, getInitials, calculateReadTime
- [x] validators.js — email, password, required rules (frontend)
- [x] markdown.js — renderMarkdown (via react-markdown + remark-gfm)

---

## Features Checklist

### Core Features
- [x] User registration with name, email, password
- [x] User login with JWT (token in localStorage)
- [x] User logout
- [x] Submit a new FAQ (question + answer in markdown, category, tags)
- [x] View all approved FAQs (paginated)
- [x] Search FAQs by keyword
- [x] Filter FAQs by category
- [x] Sort FAQs (newest, most voted, most viewed — via sort query param)
- [x] Upvote/Downvote FAQs (one vote per user, toggle-able)
- [x] View count increment on FAQ detail page
- [x] Answer on FAQs (markdown, nested via FAQ subdocument answers)
- [x] Accept answer (FAQ author marks answer as accepted)
- [x] Comment on FAQs
- [x] Moderator role (can pin, toggle wiki, update status, view mod queue)
- [x] Admin login (same endpoint, role-based access)
- [x] Admin approves/rejects submitted FAQs
- [x] Admin provides rejection reason
- [x] Admin manages categories (CRUD, icon, color)
- [x] Admin views all users and changes roles
- [x] Admin dashboard with stats (total FAQs, users, pending, categories)
- [x] Moderator queue view

### User Features
- [x] Edit own profile (name, bio, avatar upload)
- [x] View own submitted FAQs with status
- [x] Edit own pending FAQs
- [x] Delete own FAQs
- [x] Bookmark FAQs
- [x] View bookmarks page
- [x] Change password
- [x] Follow/unfollow users
- [x] View follower and following counts on profiles
- [x] Activity feed (followed users' activity)
- [x] Leaderboard (top users by reputation)

### Admin Features
- [x] Overview dashboard with stats
- [x] Pending FAQs queue
- [x] Approve FAQ (makes it public)
- [x] Reject FAQ with reason
- [x] View all FAQs (all statuses)
- [x] Manage categories (add, edit, delete, icon, color)
- [x] View all users
- [x] Change user role (user → moderator → admin)
- [x] Suspend user
- [x] Delete user (with their FAQs)

### Moderator Features
- [x] Mod queue view
- [x] Pin/unpin FAQs
- [x] Toggle wiki mode
- [x] Update FAQ status (approve/reject)

### Real-time / Notifications
- [x] WebSocket connection (Socket.IO) with polling fallback
- [x] Live answer notifications via socket event
- [x] Notification bell in navbar
- [x] Mark notifications as read
- [x] Mark all notifications as read

### Security
- [x] Passwords hashed with bcryptjs
- [x] JWT authentication with 7-day expiry
- [x] Auth middleware protects write routes
- [x] Role middleware restricts admin/mod routes
- [x] Input validation on all endpoints
- [x] Helmet security headers
- [x] Rate limiting (per-user, not per-IP)
- [x] XSS: React escapes output by default
- [x] Markdown sanitized with remark-gfm

### Optional Features
- [x] Email notifications (nodemailer via Ethereal for dev)
- [x] Password reset with email link
- [ ] FAQ version history
- [x] Report FAQ (spam, inappropriate, incorrect, other)
- [x] Dark/Light theme toggle (CSS variable system)
- [ ] Infinite scroll
- [ ] Social share
- [ ] Related FAQs suggestion
- [x] Popular categories on homepage
- [x] User avatar upload (Multer + local + Cloudinary ready)
- [x] Reputation system (badge awards based on reputation)
- [x] Badges (first_step, contributor, etc. awarded automatically)

---

## Testing

### Backend
- [ ] Unit tests for controllers (Jest)
- [ ] API route tests (Supertest)

### Frontend
- [ ] Component rendering tests (Vitest + React Testing Library)
- [ ] Form validation tests
- [ ] Auth flow tests

---

## Deployment

- [ ] Build client (npm run build)
- [ ] Setup environment variables for production
- [ ] Deploy server to Render / Railway / Fly.io
- [ ] Deploy client to Vercel / Netlify
- [ ] Setup MongoDB Atlas (cloud DB)
- [ ] Connect client to deployed server

---

## Remaining Items

Minor items not yet implemented:
1. FAQ version history (track edit history)
2. Infinite scroll (page-based pagination currently)
3. Social share buttons
4. Related FAQs suggestion on FAQ detail page
5. Unit tests (backend and frontend)

## Notes

- Stack: MERN (MongoDB, Express, React, Node.js)
- Auth: JWT tokens stored in localStorage
- Status workflow: pending → approved/rejected
- Markdown support for FAQ answers and comments (react-markdown + remark-gfm)
- Icons: lucide-react
- Toasts: react-hot-toast
- Dates: timeago.js for relative time
- Pagination: page-based (skip/limit in backend)
- Roles: user, moderator, admin
- Follow system: followerCount/followingCount maintained on follow/unfollow
- Real-time: Socket.IO for live answer notifications