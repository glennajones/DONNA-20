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
- **Event registration system** with automatic form pre-filling from active player profiles
- **Parent registration capability** with child profile data integration and parent contact auto-fill
- **Visual confirmation system** showing when forms are populated from existing profiles

#### Module 3: Training & Scheduling System (Completed)
- **Calendar view** with day/week/month viewing options
- **Court management** with 9 courts (Court 1-7 + Beach 1-2) - CRITICAL: Court names must be exactly "Court 1", "Court 2", etc. and "Beach 1", "Beach 2" only
- **Training session scheduling** with conflict detection
- **Event management** (training, match, tournament, practice)
- **Coach assignment** and participant tracking
- **Schedule conflict prevention** with automatic validation
- **Role-based scheduling access** (admin/manager can create, players/parents can view and register)
- **Multi-court event support** with comma-separated court assignments
- **Unified event data source** across all calendar views
- **Authentic calendar dates** with proper timezone handling (July 2025)
- **Court abbreviations in week view** (C1, B1, etc.)
- **Text wrapping for coach names** in event cards
- **Event registration system** with intelligent auto-fill for players and parents
- **Player dashboard integration** with streamlined schedule access

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
- **Incoming reply webhooks** for Twilio SMS, SendGrid email, and GroupMe responses
- **Notification bell system** with real-time alerts for incoming replies
- **Reply message display** in chat interface with source identification
- **Webhook endpoints** ready for production integration:
  - SMS: `/api/webhook/sms` (Twilio webhook)
  - Email: `/api/webhook/email` (SendGrid inbound parse - optional)  
  - GroupMe: `/api/webhook/groupme` (GroupMe bot callback)
- **Multi-platform reply handling** with automatic source detection and formatting

#### Module 6: Forms & Checklists (Completed)
- **Drag-and-drop form builder** with comprehensive field types (text, textarea, checkbox, date)
- **Form template management** system with create, read, update, delete operations
- **Form response tracking** and analytics dashboard
- **Preview functionality** for form templates before deployment
- **Database integration** with PostgreSQL and proper schema management
- **Role-based access control** (admin/manager can create forms, all roles can view responses)
- **Form submission system** with validation and response tracking
- **CRUD operations** with proper error handling and user feedback
- **Navigation integration** in the main application menu
- **Authentication-protected endpoints** with JWT token validation
- **Dynamic form field creation** with unique ID generation and proper state management
- **Form template list view** with active/inactive status filtering
- **Complete CRUD operations** for form templates:
  - **Create**: Via form builder with drag-and-drop field creation
  - **Read**: Template list with field details and metadata display
  - **Update**: Edit template name and description with dialog interface
  - **Delete**: Soft delete with confirmation dialog and proper permission checks
- **Role-based permissions** for template management (admin/manager only)
- **Real-time UI updates** with optimistic updates and proper error handling
- **Confirmation dialogs** for destructive actions with accessible AlertDialog components

