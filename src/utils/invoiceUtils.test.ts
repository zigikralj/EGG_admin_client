import { describe, it, expect } from 'vitest';
import { parseInvoiceNotes, serializeInvoiceNotes, enhanceInvoicesWithLinks } from './invoiceUtils';
import type { Invoice } from '../types';

describe('invoiceUtils', () => {
  describe('parseInvoiceNotes', () => {
    it('returns default values for null or undefined', () => {
      expect(parseInvoiceNotes(null)).toEqual({ cleanNotes: '', invoiceType: 'Standard', parentInvoiceId: null });
      expect(parseInvoiceNotes(undefined as any)).toEqual({ cleanNotes: '', invoiceType: 'Standard', parentInvoiceId: null });
      expect(parseInvoiceNotes('')).toEqual({ cleanNotes: '', invoiceType: 'Standard', parentInvoiceId: null });
    });

    it('returns unchanged notes if no meta data exists', () => {
      expect(parseInvoiceNotes('Some notes here')).toEqual({ cleanNotes: 'Some notes here', invoiceType: 'Standard', parentInvoiceId: null });
    });

    it('parses meta data and cleans notes', () => {
      const raw = 'Note content\n<!--meta:{"type":"Credit Memo","parentId":"inv_123"}-->';
      expect(parseInvoiceNotes(raw)).toEqual({ cleanNotes: 'Note content', invoiceType: 'Credit Memo', parentInvoiceId: 'inv_123' });
    });
    
    it('handles malformed JSON gracefully', () => {
      const raw = 'Note content\n<!--meta:{badjson}-->';
      expect(parseInvoiceNotes(raw)).toEqual({ cleanNotes: raw, invoiceType: 'Standard', parentInvoiceId: null });
    });
  });

  describe('serializeInvoiceNotes', () => {
    it('trims string', () => {
      expect(serializeInvoiceNotes('  notes  ')).toEqual('notes');
    });

    it('returns empty string for undefined', () => {
      expect(serializeInvoiceNotes(undefined as any)).toEqual('');
    });
  });

  describe('enhanceInvoicesWithLinks', () => {
    it('enhances invoices with proper links', () => {
      const invoices = [
        { id: '1', notes: 'inv1', invoiceType: 'Standard' } as Invoice,
        { id: '2', notes: 'inv2', parentInvoiceId: '1', invoiceType: 'Credit Memo' } as Invoice,
      ];
      const enhanced = enhanceInvoicesWithLinks(invoices);
      
      expect(enhanced.length).toBe(2);
      expect(enhanced[0].childInvoices).toBeDefined();
      expect(enhanced[0].childInvoices?.length).toBe(1);
      expect(enhanced[0].childInvoices?.[0].id).toBe('2');
      expect(enhanced[1].parentInvoice).toBeDefined();
      expect(enhanced[1].parentInvoice?.id).toBe('1');
    });
  });
});
