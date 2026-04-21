const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

const BASE_URL = import.meta.env.VITE_API_URL || '';

function withBase(url: string) {
  // Only prepend BASE_URL if url starts with '/'
  if (url.startsWith('/')) return BASE_URL + url;
  return url;
}

export const api = {
  get: async (url: string) => {
    const res = await fetch(withBase(url), { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  post: async (url: string, data: any) => {
    const res = await fetch(withBase(url), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  put: async (url: string, data: any) => {
    const res = await fetch(withBase(url), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  delete: async (url: string) => {
    const res = await fetch(withBase(url), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
