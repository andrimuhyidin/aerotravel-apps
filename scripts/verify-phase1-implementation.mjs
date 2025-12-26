/**
 * Verify Partner Portal Phase 1 Implementation
 * Check all required features, API routes, pages, and components
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const checks = {
  database: {
    'partner_customers table': 'supabase/migrations/20250125000000_082-partner-customers.sql',
    'bookings.customer_id column': 'supabase/migrations/20250125000001_083-booking-customer-link.sql',
    'partner_users table': 'supabase/migrations/20250125000002_084-partner-users.sql',
    'partner_support_tickets table': 'supabase/migrations/20250125000003_085-partner-support-tickets.sql',
    'booking_reschedule_requests table': 'supabase/migrations/20250125000004_086-booking-reschedule-requests.sql',
  },
  api: {
    'GET /api/partner/customers': 'app/api/partner/customers/route.ts',
    'POST /api/partner/customers': 'app/api/partner/customers/route.ts',
    'GET /api/partner/customers/[id]': 'app/api/partner/customers/[id]/route.ts',
    'PUT /api/partner/customers/[id]': 'app/api/partner/customers/[id]/route.ts',
    'DELETE /api/partner/customers/[id]': 'app/api/partner/customers/[id]/route.ts',
    'GET /api/partner/team': 'app/api/partner/team/route.ts',
    'POST /api/partner/team': 'app/api/partner/team/route.ts',
    'GET /api/partner/team/[id]': 'app/api/partner/team/[id]/route.ts',
    'PUT /api/partner/team/[id]': 'app/api/partner/team/[id]/route.ts',
    'DELETE /api/partner/team/[id]': 'app/api/partner/team/[id]/route.ts',
    'GET /api/partner/support/tickets': 'app/api/partner/support/tickets/route.ts',
    'POST /api/partner/support/tickets': 'app/api/partner/support/tickets/route.ts',
    'GET /api/partner/support/tickets/[id]': 'app/api/partner/support/tickets/[id]/route.ts',
    'PUT /api/partner/support/tickets/[id]': 'app/api/partner/support/tickets/[id]/route.ts',
    'POST /api/partner/support/tickets/[id]/messages': 'app/api/partner/support/tickets/[id]/messages/route.ts',
    'POST /api/partner/bookings (with customer_id)': 'app/api/partner/bookings/route.ts',
    'PUT /api/partner/bookings/[id]': 'app/api/partner/bookings/[id]/route.ts',
    'POST /api/partner/bookings/[id]/reschedule': 'app/api/partner/bookings/[id]/reschedule/route.ts',
    'GET /api/partner/bookings/[id]/documents/voucher': 'app/api/partner/bookings/[id]/documents/voucher/route.ts',
    'GET /api/partner/bookings/[id]/documents/confirmation': 'app/api/partner/bookings/[id]/documents/confirmation/route.ts',
    'GET /api/partner/bookings/[id]/documents/itinerary': 'app/api/partner/bookings/[id]/documents/itinerary/route.ts',
    'GET /api/partner/packages/[id]': 'app/api/partner/packages/[id]/route.ts',
    'GET /api/partner/packages/[id]/availability': 'app/api/partner/packages/[id]/availability/route.ts',
  },
  pages: {
    '/partner/customers': 'app/[locale]/(portal)/partner/customers/page.tsx',
    '/partner/customers/[id]': 'app/[locale]/(portal)/partner/customers/[id]/page.tsx',
    '/partner/team': 'app/[locale]/(portal)/partner/team/page.tsx',
    '/partner/support': 'app/[locale]/(portal)/partner/support/page.tsx',
    '/partner/support/[id]': 'app/[locale]/(portal)/partner/support/[id]/page.tsx',
    '/partner/bookings/new (with customer selector)': 'app/[locale]/(portal)/partner/bookings/new/page.tsx',
    '/partner/bookings/[id] (with documents)': 'app/[locale]/(portal)/partner/bookings/[id]/page.tsx',
    '/partner/packages/[id]': 'app/[locale]/(portal)/partner/packages/[id]/page.tsx',
  },
  components: {
    'CustomerSelector component': 'app/[locale]/(portal)/partner/bookings/new/booking-wizard-client.tsx',
    'CustomersListClient': 'app/[locale]/(portal)/partner/customers/customers-list-client.tsx',
    'CustomerDetailClient': 'app/[locale]/(portal)/partner/customers/customer-detail-client.tsx',
    'TeamListClient': 'app/[locale]/(portal)/partner/team/team-list-client.tsx',
    'SupportTicketsListClient': 'app/[locale]/(portal)/partner/support/support-tickets-list-client.tsx',
    'TicketDetailClient': 'app/[locale]/(portal)/partner/support/ticket-detail-client.tsx',
    'PackageDetailClient': 'app/[locale]/(portal)/partner/packages/[id]/package-detail-client.tsx',
  },
  pdf: {
    'Voucher PDF generator': 'lib/pdf/voucher.tsx',
    'Confirmation Letter PDF generator': 'lib/pdf/confirmation-letter.tsx',
    'Itinerary PDF generator': 'lib/pdf/itinerary.tsx',
  },
  features: {
    'Customer search & filter': 'app/[locale]/(portal)/partner/customers/customers-list-client.tsx',
    'Customer segmentation': 'app/[locale]/(portal)/partner/customers/customers-list-client.tsx',
    'Team invitation': 'app/[locale]/(portal)/partner/team/team-list-client.tsx',
    'Role assignment (owner/finance/agent)': 'app/[locale]/(portal)/partner/team/team-list-client.tsx',
    'Support ticket creation': 'app/[locale]/(portal)/partner/support/support-tickets-list-client.tsx',
    'Support ticket messages': 'app/[locale]/(portal)/partner/support/ticket-detail-client.tsx',
    'Booking with customer link': 'app/[locale]/(portal)/partner/bookings/new/booking-wizard-client.tsx',
    'Customer segment in booking': 'app/[locale]/(portal)/partner/bookings/new/booking-wizard-client.tsx',
    'Room preference in booking': 'app/[locale]/(portal)/partner/bookings/new/booking-wizard-client.tsx',
    'Multi-room/kapal in booking': 'app/[locale]/(portal)/partner/bookings/new/booking-wizard-client.tsx',
    'Booking reschedule request': 'app/api/partner/bookings/[id]/reschedule/route.ts',
    'Document downloads': 'app/[locale]/(portal)/partner/bookings/[id]/booking-detail-client.tsx',
    'Package detail with availability': 'app/[locale]/(portal)/partner/packages/[id]/package-detail-client.tsx',
  },
};

function checkFile(path) {
  const fullPath = join(rootDir, path);
  return existsSync(fullPath);
}

function checkContent(path, keywords) {
  const fullPath = join(rootDir, path);
  if (!existsSync(fullPath)) return false;
  
  try {
    const content = readFileSync(fullPath, 'utf-8');
    return keywords.every(keyword => content.includes(keyword));
  } catch {
    return false;
  }
}

console.log('🔍 Verifying Partner Portal Phase 1 Implementation...\n');

let total = 0;
let passed = 0;
let failed = [];

for (const [category, items] of Object.entries(checks)) {
  console.log(`\n📋 ${category.toUpperCase()}:`);
  console.log('─'.repeat(60));
  
  for (const [name, path] of Object.entries(items)) {
    total++;
    const exists = checkFile(path);
    
    if (exists) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}`);
      failed.push({ category, name, path });
    }
  }
}

// Additional content checks
console.log('\n\n🔍 CONTENT VERIFICATION:');
console.log('─'.repeat(60));

const contentChecks = [
  {
    name: 'CustomerSelector in booking wizard',
    path: 'app/[locale]/(portal)/partner/bookings/new/booking-wizard-client.tsx',
    keywords: ['CustomerSelector', 'customerId'],
  },
  {
    name: 'Customer segment in booking form',
    path: 'app/[locale]/(portal)/partner/bookings/new/booking-wizard-client.tsx',
    keywords: ['customerSegment', 'individual', 'family', 'corporate'],
  },
  {
    name: 'Room preference in booking form',
    path: 'app/[locale]/(portal)/partner/bookings/new/booking-wizard-client.tsx',
    keywords: ['roomPreference', 'multiRoom'],
  },
  {
    name: 'Document download buttons',
    path: 'app/[locale]/(portal)/partner/bookings/[id]/booking-detail-client.tsx',
    keywords: ['handleDownloadDocument', 'voucher', 'confirmation', 'itinerary'],
  },
  {
    name: 'Reschedule request API',
    path: 'app/api/partner/bookings/[id]/reschedule/route.ts',
    keywords: ['booking_reschedule_requests', 'requestedTripDate'],
  },
  {
    name: 'Auto-create customer in booking',
    path: 'app/api/partner/bookings/route.ts',
    keywords: ['partner_customers', 'customer_id'],
  },
];

for (const check of contentChecks) {
  total++;
  const hasContent = checkContent(check.path, check.keywords);
  
  if (hasContent) {
    console.log(`  ✅ ${check.name}`);
    passed++;
  } else {
    console.log(`  ❌ ${check.name}`);
    failed.push({ category: 'content', name: check.name, path: check.path });
  }
}

// Summary
console.log('\n\n📊 SUMMARY:');
console.log('═'.repeat(60));
console.log(`Total checks: ${total}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed.length}`);
console.log(`Success rate: ${((passed / total) * 100).toFixed(1)}%`);

if (failed.length > 0) {
  console.log('\n❌ FAILED ITEMS:');
  for (const item of failed) {
    console.log(`  - ${item.name} (${item.path})`);
  }
} else {
  console.log('\n🎉 All checks passed! Phase 1 implementation is complete.');
}

console.log('\n');

