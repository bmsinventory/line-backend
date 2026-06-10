/* ===== Dashboard — Comprehensive real-data view ===== */

function fmtMs(ms) {
  if (!ms || ms <= 0) return null;
  const min = Math.round(ms / 60000);
  if (min < 1)   return { value: '<1', unit: 'นาที' };
  if (min < 60)  return { value: String(min), unit: 'นาที' };
  const h = (ms / 3600000);
  return { value: h < 10 ? h.toFixed(1) : String(Math.round(h)), unit: 'ชม.' };
}

/* ---------- KPI card ---------- */
function StatCard({ label, value, sub, accent, icon, badge, badgeUp }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '15px 17px',
      boxShadow: '0 1px 3px rgba(15,23,42,.05), 0 0 0 1px rgba(15,23,42,.04)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B', lineHeight: 1.35 }}>{label}</span>
        <span style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: accent + '15', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={17} />
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', fontFamily: 'Anuphan,sans-serif', letterSpacing: '-.02em', lineHeight: 1 }}>
          {value}
        </span>
        {sub && <span style={{ fontSize: 12.5, fontWeight: 600, color: '#94A3B8' }}>{sub}</span>}
      </div>
      {badge != null && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600,
          color: badge === 0 ? '#94A3B8' : badgeUp ? '#16A34A' : '#DC2626',
        }}>
          <Icon name="trend" size={12} strokeWidth={2.2}
            style={{ transform: badge === 0 ? 'none' : badgeUp ? 'none' : 'scaleY(-1)' }} />
          {badge === 0 ? 'เท่าเดิม' : `${badge > 0 ? '+' : ''}${badge} จากเมื่อวาน`}
        </span>
      )}
    </div>
  );
}

