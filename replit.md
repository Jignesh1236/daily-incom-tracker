# Aaishree Data Service Center - Daily Report Generator

## Overview
A fullstack TypeScript application for generating, saving, and managing daily business reports. The application allows users to input services and expenses, generate formatted reports, save and print them without login. Admin authentication is required only for admin features like deleting reports and user management.

## Project Structure
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui components
- **Backend**: Express.js + TypeScript
- **Database**: MongoDB (stores reports and admin users)
- **Authentication**: Passport.js with local strategy (username/password)

## Key Features
1. **Report Creation**: Enter services and expenses to generate daily reports
2. **Report History**: View, search, and manage all saved reports
3. **Print Functionality**: Professional print-ready format optimized for A4 paper
4. **Admin Dashboard**: Protected admin area for managing reports
5. **Authentication**: 
   - Admin login system (no registration)
   - Anyone can create, view, and save reports without login
   - Only authenticated admins can delete reports and manage users
   - Password protection for admin features
6. **Template Manager**: Save and load frequently used service/expense templates
7. **Advanced Analytics & Charts**:
   - Revenue vs Expenses trend charts
   - Profit analysis with daily/weekly/monthly views
   - Top services and expenses breakdown (pie charts)
   - Interactive visualizations using Recharts
   - Performance metrics and KPIs
8. **Dark/Light Theme**: User-selectable theme with persistent preference
9. **Export Options**:
   - CSV export for spreadsheet analysis
   - JSON export for data backup
   - PDF export with summary reports
   - Professional formatted exports
10. **Backup & Restore**:
    - Download complete data backups (reports + templates)
    - Restore from backup files
    - JSON format with versioning
11. **Enhanced Filtering & Search**:
    - Date range filtering
    - Profit/Loss filtering
    - Text search across reports
    - Sort by date, profit, or revenue
    - Real-time filter results
12. **Report Comparison**:
    - Compare two reports side-by-side
    - Visual difference indicators
    - Percentage change calculations
    - Summary analysis
13. **Goals & Targets Tracking**:
    - Set daily/weekly/monthly profit goals
    - Visual progress bars
    - Achievement notifications
    - Multiple goals management
14. **Expense Categories**:
    - Auto-categorize expenses
    - Pie chart visualization
    - Category-wise breakdown
    - Percentage distribution
15. **Favorite Reports**:
    - Mark reports as favorites
    - Quick access to important reports
    - Star/unstar functionality
16. **Quick Stats Dashboard**:
    - Today's profit at a glance
    - Week revenue summary
    - Average daily profit
    - Quick KPI cards on home page
17. **Keyboard Shortcuts**:
    - Ctrl+? for shortcuts help
    - Faster navigation
    - Productivity enhancements

## Architecture

### Frontend Pages
- `/` - Home page (report creation form)
- `/history` - Report history (view all saved reports)
- `/login` - Admin login/register page
- `/admin` - Admin dashboard (protected route)

### API Routes
- `POST /api/login` - Admin login
- `POST /api/logout` - Admin logout
- `GET /api/user` - Get current user session
- `POST /api/reports` - Create new report (no authentication required)
- `GET /api/reports` - Get all reports (no authentication required)
- `GET /api/reports/:id` - Get report by ID (no authentication required)
- `GET /api/reports/date/:date` - Get report by date (no authentication required)
- `PUT /api/reports/:id` - Update report (no authentication required)
- `DELETE /api/reports/:id` - Delete report (requires admin authentication)
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Database Collections
- `reports` - Daily business reports with services, expenses, and calculations
- `users` - Admin user accounts with encrypted passwords

## Recent Changes

### November 22, 2025 - Performance & Accessibility Improvements (Latest)
- ✅ **Component Performance Optimization**
  - Wrapped ReportDisplay component with React.memo() for improved re-render performance
  - Wrapped FavoriteReports component with React.memo() to prevent unnecessary re-renders
  - Wrapped QuickCalculator component with React.memo() for better performance
  - Optimized memoized components work especially well when parent components re-render frequently
- ✅ **Accessibility Enhancements**
  - Added aria-describedby attribute support to DialogContent component
  - Improved dialog accessibility for screen readers
  - Better semantic HTML for dialog-based forms
