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
  subTabSummary: string;
  subTabReminders: string;
  subTabProjects: string;
  subTabWasteDisposal: string;
  emptyWasteDisposal: string;
  btnNewWasteDisposal: string;
  subTabWasteManagement: string;
  emptyWasteManagement: string;
  btnNewWasteService: string;
  tabProjects: string;
  tabClients: string;
  tabUsers: string;
  tabServices: string;
  tabProvidedServices: string;
  providedServicesSummary: string;
  providedServicesStatistics: string;
  totalProvidedServices: string;
  totalValue: string;
  servicesByStatus: string;
  servicesByCategory: string;
  topClientsByServices: string;
  monthlyServicesTrend: string;
  wasteComparisonByYear: string;
  completionRate: string;
  tabCategories: string;
  tabReminders: string;
  tabInvoices: string;
  tabPermits: string;
  btnNewPermit: string;
  modalNewPermit: string;
  modalEditPermit: string;
  colIndexNumber: string;
  colPermit: string;
  colPermitNumber: string;
  colStartDate: string;
  colEndDate: string;
  lblIndexNumber: string;
  phIndexNumber: string;
  lblPermitNumber: string;
  phPermitNumber: string;
  lblEndDate: string;
  lblPermit: string;
  phSelectPermit: string;
  emptyPermits: string;
  confirmDeletePermit: string;
  alertPermitRequired: string;
  quickFilterExpiringPermits: string;
  quickFilterExpiredPermits: string;
  statusExpiring: string;
  statusExpired: string;
  statusActivePermit: string;
  daysRemaining: string;
  daysExpired: string;
  linkedReminders: string;
  btnAddReminderForPermit: string;
  noPermit: string;
  btnNewProvidedService: string;
  providedServicesListTitle: string;
  emptyProvidedServices: string;
  modalNewProvidedService: string;
  modalEditProvidedService: string;
  colScheduledDate: string;
  colCompletionDate: string;
  colLocation: string;
  colPrice: string;
  lblLocation: string;
  phLocation: string;
  lblScheduledDate: string;
  lblCompletionDate: string;
  lblPrice: string;
  confirmDeleteProvidedService: string;
  permissionDeniedProvidedServices: string;
  filterWasteManagement: string;
  filterAllStatus: string;
  statusPlanned: string;
  inProgressServices: string;
  plannedServices: string;
  lblMonthly: string;
  lblCumulative: string;
  wasteQuantityAnalysis: string;
  annualWasteAnalysis: string;
  monthlyWasteAnalysis: string;
  lblSelectMonth: string;
  lblSelectYear: string;
  totalWasteMonth: string;
  totalWasteYear: string;
  wasteClientsCount: string;
  wasteEntriesCount: string;
  wasteQuantityByClient: string;
  totalWasteQuantity: string;
  noWasteInMonth: string;
  alertServiceNameRequired: string;
  alertServiceCodeRequired: string;
  btnEditCustomDataModel: string;
  modalCustomDataModelTitle: string;
  modalCustomDataModelDesc: string;
  btnAddField: string;
  lblFieldName: string;
  phFieldName: string;
  lblFieldType: string;
  lblUnit: string;
  phUnit: string;
  typeText: string;
  typeNumber: string;
  typeList: string;
  typeDateTime: string;
  typeDate: string;
  lblListOptions: string;
  phListOptions: string;
  customDataSection: string;
  noCustomFieldsDefined: string;
  btnDefineModel: string;
  colCustomData: string;
  lblNoneOptional: string;
  lblNone: string;
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
  statusUnpaid: string;
  statusCancelled: string;
  markAsPaid: string;
  noItemsInInvoice: string;
  lblInvoiceType: string;
  typeStandard: string;
  typeAdvance: string;
  typeFinal: string;
  typePartial: string;
  colInvoiceType: string;
  colLinkedInvoices: string;
  lblParentInvoice: string;
  lblLinkedInvoices: string;
  lblLinkedAdvanceInvoice: string;
  lblLinkedFinalInvoice: string;
  phSelectParentInvoice: string;
  btnUnlinkInvoiceRelation: string;
  filterInvoiceType: string;
  filterAllInvoiceTypes: string;
  filterLinkedStatus: string;
  filterAllLinks: string;
  filterLinkedOnly: string;
  filterIndependentOnly: string;
  badgeAdvance: string;
  badgeFinal: string;
  badgePartial: string;
  badgeLinked: string;
  advancePaid: string;
  remainingBalance: string;
  totalContract: string;

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
  switchRoleView: string;
  lblRoleView: string;
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
  editorMentionUser: string;
  editorMentionSearchPlaceholder: string;
  menuNotifications: string;
  notificationsTitle: string;
  notificationsMarkAllRead: string;
  notificationsClearAll: string;
  noNotifications: string;
  noNotificationsDesc: string;
  notificationMentionedIn: string;
  notificationJustNow: string;
  notificationTimeAgo: string;
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
  btnTableOptions: string;
  btnRefresh: string;
  lblTableOptions: string;
  lblRowsPerPage: string;
  lblRowsPerPageOptions: string;
  lblEditOptions: string;
  lblCustomizeRowsPerPageHelp: string;
  btnResetDefault: string;
  lblColumns: string;
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
  lblDateRange: string;
  lblFromDate: string;
  lblToDate: string;
  lblThisMonth: string;
  lblDateField: string;
  btnClearDate: string;
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

  // Version & Updates
  appUpdateAvailable: string;
  appUpdateDescription: string;
  btnRefreshNow: string;
  btnDismiss: string;
  appVersion: string;
  buildTime: string;
}

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
    'odlaganje': 'Waste Disposal',
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
    'waste-disposal': 'Odlaganje otpada',
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
    'zbrinjavanje': 'Odlaganje otpada',
    'odlaganje': 'Odlaganje otpada',
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
    'waste-disposal': 'Одлагање отпада',
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
    'zbrinjavanje': 'Одлагање отпада',
    'odlaganje': 'Одлагање отпада',
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


