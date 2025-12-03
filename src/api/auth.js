import { request } from './http.js';

export function signup(payload) {
  return request('/users/signup', {
    method: 'POST',
    body: payload
  });
}

export function login(credentials) {
  return request('/users/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
    suppressUnauthorizedEvent: true
  });
}

export function logout() {
  return request('/users/logout', {
    method: 'POST'
  });
}

export function updateAccount(payload) {
  return request('/users/account', {
    method: 'PATCH',
    body: payload
  });
}

export function deleteAccount() {
  return request('/users/account', {
    method: 'DELETE'
  });
}

export function changePassword(currentPassword, newPassword) {
  const params = new URLSearchParams({
    currentPassword,
    newPassword
  });
  return request(`/users/account/password?${params.toString()}`, {
    method: 'PATCH'
  });
}