#### Module 7: Events & Budgeting (Completed ✓)
- **Multi-step event creation wizard** with 4-step process (basic info, resources, budget, review)
- **Color-coded event type system** with 6 categories and custom colors:
  - Practice (Blue #56A0D3) - Regular practice sessions
  - School Activity (Green #10B981) - School-related activities  
  - Tournament (Red #FF0000) - Competitive events
  - Camp (Purple #8B5CF6) - Multi-day training programs
  - Team Camp (Light Orange #FFA500) - Multi-day team training programs
  - Social (Pink #EC4899) - Team building activities
- **Visual event categorization** with color-coded calendar displays across all views (Day, Week, Month)
- **Event type selector** with color preview and descriptions in creation form
- **Unified calendar integration** with Training & Scheduling system showing color-coded events
- **Configurable resource ratios** with players per court and players per coach input fields
- **Automatic resource estimation** calculating courts and coaches based on custom ratios
- **Budget calculation system** with projected revenue, costs, and profit analysis
- **Financial tracking** with actual revenue input and profit/loss comparison
- **Event management dashboard** displaying all events with financial summaries
- **Role-based access control** (admin/manager can create/manage events, coaches can view)
- **Dynamic cost calculation** with coach rates and miscellaneous expenses
- **Event status tracking** (planning, active, completed, cancelled)
- **CRUD operations** with proper validation and error handling
- **PostgreSQL database integration** with events schema and API endpoints
- **Responsive design** optimized for event planning workflow
- **Real-time budget updates** during event creation process
- **Navigation integration** with main application menu

#### Module 8: Fundraising & Sponsorship (Completed)
- **Campaign management system** with fundraising goal tracking and progress visualization
- **Sponsor management** with tier system (Bronze, Silver, Gold, Platinum, Diamond)
- **Database integration** with campaigns and sponsors tables using PostgreSQL and Drizzle ORM
- **Full CRUD operations** for both campaigns and sponsors with proper validation
- **Role-based access control** (admin/manager can create/manage, all roles can view)
- **Modern UI components** using shadcn/ui for consistent user experience
- **Progress tracking** with visual indicators for campaign goal achievement
- **Contact management** for sponsors with comprehensive contact information storage
- **Status management** for campaigns (active, completed, cancelled)
- **Dashboard navigation integration** with fundraising quick access button

#### Module 9: Google Calendar Integration (Completed)
- **Google OAuth integration** with secure token storage and management
- **One-way event synchronization** from club events to Google Calendar
- **Admin-only access** for director-level calendar integration
- **Token management system** with expiration tracking and refresh capabilities
- **Database integration** with google_calendar_tokens and calendar_sync_logs tables
- **Connection status monitoring** with real-time expiration alerts
- **Upcoming events API** filtering events for next 30 days
- **Sync logging system** for tracking successful and failed synchronizations
- **Role-based access control** (admin only for calendar integration)
- **Modern UI components** with connection status indicators and error handling
- **Configuration-ready** for production Google OAuth setup
- **Dashboard navigation integration** with integrations page access

#### Module 14: Coach Matching & Outreach (Completed ✓)
- **Coach Management System** with comprehensive coach profile creation and management
- **Coach database** with specialties, availability windows, ratings, and contact preferences (7 coaches active)
- **Automated coach matching** algorithm that scores coaches based on event requirements, specialties, and past performance
- **Outreach automation** with systematic coach contact workflow and response tracking
- **Multi-channel communication** support (email and SMS preferences) with message templating
- **Response tracking system** with accept/decline/escalate status management
- **Administrative oversight** tools for forcing assignments and re-initiating outreach
- **Event-based outreach logs** with attempt tracking and reminder management
- **Escalation system** for unanswered outreach attempts with configurable timeouts
- **Professional UI** with tabbed interface separating coach management from outreach status
- **Role-based access control** (admin/manager access for coach operations)
- **Database integration** with PostgreSQL including coaches and coach_outreach_logs tables
- **RESTful API endpoints** for coach CRUD operations and outreach management
- **Real-time status updates** with comprehensive outreach progress tracking
- **Full CRUD operations** tested and working: Create, Read, Update (with visual feedback), Delete
- **Edit functionality** with smooth scrolling, visual indicators, and form pre-population

#### Module 15: Documents & e-Signatures (Completed ✓)
- **Document Repository System** with secure file upload, storage, and management
- **Electronic Signature Engine** supporting both canvas drawing and typed signatures
- **Multi-format document support** (PDF, DOC, DOCX, TXT) with 10MB file size limit
- **Role-based access control** with granular document permissions by user role
- **Document lifecycle management** with versioning, expiration dates, and status tracking
- **Comprehensive audit logging** tracking all document actions (view, download, sign, edit, delete)
- **Signature workflow management** with requirement flags and signature collection tracking
- **Document viewer integration** with inline PDF preview and signature collection interface
- **Full CRUD operations** for documents: Create (upload), Read (view/download), Update (edit metadata), Delete (admin only)
- **Legal compliance features** including electronic signature agreements and IP address logging
- **Real-time signature status** showing who has signed and when
- **Database integration** with PostgreSQL including documents, document_signatures, and document_audit_logs tables
- **RESTful API endpoints** for document management, signature collection, and audit trail access
- **Professional UI components** with drag-and-drop signature canvas and typed signature options
- **Dashboard navigation integration** with documents quick access button

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

## Recent Changes (July 24, 2025) - Latest

### Enhanced Court Grid with Advanced Scheduling Features (Latest)
- **Implemented comprehensive Court Grid system** with drag-and-drop, conflict prevention, and inline editing capabilities
- **Added conflict detection algorithm** preventing double-booking of courts at the same time with visual warning messages
- **Built inline editing functionality** allowing users to edit event titles, types, and times directly in the grid cells
- **Created batch operations system** supporting multi-select events for bulk updates (type, time) and bulk moves between courts
- **Added event duplication feature** with one-click copying of events including all details except ID and timestamps
- **Enhanced visual feedback** with hover tooltips showing complete event information and edit/delete/duplicate buttons
- **Implemented delete confirmation modal** preventing accidental deletions with proper confirmation workflow
- **Added professional UI components** using shadcn/ui Select, Input, and Button components for consistent styling
- **Role-based permission system** where admin/manager/coach can drag and edit, admin/manager can delete events
- **Backend API expansion** with new endpoints: `/api/events/:id/duplicate`, `/api/events/batch-update`, `/api/events/batch-move`

#### Technical Implementation
- **Enhanced CourtGridDnD component** with conflict prevention using time overlap detection algorithm
- **Comprehensive state management** for editing, batch operations, conflict messaging, and modal controls
- **Advanced mutation system** using TanStack Query for optimistic updates and error handling
- **Professional inline editing** with save/cancel controls and real-time conflict checking during edits
- **Batch selection system** with checkboxes, visual selection indicators, and bulk operation controls
- **Visual enhancement** with event color coding, duration-based height calculations, and responsive design
- **Complete CRUD operations** supporting create (duplicate), read (view), update (inline edit), delete (with confirmation)

#### User Experience Improvements
- **Intuitive drag-and-drop** with instant conflict feedback preventing scheduling conflicts
- **Quick inline editing** by clicking edit icon directly on event cards without navigation
- **Efficient batch operations** for updating multiple events simultaneously (change types, move courts)
- **Visual conflict prevention** with red warning messages that auto-dismiss after 3 seconds
- **Comprehensive tooltips** showing event details on hover including recurring event indicators
- **Professional confirmation dialogs** for destructive actions with accessible design
- **Real-time updates** with optimistic UI changes and proper error recovery

### Individual Admin Settings with Configurable Daily Emails
- **Implemented comprehensive individual admin settings system** allowing each admin to configure their own email preferences
- **Added admin_settings database table** with per-admin configuration for email timing and enable/disable controls
- **Built dynamic cron scheduling system** checking every 5 minutes and respecting individual admin preferences
- **Created professional admin settings UI** with toggle switches, time pickers, and real-time save functionality
- **Enhanced automated daily email system** with personalized scheduling instead of global 6:00 PM delivery
- **Added API endpoints** for getting and saving individual admin email configuration settings
- **Integrated comprehensive error handling** with user feedback and loading states throughout the settings interface

#### Technical Implementation
- **Created adminSettings table** with adminId, dailyEmailEnabled, dailyEmailTime, and timestamp fields
- **Built storage methods** for getAdminSettings, upsertAdminSettings, and getAllAdminSettings operations
- **Added API routes** `/api/admin-settings/:adminId` (GET) and `/api/admin-settings` (POST) with authentication
- **Updated cron job** to check every 5 minutes and send emails based on individual admin time preferences
- **Enhanced DailyEmailSettings component** with Switch, Label, Input components and useAuth integration
- **Implemented real-time settings persistence** with optimistic UI updates and error recovery
- **Added backwards compatibility** for admins without configured settings (defaults to enabled at 6:00 PM)

#### User Experience
- **Individual email control** each admin can enable/disable their daily emails independently
- **Custom send time configuration** admins can set any preferred time for their daily emails
- **Professional settings interface** with loading states, save feedback, and comprehensive error handling
- **Real-time configuration** settings save immediately with toast notifications for success/failure
- **Seamless integration** settings accessible through Admin Settings > Daily Emails tab
- **Zero-conflict scheduling** multiple admins can have different send times without interference
- **Comprehensive email testing** manual trigger and test functionality remains available for all admins

## Recent Changes (July 24, 2025) - Earlier

### Enhanced Calendar with Filtering & Drag-and-Drop (Latest)
- **Implemented FullCalendar integration** with professional calendar UI and advanced functionality
- **Added comprehensive event type filtering** with color-coded categories (training, match, tournament, practice, tryouts, camp, social)
- **Built drag-and-drop rescheduling system** with real-time conflict detection and automatic database updates
- **Enhanced event resizing capability** allowing duration changes by dragging event edges
- **Created Enhanced/Classic mode toggle** on Training & Scheduling page for flexible calendar viewing
- **Added role-based permissions** restricting drag-and-drop functionality to admin, manager, and coach roles
- **Extended event type schema** to support additional categories (tryout, camp, social) beyond original four types
- **Implemented reschedule API endpoint** at `/api/schedule/:id/reschedule` with PUT method for drag-and-drop backend
- **Enhanced UI with professional features** including business hours highlighting, time constraints, and modern navigation
- **Fixed API response handling** to properly parse events array from schedule endpoint response
- **Added visual feedback systems** with toast notifications for successful reschedules and conflict warnings

#### Technical Implementation
- Installed FullCalendar packages: `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`
- Updated `scheduleEvents` table schema with expanded `eventType` enum including new categories
- Created `EnhancedCalendar.tsx` component with full filtering, drag-and-drop, and conflict detection
- Added reschedule mutation using TanStack Query with optimistic updates and error handling
- Enhanced Training page with mode switching between Enhanced (FullCalendar) and Classic views
- Database migration to support extended event types while maintaining backward compatibility

#### User Experience Improvements
- **Visual Event Categorization**: Each event type has distinct colors for immediate visual identification
- **Intuitive Filtering**: Dropdown selector with color indicators and event count badges
- **Seamless Rescheduling**: Drag events to new time slots with automatic conflict prevention
- **Professional Calendar Navigation**: Month/week/day views with business hours and time constraints
- **Real-time Updates**: Changes instantly reflected across all users without page refresh
- **Permission-based Interaction**: Only authorized roles can modify schedules while others view-only

## Recent Changes (July 24, 2025) - Earlier

### Hierarchical Folder System for Coach Resources (Latest)
- **Implemented comprehensive folder management system** allowing admins to create and organize coach resources hierarchically
- **Added coach_resource_folders database table** with support for parent-child folder relationships and categorization
- **Created FolderManager component** with full CRUD operations for folder creation, editing, and deletion
- **Enhanced CoachResourcesUpload component** with folder assignment capabilities during file upload
- **Integrated breadcrumb navigation** showing current folder path with easy navigation back to root
- **Updated API endpoints** with complete folder support:
  - GET/POST/PUT/DELETE `/api/coach-resource-folders` for folder management
  - Enhanced `/api/coach-resources` with `folderId` parameter for folder-based file organization
- **Role-based folder permissions** where admin/manager can create folders, all roles can navigate and view
- **Practice Library integration** continues to work seamlessly, showing practice drills regardless of folder organization

#### Technical Implementation
- Database schema includes `coach_resource_folders` table with recursive parent-child relationships
- Storage layer includes methods for folder hierarchy management and cascading deletion
- CoachResourcesUpload now accepts `folderId` parameter for folder-specific file uploads
- Folder navigation with state management for current folder context
- API routes support both category and folder-based resource filtering

#### User Experience Improvements
- **Folder Organization**: Admins can create folders like "Beginner Drills", "Advanced Techniques", "Tournament Prep"
- **Visual Navigation**: Clear folder icons and breadcrumb navigation for easy folder traversal
- **Contextual Uploads**: Files uploaded within a folder automatically belong to that folder
- **Practice Library Continuity**: Practice drills appear in Practice Library regardless of folder structure
- **Intuitive Interface**: Click folders to navigate, breadcrumbs to go back, clear folder vs file distinction

## Recent Changes (July 24, 2025) - Earlier

### Automated Communications Enhancement for Event UI (Latest)
- **Implemented comprehensive automated communications system** for event notifications with method override controls
- **Added communication method override field** to events database schema with enum options (none, respect_user_pref, email_only, sms_only, groupme_only, all)
- **Enhanced EventWizardAccordion** with simplified communication settings accordion section
- **Created professional email template utility** (eventEmailTemplate.ts) for automated event notifications
- **Built communication service** with SendGrid and Twilio integration for email/SMS automation
- **Enhanced POST /api/events route** to handle automated notifications with role-based targeting and asynchronous sending
- **Added getUsersByRoles method** to storage for targeted messaging based on event visibility settings
- **Added phone and communication preference fields** to users table for multi-channel support

#### Technical Implementation
- Updated events table schema with `comm_method_override` enum field defaulting to "none"
- Added phone and communicationPreference fields to users table with enum options
- Created `getUsersByRoles()` storage method for role-based user filtering
- Enhanced `/api/events` POST endpoint with automated notification logic
- Built reusable communication service supporting multiple channels (email, SMS, GroupMe mock)
- Implemented professional email templates with event details and branding

#### User Experience
- Single unified "Event Notifications" dropdown replacing duplicate communication controls
- Options: No Notifications (default), Respect User Preferences, Email Only, SMS Only, GroupMe Only, All Channels
- Eliminates confusion between notification toggles and method override settings
- Automatic role-based targeting ensures only intended users receive notifications
- Asynchronous notification sending prevents blocking during event creation
- Professional email templates provide comprehensive event information

### Role-Based Event Visibility for Personal Calendar
- **Implemented comprehensive role-based event visibility system** allowing admins to control which user roles see each event
- **Added visibleToRoles field** to events database schema with proper array type support
- **Enhanced EventWizardAccordion** with role selector UI supporting all user roles (admin, manager, coach, staff, player, parent)
- **Created QuickEventForm component** for rapid personal event creation (haircuts, meetings, appointments) with visibility controls
- **Updated schedule API filtering** to include personal events without assigned courts while maintaining role-based access
- **Fixed calendar display logic** to show personal events with location instead of court name
- **Integrated QuickEventForm into admin dashboard** for easy access to personal calendar functionality

#### Technical Implementation
- Updated events table schema with `visible_to_roles` text array field
- Modified `/api/schedule` endpoint to filter events by user role using `visibleToRoles.includes(req.user.role)`
- Enhanced event filtering logic to include personal events (no courts) alongside court-based volleyball events
- Created reusable role selector component with checkboxes and quick action buttons
- Added personal event mapping logic showing location field when no courts assigned
- Implemented proper TypeScript types and database integration for role-based filtering

#### User Experience
- Admin dashboard now includes "Personal Calendar" widget with QuickEventForm
- Personal events like "Haircut" appear on Training & Scheduling calendar with proper visibility controls
- Role-based filtering ensures users only see events intended for their role
- Quick creation workflow: name + date required, time/location optional, role visibility customizable
- Events display appropriately on calendar regardless of whether they use courts or not

## Recent Changes (July 22, 2025)

### Hybrid Payment System Implementation
- **Implemented Stripe integration** with dual payment model for event registration
- **Added subscription management** to users table with Stripe customer and subscription tracking
- **Created hybrid pricing logic** where subscribers get free access to regular training events
- **Built EventPaymentForm component** with intelligent payment flow based on subscription status
- **Added subscription page** with comprehensive benefits overview and Stripe Elements integration
- **Enhanced event schema** with registration fees, subscriber benefits, and pricing configuration
- **Integrated payment checking API** that determines if payment is required based on user subscription
- **Added Stripe webhooks** for automatic subscription status updates and payment confirmations

#### Technical Implementation
- Updated database schema with subscription fields in users table and pricing fields in events table
- Created storage methods for subscription management and Stripe customer tracking
- Implemented three main API endpoints:
  - `/api/create-payment-intent` for one-time event payments
  - `/api/get-or-create-subscription` for club membership subscriptions
  - `/api/check-event-pricing` for intelligent pricing determination
- Built reusable payment components with Stripe Elements integration
- Added subscription benefits display and payment flow optimization

## Recent Changes (July 20, 2025)

### System Simplification (Evening)
- **Simplified dual-system architecture** by making Training & Scheduling only fetch from Events list
- **Removed all seed test data** including 32 schedule_events and 2 event_registrations to eliminate confusion
- **Eliminated complex dual-system API logic** that was causing duplicates and sync issues
- **Streamlined schedule API** to only fetch from Events system with proper court and time filtering
- **Updated client-side query parameters** to remove includeEvents flag since it's now always Events-only

#### Technical Implementation
- Simplified `/api/schedule` endpoint to only process Events (budget events) with proper filtering
- Changed event IDs from `budget-${id}` to `event-${id}` to reflect single-system approach
- Removed foreign key dependencies by clearing event_registrations before schedule_events deletion
- Updated CalendarView queryKey to remove "unified" flag and includeEvents parameter
- Maintained all existing event display logic while eliminating dual-system complexity
- System now has single source of truth: Events created through Events page appear on Training & Scheduling

## Recent Changes (July 20, 2025) - Earlier

### Time Clock System Enhancements
- **Implemented 2-column layout** for the Time Clock widget in Coach Resources
  - Left column: Time clock interface with hours display, clock in/out buttons, and manual entry
  - Right column: Live "Recent Activity" panel showing last 8 time entries with timestamps and status
  - Removed popup dialog approach in favor of better space utilization
  - History panel displays compact entries with status badges (approved/pending/rejected)
  - Responsive design stacks to single column on smaller screens

### Admin Approval System
- **Created AdminApprovals component** for comprehensive manual time entry management
- **Added dedicated admin section** to Coach Resources page (visible only to admin users)
- **Enhanced approval workflow** with two access points:
  1. Quick approval in Time Clock section for recent entries (2 entries max)
  2. Comprehensive AdminApprovals section for all pending entries with full details
- **Improved UI for pending entries** showing user ID, timestamps, submission time, and reasons
- **Role-based access control** ensures only admin users see approval interfaces

### Events & Budgeting Improvements  
- **Added quantity field** to miscellaneous expenses in event creation wizard
- **Updated MiscExpense interface** to include quantity field with proper TypeScript typing
- **Enhanced expense calculation** to multiply quantity × cost for accurate totals
- **Improved form layout** with three fields: Expense item, Qty (compact 20px), Cost (28px)
- **Updated all helper functions** (addMiscExpense, updateMiscExpense) to handle quantity
- **Set quantity minimum value** to 1 with proper validation

### Technical Implementation Details
- **Time Clock data flow**: History query now always enabled for real-time side panel updates
- **Expense calculations**: `totalMiscCost = miscExpenses.reduce((sum, expense) => sum + (expense.quantity * expense.cost), 0)`
- **Component structure**: AdminApprovals component with proper error handling and loading states
- **Database integration**: All existing time clock and events APIs work seamlessly with new features
- **UI consistency**: Maintained existing styling patterns and responsive design principles

### User Experience Improvements
- **Better space utilization** with 2-column layout eliminating need for popup dialogs
- **Immediate visibility** of recent time clock activity without clicking buttons
- **Streamlined admin workflow** with dedicated approval interface
- **Enhanced expense tracking** with quantity support for accurate budget planning
- **Consistent design language** across all new components

### Staff Role Implementation (July 20, 2025)
- **Added "Staff" role** to the system for administrative personnel who need time tracking capabilities but don't coach
- **Automatic user creation** system implemented when coaches, players, or parents are added to their respective databases
- **Updated role-based permissions** to include staff access to Coach Resources module only
- **Enhanced admin configuration** with staff role options in dashboard permissions matrix

#### Technical Implementation
- **Schema updates**: Added "staff" to role enums in users and rolePermissions tables  
- **Storage layer**: Added helper functions for auto-creating user accounts with unique usernames and temporary passwords
- **Navbar updates**: Staff role now has access to Coach Resources section
- **Admin interface**: UserManagement component includes staff role with secondary badge styling
- **Database migration**: Pushed schema changes to include staff role support

#### User Experience Improvements
- **Streamlined user management** with automatic account creation reducing manual overhead
- **Time tracking access** for staff members who assist with registration, cleaning, and admin tasks
- **Role-based dashboard** correctly shows staff permissions (Coach Resources only)
- **Consistent styling** with staff role using secondary badge variant matching coaches

### Files Modified Previously (Time Clock & Events)
1. **client/src/modules/Coach/TimeClock.tsx**
   - Implemented 2-column layout (grid grid-cols-1 lg:grid-cols-2)
   - Added "Recent Activity" side panel with last 8 entries
   - Removed history dialog state and button
   - Updated history query to always fetch for side panel
   - Reduced admin pending entries display from 3 to 2 for space

2. **client/src/modules/Coach/AdminApprovals.tsx** (NEW FILE)
   - Comprehensive admin interface for manual entry approvals
   - Displays all pending entries with full details and reasons
   - Approve/reject functionality with proper error handling
   - Role-based access (admin only) with conditional rendering
   - Badge showing pending count in header

3. **client/src/pages/coach-resources.tsx**
   - Added useAuth import for role checking
   - Integrated AdminApprovals component below TimeClock
   - Conditional rendering: only shows for admin users

4. **client/src/components/events/EventWizardAccordion.tsx**
   - Updated MiscExpense interface to include quantity field
   - Modified miscExpenses state to include quantity: 1 as default
   - Updated totalMiscCost calculation with quantity multiplication
   - Enhanced form UI with 3-field layout (item, qty, cost)
   - Updated helper functions for quantity support
   - Set quantity field width to w-20 and cost to w-28

5. **replit.md** (THIS FILE)
   - Documented all changes with implementation details
   - Added technical specifications and user experience improvements
   - Created permanent record of today's enhancements

### Files Modified Today (Staff Role & Auto User Creation)
1. **shared/schema.ts**
   - Added "staff" to role enum in users table (line 14)
   - Added "staff" to role enum in rolePermissions table (line 835)
   - Updated schema to support staff role across all permission structures

2. **server/storage.ts** 
   - Added generateUniqueUsername() helper method for automatic username creation
   - Added generateTemporaryPassword() helper for secure temp passwords
   - Added createUserAccount() helper for automatic user creation workflow
   - Modified createPlayer(), createParent(), createCoach() to auto-create user accounts
   - Enhanced storage layer with role-based user management automation

3. **client/src/pages/admin-dashboard-config.tsx**
   - Added staff role to roles array with secondary badge styling (line 83)
   - Updated Coach Resources defaultRoles to include "staff" access (line 93)
   - Enhanced permission matrix to support staff time tracking needs

4. **server/routes.ts**
   - Added staff role permissions for dashboard widgets (lines 2975-2984)
   - Updated widget default roles to include staff for Coach Resources (line 2921)
   - Enhanced role-based permission system for staff access control

5. **client/src/components/layout/Navbar.tsx**
   - Updated Coach Resources navigation to include staff role access (line 88)
   - Extended role-based navigation for staff time tracking capabilities

6. **client/src/modules/Admin/UserManagement.jsx**
   - Added "Staff" option to role selection dropdown (line 277)
   - Updated getRoleBadgeVariant() to include staff with secondary styling (line 190)
   - Changed default role in form to "staff" for new user creation (line 19)
   - Updated all form reset operations to use "staff" as default role

7. **Database Migration**
   - Executed `npm run db:push` to apply staff role schema changes
   - Successfully updated role enums in users and rolePermissions tables