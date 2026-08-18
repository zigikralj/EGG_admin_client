export type Language = 'en' | 'sr-Latn' | 'sr-Cyrl';

export interface TranslationKeys {
  // Brand & Header
  brandCompany: string;
  brandLocation: string;
  headerProjectTracker: string;
  adminRole: string;

  // Tabs
  tabDashboard: string;
  subTabDefault: string;
  subTabStatistic: string;
  subTabReminders: string;
  subTabProjects: string;
  tabProjects: string;
  tabClients: string;
  tabUsers: string;
  tabServices: string;
  tabCategories: string;
  tabReminders: string;

  // Dashboard Stats
  projectsStatistic: string;
  statInCreation: string;
  statDone: string;
  statStale: string;
  statOverdueUrgent: string;
  statMonitorSoon: string;
  chartProjectsByUser: string;
  chartProjectsByCategory: string;
  chartFilterAll: string;
  chartFilterActive: string;
  chartFilterDone: string;
  chartProjectsCount: string;
  unassignedUser: string;
  otherCategory: string;
  noDataForCharts: string;
  totalProjectsAnalyzed: string;
  chartCompletedProjectsTrend: string;
  chartCompletedProjectsSubtitle: string;
  axisCompletedProjects: string;
  totalCompletedInPeriod: string;
  chartModeCumulative: string;
  chartModeMonthly: string;

  // Projects View
  projectsInProgress: string;
  projectsCompleted: string;
  projectsListTitle: string;
  emptyProjects: string;
  searchPlaceholder: string;
  btnNewProject: string;
  btnShowAllProjects: string;
  activeProjects: string;
  emptyActiveProjects: string;
  emptyDoneProjects: string;
  emptyDashboardActive: string;
  approachingDeadlinesTitle: string;
  staleProjectsTitle: string;
  emptyApproachingDeadlines: string;
  emptyStaleProjects: string;

  // Project Card
  staleFlag: string;
  responsible: string;
  responsibleMale: string;
  responsibleFemale: string;
  responsibleOther: string;
  start: string;
  deadline: string;
  progress: string;
  btnMarkDone: string;
  btnReturnToProgress: string;
  btnSampled: string;
  btnEdit: string;
  btnDelete: string;
  samplingOverdue: string;
  samplingToday: string;
  samplingInDays: string;
  samplingShortOverdue: string;
  samplingShortToday: string;
  samplingShortInDays: string;

    // Reminders
    remindersTitle: string;
    remindersAllTitle: string;
    emptyReminders: string;
    lblReminderTitle: string;
    phReminderTitle: string;
    colTitle: string;
    colProject: string;
    colClient: string;
    colResponsible: string;
    colNextSample: string;
    colDeadlineStatus: string;
    colAction: string;
    btnNewReminder: string;
    modalNewReminder: string;
    modalEditReminder: string;
    lblStatus: string;
    lblNotes: string;
    lblDueDate: string;
    colStatus: string;
    colNotes: string;
    statusPending: string;
    statusInProgress: string;
    statusCompleted: string;
    statusOverdue: string;
    confirmDeleteReminder: string;
    alertProjectAndClientRequired: string;
    alertReminderTitleRequired: string;
    modalReminderDetails: string;
    btnDetails: string;
    btnClose: string;

  // Clients View
  btnNewClient: string;
  clientsListTitle: string;
  colClientName: string;
  colCity: string;
  colContactPerson: string;
  colEmail: string;
  colPhone: string;
  colProjectCount: string;
  colActions: string;
  emptyClients: string;

  // Client Modal
  modalNewClient: string;
  modalEditClient: string;
  lblClientCompany: string;
  phClientCompany: string;
  lblCity: string;
  phCity: string;
  lblContactPerson: string;
  phContactPerson: string;
  lblEmail: string;
  phEmail: string;
  lblPhone: string;
  phPhone: string;
  alertClientNameRequired: string;

  // Users View
  btnNewUser: string;
  usersListTitle: string;
  colFullName: string;
  colRole: string;
  colGender: string;
  emptyUsers: string;

  // User Modal
  modalNewUser: string;
  modalEditUser: string;
  lblFullName: string;
  phFullName: string;
  lblRole: string;
  lblGender: string;
  phGender: string;
  genderMale: string;
  genderFemale: string;
  genderOther: string;
  genderNotSpecified: string;
  alertUserNameRequired: string;

  // User Roles
  roleAdministrator: string;
  roleManager: string;
  roleUser: string;
  roleLeadEngineer: string;
  roleEnvironmentalInspector: string;
  roleChemicalAdvisor: string;
  roleOperator: string;

  // Active User & Permissions
  switchActiveUser: string;
  switchWorkOnEntities: string;
  lblEntityWorkModeOn: string;
  lblEntityWorkModeOff: string;
  permissionDeniedOnlyOwnProjects: string;
  permissionDeniedClients: string;
  permissionDeniedServices: string;
  permissionDeniedCategories: string;
  permissionDeniedUsers: string;
  readOnlyNotice: string;

  // Services View
  btnNewService: string;
  servicesListTitle: string;
  colCode: string;
  colServiceName: string;
  colCategory: string;
  colPeriodicSampling: string;
  emptyServices: string;
  freqNoReminder: string;
  freqQuarterly: string;
  freqSemiAnnually: string;
  freqEveryXMonths: string;

  // Service Modal
  modalNewService: string;
  modalEditService: string;
  lblServiceCode: string;
  phServiceCode: string;
  lblServiceName: string;
  phServiceName: string;
  lblCategoryGroup: string;
  lblFrequencyMonths: string;
  hintFrequencyZero: string;
  alertServiceRequired: string;

  // Service Groups
  groupWaste: string;
  groupLegal: string;
  groupTesting: string;
  groupAdvisory: string;
  groupStandards: string;

  // Project Modal
  modalNewProject: string;
  modalEditProject: string;
  lblProjectName: string;
  phProjectName: string;
  lblClient: string;
  phClient: string;
  lblResponsiblePerson: string;
  phResponsiblePerson: string;
  lblService: string;
  periodicReminderHint: string;
  reminderBoxTitle: string;
  btnAddReminder: string;
  btnLinkExistingReminder: string;
  btnCreateNewReminder: string;
  phSelectExistingReminder: string;
  noProjectReminders: string;
  btnLink: string;
  newProjectRemindersHint: string;
  lblNextSamplingDate: string;
  lblStartDate: string;
  lblDeadlineDate: string;
  lblProgressPct: string;
  btnCancel: string;
  btnSave: string;
  alertProjectValidation: string;

  // Common UI & Dialogs
  confirmDeleteTitle: string;
  confirmDeleteProject: string;
  confirmDeleteClient: string;
  confirmDeleteUser: string;
  confirmDeleteService: string;
  confirmDeleteCategory: string;
  confirmCompleteTitle: string;
  confirmCompleteProject: string;
  btnConfirm: string;
  errorSavingProject: string;
  hqLocation: string;
  other: string;
  btnBackToList: string;
  btnBackToProjects: string;
  btnBackToClients: string;
  btnBackToUsers: string;
  btnBackToServices: string;
  btnBackToCategories: string;
  btnCustomizeColumns: string;
  lblSelectColumns: string;
  menuProfile: string;
  menuPreferences: string;
  menuLogout: string;
  userProfileTitle: string;
  userPreferencesTitle: string;
  lblChangePassword: string;
  lblCurrentPassword: string;
  lblNewPassword: string;
  lblConfirmNewPassword: string;
  lblResetPassword: string;
  phCurrentPassword: string;
  phNewPassword: string;
  phConfirmNewPassword: string;
  phLeaveBlankToKeep: string;
  phInitialPassword: string;
  passwordMismatchError: string;
  passwordTooShortError: string;
  passwordUpdatedSuccess: string;
  currentPasswordIncorrectError: string;
  lblTableColumns: string;
  lblLanguage: string;
  lblTheme: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  btnFilters: string;
  lblFilterOptions: string;
  lblSortingOptions: string;
  lblFilteringOptions: string;
  lblSortBy: string;
  lblCreatedDate: string;
  sortAscending: string;
  sortDescending: string;
  lblMe: string;
  btnClearFilters: string;
  filterAll: string;
  quickFilterMyProjects: string;
  quickFilterMyReminders: string;
  quickFilterActive: string;
  quickFilterOverdue: string;
  quickFilterAll: string;
  lblProjectCountFilter: string;
  filterOpEquals: string;
  filterOpGreaterThan: string;
  filterOpLessThan: string;
  filterOpGte: string;
  filterOpLte: string;
  colDescription: string;
  lblDescription: string;
  phDescription: string;
  btnNewCategory: string;
  categoriesListTitle: string;
  emptyCategories: string;
  modalNewCategory: string;
  modalEditCategory: string;
  lblCategoryCode: string;
  phCategoryCode: string;
  lblCategoryName: string;
  phCategoryName: string;
  alertCategoryRequired: string;
  colCategoryName: string;

