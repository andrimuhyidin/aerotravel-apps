# Phase 3-4 Settings Testing Checklist

## Overview

This document provides a comprehensive testing checklist for Phase 3-4 Admin Configurable Settings implementation, covering:
- Email Templates & Notification Messages
- Validation Rules
- Template Management UI
- Feature Flags Management

---

## Prerequisites

- [ ] Database migrations have been run (`20260103200001_email-notification-templates.sql`, `20260103200002_seed-templates.sql`)
- [ ] Admin user with `super_admin` role is available
- [ ] Test email address is configured
- [ ] Resend API key is configured in environment variables

---

## Phase 3: Email Templates & Notification Messages

### 3.1 Email Templates Database

- [ ] Email templates table exists (`email_templates`)
- [ ] Notification templates table exists (`notification_templates`)
- [ ] All 7 default email templates are seeded:
  - [ ] `booking_confirmation`
  - [ ] `license_expiry_alert`
  - [ ] `certification_expiry_alert`
  - [ ] `data_breach_notification`
  - [ ] `data_breach_admin`
  - [ ] `assessment_reminder`
  - [ ] `invoice_email`
- [ ] All 4 default notification templates are seeded:
  - [ ] `sos_alert`
  - [ ] `sos_family`
  - [ ] `guide_absence`
  - [ ] `booking_confirmation_wa`

### 3.2 Template Loading & Fallback

- [ ] Email templates load from database successfully
- [ ] Notification templates load from database successfully
- [ ] Fallback to default templates works when DB is unavailable
- [ ] Template cache works correctly (5-minute TTL)
- [ ] Cache invalidation works after template update

### 3.3 Variable Substitution

- [ ] Variable substitution works correctly (`{{variable}}` format)
- [ ] Conditional blocks work (`{{#if variable}}...{{/if}}`)
- [ ] Missing variables are handled gracefully (kept as `{{variable}}`)
- [ ] All template variables are properly substituted in:
  - [ ] Email subject templates
  - [ ] Email HTML body templates
  - [ ] Email text body templates
  - [ ] Notification message templates

### 3.4 Email Functions Integration

- [ ] `sendBookingConfirmationEmail()` uses template from database
- [ ] `sendLicenseExpiryAlert()` uses template from database
- [ ] `sendCertificationExpiryAlert()` uses template from database
- [ ] `sendDataBreachNotification()` uses template from database
- [ ] `sendAssessmentReminder()` uses template from database
- [ ] `sendInvoiceEmail()` uses template from database
- [ ] All email functions fallback to hardcoded templates if DB unavailable

### 3.5 Notification Functions Integration

- [ ] `formatSOSMessageAsync()` uses template from database
- [ ] Guide absence notification uses template from database
- [ ] All notification functions fallback to hardcoded templates if DB unavailable

### 3.6 HTML Sanitization

- [ ] HTML sanitization works in email template preview
- [ ] XSS attempts are blocked (e.g., `<script>`, `onclick`, `javascript:`)
- [ ] Valid HTML is preserved (e.g., `<div>`, `<p>`, `<strong>`)
- [ ] Preview renders correctly with sanitized HTML

---

## Phase 4: Validation Rules

### 4.1 Validation Settings

- [ ] Validation settings load from database
- [ ] `useValidationSettings()` hook works correctly
- [ ] Default validation values are used if DB unavailable
- [ ] Cache works correctly (5-minute TTL)

### 4.2 Package Form Integration

- [ ] Package form uses dynamic validation from database
- [ ] Package code min/max length validation works
- [ ] Package name min/max length validation works
- [ ] Slug min/max length validation works
- [ ] Short description max length validation works
- [ ] Min/max pax validation works
- [ ] Form shows correct error messages based on settings
- [ ] Form works correctly when settings are loading

---

## Optional: Template Management UI

### O.1 Email Template Editor

- [ ] Email templates list loads correctly
- [ ] Template selection works
- [ ] Template editing works (name, subject, HTML body)
- [ ] Code/Preview toggle works
- [ ] HTML preview renders correctly
- [ ] HTML sanitization works in preview
- [ ] Variables list displays correctly
- [ ] Save button works
- [ ] Active/Inactive toggle works
- [ ] Template updates are saved to database
- [ ] Cache is invalidated after update

### O.2 Test Email Functionality

