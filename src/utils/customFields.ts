import type { CustomFieldDefinition, ProvidedService, Service, CustomFieldType, Client } from '../types';

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
  if (Array.isArray(val)) {
    return val
      .map((v) => {
        if (typeof v === 'object' && v !== null) {
          return v.name || v.label || v.title || v.code || '';
        }
        return String(v);
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof val === 'object' && val !== null) {
    if (val.name) return String(val.name).trim();
    if (val.label) return String(val.label).trim();
    if (val.title) return String(val.title).trim();
    if (val.code) return String(val.code).trim();
    if (val.value !== undefined) return formatCustomFieldValue(val.value, type);
    return '';
  }
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
 * and units directly from the item's service model or all known services.
 * Shows labels exactly as defined in the database without fallbacks or string transformations.
 */
export const resolveCustomFieldBadges = (
  item: ProvidedService,
  services: Service[] = [],
  clients: Client[] = []
): CustomFieldBadge[] => {
  if (!item.customData || typeof item.customData !== 'object') return [];

  const rawData: Record<string, any> = item.customData;
  const entries = Object.entries(rawData).filter(
    ([_, v]) => v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== '')
  );

  if (entries.length === 0) return [];

  const itemService = item.service || services.find((s) => String(s.id) === String(item.serviceId));
  const serviceFields: CustomFieldDefinition[] =
    itemService?.customDataModel && Array.isArray(itemService.customDataModel)
      ? itemService.customDataModel
      : [];

  const allFieldsMap = buildCustomFieldsMap(services);
  const badges: CustomFieldBadge[] = [];
  const handledKeys = new Set<string>();

  // 1. Process service model fields in definition order using exact field.id
  if (serviceFields.length > 0) {
    for (const fieldDef of serviceFields) {
      const val = rawData[fieldDef.id];
      if (val !== undefined && val !== null && (Array.isArray(val) ? val.length > 0 : String(val).trim() !== '')) {
        handledKeys.add(fieldDef.id);
        let displayVal = formatCustomFieldValue(val, fieldDef.type);
        if ((fieldDef.type === 'client' || fieldDef.linkedList === 'clients') && clients && clients.length > 0) {
          if (typeof val === 'string' && val.length > 0) {
            const matchClient = clients.find((c) => String(c.id) === String(val));
            if (matchClient) displayVal = matchClient.name;
          }
        }
        badges.push({
          id: fieldDef.id,
          label: fieldDef.name || fieldDef.id,
          value: displayVal,
          unit: fieldDef.unit,
          rawValue: val,
        });
      }
    }
  }

  // 2. Process any remaining entries in customData
  for (const [key, val] of entries) {
    if (handledKeys.has(key)) continue;

    const fieldDef = allFieldsMap.get(key);
    if (fieldDef) {
      handledKeys.add(key);
      let displayVal = formatCustomFieldValue(val, fieldDef.type);
      if ((fieldDef.type === 'client' || fieldDef.linkedList === 'clients') && clients && clients.length > 0) {
        if (typeof val === 'string' && val.length > 0) {
          const matchClient = clients.find((c) => String(c.id) === String(val));
          if (matchClient) displayVal = matchClient.name;
        }
      }
      badges.push({
        id: key,
        label: fieldDef.name || key,
        value: displayVal,
        unit: fieldDef.unit,
        rawValue: val,
      });
      continue;
    }

    // Unmodeled key: display verbatim key as stored in database without guessing or formatting
    badges.push({
      id: key,
      label: key,
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

/**
 * Parses numeric value from a number or string, supporting European/standard decimal separators
 */
export const parseNumericValue = (val: any): number | null => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    let clean = trimmed;
    // Format handling: "1.500,50" -> "1500.50", "1 500,50" -> "1500.50"
    if (/^\d{1,3}(\.\d{3})+,\d+$/.test(clean)) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (/^\d{1,3}( \d{3})+,\d+$/.test(clean)) {
      clean = clean.replace(/\s+/g, '').replace(',', '.');
    } else {
      clean = clean.replace(',', '.');
    }

    const match = clean.match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const num = parseFloat(match[0]);
    return isNaN(num) ? null : num;
  }
  return null;
};

export interface ExtractNumericFieldOptions {
  fieldId?: string;
  unit?: string | string[];
}

export interface ExtractedNumericField {
  id: string;
  name: string;
  value: number;
  unit?: string;
  raw: any;
}

/**
 * Extracts a numeric custom field from a ProvidedService based on schema definition
 */
export const extractNumericField = (
  item: ProvidedService,
  options: ExtractNumericFieldOptions = {},
  services: Service[] = []
): ExtractedNumericField | null => {
  if (!item.customData || typeof item.customData !== 'object') return null;

  const itemService = item.service || services.find((s) => String(s.id) === String(item.serviceId));
  const modelFields = itemService?.customDataModel || [];

  const targetUnits = options.unit
    ? (Array.isArray(options.unit) ? options.unit : [options.unit]).map((u) => u.toLowerCase().trim())
    : null;

  for (const field of modelFields) {
    if (field.type !== 'number') continue;
    if (options.fieldId && field.id !== options.fieldId) continue;

    if (targetUnits && targetUnits.length > 0) {
      const fieldUnit = (field.unit || '').toLowerCase().trim();
      if (!targetUnits.includes(fieldUnit)) continue;
    }

    const rawVal = item.customData[field.id];
    const num = parseNumericValue(rawVal);
    if (num !== null) {
      return {
        id: field.id,
        name: field.name,
        value: num,
        unit: field.unit,
        raw: rawVal,
      };
    }
  }

  return null;
};

const WEIGHT_UNITS_KG = ['kg', 'kilogram'];
const WEIGHT_UNITS_TON = ['t', 'tona', 'tone', 'ton'];
const ALL_WEIGHT_UNITS = [...WEIGHT_UNITS_KG, ...WEIGHT_UNITS_TON];

/**
 * Extracts weight in kg (or tons) from a ProvidedService based purely on the service's schema unit
 * (field.type === 'number' and field.unit in ['kg', 't']).
 * Agnostic of field name or field ID.
 */
export const extractWeight = (
  item: ProvidedService,
  services: Service[] = [],
  targetUnit: 'kg' | 't' = 'kg'
): number => {
  if (!item.customData || typeof item.customData !== 'object') return 0;

  const itemService = item.service || services.find((s) => String(s.id) === String(item.serviceId));
  const modelFields = itemService?.customDataModel || [];

  for (const field of modelFields) {
    if (field.type !== 'number') continue;
    const unit = (field.unit || '').toLowerCase().trim();
    if (!ALL_WEIGHT_UNITS.includes(unit)) continue;

    const rawVal = item.customData[field.id];
    const num = parseNumericValue(rawVal);
    if (num === null || num <= 0) continue;

    const isTon = WEIGHT_UNITS_TON.includes(unit);
    if (targetUnit === 'kg') {
      return isTon ? num * 1000 : num;
    } else {
      return isTon ? num : num / 1000;
    }
  }

  return 0;
};
