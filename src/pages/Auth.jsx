import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/app/firebase'

// ── Constants ────────────────────────────────────────────────

const googleProvider = new GoogleAuthProvider()

// ── Main Component ───────────────────────────────────────────

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode]         = useState('login')   // 'login' | 'register'
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [googleLoad, setGoogleLoad] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  // ── Validation ────────────────────────────────────────────

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const pwdValid   = password.length >= 6
  const pwd2Valid  = mode === 'login' || password === password2
  const nameValid  = mode === 'login' || name.trim().length >= 2

  const canSubmit  = emailValid && pwdValid && pwd2Valid && nameValid && !loading

  // ── Firebase helpers ──────────────────────────────────────

  async function ensureProfile(user, displayName) {
    const ref  = doc(db, 'users', user.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid:         user.uid,
        email:       user.email,
        displayName: displayName ?? user.displayName ?? 'Student',
        photoURL:    user.photoURL ?? null,
        createdAt:   serverTimestamp(),
        xp:          0,
        level:       1,
        streak:      0,
        lives:       5,
        languages:   [],
      })
    }
  }

  function firebaseErrorMessage(code) {
    const map = {
      'auth/user-not-found':      'Пользователь не найден',
      'auth/wrong-password':      'Неверный пароль',
      'auth/email-already-in-use':'Email уже используется',
      'auth/invalid-email':       'Неверный формат email',
      'auth/too-many-requests':   'Слишком много попыток. Подожди немного.',
      'auth/weak-password':       'Пароль слишком простой',
      'auth/popup-closed-by-user':'Окно закрыто. Попробуй снова.',
      'auth/network-request-failed': 'Проблема с сетью',
    }
    return map[code] ?? 'Что-то пошло не так. Попробуй ещё раз.'
  }

  // ── Submit: email / password ──────────────────────────────

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!canSubmit) return
    setLoading(true); setError(''); setSuccess('')

    try {
      if (mode === 'login') {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
        await ensureProfile(cred.user, null)
        setSuccess('Добро пожаловать!')
        setTimeout(() => navigate('/'), 600)
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
        await updateProfile(cred.user, { displayName: name.trim() })
        await ensureProfile(cred.user, name.trim())
        setSuccess('Аккаунт создан!')
        setTimeout(() => navigate('/'), 600)
      }
    } catch (err) {
      setError(firebaseErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  // ── Submit: Google ────────────────────────────────────────

  async function handleGoogle() {
    setGoogleLoad(true); setError(''); setSuccess('')
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      await ensureProfile(cred.user, null)
      setSuccess('Добро пожаловать!')
      setTimeout(() => navigate('/'), 600)
    } catch (err) {
      setError(firebaseErrorMessage(err.code))
    } finally {
      setGoogleLoad(false)
    }
  }

  // ── Switch mode ────────────────────────────────────────────

  function switchMode(m) {
    setMode(m); setError(''); setSuccess('')
    setName(''); setEmail(''); setPassword(''); setPassword2('')
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={s.screen}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
        input::placeholder{color:#555E80;}
        input:focus{outline:none;border-color:#6C63FF!important;box-shadow:0 0 0 3px rgba(108,99,255,0.15)!important;}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px #1A1F35 inset!important;-webkit-text-fill-color:#F0F2FF!important;}
      `}</style>

      {/* BG */}
      <div style={s.bgGrid} />
      <div style={s.bgGlow} />

      <div style={s.inner}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32, animation: 'fadeUp .4s ease both' }}>
          <div style={s.logo}>lang<span style={{ color: '#8B84FF' }}>.</span></div>
          <div style={s.logoSub}>Учи языки с нуля до профессионала</div>
        </div>

        {/* Tabs */}
        <div style={{ ...s.tabs, animation: 'fadeUp .4s .05s ease both' }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => switchMode(m)} style={{
              ...s.tab,
              background: mode === m ? '#6C63FF' : 'none',
              color:      mode === m ? 'white'   : '#555E80',
              boxShadow:  mode === m ? '0 2px 12px rgba(108,99,255,.35)' : 'none',
            }}>
              {m === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp .4s .1s ease both' }}>

          {/* Name (register only) */}
          {mode === 'register' && (
            <Field label="Имя" icon="👤">
              <input
                type="text" value={name} placeholder="Алия"
                onChange={e => setName(e.target.value)}
                style={s.input}
              />
            </Field>
          )}

          {/* Email */}
          <Field label="Email" icon="✉️">
            <input
              type="email" value={email} placeholder="example@mail.com"
              onChange={e => setEmail(e.target.value)}
              style={{ ...s.input, borderColor: email && !emailValid ? '#FF4D6D' : 'rgba(255,255,255,0.14)' }}
            />
          </Field>

          {/* Password */}
          <Field label="Пароль" icon="🔒">
            <input
              type={showPwd ? 'text' : 'password'} value={password}
              placeholder="Минимум 6 символов"
              onChange={e => setPassword(e.target.value)}
              style={{ ...s.input, borderColor: password && !pwdValid ? '#FF4D6D' : 'rgba(255,255,255,0.14)', paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShowPwd(v => !v)} style={s.eyeBtn}>
              {showPwd ? '🙈' : '👁️'}
            </button>
            {password && !pwdValid && <ErrMsg>Минимум 6 символов</ErrMsg>}
          </Field>

          {/* Confirm password (register only) */}
          {mode === 'register' && (
            <Field label="Повтори пароль" icon="🔒">
              <input
                type={showPwd ? 'text' : 'password'} value={password2}
                placeholder="Повтори пароль"
                onChange={e => setPassword2(e.target.value)}
                style={{ ...s.input, borderColor: password2 && !pwd2Valid ? '#FF4D6D' : 'rgba(255,255,255,0.14)' }}
              />
              {password2 && !pwd2Valid && <ErrMsg>Пароли не совпадают</ErrMsg>}
            </Field>
          )}

          {/* Global error */}
          {error && (
            <div style={s.errorBanner}>⚠️ {error}</div>
          )}

          {/* Success */}
          {success && (
            <div style={s.successBanner}>✅ {success}</div>
          )}

          {/* Submit */}
          <button type="submit" disabled={!canSubmit || !!success} style={{
            ...s.submitBtn,
            background: success ? '#4ADE80' : canSubmit ? '#6C63FF' : '#232840',
            color:      success ? '#052012' : canSubmit ? 'white'   : '#555E80',
            cursor:     canSubmit && !success ? 'pointer' : 'not-allowed',
            boxShadow:  canSubmit && !success ? '0 4px 20px rgba(108,99,255,.35)' : 'none',
          }}>
            {loading
              ? <div style={s.spinner} />
              : success
              ? success
              : mode === 'login' ? 'Войти' : 'Создать аккаунт'
            }
          </button>

          {/* Divider */}
          <Divider />

          {/* Google */}
          <button type="button" onClick={handleGoogle} disabled={googleLoad || !!success} style={s.googleBtn}>
            {googleLoad
              ? <div style={{ ...s.spinner, borderTopColor: '#555E80' }} />
              : <GoogleIcon />
            }
            {googleLoad ? 'Подключаемся…' : 'Продолжить с Google'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#555E80', animation: 'fadeUp .4s .2s ease both' }}>
          {mode === 'login' ? (
            <>Нет аккаунта?{' '}
              <span onClick={() => switchMode('register')} style={s.link}>Зарегистрироваться</span>
            </>
          ) : (
            <>Уже есть аккаунт?{' '}
              <span onClick={() => switchMode('login')} style={s.link}>Войти</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────

function Field({ label, icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#555E80', textTransform: 'uppercase', letterSpacing: '.6px' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', zIndex: 1 }}>
          {icon}
        </span>
        {children}
      </div>
    </div>
  )
}

function ErrMsg({ children }) {
  return (
    <div style={{ fontSize: 12, color: '#FF4D6D', display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
      ⚠️ {children}
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#555E80', fontSize: 13, margin: '2px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      или
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

// ── Styles ───────────────────────────────────────────────────

const s = {
  screen:       { background: '#080B14', color: '#F0F2FF', minHeight: '100vh', fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bgGrid:       { position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(108,99,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,0.04) 1px,transparent 1px)', backgroundSize: '40px 40px' },
  bgGlow:       { position: 'fixed', bottom: -100, left: '50%', transform: 'translateX(-50%)', width: 500, height: 400, pointerEvents: 'none', background: 'radial-gradient(ellipse,rgba(108,99,255,0.1) 0%,transparent 70%)' },
  inner:        { width: '100%', maxWidth: 420, padding: '24px 24px 40px', position: 'relative', zIndex: 1 },
  logo:         { fontSize: 36, fontWeight: 800, letterSpacing: -1 },
  logoSub:      { fontSize: 14, color: '#555E80', marginTop: 6 },
  tabs:         { display: 'flex', background: '#1A1F35', borderRadius: 16, padding: 4, marginBottom: 28 },
  tab:          { flex: 1, padding: '10px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s', border: 'none', fontFamily: "'Outfit',sans-serif" },
  input:        { width: '100%', background: '#1A1F35', border: '1.5px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: '14px 14px 14px 44px', fontSize: 15, fontFamily: "'Outfit',sans-serif", color: '#F0F2FF', transition: 'all .15s' },
  eyeBtn:       { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#555E80', padding: 4, fontFamily: 'inherit' },
  errorBanner:  { background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#FF4D6D', lineHeight: 1.5 },
  successBanner:{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#4ADE80' },
  submitBtn:    { width: '100%', padding: 16, borderRadius: 16, border: 'none', fontSize: 16, fontWeight: 800, fontFamily: "'Outfit',sans-serif", transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  googleBtn:    { width: '100%', padding: 14, borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.14)', background: '#1A1F35', color: '#F0F2FF', fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all .15s' },
  spinner:      { width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  link:         { color: '#8B84FF', fontWeight: 600, cursor: 'pointer' },
}
