import { useState, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL;

function useApi(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method = 'GET', body = null, params = {}, pathSuffix = '') => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API}/api${endpoint}${pathSuffix}`);
      Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(localStorage.getItem('wegift_token') && {
          Authorization: `Bearer ${localStorage.getItem('wegift_token')}`,
        }),
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(url, opts);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const json = await res.json();
      setData(json);
      return json;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const get = useCallback((params = {}, suffix = '') => request('GET', null, params, suffix), [request]);
  const post = useCallback((body, suffix = '') => request('POST', body, {}, suffix), [request]);
  const put = useCallback((body, suffix = '') => request('PUT', body, {}, suffix), [request]);
  const del = useCallback((suffix = '') => request('DELETE', null, {}, suffix), [request]);

  return { data, loading, error, get, post, put, del };
}

export default useApi;
