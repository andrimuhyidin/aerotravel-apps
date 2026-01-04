/**
 * Template Utilities
 * Variable substitution and helper functions for templates
 */

/**
 * Substitute variables in a template string
 * Variables are in the format {{variable_name}}
 *
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns Template with variables substituted
 */
export function substituteVariables(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key];
    if (value === undefined || value === null) {
      return match; // Keep original placeholder if no value
    }
    return String(value);
  });
}

/**
 * Substitute variables with conditional sections
 * Supports {{#if variable}}...{{/if}} blocks
 *
 * @param template - Template string with conditionals
 * @param variables - Object with variable values
 * @returns Template with variables and conditionals processed
 */
export function substituteWithConditionals(
  template: string,
  variables: Record<string, string | number | boolean | undefined | null>
): string {
  // First process conditional blocks
  let result = template.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key: string, content: string) => {
      const value = variables[key];
      // Show content if value is truthy
      if (value && value !== '' && value !== 0) {
        return content;
      }
      return '';
    }
  );

  // Then substitute variables
  result = substituteVariables(result, variables);

  return result;
}

/**
 * Extract variable names from a template
 *
 * @param template - Template string
 * @returns Array of variable names found in template
 */
export function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  const variables = new Set<string>();

  for (const match of matches) {
    const key = match[1];
    if (key) {
      variables.add(key);
    }
  }

  return Array.from(variables);
}

/**
 * Validate that all required variables are provided
 *
 * @param template - Template string
 * @param variables - Provided variables
 * @returns Object with isValid and missing variables
 */
export function validateVariables(
  template: string,
  variables: Record<string, unknown>
): { isValid: boolean; missing: string[] } {
  const required = extractVariables(template);
  const missing = required.filter((key) => !(key in variables));

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Sanitize HTML content to prevent XSS
 * Basic sanitization - for more complex needs use DOMPurify
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

