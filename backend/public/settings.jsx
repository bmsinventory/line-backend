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
function ProfileSection({ toast, currentUser }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pw, setPw] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [role, setRole] = useState('');

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(data => {
      setForm({ name: data.name || '', email: data.email || '', phone: data.phone || '' });
      setRole(data.role || currentUser?.role || '');
      setLoading(false);
    }).catch(() => {
      setForm({ name: currentUser?.name || '', email: '', phone: '' });
      setRole(currentUser?.role || '');
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
      toast('บันทึกโปรไฟล์แล้ว');
    } catch (err) { toast('เกิดข้อผิดพลาด: ' + err.message); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (pw !== pwConfirm) { toast('รหัสผ่านไม่ตรงกัน'); return; }
    if (pw.length < 6) { toast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    setPwSaving(true);
    try {
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
      setChangingPw(false); setPw(''); setPwConfirm('');
      toast('เปลี่ยนรหัสผ่านแล้ว');
    } catch (err) { toast('เกิดข้อผิดพลาด: ' + err.message); }
    finally { setPwSaving(false); }
  };

  const initials = form.name ? form.name.slice(0, 2) : 'ME';

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 }}>กำลังโหลด…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SecHead title="โปรไฟล์ของฉัน" desc="ข้อมูลบัญชีและการแสดงผลของคุณในระบบ" />
      <Card style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid #F1F5F9' }}>
          <Avatar initials={initials} color="#06C755" size={64} ring />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', fontFamily: 'Anuphan, sans-serif' }}>{form.name || 'ผู้ใช้งาน'}</div>
            <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>{role}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <Txt label="ชื่อที่แสดง" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          <Txt label="อีเมล" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
          <Txt label="เบอร์โทรศัพท์" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
      </Card>

      <Card style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: '#0B3D2E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="shield" size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1E293B' }}>รหัสผ่านและความปลอดภัย</div>
          </div>
          {!changingPw && <GhostBtn icon="lock" onClick={() => setChangingPw(true)}>เปลี่ยนรหัสผ่าน</GhostBtn>}
        </div>
        {changingPw && (
          <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', padding: '14px 16px', background: '#F0FDF4', borderRadius: 12, border: '1.5px solid #BBF7D0' }}>
            <Txt label="รหัสผ่านใหม่" type="password" value={pw} onChange={(e) => setPw(e.target.value)} width={200} />
            <Txt label="ยืนยันรหัสผ่าน" type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} width={200} />
            <div style={{ display: 'flex', gap: 8 }}>
              <GhostBtn color="#64748B" onClick={() => { setChangingPw(false); setPw(''); setPwConfirm(''); }}>ยกเลิก</GhostBtn>
              <FillBtn icon="save" onClick={savePassword}>{pwSaving ? 'กำลังบันทึก…' : 'บันทึก'}</FillBtn>
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <FillBtn icon="save" onClick={save}>{saving ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง'}</FillBtn>
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
  const [saving, setSaving] = useState(false);
  const [nm, setNm] = useState('');
  const [role, setRole] = useState('ซัพพอร์ต');
  const [color, setColor] = useState('#3B82F6');
  // expand panels — only one open at a time
  const [expandedId, setExpandedId] = useState(null);   // Line ID panel
  const [editId, setEditId] = useState(null);            // Edit info panel
  const [lineIdDraft, setLineIdDraft] = useState('');
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [pwId, setPwId] = useState(null);
  const [pwValue, setPwValue] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const syncGlobal = (arr) => { D.MEMBERS = arr; };

  const openLineId = (m) => {
    setEditId(null);
    setPwId(null);
    setExpandedId(m.id === expandedId ? null : m.id);
    setLineIdDraft(m.line_user_id || '');
  };
  const openEdit = (m) => {
    setExpandedId(null);
    setPwId(null);
    setEditId(m.id === editId ? null : m.id);
    setEditName(m.name);
    setEditColor(m.color);
    setEditEmail(m.email || '');
    setEditPhone(m.phone || '');
  };
  const openPw = (m) => {
    setExpandedId(null);
    setEditId(null);
    setPwId(m.id === pwId ? null : m.id);
    setPwValue('');
    setPwConfirm('');
  };

  const add = async () => {
    if (!nm.trim() || saving) return;
    const id = 'mx' + Date.now();
    const initials = nm.trim().slice(0, 2);
    const member = { id, name: nm.trim(), role, color, initials };
    setSaving(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
      const saved = await res.json();
      setMembers((arr) => { const next = [...arr, saved]; syncGlobal(next); return next; });
      setNm(''); setAdding(false); toast('เพิ่มสมาชิกทีมแล้ว');
    } catch (err) {
      toast('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      const res = await fetch('/api/members/' + id, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
      setMembers((arr) => { const next = arr.filter((m) => m.id !== id); syncGlobal(next); return next; });
      toast('นำสมาชิกออกแล้ว');
    } catch (err) {
      toast('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const setRoleOf = async (id, r) => {
    try {
      const res = await fetch('/api/members/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: r }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
      setMembers((arr) => { const next = arr.map((m) => m.id === id ? { ...m, role: r } : m); syncGlobal(next); return next; });
    } catch (err) {
      toast('เกิดข้อผิดพลาด: ' + err.message);
    }
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

  const saveMember = async (id) => {
    if (!editName.trim()) return;
    const initials = editName.trim().slice(0, 2);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), color: editColor, initials, email: editEmail.trim() || null, phone: editPhone.trim() || null }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
      const updated = await res.json();
      setMembers((arr) => { const next = arr.map((m) => m.id === id ? { ...m, name: editName.trim(), color: editColor, initials, email: updated.email || null, phone: updated.phone || null } : m); syncGlobal(next); return next; });
      setEditId(null);
      toast('แก้ไขข้อมูลสมาชิกแล้ว');
    } catch (err) { toast('เกิดข้อผิดพลาด: ' + err.message); }
  };

  const savePassword = async (id) => {
    if (pwValue !== pwConfirm) { toast('รหัสผ่านไม่ตรงกัน'); return; }
    if (pwValue.length < 6) { toast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    setPwSaving(true);
    try {
      const res = await fetch(`/api/members/${id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwValue }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
      setPwId(null);
      toast('ตั้งรหัสผ่านแล้ว');
    } catch (err) { toast('เกิดข้อผิดพลาด: ' + err.message); }
    finally { setPwSaving(false); }
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
              <FillBtn icon="check" onClick={add}>{saving ? 'กำลังบันทึก…' : 'เพิ่ม'}</FillBtn>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {members.map((m, i) => (
          <div key={m.id} style={{ borderTop: i ? '1px solid #F1F5F9' : 'none' }}>
            {/* row */}
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
              {/* ปุ่มแก้ไขชื่อ/สี */}
              <button onClick={() => openEdit(m)} title="แก้ไขข้อมูล" style={{ border: 'none', background: editId === m.id ? '#FFF7ED' : 'transparent', cursor: 'pointer', color: editId === m.id ? '#F59E0B' : '#94A3B8', padding: 7, borderRadius: 8, display: 'flex' }}
                onMouseEnter={(e) => { if (editId !== m.id) { e.currentTarget.style.color = '#F59E0B'; e.currentTarget.style.background = '#FFF7ED'; } }}
                onMouseLeave={(e) => { if (editId !== m.id) { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; } }}>
                <Icon name="pencil" size={17} />
              </button>
              {/* ปุ่มตั้งรหัสผ่าน */}
              <button onClick={() => openPw(m)} title="ตั้งรหัสผ่าน" style={{ border: 'none', background: pwId === m.id ? '#F0FDF4' : 'transparent', cursor: 'pointer', color: pwId === m.id ? '#16A34A' : '#94A3B8', padding: 7, borderRadius: 8, display: 'flex' }}
                onMouseEnter={(e) => { if (pwId !== m.id) { e.currentTarget.style.color = '#16A34A'; e.currentTarget.style.background = '#F0FDF4'; } }}
                onMouseLeave={(e) => { if (pwId !== m.id) { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; } }}>
                <Icon name="lock" size={17} />
              </button>
              {/* ปุ่มผูก Line ID */}
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

            {/* Edit info panel */}
            {editId === m.id && (
              <div style={{ padding: '12px 18px 16px', background: '#FFFBEB', borderTop: '1px solid #FEF3C7', animation: 'pop .12s ease-out' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>ชื่อสมาชิก</div>
                    <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveMember(m.id); if (e.key === 'Escape') setEditId(null); }}
                      style={{ height: 40, padding: '0 13px', borderRadius: 10, border: '1.5px solid #F59E0B', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#1E293B', background: '#fff', minWidth: 180, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>อีเมล</div>
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="email@example.com"
                      style={{ height: 40, padding: '0 13px', borderRadius: 10, border: '1.5px solid #F59E0B', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#1E293B', background: '#fff', minWidth: 190, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>เบอร์โทรศัพท์</div>
                    <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="0812345678"
                      style={{ height: 40, padding: '0 13px', borderRadius: 10, border: '1.5px solid #F59E0B', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#1E293B', background: '#fff', minWidth: 150, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 8 }}>สี</div>
                    <ColorPicker value={editColor} onChange={setEditColor} />
                  </div>
                  <div style={{ flex: 1 }}></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => saveMember(m.id)} style={{ height: 40, padding: '0 16px', border: 'none', background: '#F59E0B', color: '#fff', cursor: 'pointer', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>บันทึก</button>
                    <button onClick={() => setEditId(null)} style={{ height: 40, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#64748B' }}>ยกเลิก</button>
                  </div>
                </div>
              </div>
            )}

            {/* Line ID panel */}
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

            {/* Password panel */}
            {pwId === m.id && (
              <div style={{ padding: '12px 18px 16px', background: '#F0FDF4', borderTop: '1px solid #BBF7D0', animation: 'pop .12s ease-out' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#15803D', marginBottom: 6 }}>รหัสผ่านใหม่</div>
                    <input type="password" autoFocus value={pwValue} onChange={(e) => setPwValue(e.target.value)}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      style={{ height: 40, padding: '0 13px', borderRadius: 10, border: '1.5px solid #22C55E', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#1E293B', background: '#fff', minWidth: 200, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#15803D', marginBottom: 6 }}>ยืนยันรหัสผ่าน</div>
                    <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)}
                      placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                      style={{ height: 40, padding: '0 13px', borderRadius: 10, border: '1.5px solid ' + (pwConfirm && pwValue !== pwConfirm ? '#EF4444' : '#22C55E'), outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#1E293B', background: '#fff', minWidth: 200, boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => savePassword(m.id)} disabled={pwSaving} style={{ height: 40, padding: '0 16px', border: 'none', background: '#16A34A', color: '#fff', cursor: pwSaving ? 'default' : 'pointer', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', opacity: pwSaving ? 0.7 : 1 }}>{pwSaving ? 'กำลังบันทึก…' : 'ตั้งรหัสผ่าน'}</button>
                    <button onClick={() => setPwId(null)} style={{ height: 40, padding: '0 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#64748B' }}>ยกเลิก</button>
                  </div>
                </div>
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
  const [cats, setCats] = useState([]);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#10B981');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(data => setCats(data)).catch(() => {});
  }, []);

  const syncGlobal = (arr) => {
    D.CATEGORIES = {};
    arr.forEach(c => { D.CATEGORIES[c.id] = { label: c.label, color: c.color }; });
  };

  const add = async () => {
    if (!label.trim() || saving) return;
    const id = 'c' + Date.now();
    setSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, label: label.trim(), color }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
      const saved = await res.json();
      setCats(arr => { const next = [...arr, saved]; syncGlobal(next); return next; });
      setLabel(''); setAdding(false); toast('เพิ่มหมวดหมู่แล้ว');
    } catch (err) { toast('เกิดข้อผิดพลาด: ' + err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    try {
      const res = await fetch('/api/categories/' + id, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
      setCats(arr => { const next = arr.filter(c => c.id !== id); syncGlobal(next); return next; });
      toast('ลบหมวดหมู่แล้ว');
    } catch (err) { toast('เกิดข้อผิดพลาด: ' + err.message); }
  };

  const saveLabel = async (id) => {
    if (!editLabel.trim()) return;
    try {
      const res = await fetch('/api/categories/' + id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editLabel.trim() }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
      setCats(arr => { const next = arr.map(c => c.id === id ? { ...c, label: editLabel.trim() } : c); syncGlobal(next); return next; });
      setEditId(null); toast('แก้ไขหมวดหมู่แล้ว');
    } catch (err) { toast('เกิดข้อผิดพลาด: ' + err.message); }
  };

  const recolor = async (id, newColor) => {
    try {
      await fetch('/api/categories/' + id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: newColor }),
      });
      setCats(arr => { const next = arr.map(c => c.id === id ? { ...c, color: newColor } : c); syncGlobal(next); return next; });
    } catch (err) { toast('เกิดข้อผิดพลาด: ' + err.message); }
  };

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
            {editId === c.id ? (
              <input autoFocus value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveLabel(c.id); if (e.key === 'Escape') setEditId(null); }}
                style={{ height: 34, padding: '0 12px', borderRadius: 8, border: '1.5px solid #06C755', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: '#334155', minWidth: 130 }} />
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: c.color + '14', color: c.color }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: c.color }}></span>{c.label}
              </span>
            )}
            <div style={{ flex: 1 }}></div>
            <ColorPicker value={c.color} onChange={(col) => recolor(c.id, col)} />
            {editId === c.id ? (
              <>
                <button onClick={() => saveLabel(c.id)} style={{ border: 'none', background: '#06C755', color: '#fff', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>บันทึก</button>
                <button onClick={() => setEditId(null)} style={{ border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>ยกเลิก</button>
              </>
            ) : (
              <button onClick={() => { setEditId(c.id); setEditLabel(c.label); }} title="แก้ไขชื่อ" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', padding: 7, borderRadius: 8, display: 'flex' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#3B82F6'; e.currentTarget.style.background = '#EFF6FF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; }}>
                <Icon name="pencil" size={17} />
              </button>
            )}
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
  const [list, setList] = useState([]);
  const [val, setVal] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetch('/api/quick-replies').then(r => r.json()).then(data => setList(data)).catch(() => {});
  }, []);

  const add = async () => {
    if (!val.trim()) return;
    try {
      const res = await fetch('/api/quick-replies', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: val.trim() }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
      const saved = await res.json();
      setList(l => [...l, saved]); setVal(''); toast('เพิ่มข้อความด่วนแล้ว');
    } catch (err) { toast('เกิดข้อผิดพลาด: ' + err.message); }
  };

  const saveText = async (id) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch('/api/quick-replies/' + id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText.trim() }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
      const saved = await res.json();
      setList(l => l.map(q => q.id === id ? { ...q, text: saved.text } : q));
      setEditId(null); toast('แก้ไขข้อความแล้ว');
    } catch (err) { toast('เกิดข้อผิดพลาด: ' + err.message); }
  };

  const remove = async (id) => {
    try {
      const res = await fetch('/api/quick-replies/' + id, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || res.statusText); }
      setList(l => l.filter(x => x.id !== id)); toast('ลบข้อความแล้ว');
    } catch (err) { toast('เกิดข้อผิดพลาด: ' + err.message); }
  };

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
          <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: i ? '1px solid #F1F5F9' : 'none' }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: '#06C75514', color: '#06C755', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="message" size={15} /></span>
            {editId === q.id ? (
              <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveText(q.id); if (e.key === 'Escape') setEditId(null); }}
                style={{ flex: 1, height: 38, padding: '0 12px', borderRadius: 8, border: '1.5px solid #06C755', outline: 'none', fontFamily: 'inherit', fontSize: 14, color: '#1E293B' }} />
            ) : (
              <span style={{ flex: 1, fontSize: 14, color: '#334155', fontWeight: 500, lineHeight: 1.5 }}>{q.text}</span>
            )}
            {editId === q.id ? (
              <>
                <button onClick={() => saveText(q.id)} style={{ border: 'none', background: '#06C755', color: '#fff', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>บันทึก</button>
                <button onClick={() => setEditId(null)} style={{ border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>ยกเลิก</button>
              </>
            ) : (
              <button onClick={() => { setEditId(q.id); setEditText(q.text); }} title="แก้ไข" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', padding: 7, borderRadius: 8, display: 'flex' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#3B82F6'; e.currentTarget.style.background = '#EFF6FF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; }}>
                <Icon name="pencil" size={17} />
              </button>
            )}
            <button onClick={() => remove(q.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#CBD5E1', padding: 7, borderRadius: 8, display: 'flex' }}
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
  const [sla, setSla] = useState({ urgent: 15, high: 60, normal: 240 });

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data.notifications) setN(data.notifications);
      if (data.sla) setSla(data.sla);
    }).catch(() => {});
  }, []);

  const saveNotify = async (k, v) => {
    const updated = { ...n, [k]: v };
    setN(updated);
    try {
      await fetch('/api/settings/notifications', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: updated }),
      });
      toast(v ? 'เปิดการแจ้งเตือนแล้ว' : 'ปิดการแจ้งเตือนแล้ว');
    } catch { toast('เกิดข้อผิดพลาด'); }
  };

  const saveSla = async () => {
    try {
      await fetch('/api/settings/sla', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: { urgent: Number(sla.urgent), high: Number(sla.high), normal: Number(sla.normal) } }),
      });
      toast('บันทึก SLA แล้ว');
    } catch { toast('เกิดข้อผิดพลาด'); }
  };

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
            <Toggle on={n[k]} onChange={(v) => saveNotify(k, v)} />
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
        <FillBtn icon="save" onClick={saveSla}>บันทึก SLA</FillBtn>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* SECTION: Line connection                                               */
/* ====================================================================== */
function UrlRow({ label, url, toast }) {
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => toast('คัดลอก ' + label + ' แล้ว')).catch(() => toast('คัดลอกไม่สำเร็จ'));
  };
  return (
    <div style={{ marginBottom: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#7DA396', marginBottom: 7 }}>{label}</div>
      <div style={{ background: '#0B3D2E', borderRadius: 12, padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon name="link" size={16} style={{ color: '#7DA396', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12, color: '#A7CDBE', fontWeight: 600, fontFamily: 'monospace', wordBreak: 'break-all' }}>{url}</span>
        <button onClick={copy} style={{ border: 'none', background: '#06C755', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>คัดลอก</button>
      </div>
    </div>
  );
}

function ConnectionSection({ toast }) {
  const origin = window.location.origin;
  const webhookUrl    = origin + '/api/webhook';
  const callbackUrl   = origin + '/api/auth/line/callback';

  const [groups, setGroups] = useState(() => D.GROUPS.map((g) => ({ ...g })));
  const toggle = (id) => setGroups((arr) => arr.map((g) => {
    if (g.id !== id) return g;
    toast(g.connected ? 'ตัดการเชื่อมต่อแล้ว' : 'เชื่อมต่อใหม่แล้ว');
    return { ...g, connected: !g.connected };
  }));

  const [arEnabled, setArEnabled] = useState(true);
  const [arMode, setArMode] = useState('flex');
  const [arTemplate, setArTemplate] = useState('✅ รับเรื่องแล้วครับ คุณ{{name}}\n📋 "{{title}}"\nทีมงานจะติดต่อกลับเร็ว ๆ นี้');
  const [arFlexJson, setArFlexJson] = useState('');
  const [arFlexError, setArFlexError] = useState('');
  const [arSaving, setArSaving] = useState(false);

  useEffect(() => {
    fetch('/api/app-settings').then(r => r.json()).then(s => {
      setArEnabled(s.autoReplyEnabled !== false);
      setArMode(s.autoReplyMode || 'flex');
      setArTemplate(s.autoReplyTemplate || '');
      setArFlexJson(s.autoReplyFlexJson || '');
    }).catch(() => {});
  }, []);

  const validateFlex = (json) => {
    if (!json.trim()) { setArFlexError(''); return; }
    try {
      const p = JSON.parse(json);
      if (p.type !== 'bubble' && p.type !== 'carousel') {
        setArFlexError('ต้องเป็น bubble หรือ carousel — วาง contents เท่านั้น ไม่ต้องใส่ {"type":"flex",...} ด้านนอก');
      } else { setArFlexError(''); }
    } catch (e) { setArFlexError('JSON ไม่ถูกต้อง: ' + e.message.slice(0, 80)); }
  };

  const saveAutoReply = async () => {
    setArSaving(true);
    try {
      await fetch('/api/app-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoReplyEnabled: arEnabled, autoReplyMode: arMode, autoReplyTemplate: arTemplate, autoReplyFlexJson: arFlexJson }),
      });
      toast('บันทึกข้อความตอบรับแล้ว');
    } catch { toast('เกิดข้อผิดพลาด'); }
    finally { setArSaving(false); }
  };

  const arPreview = arTemplate.replace(/\{\{name\}\}/g, 'ชื่อผู้แจ้ง').replace(/\{\{title\}\}/g, 'หัวข้อปัญหา');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SecHead title="การเชื่อมต่อ LINE" desc="จัดการ Official Account, กลุ่ม และ OpenChat ที่เชื่อมกับระบบ" />

      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <span style={{ width: 46, height: 46, borderRadius: 13, background: '#06C755', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(6,199,85,.4)' }}><LineLogo size={26} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'Anuphan, sans-serif' }}>LINE Official Account (Messaging API)</div>
            <div style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500, marginTop: 2 }}>ตั้งค่า Webhook URL ใน LINE Developers Console → Messaging API</div>
          </div>
        </div>
        <UrlRow label="Webhook URL (ใส่ใน LINE Developers Console)" url={webhookUrl} toast={toast} />
      </Card>

      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <span style={{ width: 46, height: 46, borderRadius: 13, background: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(59,130,246,.4)' }}><Icon name="user" size={22} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'Anuphan, sans-serif' }}>LINE Login</div>
            <div style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500, marginTop: 2 }}>ตั้งค่า Callback URL ใน LINE Developers Console → LINE Login → Callback URL</div>
          </div>
        </div>
        <UrlRow label="Callback URL (ใส่ใน LINE Login Channel)" url={callbackUrl} toast={toast} />
      </Card>

      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <span style={{ width: 46, height: 46, borderRadius: 13, background: '#0B3D2E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="message" size={22} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'Anuphan, sans-serif' }}>ข้อความตอบรับอัตโนมัติ</div>
            <div style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500, marginTop: 2 }}>ส่งในกลุ่ม LINE ทันทีเมื่อมีการแจ้งปัญหาใหม่</div>
          </div>
          <Toggle on={arEnabled} onChange={setArEnabled} />
        </div>
        <div style={{ opacity: arEnabled ? 1 : 0.45, pointerEvents: arEnabled ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* mode tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 10, padding: 4 }}>
            {[{ v: 'flex', label: '✨ Flex Message' }, { v: 'text', label: '💬 ข้อความธรรมดา' }].map(({ v, label }) => (
              <button key={v} onClick={() => setArMode(v)} style={{
                flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 700, transition: 'all .15s',
                background: arMode === v ? '#fff' : 'transparent',
                color: arMode === v ? '#06C755' : '#94A3B8',
                boxShadow: arMode === v ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}>{label}</button>
            ))}
          </div>

          {/* flex mode */}
          {arMode === 'flex' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6 }}>
                ออกแบบใน{' '}
                <a href="https://developers.line.biz/flex-simulator/" target="_blank" rel="noreferrer"
                   style={{ color: '#06C755', fontWeight: 600 }}>LINE Flex Message Simulator</a>
                {' '}แล้ววาง JSON ของ <b>bubble</b> หรือ <b>carousel</b> ด้านล่าง
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                ใช้{' '}
                <code style={{ background: '#F1F5F9', padding: '1px 6px', borderRadius: 4, color: '#06C755', fontSize: 12 }}>{'{{name}}'}</code>
                {' '}และ{' '}
                <code style={{ background: '#F1F5F9', padding: '1px 6px', borderRadius: 4, color: '#06C755', fontSize: 12 }}>{'{{title}}'}</code>
                {' '}ใน text fields ของ Flex เพื่อแทรกชื่อ/หัวข้อ
              </div>
              <textarea
                value={arFlexJson}
                onChange={(e) => { setArFlexJson(e.target.value); validateFlex(e.target.value); }}
                rows={12}
                placeholder={'{\n  "type": "bubble",\n  "body": {\n    "type": "box",\n    "layout": "vertical",\n    "contents": [\n      { "type": "text", "text": "รับเรื่องแล้วครับ {{name}}" }\n    ]\n  }\n}'}
                style={{
                  width: '100%', padding: '11px 13px', borderRadius: 12,
                  border: `1.5px solid ${arFlexError ? '#EF4444' : arFlexJson && !arFlexError ? '#06C755' : '#E2E8F0'}`,
                  fontFamily: 'monospace', fontSize: 12.5, color: '#1E293B', lineHeight: 1.6,
                  resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: '#FAFAFA',
                }}
              />
              {arFlexError && (
                <div style={{ fontSize: 12, color: '#EF4444', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8 }}>
                  ⚠ {arFlexError}
                </div>
              )}
              {arFlexJson && !arFlexError && (
                <div style={{ fontSize: 12, color: '#06C755', background: '#F0FDF4', padding: '8px 12px', borderRadius: 8 }}>
                  ✓ JSON ถูกต้อง — พร้อมใช้งาน
                </div>
              )}
              {!arFlexJson.trim() && (
                <div style={{ fontSize: 12, color: '#64748B', background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px dashed #E2E8F0' }}>
                  💡 หากว่างไว้ จะใช้ Flex template มาตรฐานของระบบ (สวยงามอยู่แล้ว)
                </div>
              )}
            </div>
          )}

          {/* text mode */}
          {arMode === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B' }}>
                เทมเพลตข้อความ
                <span style={{ marginLeft: 10, fontSize: 11.5, color: '#94A3B8', fontWeight: 500 }}>
                  ใช้ <code style={{ background: '#F1F5F9', padding: '1px 5px', borderRadius: 4, color: '#06C755' }}>{'{{name}}'}</code> และ{' '}
                  <code style={{ background: '#F1F5F9', padding: '1px 5px', borderRadius: 4, color: '#06C755' }}>{'{{title}}'}</code>
                </span>
              </div>
              <textarea
                value={arTemplate}
                onChange={(e) => setArTemplate(e.target.value)}
                rows={4}
                style={{
                  width: '100%', padding: '11px 13px', borderRadius: 12, border: '1.5px solid #E2E8F0',
                  fontFamily: 'inherit', fontSize: 13.5, color: '#1E293B', lineHeight: 1.6,
                  resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: '#fff',
                }}
                onFocus={(e) => e.target.style.borderColor = '#06C755'}
                onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
              />
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', marginBottom: 6, letterSpacing: '.03em', textTransform: 'uppercase' }}>ตัวอย่าง</div>
                <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{arPreview}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <FillBtn icon="save" onClick={saveAutoReply} disabled={arMode === 'flex' && !!arFlexError}>
              {arSaving ? 'กำลังบันทึก…' : 'บันทึก'}
            </FillBtn>
          </div>
        </div>
      </Card>

      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#94A3B8', padding: '0 4px', letterSpacing: '.02em' }}>กลุ่มและ OpenChat ({groups.length} กลุ่ม)</div>
      <Card>
        {groups.map((g, i) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i ? '1px solid #F1F5F9' : 'none' }}>
            <Avatar initials={g.initials} color={g.color} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: g.line_group_id ? '#06C755' : '#94A3B8', marginTop: 2 }}>
                {g.type === 'openchat' ? 'OpenChat' : 'กลุ่ม Line'} · {g.line_group_id ? 'เชื่อมต่อแล้ว' : 'ยังไม่เชื่อมต่อ'}
              </div>
            </div>
            {g.line_group_id && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#06C755', background: '#06C75514', padding: '3px 10px', borderRadius: 6 }}>Active</span>
            )}
          </div>
        ))}
        {groups.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: '#CBD5E1', fontSize: 13, fontWeight: 600 }}>ยังไม่มีกลุ่มที่เชื่อมต่อ</div>}
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

function Settings({ isMobile, toast, currentUser }) {
  const isAdmin = currentUser?.role === 'แอดมิน';
  const [sec, setSec] = useState('profile');

  // non-admin: only show profile, no sidebar nav
  if (!isAdmin) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', padding: isMobile ? '18px 16px 40px' : '26px 32px 48px', background: '#F4F7F6' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <ProfileSection toast={toast} currentUser={currentUser} />
        </div>
      </div>
    );
  }

  const content = {
    profile: <ProfileSection toast={toast} currentUser={currentUser} />,
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
