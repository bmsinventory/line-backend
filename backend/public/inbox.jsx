/* ===== Inbox view ===== */

/* ---------- generic dropdown ---------- */
function Dropdown({ trigger, children, align = 'left', width = 220, drop = 'down' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen((o) => !o)}>{trigger(open)}</div>
      {open && (
        <div style={{
          position: 'absolute', [drop === 'up' ? 'bottom' : 'top']: 'calc(100% + 6px)', [align]: 0, width, zIndex: 50,
          background: '#fff', borderRadius: 14, boxShadow: '0 12px 40px rgba(15,23,42,.16), 0 0 0 1px rgba(15,23,42,.06)',
          padding: 6, animation: 'pop .14s ease-out',
        }}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
function MenuItem({ onClick, active, children, color }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
      border: 'none', background: active ? '#F1F5F9' : 'transparent', borderRadius: 9,
      cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: color || '#334155', textAlign: 'left',
      fontFamily: 'inherit', transition: 'background .12s',
    }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F8FAFC'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      {children}
    </button>
  );
}

/* ---------- issue list card ---------- */
function IssueCard({ issue, active, onClick }) {
  const group = byId(D.GROUPS, issue.groupId) || { initials: '??', color: '#94A3B8', name: 'ไม่ระบุกลุ่ม' };
  const assignee = issue.assigneeId ? byId(D.MEMBERS, issue.assigneeId) : null;
  const thread = issue.thread || [];
  const last = thread.length > 0 ? thread[thread.length - 1] : null;
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', position: 'relative',
      background: active ? '#fff' : 'transparent',
      borderRadius: 14, padding: '13px 14px 13px', fontFamily: 'inherit',
      boxShadow: active ? '0 2px 12px rgba(15,23,42,.08), 0 0 0 1.5px #06C75566' : 'none',
      transition: 'background .12s',
    }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#FFFFFFAA'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      {issue.unread && <span style={{ position: 'absolute', left: 5, top: 19, width: 7, height: 7, borderRadius: 99, background: '#06C755' }}></span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <Avatar initials={group.initials} color={group.color} size={20} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{group.name}</span>
        <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500, flexShrink: 0 }}>{timeAgo(issue.createdAt)}</span>
      </div>
      <div style={{
        fontSize: 14.5, fontWeight: issue.unread ? 700 : 600, color: '#1E293B', lineHeight: 1.4,
        marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{issue.title}</div>
      <div style={{ fontSize: 12.5, color: '#94A3B8', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {last ? (last.from === 'agent' ? 'คุณ: ' : last.from === 'system' ? '⚙ ' : '') + (last.text || '') : ''}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <StatusPill status={issue.status} size="sm" />
        <PriorityTag priority={issue.priority} showLabel={false} />
        <div style={{ flex: 1 }}></div>
        {assignee
          ? <Avatar initials={assignee.initials} color={assignee.color} size={22} />
          : <span style={{ fontSize: 11.5, fontWeight: 600, color: '#94A3B8', border: '1.5px dashed #CBD5E1', borderRadius: 99, padding: '3px 9px', whiteSpace: 'nowrap' }}>ยังไม่มอบหมาย</span>}
      </div>
    </button>
  );
}

/* ---------- conversation bubble ---------- */
function Bubble({ m }) {
  if (m.from === 'system') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
        <span style={{ fontSize: 12, color: '#94A3B8', background: '#F1F5F9', padding: '5px 12px', borderRadius: 999, fontWeight: 500, textAlign: 'center' }}>{m.text}</span>
      </div>
    );
  }
  const agent = m.from === 'agent';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: agent ? 'flex-end' : 'flex-start', gap: 3 }}>
      <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600, padding: '0 4px' }}>{m.who}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', maxWidth: '82%', flexDirection: agent ? 'row-reverse' : 'row' }}>
        <div style={{
          background: agent ? '#06C755' : '#fff', color: agent ? '#fff' : '#1E293B',
          padding: '10px 14px', borderRadius: 16,
          borderBottomRightRadius: agent ? 5 : 16, borderBottomLeftRadius: agent ? 16 : 5,
          fontSize: 14, lineHeight: 1.55, boxShadow: agent ? '0 1px 2px rgba(6,199,85,.3)' : '0 1px 3px rgba(15,23,42,.07)',
          fontWeight: 450,
        }}>
          {m.attachment && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '8px 10px',
              background: agent ? 'rgba(255,255,255,.18)' : '#F1F5F9', borderRadius: 10, fontWeight: 600, fontSize: 13,
            }}>
              <Icon name={m.attachment === 'video' ? 'video' : 'image'} size={16} />
              {m.attachment === 'video' ? 'วิดีโอแนบ' : 'รูปภาพแนบ'}
            </div>
          )}
          {m.text.replace(/^\[.*?\]\s*/, '')}
        </div>
      </div>
      <span style={{ fontSize: 10.5, color: '#CBD5E1', fontWeight: 500, padding: '0 4px' }}>{clockTime(m.at)}</span>
    </div>
  );
}

