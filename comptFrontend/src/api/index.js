function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Une erreur est survenue')
  }
  return data
}

export const auth = {
  register: (email, password, user_role, first_name, last_name) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, user_role, first_name, last_name }),
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  changePassword: (current_password, new_password) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    }),
}

export const companies = {
  getAll: () => request('/companies'),

  getOne: (id) => request(`/companies/${id}`),

  delete: (id) => request(`/companies/${id}`, { method: 'DELETE' }),

  create: (data) =>
    request('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const accounting = {
  summary: () => request('/accounting/summary'),
}

export const profile = {
  get:          ()              => request('/profile'),
  update:       (data)          => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getTeam:      ()              => request('/profile/team'),
  invite:       (data)          => request('/profile/invite', { method: 'POST', body: JSON.stringify(data) }),
  removeMember: (memberId)      => request(`/profile/team/${memberId}`, { method: 'DELETE' }),
  getInvite:    (token)         => request(`/profile/accept-invite/${token}`),
}

export const superAdmin = {
  getUsers:     ()         => request('/super-admin/users'),
  approve:      (id)       => request(`/super-admin/users/${id}/approve`,      { method: 'POST' }),
  reject:       (id, reason) => request(`/super-admin/users/${id}/reject`,     { method: 'POST', body: JSON.stringify({ reason }) }),
  revoke:       (id)       => request(`/super-admin/users/${id}/revoke`,       { method: 'POST' }),
  resend:       (id)       => request(`/super-admin/users/${id}/resend`,       { method: 'POST' }),
  toggleAdmin:  (id)       => request(`/super-admin/users/${id}/toggle-admin`, { method: 'POST' }),
}

export const transactions = {
  getAll: (companyId) => request(`/companies/${companyId}/transactions`),

  create: (companyId, data) =>
    request(`/companies/${companyId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  patch: (companyId, txId, data) =>
    request(`/companies/${companyId}/transactions/${txId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (companyId, txId) =>
    request(`/companies/${companyId}/transactions/${txId}`, {
      method: 'DELETE',
    }),
}
