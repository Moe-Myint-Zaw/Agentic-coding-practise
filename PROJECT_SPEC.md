# Social Media Application - Project Specification

## Project Overview

A modern, full-stack social media application built with a unified technology stack across web and mobile platforms. The application enables users to create and share content, engage with others through likes and comments, and build their social presence through user profiles.

### Technology Stack

**Frontend (Web)**
- React 18+ with Vite
- TypeScript
- React Query for data fetching and caching
- React Router for navigation
- React Hook Form for form management
- shadcn/ui component library
- Tailwind CSS for styling
- JWT authentication
- English/Myanmar localization (i18n)
- Light/dark theme support
- Web theme preference persists in local storage and applies a root `dark` class
- Shared UI colors use light/dark theme tokens for surfaces, text, borders, and controls

**Backend**
- Node.js with Express
- TypeScript
- Prisma ORM
- SQLite for local development
- PostgreSQL for production
- API versioning (/api/v1/)
- JWT authentication
- Express Validator for input validation
- CORS enabled
- Rate limiting on authentication endpoints
- Upload handling for user and post images
- Admin endpoints for stats, user moderation, and content review

**Mobile (React Native + Expo)**
- React Native with Expo
- Expo Router for navigation
- Expo UI components
- React Query for data fetching
- React Hook Form for form management
- English/Myanmar localization
- Theme support (light/dark)
- Secure token storage with Expo secure store
- API client configured to use a LAN IP for physical devices and Android emulator networking

## Current Implementation Status

As of the current repository state, the project is already beyond a blank scaffold and includes the following implemented work:

- Backend API routes for authentication, refresh, current-user lookup, posts, comments, likes, profile updates, image upload, admin moderation, and unified search are present.
- User authentication flows include registration, login, JWT issuance, refresh token handling, and protected route enforcement.
- Post and comment operations support listing, creation, retrieval, owner-only post editing within 24 hours, deletion, and like toggling.
- User profile and admin endpoints are implemented for viewing profiles, user-specific posts, stats, moderation lists, and banning.
- Follow management is implemented for authenticated users, including follow/unfollow toggling, follower/following counts, and follow state on profiles.
- Feed filtering is implemented with `latest` and `following` modes in the web and mobile clients.
- Notifications are implemented on the backend through WebSocket events and notification history/read APIs; notification preferences and UX polish remain future work.
- Full-text search is implemented for authenticated users on web and mobile, covering public profiles, non-deleted post text, and comments on visible posts with separate pagination.
- The web app and Expo mobile app are both present in the workspace and wired to the same backend API contract.

## Project Goals

1. **User Engagement**: Provide an intuitive, responsive platform for users to create, share, and engage with content
2. **Scalability**: Build a modular architecture that can scale from MVP to full-featured platform
3. **Cross-Platform**: Deliver consistent user experience across web and mobile devices
4. **Performance**: Optimize for fast load times, smooth interactions, and efficient data fetching
5. **Accessibility**: Support multiple languages (English/Myanmar) and ensure WCAG compliance
6. **Security**: Implement robust authentication, authorization, and data protection

## Scope

### Current MVP Scope (implemented / in active use)
- User Authentication (registration, login, JWT refresh, current-user lookup)
- Post Management (create, view, delete posts with text and images)
- Comments (create and delete comments on posts)
- Likes & Reactions (toggle like/unlike posts and comments)
- User Profiles (view profiles, update profile details, list user posts)
- Follow System (authenticated users can follow and unfollow other users)
- User and Full-text Search (authenticated users can find profiles, posts, and comments)
- Feed Filtering (Latest and Following feeds)
- Real-time Notifications (WebSocket events and notification history/read APIs)
- Basic Admin Moderation (stats, user list, content lists, ban actions)

### Future Phases
- Advanced Privacy Settings
- Additional Enhanced Profile fields (location and website)
- Notification UX enhancements (preferences, in-app toast patterns, notification center polish)
- Multi-level Comment Threading

