/** Fixed local stub user — no auth. Rebuild real auth later. */
export const STUB_USER_ID = '00000000-0000-4000-8000-000000000001';

export const STUB_USER = {
  id: STUB_USER_ID,
  email: 'admin@local.dev',
  user_metadata: {
    full_name: 'Local Admin',
    project: 'HQ',
    title: 'System Administrator',
  },
  app_metadata: {},
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
};

export const STUB_SESSION = {
  access_token: 'local-stub-token',
  refresh_token: 'local-stub-refresh',
  expires_in: 60 * 60 * 24 * 365,
  token_type: 'bearer',
  user: STUB_USER,
};

export type StubUser = typeof STUB_USER;
export type StubSession = typeof STUB_SESSION;
