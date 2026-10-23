import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ baseURL }) => {
  const testUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Admin',
    isApproved: true,
    status: 'ACTIVE',
    roleEntity: {
      id: 1,
      name: 'Admin',
      isSystemAdmin: true,
      permissions: {},
    },
  };
  const token = 'fake-jwt-token';
  const expiresAt = (Date.now() + 24 * 3600 * 1000).toString();

  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const origin = baseURL || 'http://localhost:3000';
  const storageState = {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [
          { name: 'auth_user', value: JSON.stringify(testUser) },
          { name: 'auth_token', value: token },
          { name: 'auth_session_expires_at', value: expiresAt },
        ],
      },
    ],
  };

  fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
});