## User Roles

### Regular User
- Create account with email/username/password
- Create, edit, and delete own posts
- View all public posts
- Comment on posts
- Like/unlike posts and comments
- View user profiles
- Edit own profile (display name, bio, profile picture)
- Log out and manage session

### Administrator
- All regular user permissions
- View list of all users
- View all posts and comments
- Delete any post or comment
- Ban/unban users
- Access admin dashboard for moderation

## Functional Requirements

### Authentication (MVP)

#### User Registration
- Users can register with email, username, and password
- Email validation (format and uniqueness)
- Username validation (alphanumeric, 3-20 characters, uniqueness)
- Password requirements (minimum 8 characters, at least one letter and one number)
- Password confirmation matching
- JWT token generation upon successful registration
- Automatic login after registration

#### User Login
- Users can login with email/username and password
- JWT token generation and storage
- Token expiration (configurable, default 7 days)
- Refresh token mechanism
- Session management
- Rate limiting on login attempts (5 attempts per 15 minutes)

#### User Logout
- Invalidate JWT token on server
- Clear token from client storage
- Redirect to login page

#### Password Recovery (Future)
- Email-based password reset
- Secure reset token generation
- Token expiration (1 hour)

### Post Management (MVP)

#### Create Post
- Create posts with text content (max 500 characters)
- Upload images (JPEG, PNG, max 5MB per image, max 5 images per post)
- Image validation and optimization
- Post creation timestamp
- Automatic association with authenticated user

#### View Posts
- View feed of all public posts (sorted by creation date, newest first)
- Pagination (20 posts per page)
- Infinite scroll option
- View individual post details
- Display post author, content, images, timestamp, like count, comment count

#### Edit Post
- Edit own posts within 24 hours of creation
- Preserve original creation timestamp
- Update the post's `updatedAt` timestamp
- Reject edits by other users and edits after the 24-hour window

#### Delete Post
- Users can delete their own posts
- Admins can delete any post
- Cascade delete associated comments and likes
- Soft delete with recovery option (admin only)

### Comments (MVP)

#### Create Comment
- Add comments to posts (max 300 characters)
- Comment creation timestamp
- Automatic association with authenticated user and post

#### View Comments
- View all comments on a post
- Pagination (10 comments per page)
- Display comment author, content, timestamp, like count

#### Delete Comment
- Users can delete their own comments
- Admins can delete any comment
- Soft delete with recovery option (admin only)

### Likes & Reactions (MVP)

#### Like Post
- Toggle like/unlike on posts
- Prevent duplicate likes
- Real-time like count updates
- Track which posts user has liked

#### Like Comment
- Toggle like/unlike on comments
- Prevent duplicate likes
- Real-time like count updates
- Track which comments user has liked

### User Profiles (MVP)

#### View Profile
- View any user's public profile
- Display username, display name, bio, profile picture
- Display user's post count
- Display user's posts (sorted by creation date)
- Display follower and following counts and whether the authenticated viewer follows the profile

### Follow System

- Authenticated users can follow another user with `POST /api/v1/users/:id/follow`
- Authenticated users can unfollow another user with `DELETE /api/v1/users/:id/follow`
- Following the same user twice is idempotent; unfollowing an already-unfollowed user is also idempotent
- Users cannot follow themselves, and following a missing user returns `404`
- Pagination (20 posts per page)

#### Edit Profile
- Edit display name (max 50 characters)
- Edit bio (max 160 characters)
- Upload profile picture (JPEG, PNG, max 2MB)
- Profile picture validation and optimization
- Changes apply immediately

### Admin Moderation (MVP)

#### User Management
- View list of all users with registration date, post count, status
- Search users by username or email
- Ban/unban users (banned users cannot login or create content)
- View banned users list

#### Content Moderation
- View all posts with filtering options (by user, date range, report count)
- View all comments with filtering options
- Delete any post or comment with reason logging
- View deleted content history

