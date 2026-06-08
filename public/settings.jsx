/* ===== Settings view ===== */

/* ---------- shared settings controls ---------- */
function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
      background: on ? '#06C755' : '#CBD5E1', position: 'relative', transition: 'background .18s', padding: 0,
    }}>
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .18s',
      }}></span>
    </button>
  );
}

function Txt({ label, value, onChange, placeholder, type = 'text', width }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: 'block', width: width || '100%' }}>
      {label && <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>{label}</span>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: '100%', height: 42, padding: '0 13px', borderRadius: 11, fontFamily: 'inherit', fontSize: 14, color: '#1E293B',
          border: '1.5px solid ' + (focus ? '#06C755' : '#E2E8F0'), outline: 'none', background: '#fff',
          boxShadow: focus ? '0 0 0 4px rgba(6,199,85,.1)' : 'none', transition: 'all .15s', boxSizing: 'border-box',
        }}
      />
    </label>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 1px 3px rgba(15,23,42,.05), 0 0 0 1px rgba(15,23,42,.04)', ...style }}>
      {children}
    </div>
  );
}

function SecHead({ title, desc, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0F172A', fontFamily: 'Anuphan, sans-serif', letterSpacing: '-.01em' }}>{title}</h2>
        {desc && <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#94A3B8', fontWeight: 500 }}>{desc}</p>}
      </div>
      {action}
    </div>
  );
}

function GhostBtn({ icon, children, onClick, color = '#06C755', danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, border: '1.5px solid ' + (danger ? '#FECACA' : '#E2E8F0'),
      background: '#fff', borderRadius: 10, padding: '8px 13px', cursor: 'pointer', fontFamily: 'inherit',
      fontSize: 13, fontWeight: 700, color: danger ? '#DC2626' : color, whiteSpace: 'nowrap',
    }}>
      {icon && <Icon name={icon} size={15} strokeWidth={2} />}{children}
    </button>
  );
}

function FillBtn({ icon, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', background: '#06C755', color: '#fff',
      borderRadius: 10, padding: '9px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
      boxShadow: '0 2px 8px rgba(6,199,85,.32)', whiteSpace: 'nowrap',
    }}>
      {icon && <Icon name={icon} size={15} strokeWidth={2.2} />}{children}
    </button>
  );
}

const SWATCHES = ['#06C755', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#0EA5E9', '#10B981', '#64748B'];

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
      {SWATCHES.map((c) => (
        <button key={c} onClick={() => onChange(c)} style={{
          width: 26, height: 26, borderRadius: 8, background: c, border: 'none', cursor: 'pointer',
          boxShadow: value === c ? '0 0 0 2px #fff, 0 0 0 4px ' + c : 'none', transition: 'all .12s',
        }}></button>
      ))}
    </div>
  );
}

