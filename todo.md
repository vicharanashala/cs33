# FAQ Portal - Progress Tracker

## 🏗️ Project Status: Not Started

---

## Server (Node.js/Express/MongoDB)

### Setup
- [ ] Initialize npm and install dependencies (express, mongoose, dotenv, cors, bcryptjs, jsonwebtoken, express-validator, helmet, morgan)
- [ ] Setup server entry point (server/index.js)
- [ ] Setup MongoDB connection (server/config/db.js)
- [ ] Setup environment variables (server/.env)
- [ ] Setup Express app with middleware (CORS, JSON parser, helmet, morgan)

### Models
- [ ] User model (name, email, password, role: user/admin, avatar, bio, created FAQs refs, timestamps)
- [ ] FAQ model (question, answer, category ref, tags[], author ref, upvotes, downvotes, viewCount, status: pending/approved/rejected, timestamps)
- [ ] Category model (name, slug, description, icon, color, faqCount, timestamps)
- [ ] Comment model (faq ref, user ref, content, parentComment ref for replies, timestamps)
- [ ] Vote model (faq ref, user ref, type: up/down, unique: faq+user)
- [ ] Report model (faq ref, reporter ref, reason, description, status, timestamps)

### Routes
- [ ] auth routes (/register, /login, /logout, /refresh-token, /forgot-password, /reset-password)
- [ ] user routes (/profile, /update-profile, /change-password, /my-faqs, /bookmarks)
- [ ] FAQ routes (CRUD, /search, /trending, /random, /:id/upvote, /:id/downvote, /:id/report)
- [ ] admin FAQ routes (/admin/pending, /admin/approve/:id, /admin/reject/:id, /admin/all-faqs)
- [ ] category routes (/public list, /:slug, admin CRUD)
- [ ] comment routes (/faqs/:faqId/comments, /:id, /:id/reply)
- [ ] admin user routes (/admin/users, /admin/users/:id, /admin/users/:id/role)
- [ ] admin dashboard stats route

### Controllers
- [ ] authController (register, login, logout, refreshToken, forgotPassword, resetPassword)
- [ ] userController (getProfile, updateProfile, changePassword, getMyFAQs, bookmark, removeBookmark)
- [ ] faqController (getAll, getOne, create, update, delete, search, trending, getRandom, upvote, downvote, report)
- [ ] adminFaqController (getPending, approve, reject, getAll, getStats)
- [ ] categoryController (getAll, getOne, create, update, delete)
- [ ] commentController (getByFaq, create, update, delete, reply)
- [ ] adminUserController (getAll, getOne, updateRole, delete)
- [ ] adminDashboardController (getStats)

### Middleware
- [ ] authMiddleware (verify JWT, attach user to req)
- [ ] roleMiddleware (check role: admin, moderator)
- [ ] errorHandlerMiddleware (centralized error handler)
- [ ] asyncHandler (wrapper to avoid try-catch in controllers)
- [ ] uploadMiddleware (Multer for avatar uploads)
- [ ] validateMiddleware (express-validator validation chains)
- [ ] rateLimitMiddleware (login rate limit, api rate limit)

### Utils / Helpers
- [ ] AppError class (custom error with statusCode)
- [ ] email helper (send email via nodemailer for approval/rejection notifications)
- [ ] validation helpers (registerRules, loginRules, faqRules, categoryRules)
- [ ] response helpers (success, error, paginated)
- [ ] slugify helper (for category/user slugs)
- [ ] calculatePopularity helper (for trending sort)

---

## Client (React + Vite)

### Setup
- [ ] Initialize Vite React app
- [ ] Install dependencies (react-router-dom, axios, react-hot-toast, lucide-react, react-markdown, timeago.js)
- [ ] Setup folder structure (already done)
- [ ] Setup main.jsx with Router and Providers
- [ ] Setup App.jsx with routes
- [ ] Create .env for API URL

### Routing
- [ ] Public routes (/, /faq/:id, /login, /register, /search)
- [ ] Protected user routes (/submit, /profile, /profile/edit, /bookmarks)
- [ ] Protected admin routes (/admin, /admin/faqs, /admin/categories, /admin/users)
- [ ] 404 page

