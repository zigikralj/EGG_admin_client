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
  tabInvoices: string;
  btnNewInvoice: string;
  invoicesListTitle: string;
  emptyInvoices: string;
  colInvoiceNumber: string;
  colDateCreated: string;
  colDueDate: string;
  colPaymentDate: string;
  colTotalAmount: string;
  colItemsCount: string;
  modalNewInvoice: string;
  modalEditInvoice: string;
  lblInvoiceNumber: string;
  phInvoiceNumber: string;
  lblDateCreated: string;
  lblPaymentDate: string;
  lblInvoiceStatus: string;
  lblCurrency: string;
  invoiceItemsSection: string;
  lblItemDescription: string;
  lblItemQuantity: string;
  lblItemUnitPrice: string;
  lblItemTotal: string;
  btnAddInvoiceItem: string;
  btnRemoveInvoiceItem: string;
  confirmDeleteInvoice: string;
  alertInvoiceNumberRequired: string;
  alertDueDateRequired: string;
  alertClientRequired: string;
  statusDraft: string;
  statusSent: string;
  statusPaid: string;
  statusCancelled: string;
  markAsPaid: string;
  noItemsInInvoice: string;

  // Dashboard Stats
  projectsStatistic: string;
  statInCreation: string;
  statDone: string;
  statStale: string;
  statOverdueUrgent: string;
  statUrgentProjects: string;
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
  chartTop10Clients: string;
  chartTop10ClientsSubtitle: string;
  axisTotalPaidAmount: string;
  noPaidInvoicesData: string;
  totalPaidAmountInPeriod: string;

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
  latestProjectsTitle: string;
  approachingInvoicesTitle: string;
  statApproachingInvoices: string;
  emptyApproachingInvoices: string;
  btnShowAllInvoices: string;
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
  lblRemindersChip: string;
  lblInvoicesChip: string;
  lblNoRemindersOnProject: string;
  lblNoInvoicesOnProject: string;
  lblTotalInvoiceSum: string;

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
  colOnlineStatus: string;
  statusOnline: string;
  statusOffline: string;
  btnForceLogout: string;
  confirmForceLogoutTitle: string;
  confirmForceLogoutMessage: string;
  msgForceLogoutSuccess: string;
  quickFilterOnline: string;
  onlineUsersCount: string;
  cantForceLogoutSelf: string;
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
  roleAccountant: string;
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
  colService: string;
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
  invoiceBoxTitle: string;
  btnAddInvoice: string;
  btnCreateNewInvoice: string;
  btnLinkExistingInvoice: string;
  phSelectExistingInvoice: string;
  noProjectInvoices: string;
  newProjectInvoicesHint: string;
  btnUnlinkInvoice: string;
  confirmUnlinkInvoice: string;
  modalNewProject: string;
  modalEditProject: string;
  modalViewProject: string;
  btnView: string;
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
  lblProjectNotes: string;
  phProjectNotes: string;
  projectNotesTitle: string;
  noProjectNotes: string;
  viewProjectNotes: string;
  editorBold: string;
  editorItalic: string;
  editorUnderline: string;
  editorStrikethrough: string;
  editorBulletList: string;
  editorNumberedList: string;
  editorHeading: string;
  editorParagraph: string;
  editorQuote: string;
  editorClearFormat: string;
  editorUndo: string;
  editorRedo: string;
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
  errorDialogTitle: string;
  btnContinueEditing: string;
  errorSavingProject: string;
  errorSavingService: string;
  errorSavingCategory: string;
  errorSavingClient: string;
  errorSavingUser: string;
  errorSavingReminder: string;
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
  quickFilterMissingInvoice: string;
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

  // Company Information
  companyInfoTitle: string;
  companyInfoSubtitle: string;
  companyName: string;
  companyLegalName: string;
  companyRegistrationNumber: string;
  companyMunicipality: string;
  companyCity: string;
  companyStreetAddress: string;
  companyPostalCode: string;
  companyPostOffice: string;
  companyEmail: string;
  companyTaxId: string;
  companyActivityCode: string;
  companyBankAccounts: string;
  companyBasicInfoSection: string;
  companyAddressSection: string;
  companyFinancialSection: string;
  copyAccountTooltip: string;
  copiedToClipboard: string;
  btnCopyAllDetails: string;
  allDetailsCopied: string;
  btnEditCompanyInfo: string;
  btnSaveCompanyInfo: string;
  btnCancelEdit: string;
  btnAddBankAccount: string;
  msgCompanyInfoSaved: string;
  msgCompanyInfoSaveError: string;
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
    tabInvoices: "Invoices",
    btnNewInvoice: "New Invoice",
    invoicesListTitle: "Invoices List",
    emptyInvoices: "No invoices found.",
    colInvoiceNumber: "Invoice #",
    colDateCreated: "Date Created",
    colDueDate: "Due Date",
    colPaymentDate: "Payment Date",
    colTotalAmount: "Total Amount",
    colItemsCount: "Items",
    modalNewInvoice: "New Invoice",
    modalEditInvoice: "Edit Invoice",
    lblInvoiceNumber: "Invoice Number",
    phInvoiceNumber: "e.g. INV-2026-001",
    lblDateCreated: "Date Created",
    lblPaymentDate: "Payment Date",
    lblInvoiceStatus: "Status",
    lblCurrency: "Currency",
    invoiceItemsSection: "Invoice Items",
    lblItemDescription: "Description",
    lblItemQuantity: "Quantity",
    lblItemUnitPrice: "Unit Price",
    lblItemTotal: "Total",
    btnAddInvoiceItem: "Add Item",
    btnRemoveInvoiceItem: "Remove",
    confirmDeleteInvoice: "Are you sure you want to delete this invoice?",
    alertInvoiceNumberRequired: "Invoice number is required",
    alertDueDateRequired: "Due date is required",
    alertClientRequired: "Client is required",
    statusDraft: "Draft",
    statusSent: "Sent",
    statusPaid: "Paid",
    statusCancelled: "Cancelled",
    markAsPaid: "Mark as Paid",
    noItemsInInvoice: "No items added yet.",

    // Dashboard Stats
    projectsStatistic: 'Projects statistic',
    statInCreation: 'In Progress',
    statDone: 'Completed',
    statStale: 'Takes more than\n2 months',
    statOverdueUrgent: 'Late - Urgent!',
    statUrgentProjects: 'Urgent',
    statMonitorSoon: 'Reminders in\nnext 10 days',
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
    chartTop10Clients: 'Top 10 Clients',
    chartTop10ClientsSubtitle: 'Top 10 clients by total amount of paid invoices',
    axisTotalPaidAmount: 'Paid Amount',
    noPaidInvoicesData: 'No paid invoices data available to display.',
    totalPaidAmountInPeriod: 'Total Paid: {amount}',

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
    latestProjectsTitle: 'Latest Projects',
    approachingInvoicesTitle: 'Approaching Invoices',
    statApproachingInvoices: 'Invoices due soon',
    emptyApproachingInvoices: 'No approaching invoices found.',
    btnShowAllInvoices: 'View All Invoices',
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
    lblRemindersChip: 'Reminders',
    lblInvoicesChip: 'Invoices',
    lblNoRemindersOnProject: 'No reminders for this project',
    lblNoInvoicesOnProject: 'No invoices for this project',
    lblTotalInvoiceSum: 'Total Sum',

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
    colOnlineStatus: 'Activity Status',
    statusOnline: 'Online',
    statusOffline: 'Offline',
    btnForceLogout: 'Force Logout',
    confirmForceLogoutTitle: 'Confirm Force Logout',
    confirmForceLogoutMessage: 'Are you sure you want to force log out {name}? Their current session will be terminated immediately.',
    msgForceLogoutSuccess: 'User {name} has been forced to log out.',
    quickFilterOnline: 'Online',
    onlineUsersCount: '{count} online',
    cantForceLogoutSelf: 'You cannot force log out your own active account.',
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
    roleAccountant: 'Accountant',
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
    colService: 'Service',
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
    invoiceBoxTitle: "Invoices",
    btnAddInvoice: "Add Invoice",
    btnCreateNewInvoice: "Create New Invoice",
    btnLinkExistingInvoice: "Link Existing Invoice",
    phSelectExistingInvoice: "Select invoice to link...",
    noProjectInvoices: "No invoices linked to this project.",
    newProjectInvoicesHint: "Save the project first to link invoices.",
    btnUnlinkInvoice: "Unlink",
    confirmUnlinkInvoice: "Are you sure you want to unlink this invoice from the project?",
    modalNewProject: 'New Project',
    modalEditProject: 'Edit Project',
    modalViewProject: 'Project Details',
    btnView: 'View',
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
    lblProjectNotes: 'Project Notes',
    phProjectNotes: 'Write project notes, tasks, details, bullet points...',
    projectNotesTitle: 'Project Notes',
    noProjectNotes: 'No notes for this project.',
    viewProjectNotes: 'View Notes',
    editorBold: 'Bold',
    editorItalic: 'Italic',
    editorUnderline: 'Underline',
    editorStrikethrough: 'Strikethrough',
    editorBulletList: 'Bulleted List',
    editorNumberedList: 'Numbered List',
    editorHeading: 'Heading',
    editorParagraph: 'Normal Text',
    editorQuote: 'Quote',
    editorClearFormat: 'Clear Formatting',
    editorUndo: 'Undo',
    editorRedo: 'Redo',
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
    errorDialogTitle: 'Unable to Save',
    btnContinueEditing: 'Continue Editing',
    errorSavingProject: 'Error saving project',
    errorSavingService: 'Error saving service',
    errorSavingCategory: 'Error saving category',
    errorSavingClient: 'Error saving client',
    errorSavingUser: 'Error saving user',
    errorSavingReminder: 'Error saving reminder',
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
    quickFilterMissingInvoice: 'Missing Invoice',
    quickFilterOverdue: 'Late - Urgent!',
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

    // Company Information
    companyInfoTitle: 'Company Information',
    companyInfoSubtitle: 'Official identification & banking details',
    companyName: 'Company Name',
    companyLegalName: 'Business Name',
    companyRegistrationNumber: 'Company Number (MB)',
    companyMunicipality: 'Municipality',
    companyCity: 'City / Place',
    companyStreetAddress: 'Street and Number',
    companyPostalCode: 'Postal Code',
    companyPostOffice: 'Post Office Name',
    companyEmail: 'Email',
    companyTaxId: 'Tax Identification Number (PIB)',
    companyActivityCode: 'Activity Code & Name',
    companyBankAccounts: 'Bank Accounts',
    companyBasicInfoSection: 'Basic & Legal Information',
    companyAddressSection: 'Registered Address',
    companyFinancialSection: 'Financial & Bank Information',
    copyAccountTooltip: 'Copy account number',
    copiedToClipboard: 'Copied to clipboard!',
    btnCopyAllDetails: 'Copy All Info',
    allDetailsCopied: 'Company information copied!',
    btnEditCompanyInfo: 'Edit Details',
    btnSaveCompanyInfo: 'Save Changes',
    btnCancelEdit: 'Cancel',
    btnAddBankAccount: 'Add Bank Account',
    msgCompanyInfoSaved: 'Company information updated successfully!',
    msgCompanyInfoSaveError: 'Failed to update company information.',
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
    tabInvoices: "Fakture",
    btnNewInvoice: "Nova faktura",
    invoicesListTitle: "Lista faktura",
    emptyInvoices: "Nema pronađenih faktura.",
    colInvoiceNumber: "Broj fakture",
    colDateCreated: "Datum kreiranja",
    colDueDate: "Rok plaćanja",
    colPaymentDate: "Datum uplate",
    colTotalAmount: "Ukupan iznos",
    colItemsCount: "Stavke",
    modalNewInvoice: "Nova faktura",
    modalEditInvoice: "Izmena fakture",
    lblInvoiceNumber: "Broj fakture",
    phInvoiceNumber: "npr. FAK-2026-001",
    lblDateCreated: "Datum kreiranja",
    lblPaymentDate: "Datum uplate",
    lblInvoiceStatus: "Status",
    lblCurrency: "Valuta",
    invoiceItemsSection: "Stavke fakture",
    lblItemDescription: "Opis",
    lblItemQuantity: "Količina",
    lblItemUnitPrice: "Jedinična cena",
    lblItemTotal: "Ukupno",
    btnAddInvoiceItem: "Dodaj stavku",
    btnRemoveInvoiceItem: "Ukloni",
    confirmDeleteInvoice: "Da li ste sigurni da želite da obrišete ovu fakturu?",
    alertInvoiceNumberRequired: "Broj fakture je obavezan",
    alertDueDateRequired: "Datum dospeća je obavezan",
    alertClientRequired: "Klijent je obavezan",
    statusDraft: "Kreirano",
    statusSent: "Poslato",
    statusPaid: "Plaćeno",
    statusCancelled: "Otkazano",
    markAsPaid: "Označi kao plaćeno",
    noItemsInInvoice: "Nema dodatih stavki.",

    // Dashboard Stats
    projectsStatistic: 'Statistika projekata',
    statInCreation: 'U izradi',
    statDone: 'Završeno',
    statStale: 'Traje duže od\n2 meseca',
    statOverdueUrgent: 'Kasni - Hitno!',
    statUrgentProjects: 'Hitno',
    statMonitorSoon: 'Podsetnici u\nnarednih 10 dana',
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
    chartTop10Clients: 'Top 10 klijenata',
    chartTop10ClientsSubtitle: 'Top 10 klijenata po ukupnom iznosu plaćenih faktura',
    axisTotalPaidAmount: 'Plaćeni iznos',
    noPaidInvoicesData: 'Nema podataka o plaćenim fakturama za prikaz.',
    totalPaidAmountInPeriod: 'Ukupno plaćeno: {amount}',

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
    latestProjectsTitle: 'Najnoviji projekti',
    approachingInvoicesTitle: 'Fakture koje dospevaju',
    statApproachingInvoices: 'Fakture uskoro dospevaju',
    emptyApproachingInvoices: 'Nema faktura koje uskoro dospevaju.',
    btnShowAllInvoices: 'Prikaži sve fakture',
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
    lblRemindersChip: 'Podsetnici',
    lblInvoicesChip: 'Fakture',
    lblNoRemindersOnProject: 'Nema podsetnika za ovaj projekat',
    lblNoInvoicesOnProject: 'Nema faktura za ovaj projekat',
    lblTotalInvoiceSum: 'Ukupan iznos',

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
    statusOverdue: 'Kasni',
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
    colOnlineStatus: 'Status aktivnosti',
    statusOnline: 'Na mreži',
    statusOffline: 'Van mreže',
    btnForceLogout: 'Prisilna odjava',
    confirmForceLogoutTitle: 'Potvrda prisilne odjave',
    confirmForceLogoutMessage: 'Da li ste sigurni da želite da prisilno odjavite korisnika {name}? Njegova aktivna sesija će biti odmah prekinuta.',
    msgForceLogoutSuccess: 'Korisnik {name} je uspešno odjavljen.',
    quickFilterOnline: 'Na mreži',
    onlineUsersCount: '{count} na mreži',
    cantForceLogoutSelf: 'Ne možete prisilno odjaviti svoj nalog.',
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
    roleAccountant: 'Računovođa',
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
    colService: 'Usluga',
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
    invoiceBoxTitle: "Fakture",
    btnAddInvoice: "Dodaj fakturu",
    btnCreateNewInvoice: "Kreiraj novu fakturu",
    btnLinkExistingInvoice: "Poveži postojeću fakturu",
    phSelectExistingInvoice: "Izaberite fakturu za povezivanje...",
    noProjectInvoices: "Nema faktura povezanih sa ovim projektom.",
    newProjectInvoicesHint: "Prvo sačuvajte projekat da biste povezali fakture.",
    btnUnlinkInvoice: "Rasformiraj vezu",
    confirmUnlinkInvoice: "Da li ste sigurni da želite da uklonite vezu fakture sa ovim projektom?",
    modalNewProject: 'Novi projekat',
    modalEditProject: 'Izmeni projekat',
    modalViewProject: 'Pregled projekta',
    btnView: 'Pregled',
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
    lblProjectNotes: 'Beleške projekta',
    phProjectNotes: 'Unesite beleške o projektu, stavke, detalje, nabrajanja...',
    projectNotesTitle: 'Beleške projekta',
    noProjectNotes: 'Nema unetih beleški za ovaj projekat.',
    viewProjectNotes: 'Pogledaj beleške',
    editorBold: 'Podebljano (Bold)',
    editorItalic: 'Kurziv (Italic)',
    editorUnderline: 'Podvučeno',
    editorStrikethrough: 'Precrtano',
    editorBulletList: 'Lista sa tačkama (Bulleted)',
    editorNumberedList: 'Numerisana lista',
    editorHeading: 'Naslov',
    editorParagraph: 'Običan tekst',
    editorQuote: 'Citat',
    editorClearFormat: 'Ukloni formatiranje',
    editorUndo: 'Poništi',
    editorRedo: 'Ponovi',
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
    errorDialogTitle: 'Nije moguće sačuvati',
    btnContinueEditing: 'Nastavi sa unosom',
    errorSavingProject: 'Greška pri čuvanju projekta',
    errorSavingService: 'Greška pri čuvanju usluge',
    errorSavingCategory: 'Greška pri čuvanju kategorije',
    errorSavingClient: 'Greška pri čuvanju klijenta',
    errorSavingUser: 'Greška pri čuvanju korisnika',
    errorSavingReminder: 'Greška pri čuvanju podsetnika',
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
    quickFilterMissingInvoice: 'Nedostaje faktura',
    quickFilterOverdue: 'Kašnjenje - hitno!',
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

    // Company Information
    companyInfoTitle: 'Informacije o firmi',
    companyInfoSubtitle: 'Zvanični identifikacioni i bankovni podaci',
    companyName: 'Naziv',
    companyLegalName: 'Poslovno ime',
    companyRegistrationNumber: 'Matični broj',
    companyMunicipality: 'Naziv opštine',
    companyCity: 'Mesto',
    companyStreetAddress: 'Ulica, broj i slovo',
    companyPostalCode: 'Broj pošte',
    companyPostOffice: 'Naziv pošte',
    companyEmail: 'E-pošta',
    companyTaxId: 'Poreski identifikacioni broj PIB',
    companyActivityCode: 'Šifra i naziv delatnosti',
    companyBankAccounts: 'Tekući računi',
    companyBasicInfoSection: 'Osnovni i pravni podaci',
    companyAddressSection: 'Sedište i adresa',
    companyFinancialSection: 'Finansijski i bankovni podaci',
    copyAccountTooltip: 'Kopiraj broj računa',
    copiedToClipboard: 'Kopirano u privremenu memoriju!',
    btnCopyAllDetails: 'Kopiraj sve podatke',
    allDetailsCopied: 'Podaci o firmi su kopirani!',
    btnEditCompanyInfo: 'Izmeni podatke',
    btnSaveCompanyInfo: 'Sačuvaj izmene',
    btnCancelEdit: 'Otkaži',
    btnAddBankAccount: 'Dodaj tekući račun',
    msgCompanyInfoSaved: 'Podaci o firmi su uspešno ažurirani!',
    msgCompanyInfoSaveError: 'Greška pri ažuriranju podataka o firmi.',
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
    tabInvoices: "Фактуре",
    btnNewInvoice: "Нова фактура",
    invoicesListTitle: "Листа фактура",
    emptyInvoices: "Нема пронађених фактура.",
    colInvoiceNumber: "Број фактуре",
    colDateCreated: "Датум креирања",
    colDueDate: "Рок плаћања",
    colPaymentDate: "Датум уплате",
    colTotalAmount: "Укупан износ",
    colItemsCount: "Ставке",
    modalNewInvoice: "Нова фактура",
    modalEditInvoice: "Измена фактуре",
    lblInvoiceNumber: "Број фактуре",
    phInvoiceNumber: "нпр. ФАК-2026-001",
    lblDateCreated: "Датум креирања",
    lblPaymentDate: "Датум уплате",
    lblInvoiceStatus: "Статус",
    lblCurrency: "Валута",
    invoiceItemsSection: "Ставке фактуре",
    lblItemDescription: "Опис",
    lblItemQuantity: "Количина",
    lblItemUnitPrice: "Јединична цена",
    lblItemTotal: "Укупно",
    btnAddInvoiceItem: "Додај ставку",
    btnRemoveInvoiceItem: "Уклони",
    confirmDeleteInvoice: "Да ли сте сигурни да желите да обришете ову фактуру?",
    alertInvoiceNumberRequired: "Број фактуре је обавезан",
    alertDueDateRequired: "Датум доспећа је обавезан",
    alertClientRequired: "Клијент је обавезан",
    statusDraft: "Креирано",
    statusSent: "Послато",
    statusPaid: "Плаћено",
    statusCancelled: "Отказано",
    markAsPaid: "Означи као плаћено",
    noItemsInInvoice: "Нема додатих ставки.",

    // Dashboard Stats
    projectsStatistic: 'Statistika пројеката',
    statInCreation: 'У изради',
    statDone: 'Завршено',
    statStale: 'Траје дуже од\n2 месеца',
    statOverdueUrgent: 'Касни - Хитно!',
    statUrgentProjects: 'Хитно',
    statMonitorSoon: 'Подсетници у\nнаредних 10 дана',
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
    chartTop10Clients: 'Топ 10 клијената',
    chartTop10ClientsSubtitle: 'Топ 10 клијената по укупном износу плаћених фактура',
    axisTotalPaidAmount: 'Плаћени износ',
    noPaidInvoicesData: 'Нема података о плаћеним фактурама за приказ.',
    totalPaidAmountInPeriod: 'Укупно плаћено: {amount}',

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
    latestProjectsTitle: 'Најновији пројекти',
    approachingInvoicesTitle: 'Фактуре које доспевају',
    statApproachingInvoices: 'Фактуре ускоро доспевају',
    emptyApproachingInvoices: 'Нема фактура које ускоро доспевају.',
    btnShowAllInvoices: 'Прикажи све фактуре',
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
    lblRemindersChip: 'Подсетници',
    lblInvoicesChip: 'Фактуре',
    lblNoRemindersOnProject: 'Нема подсетника за овај пројекат',
    lblNoInvoicesOnProject: 'Нема фактура за овај пројекат',
    lblTotalInvoiceSum: 'Укупан износ',

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
    statusOverdue: 'Касни',
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
    colOnlineStatus: 'Статус активности',
    statusOnline: 'На мрежи',
    statusOffline: 'Ван мреже',
    btnForceLogout: 'Присилна одјава',
    confirmForceLogoutTitle: 'Потврда присилне одјаве',
    confirmForceLogoutMessage: 'Да ли сте сигурни да желите да присилно одјавите корисника {name}? Његова активна сесија ће бити одмах прекинута.',
    msgForceLogoutSuccess: 'Корисник {name} је успешно одјављен.',
    quickFilterOnline: 'На мрежи',
    onlineUsersCount: '{count} на мрежи',
    cantForceLogoutSelf: 'Не можете присилно одјавити свој налог.',
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
    roleAccountant: 'Рачуновођа',
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
    colService: 'Услуга',
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
    invoiceBoxTitle: "Фактуре",
    btnAddInvoice: "Додај фактуру",
    btnCreateNewInvoice: "Креирај нову фактуру",
    btnLinkExistingInvoice: "Повежи постојећу фактуру",
    phSelectExistingInvoice: "Изаберите фактуру за повезивање...",
    noProjectInvoices: "Нема фактура повезаних са овим пројектом.",
    newProjectInvoicesHint: "Прво сачувајте пројекат да бисте повезали фактуре.",
    btnUnlinkInvoice: "Расформирај везу",
    confirmUnlinkInvoice: "Да ли сте сигурни да желите да уклоните везу фактуре са овим пројектом?",
    modalNewProject: 'Нови пројекат',
    modalEditProject: 'Измени пројекат',
    modalViewProject: 'Преглед пројекта',
    btnView: 'Преглед',
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
    lblProjectNotes: 'Белешке пројекта',
    phProjectNotes: 'Унесите белешке о пројекту, ставке, детаље, набрајања...',
    projectNotesTitle: 'Белешке пројекта',
    noProjectNotes: 'Нема унетих белешки за овај пројекат.',
    viewProjectNotes: 'Погледај белешке',
    editorBold: 'Подебљано (Bold)',
    editorItalic: 'Курзив (Italic)',
    editorUnderline: 'Подвучено',
    editorStrikethrough: 'Прецртано',
    editorBulletList: 'Листа са тачкама (Bulleted)',
    editorNumberedList: 'Нумерисана листа',
    editorHeading: 'Наслов',
    editorParagraph: 'Обичан текст',
    editorQuote: 'Цитат',
    editorClearFormat: 'Уклони форматирање',
    editorUndo: 'Поништи',
    editorRedo: 'Понови',
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
    errorDialogTitle: 'Није могуће сачувати',
    btnContinueEditing: 'Настави са уносом',
    errorSavingProject: 'Грешка при чувању пројекта',
    errorSavingService: 'Грешка при чувању услуге',
    errorSavingCategory: 'Грешка при чувању категорије',
    errorSavingClient: 'Грешка при чувању клијента',
    errorSavingUser: 'Грешка при чувању корисника',
    errorSavingReminder: 'Грешка при чувању подсетника',
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
    quickFilterMissingInvoice: 'Недостаје фактура',
    quickFilterOverdue: 'Кашњење - хитно!',
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

    // Company Information
    companyInfoTitle: 'Информације о фирми',
    companyInfoSubtitle: 'Званични идентификациони и банковни подаци',
    companyName: 'Назив',
    companyLegalName: 'Пословно име',
    companyRegistrationNumber: 'Матични број',
    companyMunicipality: 'Назив општине',
    companyCity: 'Место',
    companyStreetAddress: 'Улица, број и слово',
    companyPostalCode: 'Број поште',
    companyPostOffice: 'Назив поште',
    companyEmail: 'Е-пошта',
    companyTaxId: 'Порески идентификациони број ПИБ',
    companyActivityCode: 'Шифра и назив делатности',
    companyBankAccounts: 'Текући рачуни',
    companyBasicInfoSection: 'Основни и правни подаци',
    companyAddressSection: 'Седиште и адреса',
    companyFinancialSection: 'Финансијски и банковни подаци',
    copyAccountTooltip: 'Копирај број рачуна',
    copiedToClipboard: 'Копирано у привремену меморију!',
    btnCopyAllDetails: 'Копирај све податке',
    allDetailsCopied: 'Подаци о фирми су копирани!',
    btnEditCompanyInfo: 'Измени податке',
    btnSaveCompanyInfo: 'Сачувај измене',
    btnCancelEdit: 'Откажи',
    btnAddBankAccount: 'Додај текући рачун',
    msgCompanyInfoSaved: 'Подаци о фирми су успешно ажурирани!',
    msgCompanyInfoSaveError: 'Грешка при ажурирању података о фирми.',
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

