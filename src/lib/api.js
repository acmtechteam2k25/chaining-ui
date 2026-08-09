const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const TOKEN_KEY = 'apiVault.token'
const CODE_KEY = 'apiVault.code'
const ADMIN_KEY = 'apiVault.adminSecret'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function getSession() {
  return {
    token: localStorage.getItem(TOKEN_KEY) ?? '',
    code: localStorage.getItem(CODE_KEY) ?? '',
  }
}

export function saveSession({ token, code }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(CODE_KEY, code)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(CODE_KEY)
}

export function getAdminSecret() {
  return sessionStorage.getItem(ADMIN_KEY) ?? ''
}

export function saveAdminSecret(secret) {
  sessionStorage.setItem(ADMIN_KEY, secret)
}

export function clearAdminSecret() {
  sessionStorage.removeItem(ADMIN_KEY)
}

async function request(path, { method = 'GET', body, auth = false, admin = false } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const { token } = getSession()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  if (admin) headers['X-Admin-Secret'] = getAdminSecret()

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Cannot reach the contest server.', 0, null)
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(data?.message ?? 'The request failed.', response.status, data)
  }
  return data
}

export const contestApi = {
  status: () => request('/api/contest/status'),
  join: (code) => request('/api/contest/join', { method: 'POST', body: { code } }),
  me: () => request('/api/contest/me', { auth: true }),
  attempt: (path) => request('/api/contest/attempt', { method: 'POST', body: { path }, auth: true }),
  leaderboard: () => request('/api/contest/leaderboard'),
}

export const adminApi = {
  overview: () => request('/api/admin/overview', { admin: true }),
  open: (durationMinutes) =>
    request('/api/admin/contest/open', { method: 'POST', body: { durationMinutes }, admin: true }),
  close: () => request('/api/admin/contest/close', { method: 'POST', body: {}, admin: true }),
  seed: ({ prefix, from, to }) =>
    request('/api/admin/participants/seed', {
      method: 'POST',
      body: { prefix, from, to },
      admin: true,
    }),
  addCodes: (codes) =>
    request('/api/admin/participants', { method: 'POST', body: { codes }, admin: true }),
  rename: (code, displayName) =>
    request(`/api/admin/participants/${encodeURIComponent(code)}`, {
      method: 'PATCH',
      body: { displayName },
      admin: true,
    }),
  reset: (code) =>
    request(`/api/admin/participants/${encodeURIComponent(code)}/reset`, {
      method: 'POST',
      body: {},
      admin: true,
    }),
  finish: (code) =>
    request(`/api/admin/participants/${encodeURIComponent(code)}/finish`, {
      method: 'POST',
      body: {},
      admin: true,
    }),
}
