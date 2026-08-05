"use client";
import { useState } from 'react';
import styles from './page.module.css';
import { supabase, isAdmin } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, User, Lock, ArrowLeft, UserPlus, LogIn } from 'lucide-react';

type Mode = 'choose' | 'login' | 'register' | 'otp';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpFor, setOtpFor] = useState<'login'|'register'>('login');
  const router = useRouter();

  const reset = () => { setError(''); setOtp(''); };

  // Send OTP
  const handleSendOtp = async (e: React.FormEvent, type: 'login'|'register') => {
    e.preventDefault();
    if (!email.trim()) { setError('الرجاء إدخال البريد الإلكتروني'); return; }
    if (type === 'register' && !fullName.trim()) { setError('الرجاء إدخال الاسم الكامل'); return; }
    setLoading(true); setError('');
    if (!supabase) { setError('خدمة تسجيل الدخول غير متاحة حالياً'); setLoading(false); return; }

    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        data: { full_name: type === 'register' ? fullName.trim() : undefined },
        shouldCreateUser: type === 'register',
      }
    });

    if (otpErr) {
      if (otpErr.message.includes('not authorized') || otpErr.message.includes('Signups not allowed')) {
        setError('لا يمكن إنشاء حساب بهذا البريد. تحقق من الإعدادات.');
      } else {
        setError('خطأ: ' + otpErr.message);
      }
    } else {
      setOtpFor(type);
      setMode('otp');
    }
    setLoading(false);
  };

  // Verify OTP
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) { setError('الرجاء إدخال رمز التحقق'); return; }
    setLoading(true); setError('');
    if (!supabase) { setError('خدمة غير متاحة'); setLoading(false); return; }

    const { data, error: verifyErr } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email'
    });

    if (verifyErr) {
      setError('الرمز غير صحيح أو انتهت صلاحيته. حاول مجدداً.');
    } else if (data.session) {
      // Save user profile to profiles table if new user
      if (otpFor === 'register' && fullName.trim()) {
        try {
          await supabase.from('profiles').upsert({
            id: data.session.user.id,
            email: data.session.user.email,
            full_name: fullName.trim(),
            created_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        } catch {}
      }

      if (isAdmin(data.session.user.email)) {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
      router.refresh();
    }
    setLoading(false);
  };

  const inp = `${styles.input}`;
  const inpWrap = `${styles.inputWrap}`;

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Image src="/logo-new.png" alt="كليوباترا" width={100} height={100}
            style={{ objectFit: 'contain', borderRadius: '12px' }} />
        </div>

        {/* Choose mode */}
        {mode === 'choose' && (
          <>
            <h1 className={styles.title}>مرحباً بك 👑</h1>
            <p className={styles.subtitle}>اختر طريقة الدخول</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '1rem' }}>
              <button className={styles.choiceBtn} onClick={() => { reset(); setMode('login'); }}>
                <LogIn size={20} />
                <div>
                  <p style={{ fontWeight: 700 }}>تسجيل الدخول</p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>لديّ حساب مسبقاً</p>
                </div>
              </button>
              <button className={`${styles.choiceBtn} ${styles.choiceBtnOutline}`} onClick={() => { reset(); setMode('register'); }}>
                <UserPlus size={20} />
                <div>
                  <p style={{ fontWeight: 700 }}>إنشاء حساب جديد</p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>أول مرة أستخدم المتجر</p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Login */}
        {mode === 'login' && (
          <>
            <h1 className={styles.title}>تسجيل الدخول</h1>
            <p className={styles.subtitle}>أدخل بريدك الإلكتروني وسنرسل لك رمز</p>
            <form onSubmit={e => handleSendOtp(e, 'login')} className={styles.form}>
              <div className={inpWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input className={inp} type="email" placeholder="البريد الإلكتروني *"
                  value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" autoFocus />
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <><span className={styles.spinner} /> جاري الإرسال...</> : <>إرسال رمز التحقق <ArrowLeft size={16} /></>}
              </button>
              <button type="button" className={styles.backBtn} onClick={() => setMode('choose')}>← رجوع</button>
            </form>
          </>
        )}

        {/* Register */}
        {mode === 'register' && (
          <>
            <h1 className={styles.title}>حساب جديد</h1>
            <p className={styles.subtitle}>أنشئ حسابك وانضم لعائلة كليوباترا</p>
            <form onSubmit={e => handleSendOtp(e, 'register')} className={styles.form}>
              <div className={inpWrap}>
                <User size={16} className={styles.inputIcon} />
                <input className={inp} type="text" placeholder="الاسم الكامل *"
                  value={fullName} onChange={e => setFullName(e.target.value)} required autoFocus />
              </div>
              <div className={inpWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input className={inp} type="email" placeholder="البريد الإلكتروني *"
                  value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <><span className={styles.spinner} /> جاري الإرسال...</> : <>إنشاء حساب <ArrowLeft size={16} /></>}
              </button>
              <button type="button" className={styles.backBtn} onClick={() => setMode('choose')}>← رجوع</button>
            </form>
          </>
        )}

        {/* OTP Verify */}
        {mode === 'otp' && (
          <>
            <h1 className={styles.title}>{otpFor === 'register' ? '✉️ تأكيد الحساب' : '🔐 رمز التحقق'}</h1>
            <p className={styles.subtitle}>تم إرسال رمز مكوّن من 6 أرقام إلى<br /><strong style={{ color: 'var(--gold-primary)', direction: 'ltr', display: 'inline-block' }}>{email}</strong></p>
            <form onSubmit={handleVerify} className={styles.form}>
              <div className={inpWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input className={inp} type="text" placeholder="أدخل الرمز..." inputMode="numeric"
                  value={otp} onChange={e => setOtp(e.target.value)} maxLength={8} required dir="ltr" autoFocus />
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <><span className={styles.spinner} /> جاري التحقق...</> : '✅ تأكيد الدخول'}
              </button>
              <button type="button" className={styles.backBtn} onClick={() => { setMode(otpFor === 'register' ? 'register' : 'login'); reset(); }}>
                ← تغيير البريد
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