// Localized Error Messages
export const errorMessageTranslations: Record<Language, Record<string, string>> = {
  en: {
    // Services
    'a service with this code already exists': 'A service with this code already exists. Please choose a different code.',
    'code and name are required': 'Service code and name are required.',
    'failed to create service': 'Failed to create service.',
    'failed to update service': 'Failed to update service.',
    'service not found': 'Service not found.',
    'permission denied. only administrators and managers can manage services.': 'Permission denied. Only Administrators and Managers can manage services.',

    // Categories
    'category code already exists': 'A category with this code already exists. Please choose a different code.',
    'category name and code are required': 'Category code and name are required.',
    'failed to create category': 'Failed to create category.',
    'failed to update category': 'Failed to update category.',
    'category not found': 'Category not found.',
    'permission denied. only administrators and managers can manage categories.': 'Permission denied. Only Administrators and Managers can manage categories.',

    // Clients
    'client name is required': 'Client company name is required.',
    'a client with this name already exists': 'A client with this name already exists.',
    'failed to create client': 'Failed to create client.',
    'failed to update client': 'Failed to update client.',
    'failed to delete client': 'Failed to delete client.',
    'permission denied. only administrators and managers can manage clients.': 'Permission denied. Only Administrators and Managers can manage clients.',

    // Users & Auth
    'a user with this name or email already exists': 'A user with this name or email already exists.',
    'a user with this name or email already exists.': 'A user with this name or email already exists.',
    'full name is required': 'Full name is required.',
    'full name is required.': 'Full name is required.',
    'email is required': 'Email is required.',
    'email is required.': 'Email is required.',
    'password must be at least 6 characters long': 'Password must be at least 6 characters long.',
    'password must be at least 6 characters long.': 'Password must be at least 6 characters long.',
    'email/username and password are required': 'Email/username and password are required.',
    'email/username and password are required.': 'Email/username and password are required.',
    'invalid email/username or password': 'Invalid email/username or password.',
    'invalid email/username or password.': 'Invalid email/username or password.',
    'invalid_credentials': 'Invalid email/username or password.',
    'failed to process login': 'Failed to process login.',
    'failed to process login.': 'Failed to process login.',
    'permission denied. only administrators and managers can manage users.': 'Permission denied. Only Administrators and Managers can manage users.',
    'failed to approve user': 'Failed to approve user.',
    'failed to approve user.': 'Failed to approve user.',
    'failed to reject user': 'Failed to reject user.',
    'failed to reject user.': 'Failed to reject user.',

    // Projects
    'name, client, and type are required': 'Project name, client, and service type are required.',
    'project not found': 'Project not found.',
    'permission denied. standard users can only edit their own projects.': 'Permission denied. Standard Users can only edit their own projects.',
    'permission denied. standard users can only delete their own projects.': 'Permission denied. Standard Users can only delete their own projects.',
    'failed to create project': 'Failed to create project.',
    'failed to update project': 'Failed to update project.',
    'failed to delete project': 'Failed to delete project.',

    // Reminders
    'reminder title or project name is required': 'Reminder title or project name is required.',
    'reminder not found': 'Reminder not found.',
    'failed to create reminder': 'Failed to create reminder.',
    'failed to update reminder': 'Failed to update reminder.',
    'failed to delete reminder': 'Failed to delete reminder.',
    'failed to update reminder status': 'Failed to update reminder status.',

    // Generic
    'authentication required. please log in.': 'Authentication required. Please log in.',
    'unauthorized': 'Authentication required. Please log in.',
    'network error occurred': 'Network error occurred. Please check your connection.',
  },
  'sr-Latn': {
    // Services
    'a service with this code already exists': 'Usluga sa ovom šifrom već postoji. Molimo unesite drugu šifru.',
    'code and name are required': 'Šifra i naziv usluge su obavezna polja.',
    'failed to create service': 'Kreiranje usluge nije uspelo.',
    'failed to update service': 'Ažuriranje usluge nije uspelo.',
    'service not found': 'Usluga nije pronađena.',
    'permission denied. only administrators and managers can manage services.': 'Pristup odbijen. Samo administratori i menadžeri mogu upravljati uslugama.',

    // Categories
    'category code already exists': 'Kategorija sa ovom šifrom već postoji. Molimo unesite drugu šifru.',
    'category name and code are required': 'Šifra i naziv kategorije su obavezna polja.',
    'failed to create category': 'Kreiranje kategorije nije uspelo.',
    'failed to update category': 'Ažuriranje kategorije nije uspelo.',
    'category not found': 'Kategorija nije pronađena.',
    'permission denied. only administrators and managers can manage categories.': 'Pristup odbijen. Samo administratori i menadžeri mogu upravljati kategorijama.',

    // Clients
    'client name is required': 'Naziv klijenta je obavezno polje.',
    'a client with this name already exists': 'Klijent sa ovim nazivom već postoji.',
    'failed to create client': 'Kreiranje klijenta nije uspelo.',
    'failed to update client': 'Ažuriranje klijenta nije uspelo.',
    'failed to delete client': 'Brisanje klijenta nije uspelo.',
    'permission denied. only administrators and managers can manage clients.': 'Pristup odbijen. Samo administratori i menadžeri mogu upravljati klijentima.',

    // Users & Auth
    'a user with this name or email already exists': 'Korisnik sa ovim imenom ili email adresom već postoji.',
    'a user with this name or email already exists.': 'Korisnik sa ovim imenom ili email adresom već postoji.',
    'full name is required': 'Ime i prezime je obavezno polje.',
    'full name is required.': 'Ime i prezime je obavezno polje.',
    'email is required': 'Email adresa je obavezno polje.',
    'email is required.': 'Email adresa je obavezno polje.',
    'password must be at least 6 characters long': 'Lozinka mora imati najmanje 6 karaktera.',
    'password must be at least 6 characters long.': 'Lozinka mora imati najmanje 6 karaktera.',
    'email/username and password are required': 'Korisničko ime/email i lozinka su obavezni.',
    'email/username and password are required.': 'Korisničko ime/email i lozinka su obavezni.',
    'invalid email/username or password': 'Pogrešan email/korisničko ime ili lozinka.',
    'invalid email/username or password.': 'Pogrešan email/korisničko ime ili lozinka.',
    'invalid_credentials': 'Pogrešan email/korisničko ime ili lozinka.',
    'failed to process login': 'Neuspešno prijavljivanje na sistem.',
    'failed to process login.': 'Neuspešno prijavljivanje na sistem.',
    'permission denied. only administrators and managers can manage users.': 'Pristup odbijen. Samo administratori i menadžeri mogu upravljati korisnicima.',
    'failed to approve user': 'Odobravanje korisnika nije uspelo.',
    'failed to approve user.': 'Odobravanje korisnika nije uspelo.',
    'failed to reject user': 'Odbijanje korisnika nije uspelo.',
    'failed to reject user.': 'Odbijanje korisnika nije uspelo.',

    // Projects
    'name, client, and type are required': 'Naziv projekta, klijent i vrsta usluge su obavezni.',
    'project not found': 'Projekat nije pronađen.',
    'permission denied. standard users can only edit their own projects.': 'Pristup odbijen. Standardni korisnici mogu menjati samo svoje projekte.',
    'permission denied. standard users can only delete their own projects.': 'Pristup odbijen. Standardni korisnici mogu brisati samo svoje projekte.',
    'failed to create project': 'Kreiranje projekta nije uspelo.',
    'failed to update project': 'Ažuriranje projekta nije uspelo.',
    'failed to delete project': 'Brisanje projekta nije uspelo.',

    // Reminders
    'reminder title or project name is required': 'Naziv podsetnika ili projekta je obavezan.',
    'reminder not found': 'Podsetnik nije pronađen.',
    'failed to create reminder': 'Kreiranje podsetnika nije uspelo.',
    'failed to update reminder': 'Ažuriranje podsetnika nije uspelo.',
    'failed to delete reminder': 'Brisanje podsetnika nije uspelo.',
    'failed to update reminder status': 'Ažuriranje statusa podsetnika nije uspelo.',

    // Generic
    'authentication required. please log in.': 'Autentifikacija je obavezna. Molimo prijavite se.',
    'unauthorized': 'Autentifikacija je obavezna. Molimo prijavite se.',
    'network error occurred': 'Došlo je do greške u mreži. Molimo proverite vašu internet vezu.',
  },
  'sr-Cyrl': {
    // Services
    'a service with this code already exists': 'Услуга са овом шифром већ постоји. Молимо унесите другу шифру.',
    'code and name are required': 'Шифра и назив услуге су обавезна поља.',
    'failed to create service': 'Креирање услуге није успело.',
    'failed to update service': 'Ажурирање услуге није успело.',
    'service not found': 'Услуга није пронађена.',
    'permission denied. only administrators and managers can manage services.': 'Приступ одбијен. Само администратори и менаџери могу управљати услугама.',

    // Categories
    'category code already exists': 'Категорија са овом шифром већ постоји. Молимо унесите другу шифру.',
    'category name and code are required': 'Шифра и назив категорије су обавезна поља.',
    'failed to create category': 'Креирање категорије није успело.',
    'failed to update category': 'Ажурирање категорије није успело.',
    'category not found': 'Категорија није пронађена.',
    'permission denied. only administrators and managers can manage categories.': 'Приступ одбијен. Само администратори и менаџери могу управљати категоријама.',

    // Clients
    'client name is required': 'Назив клијента је обавезно поље.',
    'a client with this name already exists': 'Клијент са овим називом већ постоји.',
    'failed to create client': 'Креирање клијента није успело.',
    'failed to update client': 'Ажурирање клијента није успело.',
    'failed to delete client': 'Брисање клијента није успело.',
    'permission denied. only administrators and managers can manage clients.': 'Приступ одбијен. Само администратори и менаџери могу управљати клијентима.',

    // Users & Auth
    'a user with this name or email already exists': 'Корисник са овим именом или имејл адресом већ постоји.',
    'a user with this name or email already exists.': 'Корисник са овим именом или имејл адресом већ постоји.',
    'full name is required': 'Име и презиме је обавезно поље.',
    'full name is required.': 'Име и презиме је обавезно поље.',
    'email is required': 'Имејл адреса је обавезно поље.',
    'email is required.': 'Имејл адреса је обавезно поље.',
    'password must be at least 6 characters long': 'Лозинка мора имати најмање 6 карактера.',
    'password must be at least 6 characters long.': 'Лозинка мора имати најмање 6 карактера.',
    'email/username and password are required': 'Корисничко име/имејл и лозинка су обавезни.',
    'email/username and password are required.': 'Корисничко име/имејл и лозинка су обавезни.',
    'invalid email/username or password': 'Погрешан имејл/корисничко име или лозинка.',
    'invalid email/username or password.': 'Погрешан имејл/корисничко име или лозинка.',
    'invalid_credentials': 'Погрешан имејл/корисничко име или лозинка.',
    'failed to process login': 'Неуспешно пријављивање на систем.',
    'failed to process login.': 'Неуспешно пријављивање на систем.',
    'permission denied. only administrators and managers can manage users.': 'Приступ одбијен. Само администратори и менаџери могу управљати корисницима.',
    'failed to approve user': 'Одобравање корисника није успело.',
    'failed to approve user.': 'Одобравање корисника није успело.',
    'failed to reject user': 'Одбијање корисника није успело.',
    'failed to reject user.': 'Одбијање корисника није успело.',

    // Projects
    'name, client, and type are required': 'Назив пројекта, клијент и врста услуге су обавезни.',
    'project not found': 'Пројекат није пронађен.',
    'permission denied. standard users can only edit their own projects.': 'Приступ одбијен. Стандардни корисници могу мењати само своје пројекте.',
    'permission denied. standard users can only delete their own projects.': 'Приступ одбијен. Стандардни корисници могу брисати само своје пројекте.',
    'failed to create project': 'Креирање пројекта није успело.',
    'failed to update project': 'Ажурирање пројекта није успело.',
    'failed to delete project': 'Брисање пројекта није успело.',

    // Reminders
    'reminder title or project name is required': 'Назив подсетника или пројекта је обавезан.',
    'reminder not found': 'Подсетник није пронађен.',
    'failed to create reminder': 'Креирање подсетника није успело.',
    'failed to update reminder': 'Ажурирање подсетника није успело.',
    'failed to delete reminder': 'Брисање подсетника није успело.',
    'failed to update reminder status': 'Ажурирање статуса подсетника није успело.',

    // Generic
    'authentication required. please log in.': 'Аутентификација је обавезна. Молимо пријавите се.',
    'unauthorized': 'Аутентификација је обавезна. Молимо пријавите се.',
    'network error occurred': 'Дошло је до грешке у мрежи. Молимо проверите вашу интернет везу.',
  },
};


