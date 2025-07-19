# VolleyClub Pro - Volleyball Club Management System

## Overview

VolleyClub Pro is a modern web application for managing volleyball club operations. It's built as a full-stack application with a React frontend and Express backend, featuring role-based authentication, player registration system with payment tracking, and a clean, responsive user interface using Tailwind CSS and shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack Query for server state, React Context for auth
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with TypeScript support

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Storage**: PostgreSQL database with proper connection pooling
- **API**: RESTful endpoints with proper error handling

## Key Components

### Authentication System
- **JWT-based authentication** with 7-day token expiration
- **Role-based access control** with three roles: admin, manager, coach
- **Password hashing** using bcrypt for security
- **Protected routes** with automatic redirects to login
- **Persistent sessions** using localStorage

### User Interface
- **Responsive design** optimized for desktop and mobile
- **Dark/light theme support** through CSS variables
- **Component library** using shadcn/ui for consistency
- **Form handling** with proper validation
- **Toast notifications** for user feedback

### Database Schema
- **Users table** with id, username, password, name, and role fields
- **Registrations table** with player information, contact details, emergency contacts, medical info, and status tracking
- **Payments table** with registration fee tracking, payment status, and Stripe integration support
- **Schedule Events table** with training sessions, court bookings, coach assignments, and participant tracking
- **PostgreSQL dialect** configured for production use
- **Drizzle ORM** for type-safe database operations
- **Migration system** for schema changes

### Module Architecture

#### Module 1: Authentication & User Management
- **JWT-based authentication** with secure login/logout
- **Role-based access control** (Admin, Manager, Coach)
- **Protected routes** with automatic redirects
- **User profile management**

#### Module 2: Registration & Payment System
- **Public registration form** for new players and parents
- **Registration management dashboard** for admins/managers
- **Payment tracking** with fee calculation
- **Status workflow** (pending → approved/rejected)
- **Registration data validation** with comprehensive form handling
- **Demo payment processing** with mock Stripe integration

#### Module 3: Training & Scheduling System (Completed)
- **Calendar view** with day/week/month viewing options
- **Court management** with 9 courts (Court 1-7 + Beach 1-2) - CRITICAL: Court names must be exactly "Court 1", "Court 2", etc. and "Beach 1", "Beach 2" only
- **Training session scheduling** with conflict detection
- **Event management** (training, match, tournament, practice)
- **Coach assignment** and participant tracking
- **Schedule conflict prevention** with automatic validation
- **Role-based scheduling access** (admin/manager can create, coach can view)
- **Multi-court event support** with comma-separated court assignments
- **Unified event data source** across all calendar views
- **Authentic calendar dates** with proper timezone handling (July 2025)
- **Court abbreviations in week view** (C1, B1, etc.)
- **Text wrapping for coach names** in event cards

#### Module 4: Player & Parent Management (Completed)
- **Player management** with comprehensive profile system
- **Parent management** with child linking functionality
- **Communication preferences** tracking (Email, SMS, GroupMe)
- **Team assignments** with multiple team support
- **Age calculation** from date of birth
- **Status tracking** (active, inactive, suspended)
- **Contact information** management
- **Profile photo** URL support
- **Database integration** with PostgreSQL and Drizzle ORM
- **Role-based access control** (admin/manager can manage, coach can view)
- **CRUD operations** with proper validation and error handling

#### Module 5: Communication System (Completed)
- **Real-time messaging** with Pusher WebSocket integration
- **Team-wide communication** with instant message broadcasting
- **Delivery status tracking** per player and communication channel
- **Multi-channel support** (Email, SMS, GroupMe mock delivery)
- **Communication preferences** integration with player profiles
- **Fallback messaging** system for offline scenarios
- **Role-based communication** (admin/manager can send messages)
- **Message history** with timestamps and sender identification
- **Live delivery confirmations** with recipient details
- **Incoming reply webhooks** for Twilio SMS and SendGrid email responses
- **Notification bell system** with real-time alerts for incoming replies
- **Reply message display** in chat interface with source identification
- **Webhook endpoints** ready for production integration (/api/webhook/sms, /api/webhook/email)

## Data Flow

1. **Authentication Flow**:
   - User submits login credentials
   - Server validates against user database
   - JWT token generated and returned with user data
   - Token stored in localStorage and included in API requests
   - Protected routes check for valid token

2. **API Request Flow**:
   - Frontend makes API requests through queryClient
   - Authentication middleware validates JWT tokens
   - Business logic processes requests
   - Responses include proper error handling

3. **State Management**:
   - Auth state managed through React Context
   - Server state cached with TanStack Query
   - UI state managed with React hooks

## External Dependencies

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI primitives for accessibility
- **wouter**: Lightweight client-side routing
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form handling and validation
- **date-fns**: Date manipulation utilities

### Backend Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver
- **drizzle-orm**: Type-safe ORM for PostgreSQL
- **bcrypt**: Password hashing library
- **jsonwebtoken**: JWT token generation and validation
- **express**: Web application framework

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking and compilation
- **drizzle-kit**: Database migration tools
- **esbuild**: Backend bundling for production

## Deployment Strategy

### Development Environment
- **Vite dev server** for frontend hot reloading
- **tsx** for running TypeScript backend directly
- **PostgreSQL database** with demo data seeding
- **Environment variables** for configuration

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Static serving**: Express serves built frontend assets
- **Database**: PostgreSQL with connection pooling

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **JWT_SECRET**: Secret key for token signing
- **NODE_ENV**: Environment mode (development/production)

### Database Management
- **Drizzle migrations** stored in `./migrations` directory
- **Schema definition** in `./shared/schema.ts`
- **Push commands** for schema synchronization
- **Type safety** through Drizzle's TypeScript integration

The application is designed to be easily deployable to platforms like Replit, with proper separation of concerns and environment-specific configurations.