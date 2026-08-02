"use client";
import { useState } from 'react';
import styles from './page.module.css';
import { supabase, isAdmin } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, User, ArrowLeft, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('الرجاء إدخال البريد الإلكتروني'); return; }
    setLoading(true);
    setError('');
    if (!supabase) { setError('خدمة تسجيل الدخول غير متاحة حالياً. تحقق من إعدادات المشروع.'); setLoading(false); return; }
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { data: { full_name: fullName.trim() || email.split('@')[0] } }
    });
    if (otpError) {
      setError('حدث خطأ أثناء إرسال الرمز: ' + otpError.message);
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) { setError('الرجاء إدخال رمز التحقق'); return; }
    setLoading(true);
    setError('');
    if (!supabase) { setError('خدمة تسجيل الدخول غير متاحة حالياً'); setLoading(false); return; }
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email'
    });
    if (verifyError) {
      setError('الرمز غير صحيح أو انتهت صلاحيته. حاول مجدداً.');
    } else if (data.session) {
      if (isAdmin(data.session.user.email)) {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Image src="/logo.jpg" alt="كليوباترا" width={100} height={100} style={{ objectFit: 'contain', borderRadius: '12px' }} />
        </div>
        <h1 className={styles.title}>مرحباً بك</h1>
        <p className={styles.subtitle}>{step === 'email' ? 'أدخل بياناتك لتسجيل الدخول أو إنشاء حساب' : `تم إرسال رمز التحقق إلى ${email}`}</p>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className={styles.form}>
            <div className={styles.inputWrap}>
              <User size={16} className={styles.inputIcon} />
              <input className={styles.input} type="text" placeholder="الاسم الكامل (للمستخدمين الجدد)" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input className={styles.input} type="email" placeholder="البريد الإلكتروني *" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
            </div>
            <p className={styles.hint}>سيتم إرسال رمز تحقق (OTP) إلى بريدك الإلكتروني</p>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? <><span className={styles.spinner} />جاري الإرسال...</> : <>إرسال رمز التحقق <ArrowLeft size={16} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className={styles.form}>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input className={styles.input} type="text" placeholder="أدخل الرمز (6-8 أرقام)" value={otp} onChange={e => setOtp(e.target.value)} maxLength={8} required dir="ltr" autoFocus inputMode="numeric" />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? <><span className={styles.spinner} />جاري التحقق...</> : <>تأكيد الدخول ✓</>}
            </button>
            <button type="button" className={styles.backBtn} onClick={() => { setStep('email'); setError(''); setOtp(''); }}>
              ← تغيير البريد الإلكتروني
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
