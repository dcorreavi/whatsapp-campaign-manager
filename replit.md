# WhatsApp Campaign Manager

## Overview

This is a full-stack WhatsApp campaign management application built with Express.js backend, React frontend, and PostgreSQL database. The application allows users to create and manage automated WhatsApp messaging campaigns with contact management, file upload capabilities, and real-time progress tracking.

## System Architecture

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (Neon Database)
- **Storage**: DatabaseStorage implementation with persistent data
- **Build System**: esbuild for production bundling
- **File Processing**: Multer for file uploads with CSV/Excel parsing support
- **Session Management**: Express sessions with PostgreSQL store

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and bundling
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Migration Strategy**: Schema-first approach with migration files

## Key Components

### Data Models
The application uses three main database tables:
- **Campaigns**: Stores campaign metadata, templates, and settings
- **Contacts**: Manages contact information with phone number validation
- **Message Log**: Tracks message delivery status and errors

### Core Features
1. **Campaign Management**: Create, edit, and manage WhatsApp campaigns
2. **Contact Import**: Upload CSV/Excel files with automatic phone number validation
3. **Message Templates**: Customizable message templates with variable substitution
4. **WhatsApp Integration**: Real WhatsApp Web API integration with QR authentication
5. **Progress Tracking**: Real-time campaign progress monitoring
6. **File Processing**: Support for CSV and Excel contact import

### UI Components
- **File Upload**: Drag-and-drop interface with file validation
- **Contact Preview**: Interactive contact list with validation status
- **Message Template Editor**: Rich text editor with preview functionality
- **Campaign Settings**: Configuration panel for delays and campaign parameters
- **Progress Modal**: Real-time progress tracking with status updates
- **Sidebar**: Quick actions and campaign statistics

## Data Flow

1. **Campaign Creation**: User creates a campaign with name and basic settings
2. **Contact Import**: CSV/Excel files are uploaded and parsed for contacts
3. **Phone Validation**: Contact phone numbers are validated and formatted
4. **Template Configuration**: Message templates are created with variable placeholders
5. **Campaign Execution**: Messages are queued and sent with configurable delays
6. **Progress Monitoring**: Real-time updates on message delivery status

## External Dependencies

### Backend Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **drizzle-orm**: Type-safe ORM for database operations
- **multer**: File upload middleware
- **papaparse**: CSV parsing library
- **xlsx**: Excel file processing

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **react-dropzone**: File upload interface
- **wouter**: Lightweight routing
- **date-fns**: Date manipulation utilities

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20
- **Database**: PostgreSQL 16
- **Development Server**: Vite dev server with HMR
- **Build Process**: Parallel client and server builds

### Production Deployment
- **Platform**: Replit with autoscale deployment
- **Build Commands**: 
  - Client: `vite build` (outputs to `dist/public`)
  - Server: `esbuild` bundle (outputs to `dist/index.js`)
- **Port Configuration**: Server runs on port 5000, exposed on port 80
- **Static Assets**: Served from `dist/public` directory

### Database Management
- **Schema Migrations**: Drizzle Kit for schema management
- **Connection**: Environment-based DATABASE_URL configuration
- **Backup Strategy**: Managed by Neon Database provider

## Production WhatsApp Integration

To enable real WhatsApp message sending in production:

### Requirements
1. **Install WhatsApp Web.js**: `npm install whatsapp-web.js`
2. **Browser Support**: Deployment platform must support Puppeteer/Chromium
3. **Persistent Sessions**: File system access for WhatsApp session storage
4. **Server Resources**: Sufficient memory and CPU for browser automation

### Implementation Steps
1. Uncomment the real WhatsApp client code in `server/whatsapp.ts`
2. Replace demo mode with actual `whatsapp-web.js` implementation
3. Configure Puppeteer for your deployment environment
4. Set up session persistence for authentication

### Current Status
- **Demo Mode**: Messages logged to console for testing
- **Authentication Flow**: Complete UI/UX implementation ready
- **Database**: Configured for production message logging
- **Architecture**: Designed for real WhatsApp Web integration

## Changelog

```
Changelog:
- June 24, 2025. Initial setup with in-memory storage
- June 24, 2025. Added PostgreSQL database with persistent storage
- June 24, 2025. Integrated WhatsApp Web authentication and demo mode
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Deployment preference: Railway for production hosting with GitHub integration.
```