#### Admin Dashboard
- Overview statistics (total users, posts, comments, active users)
- Recent activity feed
- Quick actions for moderation

### Follow System (MVP)

#### Follow User
- Authenticated users can follow or unfollow another user
- Following and unfollowing are idempotent; users cannot follow themselves
- Profiles display follower/following counts and the viewer's follow state

#### Feed Filtering
- Toggle between "Latest" (all public posts) and "Following" (posts from followed users)
- Default to "Latest" feed
- Filter posts server-side by followed authors when "Following" is selected

### Search (MVP)

#### Full-text Search
- Authenticated users can search user profiles by username, display name, or bio
- Authenticated users can search non-deleted posts by text content
- Authenticated users can search non-deleted comments on non-deleted posts by text content
- Hashtags are searchable as literal text in post and comment content
- Search excludes banned users and content authored by banned users
- Search results never expose email addresses or other private account fields
- Queries must contain at least two characters
- People, post, and comment results are paginated independently, with 20 results per page by default and a maximum of 50
- Web and mobile clients provide debounced search, separate result sections, empty/error states, and pagination
- Endpoint: `GET /api/v1/search?q=<query>&page=<people-page>&postsPage=<posts-page>&commentsPage=<comments-page>&limit=<limit>` (authenticated; other page parameters default to `page`)
- The existing `GET /api/v1/users/search` endpoint remains available for user-only search compatibility

### Notifications (Backend implemented)

#### Real-time Notifications
- WebSocket connection for real-time updates
- Notifications for likes on posts/comments
- Notifications for new comments on posts
- Notifications for new followers
- Notification read/unread status
- Notification count badge
- Notification history

WebSocket clients connect to `/ws?token=<access-token>` and receive `notification.created` events. REST history is available at `GET /api/v1/notifications`; clients can mark one notification read with `PATCH /api/v1/notifications/:id/read` or all notifications read with `POST /api/v1/notifications/read-all`.

#### Notification Preferences
- Enable/disable notification types
- Email notifications (optional)

## Non-Functional Requirements

### Performance
- Page load time < 2 seconds on 3G connection
- API response time < 500ms for 95th percentile
- Image optimization and lazy loading
- Efficient database queries with proper indexing
- Client-side caching with React Query
- Code splitting for optimal bundle size

### Security
- JWT token-based authentication
- Password hashing with bcrypt (minimum 10 rounds)
- HTTPS/TLS for all communications
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- XSS prevention
- CSRF protection
- Rate limiting on authentication endpoints
- Secure file upload validation
- Environment variable management for secrets

### Scalability
- Horizontal scaling readiness
- Database connection pooling
- CDN for static assets (production)
- Image CDN integration (production phase)
- Caching strategy (Redis for future)
- Load balancing capability

### Reliability
- 99.5% uptime target
- Graceful error handling
- Database transaction management
- Automatic retry for failed requests
- Backup strategy for database
- Health check endpoints

### Usability
- Responsive design (mobile, tablet, desktop)
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Consistent UI/UX across platforms
- Intuitive navigation
- Clear error messages
- Loading states and feedback

### Maintainability
- Clean, modular architecture
- Comprehensive code documentation
- Type safety with TypeScript
- Consistent code style (ESLint, Prettier)
- Unit and integration tests
- API documentation (OpenAPI/Swagger)
- Database migrations with Prisma

### Internationalization
- English and Myanmar language support
- Language switcher in UI
- Translatable UI strings
- Date/time localization
- Number formatting
- Currency formatting (if needed)

## Data Model

### User
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique
  password      String
  displayName   String?
  bio           String?
  profileImage  String?
  role          Role      @default(USER)
  isBanned      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  posts         Post[]
  comments      Comment[]
  likes         Like[]
  followers     Follow[]  @relation("UserFollowers")
  following     Follow[]  @relation("UserFollowing")

  @@index([email])
  @@index([username])
}

