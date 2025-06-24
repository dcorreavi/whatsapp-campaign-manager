# WhatsApp Campaign Manager

A modern web application for managing WhatsApp marketing campaigns with contact management, message templating, and real-time progress tracking.

## Features

- **Campaign Management**: Create and manage WhatsApp marketing campaigns
- **Contact Import**: Upload CSV/Excel files with automatic phone number validation
- **Message Templates**: Customizable templates with variable substitution ({name})
- **WhatsApp Integration**: Real WhatsApp Web API integration (demo mode included)
- **Progress Tracking**: Real-time campaign progress monitoring
- **Database**: PostgreSQL with persistent storage

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tools**: Vite, esbuild
- **Deployment**: Railway, Replit

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Environment variables (see below)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd whatsapp-campaign-manager
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database connection string:
```
DATABASE_URL=postgresql://username:password@host:port/database
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Deployment

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Set the environment variable `DATABASE_URL` in Railway dashboard
3. Railway will automatically detect and build the project

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Set to "production" for production builds

## Usage

1. **Create Campaign**: Start by creating a new campaign
2. **Upload Contacts**: Upload CSV/Excel files with name and phone columns
3. **Create Message**: Write your message template using {name} for personalization
4. **Connect WhatsApp**: Authenticate with WhatsApp Web (demo mode available)
5. **Send Campaign**: Monitor real-time progress as messages are sent

## CSV Format

Your contact file should include these columns:
- `name` - Contact name
- `phone` or `number` - Phone number (international format preferred)

Example:
```csv
name,phone
John Doe,+1234567890
Jane Smith,+5734567890
```

## WhatsApp Integration

### Demo Mode (Current)
- Messages are logged to console for testing
- Complete authentication flow implemented
- Perfect for development and testing

### Production Mode
For real WhatsApp integration:
1. Install `whatsapp-web.js`
2. Deploy on platform supporting Puppeteer (Railway, VPS)
3. Uncomment real WhatsApp client code

### WhatsApp Business API (Recommended)
For enterprise use, integrate with official WhatsApp Business API for better reliability and compliance.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes

## Architecture

- **Frontend**: Single-page React application with Vite bundling
- **Backend**: Express.js REST API with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type safety
- **File Processing**: Support for CSV/Excel contact imports
- **Real-time Updates**: Polling-based progress tracking

## License

MIT License - see LICENSE file for details