/**
 * Templates Module
 * Export all template utilities and services
 */

// Utils
export {
  substituteVariables,
  substituteWithConditionals,
  extractVariables,
  validateVariables,
  sanitizeHtml,
} from './utils';

// Email Templates
export {
  getEmailTemplate,
  getAllEmailTemplates,
  processEmailTemplate,
  processEmailTemplateWithFallback,
  clearEmailTemplateCache,
  type EmailTemplate,
  type ProcessedEmailTemplate,
} from './email';

// Notification Templates
export {
  getNotificationTemplate,
  getAllNotificationTemplates,
  processNotificationTemplate,
  processNotificationTemplateWithFallback,
  clearNotificationTemplateCache,
  type NotificationTemplate,
  type NotificationChannel,
} from './notification';

