# YouTube ScriptWriter Agent

## Overview

This is a full-stack web application designed for YouTube content creators to streamline their scriptwriting process with AI-powered assistance. The application provides tools to create, manage, and optimize video scripts in one centralized platform.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend:

- **Frontend**: React with TypeScript, built with Vite
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth (Google OAuth and email/password)
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Deployment**: Optimized for Replit with custom build pipeline

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Authentication Context**: Custom React context for auth state management

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL store
- **API Structure**: RESTful API with `/api` prefix routing
- **Storage Interface**: Abstracted storage layer with memory and database implementations

### Database Schema
- **Users Table**: Basic user authentication with username/password
- **Schema Location**: `shared/schema.ts` for type sharing between frontend and backend
- **Migrations**: Drizzle Kit for database migrations in `./migrations` directory

### Authentication System
- **Provider**: Supabase Auth for comprehensive authentication
- **Methods**: Google OAuth and email/password authentication
- **Protection**: Route-level protection with authenticated and public route wrappers
- **Session Persistence**: Automatic token refresh and session management

## Data Flow

1. **Authentication Flow**: Users authenticate via Supabase, with auth state managed by React context
2. **API Communication**: Frontend communicates with backend via fetch API with credential inclusion
3. **Database Operations**: Backend uses Drizzle ORM to interact with PostgreSQL database
4. **State Synchronization**: React Query handles server state caching and synchronization
5. **Real-time Updates**: Auth state changes trigger automatic UI updates

## External Dependencies

### Core Dependencies
- **@supabase/supabase-js**: Authentication and real-time features
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm & drizzle-kit**: Type-safe ORM and database toolkit
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router

### UI Dependencies
- **@radix-ui/***: Headless UI primitives for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Fast build tool and dev server
- **typescript**: Type safety across the stack
- **tsx**: TypeScript execution for development

## Deployment Strategy

The application is optimized for Replit deployment with:

1. **Development Mode**: 
   - Vite dev server with HMR
   - Express server with auto-reload
   - Replit-specific plugins for error overlay and cartographer

2. **Production Build**:
   - Vite builds frontend to `dist/public`
   - esbuild bundles backend to `dist/index.js`
   - Single production server serves both static files and API

3. **Environment Configuration**:
   - Database URL required for PostgreSQL connection
   - Supabase credentials for authentication
   - Replit-specific environment detection

4. **Database Management**:
   - `db:push` script for schema deployment
   - Drizzle migrations for version control
   - Support for both local and cloud PostgreSQL instances

## Changelog

- **August 10, 2025**: Dark World Aesthetic & Webhook Fix
  - Implemented sophisticated "Dark World" theme inspired by user's reference image
  - Updated branding to "A IMPACT MEDIA" in top left corner (corrected from AI)
  - Changed main title to "YOUTUBE SCRIPT WRITER AGENT" with multi-line typography
  - Removed "Welcome to" text and "Get in Touch" button per user feedback
  - Switched from blue to silver theme throughout interface (gray-300/400 accents)
  - Added decorative silver accent lines and cross elements
  - Fixed outline generation webhook: changed from POST to GET method
  - Enhanced glass morphism effects with silver/gray styling
  - Updated all icons and interface elements to use consistent silver palette

- **August 7, 2025**: Major webhook system refactoring
  - Created reusable `callWorkflowStep()` function for all webhook calls
  - Abstracted polling logic into `startPollingForResults()` function
  - Eliminated 95% of duplicate code between transcript analysis and research steps
  - Fixed database schema errors by removing invalid `created_by` column references
  - Both workflow steps now use identical code flow pattern

- **Previous Progress**: 
  - Fixed webhook integration with proper backend API endpoints
  - Removed Status column from dashboard for cleaner UI
  - Added "Continue to Research" button with consistent UX
  - Implemented processing cost display in success banners
  - Created reusable UI components (renderSuccessBanner, renderProcessingState, renderStepContent)

- June 30, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.