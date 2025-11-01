# SheetSathi - Collaborative Online Spreadsheet Platform

A modern, cloud-based spreadsheet application built for real-time collaboration. SheetSathi enables teams to create, edit, and share spreadsheets seamlessly with powerful features and an intuitive interface.

## 🚀 Features

### Core Spreadsheet Functionality
- **Grid-based Interface**: Traditional spreadsheet grid with rows and columns
- **Cell Editing**: Direct cell editing with real-time updates
- **Formula Support**: Built-in formula engine supporting:
  - Mathematical operations: SUM, AVERAGE, MIN, MAX
  - Logical functions: IF statements
  - Lookup functions: VLOOKUP
  - Statistical functions: COUNT, MEDIAN
  - Cell references (e.g., A1, B2)

### Collaboration Features
- **Real-time Sync**: Changes are instantly synced across all users
- **Permission Management**: 
  - Owner can share with view-only or edit permissions
  - User-based access control
  - Access code protection for shared sheets
- **Comments**: Add comments to individual cells for team communication
- **Activity Log**: Track who made what changes with full history
  - Shows username, action, and value changes
  - Timestamped entries for audit trail

### Data Management
- **Import/Export**: Support for CSV and XLSX file formats
- **Sorting**: Sort columns alphabetically or numerically
- **Undo/Redo**: Full history tracking with undo/redo functionality
- **Auto-save**: Automatic saving with manual save option
- **Notes**: Add notes to spreadsheets for documentation

### User Experience
- **Templates**: Pre-built templates for common use cases
- **Dashboard**: Quick access to recent and all spreadsheets
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Theme support for user preference
- **Keyboard Shortcuts**: Quick access to common functions

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern UI library with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **React Router**: Client-side routing

### Backend (Supabase)
- **PostgreSQL**: Relational database for data storage
- **Row Level Security (RLS)**: Secure data access policies
- **Real-time Subscriptions**: Live data updates
- **Authentication**: Email/password authentication

### Key Libraries
- **React Query**: Server state management
- **date-fns**: Date manipulation
- **Recharts**: Data visualization
- **Sonner**: Toast notifications
- **Lucide React**: Icon library

## 📋 How It Works

### Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │ ────▶│  React App   │ ────▶│  Supabase   │
│  (Client)   │◀──── │  (Frontend)  │◀──── │  (Backend)  │
└─────────────┘      └──────────────┘      └─────────────┘
```

### Database Schema

**Tables:**
- `spreadsheets`: Stores spreadsheet metadata (name, owner, permissions)
- `cells`: Individual cell data (row, column, value, formula)
- `comments`: Cell comments with user references
- `activity_log`: Change history with old/new values
- `spreadsheet_permissions`: User access permissions
- `profiles`: User profiles and display names

### Data Flow

1. **User Authentication**
   - Users sign up/login via email
   - Session managed by Supabase Auth
   - Profile created automatically on signup

2. **Spreadsheet Creation**
   - New spreadsheet record created in database
   - User becomes owner with full permissions
   - Empty grid initialized

3. **Cell Editing**
   - User types in cell → Local state updates
   - Formula evaluation happens client-side
   - Changes marked as pending
   - Manual save → Batch update to database
   - Activity log entry created with old/new values

4. **Real-time Sync**
   - Supabase real-time subscriptions on `cells` table
   - Changes from other users trigger local reload
   - All connected clients see updates instantly

5. **Sharing & Permissions**
   - Owner can share via email
   - Permission levels: view, edit
   - Optional access code for additional security
   - RLS policies enforce access control

6. **Comments System**
   - Comments linked to specific cells
   - Real-time updates when comments added
   - Visual indicator on cells with comments
   - Tooltip shows comments on hover

### Security Model

**Row Level Security (RLS) Policies:**
- Users can only view/edit spreadsheets they own or have permission to access
- Public spreadsheets are readable by all
- Templates are visible to everyone
- Comments only visible to users with spreadsheet access
- Activity logs follow spreadsheet permissions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Environment Variables

The application uses Supabase for backend services. Environment variables are auto-configured:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase anon key

## 📦 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components (shadcn)
│   ├── SpreadsheetGrid.tsx  # Main spreadsheet component
│   ├── ShareDialog.tsx      # Sharing interface
│   └── AccessCodeDialog.tsx # Access code verification
├── pages/              # Page components
│   ├── Landing.tsx     # Landing page
│   ├── Auth.tsx        # Authentication
│   ├── Dashboard.tsx   # User dashboard
│   ├── Sheet.tsx       # Spreadsheet editor
│   ├── AllSpreadsheets.tsx
│   └── Templates.tsx
├── lib/                # Utility functions
│   ├── formulaEngine.ts    # Formula parser/evaluator
│   ├── exportUtils.ts      # CSV/XLSX export
│   └── utils.ts           # Helper functions
├── integrations/       # Third-party integrations
│   └── supabase/       # Supabase client & types
└── hooks/              # Custom React hooks
```

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint code
npm run lint
```

### Adding New Features

1. **New Component**: Add to `src/components/`
2. **New Page**: Add to `src/pages/` and update router
3. **Database Changes**: Use Supabase migrations
4. **New Formula**: Extend `src/lib/formulaEngine.ts`

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

This creates optimized files in the `dist/` directory.

### Deployment Options

- **Vercel**: Connect your GitHub repo
- **Netlify**: Deploy via Git or drag-and-drop
- **Traditional Hosting**: Upload `dist/` folder
- **Docker**: Containerize the application

### Environment Setup

Ensure environment variables are configured in your hosting platform:
- Supabase URL and API keys
- Custom domain configuration (if applicable)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues and questions:
- Check existing GitHub issues
- Create a new issue with detailed description
- Include steps to reproduce bugs

## 🗺️ Roadmap

- [ ] Advanced charting and visualization
- [ ] Conditional formatting
- [ ] Data validation rules
- [ ] More formula functions
- [ ] Export to PDF
- [ ] API access
- [ ] Mobile apps
- [ ] Offline mode

---

Built with ❤️ using React, TypeScript, and Supabase
