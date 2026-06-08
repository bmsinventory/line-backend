/* ===== Login screen ===== */
function LineLogo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3C6.9 3 3 6.3 3 10.4c0 3.7 3.1 6.8 7.4 7.4.3 0 .7.2.8.4.1.2 0 .6 0 .8l-.1.8c0 .2-.2.9.8.5s5.4-3.2 7.3-5.5C20.4 13.3 21 11.9 21 10.4 21 6.3 17.1 3 12 3Z" fill="currentColor"/>
    </svg>
  );
}

function Field({ icon, label, type = 'text', value, onChange, placeholder, trailing }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 7 }}>{label}</span>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 13px',
        background: '#fff', borderRadius: 12, height: 48,
        border: '1.5px solid ' + (focus ? '#06C755' : '#E2E8F0'),
        boxShadow: focus ? '0 0 0 4px rgba(6,199,85,.12)' : 'none', transition: 'all .15s',
      }}>
        <Icon name={icon} size={18} style={{ color: focus ? '#06C755' : '#94A3B8' }} strokeWidth={1.9} />
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14.5, color: '#1E293B', minWidth: 0 }}
        />
        {trailing}
      </div>
    </label>
  );
}

function Login({ onLogin }) {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ'); return; }
      onLogin();
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    ['1,284', 'ปัญหาที่แก้ไขแล้ว'],
    ['6', 'กลุ่ม Line เชื่อมต่อ'],
    ['12 น.', 'เวลาตอบเฉลี่ย'],
  ];

  /* ---- brand panel (desktop only) ---- */
  const brandPanel = (
    <div style={{
      width: 460, flexShrink: 0, background: '#0B3D2E', color: '#fff', padding: '52px 48px',
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      {/* decorative glows */}
      <div style={{ position: 'absolute', top: -120, right: -90, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,199,85,.35), transparent 70%)' }}></div>
      <div style={{ position: 'absolute', bottom: -140, left: -100, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,199,85,.18), transparent 70%)' }}></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: '#06C755', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 6px 18px rgba(6,199,85,.5)' }}>
          <LineLogo size={26} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Anuphan, sans-serif', letterSpacing: '-.01em' }}>LINE Issue Tracker</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', paddingRight: 12 }}>
        <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.25, fontWeight: 800, fontFamily: 'Anuphan, sans-serif', letterSpacing: '-.02em' }}>
          ทุกปัญหาจากทุกกลุ่ม Line<br/>รวมไว้ที่เดียว
        </h1>
        <p style={{ margin: '18px 0 0', fontSize: 15, lineHeight: 1.7, color: '#A7CDBE', fontWeight: 500 }}>
          รับเรื่อง มอบหมายงาน ตอบกลับ และติดตามสถานะ — จัดการงานซัพพอร์ตจากแชตได้ครบในแดชบอร์ดเดียว
        </p>
        <div style={{ display: 'flex', gap: 26, marginTop: 38 }}>
          {stats.map(([v, l]) => (
            <div key={l}>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Anuphan, sans-serif', color: '#34E37D', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 12.5, color: '#7DA396', fontWeight: 600, marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: '#5C8473', fontWeight: 500, position: 'relative' }}>© 2026 LINE Issue Tracker · เวอร์ชัน 2.4</div>
    </div>
  );

  /* ---- form panel ---- */
  const formPanel = (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '28px 20px 40px' : '40px', background: '#F4F7F6', minHeight: 0, overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 30 }}>
            <div style={{ width: 56, height: 56, borderRadius: 17, background: '#06C755', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 22px rgba(6,199,85,.45)' }}>
              <LineLogo size={32} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0B3D2E', fontFamily: 'Anuphan, sans-serif' }}>LINE Issue Tracker</div>
              <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>ระบบติดตามปัญหาจาก Line</div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 26 }}>
          <h2 style={{ margin: 0, fontSize: 25, fontWeight: 800, color: '#0F172A', fontFamily: 'Anuphan, sans-serif', letterSpacing: '-.01em' }}>เข้าสู่ระบบ</h2>
          <p style={{ margin: '7px 0 0', fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>ยินดีต้อนรับกลับ เข้าสู่บัญชีแอดมินของคุณ</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field icon="mail" label="อีเมล" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.co.th" />
          <Field
            icon="lock" label="รหัสผ่าน" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••"
            trailing={
              <button type="button" onClick={() => setShow((s) => !s)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', padding: 4, display: 'flex' }}>
                <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
              </button>
            }
          />

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA' }}>
              <Icon name="fire" size={16} style={{ color: '#DC2626', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>{error}</span>
            </div>
          )}

          <button onClick={submit} onKeyDown={(e) => e.key === 'Enter' && submit()} disabled={loading} style={{
            height: 49, border: 'none', borderRadius: 12, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
            fontSize: 15, fontWeight: 700, color: '#fff', background: '#06C755', marginTop: 2,
            boxShadow: '0 4px 14px rgba(6,199,85,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap',
            opacity: loading ? 0.8 : 1, transition: 'all .15s',
          }}>
            {loading ? <Spinner /> : <>เข้าสู่ระบบ <Icon name="chevronRight" size={17} strokeWidth={2.4} /></>}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', fontWeight: 500, marginTop: 24 }}>
          ยังไม่มีบัญชี? <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#06C755', fontWeight: 700, textDecoration: 'none' }}>ติดต่อผู้ดูแลระบบ</a>
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#F4F7F6' }}>
      {!isMobile && brandPanel}
      {formPanel}
    </div>
  );
}

function Spinner({ color = '#fff' }) {
  return (
    <span style={{
      width: 19, height: 19, borderRadius: '50%', display: 'inline-block',
      border: '2.5px solid ' + color + '55', borderTopColor: color, animation: 'spin .7s linear infinite',
    }}></span>
  );
}

Object.assign(window, { Login, LineLogo });