- [ ] "Send Test Email" button is visible
- [ ] Test email dialog opens correctly
- [ ] Email address input validation works
- [ ] Test email API route works (`POST /api/admin/templates/email/[key]/test`)
- [ ] Test email sends successfully
- [ ] Test email contains correct template content
- [ ] Test email subject includes `[TEST]` prefix
- [ ] Sample variables are substituted correctly
- [ ] Error handling works (invalid email, API error)
- [ ] Success/error toasts display correctly
- [ ] Only `super_admin` can send test emails

### O.3 Notification Template Editor

- [ ] Notification templates list loads correctly
- [ ] Template selection works
- [ ] Template editing works (name, message, channel)
- [ ] Channel selection works (WhatsApp, SMS, Push)
- [ ] Message preview displays correctly
- [ ] Character count works (especially for SMS)
- [ ] Variables list displays correctly
- [ ] Save button works
- [ ] Active/Inactive toggle works
- [ ] Template updates are saved to database

### O.4 Feature Flags Manager

- [ ] Feature flags list loads correctly
- [ ] Flag toggle (enable/disable) works
- [ ] Rollout percentage slider works
- [ ] Flag editing works
- [ ] Flag creation works
- [ ] Flag deletion works
- [ ] Only `super_admin` can manage flags

---

## API Routes Testing

### Email Templates API

- [ ] `GET /api/admin/templates/email` - List templates
- [ ] `GET /api/admin/templates/email/[key]` - Get single template
- [ ] `PUT /api/admin/templates/email/[key]` - Update template
- [ ] `POST /api/admin/templates/email/[key]/test` - Send test email
- [ ] `DELETE /api/admin/templates/email/[key]` - Delete template
- [ ] Authorization checks work (super_admin only for write operations)

### Notification Templates API

- [ ] `GET /api/admin/templates/notification` - List templates
- [ ] `GET /api/admin/templates/notification/[key]` - Get single template
- [ ] `PUT /api/admin/templates/notification/[key]` - Update template
- [ ] `DELETE /api/admin/templates/notification/[key]` - Delete template
- [ ] Authorization checks work (super_admin only for write operations)

### Feature Flags API

- [ ] `GET /api/admin/feature-flags` - List flags
- [ ] `GET /api/admin/feature-flags/[key]` - Get single flag
- [ ] `POST /api/admin/feature-flags` - Create flag
- [ ] `PUT /api/admin/feature-flags/[key]` - Update flag
- [ ] `DELETE /api/admin/feature-flags/[key]` - Delete flag
- [ ] Authorization checks work (super_admin only for write operations)

---

## Security Testing

- [ ] HTML sanitization prevents XSS in preview
- [ ] Test email endpoint is restricted to `super_admin` only
- [ ] Template update endpoint is restricted to `super_admin` only
- [ ] Email format validation works in test email endpoint
- [ ] RLS policies work correctly for templates tables
- [ ] Cache invalidation works after sensitive operations

---

## Backward Compatibility

- [ ] All existing email functions still work
- [ ] All existing notification functions still work
- [ ] Package form still works with default validation
- [ ] No breaking changes to existing API routes
- [ ] Existing functionality works when templates are not in DB

---

## Performance Testing

- [ ] Template loading is fast (< 200ms)
- [ ] Template cache reduces database queries
- [ ] Multiple concurrent template requests work correctly
- [ ] Large HTML templates render correctly in preview

---

## Error Handling

- [ ] Database connection errors are handled gracefully
- [ ] Template not found errors are handled
- [ ] Invalid template variables are handled
- [ ] Email sending errors are handled
- [ ] API errors display user-friendly messages

---

## Browser Compatibility

- [ ] Email template editor works in Chrome
- [ ] Email template editor works in Firefox
- [ ] Email template editor works in Safari
- [ ] HTML preview renders correctly in all browsers
- [ ] Dialog/modal works correctly in all browsers

---

## Notes

- This is a manual testing checklist
- Automated tests can be added in future phases
- Test in both development and staging environments
- Verify all changes work with existing data
- Document any issues found during testing

---

## Test Results

**Date:** _______________
**Tester:** _______________
**Environment:** _______________

**Overall Status:** [ ] Pass [ ] Fail [ ] Partial

**Issues Found:**
1. 
2. 
3. 

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

