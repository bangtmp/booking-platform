export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER";
  tenantId: string;
}

export const MOCK_USER: MockUser = {
  id: "demo-user",
  name: "Demo Owner",
  email: "demo@demo.local",
  role: "OWNER",
  tenantId: "demo-tenant",
};

export function getMockSession() {
  return {
    user: MOCK_USER,
    session: { expiresAt: new Date("2099-01-01") },
  };
}

export function requireMockUser() {
  return MOCK_USER;
}

export function signOutMock() {
  return Promise.resolve();
}