- ✅ **Code Quality**
  - Removed unnecessary "use client" directive from dialog.tsx (this is Vite, not Next.js)
  - Cleaned up component exports for better code consistency
  - Improved component structure and memoization patterns
- ✅ **Build Verification**
  - Verified production build completes successfully
  - All TypeScript types properly resolved
  - No compilation errors in optimized components

### November 22, 2025 - Print Layout & Quality Improvements
- ✅ **Optimized Print Layout - Single Page A4 Format**
  - Aggressively compressed to fit entire report on ONE A4 page
  - Reduced page margins from 8mm to 4mm-6mm for maximum space
  - Compressed table padding: 3px instead of 8px
  - Font sizes optimized: 9.5pt base, scales down for larger reports
  - Line height reduced from 1.4 to 1.1 for compact spacing
  - Signature area reduced to 10px height (still readable for signing)
  - Simplified signature labels ("Operator Sign", "Auth Sign")
  - Minimal footer with just timestamp and company name
  - All sections tightly spaced (print:space-y-1) with no wasted whitespace
- ✅ **Accessibility Enhancements**
  - Fixed Dialog component accessibility with proper aria-describedby attributes
  - Added descriptive aria-label attributes to all form inputs
  - Better semantic HTML structure for screen readers
- ✅ **Input Validation Improvements**
  - Enhanced number input validation for services and expenses
  - Real-time validation preventing negative values
  - Better handling of empty/invalid values
- ✅ **Performance Optimization**
  - Memoized ReportHeader component with React.memo()
  - Memoized ReportDisplay component for improved rendering
  - Optimized re-render performance for report operations

### November 15, 2025 - Public Access & No Registration
- ✅ **Removed Registration Feature**
  - Removed employee self-registration endpoint
  - Removed registration tab from login page
  - Login page now only shows admin login
- ✅ **Public Report Access**
  - Anyone can create, view, and save reports without login
  - No authentication required for report creation and viewing
  - Home page fully accessible without login
  - Admin features still protected (delete reports, user management)

### November 14, 2025 - Maximum Features Pack (Round 2)
- ✅ **Report Comparison Tool**
  - Side-by-side comparison of any two reports
  - Visual difference indicators (green/red)
  - Percentage change calculations
  - Automated summary analysis
- ✅ **Goals & Targets Tracking**
  - Set custom profit targets (daily/weekly/monthly)
  - Visual progress bars with percentage
  - Goal achievement celebrations
  - Multiple goals management
- ✅ **Expense Categories Analysis**
  - Smart expense categorization
  - Interactive pie charts
  - Category-wise breakdown
  - Automatic percentage distribution
- ✅ **Favorite Reports System**
  - Star/unstar important reports
  - LocalStorage-based favorites
  - Quick access to favorite reports
  - Visual favorite indicators
- ✅ **Quick Stats Dashboard**
  - Today's profit at a glance
  - Last 7 days revenue summary
  - Average daily profit (30 days)
  - Beautiful KPI cards on home page
- ✅ **Keyboard Shortcuts**
  - Ctrl+? for shortcuts help dialog
  - Faster navigation and data entry
  - Productivity enhancements

### November 14, 2025 - Enhanced Features & Analytics (Round 1)
- ✅ **Advanced Analytics Dashboard**
  - Interactive revenue & expense trend charts (Area Charts)
  - Profit trend analysis with Line Charts
  - Top expenses breakdown with Pie Charts
  - Top services revenue with Bar Charts
  - Weekly profit analysis with color-coded bars
  - Comprehensive KPI cards (total revenue, expenses, profit, average profit)
- ✅ **Theme Support**
  - Dark/Light mode toggle on all pages
  - Theme preference persistence in localStorage
  - Smooth theme transitions
  - System theme detection
- ✅ **Template Manager**
  - Save frequently used service/expense combinations
  - Load templates with one click
  - Edit and delete saved templates
  - LocalStorage-based template persistence
- ✅ **Backup & Restore System**
  - Export complete data (reports + templates) as JSON
  - Import backup files to restore data
  - Versioned backup format
  - Date-stamped backup filenames
- ✅ **Enhanced Export Features**
  - Added PDF export with detailed summary
  - CSV export for spreadsheet analysis
  - JSON export for data portability
  - Professional formatting in all exports
