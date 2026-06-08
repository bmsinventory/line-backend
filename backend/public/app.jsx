/* ===== App shell ===== */
const NAV = [
  { id: 'inbox', label: 'กล่องรวม', icon: 'inbox' },
  { id: 'board', label: 'บอร์ดงาน', icon: 'board' },
  { id: 'dashboard', label: 'แดชบอร์ด', icon: 'chart' },
  { id: 'groups', label: 'กลุ่ม Line', icon: 'groups' },
];

/* ---------- แปลงข้อมูลจาก DB เป็น format ที่ UI ใช้ ---------- */
function normalizeIssue(row) {
  const messages = (row.messages || [])
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return {
    id:         row.id,
    code:       row.code,
    groupId:    row.group_id,
    reporter: {
      name:     row.reporter_name     || 'ไม่ระบุ',
      color:    row.reporter_color    || '#64748B',
      initials: row.reporter_initials || '??',
    },
    title:      row.title,
    category:   row.category  || 'howto',
    tags:       row.tags      || [],
    status:     row.status,
    priority:   row.priority,
    assigneeId: row.assignee_id || null,
    unread:     row.unread,
    createdAt:  row.created_at,
    closedAt:   row.closed_at || null,
    thread: messages.map((m) => ({
      from:       m.from_type,
      who:        m.who,
      text:       m.text,
      at:         m.created_at,
      attachment: m.attachment || null,
    })),
  };
}

/* ---------- profile menu (shared) ---------- */
function ProfileMenu({ trigger, align = 'left', width = 220, setView, onLogout, drop = 'down' }) {
  return (
    <Dropdown align={align} width={width} drop={drop} trigger={trigger}>
      {(close) => <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px 12px', borderBottom: '1px solid #F1F5F9', marginBottom: 6 }}>
          <Avatar initials="ME" color="#06C755" size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>คุณ (แอดมิน)</div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>admin@line-track.co.th</div>
          </div>
        </div>
        <MenuItem onClick={() => { setView('settings'); close(); }}><Icon name="settings" size={17} style={{ color: '#64748B' }} />ตั้งค่าระบบ</MenuItem>
        <MenuItem onClick={() => { setView('settings'); close(); }}><Icon name="user" size={17} style={{ color: '#64748B' }} />โปรไฟล์ของฉัน</MenuItem>
        <div style={{ height: 1, background: '#F1F5F9', margin: '6px 4px' }}></div>
        <MenuItem onClick={() => { close(); onLogout(); }} color="#DC2626"><Icon name="logout" size={17} />ออกจากระบบ</MenuItem>
      </>}
    </Dropdown>
  );
}

