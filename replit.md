# Aaishree Data Service Center - Daily Report Generator

## Overview
A fullstack TypeScript application designed for generating, saving, and managing daily business reports. **Login is now mandatory** for all website access. The application enables authenticated users to input services and expenses, generate formatted reports, and save/print them. It includes an admin authentication system with custom roles for managing reports and users. The project provides comprehensive business insights through advanced analytics, export options, and data management features.

## User Preferences
- Uses Indian Rupee (INR) currency format
- Date format: Indian locale
- Professional business-focused design (Material Design approach)

## System Architecture

### UI/UX Decisions
The application utilizes React with Vite, Tailwind CSS, and shadcn/ui components for a modern, responsive, and professional user interface. It supports both dark and light themes, with user preferences persisted. Key UI components include cards, buttons, inputs, dialogs, toast notifications, and various data visualization elements.

### Technical Implementations
- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui, Wouter (routing), TanStack Query.
- **Charts**: Recharts for interactive data visualizations (trend charts, pie charts, bar charts).
- **Theme**: `next-themes` for dark/light mode with persistence.
- **Backend**: Express.js with TypeScript.
- **Database**: MongoDB for storing reports, user data, and custom roles.
- **Authentication**: Passport.js with a local strategy. **Login is mandatory** for all website access except the login page.
- **Security**: Enhanced password security, rate limiting, Helmet.js for security headers, secure session management with persistent 24-hour sessions, and role-based permissions.
- **Export**: jsPDF and jsPDF-AutoTable for PDF generation, with additional CSV and JSON export options.

### Feature Specifications
- **Report Management**: Create, view, update, delete (admin only) reports. Includes report history, comparison, and favoriting.
- **Analytics**: Advanced analytics dashboard with revenue, expense, and profit trend charts, top services/expenses breakdown, and KPI cards.
- **Data Management**: Backup and restore functionality for reports and templates, comprehensive export options (PDF, CSV, JSON).
- **Templates**: Save and load frequently used service/expense templates.
- **Goals & Targets**: Set and track daily/weekly/monthly profit goals with visual progress indicators.
- **Custom Roles**: Admin can create custom roles with granular permissions for flexible access control.
- **Mandatory Login**: All pages require authentication; only /login is accessible without login.
- **Keyboard Shortcuts**: Integration of keyboard shortcuts for faster navigation and data entry.
- **Error Handling**: Proper error display for report loading failures with user-friendly messages.

### System Design Choices
The application is structured as a fullstack application with a clear separation between frontend and backend. The API follows RESTful principles. Database connectivity is designed to be graceful, allowing the application to run with limited features even if MongoDB is unavailable. Session management utilizes HttpOnly cookies and strong encryption for security. All API endpoints require authentication.

### Frontend Pages
- `/` - Home page (report creation form) - **requires login**
- `/about` - About This App page - **requires login**
- `/dashboard` - User dashboard (employees only - managers are redirected to admin) - **requires login**
- `/history` - Report history (view all saved reports) - **requires login**
- `/login` - Login page (public)
- `/admin` - Admin dashboard (admin and manager roles)
- `/admin/users` - User management with Roles tab (admin only)
- `/admin/activity` - Activity logs (admin and manager roles)

### Role-Based Access
- **Admin**: Full access to all pages including user management and custom role creation
- **Manager**: Access to admin dashboard and activity logs (no dashboard access - redirected to admin)
- **Employee**: Access to dashboard and report features
- **Custom Roles**: Admin can create custom roles with specific permissions (canViewReports, canCreateReports, canEditReports, canDeleteReports, canAccessAdmin, canManageUsers, canViewActivity, canExportReports, canBackupRestore)

### API Routes
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user session
- `POST /api/reports` - Create new report (requires auth)
- `GET /api/reports` - Get all reports (requires auth)
- `GET /api/reports/:id` - Get report by ID (requires auth)
- `PUT /api/reports/:id` - Update report (requires auth)
- `DELETE /api/reports/:id` - Delete report (admin only)
- `POST /api/users` - Create new user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/roles` - Get all roles (system + custom)
- `POST /api/roles` - Create custom role (admin only)
- `PUT /api/roles/:id` - Update custom role (admin only)
- `DELETE /api/roles/:id` - Delete custom role (admin only)
- `GET /api/roles/:roleId/permissions` - Get role permissions

## External Dependencies
- **MongoDB**: Database for storing reports and user accounts.
- **Passport.js**: Authentication middleware for Express.js.
- **Recharts**: JavaScript charting library for data visualization.
- **jsPDF & jsPDF-AutoTable**: Libraries for generating PDF reports.
- **Helmet.js**: Middleware for securing Express apps by setting various HTTP headers.
- **memorystore**: In-memory session store (for development).
- **bcrypt-style password hashing (scrypt)**: For secure password storage.