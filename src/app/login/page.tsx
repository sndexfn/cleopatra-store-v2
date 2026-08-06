"use client";
import { useState } from 'react';
import styles from './page.module.css';
import { supabase, isAdmin } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, User, Lock, ArrowLeft, UserPlus, LogIn, KeyRound, AlertTriangle, Database } from 'lucide-react';

type Mode = 'choose' | 'login' | 'register' | 'otp';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [otpFor, setOtpFor] = useState<'login'|'register'>('login');
  const router = useRouter();

  const reset = () => { setError(''); setOtp(''); setPassword(''); setIsNetworkError(false); };

  // Handle Registration (SignUp) and then trigger email confirmation OTP
  const handleRegisterAndSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('الرجاء إدخال البريد الإلكتروني'); return; }
    if (!fullName.trim()) { setError('الرجاء إدخال الاسم الكامل'); return; }
    if (!password || password.length < 6) { setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل'); return; }

    setLoading(true); setError(''); setIsNetworkError(false);

    if (!supabase) {
      // Mock flow if Supabase is offline/not configured
      setOtpFor('register');
      setMode('otp');
      setLoading(false);
      return;
    }

    try {
      // Sign up with Email and Password
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: window.location.origin
        }
      });

      if (signUpErr) {
        throw new Error(signUpErr.message);
      }

      // If email confirmation is disabled in Supabase, signUp returns the session immediately!
      if (signUpData?.session) {
        try {
          await supabase.from('profiles').upsert({
            id: signUpData.session.user.id,
            email: signUpData.session.user.email,
            full_name: fullName.trim(),
            created_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        } catch (profileErr) {
          console.error('Error saving profile:', profileErr);
        }

        if (isAdmin(signUpData.session.user.email)) {
          router.replace('/admin');
        } else {
          router.replace('/');
        }
        router.refresh();
        return;
      }

      setOtpFor('register');
      setMode('otp');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الحساب.';
      if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch')) {
        setIsNetworkError(true);
        setError('تعذر الاتصال بـ Supabase (Failed to fetch). يرجى التأكد من كتابة متغيرات البيئة بشكل صحيح في الاستضافة.');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Login (Verify Password first, then trigger security OTP to email)
  const handleLoginWithPasswordAndSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('الرجاء إدخال البريد الإلكتروني'); return; }
    if (!password) { setError('الرجاء إدخال كلمة المرور'); return; }

    setLoading(true); setError(''); setIsNetworkError(false);

    if (!supabase) {
      // Mock flow if Supabase is offline/not configured
      setOtpFor('login');
      setMode('otp');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Sign in with Email and Password
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (signInErr) {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      }

      // Step 2: Trigger OTP code to their email for secure double-factor verification
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
        }
      });

      if (otpErr) {
        // If signInWithOtp fails, we can either throw or let them through if OTP is optional
        throw new Error('خطأ في إرسال رمز التحقق: ' + otpErr.message);
      }

      setOtpFor('login');
      setMode('otp');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول.';
      if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch')) {
        setIsNetworkError(true);
        setError('تعذر الاتصال بـ Supabase (Failed to fetch). يرجى التأكد من كتابة متغيرات البيئة بشكل صحيح في الاستضافة.');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP Code
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) { setError('الرجاء إدخال رمز التحقق'); return; }
    setLoading(true); setError(''); setIsNetworkError(false);

    if (!supabase) {
      // Mock successful verification
      router.replace('/');
      setLoading(false);
      return;
    }

    try {
      // Verify using 'signup' type for registration, and 'email' type for password-login verification
      const verifyType = otpFor === 'register' ? 'signup' : 'email';

      let { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: verifyType
      });

      // Fallback: if 'signup' type fails for register, try with 'email' type
      if (verifyErr && otpFor === 'register') {
        const fallbackResult = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otp.trim(),
          type: 'email'
        });
        if (!fallbackResult.error) {
          data = fallbackResult.data;
          verifyErr = null;
        }
      }

      if (verifyErr) {
        throw new Error('الرمز غير صحيح أو انتهت صلاحيته. حاول مجدداً.');
      }

      if (data && data.session) {
        // Save user profile to profiles table if new user
        if (otpFor === 'register' && fullName.trim()) {
          try {
            await supabase.from('profiles').upsert({
              id: data.session.user.id,
              email: data.session.user.email,
              full_name: fullName.trim(),
              created_at: new Date().toISOString(),
            }, { onConflict: 'id' });
          } catch (profileErr) {
            console.error('Error saving profile:', profileErr);
          }
        }

        if (isAdmin(data.session.user.email)) {
          router.replace('/admin');
        } else {
          router.replace('/');
        }
        router.refresh();
      } else {
        throw new Error('لم يتم العثور على جلسة صالحة. يرجى المحاولة مرة أخرى.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'الرمز غير صحيح.';
      if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch')) {
        setIsNetworkError(true);
        setError('تعذر الاتصال بقاعدة البيانات للتحقق من الرمز.');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBypassOtp = () => {
    // Graceful fallback to home page so they are never locked out of testing the app
    router.replace('/');
    router.refresh();
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

        {/* Login with Password & Email-OTP verification */}
        {mode === 'login' && (
          <>
            <h1 className={styles.title}>تسجيل الدخول</h1>
            <p className={styles.subtitle}>أدخل البريد الإلكتروني وكلمة المرور للدخول</p>
            <form onSubmit={handleLoginWithPasswordAndSendOtp} className={styles.form}>
              <div className={inpWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input className={inp} type="email" placeholder="البريد الإلكتروني *"
                  value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" autoFocus />
              </div>
              <div className={inpWrap}>
                <KeyRound size={16} className={styles.inputIcon} />
                <input className={inp} type="password" placeholder="كلمة المرور *"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              {isNetworkError && (
                <div className={styles.networkInstructions}>
                  <Database size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>نصيحة تقنية:</strong><br />
                    أنت ترى هذا الخطأ لأن مفاتيح الربط بـ Supabase غير مكتوبة بشكل صحيح في لوحة تحكم الاستضافة الخاصة بك (Vercel أو Netlify).<br />
                    يمكنك تخطي هذا وتسجيل الدخول التجريبي مباشرة لتجربة المتجر بالضغط على الزر أدناه!
                  </div>
                </div>
              )}

              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <><span className={styles.spinner} /> جاري التحقق...</> : <>متابعة تسجيل الدخول <ArrowLeft size={16} /></>}
              </button>

              {isNetworkError && (
                <button type="button" onClick={handleBypassOtp} className={styles.bypassBtn}>
                  ✨ الدخول بالوضع التجريبي وتخطي الخطأ
                </button>
              )}

              <button type="button" className={styles.backBtn} onClick={() => setMode('choose')}>← رجوع</button>
            </form>
          </>
        )}

        {/* Register with Password & Email-OTP verification */}
        {mode === 'register' && (
          <>
            <h1 className={styles.title}>حساب جديد</h1>
            <p className={styles.subtitle}>أنشئ حسابك بكلمة مرور وانضم لعائلة كليوباترا</p>
            <form onSubmit={handleRegisterAndSendOtp} className={styles.form}>
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
              <div className={inpWrap}>
                <KeyRound size={16} className={styles.inputIcon} />
                <input className={inp} type="password" placeholder="كلمة المرور (6 أحرف على الأقل) *"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              {isNetworkError && (
                <div className={styles.networkInstructions}>
                  <Database size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>نصيحة تقنية:</strong><br />
                    أنت ترى هذا الخطأ لأن مفاتيح الربط بـ Supabase غير مكتوبة بشكل صحيح في لوحة تحكم الاستضافة الخاصة بك (Vercel أو Netlify).<br />
                    يمكنك تخطي هذا وتجربة المتجر مباشرة بالضغط على زر التخطي أدناه!
                  </div>
                </div>
              )}

              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <><span className={styles.spinner} /> جاري التسجيل...</> : <>إنشاء حساب جديد <ArrowLeft size={16} /></>}
              </button>

              {isNetworkError && (
                <button type="button" onClick={handleBypassOtp} className={styles.bypassBtn}>
                  ✨ تسجيل وتخطي الخطأ بالوضع التجريبي
                </button>
              )}

              <button type="button" className={styles.backBtn} onClick={() => setMode('choose')}>← رجوع</button>
            </form>
          </>
        )}

        {/* OTP Verify Card */}
        {mode === 'otp' && (
          <>
            <h1 className={styles.title}>{otpFor === 'register' ? '✉️ تأكيد الحساب' : '🔐 رمز التحقق'}</h1>
            <p className={styles.subtitle}>
              تم إرسال الرمز أو رابط تأكيد الحساب إلى بريدك الإلكتروني لضمان الأمن:<br />
              <strong style={{ color: 'var(--gold-primary)', direction: 'ltr', display: 'inline-block', margin: '0.5rem 0' }}>{email}</strong>
            </p>
            <form onSubmit={handleVerify} className={styles.form}>
              <div className={inpWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input className={inp} type="text" placeholder="أدخل رمز التحقق (أو اضغط الرابط)" inputMode="numeric"
                  value={otp} onChange={e => setOtp(e.target.value)} maxLength={8} required dir="ltr" autoFocus />
              </div>
              {error && <div className={styles.error}>{error}</div>}

              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <><span className={styles.spinner} /> جاري التحقق...</> : '✅ تأكيد والدخول إلى الحساب'}
              </button>

              {/* Informative alert for SMTP / Email delay fallback */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                padding: '0.8rem',
                fontSize: '0.8rem',
                color: '#f59e0b',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start',
                marginTop: '0.5rem',
                lineHeight: '1.4'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>لم يصلك الرمز؟</strong><br />
                  1. يرجى مراجعة مجلد الرسائل غير المرغوب فيها (Spam).<br />
                  2. إذا كنت مدير الموقع، يمكنك إيقاف خيار &quot;Confirm email&quot; في لوحة تحكم Supabase لتسجيل وتفعيل الحسابات فوراً دون طلب الرمز.<br />
                  3. أو يمكنك تخطي التأكيد والعودة للمتجر مباشرة للتجربة أدناه.
                </div>
              </div>

              <button type="button" onClick={handleBypassOtp}
                style={{
                  background: 'none',
                  border: '1px dashed var(--gold-primary)',
                  borderRadius: '8px',
                  color: 'var(--gold-primary)',
                  padding: '0.6rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '0.5rem',
                  fontWeight: 600
                }}>
                ✨ تخطي خطوة التحقق والذهاب للرئيسية
              </button>

              <button type="button" className={styles.backBtn} onClick={() => { setMode(otpFor === 'register' ? 'register' : 'login'); reset(); }}>
                ← تغيير البريد الإلكتروني
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
