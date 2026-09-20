import type { CustomFieldDefinition, ProvidedService, Service, CustomFieldType } from '../types';

/**
 * Normalizes a string for loose key matching (removes diacritics, lowercase, replaces symbols with underscores)
 */
export const normalizeKey = (str: string): string =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

/**
 * Checks if a given custom data key matches a field definition (by ID, name, or common Serbian/English terms)
 */
export const isKeyMatch = (key: string, field: CustomFieldDefinition): boolean => {
  if (!key || !field) return false;
  if (key === field.id) return true;

  const nKey = normalizeKey(key);
  const nFieldId = normalizeKey(field.id);
  const nFieldName = normalizeKey(field.name);

  if (nKey === nFieldId || nKey === nFieldName) return true;
  if (nKey.includes('kolicin') && (nFieldName.includes('kolicin') || nFieldId.includes('kolicin'))) return true;
  if (nKey.includes('vrst') && (nFieldName.includes('vrst') || nFieldId.includes('vrst'))) return true;
  if (nKey.includes('indeks') && (nFieldName.includes('indeks') || nFieldId.includes('indeks'))) return true;
  if (nKey.includes('datum') && (nFieldName.includes('datum') || nFieldId.includes('datum'))) return true;
  if (nKey.includes('kretanj') && (nFieldName.includes('kretanj') || nFieldId.includes('kretanj'))) return true;
  if (nKey.includes('operat') && (nFieldName.includes('operat') || nFieldId.includes('operat'))) return true;
  if (nKey.includes('prevoz') && (nFieldName.includes('prevoz') || nFieldId.includes('prevoz'))) return true;

  return false;
};

/**
 * Builds a fast lookup map of field ID -> CustomFieldDefinition from all services
 */
export const buildCustomFieldsMap = (services: Service[] = []): Map<string, CustomFieldDefinition> => {
  const map = new Map<string, CustomFieldDefinition>();
  for (const s of services) {
    if (s.customDataModel && Array.isArray(s.customDataModel)) {
      for (const f of s.customDataModel) {
        if (f && f.id) {
          map.set(f.id, f);
          map.set(f.id.toLowerCase(), f);
        }
      }
    }
  }
  return map;
};

/**
 * Formats a raw custom field value for user display
 */
export const formatCustomFieldValue = (val: any, type?: CustomFieldType): string => {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  if (type === 'datetime' && str.includes('T')) {
    str = str.replace('T', ' ');
  }
  return str;
};

export interface CustomFieldBadge {
  id: string;
  label: string;
  value: string;
  unit?: string;
  rawValue: any;
}

/**
 * Resolves badges for custom data fields of a ProvidedService, looking up field names
 * and units from the item's service model or all known services.
 * Guarantees raw technical IDs like 'field_1788029154873_lroa' are never shown as labels.
 */
export const resolveCustomFieldBadges = (
  item: ProvidedService,
  services: Service[] = []
): CustomFieldBadge[] => {
  if (!item.customData || typeof item.customData !== 'object') return [];

  const rawData: Record<string, any> = item.customData;
  const entries = Object.entries(rawData).filter(
    ([_, v]) => v !== null && v !== undefined && String(v).trim() !== ''
  );

  if (entries.length === 0) return [];

  // 1. Determine service model fields for this item
  const itemService = item.service || services.find((s) => String(s.id) === String(item.serviceId));
  const serviceFields: CustomFieldDefinition[] =
    itemService?.customDataModel && Array.isArray(itemService.customDataModel)
      ? itemService.customDataModel
      : [];

  const allFieldsMap = buildCustomFieldsMap(services);
  const badges: CustomFieldBadge[] = [];
  const handledKeys = new Set<string>();

  // 2. First priority: Iterate service custom fields in definition order
  if (serviceFields.length > 0) {
    for (const fieldDef of serviceFields) {
      let val = rawData[fieldDef.id];
      let matchedKey = fieldDef.id;

      if (val === undefined || val === null || String(val).trim() === '') {
        for (const [k, v] of entries) {
          if (!handledKeys.has(k) && isKeyMatch(k, fieldDef)) {
            val = v;
            matchedKey = k;
            break;
          }
        }
      }

      if (val !== undefined && val !== null && String(val).trim() !== '') {
        handledKeys.add(fieldDef.id);
        handledKeys.add(matchedKey);
        badges.push({
          id: fieldDef.id,
          label: fieldDef.name || fieldDef.id,
          value: formatCustomFieldValue(val, fieldDef.type),
          unit: fieldDef.unit,
          rawValue: val,
        });
      }
    }
  }

  // 3. Second priority: Process remaining entries in customData
  for (const [key, val] of entries) {
    if (handledKeys.has(key)) continue;

    // Check if key is in allFieldsMap (e.g. from another service or global definition)
    const fieldDef = allFieldsMap.get(key) || allFieldsMap.get(key.toLowerCase());
    if (fieldDef) {
      handledKeys.add(key);
      badges.push({
        id: key,
        label: fieldDef.name || key,
        value: formatCustomFieldValue(val, fieldDef.type),
        unit: fieldDef.unit,
        rawValue: val,
      });
      continue;
    }

    // Check if key matches common legacy names
    let cleanKey = key.replace(/_/g, ' ').trim();
    const lowerKey = cleanKey.toLowerCase();

    if (lowerKey.includes('kolicin')) cleanKey = 'Količina';
    else if (lowerKey.includes('vrst')) cleanKey = 'Vrsta';
    else if (lowerKey.includes('indeks')) cleanKey = 'Indeks';
    else if (lowerKey.includes('kretanj')) cleanKey = 'Dokument';
    else if (lowerKey.includes('operat')) cleanKey = 'Operater';
    else if (lowerKey.includes('prevoz')) cleanKey = 'Prevoznik';
    else if (key.startsWith('field_') || lowerKey.startsWith('field ')) {
      // Unresolvable field ID hash - NEVER display raw "field 123456..." to the user
      continue;
    }

    badges.push({
      id: key,
      label: cleanKey,
      value: formatCustomFieldValue(val),
      rawValue: val,
    });
  }

  return badges;
};

/**
 * Formats a badge into a clean label string, preventing duplicate unit strings
 * e.g. "Količina (kg): 3220" rather than "Količina (kg): 3220 kg"
 */
export const formatFieldBadgeLabel = (
  badgeOrLabel: { label: string; value: string; unit?: string } | string,
  value?: string,
  unit?: string
): string => {
  const label = typeof badgeOrLabel === 'string' ? badgeOrLabel : badgeOrLabel.label;
  const val = typeof badgeOrLabel === 'string' ? (value ?? '') : badgeOrLabel.value;
  const u = typeof badgeOrLabel === 'string' ? unit : badgeOrLabel.unit;

  const unitStr =
    u && !label.toLowerCase().includes(u.toLowerCase()) && !val.toLowerCase().includes(u.toLowerCase())
      ? ` ${u}`
      : '';

  return `${label}: ${val}${unitStr}`;
};