/* ---------- left nav rail ---------- */
function NavRail({ view, setView, isMobile, openCount, onLogout }) {
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, background: '#fff',
        borderTop: '1px solid #EEF2F1', display: 'flex', zIndex: 40, paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV.map((n) => {
          const on = view === n.id;
          return (
            <button key={n.id} onClick={() => setView(n.id)} style={{
              flex: 1, border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer',
              color: on ? '#06C755' : '#94A3B8', fontFamily: 'inherit', position: 'relative',
            }}>
              <Icon name={n.icon} size={22} strokeWidth={on ? 2.1 : 1.75} />
              <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 600 }}>{n.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div style={{ width: 76, background: '#0B3D2E', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', flexShrink: 0, zIndex: 30 }}>
      <div style={{ width: 42, height: 42, borderRadius: 13, background: '#06C755', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, boxShadow: '0 4px 14px rgba(6,199,85,.45)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3C6.9 3 3 6.3 3 10.4c0 3.7 3.1 6.8 7.4 7.4.3 0 .7.2.8.4.1.2 0 .6 0 .8l-.1.8c0 .2-.2.9.8.5s5.4-3.2 7.3-5.5C20.4 13.3 21 11.9 21 10.4 21 6.3 17.1 3 12 3Z" fill="#fff"/></svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {NAV.map((n) => {
          const on = view === n.id;
          return (
            <button key={n.id} onClick={() => setView(n.id)} title={n.label} style={{
              width: 56, height: 56, borderRadius: 15, border: 'none', cursor: 'pointer', position: 'relative',
              background: on ? 'rgba(6,199,85,.18)' : 'transparent', color: on ? '#34E37D' : '#7DA396',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              fontFamily: 'inherit', transition: 'all .15s',
            }}
              onMouseEnter={(e) => { if (!on) { e.currentTarget.style.background = 'rgba(255,255,255,.07)'; e.currentTarget.style.color = '#B5CFC4'; } }}
              onMouseLeave={(e) => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7DA396'; } }}>
              <Icon name={n.icon} size={22} strokeWidth={on ? 2.1 : 1.75} />
              <span style={{ fontSize: 9.5, fontWeight: 700 }}>{n.label}</span>
              {n.id === 'inbox' && openCount > 0 && (
                <span style={{ position: 'absolute', top: 7, right: 11, minWidth: 17, height: 17, borderRadius: 99, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{openCount}</span>
              )}
            </button>
          );
        })}
      </div>
      <button onClick={() => setView('settings')} title="ตั้งค่าระบบ" style={{
        border: 'none', cursor: 'pointer', padding: 8, marginBottom: 8, borderRadius: 13,
        background: view === 'settings' ? 'rgba(6,199,85,.18)' : 'transparent',
        color: view === 'settings' ? '#34E37D' : '#7DA396', display: 'flex',
      }}
        onMouseEnter={(e) => { if (view !== 'settings') e.currentTarget.style.color = '#B5CFC4'; }}
        onMouseLeave={(e) => { if (view !== 'settings') e.currentTarget.style.color = '#7DA396'; }}>
        <Icon name="settings" size={22} />
      </button>
      <ProfileMenu align="left" width={230} drop="up" setView={setView} onLogout={onLogout} trigger={() => (
        <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', borderRadius: '50%' }}>
          <Avatar initials="ME" color="#06C755" size={38} ring />
        </button>
      )} />
    </div>
  );
}

/* ---------- inbox layout ---------- */
const FILTERS = [
  { id: 'all', label: 'ทั้งหมด', test: () => true },
  { id: 'mine', label: 'มอบหมายให้ฉัน', test: (i) => i.assigneeId === 'm0' },
  { id: 'unassigned', label: 'ยังไม่มอบหมาย', test: (i) => !i.assigneeId && i.status !== 'resolved' },
  { id: 'urgent', label: 'ด่วนมาก', test: (i) => i.priority === 'urgent' && i.status !== 'resolved' },
  { id: 'open', label: 'ยังไม่ปิด', test: (i) => i.status !== 'resolved' },
];

function InboxView({ issues, selId, setSel, onUpdate, onReply, isMobile, search }) {
  const [filter, setFilter] = useState('all');
  const [groupId, setGroupId] = useState('all');

  const list = useMemo(() => {
    let l = issues.filter(FILTERS.find((f) => f.id === filter).test);
    if (groupId !== 'all') l = l.filter((i) => i.groupId === groupId);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      l = l.filter((i) => i.title.toLowerCase().includes(q) || i.code.toLowerCase().includes(q) || i.reporter.name.toLowerCase().includes(q));
    }
    return l.slice().sort((a, b) => {
      if ((a.status === 'resolved') !== (b.status === 'resolved')) return a.status === 'resolved' ? 1 : -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [issues, filter, groupId, search]);

  const selected = byId(issues, selId);
  const showList = !isMobile || !selected;
  const showDetail = !isMobile || selected;

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {showList && (
        <div style={{ width: isMobile ? '100%' : 380, flexShrink: 0, borderRight: isMobile ? 'none' : '1px solid #EEF2F1', background: '#EEF2F1', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* filter bar */}
          <div style={{ padding: '12px 14px 10px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 8 }}>
              {FILTERS.map((f) => {
                const on = filter === f.id;
                const cnt = issues.filter(f.test).length;
                return (
                  <button key={f.id} onClick={() => setFilter(f.id)} style={{
                    flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 999,
                    padding: '7px 13px', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
                    background: on ? '#0B3D2E' : '#fff', color: on ? '#fff' : '#64748B',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                    {f.label}
                    <span style={{ fontSize: 11, fontWeight: 800, opacity: on ? 0.9 : 0.6 }}>{cnt}</span>
                  </button>
                );
              })}
            </div>
            <Dropdown align="left" width={250} trigger={(open) => (
              <button style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid ' + (open ? '#06C755' : '#E2E8F0'),
                background: '#fff', borderRadius: 11, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <Icon name="groups" size={16} strokeWidth={1.9} style={{ color: '#94A3B8' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', flex: 1, textAlign: 'left' }}>{groupId === 'all' ? 'ทุกกลุ่ม Line' : (byId(D.GROUPS, groupId) || {}).name || groupId}</span>
                <Icon name="chevronDown" size={15} style={{ color: '#94A3B8' }} />
              </button>
            )}>
              {(close) => <>
                <MenuItem active={groupId === 'all'} onClick={() => { setGroupId('all'); close(); }}>ทุกกลุ่ม Line</MenuItem>
                {D.GROUPS.map((g) => (
                  <MenuItem key={g.id} active={groupId === g.id} onClick={() => { setGroupId(g.id); close(); }}>
                    <Avatar initials={g.initials} color={g.color} size={20} />
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</span>
                  </MenuItem>
                ))}
              </>}
            </Dropdown>
          </div>
          {/* list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', padding: '4px 8px 6px', letterSpacing: '.02em' }}>{list.length} เรื่อง</div>
            {list.map((i) => (
              <IssueCard key={i.id} issue={i} active={selId === i.id} onClick={() => setSel(i.id)} />
            ))}
            {list.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#CBD5E1', fontSize: 13, fontWeight: 600 }}>ไม่พบเรื่องที่ตรงเงื่อนไข</div>}
          </div>
        </div>
      )}
      {showDetail && (
        <div style={{ flex: 1, minWidth: 0 }}>
          {selected
            ? <IssueDetail issue={selected} onUpdate={onUpdate} onReply={onReply} onBack={() => setSel(null)} isMobile={isMobile} />
            : <EmptyDetail />}
        </div>
      )}
    </div>
  );
}

function EmptyDetail() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F4F7F6', gap: 14, padding: 24 }}>
      <div style={{ width: 72, height: 72, borderRadius: 22, background: '#06C75514', color: '#06C755', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="inbox" size={34} strokeWidth={1.6} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#334155', fontFamily: 'Anuphan, sans-serif' }}>เลือกเรื่องเพื่อดูรายละเอียด</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>ทุกปัญหาจากทุกกลุ่ม Line รวมอยู่ที่นี่แล้ว</div>
      </div>
    </div>
  );
}

/* ---------- groups view ---------- */
function GroupsView({ issues, isMobile }) {
  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', overflowY: 'auto', height: '100%', background: '#F4F7F6' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        {D.GROUPS.map((g) => {
          const gi = issues.filter((i) => i.groupId === g.id);
          const open = gi.filter((i) => i.status !== 'resolved');
          const urgent = open.filter((i) => i.priority === 'urgent').length;
          return (
            <div key={g.id} style={{ background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,.05), 0 0 0 1px rgba(15,23,42,.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Avatar initials={g.initials} color={g.color} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: '#0F172A', fontFamily: 'Anuphan, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: g.color, background: g.color + '14', padding: '2px 8px', borderRadius: 6, marginTop: 4, display: 'inline-block' }}>
                    {g.type === 'openchat' ? 'OpenChat' : 'กลุ่ม Line'} · {g.line_group_id ? 'เชื่อมต่อแล้ว' : 'ยังไม่เชื่อมต่อ'}
                  </span>
                </div>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: g.line_group_id ? '#06C755' : '#CBD5E1', boxShadow: g.line_group_id ? '0 0 0 4px #06C75522' : 'none' }}></span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['ค้างอยู่', open.length, '#3B82F6'], ['ด่วนมาก', urgent, '#DC2626'], ['ทั้งหมด', gi.length, '#64748B']].map(([l, v, c]) => (
                  <div key={l} style={{ flex: 1, background: '#F8FAFB', borderRadius: 12, padding: '11px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: c, fontFamily: 'Anuphan', lineHeight: 1 }}>{v}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#94A3B8', marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <button style={{
          border: '2px dashed #CBD5E1', background: 'transparent', borderRadius: 18, padding: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#94A3B8', fontFamily: 'inherit',
          fontSize: 14, fontWeight: 700, minHeight: 120,
        }}>
          <Icon name="plus" size={20} />เชื่อมต่อกลุ่ม Line ใหม่
        </button>
      </div>
    </div>
  );
}

/* ---------- top bar ---------- */
function TopBar({ view, search, setSearch, isMobile, toast, setView, onLogout, onAddIssue }) {
  const titles = { inbox: 'กล่องรวมปัญหา', board: 'บอร์ดงาน', dashboard: 'แดชบอร์ดภาพรวม', groups: 'กลุ่ม Line ที่เชื่อมต่อ', settings: 'ตั้งค่าระบบ' };
  const subs = {
    inbox:     'ทุกข้อความแจ้งปัญหาจากทุกกลุ่ม รวมที่เดียว',
    board:     'ลากการ์ดเพื่อเปลี่ยนสถานะงาน',
    dashboard: 'อัปเดตล่าสุด ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    groups:    'จัดการกลุ่มและ OpenChat ที่เชื่อมต่อกับระบบ',
    settings:  'จัดการข้อมูล ทีมงาน และการเชื่อมต่อระบบ',
  };
  return (
    <div style={{ height: isMobile ? 58 : 68, background: '#fff', borderBottom: '1px solid #EEF2F1', display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '0 16px' : '0 24px', flexShrink: 0, position: 'relative' }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? 17 : 20, fontWeight: 800, color: '#0F172A', fontFamily: 'Anuphan, sans-serif', letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titles[view]}</h1>
        {!isMobile && <p style={{ margin: '1px 0 0', fontSize: 12.5, color: '#94A3B8', fontWeight: 500 }}>{subs[view]}</p>}
      </div>
      <div style={{ flex: 1 }}></div>
      {!isMobile && (view === 'inbox' || view === 'board') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#F1F5F9', borderRadius: 11, padding: '9px 13px', width: 260 }}>
          <Icon name="search" size={17} style={{ color: '#94A3B8' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาปัญหา, รหัส, ผู้แจ้ง…" style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13.5, color: '#1E293B', width: '100%' }} />
        </div>
      )}
      <button style={{ position: 'relative', border: 'none', background: '#F1F5F9', borderRadius: 11, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
        <Icon name="bell" size={19} />
        <span style={{ position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 99, background: '#EF4444', boxShadow: '0 0 0 2px #fff' }}></span>
      </button>
      {isMobile && (
        <ProfileMenu align="right" width={230} setView={setView} onLogout={onLogout} trigger={() => (
          <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', borderRadius: '50%' }}>
            <Avatar initials="ME" color="#06C755" size={38} ring />
          </button>
        )} />
      )}
      {toast && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)', right: 24, zIndex: 60,
          background: '#0B3D2E', color: '#fff', borderRadius: 12, padding: '11px 16px', fontSize: 13.5, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 10px 30px rgba(11,61,46,.35)', animation: 'pop .2s ease-out',
        }}>
          <span style={{ width: 20, height: 20, borderRadius: 99, background: '#06C755', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={13} strokeWidth={3} /></span>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ---------- loading screen ---------- */
function LoadingScreen() {
  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F4F7F6', gap: 18 }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: '#06C755', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(6,199,85,.4)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 3C6.9 3 3 6.3 3 10.4c0 3.7 3.1 6.8 7.4 7.4.3 0 .7.2.8.4.1.2 0 .6 0 .8l-.1.8c0 .2-.2.9.8.5s5.4-3.2 7.3-5.5C20.4 13.3 21 11.9 21 10.4 21 6.3 17.1 3 12 3Z" fill="#fff"/></svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', fontFamily: 'Anuphan, sans-serif' }}>กำลังโหลดข้อมูล…</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>กำลังเชื่อมต่อกับฐานข้อมูล</div>
      </div>
      <div style={{ width: 200, height: 4, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#06C755', borderRadius: 99, animation: 'loadbar 1.4s ease-in-out infinite' }}></div>
      </div>
    </div>
  );
}

/* ---------- root ---------- */
function App() {
  const isMobile = useIsMobile();
  const [booted, setBooted]   = useState(false);
  const [authed, setAuthed]   = useState(false);
  const [view, setView]       = useState('inbox');
  const [issues, setIssues]   = useState([]);
  const [selId, setSel]       = useState(null);
  const [search, setSearch]   = useState('');
  const [toast, setToast]     = useState(null);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  /* ---- โหลด issues (ใช้ใน realtime callback ด้วย) ---- */
  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/issues');
      if (res.status === 401) { doLogout(); return; }
      const data = await res.json();
      setIssues(data.map(normalizeIssue));
    } catch (err) {
      console.error('[App] fetchIssues:', err);
    }
  };

  /* ---- โหลดข้อมูลทั้งหมด ---- */
  const loadData = async () => {
    const results = await Promise.allSettled([
      fetch('/api/issues').then((r) => r.json()),
      fetch('/api/groups').then((r) => r.json()),
      fetch('/api/members').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/quick-replies').then((r) => r.json()),
    ]);
    const val = (i) => results[i].status === 'fulfilled' ? results[i].value : null;
    const issuesData     = val(0) || [];
    const groupsData     = val(1) || [];
    const membersData    = val(2) || [];
    const categoriesData = val(3) || [];
    const repliesData    = val(4) || [];

    D.GROUPS        = groupsData;
    D.MEMBERS       = membersData;
    D.QUICK_REPLIES = repliesData;
    if (categoriesData.length > 0) {
      D.CATEGORIES = {};
      categoriesData.forEach(c => { D.CATEGORIES[c.id] = { label: c.label, color: c.color }; });
    }
    setIssues(issuesData.map(normalizeIssue));
  };

  /* ---- Boot sequence ---- */
  useEffect(() => {
    async function boot() {
      // 1. Init Supabase client (ก่อน login เพื่อให้ realtime พร้อม)
      try {
        const cfg = await fetch('/api/config').then((r) => r.json());
        if (cfg?.supabaseUrl && cfg?.supabaseAnonKey && window.supabase) {
          window.supabaseClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
        }
      } catch { /* ถ้า init ไม่ได้ realtime ไม่ทำงาน — ไม่ block */ }

      // 2. ตรวจว่า session ยังอยู่ไหม (HTTP-only cookie)
      try {
        const verifyRes = await fetch('/api/auth/verify');
        if (verifyRes.ok) {
          await loadData();
          setAuthed(true);
        }
      } catch { /* ถ้าไม่ได้ แสดงหน้า login */ }

      setBooted(true);
    }
    boot();
  }, []);

  /* ---- Realtime subscription (เริ่มหลัง authed เท่านั้น) ---- */
  useEffect(() => {
    if (!authed || !window.supabaseClient) return;
    const channel = window.supabaseClient
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' },   fetchIssues)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchIssues)
      .subscribe((status) => console.log('[Realtime]', status));
    return () => channel.unsubscribe();
  }, [authed]);

  /* ---- อัปเดต issue ---- */
  const update = async (id, patch) => {
    const body = {};
    if (patch.status      !== undefined) body.status      = patch.status;
    if (patch.assigneeId  !== undefined) body.assignee_id = patch.assigneeId;
    if (patch.priority    !== undefined) body.priority    = patch.priority;
    if (patch.category    !== undefined) body.category    = patch.category;
    if (patch.tags        !== undefined) body.tags        = patch.tags;
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (res.status === 401) { doLogout(); return; }
      await fetchIssues();
      if (patch.status !== undefined) flash('อัปเดตสถานะแล้ว');
      else if ('assigneeId' in patch)  flash('มอบหมายงานแล้ว');
    } catch (err) { console.error('[App] update:', err); }
  };

  /* ---- ตอบกลับ ---- */
  const reply = async (id, text, internal) => {
    try {
      const res = await fetch(`/api/issues/${id}/reply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, internal }),
      });
      if (res.status === 401) { doLogout(); return; }
      await fetchIssues();
      flash(internal ? 'บันทึกโน้ตภายในแล้ว' : 'ส่งข้อความเข้า Line แล้ว');
    } catch (err) { console.error('[App] reply:', err); }
  };

  /* ---- เพิ่มปัญหาด้วยมือ ---- */
  const addIssue = async () => {
    const title = prompt('ชื่อเรื่อง / หัวข้อปัญหา:');
    if (!title) return;
    try {
      await fetch('/api/issues', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }),
      });
      await fetchIssues();
      flash('สร้างเรื่องใหม่แล้ว');
    } catch (err) { console.error('[App] addIssue:', err); }
  };

  /* ---- Login / Logout ---- */
  const handleLogin = async () => {
    await loadData();
    setAuthed(true);
  };

  const doLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    setAuthed(false);
    setIssues([]);
    setView('inbox');
    setSel(null);
  };

  const openFromBoard = (id) => { setSel(id); setView('inbox'); };
  const openCount = issues.filter((i) => i.status !== 'resolved').length;

  // mark read on select
  useEffect(() => {
    if (selId) setIssues((arr) => arr.map((i) => i.id === selId ? { ...i, unread: false } : i));
  }, [selId]);

  // auto-select first issue เมื่อ authed หรือ boot เสร็จ
  useEffect(() => {
    if (booted && authed && !isMobile && issues.length > 0 && !selId) setSel(issues[0].id);
  }, [booted, authed]);

  if (!booted) return <LoadingScreen />;
  if (!authed) return <Login onLogin={handleLogin} />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#EEF2F1' }}>
      {!isMobile && <NavRail view={view} setView={setView} isMobile={false} openCount={openCount} onLogout={doLogout} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingBottom: isMobile ? 64 : 0 }}>
        <TopBar view={view} search={search} setSearch={setSearch} isMobile={isMobile} toast={toast} setView={setView} onLogout={doLogout} onAddIssue={addIssue} />
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {view === 'inbox'     && <InboxView issues={issues} selId={selId} setSel={setSel} onUpdate={update} onReply={reply} isMobile={isMobile} search={search} />}
          {view === 'board'     && <Board issues={issues} onUpdate={update} onOpen={openFromBoard} isMobile={isMobile} />}
          {view === 'dashboard' && <Dashboard issues={issues} isMobile={isMobile} />}
          {view === 'groups'    && <GroupsView issues={issues} isMobile={isMobile} />}
          {view === 'settings'  && <Settings isMobile={isMobile} toast={flash} />}
        </div>
      </div>
      {isMobile && <NavRail view={view} setView={setView} isMobile={true} openCount={openCount} onLogout={doLogout} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
