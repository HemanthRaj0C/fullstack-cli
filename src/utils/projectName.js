export const PROJECT_NAME_MAX_LENGTH = 50;
export const PROJECT_NAME_ALLOWED_TEXT = 'letters, numbers, dashes (-), and underscores (_), starting with a letter or number';

const PROJECT_NAME_BASIC_PATTERN = /^[a-zA-Z0-9_-]+$/;
const PROJECT_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

export function sanitizeProjectName(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/_+/g, '_')
    .replace(/^[-_]+|[-_]+$/g, '');
}

export function validateProjectName(value) {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    return {
      valid: false,
      reason: 'Project name is required.'
    };
  }

  if (trimmed.length > PROJECT_NAME_MAX_LENGTH) {
    return {
      valid: false,
      reason: `Project name must be ${PROJECT_NAME_MAX_LENGTH} characters or fewer.`
    };
  }

  if (!PROJECT_NAME_BASIC_PATTERN.test(trimmed)) {
    const suggestion = sanitizeProjectName(trimmed);
    return {
      valid: false,
      reason: 'Project name contains unsupported characters.',
      suggestion: suggestion || null
    };
  }

  if (!PROJECT_NAME_PATTERN.test(trimmed)) {
    const suggestion = sanitizeProjectName(trimmed);
    return {
      valid: false,
      reason: 'Project name must start with a letter or number.',
      suggestion: suggestion || null
    };
  }

  return {
    valid: true,
    value: trimmed
  };
}

export function resolveProjectNameInput(value, options = {}) {
  const { autoSanitize = false } = options;
  const raw = String(value ?? '').trim();
  const validation = validateProjectName(raw);

  if (validation.valid) {
    return {
      ok: true,
      value: validation.value,
      wasSanitized: false,
      original: raw
    };
  }

  if (autoSanitize) {
    const sanitized = sanitizeProjectName(raw);
    const sanitizedValidation = validateProjectName(sanitized);

    if (sanitizedValidation.valid) {
      return {
        ok: true,
        value: sanitizedValidation.value,
        wasSanitized: sanitizedValidation.value !== raw,
        original: raw
      };
    }
  }

  return {
    ok: false,
    reason: validation.reason,
    suggestion: validation.suggestion || null,
    original: raw
  };
}
