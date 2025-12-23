// Re-export from dateUtils for backward compatibility
// Backend API returns dates in Vietnam timezone (UTC+7)
export { parseBackendDate } from './dateUtils';

export default { parseBackendDate: require('./dateUtils').parseBackendDate };