### Pages
- [ ] HomePage - hero section, featured categories, trending FAQs, search
- [ ] FAQDetailPage - full FAQ with markdown answer, vote buttons, comments, related FAQs
- [ ] LoginPage - email/password login, link to register
- [ ] RegisterPage - name/email/password/register, link to login
- [ ] SubmitFAQPage - form to submit new FAQ (question, answer markdown, category, tags)
- [ ] ProfilePage - user info, submitted FAQs list, stats (total views, upvotes received)
- [ ] ProfileEditPage - edit name, bio, avatar
- [ ] SearchPage - search results with filters
- [ ] BookmarksPage - user's bookmarked FAQs
- [ ] CategoryPage - FAQs filtered by category
- [ ] AdminDashboardPage - stats overview, quick actions
- [ ] AdminFAQsPage - pending FAQs list with approve/reject
- [ ] AdminCategoriesPage - CRUD categories with icon/color
- [ ] AdminUsersPage - user list, role management

### Components

#### Common
- [ ] Button (variants: primary, secondary, outline, ghost, danger; sizes: sm, md, lg)
- [ ] Input (label, error, icon prefix/suffix)
- [ ] Textarea (for markdown answer)
- [ ] Select (category dropdown)
- [ ] Card (FAQCard wrapper with hover effects)
- [ ] Modal (reusable confirm dialog, form modal)
- [ ] Loader (spinner, page loader)
- [ ] ErrorMessage (form validation errors)
- [ ] Toast (react-hot-toast integration)
- [ ] Avatar (image or initials fallback)
- [ ] Badge (category badges, role badges)
- [ ] Tag (clickable tag chips)
- [ ] EmptyState (no results illustration)
- [ ] Pagination (page numbers + prev/next)
- [ ] Skeleton (loading placeholder for cards, text)

#### Layout
- [ ] Navbar (logo, search bar, nav links, auth buttons / user menu, admin link)
- [ ] Footer (links, copyright)
- [ ] Sidebar (admin sub-nav: overview, FAQs, categories, users)
- [ ] Layout wrapper (navbar + content + footer)
- [ ] AdminLayout (admin sidebar + header + content)
- [ ] PageHeader (title + breadcrumb + action button)

#### FAQ
- [ ] FAQCard (compact: question, category badge, author, stats: views/votes)
- [ ] FAQList (grid of FAQCards with pagination)
- [ ] FAQForm (create/edit form with markdown editor)
- [ ] FAQDetail (full view with rendered markdown)
- [ ] VoteButtons (upvote/downvote with count, optimistic UI)
- [ ] CommentSection (comments list + add comment form)
- [ ] CommentItem (single comment with reply button)
- [ ] SearchBar (with debounced input)
- [ ] CategoryFilter (sidebar/header category list)
- [ ] RelatedFAQs (sidebar related by category)
- [ ] FAQStatusBadge (pending/approved/rejected indicator)
- [ ] BookmarkButton (save/unsave FAQ)

