# AI Development Rules for Contract Management System

## Tech Stack Overview

• **Frontend Framework**: React 18 with TypeScript for type-safe development
• **UI Components**: shadcn/ui library with Tailwind CSS for styling and responsive design
• **State Management**: React Context API with custom hooks for state management
• **Database**: Supabase PostgreSQL with @supabase/supabase-js client library
• **Charts & Data Visualization**: Recharts for interactive data visualization
• **Authentication**: Custom authentication context with Supabase integration
• **Build Tool**: Vite for fast development and optimized builds
• **Code Quality**: ESLint with TypeScript ESLint plugin for code linting

## Library Usage Rules

### UI & Styling
• **Primary UI Library**: Use shadcn/ui components exclusively for all UI elements
• **Styling**: Use Tailwind CSS classes for all styling - never use plain CSS files or inline styles
• **Icons**: Use Lucide React icons for all iconography needs
• **Responsive Design**: All components must be mobile-responsive using Tailwind's responsive utilities

### Data Management
• **Database Operations**: Use @supabase/supabase-js for all database interactions
• **API Calls**: Direct Supabase client usage preferred over custom API layers
• **Data Validation**: Validate data at both component and database levels
• **Mock Data**: Only use mock data for development/testing when Supabase is unavailable

### Authentication & Authorization
• **Auth System**: Use the existing AuthContext for all authentication needs
• **Permission Checking**: Always use hasPermission() or canAccessModule() for access control
• **Protected Routes**: Implement route protection through AuthContext loading states

### Components & Architecture
• **Component Structure**: Create new files for all components - no inline component definitions
• **Component Reusability**: Build components to be reusable across the application
• **Type Safety**: Define TypeScript interfaces for all props and state objects
• **Hooks**: Use custom hooks for reusable logic - place in src/hooks directory

### Charts & Reporting
• **Charting Library**: Use Recharts exclusively for all data visualization
• **Report Generation**: Generate HTML-based reports that can be printed or saved as PDF
• **Data Presentation**: Always format currency and dates using the provided utility functions

### Forms & User Input
• **Form Handling**: Implement controlled components for all form inputs
• **Form Validation**: Validate inputs both client-side and server-side
• **User Feedback**: Use toast notifications for all user action feedback

### Error Handling
• **Error Boundaries**: Implement error boundaries for graceful error handling
• **Error Messages**: Provide clear, user-friendly error messages
• **Logging**: Log errors appropriately for debugging purposes

### Performance & Optimization
• **Bundle Optimization**: Lazy load components when appropriate
• **Data Fetching**: Implement efficient data fetching patterns to minimize database calls
• **Caching**: Utilize Supabase's built-in caching mechanisms where applicable