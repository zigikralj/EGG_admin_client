import { describe, it, expect } from 'vitest';
import {
  buildCustomFieldsMap,
  formatCustomFieldValue,
  resolveCustomFieldBadges,
  formatFieldBadgeLabel,
  parseNumericValue,
  extractNumericField,
  extractWeight,
} from './customFields';
import type { ProvidedService, Client, Service } from '../types';

describe('customFields utils', () => {
  describe('buildCustomFieldsMap', () => {
    it('creates map of field ID to field definition', () => {
      const services: Service[] = [
        {
          id: 's1',
          code: 'waste',
          name: 'Waste Disposal',
          group: 'waste',
          frequency: 1,
          customDataModel: [
            { id: 'kolicina_kg', name: 'Količina', type: 'number', unit: 'kg' },
            { id: 'vrsta_otpada', name: 'Vrsta otpada', type: 'text' },
          ],
        },
      ];
      const map = buildCustomFieldsMap(services);
      expect(map.size).toBe(2);
      expect(map.get('kolicina_kg')?.name).toBe('Količina');
      expect(map.get('vrsta_otpada')?.type).toBe('text');
    });
  });

  describe('formatCustomFieldValue', () => {
    it('returns empty string for null/undefined', () => {
      expect(formatCustomFieldValue(null)).toBe('');
      expect(formatCustomFieldValue(undefined)).toBe('');
    });

    it('formats arrays of strings', () => {
      expect(formatCustomFieldValue(['a', 'b', 'c'])).toBe('a, b, c');
    });

    it('formats arrays of objects with code', () => {
      expect(formatCustomFieldValue([{ code: 'A1' }, { code: 'B2' }])).toBe('A1, B2');
    });

    it('replaces T with space for datetime type', () => {
      expect(formatCustomFieldValue('2023-01-01T12:00:00', 'datetime')).toBe('2023-01-01 12:00:00');
    });

    it('trims string', () => {
      expect(formatCustomFieldValue(' test ')).toBe('test');
    });

    it('formats object with name instead of [object Object]', () => {
      expect(formatCustomFieldValue({ id: 'client-1', name: 'AgroPlod d.o.o.' })).toBe('AgroPlod d.o.o.');
      expect(formatCustomFieldValue({ name: 'Adient Seating d.o.o.' })).toBe('Adient Seating d.o.o.');
      expect(formatCustomFieldValue({ label: 'Custom Label' })).toBe('Custom Label');
      expect(formatCustomFieldValue({ title: 'Custom Title' })).toBe('Custom Title');
    });

    it('formats array of objects with name', () => {
      expect(formatCustomFieldValue([{ name: 'Client A' }, { name: 'Client B' }])).toBe('Client A, Client B');
    });
  });

  describe('resolveCustomFieldBadges', () => {
    const mockServices: Service[] = [
      {
        id: 'srv-waste',
        code: 'waste-disposal',
        name: 'Waste Disposal',
        group: 'waste',
        frequency: 1,
        customDataModel: [
          { id: 'kolicina_kg', name: 'Količina', type: 'number', unit: 'kg' },
          { id: 'vrsta_otpada', name: 'Vrsta otpada', type: 'text' },
          { id: 'transport', name: 'Transport', type: 'client' },
        ],
      },
    ];

    const mockClients: Client[] = [
      { id: 'client-123', name: 'AgroPlod d.o.o.', city: 'Kruševac' },
      { id: 'client-456', name: 'Adient Seating d.o.o.', city: 'Loznica' },
    ];

    it('resolves badges strictly by field.id and displays verbatim database names', () => {
      const item: ProvidedService = {
        id: 'ps-1',
        serviceId: 'srv-waste',
        clientId: 'client-123',
        status: 'Planned',
        customData: {
          kolicina_kg: 1234453,
          vrsta_otpada: '01 01 01, 01 03 06',
          transport: { id: 'client-123', name: 'AgroPlod d.o.o.' },
        },
      };

      const badges = resolveCustomFieldBadges(item, mockServices, mockClients);
      expect(badges).toHaveLength(3);
      expect(badges[0]).toEqual(expect.objectContaining({ id: 'kolicina_kg', label: 'Količina', value: '1234453', unit: 'kg' }));
      expect(badges[1]).toEqual(expect.objectContaining({ id: 'vrsta_otpada', label: 'Vrsta otpada', value: '01 01 01, 01 03 06' }));
      expect(badges[2]).toEqual(expect.objectContaining({ id: 'transport', label: 'Transport', value: 'AgroPlod d.o.o.' }));
    });

    it('resolves client ID string to client name', () => {
      const item: ProvidedService = {
        id: 'ps-2',
        serviceId: 'srv-waste',
        clientId: 'client-456',
        status: 'Planned',
        customData: {
          transport: 'client-456',
        },
      };

      const badges = resolveCustomFieldBadges(item, mockServices, mockClients);
      expect(badges).toHaveLength(1);
      expect(badges[0]).toEqual(expect.objectContaining({ id: 'transport', label: 'Transport', value: 'Adient Seating d.o.o.' }));
    });

    it('displays unmodeled customData keys verbatim without formatting or guessing', () => {
      const item: ProvidedService = {
        id: 'ps-3',
        serviceId: 'srv-other',
        clientId: 'client-123',
        status: 'Planned',
        customData: {
          broj_ugovora_2026: 'UG-9988',
        },
      };

      const badges = resolveCustomFieldBadges(item, [], mockClients);
      expect(badges).toHaveLength(1);
      expect(badges[0]).toEqual(expect.objectContaining({ id: 'broj_ugovora_2026', label: 'broj_ugovora_2026', value: 'UG-9988' }));
    });
  });

  describe('formatFieldBadgeLabel', () => {
    it('formats label and value with unit without duplicates', () => {
      expect(formatFieldBadgeLabel({ label: 'Količina', value: '1500', unit: 'kg' })).toBe('Količina: 1500 kg');
      expect(formatFieldBadgeLabel({ label: 'Količina (kg)', value: '1500', unit: 'kg' })).toBe('Količina (kg): 1500');
    });
  });

  describe('parseNumericValue', () => {
    it('parses numbers directly', () => {
      expect(parseNumericValue(123)).toBe(123);
      expect(parseNumericValue(123.45)).toBe(123.45);
    });

    it('returns null for null/undefined/empty string', () => {
      expect(parseNumericValue(null)).toBeNull();
      expect(parseNumericValue(undefined)).toBeNull();
      expect(parseNumericValue('')).toBeNull();
    });

    it('parses European and standard decimal formats', () => {
      expect(parseNumericValue('1.500,50')).toBe(1500.50);
      expect(parseNumericValue('1 500,50')).toBe(1500.50);
      expect(parseNumericValue('1500,50')).toBe(1500.50);
      expect(parseNumericValue('1500.50')).toBe(1500.50);
    });
  });

  describe('extractNumericField', () => {
    const mockServices: Service[] = [
      {
        id: 'srv-1',
        code: 'fuel',
        name: 'Fuel Tracking',
        group: 'operations',
        frequency: 1,
        customDataModel: [
          { id: 'fuel_liters', name: 'Gorivo', type: 'number', unit: 'l' },
          { id: 'hours_spent', name: 'Sati rada', type: 'number', unit: 'h' },
        ],
      },
    ];

    it('extracts numeric field by unit', () => {
      const item: ProvidedService = {
        id: 'ps-1',
        serviceId: 'srv-1',
        clientId: 'c1',
        status: 'Completed',
        customData: {
          fuel_liters: '250,5',
          hours_spent: 8,
        },
      };

      const extracted = extractNumericField(item, { unit: 'l' }, mockServices);
      expect(extracted).not.toBeNull();
      expect(extracted?.id).toBe('fuel_liters');
      expect(extracted?.name).toBe('Gorivo');
      expect(extracted?.value).toBe(250.5);
      expect(extracted?.unit).toBe('l');
    });

    it('extracts numeric field by fieldId', () => {
      const item: ProvidedService = {
        id: 'ps-2',
        serviceId: 'srv-1',
        clientId: 'c1',
        status: 'Completed',
        customData: {
          fuel_liters: 100,
          hours_spent: 12,
        },
      };

      const extracted = extractNumericField(item, { fieldId: 'hours_spent' }, mockServices);
      expect(extracted?.value).toBe(12);
    });
  });

  describe('extractWeight', () => {
    const mockServices: Service[] = [
      {
        id: 'srv-kg',
        code: 'waste-kg',
        name: 'Waste (kg)',
        group: 'waste',
        frequency: 1,
        customDataModel: [
          { id: 'any_weight_id', name: 'Masa materijala', type: 'number', unit: 'kg' },
        ],
      },
      {
        id: 'srv-ton',
        code: 'waste-ton',
        name: 'Waste (ton)',
        group: 'waste',
        frequency: 1,
        customDataModel: [
          { id: 'freight_weight', name: 'Težina tereta', type: 'number', unit: 'tona' },
        ],
      },
    ];

    it('extracts weight in kg regardless of field name or field ID', () => {
      const itemKg: ProvidedService = {
        id: 'ps-1',
        serviceId: 'srv-kg',
        clientId: 'c1',
        status: 'Completed',
        customData: {
          any_weight_id: '1.250,50',
        },
      };

      expect(extractWeight(itemKg, mockServices, 'kg')).toBe(1250.50);
    });

    it('auto-converts tons to kg when targetUnit is kg', () => {
      const itemTon: ProvidedService = {
        id: 'ps-2',
        serviceId: 'srv-ton',
        clientId: 'c1',
        status: 'Completed',
        customData: {
          freight_weight: 2.5,
        },
      };

      expect(extractWeight(itemTon, mockServices, 'kg')).toBe(2500);
    });

    it('returns 0 when service has no weight fields', () => {
      const otherItem: ProvidedService = {
        id: 'ps-3',
        serviceId: 'srv-other',
        clientId: 'c1',
        status: 'Completed',
        customData: {
          some_text: 'hello',
        },
      };

      expect(extractWeight(otherItem, [], 'kg')).toBe(0);
    });
  });
});
