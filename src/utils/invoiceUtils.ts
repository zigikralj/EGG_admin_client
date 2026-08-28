import type { Invoice, InvoiceType } from '../types';

interface InvoiceMetadata {
  type?: InvoiceType;
  parentId?: string | null;
}

const META_REGEX = /(?:\r?\n)?<!--meta:(\{.*?\})-->$/s;

/**
 * Extracts clean user notes and metadata (invoiceType, parentInvoiceId) from the raw notes field.
 */
export function parseInvoiceNotes(rawNotes?: string | null): {
  cleanNotes: string;
  invoiceType: InvoiceType;
  parentInvoiceId: string | null;
} {
  if (!rawNotes) {
    return {
      cleanNotes: '',
      invoiceType: 'Standard',
      parentInvoiceId: null,
    };
  }

  const match = rawNotes.match(META_REGEX);
  if (match) {
    try {
      const parsed: InvoiceMetadata = JSON.parse(match[1]);
      const cleanNotes = rawNotes.replace(META_REGEX, '').trim();
      return {
        cleanNotes,
        invoiceType: parsed.type || 'Standard',
        parentInvoiceId: parsed.parentId || null,
      };
    } catch {
      // If parsing fails, return rawNotes as-is
    }
  }

  return {
    cleanNotes: rawNotes,
    invoiceType: 'Standard',
    parentInvoiceId: null,
  };
}

/**
 * Serializes user notes, invoiceType, and parentInvoiceId into a single string for backend storage.
 */
export function serializeInvoiceNotes(
  userNotes: string,
  invoiceType?: InvoiceType | null,
  parentInvoiceId?: string | null
): string {
  const trimmedNotes = (userNotes || '').trim();
  const type = invoiceType || 'Standard';
  const parentId = parentInvoiceId || null;

  // If standard and no parent, keep plain text
  if (type === 'Standard' && !parentId) {
    return trimmedNotes;
  }

  const metaObj: InvoiceMetadata = {};
  if (type && type !== 'Standard') {
    metaObj.type = type;
  }
  if (parentId) {
    metaObj.parentId = parentId;
  }

  const metaStr = `<!--meta:${JSON.stringify(metaObj)}-->`;
  return trimmedNotes ? `${trimmedNotes}\n${metaStr}` : metaStr;
}

/**
 * Normalizes an invoice by extracting metadata from notes (if not explicitly present)
 * and resolving parent/child invoice relationships across the full invoice list.
 */
export function enhanceInvoicesWithLinks(invoices: Invoice[]): Invoice[] {
  // First pass: extract metadata for each invoice
  const normalizedInvoices: Invoice[] = invoices.map((inv) => {
    const { cleanNotes, invoiceType: parsedType, parentInvoiceId: parsedParentId } = parseInvoiceNotes(inv.notes);
    
    // Explicit fields take precedence, fallback to parsed metadata from notes
    const effectiveType = inv.invoiceType || parsedType || 'Standard';
    const effectiveParentId = inv.parentInvoiceId !== undefined ? inv.parentInvoiceId : parsedParentId;

    return {
      ...inv,
      invoiceType: effectiveType,
      parentInvoiceId: effectiveParentId,
      notes: cleanNotes || inv.notes,
      childInvoices: [],
    };
  });

  const invoiceMap = new Map<string, Invoice>();
  normalizedInvoices.forEach((inv) => invoiceMap.set(inv.id, inv));

  // Second pass: link parent and child relationships
  normalizedInvoices.forEach((inv) => {
    if (inv.parentInvoiceId && invoiceMap.has(inv.parentInvoiceId)) {
      const parent = invoiceMap.get(inv.parentInvoiceId)!;
      inv.parentInvoice = parent;
      if (!parent.childInvoices) {
        parent.childInvoices = [];
      }
      // Avoid duplicate child links
      if (!parent.childInvoices.some((c) => c.id === inv.id)) {
        parent.childInvoices.push(inv);
      }
    }
  });

  return normalizedInvoices;
}
