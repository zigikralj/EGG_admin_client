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
- **UI Components & Icons**: [Material UI (MUI)](https://mui.com/) + [@mui/icons-material](https://mui.com/material-ui/material-icons/) + [Emotion](https://emotion.sh/)
- **Data Visualization & Charts**: [@mui/x-charts](https://mui.com/x/react-charts/)
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

The application will be accessible at `http://localhost:5173`.

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

## 📂 Project Structure

```
client/
├── public/                  # Static assets & public files
├── src/
│   ├── assets/              # Logos and SVGs
│   ├── components/          # Reusable UI components & modals
│   │   ├── views/           # Primary page views (Dashboard, Projects, Invoices, etc.)
│   │   ├── AdminLayout.tsx  # Responsive shell, top app bar, and navigation drawer
│   │   ├── ProjectCard.tsx  # Project summary card with sampling & status controls
│   │   ├── ApproachingInvoicesPanel.tsx # Invoices due soon dashboard widget
│   │   ├── ReminderPanel.tsx            # Reminders dashboard widget
│   │   └── ...
│   ├── context/             # React contexts (AuthContext, LanguageContext, ThemeContext)
│   ├── i18n/                # Localization dictionaries (translations.ts)
│   ├── types.ts             # TypeScript definitions & data models
│   ├── App.tsx              # Root component & view router
│   └── main.tsx             # Application entry point
├── package.json             # Scripts & dependencies
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite bundler configuration
```

---

## ⚙️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server at `http://localhost:5173` |
| `npm run build` | Type-checks with `tsc` and creates optimized build in `dist/` |
| `npm run preview` | Serves the production build locally for verification |
| `npm run lint` | Runs `oxlint` fast linter on the codebase |

---

## 🔒 Security

For security best practices and vulnerability reporting guidelines, please refer to [SECURITY.md](SECURITY.md).