# EkosGreenGroup Project Tracker

A professional project management and invoicing application for **EkosGreenGroup**, built with React 19, TypeScript, Material UI (MUI), and Vite.

---

## 🚀 Overview

**EkosGreenGroup Project Tracker** is a comprehensive platform designed for project lifecycle management, environmental sampling schedules, invoicing, client relations, and team collaboration.

### Key Highlights:
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for **Administrator**, **Manager**, **Accountant**, and **User** (Team Member).
- **Interactive Dashboard**:
  - Combined overview with KPI statistics and analytical charts.
  - Role-tailored views: Standard dashboard for managers/team members and specialized invoice-centric dashboard for accountants.
  - Dedicated subtabs for Statistics, Reminders, Invoices, and Projects.
- **Invoicing & Billing**: Full invoice lifecycle (Draft, Sent, Paid, Overdue, Cancelled), multi-currency support (`RSD` and `EUR €`), line item calculations, due date monitoring, and project linking.
- **Sampling & Reminders**: Real-time tracking of approaching sampling dates and custom reminders with overdue alerts.
- **Projects & Services**: Categorized project tracking with progress meters, responsible person assignment, deadline alerts, and quick filters (e.g., Active, Missing Invoice, Stale, Late).
- **Multilingual Support (i18n)**: Instant switching between **English**, **Serbian Latin (sr-Latn)**, and **Serbian Cyrillic (sr-Cyrl)**.
- **Theme & Customization**: Sleek dark and light themes, configurable entity columns, and responsive mobile drawer navigation.

---

## 🛠️ Built With

- **Frontend Core**: [React](https://react.dev/) 19 + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **UI Components & Icons**: [Material UI (MUI v9)](https://mui.com/) + [@mui/icons-material](https://mui.com/material-ui/material-icons/) + [Emotion](https://emotion.sh/)
- **Data Visualization & Charts**: [@mui/x-charts](https://mui.com/x/react-charts/)
- **State & Data Fetching**: [TanStack React Query v5](https://tanstack.com/query)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Testing**: [Playwright](https://playwright.dev/) (End-to-End E2E) + [Vitest](https://vitest.dev/) (Unit / Integration) + [Testing Library](https://testing-library.com/)
- **Linting**: [Oxlint](https://oxc.rs/)

---

## 👥 User Roles & Permissions

| Role | Permissions & Features |
| :--- | :--- |
| **Administrator** | • Full system access and configuration.<br>• User management, role assignment, and pending registration approvals.<br>• Client, service, and category management.<br>• Full project and invoice management.<br>• Header **User Switch** switcher for quick identity testing.<br>• Toggle between **Manager mode** and **User view mode**. |
| **Manager** | • Project creation, assignment, and management.<br>• Access to clients, services, categories, and reminders.<br>• Invoice creation, management, and project linking.<br>• Toggle between **Manager mode** and **User view mode**. |
| **Accountant** | • Complete invoice management across all projects regardless of project responsible user.<br>• Custom default dashboard displaying the latest 15 projects and **Approaching Invoices** panel.<br>• Dedicated **Dashboard -> Invoices** subtab and Invoices page.<br>• Tailored quickfilters (**Active**, **Missing Invoice**). |
| **User (Team Member)** | • Personal project tracking and sampling updates.<br>• Personal reminders monitoring.<br>• Clean, distraction-free interface focused on assigned work. |

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

## 🚀 Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
cd client
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `client/` root:

```ini
# Backend API base URL
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3. Running Development Server

Start the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### 4. Production Build

Compile TypeScript and build the production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 🧪 Testing

### 1. End-to-End (E2E) Testing with Playwright

Playwright is used for full automated end-to-end browser testing against a local running client/server stack.

```bash
# Run all E2E tests headless
npm run test:e2e

# Run with interactive Playwright UI mode
npm run test:e2e:ui

# Debug tests step-by-step
npm run test:e2e:debug
```

#### E2E Test Suites (`client/e2e/`):
- **Authentication (`e2e/auth/login.spec.ts`)**: Tests valid login, invalid credentials with error alerts, and logout.
- **Global Auth Setup (`e2e/auth.setup.ts`)**: Automatically seeds authenticated session state into `playwright/.auth/user.json` so downstream suites bypass repeated UI logins.
- **Tracker Dashboard (`e2e/tracker/tracker.spec.ts`)**: Verifies dashboard KPI stats, project listing, and quick interactions.
- **Management Modules (`e2e/management/`)**:
  - `projects.spec.ts`: Full project lifecycle (list, create, edit, filter, archive/delete).
  - `clients.spec.ts`: Client CRUD operations and permit relations.
  - `invoices.spec.ts`: Invoice creation, status updates, and currency support.
  - `services.spec.ts`: Service types and custom data models.
  - `permits.spec.ts`: Environmental permit management and waste catalog associations.
  - `users.spec.ts`: User management, approvals, and role listings.
  - `categories.spec.ts`: Category management.
  - `reminders.spec.ts`: Reminder creation, completion, and overdue alerts.
  - `activity-logs.spec.ts`: Audit log generation and filtering.

### 2. Unit & Component Testing with Vitest

```bash
# Run unit tests
npm run test

# Run tests in Vitest UI
npm run test:ui

# Run test coverage report
npm run test:coverage
```

---

## 📂 Project Structure

```
client/
├── docs/                    # Architecture and AI reference documentation
│   ├── ARCHITECTURE.md      # Detailed system architecture
│   ├── AI_CONTEXT.md        # Fast AI context guide
│   └── API_REFERENCE.md     # API specifications
├── e2e/                     # Playwright End-to-End test suites
│   ├── auth.setup.ts        # Global auth session setup
│   ├── auth/                # Login & auth flow tests
│   ├── tracker/             # Dashboard & tracker flow tests
│   └── management/          # Management CRUD tests (projects, clients, invoices, etc.)
├── public/                  # Static assets & public files
├── src/
│   ├── assets/              # Logos and SVGs
│   ├── components/          # Reusable UI components & modals
│   ├── context/             # React contexts (AuthContext, LanguageContext, ThemeContext, NotificationContext)
│   ├── hooks/               # Custom hooks (useTableView, useProjectForm, etc.)
│   ├── i18n/                # Localization dictionaries (en, sr-Latn, sr-Cyrl)
│   ├── pages/               # Full page views (TrackerPage, ProjectsPage, InvoicesPage, etc.)
│   ├── queries/             # React Query hooks and mutations
│   ├── theme/               # Material UI theme definition
│   ├── types.ts             # TypeScript definitions & data models
│   ├── utils/               # Helper utilities
│   ├── App.tsx              # Root component & view router
│   └── main.tsx             # Application entry point
├── playwright.config.ts     # Playwright configuration
├── package.json             # Scripts & dependencies
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite bundler configuration
```

---

## ⚙️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server at `http://localhost:3000` |
| `npm run build` | Type-checks with `tsc` and creates optimized build in `dist/` |
| `npm run preview` | Serves the production build locally for verification |
| `npm run lint` | Runs `tsc -b` and `oxlint` fast linter on the codebase |
| `npm run test` | Runs unit & component tests with Vitest |
| `npm run test:ui` | Opens the interactive Vitest UI runner |
| `npm run test:coverage` | Generates unit test coverage report |
| `npm run test:e2e` | Runs all Playwright E2E tests in headless mode |
| `npm run test:e2e:ui` | Opens the interactive Playwright UI runner |
| `npm run test:e2e:debug` | Runs Playwright tests with step-by-step inspector |

---

## 🔒 Security

For security best practices and vulnerability reporting guidelines, please refer to [SECURITY.md](SECURITY.md).