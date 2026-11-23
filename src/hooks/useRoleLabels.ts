import { useLanguage } from '../context/LanguageContext';
import type { Role } from '../types/auth.types';

export type RoleColorTarget =
  | string
  | {
      role?: string;
      isSystemAdmin?: boolean;
      roleLevel?: number;
      roleEntity?: { level?: number; isSystemAdmin?: boolean } | null;
    };

export type RoleChipColor = 'secondary' | 'primary' | 'success' | 'info' | 'default';

export const useRoleLabels = () => {
  const { t } = useLanguage();

  const getRoleBadgeLabel = (r: string) => {
    if (!r) return '';
    const key = `role${r.replace(/\s+/g, '')}`;
    const translated = t(key as any);
    return translated !== key ? translated : r;
  };

  const getRoleColor = (target: RoleColorTarget, roles?: Role[]): RoleChipColor => {
    const roleName = typeof target === 'string' ? target : target.role ?? '';
    const matchedRole = roles?.find((r) => r.name === roleName);

    const isSystemAdmin =
      (typeof target !== 'string' && (target.isSystemAdmin || target.roleEntity?.isSystemAdmin)) ||
      matchedRole?.isSystemAdmin ||
      roleName === 'Administrator';

    if (isSystemAdmin) return 'secondary';

    const level =
      (typeof target !== 'string'
        ? target.roleEntity?.level ?? target.roleLevel
        : undefined) ?? matchedRole?.level;

    if (roles && roles.length > 0 && typeof level === 'number') {
      const nonAdminLevels = Array.from(
        new Set(
          roles
            .filter((r) => !r.isSystemAdmin && r.name !== 'Administrator' && typeof r.level === 'number')
            .map((r) => r.level as number)
        )
      ).sort((a, b) => b - a);

      if (nonAdminLevels.length === 1) {
        return 'success';
      }
      if (nonAdminLevels.length >= 2) {
        if (level === nonAdminLevels[0]) return 'primary';
        if (level === nonAdminLevels[nonAdminLevels.length - 1]) return 'success';
        return 'info';
      }
    }

    if (typeof level === 'number') {
      if (level >= 50) return 'primary';
      if (level > 10) return 'info';
      return 'success';
    }

    return 'default';
  };

  return { getRoleBadgeLabel, getRoleColor };
};
