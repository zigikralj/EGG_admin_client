# EkosGreenGroup Project Tracker

A professional project management application for EkosGreenGroup, built with React, TypeScript, and Vite.

## 🚀 Overview

EkosGreenGroup Project Tracker is a comprehensive platform for managing projects, tracking progress, and collaborating with your team. Key features include:

- **Project Management**: Create, update, and archive projects with detailed status tracking
- **Task Management**: Break down projects into manageable tasks with priorities, deadlines, and assignments
- **User Management**: Secure login/registration with role-based access control (Admin, Manager, Team Member)
- **Dashboard Analytics**: Visual overview of project progress, overdue tasks, and team member workload
- **Search & Filter**: Powerful search and filtering to quickly find projects and tasks
- **Responsive Design**: Modern, mobile-friendly interface

## 🛠️ Built With

- **Frontend**: [React](https://react.dev/) 19 + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: Built-in React hooks

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)

## 🚀 Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your API configuration:
   ```ini
   # API base URL
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

### Run Development Server

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Build for Production

Build the application for production:

```bash
npm run build
```

The production build will be created in the `dist/` directory.

### Run Production Build

Serve the production build:

```bash
npm run preview
```

## 📋 Local Development Setup

### Setting Up a Mock API with JSON Server

For local development without the backend, you can use **JSON Server** to mock the API:

1. Install JSON Server:
   ```bash
   npm install -g json-server
   ```

2. Start the mock API:
   ```bash
   json-server --watch db.json --port 8000
   ```

3. Configure your `.env` file for local development:
   ```ini
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Serve production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run format` | Format code using Prettier |

## 📂 Project Structure

```
client/
├── src/
│   ├── api/             # API configuration and services
│   ├── assets/          # Static assets
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts (e.g., AuthContext)
│   ├── hooks/           # Custom React hooks
│   ├── layouts/         # Page layouts (e.g., DashboardLayout)
│   ├── pages/           # Page components
│   ├── utils/           # Utility functions
│   └── App.tsx          # Main application component
├── public/              # Static files
├── .env                 # Environment variables
├── tailwind.config.js   # Tailwind CSS configuration
└── vite.config.ts       # Vite configuration
```

## 📝 Project Features

### User Authentication

- **Login**: Secure login with email and password
- **Registration**: Create new user accounts
- **Role-Based Access**: Different permissions for Admin, Manager, and Team Member
- **Session Management**: Automatic session persistence

### Project Dashboard

- **Overview**: At-a-glance view of project statistics
- **Filters**: Filter projects by status (Active, On Hold, Completed, Archived)
- **Search**: Quick search functionality
- **Sorting**: Sort projects by name, status, or priority

### Project Management

- **Create Project**: Add new projects with title, description, and status
- **Edit Project**: Update project details
- **Archive Project**: Move projects to archive when completed
- **View Details**: View all tasks associated with a project

### Task Management

- **Task List**: View all tasks for a project
- **Add Task**: Create new tasks with:
  - **Title**: Task name
  - **Priority**: High, Medium, Low
  - **Status**: Pending, In Progress, Completed
  - **Deadline**: Due date
  - **Assignee**: User responsible for the task
  - **Estimated Hours**: Time estimate
  - **Actual Hours**: Time spent
- **Edit Task**: Update task details
- **Delete Task**: Remove tasks

### User Roles

**Admin**:
- Full access to all features
- Can manage users, projects, and tasks

**Manager**:
- Can create and manage projects
- Can assign tasks to team members
- Can view all project data

**Team Member**:
- Can view assigned tasks
- Can update task status and hours
- Cannot delete or archive projects

## 📋 Development Tips

### Component Development

- Use functional components with TypeScript interfaces
- Keep components focused and reusable
- Follow the existing UI/UX patterns from Shadcn UI
- Use Tailwind classes for styling

### API Integration

- Use the `api/` directory for all API configurations
- Create separate service files for different resources
- Handle loading and error states properly

### Testing

- Create unit tests for complex components
- Test API integrations
- Ensure responsive design works on different devices

## 🚀 Deployment

### Prerequisites for Deployment

1. Ensure the backend API is accessible at the configured `VITE_API_BASE_URL`
2. Build the application for production:
   ```bash
   npm run build
   ```