import { describe, it, expect } from 'vitest';
import {
  normalizeKey,
  isKeyMatch,
  formatCustomFieldValue,
  isWasteWeightField,
  parseWasteWeightValue
} from './customFields';
import type { CustomFieldDefinition } from '../types';

describe('customFields utils', () => {
  describe('normalizeKey', () => {
    it('normalizes string by removing diacritics and lowercasing', () => {
      expect(normalizeKey('Količina')).toBe('kolicina');
      expect(normalizeKey('ČŠĆĐŽ čšćđž')).toBe('csc_z_csc_z');
    });

    it('replaces non-alphanumeric chars with underscore', () => {
      expect(normalizeKey('Field Name 123')).toBe('field_name_123');
      expect(normalizeKey('a-b/c\\d')).toBe('a_b_c_d');
    });

    it('handles undefined or null gracefully', () => {
      expect(normalizeKey(undefined as any)).toBe('');
      expect(normalizeKey(null as any)).toBe('');
    });
  });

  describe('isKeyMatch', () => {
    const mockField: CustomFieldDefinition = { id: 'field_1', name: 'Količina otpada', type: 'number' };

    it('matches exact id', () => {
      expect(isKeyMatch('field_1', mockField)).toBe(true);
    });

    it('matches normalized id or name', () => {
      expect(isKeyMatch('kolicina_otpada', mockField)).toBe(true);
      expect(isKeyMatch('KOLIČINA OTPADA', mockField)).toBe(true);
    });

    it('matches common serbian substrings', () => {
      expect(isKeyMatch('kolicina', mockField)).toBe(true);
    });

    it('returns false for non-matching keys', () => {
      expect(isKeyMatch('datum', mockField)).toBe(false);
      expect(isKeyMatch('vrsta', mockField)).toBe(false);
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
  });

  describe('isWasteWeightField', () => {
    it('returns false for explicit disqualifiers', () => {
      expect(isWasteWeightField('indeks_otpada', 'Indeks otpada')).toBe(false);
      expect(isWasteWeightField('datum', 'Datum preuzimanja')).toBe(false);
    });

    it('returns true for exact weight units', () => {
      expect(isWasteWeightField('some_field', 'Some Label', 'kg')).toBe(true);
      expect(isWasteWeightField('some_field', 'Some Label', 't')).toBe(true);
      expect(isWasteWeightField('some_field', 'Some Label', 'tona')).toBe(true);
    });

    it('returns true for positive qualifiers in id or label', () => {
      expect(isWasteWeightField('kolicina_kg', 'Količina')).toBe(true);
      expect(isWasteWeightField('weight', 'Weight')).toBe(true);
      expect(isWasteWeightField('qty', 'Qty')).toBe(true);
    });
  });

  describe('parseWasteWeightValue', () => {
    it('returns 0 for null/undefined/empty', () => {
      expect(parseWasteWeightValue(null)).toBe(0);
      expect(parseWasteWeightValue(undefined)).toBe(0);
      expect(parseWasteWeightValue('')).toBe(0);
    });

    it('parses numbers directly', () => {
      expect(parseWasteWeightValue(123)).toBe(123);
      expect(parseWasteWeightValue(123.45)).toBe(123.45);
    });

    it('disqualifies index codes', () => {
      expect(parseWasteWeightValue('15 01 01')).toBe(0);
      expect(parseWasteWeightValue('15 01 01*')).toBe(0);
    });

    it('parses formatted strings correctly', () => {
      expect(parseWasteWeightValue('1.500,50')).toBe(1500.50); // Serbian format
      expect(parseWasteWeightValue('1 500,50')).toBe(1500.50); // Serbian spaced format
      expect(parseWasteWeightValue('1234,56')).toBe(1234.56); // Comma decimal
    });

    it('converts tons to kg', () => {
      expect(parseWasteWeightValue(1.5, 't')).toBe(1500);
      expect(parseWasteWeightValue(2, 'tona')).toBe(2000);
      expect(parseWasteWeightValue(3, '', 'kolicina_u_tonama')).toBe(3000);
    });
    
    it('does not convert to kg if kg is present', () => {
      expect(parseWasteWeightValue(1500, 'kg')).toBe(1500);
    });
  });
});
