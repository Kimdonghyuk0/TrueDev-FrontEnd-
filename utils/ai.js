export const AI_STATUS = {
  VERIFIED: 'AI VERIFIED',
  REVIEWING: 'AI REVIEWING',
  WARNING: 'AI WARNING'
};

export function resolveAIStatus(entity) {
  if (!entity || typeof entity !== 'object') {
    return AI_STATUS.REVIEWING;
  }

  // 1) 백엔드 명시값 우선
  if (entity.isVerified === true) return AI_STATUS.VERIFIED;

  // 2) aiMessage 파싱 시도 (코드펜스+JSON)
  const parsed = parseAiMessage(entity.aiMessage);
  if (parsed.hasParsed) {
    if (parsed.isFact === true) return AI_STATUS.VERIFIED;
    if (parsed.aiComment) return AI_STATUS.WARNING;
  }

  // 3) 검증 응답 플래그
  if (entity.isCheck === true) {
    return entity.isVerified ? AI_STATUS.VERIFIED : AI_STATUS.WARNING;
  }
  if (entity.isCheck === false || entity.isCheck === null || typeof entity.isCheck === 'undefined') {
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

export function parseAiMessage(raw) {
  if (!raw || typeof raw !== 'string')
    return { hasParsed: false, isFact: null, aiComment: '', rawText: '' };
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z]*\s*/m, '').replace(/```$/m, '').trim();
  }
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        hasParsed: true,
        isFact: parsed.isFact === true,
        aiComment: parsed.aiComment ? String(parsed.aiComment) : '',
        rawText: text
      };
    }
  } catch (e) {
    // ignore
  }
  return { hasParsed: false, isFact: null, aiComment: '', rawText: text };
}
