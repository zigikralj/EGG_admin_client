import { useClientsQuery, usePermitsQuery, useUsersQuery, useCategoriesQuery, useWasteCatalogQuery } from '../queries';
import { PERMIT_TYPE_OPTIONS } from '../types';
import type { CustomFieldDefinition, Client, Permit } from '../types';

export const normalizePermitType = (val: string): string =>
  (val || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const clientHasPermitType = (
  client: Client,
  permits: Permit[],
  permitTypeFilter?: string
): boolean => {
  if (!permitTypeFilter || permitTypeFilter === 'all') {
    return true;
  }

  const targetNorm = normalizePermitType(permitTypeFilter);

  const checkTypes = (types?: (string | null | undefined)[]): boolean => {
    if (!types || !Array.isArray(types)) return false;
    return types.some((t) => t && normalizePermitType(t) === targetNorm);
  };

  // 1. Direct permits attached to client object
  if (client.permits && client.permits.length > 0) {
    if (client.permits.some((p) => checkTypes(p.permitTypes))) return true;
  }

  // 2. Single permit on client object
  if (client.permit && checkTypes(client.permit.permitTypes)) {
    return true;
  }

  // 3. Matched permits from the all-permits query
  const relatedPermits = permits.filter(
    (p) =>
      p.clientId === client.id ||
      p.client?.id === client.id ||
      p.clients?.some((cl) => cl.id === client.id) ||
      (p as any).clientIds?.includes(client.id) ||
      (client.permitId && p.id === client.permitId) ||
      (client.extraData?.permitId && p.id === client.extraData.permitId)
  );

  return relatedPermits.some((p) => checkTypes(p.permitTypes));
};

export function useLinkedListOptions() {
  const { data: clients = [] } = useClientsQuery();
  const { data: permits = [] } = usePermitsQuery();
  const { data: users = [] } = useUsersQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: wasteCatalog = [] } = useWasteCatalogQuery();

  const resolveListOptions = (field: CustomFieldDefinition): string[] => {
    if (field.type === 'client' || field.linkedList === 'clients') {
      const filtered = field.permitTypeFilter && field.permitTypeFilter !== 'all'
        ? clients.filter((c) => clientHasPermitType(c, permits, field.permitTypeFilter))
        : clients;
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name)).map((c) => c.name);
    }

    if (!field.linkedList || field.linkedList === 'none') {
      return field.options || [];
    }

    switch (field.linkedList) {
      case 'users':
        return [...users].sort((a, b) => a.name.localeCompare(b.name)).map((u) => u.name);
      case 'category':
        return [...categories].sort((a, b) => a.name.localeCompare(b.name)).map((c) => c.name);
      case 'permit_type':
        return [...PERMIT_TYPE_OPTIONS];
      case 'index_number':
        return [...wasteCatalog].sort((a, b) => a.code.localeCompare(b.code)).map((w) => w.code);
      default:
        return field.options || [];
    }
  };

  return { resolveListOptions };
}