/* ---------- detail action bar control ---------- */
function ControlChip({ icon, label, value, color, onClick, open }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 11px', borderRadius: 10,
      border: '1.5px solid ' + (open ? '#06C755' : '#E2E8F0'), background: '#fff', cursor: 'pointer',
      fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: color || '#1E293B', whiteSpace: 'nowrap' }}>{value}</span>
      <Icon name="chevronDown" size={13} className="" strokeWidth={2.2} />
    </button>
  );
}

/* ---------- detail panel ---------- */
function IssueDetail({ issue, onUpdate, onReply, onBack, isMobile }) {
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [issue.id, issue.thread.length]);

  const group = byId(D.GROUPS, issue.groupId) || { initials: '??', color: '#94A3B8', name: 'ไม่ระบุกลุ่ม' };
  const assignee = issue.assigneeId ? byId(D.MEMBERS, issue.assigneeId) : null;

  const send = () => {
    if (!reply.trim()) return;
    onReply(issue.id, reply.trim(), internal);
    setReply('');
  };

  const quick = ['รับเรื่องแล้วครับ กำลังตรวจสอบให้นะครับ 🙏', 'ขออภัยในความไม่สะดวกค่ะ', 'ดำเนินการเรียบร้อยแล้วครับ', 'รบกวนแจ้งรายละเอียดเพิ่มเติมหน่อยได้ไหมคะ'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F4F7F6', minWidth: 0 }}>
      {/* header */}
      <div style={{ padding: isMobile ? '12px 16px' : '16px 22px', background: '#fff', borderBottom: '1px solid #EEF2F1', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {isMobile && (
            <button onClick={onBack} style={{ border: 'none', background: '#F1F5F9', borderRadius: 9, padding: 7, cursor: 'pointer', flexShrink: 0, marginTop: 2 }}>
              <Icon name="reply" size={18} />
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#06C755', letterSpacing: '.02em' }}>{issue.code}</span>
              <span style={{ width: 3, height: 3, borderRadius: 9, background: '#CBD5E1' }}></span>
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>แจ้งเมื่อ {fullDate(issue.createdAt)}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: isMobile ? 17 : 19, fontWeight: 700, color: '#0F172A', lineHeight: 1.35, fontFamily: 'Anuphan, sans-serif' }}>{issue.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 9, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Avatar initials={group.initials} color={group.color} size={22} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{group.name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: group.color, background: group.color + '14', padding: '2px 7px', borderRadius: 6 }}>{group.type === 'openchat' ? 'OpenChat' : 'กลุ่ม'}</span>
              </span>
              <span style={{ width: 3, height: 3, borderRadius: 9, background: '#CBD5E1' }}></span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Avatar initials={issue.reporter.initials} color={issue.reporter.color} size={22} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{issue.reporter.name}</span>
              </span>
            </div>
          </div>
        </div>

        {/* action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14, flexWrap: 'wrap' }}>
          <Dropdown align="left" width={200} trigger={(open) =>
            <ControlChip label="สถานะ" open={open} value={<StatusPill status={issue.status} size="sm" />} />}>
            {(close) => Object.keys(D.STATUSES).map((k) => (
              <MenuItem key={k} active={issue.status === k} onClick={() => { onUpdate(issue.id, { status: k }); close(); }}>
                <StatusPill status={k} size="sm" />
              </MenuItem>
            ))}
          </Dropdown>

          <Dropdown align="left" width={210} trigger={(open) =>
            <ControlChip label="มอบหมาย" open={open} color={assignee ? assignee.color : '#94A3B8'}
              value={assignee
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Avatar initials={assignee.initials} color={assignee.color} size={18} />{assignee.name}</span>
                : <span style={{ color: '#94A3B8' }}>ยังไม่มอบหมาย</span>} />}>
            {(close) => <>
              <MenuItem active={!issue.assigneeId} onClick={() => { onUpdate(issue.id, { assigneeId: null }); close(); }}>
                <span style={{ width: 18, height: 18, borderRadius: 6, border: '1.5px dashed #CBD5E1' }}></span>ยังไม่มอบหมาย
              </MenuItem>
              {D.MEMBERS.map((mem) => (
                <MenuItem key={mem.id} active={issue.assigneeId === mem.id} onClick={() => { onUpdate(issue.id, { assigneeId: mem.id }); close(); }}>
                  <Avatar initials={mem.initials} color={mem.color} size={20} />
                  <span style={{ flex: 1 }}>{mem.name}</span>
                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{mem.role}</span>
                </MenuItem>
              ))}
            </>}
          </Dropdown>

          <Dropdown align="left" width={170} trigger={(open) =>
            <ControlChip label="ความเร่งด่วน" open={open} color={D.PRIORITIES[issue.priority].color}
              value={<PriorityTag priority={issue.priority} />} />}>
            {(close) => Object.keys(D.PRIORITIES).reverse().map((k) => (
              <MenuItem key={k} active={issue.priority === k} onClick={() => { onUpdate(issue.id, { priority: k }); close(); }}>
                <PriorityTag priority={k} />
              </MenuItem>
            ))}
          </Dropdown>

          <CategoryChip cat={issue.category} />
        </div>
      </div>

      {/* conversation */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {issue.thread.map((m, i) => <Bubble key={i} m={m} />)}
      </div>

      {/* composer */}
      <div style={{ padding: isMobile ? '10px 12px 12px' : '12px 18px 16px', background: '#fff', borderTop: '1px solid #EEF2F1', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 7, marginBottom: 9, overflowX: 'auto', paddingBottom: 2 }}>
          {quick.map((q, i) => (
            <button key={i} onClick={() => setReply(q)} style={{
              flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: '#475569', background: '#F1F5F9',
              border: 'none', borderRadius: 999, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>{q.length > 26 ? q.slice(0, 24) + '…' : q}</button>
          ))}
        </div>
        <div style={{
          border: '1.5px solid ' + (internal ? '#FCD34D' : '#E2E8F0'), borderRadius: 16,
          background: internal ? '#FFFBEB' : '#fff', padding: 4, transition: 'all .15s',
        }}>
          <textarea value={reply} onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
            placeholder={internal ? 'เขียนโน้ตภายในทีม (ลูกค้าไม่เห็น)…' : `ตอบกลับเข้า ${group.name}…`}
            rows={2} style={{
              width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit',
              fontSize: 14, padding: '9px 11px 3px', background: 'transparent', color: '#1E293B', lineHeight: 1.5,
            }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 4px 8px' }}>
            <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', padding: 5, display: 'flex' }}>
              <Icon name="paperclip" size={18} />
            </button>
            <button onClick={() => setInternal((v) => !v)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12.5, fontWeight: 600, padding: '5px 10px', borderRadius: 8,
              background: internal ? '#FEF3C7' : '#F1F5F9', color: internal ? '#B45309' : '#64748B',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: internal ? '#F59E0B' : '#CBD5E1' }}></span>
              โน้ตภายใน
            </button>
            <div style={{ flex: 1 }}></div>
            <span style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 500 }}>⌘+Enter</span>
            <button onClick={send} disabled={!reply.trim()} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', borderRadius: 11,
              padding: '9px 16px', cursor: reply.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
              fontSize: 13.5, fontWeight: 700, color: '#fff',
              background: reply.trim() ? (internal ? '#F59E0B' : '#06C755') : '#CBD5E1',
              boxShadow: reply.trim() ? '0 2px 8px rgba(6,199,85,.35)' : 'none', transition: 'all .15s',
            }}>
              <Icon name="send" size={16} strokeWidth={2} />
              {internal ? 'บันทึกโน้ต' : 'ส่งเข้า Line'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dropdown, MenuItem, IssueCard, Bubble, IssueDetail, ControlChip });
