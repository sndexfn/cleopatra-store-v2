"use client";
import { useState } from 'react';
import styles from './page.module.css';
import { supabase, isAdmin } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, User, Lock, ArrowLeft, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react';

type Mode = 'choose' | 'login_otp' | 'login_verify' | 'register' | 'register_verify';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const reset = () => { setError(''); setOtp(''); };

  // ===== تسجيل دخول: يرسل OTP للإيميل مباشرة =====
  const handleLoginSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('البريد الإلكتروني مطلوب'); return; }
    setLoading(true); setError('');
    if (!supabase) { setError('الخدمة غير متاحة حالياً'); setLoading(false); return; }

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false }, // لا ينشئ حساب جديد
    });

    if (err) {
      // لو ما وجد المستخدم، نخبره يسجل حساب جديد
      if (err.message.includes('Signups not allowed') || err.message.includes('not found') || err.status === 422) {
        setError('هذا البريد غير مسجل. يرجى إنشاء حساب جديد أولاً.');
      } else {
        setError('خطأ في الإرسال: ' + err.message);
      }
    } else {
      setMode('login_verify');
    }
    setLoading(false);
  };

  // ===== تسجيل جديد: يجمع الاسم + إيميل + باسورد =====
  const handleRegisterSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError('الاسم الكامل مطلوب'); return; }
    if (!email.trim()) { setError('البريد الإلكتروني مطلوب'); return; }
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    setLoading(true); setError('');
    if (!supabase) { setError('الخدمة غير متاحة'); setLoading(false); return; }

    const { error: err } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim() } }
    });

    if (err) {
      if (err.message.includes('already registered') || err.message.includes('User already registered')) {
        setError('هذا البريد مسجل مسبقاً. استخدم تسجيل الدخول.');
      } else {
        setError('خطأ: ' + err.message);
      }
    } else {
      setMode('register_verify');
    }
    setLoading(false);
  };

  // ===== التحقق من OTP (مشترك بين الدخول والتسجيل) =====
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) { setError('الرجاء إدخال رمز التحقق'); return; }
    setLoading(true); setError('');
    if (!supabase) { setError('الخدمة غير متاحة'); setLoading(false); return; }

    const { data, error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email'
    });

    if (err) {
      setError('الرمز غير صحيح أو انتهت صلاحيته (6 دقائق). حاول مجدداً.');
    } else if (data.session) {
      // حفظ الـ profile في الداتابيس
      if (mode === 'register_verify') {
        try {
          await supabase.from('profiles').upsert({
            id: data.session.user.id,
            email: data.session.user.email,
            full_name: fullName.trim(),
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

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Image src="/logo-new.png" alt="كليوباترا" width={90} height={90}
            style={{ objectFit: 'contain', borderRadius: '12px' }} />
        </div>

        {/* اختيار */}
        {mode === 'choose' && (
          <>
            <h1 className={styles.title}>مرحباً بك 👑</h1>
            <p className={styles.subtitle}>اختر طريقة الدخول</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '1rem' }}>
              <button className={styles.choiceBtn} onClick={() => { reset(); setMode('login_otp'); }}>
                <LogIn size={20} />
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, marginBottom: '0.15rem' }}>تسجيل الدخول</p>
                  <p style={{ fontSize: '0.78rem', opacity: 0.65 }}>لديّ حساب — سأستلم رمز على إيميلي</p>
                </div>
              </button>
              <button className={`${styles.choiceBtn} ${styles.choiceBtnOutline}`} onClick={() => { reset(); setMode('register'); }}>
                <UserPlus size={20} />
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, marginBottom: '0.15rem' }}>إنشاء حساب جديد</p>
                  <p style={{ fontSize: '0.78rem', opacity: 0.65 }}>أول مرة أستخدم المتجر</p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* تسجيل دخول — إدخال الإيميل */}
        {mode === 'login_otp' && (
          <>
            <h1 className={styles.title}>تسجيل الدخول</h1>
            <p className={styles.subtitle}>سنرسل رمز تحقق إلى بريدك</p>
            <form onSubmit={handleLoginSend} className={styles.form}>
              <div className={styles.inputWrap}>
                <Mail size={15} className={styles.inputIcon} />
                <input className={styles.input} type="email" placeholder="البريد الإلكتروني *"
                  value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" autoFocus />
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <><span className={styles.spinner}/> جاري الإرسال...</> : <>إرسال رمز التحقق <ArrowLeft size={15}/></>}
              </button>
              <button type="button" className={styles.backBtn} onClick={() => { setMode('choose'); reset(); }}>← رجوع</button>
            </form>
          </>
        )}

        {/* تسجيل دخول — إدخال OTP */}
        {mode === 'login_verify' && (
          <>
            <h1 className={styles.title}>🔐 رمز التحقق</h1>
            <p className={styles.subtitle}>تم الإرسال إلى<br />
              <strong style={{ color: 'var(--gold-primary)', direction: 'ltr', display: 'block' }}>{email}</strong>
            </p>
            <form onSubmit={handleVerify} className={styles.form}>
              <div className={styles.inputWrap}>
                <Lock size={15} className={styles.inputIcon} />
                <input className={styles.input} type="text" placeholder="الرمز (6-8 أرقام)"
                  inputMode="numeric" value={otp} onChange={e => setOtp(e.target.value)}
                  maxLength={8} required dir="ltr" autoFocus />
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <><span className={styles.spinner}/> جاري التحقق...</> : '✅ تأكيد الدخول'}
              </button>
              <button type="button" className={styles.backBtn}
                onClick={() => { setMode('login_otp'); reset(); }}>← تغيير البريد</button>
            </form>
          </>
        )}

        {/* تسجيل جديد */}
        {mode === 'register' && (
          <>
            <h1 className={styles.title}>حساب جديد</h1>
            <p className={styles.subtitle}>انضم لعائلة كليوباترا</p>
            <form onSubmit={handleRegisterSend} className={styles.form}>
              <div className={styles.inputWrap}>
                <User size={15} className={styles.inputIcon} />
                <input className={styles.input} type="text" placeholder="الاسم الكامل *"
                  value={fullName} onChange={e => setFullName(e.target.value)} required autoFocus />
              </div>
              <div className={styles.inputWrap}>
                <Mail size={15} className={styles.inputIcon} />
                <input className={styles.input} type="email" placeholder="البريد الإلكتروني *"
                  value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
              </div>
              <div className={styles.inputWrap}>
                <Lock size={15} className={styles.inputIcon} />
                <input className={styles.input} type={showPass ? 'text' : 'password'}
                  placeholder="كلمة المرور (6 أحرف على الأقل) *"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  style={{ paddingLeft: '2.5rem' }} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <><span className={styles.spinner}/> جاري إنشاء الحساب...</> : <>إنشاء حساب <ArrowLeft size={15}/></>}
              </button>
              <button type="button" className={styles.backBtn} onClick={() => { setMode('choose'); reset(); }}>← رجوع</button>
            </form>
          </>
        )}

        {/* تأكيد التسجيل */}
        {mode === 'register_verify' && (
          <>
            <h1 className={styles.title}>✉️ تأكيد الحساب</h1>
            <p className={styles.subtitle}>تم إرسال رمز تأكيد إلى<br />
              <strong style={{ color: 'var(--gold-primary)', direction: 'ltr', display: 'block' }}>{email}</strong>
            </p>
            <form onSubmit={handleVerify} className={styles.form}>
              <div className={styles.inputWrap}>
                <Lock size={15} className={styles.inputIcon} />
                <input className={styles.input} type="text" placeholder="أدخل رمز التحقق..."
                  inputMode="numeric" value={otp} onChange={e => setOtp(e.target.value)}
                  maxLength={8} required dir="ltr" autoFocus />
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <><span className={styles.spinner}/> جاري التحقق...</> : '✅ تأكيد وإنشاء الحساب'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
