export const AI_STATUS = {
  VERIFIED: 'AI VERIFIED',
  REVIEWING: 'AI REVIEWING',
  WARNING: 'AI WARNING'
};

export function resolveAIStatus(entity) {
  if (!entity || typeof entity !== 'object') {
    return AI_STATUS.REVIEWING;
  }

  const normalized = typeof entity.aiStatus === 'string' ? entity.aiStatus.toUpperCase() : '';
  if (normalized.includes('WARN')) return AI_STATUS.WARNING;
  if (normalized.includes('VERIFY')) return AI_STATUS.VERIFIED;
  if (normalized.includes('REVIEW')) return AI_STATUS.REVIEWING;

  const base =
    Number(entity.viewCount ?? 0) * 3 +
    Number(entity.commentCount ?? 0) * 5 +
    Number(entity.likeCount ?? 0) * 7 +
    Number(entity.postId ?? entity.id ?? 0) +
    13;

  if (!Number.isFinite(base)) {
    return AI_STATUS.REVIEWING;
  }

  const mod = Math.abs(base % 12);
  if (mod <= 2) return AI_STATUS.WARNING;
  if (mod <= 6) return AI_STATUS.REVIEWING;
  return AI_STATUS.VERIFIED;
}
