import { describe, it, expect } from 'vitest';
import { resolveContractPlaceholders } from './contractTemplatePlaceholders';

describe('resolveContractPlaceholders', () => {
  it('replaces Ekos, Client, and Contract placeholders', () => {
    const template = `
      <p>Ovaj ugovor zaključuju {{ekos.legalName}}, sa sedištem u {{ekos.city}}, PIB: {{ekos.taxId}}</p>
      <p>i naručilac {{client.name}}, iz grada {{client.city}}.</p>
      <p>Predmet: {{contract.title}} (Broj: {{contract.contractNumber}}), važi do {{contract.endDate}}.</p>
    `;

    const result = resolveContractPlaceholders(template, {
      ekos: {
        legalName: 'EKOS GREEN GROUP DOO Kraljevo',
        city: 'KRALJEVO',
        taxId: '113207057',
      },
      client: {
        name: 'Alfa Pro DOO',
        city: 'Kragujevac',
      },
      contract: {
        title: 'Zbrinjavanje opasnog otpada',
        contractNumber: 'UGOV-2026-99',
        endDate: '2026-12-31',
      },
    });

    expect(result).toContain('EKOS GREEN GROUP DOO Kraljevo');
    expect(result).toContain('PIB: 113207057');
    expect(result).toContain('Alfa Pro DOO');
    expect(result).toContain('Kragujevac');
    expect(result).toContain('UGOV-2026-99');
    expect(result).toContain('31.12.2026.');
  });

  it('uses graceful fallbacks when context values are missing', () => {
    const template = 'Klijent: {{client.name}}';
    const result = resolveContractPlaceholders(template, {});
    expect(result).toBe('Klijent: ________________________');
  });
});
