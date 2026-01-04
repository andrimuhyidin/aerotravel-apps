/**
 * Corporate Budget Management Page
 */

import { Metadata } from 'next';

import { BudgetClient } from './budget-client';

export const metadata: Metadata = {
  title: 'Budget Management | Corporate Portal',
  description: 'Kelola anggaran perjalanan perusahaan',
};

export default function BudgetPage() {
  return <BudgetClient />;
}

