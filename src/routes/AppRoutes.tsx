import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { PAGE_ROUTES } from '../constants';

// App 1: Project Tracker (7 dedicated pages)
const TrackerProjectsPage = React.lazy(() => import('../pages/project-tracker/TrackerProjectsPage'));
const TrackerUpdatesPage = React.lazy(() => import('../pages/project-tracker/TrackerUpdatesPage'));
const TrackerRemindersPage = React.lazy(() => import('../pages/project-tracker/TrackerRemindersPage'));
const TrackerInvoicesPage = React.lazy(() => import('../pages/project-tracker/TrackerInvoicesPage'));
const TrackerWasteDisposalPage = React.lazy(() => import('../pages/project-tracker/TrackerWasteDisposalPage'));
const TrackerProjectsStatsPage = React.lazy(() => import('../pages/project-tracker/TrackerProjectsStatsPage'));
const TrackerWasteStatsPage = React.lazy(() => import('../pages/project-tracker/TrackerWasteStatsPage'));

// App 2: Data Management (12 dedicated pages)
const ProjectsPage = React.lazy(() => import('../pages/data-management/ProjectsPage'));
const ClientsPage = React.lazy(() => import('../pages/data-management/ClientsPage'));
const PermitsPage = React.lazy(() => import('../pages/data-management/PermitsPage'));
const UsersPage = React.lazy(() => import('../pages/data-management/UsersPage'));
const ServicesPage = React.lazy(() => import('../pages/data-management/ServicesPage'));
const ProvidedServicesPage = React.lazy(() => import('../pages/data-management/ProvidedServicesPage'));
const CategoriesPage = React.lazy(() => import('../pages/data-management/CategoriesPage'));
const InvoicesPage = React.lazy(() => import('../pages/data-management/InvoicesPage'));
const RemindersPage = React.lazy(() => import('../pages/data-management/RemindersPage'));
const RolesPage = React.lazy(() => import('../pages/data-management/RolesPage'));
const ActivityLogsPage = React.lazy(() => import('../pages/data-management/ActivityLogsPage'));
const ActivityAnalyticsPage = React.lazy(() => import('../pages/data-management/ActivityAnalyticsPage'));

const RouteLoadingFallback: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
    <CircularProgress />
  </Box>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Project Tracker Navigation */}
        <Route path={PAGE_ROUTES.PROJECT_TRACKER} element={<Navigate to={PAGE_ROUTES.PROJECT_TRACKER_PROJECTS} replace />} />
        <Route path={PAGE_ROUTES.PROJECT_TRACKER_PROJECTS} element={<TrackerProjectsPage />} />
        <Route path={PAGE_ROUTES.PROJECT_TRACKER_UPDATES} element={<TrackerUpdatesPage />} />
        <Route path={PAGE_ROUTES.PROJECT_TRACKER_REMINDERS} element={<TrackerRemindersPage />} />
        <Route path={PAGE_ROUTES.PROJECT_TRACKER_INVOICES} element={<TrackerInvoicesPage />} />
        <Route path={PAGE_ROUTES.PROJECT_TRACKER_WASTE} element={<TrackerWasteDisposalPage />} />
        <Route path={PAGE_ROUTES.PROJECT_TRACKER_STATISTICS} element={<TrackerProjectsStatsPage />} />
        <Route path={PAGE_ROUTES.PROJECT_TRACKER_WASTE_STATISTICS} element={<TrackerWasteStatsPage />} />

        {/* Data Management Navigation */}
        <Route path={PAGE_ROUTES.DATA_MANAGEMENT_PREFIX} element={<Navigate to={PAGE_ROUTES.PROJECTS} replace />} />
        <Route path={PAGE_ROUTES.PROJECTS} element={<ProjectsPage />} />
        <Route path={PAGE_ROUTES.CLIENTS} element={<ClientsPage />} />
        <Route path={PAGE_ROUTES.PERMITS} element={<PermitsPage />} />
        <Route path={PAGE_ROUTES.USERS} element={<UsersPage />} />
        <Route path={PAGE_ROUTES.SERVICES} element={<ServicesPage />} />
        <Route path={PAGE_ROUTES.PROVIDED_SERVICES} element={<ProvidedServicesPage />} />
        <Route path={PAGE_ROUTES.CATEGORIES} element={<CategoriesPage />} />
        <Route path={PAGE_ROUTES.INVOICES} element={<InvoicesPage />} />
        <Route path={PAGE_ROUTES.REMINDERS} element={<RemindersPage />} />
        <Route path={PAGE_ROUTES.ROLES} element={<RolesPage />} />
        <Route path={PAGE_ROUTES.ACTIVITY_LOGS} element={<ActivityLogsPage />} />
        <Route path={PAGE_ROUTES.ACTIVITY_ANALYTICS} element={<ActivityAnalyticsPage />} />

        {/* Default Fallbacks */}
        <Route path="/" element={<Navigate to={PAGE_ROUTES.PROJECT_TRACKER_PROJECTS} replace />} />
        <Route path="*" element={<Navigate to={PAGE_ROUTES.PROJECT_TRACKER_PROJECTS} replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