#### User
- [ ] LoginForm
- [ ] RegisterForm
- [ ] ProfileCard (avatar, name, role, join date, stats)
- [ ] UserFAQs (user's submitted FAQs list)
- [ ] UserMenu (dropdown: profile, bookmarks, admin, logout)

#### Admin
- [ ] AdminSidebar
- [ ] StatCard (icon, label, value, trend)
- [ ] PendingFAQsList (table with approve/reject actions)
- [ ] ApproveRejectButtons
- [ ] CategoryManager (CRUD table with inline edit)
- [ ] UserManagement (table with role dropdown)
- [ ] RejectionModal (reason input when rejecting)

### Context
- [ ] AuthContext (user state, login, register, logout, updateUser, isAdmin)
- [ ] FAQContext (FAQs list, filters, pagination, refresh)
- [ ] CategoryContext (categories list, current category)
- [ ] ThemeContext (dark/light mode toggle - optional)

### Hooks
- [ ] useAuth (access auth context)
- [ ] useFAQs (fetch, filter, paginate FAQs)
- [ ] useVote (optimistic upvote/downvote)
- [ ] useCategoryFilter (filter by category)
- [ ] useSearch (debounced search with params)
- [ ] useDebounce (debounce any value)
- [ ] useBookmark (add/remove bookmark)
- [ ] useRequireAuth (redirect if not logged in)
- [ ] useRequireAdmin (redirect if not admin)

### Services (API Layer)
- [ ] api.js (axios instance, baseURL, interceptors for auth token, error handling)
- [ ] authService.js (login, register, logout, forgotPassword, resetPassword)
- [ ] userService.js (getProfile, updateProfile, changePassword, getMyFAQs, bookmark, getBookmarks)
- [ ] faqService.js (getAll, getOne, create, update, delete, search, trending, upvote, downvote, report)
- [ ] categoryService.js (getAll, getOne, create, update, delete)
- [ ] commentService.js (getByFaq, create, update, delete, reply)
- [ ] adminService.js (getStats, getPending, approveFaq, rejectFaq, getAllFaqs, getAllUsers, updateUserRole, deleteUser)

### Utils
- [ ] constants.js (API_BASE_URL, ROUTES, CATEGORY_ICONS, CATEGORY_COLORS)
- [ ] helpers.js (formatDate, formatRelativeTime, truncateText, getInitials, calculateReadTime)
- [ ] validators.js (email, password, required rules)
- [ ] markdown.js (renderMarkdown, stripMarkdown)

---

## Features Checklist

### Core Features
- [ ] User registration with name, email, password
- [ ] User login with JWT (token in localStorage)
- [ ] User logout
- [ ] Submit a new FAQ (question + answer in markdown, category, tags)
- [ ] View all approved FAQs (paginated)
- [ ] Search FAQs by keyword (question + answer content)
- [ ] Filter FAQs by category
- [ ] Sort FAQs (newest, most voted, most viewed)
- [ ] Upvote/Downvote FAQs (one vote per user per FAQ, toggle-able)
- [ ] View count increment on FAQ detail page
- [ ] Comment on FAQs (nested replies, 1 level deep)
- [ ] Admin login (same endpoint, role-based access)
- [ ] Admin approves/rejects submitted FAQs
- [ ] Admin provides rejection reason (email notification)
- [ ] Admin email notification on approval
- [ ] Admin manages categories (CRUD, icon, color)
- [ ] Admin views all users and changes roles
- [ ] Admin dashboard with stats (total FAQs, users, pending, categories)

### User Features
- [ ] Edit own profile (name, bio, avatar upload)
- [ ] View own submitted FAQs with status
- [ ] Edit own pending FAQs
- [ ] Delete own pending/rejected FAQs
- [ ] Bookmark FAQs to read later
- [ ] View bookmarks page
- [ ] Change password

### Admin Features
- [ ] Overview dashboard with charts/stats
- [ ] Pending FAQs queue
- [ ] Approve FAQ (makes it public)
- [ ] Reject FAQ with reason
- [ ] View all FAQs (all statuses)
- [ ] Manage categories (add, edit, delete, icon, color)
- [ ] View all users
- [ ] Change user role (user → admin)
- [ ] Delete user (with their FAQs)

### Optional Features
- [ ] Email notifications (nodemailer via Gmail or SendGrid)
- [ ] Password reset with email link (token-based)
- [ ] FAQ version history (track edits)
- [ ] Report FAQ (user reports inappropriate content)
- [ ] Dark/Light theme toggle
- [ ] Infinite scroll (instead of pagination)
- [ ] Social share (share FAQ link)
- [ ] Related FAQs suggestion
- [ ] Popular categories on homepage
- [ ] User avatar upload (Multer + local storage)

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

## Notes

- Stack: MERN (MongoDB, Express, React, Node.js)
- Auth: JWT tokens stored in localStorage
- Status workflow: pending → approved/rejected
- Only approved FAQs visible to public
- Markdown support for FAQ answers (react-markdown)
- Icons: lucide-react
- Toasts: react-hot-toast
- Dates: timeago.js for relative time
- Pagination: page-based (skip/limit in backend)