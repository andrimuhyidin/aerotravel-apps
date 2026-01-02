/**
 * AI Corporate Assistant
 * Context-aware AI assistant for corporate travel management
 * Provides insights on budget, spending, and travel policies
 */

import { chat } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type CorporateContext = {
  corporateId: string;
  companyName: string;
  budget: {
    total: number;
    used: number;
    remaining: number;
    usagePercentage: number;
  };
  employees: {
    total: number;
    active: number;
    pendingInvitations: number;
  };
  pendingApprovals: number;
  recentBookings: {
    count: number;
    totalAmount: number;
  };
  departmentStats?: Array<{
    department: string;
    budget: number;
    spent: number;
    bookings: number;
  }>;
  topSpenders?: Array<{
    name: string;
    department: string;
    trips: number;
    spending: number;
  }>;
  alerts?: Array<{
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
};

const SYSTEM_PROMPT = `You are an AI assistant for corporate travel management. You help HR and Travel Managers make informed decisions about travel budgets and bookings.

You have access to real-time corporate data including:
- Total budget and spending across departments
- Number of employees and their travel activity
- Pending booking approvals
- Recent bookings and spending trends
- Department-level statistics
- Top travelers and their spending patterns

Your role:
1. Answer questions about corporate travel budget and spending
2. Provide insights on spending patterns and trends
3. Suggest cost optimization opportunities
4. Help with travel policy questions
5. Alert about budget concerns or anomalies
6. Assist with approval decisions

Guidelines:
- Be concise and data-driven
- Provide specific numbers when available
- Suggest actionable recommendations
- Flag potential issues proactively
- Use Indonesian (Bahasa Indonesia) by default

Format numbers in Indonesian style (1.000.000 for one million).
Be friendly but professional.`;

/**
 * Format currency in Indonesian style
 */
function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Build context string from corporate data
 */
function buildContextString(context: CorporateContext): string {
  const lines: string[] = [
    `=== DATA CORPORATE: ${context.companyName} ===`,
    '',
    '📊 OVERVIEW BUDGET:',
    `- Total Budget: ${formatRupiah(context.budget.total)}`,
    `- Terpakai: ${formatRupiah(context.budget.used)} (${context.budget.usagePercentage}%)`,
    `- Sisa: ${formatRupiah(context.budget.remaining)}`,
    '',
    '👥 KARYAWAN:',
    `- Total: ${context.employees.total} karyawan`,
    `- Aktif: ${context.employees.active} karyawan`,
    `- Pending Invitation: ${context.employees.pendingInvitations}`,
    '',
    '📋 AKTIVITAS:',
    `- Pending Approvals: ${context.pendingApprovals} booking`,
    `- Recent Bookings (30 hari): ${context.recentBookings.count} booking`,
    `- Total Spending (30 hari): ${formatRupiah(context.recentBookings.totalAmount)}`,
  ];

  // Department stats
  if (context.departmentStats && context.departmentStats.length > 0) {
    lines.push('');
    lines.push('🏢 PER DEPARTEMEN:');
    context.departmentStats.forEach((dept) => {
      const usage = dept.budget > 0 
        ? Math.round((dept.spent / dept.budget) * 100) 
        : 0;
      lines.push(
        `- ${dept.department}: ${formatRupiah(dept.spent)}/${formatRupiah(dept.budget)} (${usage}%, ${dept.bookings} booking)`
      );
    });
  }

  // Top spenders
  if (context.topSpenders && context.topSpenders.length > 0) {
    lines.push('');
    lines.push('🏆 TOP TRAVELERS:');
    context.topSpenders.forEach((traveler, idx) => {
      lines.push(
        `${idx + 1}. ${traveler.name} (${traveler.department}): ${formatRupiah(traveler.spending)} - ${traveler.trips} trips`
      );
    });
  }

  // Alerts
  if (context.alerts && context.alerts.length > 0) {
    lines.push('');
    lines.push('⚠️ ALERTS:');
    context.alerts.forEach((alert) => {
      const icon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵';
      lines.push(`${icon} [${alert.type}] ${alert.message}`);
    });
  }

  return lines.join('\n');
}

/**
 * Detect question intent for better responses
 */
function detectIntent(question: string): string[] {
  const intents: string[] = [];
  const q = question.toLowerCase();

  if (/(budget|anggaran|dana|sisa|remaining)/i.test(q)) {
    intents.push('budget_inquiry');
  }
  if (/(departemen|department|divisi)/i.test(q)) {
    intents.push('department_analysis');
  }
  if (/(trend|tren|naik|turun|perbandingan|compare)/i.test(q)) {
    intents.push('trend_analysis');
  }
  if (/(hemat|efisien|optimasi|kurang|reduce|savings)/i.test(q)) {
    intents.push('cost_optimization');
  }
  if (/(approval|setuju|tolak|pending|menunggu)/i.test(q)) {
    intents.push('approval_help');
  }
  if (/(siapa|who|top|paling|banyak)/i.test(q)) {
    intents.push('traveler_inquiry');
  }
  if (/(kebijakan|policy|aturan|rule|boleh|tidak boleh)/i.test(q)) {
    intents.push('policy_question');
  }
  if (/(laporan|report|summary|ringkasan)/i.test(q)) {
    intents.push('report_request');
  }

  return intents;
}

/**
 * Chat with corporate AI assistant
 * @param question - User question
 * @param context - Corporate context data
 */
export async function chatCorporateAssistant(
  question: string,
  context: CorporateContext
): Promise<string> {
  try {
    const contextString = buildContextString(context);
    const intents = detectIntent(question);

    // Build prompt with context and intents
    let enhancedPrompt = contextString + '\n\n';
    
    if (intents.length > 0) {
      enhancedPrompt += `[Detected intent: ${intents.join(', ')}]\n\n`;
    }
    
    enhancedPrompt += `Pertanyaan user: ${question}`;

    logger.info('Corporate AI assistant query', {
      corporateId: context.corporateId,
      intents,
      questionLength: question.length,
    });

    // Call Gemini
    const response = await chat({
      systemPrompt: SYSTEM_PROMPT,
      message: enhancedPrompt,
    });

    if (!response) {
      return 'Maaf, saya tidak dapat memproses pertanyaan Anda saat ini. Silakan coba lagi.';
    }

    logger.info('Corporate AI assistant response', {
      corporateId: context.corporateId,
      responseLength: response.length,
    });

    return response;
  } catch (error) {
    logger.error('Corporate AI assistant error', error, {
      corporateId: context.corporateId,
      question,
    });

    return 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi nanti.';
  }
}

/**
 * Generate budget insights automatically
 * @param context - Corporate context data
 */
export async function generateBudgetInsights(
  context: CorporateContext
): Promise<string[]> {
  const insights: string[] = [];

  // Budget usage insights
  if (context.budget.usagePercentage >= 90) {
    insights.push(
      `⚠️ Budget hampir habis! Sisa ${formatRupiah(context.budget.remaining)} (${100 - context.budget.usagePercentage}%)`
    );
  } else if (context.budget.usagePercentage >= 75) {
    insights.push(
      `📊 Budget sudah terpakai ${context.budget.usagePercentage}%. Pertimbangkan untuk meninjau booking mendatang.`
    );
  }

  // Pending approvals
  if (context.pendingApprovals > 5) {
    insights.push(
      `📋 Ada ${context.pendingApprovals} booking menunggu approval. Segera review untuk menghindari keterlambatan.`
    );
  }

  // Department analysis
  if (context.departmentStats) {
    const overBudgetDepts = context.departmentStats.filter(
      (d) => d.budget > 0 && (d.spent / d.budget) > 0.9
    );
    
    if (overBudgetDepts.length > 0) {
      const deptNames = overBudgetDepts.map((d) => d.department).join(', ');
      insights.push(
        `🚨 Departemen dengan budget >90%: ${deptNames}. Perlu perhatian khusus.`
      );
    }

    const underutilizedDepts = context.departmentStats.filter(
      (d) => d.budget > 0 && (d.spent / d.budget) < 0.3 && d.bookings === 0
    );

    if (underutilizedDepts.length > 0) {
      const deptNames = underutilizedDepts.map((d) => d.department).join(', ');
      insights.push(
        `💡 Departemen dengan utilisasi rendah: ${deptNames}. Pertimbangkan realokasi budget.`
      );
    }
  }

  // Employee insights
  if (context.employees.pendingInvitations > 0) {
    insights.push(
      `👥 ${context.employees.pendingInvitations} undangan karyawan belum direspon.`
    );
  }

  return insights;
}

/**
 * Get suggested questions based on context
 * @param context - Corporate context data
 */
export function getSuggestedQuestions(context: CorporateContext): string[] {
  const suggestions: string[] = [
    'Berapa sisa budget travel bulan ini?',
    'Departemen mana yang paling banyak spending?',
    'Siapa karyawan dengan perjalanan terbanyak?',
  ];

  if (context.pendingApprovals > 0) {
    suggestions.push('Ada berapa approval yang pending?');
  }

  if (context.budget.usagePercentage > 70) {
    suggestions.push('Bagaimana cara mengoptimalkan budget travel?');
  }

  if (context.departmentStats && context.departmentStats.length > 1) {
    suggestions.push('Bandingkan spending antar departemen');
  }

  return suggestions.slice(0, 4);
}

