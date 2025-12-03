import { request } from './http.js';

export function fetchArticles(page = 1) {
  const params = new URLSearchParams({ page: String(page) });
  return request(`/articles?${params.toString()}`);
}

export function fetchMyArticles(page = 1) {
  const params = new URLSearchParams({ page: String(page) });
  return request(`/myArticles?${params.toString()}`);
}

export function fetchMyComments(page = 1) {
  const params = new URLSearchParams({ page: String(page) });
  return request(`/articles/MyComments?${params.toString()}`);
}

export function createArticle(payload) {
  return request('/articles', {
    method: 'POST',
    body: payload
  });
}

export function fetchArticleDetail(id) {
  return request(`/articles/${id}`);
}

export function likeArticle(id) {
  return request(`/articles/${id}/likes`, {
    method: 'POST'
  });
}

export function unlikeArticle(id) {
  return request(`/articles/${id}/likes`, {
    method: 'DELETE'
  });
}

export function updateArticle(id, payload) {
  return request(`/articles/${id}`, {
    method: 'PATCH',
    body: payload
  });
}

export function deleteArticle(id) {
  return request(`/articles/${id}`, {
    method: 'DELETE'
  });
}

export function fetchArticleComments(id, page = 1) {
  const params = new URLSearchParams({ page: String(page) });
  return request(`/articles/${id}/comments?${params.toString()}`);
}

export function createComment(id, payload) {
  return request(`/articles/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateComment(articleId, commentId, payload) {
  return request(`/articles/${articleId}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function deleteComment(articleId, commentId) {
  return request(`/articles/${articleId}/comments/${commentId}`, {
    method: 'DELETE'
  });
}
