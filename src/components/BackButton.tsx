"use client";
import { useRouter, usePathname } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  if (pathname === '/') return null;
  return (
    <button
      onClick={() => router.back()}
      style={{
        position: 'fixed', bottom: '90px', left: '20px', zIndex: 998,
        background: 'rgba(12,24,48,0.9)', border: '1px solid rgba(197,168,92,0.4)',
        borderRadius: '50%', width: '46px', height: '46px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--gold-primary)', fontSize: '1.3rem',
        backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(197,168,92,0.2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(12,24,48,0.9)')}
      aria-label="رجوع"
    >→</button>
  );
}