  // Auth & Registration
  loginTitle: string;
  loginSubtitle: string;
  tabLogin: string;
  tabRegister: string;
  lblEmailOrUsername: string;
  phEmailOrUsername: string;
  lblPassword: string;
  phPassword: string;
  lblConfirmPassword: string;
  phConfirmPassword: string;
  btnLogin: string;
  btnRegister: string;
  btnLoggingIn: string;
  btnRegistering: string;
  errInvalidCredentials: string;
  errPendingApproval: string;
  errAccountRejected: string;
  msgRegistrationSuccess: string;
  lblPendingApprovals: string;
  badgePendingUsers: string;
  msgPendingUsersBanner: string;
  menuPendingUsers: string;
  menuPendingUsersSub: string;
  btnApproveAndAssignRole: string;
  btnRejectRegistration: string;
  modalApproveUserTitle: string;
  modalApproveUserSubtitle: string;
  colApprovalStatus: string;
  statusApproved: string;
  statusBlocked: string;
  errAccountBlocked: string;
  confirmRejectTitle: string;
  confirmRejectMessage: string;
  msgApproveSuccess: string;
  msgRejectSuccess: string;
  lblAssignRole: string;
  lblSelectRole: string;
}

export const translations: Record<Language, TranslationKeys> = {
  en: {
    // Brand & Header
    brandCompany: 'Ekos Green Group',
    brandLocation: 'Kraljevo',
    headerProjectTracker: 'Project Tracker',
    adminRole: 'Administrator',

    // Tabs
    tabDashboard: 'Dashboard',
    subTabDefault: 'Default',
    subTabStatistic: 'Statistic',
    subTabReminders: 'Reminders',
    subTabProjects: 'Projects',
    tabProjects: 'Projects',
    tabClients: 'Clients',
    tabUsers: 'Users',
    tabServices: 'Services',
    tabCategories: 'Categories',
    tabReminders: 'Reminders',

    // Dashboard Stats
    projectsStatistic: 'Projects statistic',
    statInCreation: 'In Progress',
    statDone: 'Completed',
    statStale: 'Takes >2 mos.',
    statOverdueUrgent: 'Late - Urgent!',
    statMonitorSoon: 'Sampling Soon',
    chartProjectsByUser: 'Projects per User',
    chartProjectsByCategory: 'Projects per Category',
    chartFilterAll: 'All Projects',
    chartFilterActive: 'In Progress',
    chartFilterDone: 'Completed',
    chartProjectsCount: '{count} projects',
    unassignedUser: 'Unassigned',
    otherCategory: 'Other',
    noDataForCharts: 'No project data available to display diagrams.',
    totalProjectsAnalyzed: 'Total analyzed: {count}',
    chartCompletedProjectsTrend: 'Completed Projects Trend (Last 12 Months)',
    chartCompletedProjectsSubtitle: 'Completed projects over the last 12 months grouped by owner',
    axisCompletedProjects: 'Completed Projects',
    totalCompletedInPeriod: 'Total completed: {count}',
    chartModeCumulative: 'Cumulative',
    chartModeMonthly: 'Monthly',

    // Projects View
    projectsInProgress: 'Projects in Progress',
    projectsCompleted: 'Completed Projects',
    projectsListTitle: 'Project List',
    emptyProjects: 'No projects found.',
    searchPlaceholder: 'Search...',
    btnNewProject: 'New Project',
    btnShowAllProjects: 'View All Projects',
    activeProjects: 'Active Projects',
    emptyActiveProjects: 'No projects in progress. Add your first project using "New Project".',
    emptyDoneProjects: 'No completed projects yet.',
    emptyDashboardActive: 'No active projects currently in progress.',
    approachingDeadlinesTitle: 'Approaching Deadlines',
    staleProjectsTitle: 'Stale Projects (Starts > 2 Months Ago)',
    emptyApproachingDeadlines: 'No projects with approaching deadlines.',
    emptyStaleProjects: 'No projects older than 2 months.',

    // Project Card
    staleFlag: 'Takes > 2 months',
    responsible: 'Responsible',
    responsibleMale: 'Responsible',
    responsibleFemale: 'Responsible',
    responsibleOther: 'Responsible',
    start: 'Start',
    deadline: 'Deadline',
    progress: 'Progress',
    btnMarkDone: 'Completed',
    btnReturnToProgress: 'Reopen',
    btnSampled: 'Sampled',
    btnEdit: 'Edit',
    btnDelete: 'Delete',
    samplingOverdue: 'Sampling is overdue by {days} days',
    samplingToday: 'Sampling today',
    samplingInDays: 'Next sampling in {days} d. ({date})',
    samplingShortOverdue: 'Overdue {days} d.',
    samplingShortToday: 'Today',
    samplingShortInDays: 'In {days} d.',

    // Reminders
    remindersTitle: 'Approaching Reminders',
    remindersAllTitle: 'All Reminders',
    emptyReminders: 'No reminders found.',
    lblReminderTitle: 'Reminder Title',
    phReminderTitle: 'Enter reminder title...',
    colTitle: 'Title',
    colProject: 'Project',
    colClient: 'Client',
    colResponsible: 'Responsible Person',
    colNextSample: 'Next Sampling',
    colDeadlineStatus: 'Deadline Status',
    colAction: 'Action',
    btnNewReminder: 'New Reminder',
    modalNewReminder: 'New Reminder',
    modalEditReminder: 'Edit Reminder',
    lblStatus: 'Status',
    lblNotes: 'Notes',
    lblDueDate: 'Due Date',
    colStatus: 'Status',
    colNotes: 'Notes',
    statusPending: 'Pending',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    statusOverdue: 'Overdue',
    confirmDeleteReminder: 'Are you sure you want to delete this reminder?',
    alertProjectAndClientRequired: 'Project name and Client name are required.',
    alertReminderTitleRequired: 'Reminder title is required.',
    modalReminderDetails: 'Reminder Details',
    btnDetails: 'Details',
    btnClose: 'Close',

    // Clients View
    btnNewClient: 'New Client',
    clientsListTitle: 'Client List',
    colClientName: 'Client Name',
    colCity: 'City / HQ',
    colContactPerson: 'Contact Person',
    colEmail: 'Email',
    colPhone: 'Phone',
    colProjectCount: 'Projects',
    colActions: 'Actions',
    emptyClients: 'No clients found. Click "New Client" to add one.',

    // Client Modal
    modalNewClient: 'New Client',
    modalEditClient: 'Edit Client',
    lblClientCompany: 'Client / Company Name',
    phClientCompany: 'e.g. EcoRecycling Ltd.',
    lblCity: 'City / Headquarters',
    phCity: 'e.g. Kraljevo',
    lblContactPerson: 'Contact Person',
    phContactPerson: 'e.g. Marko Nikolić',
    lblEmail: 'Email',
    phEmail: 'office@client.com',
    lblPhone: 'Phone',
    phPhone: '+381 36 300 300',
    alertClientNameRequired: 'Client name is required.',

    // Users View
    btnNewUser: 'New User',
    usersListTitle: 'Users / Employees',
    colFullName: 'Full Name',
    colRole: 'Role / Position',
    colGender: 'Gender',
    emptyUsers: 'No registered users. Click "New User".',

    // User Modal
    modalNewUser: 'New User',
    modalEditUser: 'Edit User',
    lblFullName: 'Full Name',
    phFullName: 'e.g. Aleksandar Stanković',
    lblRole: 'Role / Position',
    lblGender: 'Gender',
    phGender: 'Select gender',
    genderMale: 'Male',
    genderFemale: 'Female',
    genderOther: 'Other',
    genderNotSpecified: 'Not specified',
    alertUserNameRequired: 'User full name is required.',

    // User Roles
    roleAdministrator: 'Administrator',
    roleManager: 'Manager',
    roleUser: 'User',
    roleLeadEngineer: 'Lead Engineer',
    roleEnvironmentalInspector: 'Environmental Inspector',
    roleChemicalAdvisor: 'Chemical Advisor',
    roleOperator: 'Operator',

    // Active User & Permissions
    switchActiveUser: 'Switch Active Account',
    switchWorkOnEntities: 'Manager mode',
    lblEntityWorkModeOn: 'Work on Entities (ON)',
    lblEntityWorkModeOff: 'User View',
    permissionDeniedOnlyOwnProjects: 'Standard Users can only edit or delete their own assigned projects.',
    permissionDeniedClients: 'Only Administrators and Managers can create or manage clients.',
    permissionDeniedServices: 'Only Administrators and Managers can create or manage services.',
    permissionDeniedCategories: 'Only Administrators and Managers can create or manage categories.',
    permissionDeniedUsers: 'Only Administrators and Managers can manage users.',
    readOnlyNotice: 'Read-only access mode',

    // Services View
    btnNewService: 'New Service',
    servicesListTitle: 'Services List',
    colCode: 'Code (ID)',
    colServiceName: 'Service Name',
    colCategory: 'Category',
    colPeriodicSampling: 'Periodic Sampling',
    emptyServices: 'No services added.',
    freqNoReminder: 'No reminder',
    freqQuarterly: 'Quarterly (every 3 mos.)',
    freqSemiAnnually: 'Semi-annually (every 6 mos.)',
    freqEveryXMonths: 'Every {freq} months',

    // Service Modal
    modalNewService: 'New Service',
    modalEditService: 'Edit Service',
    lblServiceCode: 'Service Code (slug)',
    phServiceCode: 'e.g. noise-testing',
    lblServiceName: 'Service Name',
    phServiceName: 'e.g. Environmental noise emission measurement',
    lblCategoryGroup: 'Category / Group',
    lblFrequencyMonths: 'Reminder Frequency (months)',
    hintFrequencyZero: '0 = non-periodic service',
    alertServiceRequired: 'Code and service name are required.',

    // Service Groups
    groupWaste: 'Waste Management',
    groupLegal: 'Legal / Impact Assessments',
    groupTesting: 'Testing & Measurements',
    groupAdvisory: 'Advisory Services',
    groupStandards: 'Standards & Certification',

    // Project Modal
    modalNewProject: 'New Project',
    modalEditProject: 'Edit Project',
    lblProjectName: 'Project Name',
    phProjectName: 'e.g. Waste Management Plan – Vrnjačka Banja Municipality',
    lblClient: 'Client',
    phClient: 'e.g. Vrnjačka Banja Municipality',
    lblResponsiblePerson: 'Responsible Person',
    phResponsiblePerson: 'e.g. Aleksandar Stanković',
    lblService: 'Service',
    periodicReminderHint: 'Periodic reminder (every {freq} months).',
    reminderBoxTitle: 'Project Reminders',
    btnAddReminder: 'Add Reminder',
    btnLinkExistingReminder: 'Link Existing Reminder',
    btnCreateNewReminder: 'Create New Reminder',
    phSelectExistingReminder: 'Search and select existing reminder...',
    noProjectReminders: 'No reminders for this project yet.',
    btnLink: 'Link',
    newProjectRemindersHint: 'You can add and manage reminders after saving the project.',
    lblNextSamplingDate: 'Next Sampling Date',
    lblStartDate: 'Start Date',
    lblDeadlineDate: 'Deadline',
    lblProgressPct: 'Progress (%)',
    btnCancel: 'Cancel',
    btnSave: 'Save',
    alertProjectValidation: 'Please enter a project name and select or enter a client.',

    // Common UI & Dialogs
    confirmDeleteTitle: 'Confirm Deletion',
    confirmDeleteProject: 'Are you sure you want to delete this project?',
    confirmDeleteClient: 'Are you sure you want to delete this client?',
    confirmDeleteUser: 'Are you sure you want to delete this user?',
    confirmDeleteService: 'Are you sure you want to delete this service?',
    confirmDeleteCategory: 'Are you sure you want to delete this category?',
    confirmCompleteTitle: 'Confirm Completion',
    confirmCompleteProject: 'Are you sure you want to mark this project as completed?',
    btnConfirm: 'Confirm',
    errorSavingProject: 'Error saving project',
    hqLocation: 'Headquarters',
    other: 'Other',
    btnBackToList: 'Back to List',
    btnBackToProjects: 'Back to Projects',
    btnBackToClients: 'Back to Clients',
    btnBackToUsers: 'Back to Users',
    btnBackToServices: 'Back to Services',
    btnBackToCategories: 'Back to Categories',
    btnCustomizeColumns: 'Columns',
    lblSelectColumns: 'Select Visible Columns',
    menuProfile: 'Profile',
    menuPreferences: 'Preferences',
    menuLogout: 'Log Out',
    userProfileTitle: 'User Profile',
    userPreferencesTitle: 'Preferences',
    lblTableColumns: 'Table Columns',
    lblLanguage: 'Language',
    lblTheme: 'Appearance Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    btnFilters: 'Filter & Sorting',
    lblFilterOptions: 'Filter Options',
    lblSortingOptions: 'Sorting options',
    lblFilteringOptions: 'Filtering options',
    lblSortBy: 'Sort by',
    lblCreatedDate: 'Created Date',
    sortAscending: 'Ascending',
    sortDescending: 'Descending',
    lblMe: 'Me',
    btnClearFilters: 'Clear Filters',
    filterAll: 'All',
    quickFilterMyProjects: 'My Projects',
    quickFilterMyReminders: 'My Reminders',
    quickFilterActive: 'Active',
    quickFilterOverdue: 'Late - Urgent',
    quickFilterAll: 'All',
    lblProjectCountFilter: 'Project Count',
    filterOpEquals: 'Equals (=)',
    filterOpGreaterThan: 'Greater than (>)',
    filterOpLessThan: 'Less than (<)',
    filterOpGte: 'Greater or equal (≥)',
    filterOpLte: 'Less or equal (≤)',
    colDescription: 'Description',
    lblDescription: 'Description',
    phDescription: 'Enter service description...',
    btnNewCategory: 'New Category',
    categoriesListTitle: 'Category List',
    emptyCategories: 'No categories found.',
    modalNewCategory: 'New Category',
    modalEditCategory: 'Edit Category',
    lblCategoryCode: 'Category Code (slug)',
    phCategoryCode: 'e.g. grp-waste',
    lblCategoryName: 'Category Name',
    phCategoryName: 'e.g. Waste Management',
    alertCategoryRequired: 'Code and category name are required.',
    colCategoryName: 'Category Name',

    // Auth & Registration
    loginTitle: 'Sign In to Ekos Tracker',
    loginSubtitle: 'Welcome back! Please sign in to access your account.',
    tabLogin: 'Sign In',
    tabRegister: 'Register',
    lblEmailOrUsername: 'Email or Full Name',
    phEmailOrUsername: 'Enter your email or full name',
    lblPassword: 'Password',
    phPassword: 'Enter password',
    lblConfirmPassword: 'Confirm Password',
    phConfirmPassword: 'Re-enter password',
    btnLogin: 'Sign In',
    btnRegister: 'Create Account',
    btnLoggingIn: 'Signing in...',
    btnRegistering: 'Submitting registration...',
    errInvalidCredentials: 'Invalid email/username or password.',
    errPendingApproval: 'Your account is pending manager approval. Please wait for a manager to approve your registration and assign your role.',
    errAccountRejected: 'Your registration request was not approved.',
    errAccountBlocked: 'Contact administrator for more information.',
    msgRegistrationSuccess: 'Registration submitted successfully! A manager must approve your account and assign your role before you can sign in.',
    lblPendingApprovals: 'Pending Approvals',
    badgePendingUsers: '{count} Pending',
    msgPendingUsersBanner: '{count} user registration request(s) awaiting manager approval and role assignment.',
    menuPendingUsers: '{count} Pending User(s)',
    menuPendingUsersSub: 'Review registration requests',
    btnApproveAndAssignRole: 'Approve & Assign Role',
    btnRejectRegistration: 'Reject Registration',
    modalApproveUserTitle: 'Approve User & Assign Role',
    modalApproveUserSubtitle: 'Select a role to assign to {name} before approving their account.',
    colApprovalStatus: 'Approval Status',
    statusApproved: 'Approved',
    statusBlocked: 'Blocked',
    confirmRejectTitle: 'Reject Registration Request',
    confirmRejectMessage: 'Are you sure you want to reject the registration request for {name}? This will remove the account request.',
    msgApproveSuccess: 'User account approved successfully!',
    msgRejectSuccess: 'Registration request rejected.',
    lblAssignRole: 'Assigned Role',
    lblSelectRole: 'Select Role',
    lblChangePassword: 'Change Password',
    lblCurrentPassword: 'Current Password',
    lblNewPassword: 'New Password',
    lblConfirmNewPassword: 'Confirm New Password',
    lblResetPassword: 'Reset / Set Password',
    phCurrentPassword: 'Enter current password',
    phNewPassword: 'Enter new password',
    phConfirmNewPassword: 'Re-enter new password',
    phLeaveBlankToKeep: 'Leave blank to keep existing password',
    phInitialPassword: 'Initial password (default: password123)',
    passwordMismatchError: 'New passwords do not match.',
    passwordTooShortError: 'Password must be at least 4 characters long.',
    passwordUpdatedSuccess: 'Password updated successfully!',
    currentPasswordIncorrectError: 'Current password is incorrect.',
  },

  'sr-Latn': {
    // Brand & Header
    brandCompany: 'Ekos Green Group',
    brandLocation: 'Kraljevo',
    headerProjectTracker: 'Praćenje projekata',
    adminRole: 'Administrator',

    // Tabs
    tabDashboard: 'Početna',
    subTabDefault: 'Podrazumevano',
    subTabStatistic: 'Statistika',
    subTabReminders: 'Podsetnici',
    subTabProjects: 'Projekti',
    tabProjects: 'Projekti',
    tabClients: 'Klijenti',
    tabUsers: 'Korisnici',
    tabServices: 'Usluge',
    tabCategories: 'Kategorije',
    tabReminders: 'Podsetnici',

    // Dashboard Stats
    projectsStatistic: 'Statistika projekata',
    statInCreation: 'U izradi',
    statDone: 'Završeno',
    statStale: 'Traje >2mes.',
    statOverdueUrgent: 'Kasni - Hitno!',
    statMonitorSoon: 'Uzorkovanje uskoro',
    chartProjectsByUser: 'Projekti po korisniku',
    chartProjectsByCategory: 'Projekti po kategoriji',
    chartFilterAll: 'Svi projekti',
    chartFilterActive: 'U izradi',
    chartFilterDone: 'Završeni',
    chartProjectsCount: '{count} projekata',
    unassignedUser: 'Nedodeljeno',
    otherCategory: 'Ostalo',
    noDataForCharts: 'Nema podataka o projektima za prikaz dijagrama.',
    totalProjectsAnalyzed: 'Ukupno analizirano: {count}',
    chartCompletedProjectsTrend: 'Trend završenih projekata (Poslednjih 12 meseci)',
    chartCompletedProjectsSubtitle: 'Završeni projekti u poslednjih 12 meseci po vlasniku',
    axisCompletedProjects: 'Završeni projekti',
    totalCompletedInPeriod: 'Ukupno završeno: {count}',
    chartModeCumulative: 'Kumulativno',
    chartModeMonthly: 'Mesečno',

    // Projects View
    projectsInProgress: 'Projekti u izradi',
    projectsCompleted: 'Završeni projekti',
    projectsListTitle: 'Lista projekata',
    emptyProjects: 'Nema pronađenih projekata.',
    searchPlaceholder: 'Pretraga...',
    btnNewProject: 'Novi projekat',
    btnShowAllProjects: 'Prikaži sve projekte',
    activeProjects: 'Aktivni projekti',
    emptyActiveProjects: 'Nema projekata u izradi. Dodaj prvi projekat dugmetom „Novi projekat".',
    emptyDoneProjects: 'Još uvek nema završenih projekata.',
    emptyDashboardActive: 'Nema aktivnih projekata u izradi.',
    approachingDeadlinesTitle: 'Rokovi koji se bliže',
    staleProjectsTitle: 'Traje > 2 meseca',
    emptyApproachingDeadlines: 'Nema projekata sa rokovima koji se bliže.',
    emptyStaleProjects: 'Nema projekata starijih od 2 meseca.',

    // Project Card
    staleFlag: 'Traje > 2 meseca',
    responsible: 'Odgovoran',
    responsibleMale: 'Odgovoran',
    responsibleFemale: 'Odgovorna',
    responsibleOther: 'Odgovorno',
    start: 'Početak',
    deadline: 'Rok',
    progress: 'Napredak',
    btnMarkDone: 'Završeno',
    btnReturnToProgress: 'Vrati u izradu',
    btnSampled: 'Uzorkovano',
    btnEdit: 'Izmeni',
    btnDelete: 'Obriši',
    samplingOverdue: 'Uzorkovanje kasni {days} dana',
    samplingToday: 'Uzorkovanje danas',
    samplingInDays: 'Sledeće uzorkovanje za {days} d. ({date})',
    samplingShortOverdue: 'Kasni {days} d.',
    samplingShortToday: 'Danas',
    samplingShortInDays: 'Za {days} d.',

    // Reminders
    remindersTitle: 'Predstojeći podsetnici',
    remindersAllTitle: 'Svi podsetnici',
    emptyReminders: 'Nema pronađenih podsetnika.',
    lblReminderTitle: 'Naziv podsetnika',
    phReminderTitle: 'Unesite naziv podsetnika...',
    colTitle: 'Naziv',
    colProject: 'Projekat',
    colClient: 'Klijent',
    colResponsible: 'Odgovorna osoba',
    colNextSample: 'Sledeće uzorkovanje',
    colDeadlineStatus: 'Status roka',
    colAction: 'Akcija',
    btnNewReminder: 'Novi podsetnik',
    modalNewReminder: 'Novi podsetnik',
    modalEditReminder: 'Izmeni podsetnik',
    lblStatus: 'Status',
    lblNotes: 'Napomene',
    lblDueDate: 'Rok / Datum',
    colStatus: 'Status',
    colNotes: 'Napomene',
    statusPending: 'Na čekanju',
    statusInProgress: 'U toku',
    statusCompleted: 'Završeno',
    statusOverdue: 'Prekoračeno',
    confirmDeleteReminder: 'Da li ste sigurni da želite da obrišete ovaj podsetnik?',
    alertProjectAndClientRequired: 'Naziv projekta i klijenta su obavezni.',
    alertReminderTitleRequired: 'Naziv podsetnika je obavezan.',
    modalReminderDetails: 'Detalji podsetnika',
    btnDetails: 'Detalji',
    btnClose: 'Zatvori',

    // Clients View
    btnNewClient: 'Novi klijent',
    clientsListTitle: 'Lista klijenata',
    colClientName: 'Naziv klijenta',
    colCity: 'Grad / Sedište',
    colContactPerson: 'Kontakt osoba',
    colEmail: 'E-pošta',
    colPhone: 'Telefon',
    colProjectCount: 'Broj projekata',
    colActions: 'Akcije',
    emptyClients: 'Nema unetih klijenata. Kliknite na "Novi klijent" za dodavanje.',

    // Client Modal
    modalNewClient: 'Novi klijent',
    modalEditClient: 'Izmeni klijenta',
    lblClientCompany: 'Naziv klijenta / Kompanije',
    phClientCompany: 'npr. EkoReciklaža d.o.o.',
    lblCity: 'Grad / Sedište',
    phCity: 'npr. Kraljevo',
    lblContactPerson: 'Kontakt osoba',
    phContactPerson: 'npr. Marko Nikolić',
    lblEmail: 'E-pošta',
    phEmail: 'office@klijent.rs',
    lblPhone: 'Telefon',
    phPhone: '+381 36 300 300',
    alertClientNameRequired: 'Naziv klijenta je obavezan.',

    // Users View
    btnNewUser: 'Novi korisnik',
    usersListTitle: 'Korisnici / Zaposleni',
    colFullName: 'Ime i prezime',
    colRole: 'Uloga / Pozicija',
    colGender: 'Pol',
    emptyUsers: 'Nema registrovanih korisnika. Kliknite na "Novi korisnik".',

    // User Modal
    modalNewUser: 'Novi korisnik',
    modalEditUser: 'Izmeni korisnika',
    lblFullName: 'Ime i prezime',
    phFullName: 'npr. Aleksandar Stanković',
    lblRole: 'Uloga / Funkcija',
    lblGender: 'Pol',
    phGender: 'Izaberite pol',
    genderMale: 'Muški',
    genderFemale: 'Ženski',
    genderOther: 'Drugo',
    genderNotSpecified: 'Nije navedeno',
    alertUserNameRequired: 'Ime i prezime korisnika je obavezno.',

    // User Roles
    roleAdministrator: 'Administrator',
    roleManager: 'Menadžer',
    roleUser: 'Korisnik',
    roleLeadEngineer: 'Vodeći inženjer',
    roleEnvironmentalInspector: 'Inspektor za zaštitu',
    roleChemicalAdvisor: 'Savetnik za hemikalije',
    roleOperator: 'Operativac',

    // Active User & Permissions
    switchActiveUser: 'Promeni aktivni nalog',
    switchWorkOnEntities: 'Menadžerski režim',
    lblEntityWorkModeOn: 'Rad sa entitetima (UKLJUČENO)',
    lblEntityWorkModeOff: 'Korisnički prikaz',
    permissionDeniedOnlyOwnProjects: 'Obični korisnici mogu menjati ili brisati samo svoje projekte.',
    permissionDeniedClients: 'Samo Administratori i Menadžeri mogu upravljati klijentima.',
    permissionDeniedServices: 'Samo Administratori i Menadžeri mogu upravljati uslugama.',
    permissionDeniedCategories: 'Samo Administratori i Menadžeri mogu upravljati kategorijama.',
    permissionDeniedUsers: 'Samo Administratori i Menadžeri mogu upravljati korisnicima.',
    readOnlyNotice: 'Režim samo za čitanje',

    // Services View
    btnNewService: 'Nova usluga',
    servicesListTitle: 'Lista usluga',
    colCode: 'Šifra (ID)',
    colServiceName: 'Naziv usluge',
    colCategory: 'Kategorija',
    colPeriodicSampling: 'Periodično uzorkovanje',
    emptyServices: 'Nema unetih usluga.',
    freqNoReminder: 'Bez podsetnika',
    freqQuarterly: 'Kvartalno (na 3 meseca)',
    freqSemiAnnually: 'Polugodišnje (na 6 meseci)',
    freqEveryXMonths: 'Na svakih {freq} meseci',

    // Service Modal
    modalNewService: 'Nova usluga',
    modalEditService: 'Izmeni uslugu',
    lblServiceCode: 'Šifra usluge (slug)',
    phServiceCode: 'npr. ispitivanje-buke',
    lblServiceName: 'Naziv usluge',
    phServiceName: 'npr. Merenje emisije buke u životnoj sredini',
    lblCategoryGroup: 'Kategorija / Grupa',
    lblFrequencyMonths: 'Učestalost podsetnika (meseci)',
    hintFrequencyZero: '0 = nije periodična usluga',
    alertServiceRequired: 'Šifra i naziv usluge su obavezni.',

    // Service Groups
    groupWaste: 'Upravljanje otpadom',
    groupLegal: 'Pravno / Procene',
    groupTesting: 'Ispitivanja / Merenja',
    groupAdvisory: 'Savetodavne usluge',
    groupStandards: 'Standardi i sertifikacija',

    // Project Modal
    modalNewProject: 'Novi projekat',
    modalEditProject: 'Izmeni projekat',
    lblProjectName: 'Naziv projekta',
    phProjectName: 'npr. Plan upravljanja otpadom – opština Vrnjačka Banja',
    lblClient: 'Klijent',
    phClient: 'npr. Opština Vrnjačka Banja',
    lblResponsiblePerson: 'Odgovorna osoba',
    phResponsiblePerson: 'npr. Aleksandar Stanković',
    lblService: 'Usluga',
    periodicReminderHint: 'Periodični podsetnik (na svakih {freq} meseci).',
    reminderBoxTitle: 'Podsetnici projekta',
    btnAddReminder: 'Dodaj podsetnik',
    btnLinkExistingReminder: 'Poveži postojeći podsetnik',
    btnCreateNewReminder: 'Kreiraj novi podsetnik',
    phSelectExistingReminder: 'Pretraži i izaberi postojeći podsetnik...',
    noProjectReminders: 'Nema podsetnika za ovaj projekat.',
    btnLink: 'Poveži',
    newProjectRemindersHint: 'Podsetnike možete dodavati i uređivati nakon čuvanja projekta.',
    lblNextSamplingDate: 'Sledeći datum uzorkovanja',
    lblStartDate: 'Datum početka',
    lblDeadlineDate: 'Rok',
    lblProgressPct: 'Napredak (%)',
    btnCancel: 'Otkaži',
    btnSave: 'Sačuvaj',
    alertProjectValidation: 'Molimo unesite naziv projekta i izaberite klijenta.',

    // Common UI & Dialogs
    confirmDeleteTitle: 'Potvrda brisanja',
    confirmDeleteProject: 'Obrisati ovaj projekat?',
    confirmDeleteClient: 'Obrisati ovog klijenta?',
    confirmDeleteUser: 'Obrisati ovog korisnika?',
    confirmDeleteService: 'Obrisati ovu uslugu?',
    confirmDeleteCategory: 'Obrisati ovu kategoriju?',
    confirmCompleteTitle: 'Potvrda završetka',
    confirmCompleteProject: 'Da li ste sigurni da želite da označite projekat kao završen?',
    btnConfirm: 'Potvrdi',
    errorSavingProject: 'Greška pri čuvanju projekta',
    hqLocation: 'Sedište',
    other: 'Ostalo',
    btnBackToList: 'Nazad na listu',
    btnBackToProjects: 'Nazad na projekte',
    btnBackToClients: 'Nazad na klijente',
    btnBackToUsers: 'Nazad na korisnike',
    btnBackToServices: 'Nazad na usluge',
    btnBackToCategories: 'Nazad na kategorije',
    btnCustomizeColumns: 'Kolone',
    lblSelectColumns: 'Izaberi vidljive kolone',
    menuProfile: 'Profil',
    menuPreferences: 'Podešavanja',
    menuLogout: 'Odjavi se',
    userProfileTitle: 'Korisnički profil',
    userPreferencesTitle: 'Podešavanja',
    lblTableColumns: 'Kolone tabela',
    lblLanguage: 'Jezik',
    lblTheme: 'Tema izgleda',
    themeLight: 'Svetla',
    themeDark: 'Tamna',
    themeSystem: 'Sistemska',
    btnFilters: 'Filteri i sortiranje',
    lblFilterOptions: 'Opcije filtriranja',
    lblSortingOptions: 'Opcije sortiranja',
    lblFilteringOptions: 'Opcije filtriranja',
    lblSortBy: 'Sortiraj po',
    lblCreatedDate: 'Datum kreiranja',
    sortAscending: 'Rastuće',
    sortDescending: 'Opadajuće',
    lblMe: 'Ja',
    btnClearFilters: 'Očisti filtere',
    filterAll: 'Sve',
    quickFilterMyProjects: 'Moji projekti',
    quickFilterMyReminders: 'Moji podsetnici',
    quickFilterActive: 'Aktivni',
    quickFilterOverdue: 'Kasni - Hitno',
    quickFilterAll: 'Svi',
    lblProjectCountFilter: 'Broj projekata',
    filterOpEquals: 'Jednako (=)',
    filterOpGreaterThan: 'Veće od (>)',
    filterOpLessThan: 'Manje od (<)',
    filterOpGte: 'Veće ili jednako (≥)',
    filterOpLte: 'Manje ili jednako (≤)',
    colDescription: 'Opis',
    lblDescription: 'Opis',
    phDescription: 'Unesite opis usluge...',
    btnNewCategory: 'Nova kategorija',
    categoriesListTitle: 'Lista kategorija',
    emptyCategories: 'Nema unetih kategorija.',
    modalNewCategory: 'Nova kategorija',
    modalEditCategory: 'Izmeni kategoriju',
    lblCategoryCode: 'Šifra kategorije (slug)',
    phCategoryCode: 'npr. grp-otpad',
    lblCategoryName: 'Naziv kategorije',
    phCategoryName: 'npr. Upravljanje otpadom',
    alertCategoryRequired: 'Šifra i naziv kategorije su obavezni.',
    colCategoryName: 'Naziv kategorije',

    // Auth & Registration
    loginTitle: 'Prijava na Ekos Tracker',
    loginSubtitle: 'Dobrodošli nazad! Prijavite se za pristup vašem nalogu.',
    tabLogin: 'Prijava',
    tabRegister: 'Registracija',
    lblEmailOrUsername: 'Email ili Ime i prezime',
    phEmailOrUsername: 'Unesite email ili korisničko ime',
    lblPassword: 'Lozinka',
    phPassword: 'Unesite lozinku',
    lblConfirmPassword: 'Potvrda lozinke',
    phConfirmPassword: 'Ponovo unesite lozinku',
    btnLogin: 'Prijavi se',
    btnRegister: 'Kreiraj nalog',
    btnLoggingIn: 'Prijavljivanje...',
    btnRegistering: 'Slanje registracije...',
    errInvalidCredentials: 'Neispravan email/korisničko ime ili lozinka.',
    errPendingApproval: 'Vaš nalog čeka odobrenje menadžera. Molimo sačekajte da menadžer odobri vašu registraciju i dodeli vam ulogu.',
    errAccountRejected: 'Vaš zahtev za registraciju nije odobren.',
    errAccountBlocked: 'Kontaktirajte administratora za više informacija.',
    msgRegistrationSuccess: 'Registracija je uspešno poslata! Menadžer mora odobriti vaš nalog i dodeliti vam ulogu pre nego što se možete prijaviti.',
    lblPendingApprovals: 'Zahtevi na čekanju',
    badgePendingUsers: '{count} na čekanju',
    msgPendingUsersBanner: '{count} zahtev(a) za registraciju korisnika čeka odobrenje menadžera i dodelu uloge.',
    menuPendingUsers: '{count} korisnik(a) na čekanju',
    menuPendingUsersSub: 'Pregledajte zahteve za registraciju',
    btnApproveAndAssignRole: 'Odobri i dodeli ulogu',
    btnRejectRegistration: 'Odbij registraciju',
    modalApproveUserTitle: 'Odobri korisnika i dodeli ulogu',
    modalApproveUserSubtitle: 'Izaberite ulogu koju želite dodeliti korisniku {name} pre odobravanja naloga.',
    colApprovalStatus: 'Status odobrenja',
    statusApproved: 'Odobren',
    statusBlocked: 'Blokiran',
    confirmRejectTitle: 'Odbijanje zahteva za registraciju',
    confirmRejectMessage: 'Da li ste sigurni da želite da odbijete zahtev za registraciju za korisnika {name}? Nalog će biti uklonjen.',
    msgApproveSuccess: 'Korisnički nalog je uspešno odobren!',
    msgRejectSuccess: 'Zahtev za registraciju je odbijen.',
    lblAssignRole: 'Dodeljena uloga',
    lblSelectRole: 'Izaberite ulogu',
    lblChangePassword: 'Promeni lozinku',
    lblCurrentPassword: 'Trenutna lozinka',
    lblNewPassword: 'Nova lozinka',
    lblConfirmNewPassword: 'Potvrdi novu lozinku',
    lblResetPassword: 'Reset / Postavi lozinku',
    phCurrentPassword: 'Unesite trenutnu lozinku',
    phNewPassword: 'Unesite novu lozinku',
    phConfirmNewPassword: 'Ponovo unesite novu lozinku',
    phLeaveBlankToKeep: 'Ostavite prazno ako ne menjate lozinku',
    phInitialPassword: 'Početna lozinka (podrazumevano: password123)',
    passwordMismatchError: 'Nove lozinke se ne poklapaju.',
    passwordTooShortError: 'Lozinka mora imati najmanje 4 karaktera.',
    passwordUpdatedSuccess: 'Lozinka je uspešno promenjena!',
    currentPasswordIncorrectError: 'Trenutna lozinka nije tačna.',
  },

  'sr-Cyrl': {
    // Brand & Header
    brandCompany: 'Екос Грин Груп',
    brandLocation: 'Краљево',
    headerProjectTracker: 'Праћење пројеката',
    adminRole: 'Администратор',

    // Tabs
    tabDashboard: 'Почетна',
    subTabDefault: 'Подразумевано',
    subTabStatistic: 'Статистика',
    subTabReminders: 'Подсетници',
    subTabProjects: 'Пројекти',
    tabProjects: 'Пројекти',
    tabClients: 'Клијенти',
    tabUsers: 'Корисници',
    tabServices: 'Услуге',
    tabCategories: 'Категорије',
    tabReminders: 'Подсетници',

    // Dashboard Stats
    projectsStatistic: 'Statistika пројеката',
    statInCreation: 'У изради',
    statDone: 'Завршено',
    statStale: 'Траје >2мес.',
    statOverdueUrgent: 'Касни - Хитно!',
    statMonitorSoon: 'Узорковање ускоро',
    chartProjectsByUser: 'Пројекти по кориснику',
    chartProjectsByCategory: 'Пројекти по категорији',
    chartFilterAll: 'Сви пројекти',
    chartFilterActive: 'У изради',
    chartFilterDone: 'Завршени',
    chartProjectsCount: '{count} пројеката',
    unassignedUser: 'Недодељено',
    otherCategory: 'Остало',
    noDataForCharts: 'Нема података о пројектима за приказ дијаграма.',
    totalProjectsAnalyzed: 'Укупно анализирано: {count}',
    chartCompletedProjectsTrend: 'Тренд завршених пројеката (Последњих 12 месеци)',
    chartCompletedProjectsSubtitle: 'Завршени пројекти у последњих 12 месеци по власнику',
    axisCompletedProjects: 'Завршени пројекти',
    totalCompletedInPeriod: 'Укупно завршено: {count}',
    chartModeCumulative: 'Кумулативно',
    chartModeMonthly: 'Месечно',

    // Projects View
    projectsInProgress: 'Пројекти у изради',
    projectsCompleted: 'Завршени пројекти',
    projectsListTitle: 'Листа пројеката',
    emptyProjects: 'Нема пронађених пројеката.',
    searchPlaceholder: 'Претрага...',
    btnNewProject: 'Нови пројекат',
    btnShowAllProjects: 'Прикажи све пројекте',
    activeProjects: 'Активни пројекти',
    emptyActiveProjects: 'Нема пројеката у изради. Додај први пројекат дугметом „Нови пројекат".',
    emptyDoneProjects: 'Још увек нема завршених пројеката.',
    emptyDashboardActive: 'Нема активних пројеката у изради.',
    approachingDeadlinesTitle: 'Рокови који се ближе',
    staleProjectsTitle: 'Траје > 2 месеца',
    emptyApproachingDeadlines: 'Нема пројеката са роковима који се ближе.',
    emptyStaleProjects: 'Нема пројеката старијих од 2 месеца.',

    // Project Card
    staleFlag: 'Траје > 2 месеца',
    responsible: 'Одговоран',
    responsibleMale: 'Одговоран',
    responsibleFemale: 'Одговорна',
    responsibleOther: 'Одговорно',
    start: 'Почетак',
    deadline: 'Рок',
    progress: 'Напредак',
    btnMarkDone: 'Завршено',
    btnReturnToProgress: 'Врати у израду',
    btnSampled: 'Узорковано',
    btnEdit: 'Измени',
    btnDelete: 'Обриши',
    samplingOverdue: 'Узорковање касни {days} дана',
    samplingToday: 'Узорковање данас',
    samplingInDays: 'Следеће узорковање за {days} д. ({date})',
    samplingShortOverdue: 'Касни {days} д.',
    samplingShortToday: 'Данас',
    samplingShortInDays: 'За {days} д.',

    // Reminders
    remindersTitle: 'Предстојећи подсетници',
    remindersAllTitle: 'Сви подсетници',
    emptyReminders: 'Нема пронађених подсетника.',
    lblReminderTitle: 'Назив подсетника',
    phReminderTitle: 'Унесите назив подсетника...',
    colTitle: 'Назив',
    colProject: 'Пројекат',
    colClient: 'Клијент',
    colResponsible: 'Одговорна особа',
    colNextSample: 'Следеће узорковање',
    colDeadlineStatus: 'Статус рока',
    colAction: 'Акција',
    btnNewReminder: 'Нови подсетник',
    modalNewReminder: 'Нови подсетник',
    modalEditReminder: 'Измени подсетник',
    lblStatus: 'Статус',
    lblNotes: 'Напомене',
    lblDueDate: 'Рок / Датум',
    colStatus: 'Статус',
    colNotes: 'Напомене',
    statusPending: 'На чекању',
    statusInProgress: 'У току',
    statusCompleted: 'Завршено',
    statusOverdue: 'Прекорачено',
    confirmDeleteReminder: 'Да ли сте сигурни да желите да обришете овај подсетник?',
    alertProjectAndClientRequired: 'Назив пројекта и клијента су обавезни.',
    alertReminderTitleRequired: 'Назив подсетника је обавезан.',
    modalReminderDetails: 'Детаљи подсетника',
    btnDetails: 'Детаљи',
    btnClose: 'Затвори',

    // Clients View
    btnNewClient: 'Нови клијент',
    clientsListTitle: 'Листа клијената',
    colClientName: 'Назив клијента',
    colCity: 'Град / Седиште',
    colContactPerson: 'Контакт особа',
    colEmail: 'Е-пошта',
    colPhone: 'Телефон',
    colProjectCount: 'Број пројеката',
    colActions: 'Акције',
    emptyClients: 'Нема унетих клијената. Кликните на "Нови клијент" за додавање.',

    // Client Modal
    modalNewClient: 'Нови клијент',
    modalEditClient: 'Измени клијента',
    lblClientCompany: 'Назив клијента / Компаније',
    phClientCompany: 'нпр. ЕкоРециклажа д.о.о.',
    lblCity: 'Град / Седиште',
    phCity: 'нпр. Краљево',
    lblContactPerson: 'Контакт особа',
    phContactPerson: 'нпр. Марко Николић',
    lblEmail: 'Е-пошта',
    phEmail: 'office@klijent.rs',
    lblPhone: 'Телефон',
    phPhone: '+381 36 300 300',
    alertClientNameRequired: 'Назив клијента је обавезан.',

    // Users View
    btnNewUser: 'Нови корисник',
    usersListTitle: 'Корисници / Запослени',
    colFullName: 'Име и презиме',
    colRole: 'Улога / Позиција',
    colGender: 'Пол',
    emptyUsers: 'Нема регистрованих корисника. Кликните на "Нови корисник".',

    // User Modal
    modalNewUser: 'Нови корисник',
    modalEditUser: 'Измени корисника',
    lblFullName: 'Име и презиме',
    phFullName: 'нпр. Александар Станковић',
    lblRole: 'Улога / Функција',
    lblGender: 'Пол',
    phGender: 'Изаберите пол',
    genderMale: 'Мушки',
    genderFemale: 'Женски',
    genderOther: 'Друго',
    genderNotSpecified: 'Није наведено',
    alertUserNameRequired: 'Име и презиме корисника је обавезно.',

    // User Roles
    roleAdministrator: 'Администратор',
    roleManager: 'Менаџер',
    roleUser: 'Корисник',
    roleLeadEngineer: 'Водећи инжењер',
    roleEnvironmentalInspector: 'Инспектор за заштиту',
    roleChemicalAdvisor: 'Саветник за хемикалије',
    roleOperator: 'Оперативац',

    // Active User & Permissions
    switchActiveUser: 'Промени активни налог',
    switchWorkOnEntities: 'Менаџерски режим',
    lblEntityWorkModeOn: 'Рад са ентитетима (УКЉУЧЕНО)',
    lblEntityWorkModeOff: 'Кориснички приказ',
    permissionDeniedOnlyOwnProjects: 'Обични корисници могу мењати или брисати само своје пројекте.',
    permissionDeniedClients: 'Само Администратори и Менаџери могу управљати клијентима.',
    permissionDeniedServices: 'Само Администратори и Менаџери могу управљати услугама.',
    permissionDeniedCategories: 'Само Администратори и Менаџери могу управљати категоријама.',
    permissionDeniedUsers: 'Само Администратори и Менаџери могу управљати корисницима.',
    readOnlyNotice: 'Режим само за читање',

    // Services View
    btnNewService: 'Нова услуга',
    servicesListTitle: 'Листа услуга',
    colCode: 'Шифра (ID)',
    colServiceName: 'Назив услуге',
    colCategory: 'Категорија',
    colPeriodicSampling: 'Периодично узорковање',
    emptyServices: 'Нема унетих услуга.',
    freqNoReminder: 'Без подсетника',
    freqQuarterly: 'Квартално (на 3 месеца)',
    freqSemiAnnually: 'Полугодишње (на 6 месеци)',
    freqEveryXMonths: 'На сваких {freq} месеци',

    // Service Modal
    modalNewService: 'Нова услуга',
    modalEditService: 'Измени услугу',
    lblServiceCode: 'Шифра услуге (slug)',
    phServiceCode: 'нпр. ispitivanje-buke',
    lblServiceName: 'Назив услуге',
    phServiceName: 'нпр. Мерење емисије буке у животној средини',
    lblCategoryGroup: 'Категорија / Група',
    lblFrequencyMonths: 'Учесталост подсетника (месеци)',
    hintFrequencyZero: '0 = није периодична услуга',
    alertServiceRequired: 'Шифра и назив услуге су обавезни.',

    // Service Groups
    groupWaste: 'Управљање отпадом',
    groupLegal: 'Правно / Процене',
    groupTesting: 'Испитивања / Мерења',
    groupAdvisory: 'Саветодавне услуге',
    groupStandards: 'Стандарди и сертификација',

    // Project Modal
    modalNewProject: 'Нови пројекат',
    modalEditProject: 'Измени пројекат',
    lblProjectName: 'Назив пројекта',
    phProjectName: 'нпр. План управљања отпадом – општина Врњачка Бања',
    lblClient: 'Клијент',
    phClient: 'нпр. Општина Врњачка Бања',
    lblResponsiblePerson: 'Одговорна особа',
    phResponsiblePerson: 'нпр. Александар Станковић',
    lblService: 'Услуга',
    periodicReminderHint: 'Периодични подсетник (на сваких {freq} месеци).',
    reminderBoxTitle: 'Подсетници пројекта',
    btnAddReminder: 'Додај подсетник',
    btnLinkExistingReminder: 'Повежи постојећи подсетник',
    btnCreateNewReminder: 'Креирај нови подсетник',
    phSelectExistingReminder: 'Претражи и изабери постојећи подсетник...',
    noProjectReminders: 'Нема подсетника за овај пројекат.',
    btnLink: 'Повежи',
    newProjectRemindersHint: 'Подсетнике можете додавати и уређивати након чувања пројекта.',
    lblNextSamplingDate: 'Следећи датум узорковања',
    lblStartDate: 'Датум почетка',
    lblDeadlineDate: 'Рок',
    lblProgressPct: 'Напредак (%)',
    btnCancel: 'Откажи',
    btnSave: 'Сачувај',
    alertProjectValidation: 'Молимо унесите назив пројекта и изаберите клијента.',

    // Common UI & Dialogs
    confirmDeleteTitle: 'Потврда брисања',
    confirmDeleteProject: 'Обрисати овај пројекат?',
    confirmDeleteClient: 'Обрисати овог клијента?',
    confirmDeleteUser: 'Обрисати овог корисника?',
    confirmDeleteService: 'Обрисати ову услугу?',
    confirmDeleteCategory: 'Обрисати ову категорију?',
    confirmCompleteTitle: 'Потврда завршетка',
    confirmCompleteProject: 'Да ли сте сигурни да желите да означите пројекат као завршен?',
    btnConfirm: 'Потврди',
    errorSavingProject: 'Грешка при чувању пројекта',
    hqLocation: 'Седиште',
    other: 'Остало',
    btnBackToList: 'Назад на листу',
    btnBackToProjects: 'Назад на пројекте',
    btnBackToClients: 'Назад на клијенте',
    btnBackToUsers: 'Назад на кориснике',
    btnBackToServices: 'Назад на услуге',
    btnBackToCategories: 'Назад на категорије',
    btnCustomizeColumns: 'Колоне',
    lblSelectColumns: 'Изабери видљиве колоне',
    menuProfile: 'Профил',
    menuPreferences: 'Подешавања',
    menuLogout: 'Одјави се',
    userProfileTitle: 'Кориснички профил',
    userPreferencesTitle: 'Подешавања',
    lblTableColumns: 'Колоне табела',
    lblLanguage: 'Језик',
    lblTheme: 'Тема изгледа',
    themeLight: 'Светла',
    themeDark: 'Тамна',
    themeSystem: 'Системска',
    btnFilters: 'Филтери и сортирање',
    lblFilterOptions: 'Опције филтрирања',
    lblSortingOptions: 'Опције сортирања',
    lblFilteringOptions: 'Опције филтрирања',
    lblSortBy: 'Сортирај по',
    lblCreatedDate: 'Датум креирања',
    sortAscending: 'Растуће',
    sortDescending: 'Опадајуће',
    lblMe: 'Ја',
    btnClearFilters: 'Очисти филтере',
    filterAll: 'Све',
    quickFilterMyProjects: 'Моји пројекти',
    quickFilterMyReminders: 'Моји подсетници',
    quickFilterActive: 'Активни',
    quickFilterOverdue: 'Касни - Хитно',
    quickFilterAll: 'Сви',
    lblProjectCountFilter: 'Број пројеката',
    filterOpEquals: 'Једнако (=)',
    filterOpGreaterThan: 'Веће од (>)',
    filterOpLessThan: 'Мање од (<)',
    filterOpGte: 'Веће или једнако (≥)',
    filterOpLte: 'Мање или једнако (≤)',
    colDescription: 'Опис',
    lblDescription: 'Опис',
    phDescription: 'Унесите опис услуге...',
    btnNewCategory: 'Нова категорија',
    categoriesListTitle: 'Листа категорија',
    emptyCategories: 'Нема унетих категорија.',
    modalNewCategory: 'Нова категорија',
    modalEditCategory: 'Измени категорију',
    lblCategoryCode: 'Шифра категорије (slug)',
    phCategoryCode: 'нпр. grp-otpad',
    lblCategoryName: 'Назив категорије',
    phCategoryName: 'нпр. Управљање отпадом',
    alertCategoryRequired: 'Шифра и назив категорије су обавезни.',
    colCategoryName: 'Назив категорије',

    // Auth & Registration
    loginTitle: 'Пријава на Екос Тракер',
    loginSubtitle: 'Добродошли назад! Пријавите се за приступ вашем налогу.',
    tabLogin: 'Пријава',
    tabRegister: 'Регистрација',
    lblEmailOrUsername: 'Емаил или Име и презиме',
    phEmailOrUsername: 'Унесите емаил или корисничко име',
    lblPassword: 'Лозинка',
    phPassword: 'Унесите лозинку',
    lblConfirmPassword: 'Потврда лозинке',
    phConfirmPassword: 'Поново унесите лозинку',
    btnLogin: 'Пријави се',
    btnRegister: 'Креирај налог',
    btnLoggingIn: 'Пријављивање...',
    btnRegistering: 'Слање регистрације...',
    errInvalidCredentials: 'Неисправан емаил/корисничко име или лозинка.',
    errPendingApproval: 'Ваш налог чека одобрење менаџера. Молимо сачекајте да менаџер одобри вашу регистрацију и додели вам улогу.',
    errAccountRejected: 'Ваш захтев за регистрацију није одобрен.',
    errAccountBlocked: 'Контактирајте администратора за више информација.',
    msgRegistrationSuccess: 'Регистрација је успешно послата! Менаџер мора одобрити ваш налог и доделити вам улогu пре него што се можете пријавити.',
    lblPendingApprovals: 'Захтеви на чекању',
    badgePendingUsers: '{count} на чекању',
    msgPendingUsersBanner: '{count} захтев(а) за регистрацију корисника чека одобрење менаџера и доделу улоге.',
    menuPendingUsers: '{count} корисник(а) на чекању',
    menuPendingUsersSub: 'Прегледајте захтеве за регистрацију',
    btnApproveAndAssignRole: 'Одобри и додели улогу',
    btnRejectRegistration: 'Одбиј регистрацију',
    modalApproveUserTitle: 'Одобри корисника и додели улогу',
    modalApproveUserSubtitle: 'Изаберите улогу коју желите доделити кориснику {name} пре одобравања налога.',
    colApprovalStatus: 'Статус одобрења',
    statusApproved: 'Одобрен',
    statusBlocked: 'Блокиран',
    confirmRejectTitle: 'Одбијање захтева за регистрацију',
    confirmRejectMessage: 'Да ли сте сигурни да желите да одбијете захтев за регистрацију за корисника {name}? Налог ће бити уклоњен.',
    msgApproveSuccess: 'Кориснички налог је успешно одобрен!',
    msgRejectSuccess: 'Захтев за регистрацију је одбијен.',
    lblAssignRole: 'Додељена улога',
    lblSelectRole: 'Изаберите улогу',
    lblChangePassword: 'Промени лозинку',
    lblCurrentPassword: 'Тренутна лозинка',
    lblNewPassword: 'Нова лозинка',
    lblConfirmNewPassword: 'Потврди нову лозинку',
    lblResetPassword: 'Ресетуј / Постави лозинку',
    phCurrentPassword: 'Унесите тренутну лозинку',
    phNewPassword: 'Унесите нову лозинку',
    phConfirmNewPassword: 'Поново унесите нову лозинку',
    phLeaveBlankToKeep: 'Оставите празно ако не мењате лозинку',
    phInitialPassword: 'Почетна лозинка (подразумевано: password123)',
    passwordMismatchError: 'Нове лозинке се не поклапају.',
    passwordTooShortError: 'Лозинка мора имати најмање 4 карактера.',
    passwordUpdatedSuccess: 'Лозинка је успешно променена!',
    currentPasswordIncorrectError: 'Тренутна лозинка није тачна.',
  },
};

