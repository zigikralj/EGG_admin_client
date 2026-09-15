import type { Invoice, InvoiceType } from '../types';

const META_REGEX = /(?:\r?\n)?<!--meta:(\{.*?\})-->$/s;

/**
 * Extracts clean user notes and metadata (invoiceType, parentInvoiceId) from the raw notes field.
 * Leaves the regex fallback in place to support older records until the DB migration is run.
 */
export function parseInvoiceNotes(rawNotes?: string | null): {
  cleanNotes: string;
  invoiceType: InvoiceType;
  parentInvoiceId: string | null;
} {
  if (!rawNotes) {
    return { cleanNotes: '', invoiceType: 'Standard', parentInvoiceId: null };
  }
  const match = rawNotes.match(META_REGEX);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      return {
        cleanNotes: rawNotes.replace(META_REGEX, '').trim(),
        invoiceType: parsed.type || 'Standard',
        parentInvoiceId: parsed.parentId || null,
      };
    } catch { }
  }
  return { cleanNotes: rawNotes, invoiceType: 'Standard', parentInvoiceId: null };
}

/**
 * Serializes user notes. Since backend now supports invoiceType and parentInvoiceId natively, 
 * this no longer appends the HTML comment hack and simply returns the trimmed notes.
 */
export function serializeInvoiceNotes(
  userNotes: string,
  _invoiceType?: InvoiceType | null,
  _parentInvoiceId?: string | null
): string {
  return (userNotes || '').trim();
}

/**
 * Resolves parent/child invoice relationships across the full invoice list.
 */
export function enhanceInvoicesWithLinks(invoices: Invoice[]): Invoice[] {
  const invoiceMap = new Map<string, Invoice>();
  
  // First pass: extract metadata for each invoice (fallback to notes if explicit fields are missing)
  const normalizedInvoices: Invoice[] = invoices.map((inv) => {
    const { cleanNotes, invoiceType: parsedType, parentInvoiceId: parsedParentId } = parseInvoiceNotes(inv.notes);
    
    // Explicit fields take precedence, fallback to parsed metadata from notes
    const effectiveType = inv.invoiceType || parsedType || 'Standard';
    const effectiveParentId = inv.parentInvoiceId !== undefined ? inv.parentInvoiceId : parsedParentId;

    const clone = {
      ...inv,
      invoiceType: effectiveType,
      parentInvoiceId: effectiveParentId,
      notes: cleanNotes || inv.notes,
      childInvoices: [],
    };
    invoiceMap.set(clone.id, clone);
    return clone;
  });

  // Second pass: link parent and child relationships
  normalizedInvoices.forEach((inv) => {
    if (inv.parentInvoiceId && invoiceMap.has(inv.parentInvoiceId)) {
      const parent = invoiceMap.get(inv.parentInvoiceId)!;
      inv.parentInvoice = parent;
      // Avoid duplicate child links
      if (!parent.childInvoices!.some((c) => c.id === inv.id)) {
        parent.childInvoices!.push(inv);
      }
    }
  });

  return normalizedInvoices;
}
