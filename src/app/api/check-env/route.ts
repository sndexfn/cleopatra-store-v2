import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ موجود' : '❌ فاضي',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ موجود' : '❌ فاضي',
  });
}
