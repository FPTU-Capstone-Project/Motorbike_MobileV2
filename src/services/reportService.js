import apiService, { ApiError } from './api';
import { ENDPOINTS } from '../config/api';

class ReportService {
  constructor() {
    this.apiService = apiService;
  }

  /**
   * Submit a report to admin
   * @param {string} reportType - Type of report (SAFETY, TECHNICAL, PAYMENT, OTHER)
   * @param {string} description - Description of the issue
   * @param {string} priority - Priority level (LOW, MEDIUM, HIGH)
   * @returns {Promise<Object>} Report response
   */
  async submitReport(reportType, description, priority = 'MEDIUM') {
    try {
      const requestBody = {
        reportType: reportType,
        description: description,
        priority: priority,
      };

      const response = await this.apiService.post(
        ENDPOINTS.USER_REPORTS.SUBMIT,
        requestBody
      );

      return {
        success: true,
        data: response,
        reportId: response.id || response.reportId,
        message: response.message || 'Báo cáo đã được gửi thành công',
      };
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  }

  /**
   * Get user's own reports
   * @param {number} page - Page number (default: 0)
   * @param {number} size - Page size (default: 20)
   * @returns {Promise<Object>} Reports list
   */
  async getMyReports(page = 0, size = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      const response = await this.apiService.get(
        `${ENDPOINTS.USER_REPORTS.MY_REPORTS}?${params.toString()}`
      );

      return response;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  /**
   * Get report type display text
   * @param {string} type - Report type
   * @returns {string} Display text
   */
  getReportTypeText(type) {
    const typeMap = {
      SAFETY: 'An toàn',
      BEHAVIOR: 'Hành vi',
      RIDE_EXPERIENCE: 'Trải nghiệm chuyến đi',
      PAYMENT: 'Thanh toán',
      ROUTE: 'Tuyến đường',
      TECHNICAL: 'Kỹ thuật',
      OTHER: 'Khác',
    };
    return typeMap[type] || type;
  }

  /**
   * Get priority display text
   * @param {string} priority - Priority level
   * @returns {string} Display text
   */
  getPriorityText(priority) {
    const priorityMap = {
      LOW: 'Thấp',
      MEDIUM: 'Trung bình',
      HIGH: 'Cao',
      URGENT: 'Khẩn cấp',
    };
    return priorityMap[priority] || priority;
  }

  /**
   * Get status display text
   * @param {string} status - Report status
   * @returns {string} Display text
   */
  getStatusText(status) {
    const statusMap = {
      PENDING: 'Đang chờ',
      IN_PROGRESS: 'Đang xử lý',
      RESOLVED: 'Đã giải quyết',
      CLOSED: 'Đã đóng',
      REJECTED: 'Đã từ chối',
    };
    return statusMap[status] || status;
  }
}

// Create and export singleton instance
const reportService = new ReportService();
export default reportService;

