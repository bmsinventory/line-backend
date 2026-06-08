/* ===== Dashboard view ===== */
function StatCard({ label, value, sub, accent, icon, trend }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,.05), 0 0 0 1px rgba(15,23,42,.04)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>{label}</span>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: accent + '15', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={20} />
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', fontFamily: 'Anuphan, sans-serif', letterSpacing: '-.02em', lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>{sub}</span>}
      </div>
      {trend && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: trend.up ? '#16A34A' : '#DC2626' }}>
          <Icon name="trend" size={14} strokeWidth={2} style={{ transform: trend.up ? 'none' : 'scaleY(-1)' }} />
          {trend.text}
        </span>
      )}
    </div>
  );
}

/* trend area+line chart */
function TrendChart({ data }) {
  if (!data || data.length === 0) return null;
  const W = 640, H = 200, pad = 28;
  const rawMax = Math.max(...data.flatMap((d) => [d.created, d.resolved]));
  const max = (rawMax || 1) * 1.15;
  const x = (i) => data.length < 2 ? W / 2 : pad + (i * (W - pad * 2)) / (data.length - 1);
  const y = (v) => H - pad - (v / max) * (H - pad * 2);
  const path = (key) => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d[key])}`).join(' ');
  const area = `${path('created')} L ${x(data.length - 1)} ${H - pad} L ${x(0)} ${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06C755" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#06C755" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={pad} x2={W - pad} y1={y(max * t)} y2={y(max * t)} stroke="#EEF2F1" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#grad)" />
      <path d={path('created')} fill="none" stroke="#06C755" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path('resolved')} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 6" />
      {data.map((d, i) => (<g key={i}>
        <circle cx={x(i)} cy={y(d.created)} r="4" fill="#fff" stroke="#06C755" strokeWidth="2.5" />
        <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="12" fill="#94A3B8" fontWeight="600" fontFamily="IBM Plex Sans Thai">{d.day}</text>
      </g>))}
    </svg>
  );
}

/* horizontal bar chart for groups */
function GroupBars({ rows }) {
  if (!rows || rows.length === 0) return <p style={{ color: '#94A3B8', fontSize: 13 }}>ไม่มีข้อมูล</p>;
  const max = Math.max(...rows.map((r) => r.count)) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      {rows.map((r) => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 150, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Avatar initials={r.initials} color={r.color} size={22} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
          </div>
          <div style={{ flex: 1, height: 22, background: '#F1F5F9', borderRadius: 7, overflow: 'hidden' }}>
            <div style={{ width: `${(r.count / max) * 100}%`, height: '100%', background: r.color, borderRadius: 7, transition: 'width .4s ease', minWidth: 22 }}></div>
          </div>
          <span style={{ width: 26, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#334155' }}>{r.count}</span>
        </div>
      ))}
    </div>
  );
}

