const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers: any = {
    'Accept': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  
  // Add lab context header if available
  try {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      const labId = userData.labId?._id || userData.labId;
      if (labId) headers['x-lab-id'] = labId;
    }
  } catch (e) {
    // Silently ignore parse errors
  }
  
  return headers;
};

async function handleResponse(res: Response) {
  const text = await res.text();
  let json: any = null;
  
  try {
    if (text) json = JSON.parse(text);
  } catch (e) {
    if (!res.ok) throw new Error(text || `Error ${res.status}`);
    throw new Error('Invalid server response format');
  }

  if (!res.ok) {
    throw new Error(json?.error || json?.message || text || 'API Request failed');
  }

  return json;
}

export const api = {
  get: async (url: string) => {
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },
  post: async (url: string, data: any) => {
    const isFormData = data instanceof FormData;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data)
    });
    return handleResponse(res);
  },
  put: async (url: string, data: any) => {
    const isFormData = data instanceof FormData;
    const res = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data)
    });
    return handleResponse(res);
  },
  delete: async (url: string) => {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};
