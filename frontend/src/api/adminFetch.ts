const API = import.meta.env.VITE_API_BASE_URL || '';

function handleUnauthorized() {
  localStorage.removeItem('adminToken');
  window.location.href = '/admin';
}

export function getAdminToken() {
  return localStorage.getItem('adminToken') || '';
}

export function adminAuthHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${getAdminToken()}` };
}

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...adminAuthHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (res.status === 401) {
    handleUnauthorized();
    // Return a never-resolving promise so the caller doesn't continue
    return new Promise(() => {});
  }
  return res;
}