/* ---------- 7-day trend line + area chart ---------- */
function TrendChart({ data }) {
  if (!data || data.length === 0) return null;
  const W = 600, H = 175, padX = 30, padY = 22;
  const rawMax = Math.max(...data.flatMap(d => [d.created, d.resolved]));
  const max = (rawMax || 1) * 1.2;
  const x = (i) => data.length < 2 ? W / 2 : padX + (i * (W - padX * 2)) / (data.length - 1);
  const y = (v) => H - padY - (v / max) * (H - padY * 2);
  const pts = (key) => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(' ');
  const area = `${pts('created')} L ${x(data.length - 1).toFixed(1)} ${H - padY} L ${x(0).toFixed(1)} ${H - padY} Z`;
  const gridVals = [0, 0.5, 1].map(t => Math.round(max * t));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06C755" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#06C755" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridVals.map(v => (
        <g key={v}>
          <line x1={padX} x2={W - padX} y1={y(v)} y2={y(v)} stroke="#F1F5F9" strokeWidth="1.5" />
          {v > 0 && <text x={padX - 5} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#CBD5E1" fontFamily="IBM Plex Sans Thai">{v}</text>}
        </g>
      ))}
      <path d={area} fill="url(#dGrad)" />
      <path d={pts('created')} fill="none" stroke="#06C755" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={pts('resolved')} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 7" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.created)} r="3.5" fill="#fff" stroke="#06C755" strokeWidth="2.5" />
          {d.resolved > 0 && <circle cx={x(i)} cy={y(d.resolved)} r="3" fill="#fff" stroke="#3B82F6" strokeWidth="2" />}
          <text x={x(i)} y={H - 4} textAnchor="middle" fontSize="10.5" fill="#94A3B8" fontWeight="600" fontFamily="IBM Plex Sans Thai">{d.day}</text>
          {d.created > 0 && (
            <text x={x(i)} y={y(d.created) - 7} textAnchor="middle" fontSize="10" fill="#06C755" fontWeight="700">{d.created}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ---------- Status donut ---------- */
function StatusDonut({ counts, total }) {
  const R = 50, C = 2 * Math.PI * R;
  let offset = 0;
  const keys = Object.keys(counts).filter(k => counts[k] > 0);
  if (total === 0) return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: '#CBD5E1', fontSize: 13, fontWeight: 600 }}>ยังไม่มีข้อมูล</div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
      <svg viewBox="0 0 140 140" style={{ width: 130, height: 130, flexShrink: 0 }}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="#F1F5F9" strokeWidth="17" />
        {keys.map(k => {
          const frac = counts[k] / total;
          const dash = frac * C;
          const el = <circle key={k} cx="70" cy="70" r={R} fill="none" stroke={D.STATUSES[k].color}
            strokeWidth="17" strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset}
            transform="rotate(-90 70 70)" strokeLinecap="butt" />;
          offset += dash;
          return el;
        })}
        <text x="70" y="66" textAnchor="middle" fontSize="24" fontWeight="800" fill="#0F172A" fontFamily="Anuphan">{total}</text>
        <text x="70" y="82" textAnchor="middle" fontSize="10" fontWeight="600" fill="#94A3B8" fontFamily="IBM Plex Sans Thai">เรื่องทั้งหมด</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1, minWidth: 120 }}>
        {Object.keys(D.STATUSES).map(k => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: D.STATUSES[k].color, flexShrink: 0 }}></span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', flex: 1 }}>{D.STATUSES[k].label}</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{counts[k] || 0}</span>
            <span style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 500, width: 30, textAlign: 'right' }}>
              {total > 0 ? Math.round((counts[k] || 0) / total * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Horizontal bars ---------- */
function HBars({ rows }) {
  if (!rows || rows.length === 0) return <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>ไม่มีข้อมูล</p>;
  const max = Math.max(...rows.map(r => r.count)) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r, i) => (
        <div key={r.id || r.key || i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 130, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            {r.initials
              ? <Avatar initials={r.initials} color={r.color} size={22} />
              : <span style={{ width: 10, height: 10, borderRadius: 3, background: r.color, flexShrink: 0 }}></span>}
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
          </div>
          <div style={{ flex: 1, height: 20, background: '#F1F5F9', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              width: `${r.count > 0 ? Math.max((r.count / max) * 100, 4) : 0}%`,
              height: '100%', background: r.color, borderRadius: 6, transition: 'width .5s ease',
            }} />
          </div>
          <span style={{ width: 24, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#334155', flexShrink: 0 }}>{r.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Panel wrapper ---------- */
function Panel({ title, sub, children, action }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,.05), 0 0 0 1px rgba(15,23,42,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A', fontFamily: 'Anuphan,sans-serif' }}>{title}</h3>
          {sub && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{sub}</p>}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      {children}
    </div>
  );
}

/* ========== Dashboard root ========== */
function Dashboard({ issues, isMobile }) {
  const now = Date.now();

  /* ---- time boundaries ---- */
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayMs     = todayStart.getTime();
  const yestMs      = todayMs - 86400000;
  const weekMs      = todayMs - 6 * 86400000;

  /* ---- open / resolved sets ---- */
  const open        = issues.filter(i => i.status !== 'resolved');
  const resolved    = issues.filter(i => i.status === 'resolved');
  const openCount   = open.length;
  const total       = issues.length;

  /* ---- KPI values ---- */
  const unread      = open.filter(i => i.unread).length;
  const urgent      = open.filter(i => i.priority === 'urgent').length;
  const high        = open.filter(i => i.priority === 'high').length;
  const unassigned  = open.filter(i => !i.assigneeId).length;

  const newToday     = issues.filter(i => new Date(i.createdAt).getTime() >= todayMs).length;
  const newYesterday = issues.filter(i => { const t = new Date(i.createdAt).getTime(); return t >= yestMs && t < todayMs; }).length;

  const resolvedToday    = resolved.filter(i => i.closedAt && new Date(i.closedAt).getTime() >= todayMs).length;
  const resolvedYesterday = resolved.filter(i => {
    if (!i.closedAt) return false;
    const t = new Date(i.closedAt).getTime();
    return t >= yestMs && t < todayMs;
  }).length;

  const resolutionRate = total > 0 ? Math.round(resolved.length / total * 100) : 0;

  /* ---- Avg response time (first agent msg vs created_at) ---- */
  const responseTimes = issues.map(i => {
    if (!i.thread) return null;
    const firstAgent = i.thread.find(m => m.from === 'agent');
    if (!firstAgent) return null;
    const diff = new Date(firstAgent.at) - new Date(i.createdAt);
    return diff > 0 ? diff : null;
  }).filter(Boolean);
  const avgResponseMs  = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : null;
  const avgResponseFmt = fmtMs(avgResponseMs);

  /* ---- Avg resolution time (closedAt - createdAt) ---- */
  const resTimes = resolved
    .filter(i => i.closedAt)
    .map(i => new Date(i.closedAt) - new Date(i.createdAt))
    .filter(t => t > 0);
  const avgResolutionMs  = resTimes.length > 0 ? resTimes.reduce((a, b) => a + b, 0) / resTimes.length : null;
  const avgResolutionFmt = fmtMs(avgResolutionMs);

  /* ---- 7-day trend ---- */
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86400000);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd = dayStart + 86400000;
    return {
      day: d.toLocaleDateString('th-TH', { weekday: 'short' }),
      created:  issues.filter(x => { const t = new Date(x.createdAt).getTime(); return t >= dayStart && t < dayEnd; }).length,
      resolved: issues.filter(x => { if (!x.closedAt) return false; const t = new Date(x.closedAt).getTime(); return t >= dayStart && t < dayEnd; }).length,
    };
  });

  /* ---- Status counts ---- */
  const statusCounts = {};
  Object.keys(D.STATUSES).forEach(k => { statusCounts[k] = issues.filter(i => i.status === k).length; });

  /* ---- Priority rows (open only) ---- */
  const priorityRows = ['urgent','high','normal','low'].map(k => ({
    key: k, id: k,
    name: D.PRIORITIES[k].label,
    color: D.PRIORITIES[k].color,
    count: open.filter(i => i.priority === k).length,
  }));

  /* ---- Group breakdown (open count) ---- */
  const groupRows = D.GROUPS
    .map(g => ({ ...g, count: open.filter(i => i.groupId === g.id).length }))
    .sort((a, b) => b.count - a.count);

  /* ---- Team workload ---- */
  const workload = D.MEMBERS
    .filter(m => m.id !== 'm0')
    .map(m => ({ ...m, count: open.filter(i => i.assigneeId === m.id).length }))
    .sort((a, b) => b.count - a.count);

  /* ---- Category breakdown (all issues) ---- */
  const catRows = Object.entries(D.CATEGORIES)
    .map(([k, c]) => ({
      key: k, name: c.label, color: c.color,
      count: issues.filter(i => i.category === k).length,
      open:  open.filter(i => i.category === k).length,
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);

  /* ---- Top reporters ---- */
  const reporterMap = {};
  issues.forEach(i => {
    const key = i.reporter.name;
    if (!reporterMap[key]) reporterMap[key] = { name: key, color: i.reporter.color, initials: i.reporter.initials, count: 0, open: 0 };
    reporterMap[key].count++;
    if (i.status !== 'resolved') reporterMap[key].open++;
  });
  const topReporters = Object.values(reporterMap).sort((a, b) => b.count - a.count).slice(0, 6);

  /* ---- Recent open issues ---- */
  const recentOpen = open.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  /* ---- Weekly summary ---- */
  const thisWeekNew  = issues.filter(i => new Date(i.createdAt).getTime() >= weekMs).length;
  const thisWeekRes  = resolved.filter(i => i.closedAt && new Date(i.closedAt).getTime() >= weekMs).length;

  const col2 = isMobile ? '1fr' : '1fr 1fr';
  const col3 = isMobile ? '1fr' : '1fr 1fr 1fr';

  return (
    <div style={{ padding: isMobile ? '14px' : '22px 26px', overflowY: 'auto', height: '100%', background: '#F4F7F6' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ══ KPI Row ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(6,1fr)', gap: 12 }}>
          <StatCard
            label="เรื่องที่ค้างอยู่" value={openCount}
            accent="#3B82F6" icon="inbox"
            badge={newToday - newYesterday}
            badgeUp={(newToday - newYesterday) <= 0}
          />
          <StatCard label="ยังไม่ได้อ่าน" value={unread} sub="เรื่อง" accent="#8B5CF6" icon="bell" />
          <StatCard label="ด่วนมาก (ค้าง)" value={urgent} sub="เรื่อง" accent="#DC2626" icon="fire" />
          <StatCard label="ยังไม่มอบหมาย" value={unassigned} sub="เรื่อง" accent="#F59E0B" icon="user" />
          <StatCard
            label="ปิดงานวันนี้" value={resolvedToday} sub="เรื่อง"
            accent="#16A34A" icon="check"
            badge={resolvedToday - resolvedYesterday}
            badgeUp={(resolvedToday - resolvedYesterday) >= 0}
          />
          <StatCard
            label="เวลาตอบเฉลี่ย"
            value={avgResponseFmt ? avgResponseFmt.value : '–'}
            sub={avgResponseFmt ? avgResponseFmt.unit : ''}
            accent="#0EA5E9" icon="clock"
          />
        </div>

        {/* ══ Summary strip ══ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)',
          gap: 10,
        }}>
          {[
            { label: 'แจ้งใหม่วันนี้',    value: newToday,       color: '#3B82F6' },
            { label: 'แจ้งใหม่สัปดาห์นี้', value: thisWeekNew,   color: '#06C755' },
            { label: 'ปิดได้สัปดาห์นี้',  value: thisWeekRes,   color: '#10B981' },
            { label: 'อัตราแก้ไขสำเร็จ',  value: resolutionRate + '%', color: '#8B5CF6' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: 12, padding: '12px 16px',
              boxShadow: '0 1px 3px rgba(15,23,42,.04), 0 0 0 1px rgba(15,23,42,.03)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: s.color, flexShrink: 0 }}></span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', flex: 1 }}>{s.label}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'Anuphan,sans-serif' }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* ══ Trend + Status donut ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.7fr 1fr', gap: 14 }}>
          <Panel
            title="ปริมาณงาน 7 วันย้อนหลัง"
            sub="เปรียบเทียบปัญหาเข้าใหม่กับที่ปิดได้"
            action={
              <div style={{ display: 'flex', gap: 14 }}>
                {[['#06C755','เข้าใหม่'],['#3B82F6','ปิดได้']].map(([c,l]) => (
                  <span key={l} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:600, color:'#64748B' }}>
                    <span style={{ width:14, height:3, borderRadius:9, background:c }}></span>{l}
                  </span>
                ))}
              </div>
            }>
            <TrendChart data={trendData} />
          </Panel>
          <Panel title="สถานะปัญหาทั้งหมด" sub={`อัตราแก้ไขสำเร็จ ${resolutionRate}%`}>
            <StatusDonut counts={statusCounts} total={total} />
          </Panel>
        </div>

        {/* ══ Groups + Team workload ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 14 }}>
          <Panel title="กลุ่ม Line ที่มีปัญหาค้าง" sub="จำนวนเรื่องที่ยังไม่ปิด">
            {groupRows.length === 0
              ? <p style={{ color:'#94A3B8', fontSize:13, margin:0 }}>ยังไม่มีกลุ่ม Line เชื่อมต่อ</p>
              : <HBars rows={groupRows} />}
          </Panel>

          <Panel title="ภาระงานทีม" sub="เรื่องที่ค้างอยู่ต่อสมาชิก">
            {workload.length === 0
              ? <p style={{ color:'#94A3B8', fontSize:13, margin:0 }}>ไม่มีสมาชิกในทีม</p>
              : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {workload.map(m => {
                    const cntColor = m.count > 3 ? '#DC2626' : m.count > 1 ? '#F59E0B' : '#16A34A';
                    return (
                      <div key={m.id} style={{ display:'flex', alignItems:'center', gap:11 }}>
                        <Avatar initials={m.initials} color={m.color} size={32} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#1E293B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</div>
                          <div style={{ fontSize:11, color:'#94A3B8', fontWeight:500 }}>{m.role || 'ทีมงาน'}</div>
                        </div>
                        <span style={{
                          fontSize:13, fontWeight:700, color:cntColor,
                          background: cntColor + '14', borderRadius:7, padding:'4px 10px', flexShrink:0,
                        }}>{m.count} เรื่อง</span>
                      </div>
                    );
                  })}
                  {workload.every(m => m.count === 0) && (
                    <p style={{ textAlign:'center', color:'#94A3B8', fontSize:13, margin:0, paddingTop:8 }}>ไม่มีงานค้างอยู่ 🎉</p>
                  )}
                </div>
              )}
          </Panel>
        </div>

        {/* ══ Priority + Category + Top reporters ══ */}
        <div style={{ display:'grid', gridTemplateColumns:col3, gap:14 }}>
          <Panel title="ระดับความเร่งด่วน" sub="เรื่องที่ยังค้างอยู่">
            <HBars rows={priorityRows} />
          </Panel>

          <Panel title="หมวดหมู่ปัญหา" sub="ทุกเรื่อง · เรียงจากมากไปน้อย">
            {catRows.length === 0
              ? <p style={{ color:'#94A3B8', fontSize:13, margin:0 }}>ไม่มีข้อมูล</p>
              : (
                <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                  {catRows.map(c => (
                    <div key={c.key} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:10, height:10, borderRadius:3, background:c.color, flexShrink:0 }}></span>
                      <span style={{ flex:1, fontSize:12.5, fontWeight:600, color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</span>
                      <span style={{ fontSize:11, fontWeight:500, color:'#94A3B8', flexShrink:0 }}>เปิด {c.open}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:'#0F172A', width:22, textAlign:'right', flexShrink:0 }}>{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
          </Panel>

          <Panel title="ผู้แจ้งบ่อยที่สุด" sub="เรียงตามจำนวนเรื่องทั้งหมด">
            {topReporters.length === 0
              ? <p style={{ color:'#94A3B8', fontSize:13, margin:0 }}>ไม่มีข้อมูล</p>
              : (
                <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                  {topReporters.map((r, i) => (
                    <div key={r.name} style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <span style={{ width:18, fontSize:11.5, fontWeight:700, color:'#CBD5E1', textAlign:'center', flexShrink:0 }}>#{i+1}</span>
                      <Avatar initials={r.initials} color={r.color} size={26} />
                      <span style={{ flex:1, fontSize:12.5, fontWeight:600, color:'#334155', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</span>
                      <span style={{ fontSize:11, fontWeight:600, color: r.open > 0 ? '#F59E0B' : '#10B981', flexShrink:0 }}>
                        {r.open > 0 ? `${r.open} ค้าง` : 'ปิดหมดแล้ว'}
                      </span>
                      <span style={{ fontSize:13, fontWeight:700, color:'#0F172A', width:22, textAlign:'right', flexShrink:0 }}>{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
          </Panel>
        </div>

        {/* ══ Recent open issues ══ */}
        <Panel title="เรื่องที่ค้างอยู่ล่าสุด" sub="5 เรื่องล่าสุดที่ยังไม่ปิด">
          {recentOpen.length === 0
            ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'#10B981', fontSize:14, fontWeight:600 }}>
                🎉 ไม่มีเรื่องค้างอยู่ในขณะนี้
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' }}>
                {recentOpen.map((issue, i) => {
                  const grp = byId(D.GROUPS, issue.groupId);
                  return (
                    <div key={issue.id} style={{
                      display:'flex', alignItems:'center', gap:12, padding:'10px 0',
                      borderBottom: i < recentOpen.length - 1 ? '1px solid #F1F5F9' : 'none',
                    }}>
                      <Avatar initials={issue.reporter.initials} color={issue.reporter.color} size={30} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13.5, fontWeight:600, color:'#1E293B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {issue.title}
                        </div>
                        <div style={{ fontSize:11.5, color:'#94A3B8', marginTop:2, display:'flex', alignItems:'center', gap:7 }}>
                          <span>{issue.reporter.name}</span>
                          {grp && <><span>·</span><span>{grp.name}</span></>}
                          <span>·</span>
                          <span>{timeAgo(issue.createdAt)}</span>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
                        <StatusPill status={issue.status} size="sm" />
                        <PriorityTag priority={issue.priority} showLabel={false} />
                        {issue.unread && <span style={{ width:7, height:7, borderRadius:99, background:'#3B82F6' }}></span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </Panel>

        {/* ══ Team Type KPI ══ */}
        {(D.TEAM_TYPES || []).filter(t => t.is_active).length > 0 && (() => {
          const activeTypes = (D.TEAM_TYPES || []).filter(t => t.is_active);
          const rows = activeTypes.map(t => {
            const openForTeam  = open.filter(i => i.teamTypeId === t.id).length;
            const totalForTeam = issues.filter(i => i.teamTypeId === t.id).length;
            return { label: t.team_name, value: openForTeam, total: totalForTeam, color: t.color };
          }).filter(r => r.total > 0).sort((a, b) => b.value - a.value);
          const noTeam = open.filter(i => !i.teamTypeId).length;

          if (rows.length === 0 && noTeam === 0) return null;
          const maxVal = Math.max(...rows.map(r => r.value), noTeam, 1);

          return (
            <Panel title="ประเภททีมที่มีงานค้าง" sub="เรื่องที่ยังไม่ปิด แยกตามประเภททีม">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {rows.map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: r.color, flexShrink: 0 }}></span>
                    <span style={{ width: 110, fontSize: 12.5, fontWeight: 700, color: '#334155', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
                    <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 99 }}>
                      <div style={{ width: `${Math.round(r.value / maxVal * 100)}%`, height: '100%', borderRadius: 99, background: r.color, transition: 'width .3s' }}></div>
                    </div>
                    <span style={{ width: 28, fontSize: 12.5, fontWeight: 800, color: r.color, textAlign: 'right' }}>{r.value}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>/{r.total}</span>
                  </div>
                ))}
                {noTeam > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#CBD5E1', flexShrink: 0 }}></span>
                    <span style={{ width: 110, fontSize: 12.5, fontWeight: 700, color: '#94A3B8', flexShrink: 0 }}>ไม่ระบุทีม</span>
                    <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 99 }}>
                      <div style={{ width: `${Math.round(noTeam / maxVal * 100)}%`, height: '100%', borderRadius: 99, background: '#CBD5E1', transition: 'width .3s' }}></div>
                    </div>
                    <span style={{ width: 28, fontSize: 12.5, fontWeight: 800, color: '#94A3B8', textAlign: 'right' }}>{noTeam}</span>
                    <span style={{ fontSize: 11, color: '#CBD5E1' }}></span>
                  </div>
                )}
              </div>
            </Panel>
          );
        })()}

        {/* ══ Performance footer ══ */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
          <div style={{
            background:'#fff', borderRadius:14, padding:'16px 20px',
            boxShadow:'0 1px 3px rgba(15,23,42,.05), 0 0 0 1px rgba(15,23,42,.04)',
            display:'flex', alignItems:'center', gap:14,
          }}>
            <span style={{ width:36, height:36, borderRadius:10, background:'#0EA5E915', color:'#0EA5E9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="clock" size={18} />
            </span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#94A3B8' }}>เวลาตอบเฉลี่ย (มี {responseTimes.length} เรื่อง)</div>
              <div style={{ fontSize:22, fontWeight:800, color:'#0F172A', fontFamily:'Anuphan,sans-serif', letterSpacing:'-.02em' }}>
                {avgResponseFmt ? `${avgResponseFmt.value} ${avgResponseFmt.unit}` : '–'}
              </div>
            </div>
          </div>
          <div style={{
            background:'#fff', borderRadius:14, padding:'16px 20px',
            boxShadow:'0 1px 3px rgba(15,23,42,.05), 0 0 0 1px rgba(15,23,42,.04)',
            display:'flex', alignItems:'center', gap:14,
          }}>
            <span style={{ width:36, height:36, borderRadius:10, background:'#10B98115', color:'#10B981', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="check" size={18} strokeWidth={2.5} />
            </span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#94A3B8' }}>เวลาแก้ปัญหาเฉลี่ย (จาก {resTimes.length} เรื่อง)</div>
              <div style={{ fontSize:22, fontWeight:800, color:'#0F172A', fontFamily:'Anuphan,sans-serif', letterSpacing:'-.02em' }}>
                {avgResolutionFmt ? `${avgResolutionFmt.value} ${avgResolutionFmt.unit}` : '–'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, StatCard, TrendChart, HBars, GroupBars: HBars, StatusDonut, Panel });
