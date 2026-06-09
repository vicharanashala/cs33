# FAQ Portal (cs33)

A full-stack community FAQ portal built with MongoDB, Express, React, Node.js, and Socket.IO.

## Overview

This project is a crowdsourced knowledge-sharing application where users can submit and curate FAQ entries, vote on answers, comment, follow contributors, and engage with a reputation-driven moderation system.

The platform includes:
- FAQ creation, review, and approval workflows
- Category-based organization and tag support
- User profiles, followers, saved FAQs, and leaderboards
- Real-time notifications via WebSockets
- Admin and moderator controls for content quality
- Avatar uploads and email-based authentication flows

## Key Features

### Core Functionality
- Create, edit, and delete FAQ posts
- Search FAQs by keyword, category, and tags
- View trending FAQs
- Save/bookmark FAQs for later
- Browse FAQ metadata and related content

### Community Interaction
- Upvote/downvote FAQs and answers
- Add answers and threaded comments
- Accept the best answer for a FAQ
- Follow/unfollow users
- Activity feed for followed users
- Leaderboard ranking by reputation

### Moderation and Administration
- Pending FAQ approval workflow
- Admin approval/rejection with rejection reasons
- Moderator queue for review
- User management: roles, suspensions, deletion
- Category management: CRUD operations
- Reports workflow for spam, inappropriate, and incorrect content

### Auth and User Profiles
- User registration, login, and logout
- Email verification and password reset
- Profile edit with avatar, bio, and personal info
- Role-based access control for users, moderators, and admins

### Notifications and Real-Time UX
- Socket.IO notifications for answers, comments, votes, accepts, badges, and follows
- Read/unread notification tracking
- Push updates to clients with live notification bell support

### Reputation and Badges
- Reputation earned from FAQ and answer activity
- Auto-awarded badges based on user contributions
- Badge notifications and profile badge display

### Uploads and Media
- Avatar uploads using Multer and Cloudinary
- Profile image storage with cloud integration

## Architecture

### Backend
- `server/` contains Express routes, controllers, middleware, models, and utilities
- MongoDB and Mongoose manage data models for User, FAQ, Category, Notification, and Report
- JWT authentication and role-based middleware
- Validation with `express-validator`
- Centralized error handling and rate limiting
- Email templates for approval, rejection, password reset, and verification
- Optional seed script for admin user and category data

### Frontend
- `client/` is built with React and Vite
- Context providers for authentication, theme, and Socket.IO state
- Pages for home, FAQ list, FAQ details, submit/edit FAQ, user profile, saved FAQs, leaderboard, activity feed, admin, and moderator views
- Markdown rendering with `react-markdown` and `remark-gfm`
- Axios-based API client and toast notifications for user feedback

## Data Models

### User
- name, username, email, hashed password
- role: `user` | `moderator` | `admin`
- avatar, bio, reputation, badges
- following, followerCount, followingCount
- savedFAQs, notifications
- account state: suspended, email verified, reset tokens

### FAQ
- question, answer (markdown), category, tags, author
- upvotes, downvotes, viewCount, net votes
- status: `pending` | `approved` | `rejected`
- rejectionReason, isPinned, isWiki
- embedded answers with votes, author, accepted state
- answerCount, commentsCount, timestamps

### Category
- name, slug, description
- icon, color, faqCount

### Notification
- user, type, message, faqId
- read state, createdAt

### Report
- faq, reporter, reason, description
- status: `pending` | `reviewed`

## API Overview

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `PUT /api/auth/reset-password/:token`
- `GET /api/auth/verify-email/:token`

### Users
- `GET /api/users/:idOrUsername`
- `PUT /api/users/:id/profile`
- `PUT /api/users/:id/password`
- `POST /api/users/:id/follow`
- `DELETE /api/users/:id/follow`
- `POST /api/users/saved/:faqId`
- `GET /api/users/saved`
- `GET /api/users/feed/activity`
- `GET /api/users/leaderboard`
- `GET /api/users/:idOrUsername/activity`
- `GET /api/users/:idOrUsername/answers`

### FAQs
- `GET /api/faqs`
- `GET /api/faqs/search`
- `GET /api/faqs/trending`
- `GET /api/faqs/:id`
- `GET /api/faqs/:id/meta`
- `POST /api/faqs`
- `PUT /api/faqs/:id`
- `DELETE /api/faqs/:id`
- `POST /api/faqs/:id/vote`
- `PUT /api/faqs/:id/pin`
- `PUT /api/faqs/:id/wiki`
- `POST /api/faqs/:id/answers`
- `PUT /api/faqs/:id/answers/:answerId`
- `DELETE /api/faqs/:id/answers/:answerId`
- `PATCH /api/faqs/:id/answers/:answerId/accept`
- `POST /api/faqs/:id/comments`
- `DELETE /api/faqs/:id/comments/:commentId`
- `POST /api/faqs/:id/report`

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id/role`
- `PUT /api/admin/users/:id/suspend`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/faqs`
- `PUT /api/admin/faqs/:id/status`
- `PATCH /api/admin/faqs/:id/approve`
- `PATCH /api/admin/faqs/:id/reject`

### Moderator
- `GET /api/mod/queue`
- `GET /api/mod/stats`

### Categories
- `GET /api/categories`
- `GET /api/categories/:idOrSlug`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

### Notifications
- `GET /api/notifications`
- `PATCH /api/notifications/read/all`
- `PATCH /api/notifications/:id/read`
- `DELETE /api/notifications/:id`

### Reports
- `GET /api/reports`
- `PUT /api/reports/:id`

### Uploads
- `POST /api/upload/avatar`

## Installation

### Backend
1. `cd server`
2. `npm install`
3. Create `.env` with MongoDB URI, JWT secret, Cloudinary keys, and mail config
4. `npm start`

### Frontend
1. `cd client`
2. `npm install`
3. Create `.env` with `VITE_API_URL=http://localhost:5000`
4. `npm run dev`

## Project Status

- Fully implemented server and client
- Feature-complete FAQ portal with user contributions, moderation, real-time updates, and reputation systems

## Notes

This repository includes both the server and client apps under separate folders. The backend exposes a REST API used by the React frontend, and Socket.IO powers live notification updates.