- ✅ **UI/UX Improvements**
  - Added theme toggle to all pages
  - Improved responsive design
  - Enhanced card animations and hover effects
  - Better loading states and error handling
  - Toggle-able analytics section to reduce clutter

### November 9, 2025 - Security Hardening
- ✅ **Enhanced Password Security**
  - Strong password requirements (min 8 chars, uppercase, lowercase, number, special char)
  - Username validation (alphanumeric + underscore only)
- ✅ **Rate Limiting Protection**
  - Login: Max 5 attempts per 15 minutes per IP
  - Account lockout: 30 minutes after 5 failed login attempts
  - Automatic unlocking after timeout period
- ✅ **Security Headers (Helmet.js)**
  - Content Security Policy (CSP)
  - XSS Protection
  - MIME type sniffing prevention
  - Clickjacking protection
- ✅ **Session Security**
  - Auto-generated session secrets if not configured
  - HttpOnly cookies (prevents XSS cookie theft)
  - SameSite=strict (CSRF protection)
  - Reduced session lifetime (24 hours vs 7 days)
  - Custom session cookie name (hides framework)
- ✅ **Account Protection**
  - Failed login attempt tracking
  - Temporary account lockout mechanism
  - Clear security error messages

### November 9, 2025 - Build & Database
- ✅ Made MongoDB connection graceful and optional
- ✅ App can start without MONGODB_URI (with limited features)
- ✅ Database connection failures show warnings instead of crashes
- ✅ Fixed build configuration (removed old index.html from root)
- ✅ Production build now works successfully
- ✅ API routes handle database unavailability with proper error messages

### November 8, 2025
- ✅ Added admin authentication system
- ✅ Created login/register pages
- ✅ Implemented protected routes for admin dashboard
- ✅ Added password requirement for deleting reports
- ✅ Updated UI to show admin/login buttons based on auth status
- ✅ Set up MongoDB connection for users and reports
- ✅ Configured authentication middleware with Passport.js

## Environment Variables
- `MONGODB_URI` - MongoDB connection string (optional - app runs with limited features if not set)
- `SESSION_SECRET` - Session encryption key (auto-generated if not provided)
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Server port (default: 5000)
- `ADMIN_USERNAME` - Default admin username (default: "admin")
- `ADMIN_PASSWORD` - Default admin password (default: "admin123")

## Development Workflow
- Run `npm run dev` to start the development server
- Frontend uses Vite HMR for fast development
- Backend serves both API routes and the Vite dev server
- All routes prefixed with `/api` are backend routes
- Everything else is handled by React Router (wouter)

## User Preferences
- Uses Indian Rupee (INR) currency format
- Date format: Indian locale
- Professional business-focused design (Material Design approach)

## Tech Stack Details
- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui, Wouter (routing), TanStack Query
- **Charts**: Recharts for interactive data visualizations
- **Theme**: next-themes for dark/light mode support
- **Backend**: Express, TypeScript, Passport.js, MongoDB driver
- **Database**: MongoDB with collections for reports and users
- **Session**: In-memory session store (memorystore) for development
- **Security**: bcrypt-style password hashing (scrypt), secure sessions
- **Export**: jsPDF + jsPDF-AutoTable for PDF generation

## Components Architecture
### Custom Components
- **ThemeProvider**: Global theme management with dark/light mode
- **ThemeToggle**: Theme switcher button component
- **TemplateManager**: Save/load report templates
- **EnhancedAnalytics**: Advanced data visualization with multiple chart types
- **BackupRestore**: Data backup and restore functionality
- **ReportDisplay**: Professional report rendering
- **AnalyticsCharts**: Monthly summary charts
- **ReportComparison**: Side-by-side report comparison tool
- **GoalsTracker**: Business goals and targets tracking
- **ExpenseCategories**: Smart expense categorization with charts
- **FavoriteReports**: Favorite/bookmark reports functionality
- **QuickStats**: Quick statistics dashboard
- **KeyboardShortcuts**: Keyboard shortcuts help dialog

### UI Components (shadcn/ui)
- Cards, Buttons, Inputs, Labels, Dialogs
- Alert Dialogs, Dropdowns, Selects
- Toast notifications, Progress bars
- Accordions, Tabs, Tooltips
