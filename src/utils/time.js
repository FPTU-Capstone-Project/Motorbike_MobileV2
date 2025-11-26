// Utility helpers to consistently parse backend timestamps.
// Backend sometimes returns local VN timestamps but appends `Z`,
// which makes JS treat them as UTC and add +7h. We strip the suffix
// and parse as local to keep displayed times aligned with server values.
export const parseBackendDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;

  try {
    const raw =
      typeof value === 'string' && value.endsWith('Z')
        ? value.slice(0, -1)
        : value;

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch (error) {
    console.warn('parseBackendDate error', error, value);
    return null;
  }
};

export default { parseBackendDate };
