const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

export const api = {
  get: async (url: string) => {
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  post: async (url: string, data: any) => {
    const isFormData = data instanceof FormData;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  put: async (url: string, data: any) => {
    const isFormData = data instanceof FormData;
    const res = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  delete: async (url: string) => {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
