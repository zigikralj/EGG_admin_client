import { useLanguage } from '../context/LanguageContext';

export const useRoleLabels = () => {
  const { t } = useLanguage();

  const getRoleBadgeLabel = (r: string) => {
    switch (r) {
      case 'Administrator': return t('roleAdministrator');
      case 'Manager': return t('roleManager');
      case 'User': return t('roleUser');
      case 'Accountant': return t('roleAccountant');
      default: return r;
    }
  };

  const getRoleColor = (r: string): 'secondary' | 'primary' | 'success' | 'info' | 'default' => {
    switch (r) {
      case 'Administrator': return 'secondary';
      case 'Manager': return 'primary';
      case 'User': return 'success';
      case 'Accountant': return 'info';
      default: return 'default';
    }
  };

  return { getRoleBadgeLabel, getRoleColor };
};