enum Role {
  USER
  ADMIN
}
```

### Post
```prisma
model Post {
  id          String    @id @default(cuid())
  content     String
  images      String[]  // Array of image URLs
  authorId    String
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  isDeleted   Boolean   @default(false)
  deletedAt   DateTime?
  deletedBy   String?   // Admin ID who deleted
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  comments    Comment[]
  likes       Like[]

  @@index([authorId])
  @@index([createdAt])
  @@index([isDeleted])
}
```

### Comment
```prisma
model Comment {
  id        String    @id @default(cuid())
  content   String
  postId    String
  post      Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  isDeleted Boolean   @default(false)
  deletedAt DateTime?
  deletedBy String?   // Admin ID who deleted
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  likes     Like[]

  @@index([postId])
  @@index([authorId])
  @@index([createdAt])
  @@index([isDeleted])
}
```

### Like
```prisma
model Like {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  postId     String?
  post       Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  commentId  String?
  comment    Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([userId, postId])
  @@unique([userId, commentId])
  @@index([userId])
  @@index([postId])
  @@index([commentId])
}
```

### Follow (Future)
```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String
  follower    User     @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
  followingId String
  following   User     @relation("UserFollowers", fields: [followingId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

### Notification
```prisma
model Notification {
  id          String    @id @default(cuid())
  recipientId String
  actorId     String
  type        String
  postId      String?
  commentId   String?
  readAt      DateTime?
  createdAt   DateTime  @default(now())

  @@index([recipientId, createdAt])
  @@index([recipientId, readAt])
}
```

## API Overview

### Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://api.example.com/api/v1`

### Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication
```
POST   /auth/register        - Register new user
POST   /auth/login           - Login user
POST   /auth/logout          - Logout user
POST   /auth/refresh         - Refresh JWT token
GET    /auth/me              - Get current user info
```

#### Posts
```
GET    /posts                - Get all posts (paginated)
POST   /posts                - Create new post
GET    /posts/:id            - Get single post
PUT    /posts/:id            - Update post (future)
DELETE /posts/:id            - Delete post
GET    /posts/:id/comments   - Get post comments
```

#### Comments
```
POST   /comments             - Create comment
GET    /comments/:id         - Get single comment
DELETE /comments/:id         - Delete comment
```

#### Likes
```
POST   /likes/post/:postId   - Toggle like on post
POST   /likes/comment/:commentId - Toggle like on comment
GET    /likes/user           - Get user's liked posts/comments
```

#### Users
```
GET    /users                - Get all users (admin)
GET    /users/:id            - Get user profile
PUT    /users/:id            - Update user profile
PATCH  /users/:id/ban        - Ban/unban user (admin)
GET    /users/:id/posts      - Get user's posts
```

#### Admin
```
GET    /admin/stats          - Get platform statistics
GET    /admin/users          - Get all users with filters
GET    /admin/posts          - Get all posts with filters
GET    /admin/comments       - Get all comments with filters
```

#### File Upload
```
POST   /upload/image         - Upload image
```

### Response Format

#### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Pagination
```
GET /posts?page=1&limit=20

Response:
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## UI Overview

### Web Application

#### Layout Structure
- **Navigation Bar**: Logo, Search, Navigation Links, User Menu, Theme Toggle, Language Switcher
- **Main Content Area**: Dynamic content based on route
- **Mobile Navigation**: Bottom tab bar for mobile view

#### Key Pages
- **Login/Register Page**: Clean, centered authentication forms
- **Feed Page**: Infinite scroll post feed with create post modal
- **Post Detail Page**: Full post with comments section
- **Profile Page**: User info, bio, stats, and post grid
- **Edit Profile Page**: Form to update profile information
- **Admin Dashboard**: Statistics, user management, content moderation
- **Settings Page**: Theme, language, notification preferences (future)

#### Components
- **PostCard**: Display post with author info, content, images, actions
- **CommentCard**: Display comment with author info and actions
- **LikeButton**: Animated like/unlike button with count
- **CommentSection**: Comment list and form
- **CreatePostModal**: Modal for creating new posts
- **ImageUploader**: Drag-and-drop image upload with preview
- **UserProfileHeader**: User profile information display
- **PaginationControls**: Navigation for paginated content
- **LoadingSpinner**: Loading state indicator
- **ErrorMessage**: Error display with retry option
- **ThemeToggle**: Light/dark mode switcher
- **LanguageSwitcher**: English/Myanmar language selector

### Mobile Application

#### Navigation Structure
- **Tab Navigation**: Feed, Search, Notifications, Profile
- **Stack Navigation**: Post detail, Profile detail, Comments, Settings
- **Modal Navigation**: Create post, Edit profile

#### Key Screens
- **Feed Screen**: Post feed with pull-to-refresh and infinite scroll
- **Post Detail Screen**: Full post with comments
- **Profile Screen**: User profile with posts
- **Edit Profile Screen**: Profile editing form
- **Create Post Screen**: Post creation with image upload
- **Login/Register Screens**: Authentication forms
- **Admin Dashboard Screen**: Admin tools and statistics

#### Components
- Native Expo UI components with consistent styling
- Cross-platform form components
- Image picker and camera integration
- Pull-to-refresh and infinite scroll
- Bottom sheet for actions
- Toast notifications

## Workflows

### User Registration Workflow
1. User navigates to registration page
2. User enters email, username, password, and password confirmation
3. Client validates input format
4. Client sends registration request to API
5. Server validates uniqueness and creates user account
6. Server generates JWT token
7. Server returns token and user data
8. Client stores token and redirects to feed
9. User is automatically logged in

### Post Creation Workflow
1. User clicks "Create Post" button
2. Create post modal opens
3. User enters text content (optional)
4. User uploads images (optional, max 5)
5. Client validates content and images
6. Client previews post
7. User clicks "Post"
8. Client sends post data to API
9. Server validates and creates post
10. Server returns created post
11. Client updates feed with new post
12. Modal closes and success message displays

### Like Interaction Workflow
1. User clicks like button on post or comment
2. Client checks current like status
3. Client sends toggle request to API
4. Server updates like status
5. Server returns updated like count and status
6. Client updates UI optimistically
7. Like button animates and count updates

### Comment Creation Workflow
1. User opens comment section on post
2. User enters comment text
3. Client validates input
4. User clicks "Comment"
5. Client sends comment to API
6. Server creates comment
7. Server returns created comment
8. Client adds comment to list
9. Comment count updates

### Profile Editing Workflow
1. User navigates to their profile
2. User clicks "Edit Profile"
3. Edit profile form opens with current data
4. User modifies display name, bio, or profile picture
5. Client validates input
6. User clicks "Save"
7. Client sends update request to API
8. Server updates user profile
9. Server returns updated user data
10. Client updates profile display
11. Success message displays

### Admin Moderation Workflow
1. Admin navigates to admin dashboard
2. Admin views content moderation section
3. Admin filters content (by user, date, type)
4. Admin selects content to review
5. Admin reviews content details
6. Admin clicks "Delete" with optional reason
7. Client sends delete request to API
8. Server soft-deletes content
9. Server logs deletion reason and admin ID
10. Client updates content list
11. Content marked as deleted

## Permissions

### Permission Matrix

| Action | Regular User | Admin |
|--------|-------------|-------|
| Register | ✅ | ✅ |
| Login | ✅ | ✅ |
| Create Post | ✅ | ✅ |
| Edit Own Post | ✅ | ✅ |
| Delete Own Post | ✅ | ✅ |
| Delete Any Post | ❌ | ✅ |
| View All Posts | ✅ | ✅ |
| Create Comment | ✅ | ✅ |
| Delete Own Comment | ✅ | ✅ |
| Delete Any Comment | ❌ | ✅ |
| Like Post/Comment | ✅ | ✅ |
| View Any Profile | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ |
| View All Users | ❌ | ✅ |
| Ban User | ❌ | ✅ |
| Access Admin Dashboard | ❌ | ✅ |
| Delete Any Content | ❌ | ✅ |

### Access Control Implementation
- JWT token contains user role
- Middleware checks role for protected routes
- Frontend hides admin-only features for regular users
- Server-side validation for all write operations
- Ownership checks for user-owned resources

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Web App (React + Vite)  │  Mobile App (React Native + Expo) │
│  - React Query           │  - React Query                    │
│  - React Router          │  - Expo Router                    │
│  - shadcn/ui             │  - Expo UI                        │
│  - Tailwind CSS          │  - Native Components              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              │
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                          │
├─────────────────────────────────────────────────────────────┤
│  - API Versioning (/api/v1/)                               │
│  - Rate Limiting                                           │
│  - CORS                                                    │
│  - Request Validation                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                      │
├─────────────────────────────────────────────────────────────┤
│  - Express Controllers                                      │
│  - Business Logic                                          │
│  - Authentication Middleware                               │
│  - Authorization Middleware                                │
│  - Error Handling                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                            │
├─────────────────────────────────────────────────────────────┤
│  - Prisma ORM                                              │
│  - Database (SQLite dev / PostgreSQL prod)                 │
│  - File Storage (local / cloud)                            │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Architecture (Web)

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Layout components (Navbar, Sidebar)
│   ├── post/           # Post-related components
│   ├── comment/        # Comment-related components
│   └── user/           # User-related components
├── pages/              # Page components
│   ├── Feed.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Profile.tsx
│   └── Admin.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── usePosts.ts
│   └── useTheme.ts
├── services/           # API service layer
│   ├── api.ts          # Axios configuration
│   ├── auth.service.ts
│   ├── post.service.ts
│   └── user.service.ts
├── store/              # Global state (if needed)
├── types/              # TypeScript types
├── utils/              # Utility functions
├── i18n/               # Internationalization
│   ├── en.json
│   └── mm.json
├── styles/             # Global styles
└── App.tsx             # Root component
```

### Backend Architecture

```
src/
├── controllers/        # Route controllers
│   ├── auth.controller.ts
│   ├── post.controller.ts
│   ├── comment.controller.ts
│   ├── user.controller.ts
│   └── admin.controller.ts
├── middleware/         # Express middleware
│   ├── auth.middleware.ts
│   ├── admin.middleware.ts
│   ├── validate.middleware.ts
│   ├── rateLimit.middleware.ts
│   └── error.middleware.ts
├── services/           # Business logic
│   ├── auth.service.ts
│   ├── post.service.ts
│   ├── comment.service.ts
│   ├── user.service.ts
│   └── upload.service.ts
├── models/             # Prisma models (generated)
├── validators/         # Request validators
│   ├── auth.validator.ts
│   ├── post.validator.ts
│   └── user.validator.ts
├── routes/             # API routes
│   ├── auth.routes.ts
│   ├── post.routes.ts
│   ├── comment.routes.ts
│   ├── user.routes.ts
│   └── admin.routes.ts
├── utils/              # Utility functions
│   ├── jwt.util.ts
│   ├── password.util.ts
│   └── upload.util.ts
├── config/             # Configuration
│   ├── database.ts
│   └── index.ts
├── types/              # TypeScript types
└── app.ts              # Express app setup
```

### Mobile Architecture

```
app/
├── (tabs)/             # Tab navigation
│   ├── feed.tsx
│   ├── search.tsx      # Search screen
│   ├── notifications.tsx # Notification history
│   └── profile.tsx
├── (auth)/             # Auth stack
│   ├── login.tsx
│   └── register.tsx
├── post/               # Post-related screens
│   ├── [id].tsx
│   └── create.tsx
├── profile/            # Profile screens
│   ├── [id].tsx
│   └── edit.tsx
├── admin/              # Admin screens
│   └── dashboard.tsx
├── components/         # Reusable components
├── hooks/              # Custom hooks
├── services/           # API services
├── utils/              # Utilities
├── i18n/               # Internationalization
└── _layout.tsx         # Root layout
```

### Database Schema Relationships

```
User (1) ----< (N) Post
User (1) ----< (N) Comment
User (1) ----< (N) Like
Post (1) ----< (N) Comment
Post (1) ----< (N) Like
Comment (1) ----< (N) Like
User (1) ----< (N) Follow (as follower)
User (1) ----< (N) Follow (as following)
User (1) ----< (N) Notification
```

## Implementation Milestones

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup and configuration
  - [ ] Initialize web project (Vite + React + TypeScript)
  - [ ] Initialize backend project (Express + TypeScript + Prisma)
  - [ ] Initialize mobile project (Expo + React Native)
  - [ ] Set up development environment and tooling
  - [ ] Configure ESLint, Prettier, and TypeScript
- [ ] Database setup
  - [ ] Design and implement Prisma schema
  - [ ] Set up SQLite for development
  - [ ] Create database migrations
  - [ ] Seed database with test data
- [ ] Authentication system
  - [ ] Implement JWT token generation and validation
  - [ ] Create user registration endpoint
  - [ ] Create user login endpoint
  - [ ] Implement password hashing
  - [ ] Add rate limiting to auth endpoints
  - [ ] Create auth middleware
- [ ] Basic frontend structure
  - [ ] Set up React Router
  - [ ] Create layout components
  - [x] Implement web theme provider (light/dark)
  - [ ] Set up i18n (English/Myanmar)
  - [ ] Create login and register pages

### Phase 2: Core Features (Week 3-4)
- [ ] Post Management
  - [ ] Create post endpoints (CRUD)
  - [ ] Implement image upload functionality
  - [ ] Add image validation and optimization
  - [ ] Create post components (PostCard, CreatePostModal)
  - [ ] Implement feed page with pagination
  - [ ] Add infinite scroll
- [ ] Comment System
  - [ ] Create comment endpoints
  - [ ] Implement comment components
  - [ ] Add comment section to post detail
  - [ ] Implement comment pagination
- [ ] Likes System
  - [ ] Create like endpoints
  - [ ] Implement like components
  - [ ] Add like buttons to posts and comments
  - [ ] Implement optimistic updates
- [ ] User Profiles
  - [ ] Create user profile endpoints
  - [ ] Implement profile components
  - [ ] Create profile page
  - [ ] Add edit profile functionality
  - [ ] Implement profile picture upload

### Phase 3: Admin Features (Week 5)
- [ ] Admin Dashboard
  - [ ] Create admin middleware
  - [ ] Implement admin authentication
  - [ ] Create admin dashboard layout
  - [ ] Add statistics overview
  - [ ] Implement user management interface
- [ ] Content Moderation
  - [ ] Create admin content endpoints
  - [ ] Implement content filtering
  - [ ] Add delete functionality for admins
  - [ ] Implement user ban/unban
  - [ ] Add moderation logging

### Phase 4: Mobile App (Week 6-7)
- [ ] Mobile Setup
  - [ ] Set up Expo Router navigation
  - [ ] Configure Expo UI components
  - [ ] Set up React Query for mobile
  - [ ] Implement theme provider
  - [ ] Set up i18n for mobile
- [ ] Mobile Features
  - [ ] Implement feed screen
  - [ ] Create post detail screen
  - [ ] Implement profile screen
  - [ ] Add authentication screens
  - [ ] Implement create post functionality
  - [ ] Add image picker integration
- [ ] Mobile Admin
  - [ ] Implement admin dashboard screen
  - [ ] Add moderation features

### Phase 5: Polish & Testing (Week 8)
- [ ] Testing
  - [ ] Write unit tests for backend services
  - [ ] Write integration tests for API endpoints
  - [ ] Write component tests for frontend
  - [ ] Add E2E tests for critical flows
- [ ] Performance Optimization
  - [ ] Implement code splitting
  - [ ] Add image lazy loading
  - [ ] Optimize database queries
  - [ ] Add caching strategies
- [ ] UI/UX Improvements
  - [ ] Add loading states
  - [ ] Implement error boundaries
  - [ ] Add success/error toasts
  - [ ] Improve responsive design
  - [ ] Add animations
- [ ] Documentation
  - [ ] Write API documentation
  - [ ] Create component documentation
  - [ ] Write deployment guide
  - [ ] Document setup instructions

### Phase 6: Future Features (Post-MVP)
- [x] Follow System
  - [x] Implement follow/unfollow functionality
  - [x] Add follow counts and follow state to profiles
  - [x] Support following-filtered feeds
- [x] Search
  - [x] Search profiles, posts, and comments
  - [x] Add web and mobile search UI
  - [x] Paginate each result type independently
- [x] Real-time Notifications backend
  - [x] Set up WebSocket server
  - [x] Implement notification system
  - [x] Add notification history and read status API
  - [ ] Notification UX polish
  - [ ] Add notification preferences
- [ ] Advanced Features
  - [ ] Multi-level comment threading
  - [ ] Additional enhanced profile fields
  - [ ] Privacy settings

## Development Guidelines

### Code Style
- Follow ESLint and Prettier configurations
- Use TypeScript for type safety
- Write meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for complex functions
- Use consistent naming conventions (camelCase for variables, PascalCase for components)

### Git Workflow
- Use feature branches for new features
- Write descriptive commit messages
- Create pull requests for review
- Ensure tests pass before merging
- Use conventional commit format

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- Component tests for UI components
- E2E tests for critical user flows
- Minimum 80% code coverage target

### Deployment Strategy
- Environment-specific configurations
- Database migrations for schema changes
- Blue-green deployment for zero downtime
- Rollback capability for quick recovery
- Monitoring and alerting setup

## Security Considerations

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper password hashing
- Never log sensitive information
- Sanitize user inputs
- Validate file uploads

### Authentication Security
- Implement token expiration
- Use secure token storage
- Implement refresh token rotation
- Add rate limiting to auth endpoints
- Monitor for suspicious activity

### API Security
- Implement rate limiting
- Use CORS properly
- Validate all inputs
- Implement proper error handling
- Use parameterized queries (Prisma)
- Implement request size limits

## Performance Targets

### Frontend Performance
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1
- First Input Delay < 100ms

### Backend Performance
- API response time < 500ms (95th percentile)
- Database query time < 100ms (95th percentile)
- Image upload processing < 2s
- Support 1000 concurrent users

### Mobile Performance
- App launch time < 2s
- Screen transitions < 300ms
- List scrolling at 60fps
- Image loading < 1s

## Monitoring & Logging

### Application Monitoring
- Track API response times
- Monitor error rates
- Track user engagement metrics
- Monitor database performance
- Set up uptime monitoring

### Logging Strategy
- Structured logging format
- Log levels (error, warn, info, debug)
- Log authentication events
- Log admin actions
- Log errors with stack traces
- Avoid logging sensitive data

### Alerting
- Alert on high error rates
- Alert on slow response times
- Alert on database connection issues
- Alert on authentication failures
- Alert on disk space issues

## Success Criteria

### Technical Success
- All MVP features implemented and tested
- 95%+ test coverage for critical paths
- API response times meet performance targets
- Zero critical security vulnerabilities
- Successful deployment to production

### User Experience Success
- Intuitive and easy-to-use interface
- Fast and responsive interactions
- Accessible to users with disabilities
- Available in English and Myanmar
- Works seamlessly on web and mobile

### Business Success
- User registration conversion rate > 60%
- Daily active user engagement > 30%
- Average session duration > 5 minutes
- Post creation rate > 0.5 posts/user/day
- Comment engagement rate > 20%

---

**Document Version**: 1.0
**Last Updated**: 2025-01-09
**Status**: Ready for Development