// Localized Service Type Labels
export const serviceTypeTranslations: Record<Language, Record<string, string>> = {
  en: {
    // English codes
    'waste-disposal': 'Waste Disposal',
    'waste-management': 'Waste Management',
    'special-waste-streams': 'Special Waste Streams & Eco Tax',
    'permits': 'Waste Management Permits',
    'environmental-impact': 'Environmental Impact Assessment',
    'wastewater-testing': 'Wastewater Testing',
    'air-emissions': 'Air Emissions Testing',
    'noise-emissions': 'Noise Emissions Testing',
    'soil-testing': 'Soil Testing',
    'waste-testing': 'Waste Testing',
    'adr-adviser': 'ADR Safety Adviser',
    'chemical-adviser': 'Chemicals Adviser',
    'iso': 'ISO Standards Implementation',
    'fsc': 'FSC Standard',
    'enplus': 'ENplus Certificate',
    'ddd': 'Pest Control Services (SRPS EN 16636)',
    'haccp': 'Food Safety (BRC/IFS/FSSC)',

    // Serbian fallback keys
    'zbrinjavanje': 'Waste Disposal',
    'upravljanje': 'Waste Management',
    'posebni-tokovi': 'Special Waste Streams & Eco Tax',
    'dozvole': 'Waste Management Permits',
    'procena-uticaja': 'Environmental Impact Assessment',
    'ispitivanje-otpadnih-voda': 'Wastewater Testing',
    'emisija-vazduh': 'Air Emissions Testing',
    'emisija-buka': 'Noise Emissions Testing',
    'ispitivanje-zemljista': 'Soil Testing',
    'ispitivanje-otpada': 'Waste Testing',
    'savetnik-adr': 'ADR Safety Adviser',
    'savetnik-hemikalije': 'Chemicals Adviser',
  },
  'sr-Latn': {
    // English codes
    'waste-disposal': 'Zbrinjavanje otpada',
    'waste-management': 'Upravljanje otpadom',
    'special-waste-streams': 'Posebni tokovi otpada, eko taksa',
    'permits': 'Dozvole za upravljanje otpadom',
    'environmental-impact': 'Procena uticaja na životnu sredinu',
    'wastewater-testing': 'Ispitivanje otpadnih voda',
    'air-emissions': 'Emisija u vazduh',
    'noise-emissions': 'Emisija buke',
    'soil-testing': 'Ispitivanje zemljišta',
    'waste-testing': 'Ispitivanje otpada',
    'adr-adviser': 'Savetnik za ADR',
    'chemical-adviser': 'Savetnik za hemikalije',
    'iso': 'Implementacija ISO standarda',
    'fsc': 'FSC standard',
    'enplus': 'ENplus sertifikat',
    'ddd': 'DDD usluge (SRPS EN 16636)',
    'haccp': 'Bezbednost hrane (BRC/IFS/FSSC)',

    // Serbian fallback keys
    'zbrinjavanje': 'Zbrinjavanje otpada',
    'upravljanje': 'Upravljanje otpadom',
    'posebni-tokovi': 'Posebni tokovi otpada, eko taksa',
    'dozvole': 'Dozvole za upravljanje otpadom',
    'procena-uticaja': 'Procena uticaja na životnu sredinu',
    'ispitivanje-otpadnih-voda': 'Ispitivanje otpadnih voda',
    'emisija-vazduh': 'Emisija u vazduh',
    'emisija-buka': 'Emisija buke',
    'ispitivanje-zemljista': 'Ispitivanje zemljišta',
    'ispitivanje-otpada': 'Ispitivanje otpada',
    'savetnik-adr': 'Savetnik za ADR',
    'savetnik-hemikalije': 'Savetnik za hemikalije',
  },
  'sr-Cyrl': {
    // English codes
    'waste-disposal': 'Збрињавање отпада',
    'waste-management': 'Управљање отпадом',
    'special-waste-streams': 'Посебни токови отпада, еко такса',
    'permits': 'Дозволе за управљање отпадом',
    'environmental-impact': 'Процена утицаја на животну средину',
    'wastewater-testing': 'Испитивање отпадних вода',
    'air-emissions': 'Емисија у ваздух',
    'noise-emissions': 'Емисија буке',
    'soil-testing': 'Испитивање земљишта',
    'waste-testing': 'Испитивање отпада',
    'adr-adviser': 'Саветник за АДР',
    'chemical-adviser': 'Саветник за хемикалије',
    'iso': 'Имплементација ИСО стандарда',
    'fsc': 'ФСЦ стандард',
    'enplus': 'ЕНплус сертификат',
    'ddd': 'ДДД услуге (SRPS EN 16636)',
    'haccp': 'Безбедност хране (BRC/IFS/FSSC)',

    // Serbian fallback keys
    'zbrinjavanje': 'Збрињавање отпада',
    'upravljanje': 'Управљање отпадом',
    'posebni-tokovi': 'Посебни токови отпада, еко такса',
    'dozvole': 'Дозволе за управљање отпадом',
    'procena-uticaja': 'Процена утицаја на животну средину',
    'ispitivanje-otpadnih-voda': 'Испитивање отпадних вода',
    'emisija-vazduh': 'Емисија у ваздух',
    'emisija-buka': 'Емисија буке',
    'ispitivanje-zemljista': 'Испитивање земљишта',
    'ispitivanje-otpada': 'Испитивање отпада',
    'savetnik-adr': 'Саветник за АДР',
    'savetnik-hemikalije': 'Саветник за хемикалије',
  },
};

