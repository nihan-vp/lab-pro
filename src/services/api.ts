const BASE_URL =
  import.meta.env.VITE_API_URL || 'https://lab-pro-2qns.onrender.com';

const withBase = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${BASE_URL}${url}`;
};

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      const labId = userData?.labId?._id || userData?.labId;
      if (labId) {
        headers['x-lab-id'] = String(labId);
      }
    }
  } catch (error) {
    console.warn('Failed to parse user from localStorage:', error);
  }

  return headers;
};

async function handleResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  let data: any = null;

  if (text) {
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error(`Invalid JSON response: ${text}`);
      }
    } else {
      if (!res.ok) {
        throw new Error(text || `Request failed with status ${res.status}`);
      }
      throw new Error(`Expected JSON response but received: ${text}`);
    }
  }

  if (!res.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        text ||
        `Request failed with status ${res.status}`
    );
  }

  return data;
}

export const api = {
  get: async (url: string) => {
    const res = await fetch(withBase(url), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  post: async (url: string, body: any) => {
    const isFormData = body instanceof FormData;

    const res = await fetch(withBase(url), {
      method: 'POST',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? body : JSON.stringify(body),
    });

    return handleResponse(res);
  },

  put: async (url: string, body: any) => {
    const isFormData = body instanceof FormData;

    const res = await fetch(withBase(url), {
      method: 'PUT',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? body : JSON.stringify(body),
    });

    return handleResponse(res);
  },

  patch: async (url: string, body: any) => {
    const isFormData = body instanceof FormData;

    const res = await fetch(withBase(url), {
      method: 'PATCH',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? body : JSON.stringify(body),
    });

    return handleResponse(res);
  },

  delete: async (url: string) => {
    const res = await fetch(withBase(url), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(res);
  },
};