import type { Service } from '../types';

export const isWasteDisposalService = (srv?: Service | null): boolean => {
  if (!srv) return false;
  const code = (srv.code || '').toLowerCase().trim();
  const name = (srv.name || '').toLowerCase().trim();
  return (
    code === 'waste-disposal' ||
    code === 'zbrinjavanje' ||
    code === 'zbrinjavanje-otpada' ||
    code === 'odlaganje' ||
    code === 'odlaganje-otpada' ||
    code.includes('disposal') ||
    code.includes('zbrinjavanje') ||
    code.includes('odlaganje') ||
    name === 'waste disposal' ||
    name === 'zbrinjavanje otpada' ||
    name === 'збрињавање отпада' ||
    name === 'odlaganje otpada' ||
    name === 'одлагање отпада' ||
    name.includes('disposal') ||
    name.includes('zbrinjavanje') ||
    name.includes('збрињавање') ||
    name.includes('odlaganje') ||
    name.includes('одлагање')
  );
};
