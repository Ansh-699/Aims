# Dashboard Application

A modern Next.js dashboard application with a clean, modular architecture focused on student attendance and quiz management.

## 🏗️ Project Architecture

This project follows a **component-driven architecture** with clear separation of concerns:

```
├── app/
│   ├── userdashboard/          # Main dashboard page
│   ├── api/                    # API routes (attendance, quiz, login)
│   └── types/                  # TypeScript type definitions
├── components/
│   ├── dashboard/              # Dashboard-specific components
│   ├── layout/                 # Layout and wrapper components
│   ├── navigation/             # Navigation components
│   ├── quiz/                   # Quiz-related components
│   └── ui/                     # Reusable UI components
├── hooks/                      # Custom React hooks
└── lib/                        # Utility functions
```

## 🚀 Features

- **Student Dashboard** - Comprehensive attendance tracking and course management
- **Interactive Quiz System** - Dynamic quiz loading and management
- **Responsive Design** - Mobile-first approach with desktop optimization
- **Performance Optimized** - Built with modern React patterns and Next.js optimizations
- **Type Safety** - Full TypeScript support throughout the application

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- bun, yarn, pbun, or bun

### Installation & Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Key Components

### Dashboard (`/userdashboard`)
- **Attendance Tracking** - View and manage student attendance records
- **Course Overview** - Display course-specific information
- **Quiz Management** - Interactive quiz system with real-time updates

### API Routes
- `/api/attendance` - Student attendance data
- `/api/all-attendance` - Comprehensive attendance records
- `/api/quiz` - Quiz data and management
- `/api/login` - Authentication endpoints

## 🧩 Architecture Highlights

### Custom Hooks
- `useAttendanceData` - Attendance data management with error handling
- `useTabNavigation` - Tab state and navigation logic
- `useStudentName` - Student information fetching and caching

### Component Organization
- **Modular Design** - Each component has a single, clear responsibility
- **Reusable Components** - Shared UI components across the application
- **Type Safety** - Comprehensive TypeScript interfaces and types

## 📚 Documentation

- [`REFACTORING_GUIDE.md`](./REFACTORING_GUIDE.md) - Detailed component structure and usage
- [`COMPLETE_REFACTORING_SUMMARY.md`](./COMPLETE_REFACTORING_SUMMARY.md) - Full refactoring process and results
- [`PERFORMANCE_OPTIMIZATIONS.md`](./PERFORMANCE_OPTIMIZATIONS.md) - Performance improvements and monitoring

## 🔧 Development

### Project Structure
The application follows modern React/Next.js best practices:
- **Component-driven architecture** for maintainability
- **Custom hooks** for state management and business logic
- **TypeScript** for type safety and better developer experience
- **Performance optimizations** with memoization and efficient data fetching

### Adding New Features
1. Create components in the appropriate `components/` subdirectory
2. Add custom hooks to `hooks/` for state management
3. Update type definitions in `app/types/`
4. Follow established patterns for consistency

## 🚀 Deployment

The application is optimized for deployment on Vercel, Netlify, or any Node.js hosting platform.

```bash
bun run build  # Creates optimized production build
bun start      # Starts production server
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
