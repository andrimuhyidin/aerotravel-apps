/**
 * Logout API Route
 * Handles user logout and session cleanup
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const supabase = await createClient();

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Redirect to homepage
  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}

// Also support GET for simple links
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const supabase = await createClient();

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Redirect to homepage
  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}
