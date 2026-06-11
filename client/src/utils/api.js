const API = process.env.REACT_APP_API_URL;

function authHeaders() {
  const token = localStorage.getItem('wegift_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api(method, path, body = null, params = {}) {
  const url = new URL(`${API}/api${path}`);
  Object.entries(params).forEach(([k, v]) => { if (v != null) url.searchParams.set(k, v); });
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error (${res.status})`);
  }
  return res.json();
}

export const get = (path, params) => api('GET', path, null, params);
export const post = (path, body) => api('POST', path, body);
export const put = (path, body) => api('PUT', path, body);
export const del = (path) => api('DELETE', path);
