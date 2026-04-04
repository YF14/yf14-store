/**
 * Backend liveness check (GET /api/health). Uses fetch so we avoid axios interceptors.
 */

export function getHealthCheckUrl() {
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
  return `${base}/health`;
}

/**
 * @param {AbortSignal} [signal]
 * @returns {Promise<boolean>}
 */
export async function checkApiHealth(signal) {
  try {
    const res = await fetch(getHealthCheckUrl(), {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      signal,
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return data.status === 'ok';
  } catch {
    return false;
  }
}
