import type { ContractPlaceholderContext } from '../types';

export interface PlaceholderDef {
  key: string;
  label: string;
  category: 'ekos' | 'client' | 'contract';
  example?: string;
}

export const AVAILABLE_PLACEHOLDERS: PlaceholderDef[] = [
  // Ekos Green Group (Party 1)
  { key: '{{ekos.legalName}}', label: 'Ekos Pravno Ime', category: 'ekos', example: 'EKOS GREEN GROUP DOO Kraljevo' },
  { key: '{{ekos.name}}', label: 'Ekos Naziv', category: 'ekos', example: 'EKOS GREEN GROUP' },
  { key: '{{ekos.streetAddress}}', label: 'Ekos Adresa', category: 'ekos', example: 'HEROJA MARIČIĆA 18' },
  { key: '{{ekos.city}}', label: 'Ekos Grad', category: 'ekos', example: 'KRALJEVO' },
  { key: '{{ekos.taxId}}', label: 'Ekos PIB', category: 'ekos', example: '113207057' },
  { key: '{{ekos.registrationNumber}}', label: 'Ekos Matični Broj', category: 'ekos', example: '21823759' },
  { key: '{{ekos.bankAccount}}', label: 'Ekos Račun', category: 'ekos', example: '325-9500700212451-35' },
  { key: '{{ekos.email}}', label: 'Ekos Email', category: 'ekos', example: 'office@ekosgroup.rs' },

  // Client (Party 2)
  { key: '{{client.name}}', label: 'Klijent Naziv', category: 'client', example: 'Preduzeće DOO' },
  { key: '{{client.city}}', label: 'Klijent Grad', category: 'client', example: 'Beograd' },
  { key: '{{client.contactPerson}}', label: 'Klijent Kontakt Osoba', category: 'client', example: 'Petar Petrović' },
  { key: '{{client.email}}', label: 'Klijent Email', category: 'client', example: 'kontakt@klijent.rs' },
  { key: '{{client.phone}}', label: 'Klijent Telefon', category: 'client', example: '+381 11 1234567' },

  // Contract Details
  { key: '{{contract.contractNumber}}', label: 'Broj Ugovora', category: 'contract', example: 'UGOV-2026-001' },
  { key: '{{contract.title}}', label: 'Predmet Ugovora', category: 'contract', example: 'Ugovor o poslovno-tehničkoj saradnji' },
  { key: '{{contract.startDate}}', label: 'Datum Početka', category: 'contract', example: '01.01.2026.' },
  { key: '{{contract.endDate}}', label: 'Datum Završetka', category: 'contract', example: '31.12.2026.' },
];

function formatDateDisplay(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const parts = iso.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}.`;
    }
    return iso;
  } catch {
    return iso;
  }
}

/**
 * Resolves all {{placeholders}} in text or HTML against the provided Ekos, Client, and Contract contexts.
 */
export function resolveContractPlaceholders(
  content: string,
  context: ContractPlaceholderContext
): string {
  if (!content) return '';

  const { ekos, client, contract } = context;

  const map: Record<string, string> = {
    // Ekos
    '{{ekos.legalName}}': ekos?.legalName || 'EKOS GREEN GROUP DOO Kraljevo',
    '{{ekos.name}}': ekos?.name || 'EKOS GREEN GROUP',
    '{{ekos.streetAddress}}': ekos?.streetAddress || 'HEROJA MARIČIĆA 18',
    '{{ekos.city}}': ekos?.city || 'KRALJEVO',
    '{{ekos.taxId}}': ekos?.taxId || '113207057',
    '{{ekos.registrationNumber}}': ekos?.registrationNumber || '21823759',
    '{{ekos.bankAccount}}': (ekos?.bankAccounts && ekos.bankAccounts.length > 0)
      ? ekos.bankAccounts[0]
      : '325-9500700212451-35',
    '{{ekos.email}}': ekos?.email || 'office@ekosgroup.rs',

    // Client
    '{{client.name}}': client?.name || '________________________',
    '{{client.city}}': client?.city || '________________',
    '{{client.contactPerson}}': client?.contactPerson || '________________',
    '{{client.email}}': client?.email || '________________',
    '{{client.phone}}': client?.phone || '________________',

    // Contract
    '{{contract.contractNumber}}': contract?.contractNumber || '__________',
    '{{contract.title}}': contract?.title || '__________',
    '{{contract.startDate}}': formatDateDisplay(contract?.startDate) || '__________',
    '{{contract.endDate}}': formatDateDisplay(contract?.endDate) || '__________',
  };

  let resolved = content;
  for (const [key, val] of Object.entries(map)) {
    // Replace all instances of key
    resolved = resolved.split(key).join(val);
  }

  return resolved;
}