/* donut status breakdown */
function StatusDonut({ counts, total }) {
  const R = 54, C = 2 * Math.PI * R;
  let offset = 0;
  const keys = Object.keys(counts).filter((k) => counts[k] > 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg viewBox="0 0 140 140" style={{ width: 140, height: 140, flexShrink: 0 }}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="#F1F5F9" strokeWidth="18" />
        {keys.map((k) => {
          const frac = counts[k] / total;
          const dash = frac * C;
          const el = (
            <circle key={k} cx="70" cy="70" r={R} fill="none" stroke={D.STATUSES[k].color} strokeWidth="18"
              strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" strokeLinecap="butt" />
          );
          offset += dash;
          return el;
        })}
        <text x="70" y="65" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0F172A" fontFamily="Anuphan">{total}</text>
        <text x="70" y="83" textAnchor="middle" fontSize="11" fontWeight="600" fill="#94A3B8" fontFamily="IBM Plex Sans Thai">เรื่องทั้งหมด</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1, minWidth: 130 }}>
        {Object.keys(D.STATUSES).map((k) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: D.STATUSES[k].color }}></span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', flex: 1 }}>{D.STATUSES[k].label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{counts[k] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, sub, children, action }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,.05), 0 0 0 1px rgba(15,23,42,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A', fontFamily: 'Anuphan, sans-serif' }}>{title}</h3>
          {sub && <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#94A3B8', fontWeight: 500 }}>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Dashboard({ issues, isMobile }) {
  const now = Date.now();
  const open = issues.filter((i) => i.status !== 'resolved');
  const urgent = open.filter((i) => i.priority === 'urgent');
  const unassigned = open.filter((i) => !i.assigneeId);
  const resolvedToday = issues.filter((i) => i.status === 'resolved' && i.closedAt && (now - new Date(i.closedAt)) < 86400000);

  // คำนวณ trend 7 วันย้อนหลังจาก issues จริง
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86400000);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd   = dayStart + 86400000;
    return {
      day: d.toLocaleDateString('th-TH', { weekday: 'short' }),
      created:  issues.filter((x) => { const t = new Date(x.createdAt).getTime(); return t >= dayStart && t < dayEnd; }).length,
      resolved: issues.filter((x) => { const t = x.closedAt ? new Date(x.closedAt).getTime() : 0; return t >= dayStart && t < dayEnd; }).length,
    };
  });

  const statusCounts = {};
  Object.keys(D.STATUSES).forEach((k) => statusCounts[k] = issues.filter((i) => i.status === k).length);

  const groupRows = D.GROUPS.map((g) => ({ ...g, count: open.filter((i) => i.groupId === g.id).length }))
    .sort((a, b) => b.count - a.count);

  const catRows = Object.keys(D.CATEGORIES).map((k) => ({
    key: k, ...D.CATEGORIES[k], count: open.filter((i) => i.category === k).length,
  })).sort((a, b) => b.count - a.count);

  const workload = D.MEMBERS.filter((m) => m.id !== 'm0').map((m) => ({
    ...m, count: open.filter((i) => i.assigneeId === m.id).length,
  })).sort((a, b) => b.count - a.count);

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 28px', overflowY: 'auto', height: '100%', background: '#F4F7F6' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {/* stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
          <StatCard label="เรื่องที่ยังเปิดอยู่" value={open.length} accent="#3B82F6" icon="inbox" trend={{ up: false, text: 'ลดลง 12% จากเมื่อวาน' }} />
          <StatCard label="ด่วนมาก รอจัดการ" value={urgent.length} accent="#DC2626" icon="fire" sub="เรื่อง" />
          <StatCard label="เวลาตอบกลับเฉลี่ย" value="6" sub="นาที" accent="#06C755" icon="clock" trend={{ up: true, text: 'เร็วขึ้น 2 นาที' }} />
          <StatCard label="ปิดงานวันนี้" value={resolvedToday.length} accent="#16A34A" icon="check" sub="เรื่อง" />
        </div>

        {/* charts */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
          <Panel title="ปริมาณงานย้อนหลัง 7 วัน" sub="เปรียบเทียบเรื่องที่เข้าใหม่กับเรื่องที่ปิดได้"
            action={<div style={{ display: 'flex', gap: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#64748B' }}><span style={{ width: 12, height: 3, borderRadius: 9, background: '#06C755' }}></span>เข้าใหม่</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#64748B' }}><span style={{ width: 12, height: 3, borderRadius: 9, background: '#3B82F6' }}></span>ปิดได้</span>
            </div>}>
            <TrendChart data={trendData} />
          </Panel>
          <Panel title="สถานะปัญหา" sub="ภาพรวมทุกกลุ่ม">
            <StatusDonut counts={statusCounts} total={issues.length} />
          </Panel>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Panel title="กลุ่มที่มีปัญหาค้างเยอะที่สุด" sub="นับเฉพาะเรื่องที่ยังไม่ปิด">
            <GroupBars rows={groupRows} />
          </Panel>
          <Panel title="ภาระงานของทีม" sub="เรื่องที่กำลังรับผิดชอบ">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {workload.map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar initials={m.initials} color={m.color} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1E293B' }}>{m.name}</div>
                    <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500 }}>{m.role}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: m.count > 2 ? '#DC2626' : '#334155', background: (m.count > 2 ? '#DC2626' : '#94A3B8') + '15', borderRadius: 8, padding: '4px 11px' }}>{m.count} เรื่อง</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="ปัญหาตามหมวดหมู่" sub="เรื่องที่ยังเปิดอยู่ แยกตามประเภท">
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12 }}>
            {catRows.map((c) => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', background: '#F8FAFB', borderRadius: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, background: c.color + '18', color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, fontFamily: 'Anuphan' }}>{c.count}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#334155' }}>{c.label}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, StatCard, TrendChart, GroupBars, StatusDonut, Panel });