/* ====================================================================== */
/* SECTION: Profile                                                       */
/* ====================================================================== */
function ProfileSection({ toast }) {
  const [name, setName] = useState('คุณ (แอดมิน)');
  const [email, setEmail] = useState('admin@line-track.co.th');
  const [phone, setPhone] = useState('081-234-5678');
  const [lang, setLang] = useState('ไทย');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SecHead title="โปรไฟล์ของฉัน" desc="ข้อมูลบัญชีและการแสดงผลของคุณในระบบ" />
      <Card style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid #F1F5F9' }}>
          <Avatar initials="ME" color="#06C755" size={64} ring />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', fontFamily: 'Anuphan, sans-serif' }}>{name}</div>
            <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>แอดมินระบบ · เข้าใช้ล่าสุดวันนี้</div>
          </div>
          <GhostBtn icon="image">เปลี่ยนรูป</GhostBtn>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <Txt label="ชื่อที่แสดง" value={name} onChange={(e) => setName(e.target.value)} />
          <Txt label="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          <Txt label="เบอร์โทรศัพท์" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>ภาษา</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {['ไทย', 'English'].map((l) => (
                <button key={l} onClick={() => setLang(l)} style={{
                  flex: 1, height: 42, borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                  border: '1.5px solid ' + (lang === l ? '#06C755' : '#E2E8F0'), background: lang === l ? '#06C75512' : '#fff',
                  color: lang === l ? '#06C755' : '#64748B',
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: '#0B3D2E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="shield" size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1E293B' }}>รหัสผ่านและความปลอดภัย</div>
            <div style={{ fontSize: 12.5, color: '#94A3B8', fontWeight: 500, marginTop: 1 }}>เปลี่ยนรหัสผ่านล่าสุดเมื่อ 3 เดือนที่แล้ว</div>
          </div>
          <GhostBtn icon="lock">เปลี่ยนรหัสผ่าน</GhostBtn>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <FillBtn icon="save" onClick={() => toast('บันทึกโปรไฟล์แล้ว')}>บันทึกการเปลี่ยนแปลง</FillBtn>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* SECTION: Team                                                          */
/* ====================================================================== */
const ROLES = ['แอดมิน', 'ซัพพอร์ต', 'ทีมเทคนิค', 'ช่างซ่อม', 'การเงิน'];

function TeamSection({ toast }) {
  const [members, setMembers] = useState(() => D.MEMBERS.map((m) => ({ ...m })));
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [lineIdDraft, setLineIdDraft] = useState('');
  const [role, setRole] = useState('ซัพพอร์ต');
  const [color, setColor] = useState('#3B82F6');

  const add = () => {
    if (!nm.trim()) return;
    const initials = nm.trim().slice(0, 2);
    setMembers((arr) => [...arr, { id: 'mx' + Date.now(), name: nm.trim(), role, color, initials }]);
    setNm(''); setAdding(false); toast('เพิ่มสมาชิกทีมแล้ว');
  };
  const remove = (id) => { setMembers((arr) => arr.filter((m) => m.id !== id)); toast('นำสมาชิกออกแล้ว'); };
  const setRoleOf = (id, r) => setMembers((arr) => arr.map((m) => m.id === id ? { ...m, role: r } : m));

  const openLineId = (m) => {
    setExpandedId(m.id === expandedId ? null : m.id);
    setLineIdDraft(m.line_user_id || '');
  };
  const saveLineId = async (id) => {
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_user_id: lineIdDraft.trim() || null }),
      });
      const updated = await res.json();
      setMembers((arr) => arr.map((m) => m.id === id ? { ...m, line_user_id: updated.line_user_id } : m));
      setExpandedId(null);
      toast('บันทึก Line User ID แล้ว');
    } catch { toast('เกิดข้อผิดพลาด'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SecHead title="จัดการทีมงาน" desc={`สมาชิกทั้งหมด ${members.length} คนที่รับมอบหมายงานได้`}
        action={<FillBtn icon="userPlus" onClick={() => setAdding((a) => !a)}>เพิ่มสมาชิก</FillBtn>} />

      {adding && (
        <Card style={{ padding: 18, border: '1.5px solid #06C75566', animation: 'pop .14s ease-out' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Txt label="ชื่อสมาชิก" value={nm} onChange={(e) => setNm(e.target.value)} placeholder="เช่น สมชาย ใจดี" width={200} />
            <div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>บทบาท</span>
              <Dropdown align="left" width={170} trigger={(open) => (
                <button style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 13px', borderRadius: 11, border: '1.5px solid ' + (open ? '#06C755' : '#E2E8F0'), background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: '#334155', minWidth: 150 }}>
                  <span style={{ flex: 1, textAlign: 'left' }}>{role}</span><Icon name="chevronDown" size={14} style={{ color: '#94A3B8' }} />
                </button>
              )}>
                {(close) => ROLES.map((r) => <MenuItem key={r} active={role === r} onClick={() => { setRole(r); close(); }}>{r}</MenuItem>)}
              </Dropdown>
            </div>
            <div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 8 }}>สี</span>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div style={{ flex: 1 }}></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <GhostBtn onClick={() => setAdding(false)} color="#64748B">ยกเลิก</GhostBtn>
              <FillBtn icon="check" onClick={add}>เพิ่ม</FillBtn>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {members.map((m, i) => (
          <div key={m.id} style={{ borderTop: i ? '1px solid #F1F5F9' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
              <Avatar initials={m.initials} color={m.color} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.name}{m.id === 'm0' && <span style={{ fontSize: 11, fontWeight: 700, color: '#06C755', background: '#06C75514', padding: '2px 8px', borderRadius: 6, marginLeft: 8 }}>คุณ</span>}
                </div>
                <div style={{ fontSize: 12, color: m.line_user_id ? '#06C755' : '#CBD5E1', fontWeight: 500, marginTop: 2 }}>
                  {m.line_user_id ? `Line: ${m.line_user_id.slice(0, 12)}…` : 'ยังไม่ได้ผูก Line ID'}
                </div>
              </div>
              <Dropdown align="right" width={170} trigger={(open) => (
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 12px', borderRadius: 9, border: '1.5px solid ' + (open ? '#06C755' : '#E2E8F0'), background: '#F8FAFC', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  {m.role}<Icon name="chevronDown" size={13} style={{ color: '#94A3B8' }} />
                </button>
              )}>
                {(close) => ROLES.map((r) => <MenuItem key={r} active={m.role === r} onClick={() => { setRoleOf(m.id, r); close(); }}>{r}</MenuItem>)}
              </Dropdown>
              <button onClick={() => openLineId(m)} title="ผูก Line ID" style={{ border: 'none', background: expandedId === m.id ? '#EFF6FF' : 'transparent', cursor: 'pointer', color: expandedId === m.id ? '#3B82F6' : '#94A3B8', padding: 7, borderRadius: 8, display: 'flex' }}
                onMouseEnter={(e) => { if (expandedId !== m.id) { e.currentTarget.style.color = '#3B82F6'; e.currentTarget.style.background = '#EFF6FF'; } }}
                onMouseLeave={(e) => { if (expandedId !== m.id) { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; } }}>
                <Icon name="link" size={17} />
              </button>
              {m.id !== 'm0' && (
                <button onClick={() => remove(m.id)} title="นำออก" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#CBD5E1', padding: 7, borderRadius: 8, display: 'flex' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#CBD5E1'; e.currentTarget.style.background = 'transparent'; }}>
                  <Icon name="trash" size={17} />
                </button>
              )}
            </div>
            {expandedId === m.id && (
              <div style={{ padding: '0 18px 16px', display: 'flex', gap: 10, alignItems: 'flex-end', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', animation: 'pop .12s ease-out' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Line User ID <span style={{ color: '#94A3B8', fontWeight: 400 }}>(ให้ทีมงานพิมพ์ "myid" ในกลุ่ม Line เพื่อรับ ID)</span></div>
                  <input value={lineIdDraft} onChange={(e) => setLineIdDraft(e.target.value)}
                    placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    style={{ width: '100%', height: 40, padding: '0 13px', borderRadius: 10, fontFamily: 'monospace', fontSize: 13, color: '#1E293B', border: '1.5px solid #06C755', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <FillBtn icon="check" onClick={() => saveLineId(m.id)}>บันทึก</FillBtn>
                <button onClick={() => setExpandedId(null)} style={{ height: 40, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#64748B' }}>ยกเลิก</button>
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ====================================================================== */
/* SECTION: Categories                                                    */
/* ====================================================================== */
function CategoriesSection({ toast }) {
  const [cats, setCats] = useState(() => Object.entries(D.CATEGORIES).map(([k, v]) => ({ id: k, ...v })));
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#10B981');

  const add = () => {
    if (!label.trim()) return;
    setCats((arr) => [...arr, { id: 'c' + Date.now(), label: label.trim(), color }]);
    setLabel(''); setAdding(false); toast('เพิ่มหมวดหมู่แล้ว');
  };
  const remove = (id) => { setCats((arr) => arr.filter((c) => c.id !== id)); toast('ลบหมวดหมู่แล้ว'); };
  const recolor = (id, c) => setCats((arr) => arr.map((x) => x.id === id ? { ...x, color: c } : x));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SecHead title="หมวดหมู่ปัญหา" desc="จัดประเภทเรื่องที่แจ้งเข้ามาเพื่อกรองและทำรายงาน"
        action={<FillBtn icon="plus" onClick={() => setAdding((a) => !a)}>เพิ่มหมวดหมู่</FillBtn>} />

      {adding && (
        <Card style={{ padding: 18, border: '1.5px solid #06C75566', animation: 'pop .14s ease-out' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Txt label="ชื่อหมวดหมู่" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="เช่น ข้อเสนอแนะ" width={220} />
            <div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 8 }}>สี</span>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div style={{ flex: 1 }}></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <GhostBtn onClick={() => setAdding(false)} color="#64748B">ยกเลิก</GhostBtn>
              <FillBtn icon="check" onClick={add}>เพิ่ม</FillBtn>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {cats.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderTop: i ? '1px solid #F1F5F9' : 'none' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: c.color + '14', color: c.color }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: c.color }}></span>{c.label}
            </span>
            <div style={{ flex: 1 }}></div>
            <ColorPicker value={c.color} onChange={(col) => recolor(c.id, col)} />
            <button onClick={() => remove(c.id)} title="ลบ" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#CBD5E1', padding: 7, borderRadius: 8, display: 'flex' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#CBD5E1'; e.currentTarget.style.background = 'transparent'; }}>
              <Icon name="trash" size={17} />
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ====================================================================== */
/* SECTION: Quick replies                                                 */
/* ====================================================================== */
function RepliesSection({ toast }) {
  const [list, setList] = useState([
    'รับเรื่องแล้วครับ กำลังตรวจสอบให้นะครับ 🙏',
    'ขออภัยในความไม่สะดวกค่ะ',
    'ดำเนินการเรียบร้อยแล้วครับ',
    'รบกวนแจ้งรายละเอียดเพิ่มเติมหน่อยได้ไหมคะ',
    'ขอบคุณที่แจ้งเข้ามานะคะ 😊',
  ]);
  const [val, setVal] = useState('');

  const add = () => { if (!val.trim()) return; setList((l) => [...l, val.trim()]); setVal(''); toast('เพิ่มข้อความด่วนแล้ว'); };
  const remove = (i) => { setList((l) => l.filter((_, x) => x !== i)); toast('ลบข้อความแล้ว'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SecHead title="ข้อความตอบกลับด่วน" desc="ปุ่มลัดสำหรับตอบลูกค้า แสดงเหนือกล่องพิมพ์ข้อความ" />
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            placeholder="พิมพ์ข้อความที่ใช้บ่อย แล้วกด Enter…"
            style={{ flex: 1, height: 44, padding: '0 14px', borderRadius: 11, border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: 'inherit', fontSize: 14, color: '#1E293B' }} />
          <FillBtn icon="plus" onClick={add}>เพิ่ม</FillBtn>
        </div>
      </Card>
      <Card>
        {list.map((q, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: i ? '1px solid #F1F5F9' : 'none' }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: '#06C75514', color: '#06C755', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="message" size={15} /></span>
            <span style={{ flex: 1, fontSize: 14, color: '#334155', fontWeight: 500, lineHeight: 1.5 }}>{q}</span>
            <button onClick={() => remove(i)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#CBD5E1', padding: 7, borderRadius: 8, display: 'flex' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#CBD5E1'; e.currentTarget.style.background = 'transparent'; }}>
              <Icon name="trash" size={17} />
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ====================================================================== */
/* SECTION: Notifications & SLA                                           */
/* ====================================================================== */
function NotifySection({ toast }) {
  const [n, setN] = useState({ newIssue: true, urgent: true, assigned: true, daily: false, sound: true });
  const set = (k) => (v) => setN((s) => ({ ...s, [k]: v }));
  const [sla, setSla] = useState({ urgent: 15, high: 60, normal: 240 });

  const rows = [
    ['newIssue', 'bell', 'มีปัญหาใหม่เข้ามา', 'แจ้งเตือนทุกครั้งที่มีเรื่องใหม่จากกลุ่ม Line'],
    ['urgent', 'fire', 'เรื่องด่วนมาก', 'เด้งแจ้งเตือนทันทีเมื่อมีเรื่องระดับด่วนมาก'],
    ['assigned', 'user', 'งานที่มอบหมายให้ฉัน', 'เมื่อมีคนมอบหมายงานให้คุณ'],
    ['daily', 'chart', 'สรุปรายวันทาง Line', 'ส่งสรุปภาพรวมเข้า Line ทุกวันเวลา 20:00 น.'],
    ['sound', 'zap', 'เสียงแจ้งเตือน', 'เล่นเสียงเมื่อมีการแจ้งเตือนใหม่'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SecHead title="การแจ้งเตือน & SLA" desc="ควบคุมการแจ้งเตือนและตั้งเป้าหมายเวลาตอบกลับ" />
      <Card>
        {rows.map(([k, icon, title, desc], i) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', borderTop: i ? '1px solid #F1F5F9' : 'none' }}>
            <span style={{ width: 38, height: 38, borderRadius: 11, background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={18} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1E293B' }}>{title}</div>
              <div style={{ fontSize: 12.5, color: '#94A3B8', fontWeight: 500, marginTop: 1 }}>{desc}</div>
            </div>
            <Toggle on={n[k]} onChange={(v) => { set(k)(v); toast(v ? 'เปิดการแจ้งเตือนแล้ว' : 'ปิดการแจ้งเตือนแล้ว'); }} />
          </div>
        ))}
      </Card>

      <Card style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Icon name="clock" size={18} style={{ color: '#0B3D2E' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', fontFamily: 'Anuphan, sans-serif' }}>เป้าหมายเวลาตอบกลับ (SLA)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
          {[['urgent', 'ด่วนมาก', '#DC2626'], ['high', 'ด่วน', '#F59E0B'], ['normal', 'ปกติ', '#64748B']].map(([k, lbl, col]) => (
            <div key={k} style={{ background: '#F8FAFB', borderRadius: 13, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: col }}></span>
                <span style={{ fontSize: 13, fontWeight: 700, color: col }}>{lbl}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" value={sla[k]} onChange={(e) => setSla((s) => ({ ...s, [k]: e.target.value }))}
                  style={{ width: 70, height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', outline: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#1E293B' }} />
                <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>นาที</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <FillBtn icon="save" onClick={() => toast('บันทึกการตั้งค่าแล้ว')}>บันทึก SLA</FillBtn>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* SECTION: Line connection                                               */
/* ====================================================================== */
function ConnectionSection({ toast }) {
  const [groups, setGroups] = useState(() => D.GROUPS.map((g) => ({ ...g, connected: true })));
  const toggle = (id) => setGroups((arr) => arr.map((g) => {
    if (g.id !== id) return g;
    toast(g.connected ? 'ตัดการเชื่อมต่อแล้ว' : 'เชื่อมต่อใหม่แล้ว');
    return { ...g, connected: !g.connected };
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SecHead title="การเชื่อมต่อ LINE" desc="จัดการ Official Account, กลุ่ม และ OpenChat ที่เชื่อมกับระบบ" />

      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <span style={{ width: 46, height: 46, borderRadius: 13, background: '#06C755', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(6,199,85,.4)' }}><LineLogo size={26} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'Anuphan, sans-serif' }}>@linetrack-support</div>
            <div style={{ fontSize: 12.5, color: '#06C755', fontWeight: 700, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: '#06C755' }}></span>LINE Official Account · เชื่อมต่อแล้ว</div>
          </div>
        </div>
        <div style={{ background: '#0B3D2E', borderRadius: 12, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="link" size={16} style={{ color: '#7DA396' }} />
          <span style={{ flex: 1, fontSize: 12.5, color: '#A7CDBE', fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>https://api.line-track.co.th/webhook/v2/inbound</span>
          <button onClick={() => toast('คัดลอก Webhook URL แล้ว')} style={{ border: 'none', background: '#06C755', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}>คัดลอก</button>
        </div>
      </Card>

      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#94A3B8', padding: '0 4px', letterSpacing: '.02em' }}>กลุ่มและ OpenChat ({groups.filter((g) => g.connected).length}/{groups.length} เชื่อมต่อ)</div>
      <Card>
        {groups.map((g, i) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i ? '1px solid #F1F5F9' : 'none', opacity: g.connected ? 1 : 0.6 }}>
            <Avatar initials={g.initials} color={g.color} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: g.connected ? '#06C755' : '#94A3B8', marginTop: 2 }}>{g.type === 'openchat' ? 'OpenChat' : 'กลุ่ม Line'} · {g.connected ? 'เชื่อมต่อแล้ว' : 'ตัดการเชื่อมต่อ'}</div>
            </div>
            <GhostBtn onClick={() => toggle(g.id)} danger={g.connected} color="#06C755">{g.connected ? 'ตัดการเชื่อมต่อ' : 'เชื่อมต่อ'}</GhostBtn>
          </div>
        ))}
        <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '15px', border: 'none', borderTop: '1px solid #F1F5F9', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: '#06C755' }}>
          <Icon name="plus" size={17} strokeWidth={2.2} />เชื่อมต่อกลุ่มใหม่
        </button>
      </Card>
    </div>
  );
}

/* ====================================================================== */
/* Settings shell                                                         */
/* ====================================================================== */
const SETTINGS_NAV = [
  { id: 'profile', label: 'โปรไฟล์', icon: 'user' },
  { id: 'team', label: 'ทีมงาน', icon: 'groups' },
  { id: 'categories', label: 'หมวดหมู่', icon: 'tag' },
  { id: 'replies', label: 'ข้อความด่วน', icon: 'message' },
  { id: 'notify', label: 'แจ้งเตือน & SLA', icon: 'sliders' },
  { id: 'connection', label: 'เชื่อมต่อ LINE', icon: 'link' },
];

function Settings({ isMobile, toast }) {
  const [sec, setSec] = useState('profile');

  const content = {
    profile: <ProfileSection toast={toast} />,
    team: <TeamSection toast={toast} />,
    categories: <CategoriesSection toast={toast} />,
    replies: <RepliesSection toast={toast} />,
    notify: <NotifySection toast={toast} />,
    connection: <ConnectionSection toast={toast} />,
  }[sec];

  if (isMobile) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F4F7F6', minHeight: 0 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 14px', background: '#fff', borderBottom: '1px solid #EEF2F1', flexShrink: 0 }}>
          {SETTINGS_NAV.map((s) => {
            const on = sec === s.id;
            return (
              <button key={s.id} onClick={() => setSec(s.id)} style={{
                flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                background: on ? '#0B3D2E' : '#F1F5F9', color: on ? '#fff' : '#64748B',
              }}><Icon name={s.icon} size={15} />{s.label}</button>
            );
          })}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 40px' }}>{content}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#F4F7F6', minHeight: 0 }}>
      <div style={{ width: 232, flexShrink: 0, borderRight: '1px solid #EEF2F1', padding: '20px 14px', background: '#fff', overflowY: 'auto' }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', padding: '0 10px 10px', letterSpacing: '.04em', textTransform: 'uppercase' }}>การตั้งค่า</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {SETTINGS_NAV.map((s) => {
            const on = sec === s.id;
            return (
              <button key={s.id} onClick={() => setSec(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 11, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14, fontWeight: on ? 700 : 600, textAlign: 'left',
                background: on ? '#06C75514' : 'transparent', color: on ? '#06C755' : '#64748B', transition: 'all .12s',
              }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                <Icon name={s.icon} size={18} strokeWidth={on ? 2 : 1.75} />{s.label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '26px 32px 48px', minWidth: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>{content}</div>
      </div>
    </div>
  );
}

Object.assign(window, { Settings, Toggle });
