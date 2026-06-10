/* ===== Board (Kanban) + Issue List view ===== */

/* ---------- SortTh — sortable column header ---------- */
function SortTh({ col, sortKey, sortDir, onSort, children, right, style: extraStyle }) {
  const active = !!col && sortKey === col;
  return (
    <th onClick={() => col && onSort(col)} style={{
      padding: '0 13px', height: 44, textAlign: right ? 'right' : 'left',
      fontSize: 12, fontWeight: 700, color: active ? '#0B3D2E' : '#64748B',
      background: '#F8FAFB', borderBottom: '1.5px solid #EEF2F1',
      whiteSpace: 'nowrap', cursor: col ? 'pointer' : 'default', userSelect: 'none',
      position: 'sticky', top: 0, zIndex: 5,
      ...(extraStyle || {}),
    }}>
      {col ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {children}
          <Icon name="chevronDown" size={12} style={{
            color: active ? '#06C755' : '#D1D5DB', flexShrink: 0,
            transform: active && sortDir === 'asc' ? 'scaleY(-1)' : 'none',
            transition: 'transform .15s, color .15s',
          }} />
        </span>
      ) : children}
    </th>
  );
}

/* ========== Improved BoardCard ========== */
function BoardCard({ issue, onClick, onDragStart, dragging }) {
  const group    = byId(D.GROUPS, issue.groupId) || { initials: '?', color: '#94A3B8', name: 'ไม่ระบุ' };
  const assignee = issue.assigneeId ? byId(D.MEMBERS, issue.assigneeId) : null;
  const msgCount = (issue.thread || []).filter(m => m.from !== 'system').length;
  const ageDays  = Math.floor((Date.now() - new Date(issue.createdAt)) / 86400000);
  const isOld    = ageDays >= 3 && issue.status !== 'resolved';
  const priColor = D.PRIORITIES[issue.priority].color;

  return (
    <div draggable onDragStart={onDragStart} onClick={onClick}
      style={{
        background: '#fff', borderRadius: 14, padding: '12px 14px 11px', cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(15,23,42,.06), 0 0 0 1px rgba(15,23,42,.04)',
        opacity: dragging ? 0.32 : 1, position: 'relative',
        borderLeft: '3px solid ' + priColor, transition: 'box-shadow .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,23,42,.13), 0 0 0 1px rgba(15,23,42,.05)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,.06), 0 0 0 1px rgba(15,23,42,.04)'}
    >
      {/* Unread dot */}
      {issue.unread && (
        <span style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 99, background: '#3B82F6', boxShadow: '0 0 0 2px #fff' }} />
      )}

      {/* Row 1: group + age + priority */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, paddingRight: issue.unread ? 20 : 0 }}>
        <Avatar initials={group.initials} color={group.color} size={17} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#94A3B8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {group.name}
        </span>
        {isOld && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', background: '#FEF2F2', borderRadius: 5, padding: '2px 6px', flexShrink: 0 }}>
            {ageDays}ว
          </span>
        )}
        {issue.priority === 'urgent' && <Icon name="fire" size={13} strokeWidth={2} style={{ color: '#DC2626', flexShrink: 0 }} />}
        {issue.priority === 'high'   && <Icon name="arrowUp" size={13} strokeWidth={2.5} style={{ color: '#F59E0B', flexShrink: 0 }} />}
      </div>

      {/* Row 2: title */}
      <div style={{
        fontSize: 13.5, fontWeight: 600, color: '#1E293B', lineHeight: 1.45, marginBottom: 9,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {issue.title}
      </div>

      {/* Row 3: reporter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
        <div style={{
          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
          background: issue.reporter.color + '22', color: issue.reporter.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800,
        }}>
          {(issue.reporter.initials || '?').slice(0, 1)}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {issue.reporter.name}
        </span>
      </div>

      {/* Row 4: category + msg count + time + assignee */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CategoryChip cat={issue.category} />
        <div style={{ flex: 1 }} />
        {msgCount > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>
            <Icon name="message" size={11} />{msgCount}
          </span>
        )}
        <span style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 600 }}>{timeAgo(issue.createdAt)}</span>
        {assignee && <Avatar initials={assignee.initials} color={assignee.color} size={20} />}
      </div>
    </div>
  );
}

/* ========== Improved Board (Kanban) ========== */
function Board({ issues, onUpdate, onOpen, isMobile }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const cols  = Object.keys(D.STATUSES);
  const total = issues.length;

  return (
    <div style={{
      display: 'flex', gap: 14, padding: isMobile ? '14px 12px' : '18px 22px',
      height: '100%', overflowX: 'auto', alignItems: 'flex-start', background: '#F4F7F6',
    }}>
      {cols.map(col => {
        const s         = D.STATUSES[col];
        const list      = issues.filter(i => i.status === col).sort((a, b) => D.PRIORITIES[b.priority].rank - D.PRIORITIES[a.priority].rank);
        const urgentCnt = list.filter(i => i.priority === 'urgent').length;
        const highCnt   = list.filter(i => i.priority === 'high').length;
        const unreadCnt = list.filter(i => i.unread).length;
        const isOver    = overCol === col;
        const pct       = total > 0 ? Math.round(list.length / total * 100) : 0;

        return (
          <div key={col}
            onDragOver={e => { e.preventDefault(); setOverCol(col); }}
            onDragLeave={() => setOverCol(c => c === col ? null : c)}
            onDrop={() => { if (dragId) onUpdate(dragId, { status: col }); setDragId(null); setOverCol(null); }}
            style={{
              width: isMobile ? 285 : 308, flexShrink: 0,
              background: isOver ? s.color + '0D' : '#EAEFED',
              borderRadius: 18, padding: '0 10px 10px',
              maxHeight: '100%', display: 'flex', flexDirection: 'column',
              outline: isOver ? `2px dashed ${s.color}66` : '2px dashed transparent',
              transition: 'background .12s, outline .12s',
            }}
          >
            {/* Column header */}
            <div style={{ padding: '14px 6px 12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: 99, background: s.dot, flexShrink: 0 }}></span>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: '#1E293B', fontFamily: 'Anuphan,sans-serif', flex: 1 }}>{s.label}</span>
                <span style={{
                  fontSize: 13, fontWeight: 800, color: '#fff', background: s.color,
                  borderRadius: 99, padding: '2px 11px', minWidth: 28, textAlign: 'center',
                }}>{list.length}</span>
              </div>
              {/* Stats row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ flex: 1, height: 4, background: '#DDE3E0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: pct + '%', height: '100%', background: s.color, borderRadius: 99, transition: 'width .5s' }} />
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8' }}>{pct}%</span>
                {urgentCnt > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10.5, fontWeight: 700, color: '#DC2626', background: '#FEF2F2', borderRadius: 5, padding: '2px 5px' }}>
                    <Icon name="fire" size={10} strokeWidth={2} />{urgentCnt}
                  </span>
                )}
                {highCnt > 0 && !urgentCnt && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10.5, fontWeight: 700, color: '#F59E0B', background: '#FEF9EE', borderRadius: 5, padding: '2px 5px' }}>
                    <Icon name="arrowUp" size={10} strokeWidth={2.5} />{highCnt}
                  </span>
                )}
                {unreadCnt > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10.5, fontWeight: 700, color: '#3B82F6', background: '#EFF6FF', borderRadius: 5, padding: '2px 5px' }}>
                    <span style={{ width: 5, height: 5, borderRadius: 99, background: '#3B82F6', flexShrink: 0 }}></span>{unreadCnt}
                  </span>
                )}
              </div>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1, paddingBottom: 2 }}>
              {list.map(i => (
                <BoardCard key={i.id} issue={i} dragging={dragId === i.id}
                  onDragStart={() => setDragId(i.id)}
                  onClick={() => onOpen(i.id)} />
              ))}
              {list.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 0', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={22} strokeWidth={1.5} style={{ color: s.color + '80' }} />
                  </div>
                  <span style={{ fontSize: 12.5, color: '#C4CBCA', fontWeight: 600 }}>ว่างอยู่</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========== Issue List View ========== */
function IssueListView({ issues, onOpen, isMobile, search }) {
  const [sortKey,        setSortKey]        = useState('createdAt');
  const [sortDir,        setSortDir]        = useState('desc');
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterGroup,    setFilterGroup]    = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');

  const filtered = useMemo(() => {
    let l = [...issues];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      l = l.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.code || '').toLowerCase().includes(q) ||
        i.reporter.name.toLowerCase().includes(q)
      );
    }
    if (filterStatus   !== 'all') l = l.filter(i => i.status   === filterStatus);
    if (filterPriority !== 'all') l = l.filter(i => i.priority === filterPriority);
    if (filterGroup    !== 'all') l = l.filter(i => i.groupId  === filterGroup);
    if (filterCategory !== 'all') l = l.filter(i => i.category === filterCategory);
    if (filterAssignee === 'unassigned') l = l.filter(i => !i.assigneeId);
    else if (filterAssignee !== 'all')   l = l.filter(i => i.assigneeId === filterAssignee);

    l.sort((a, b) => {
      let va, vb;
      switch (sortKey) {
        case 'priority':  va = D.PRIORITIES[a.priority].rank;  vb = D.PRIORITIES[b.priority].rank;  break;
        case 'title':     va = a.title.toLowerCase();          vb = b.title.toLowerCase();           break;
        case 'status':    va = Object.keys(D.STATUSES).indexOf(a.status); vb = Object.keys(D.STATUSES).indexOf(b.status); break;
        case 'group':     va = (byId(D.GROUPS, a.groupId)?.name  || ''); vb = (byId(D.GROUPS, b.groupId)?.name  || ''); break;
        case 'reporter':  va = a.reporter.name;                vb = b.reporter.name;                break;
        case 'assignee':  va = (byId(D.MEMBERS, a.assigneeId)?.name || ''); vb = (byId(D.MEMBERS, b.assigneeId)?.name || ''); break;
        case 'msgs':      va = (a.thread || []).length;        vb = (b.thread || []).length;        break;
        default:          va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime(); break;
      }
      const cmp = typeof va === 'string' ? va.localeCompare(vb, 'th') : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return l;
  }, [issues, search, filterStatus, filterPriority, filterGroup, filterCategory, filterAssignee, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const hasFilter = filterStatus !== 'all' || filterPriority !== 'all' || filterGroup !== 'all' || filterCategory !== 'all' || filterAssignee !== 'all';
  const clearAll  = () => { setFilterStatus('all'); setFilterPriority('all'); setFilterGroup('all'); setFilterCategory('all'); setFilterAssignee('all'); };

  const statusTabs = [['all', 'ทั้งหมด', issues.length], ...Object.entries(D.STATUSES).map(([k, v]) => [k, v.label, issues.filter(i => i.status === k).length])];

  /* ===== Mobile: card list ===== */
  if (isMobile) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F4F7F6' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #EEF2F1', padding: '10px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {statusTabs.map(([k, l, c]) => {
              const on = filterStatus === k;
              return (
                <button key={k} onClick={() => setFilterStatus(k)} style={{
                  flexShrink: 0, border: 'none', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
                  padding: '6px 12px', fontSize: 12.5, fontWeight: 700,
                  background: on ? '#0B3D2E' : '#F1F5F9', color: on ? '#fff' : '#64748B',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  {l} <span style={{ fontSize: 11, opacity: 0.75 }}>{c}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', padding: '2px 4px' }}>{filtered.length} รายการ</div>
          {filtered.map(issue => {
            const grp      = byId(D.GROUPS, issue.groupId);
            const assignee = byId(D.MEMBERS, issue.assigneeId);
            const msgCount = (issue.thread || []).filter(m => m.from !== 'system').length;
            return (
              <div key={issue.id} onClick={() => onOpen(issue.id)} style={{
                background: '#fff', borderRadius: 13, padding: '13px 15px', cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(15,23,42,.05), 0 0 0 1px rgba(15,23,42,.04)',
                borderLeft: '3px solid ' + D.PRIORITIES[issue.priority].color, position: 'relative',
              }}>
                {issue.unread && <span style={{ position: 'absolute', top: 13, right: 13, width: 8, height: 8, borderRadius: 99, background: '#3B82F6' }} />}
                <div style={{ display: 'flex', gap: 8, marginBottom: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                  <StatusPill status={issue.status} size="sm" />
                  <PriorityTag priority={issue.priority} showLabel />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', lineHeight: 1.4, marginBottom: 8 }}>{issue.title}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
                  <span>{issue.reporter.name}</span>
                  {grp && <><span>·</span><span>{grp.name}</span></>}
                  <CategoryChip cat={issue.category} />
                  <span>{timeAgo(issue.createdAt)}</span>
                  {msgCount > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="message" size={11} />{msgCount}</span>
                  )}
                </div>
                {assignee && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9, paddingTop: 9, borderTop: '1px solid #F1F5F9' }}>
                    <Avatar initials={assignee.initials} color={assignee.color} size={18} />
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{assignee.name}</span>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#CBD5E1', fontSize: 13, fontWeight: 600 }}>ไม่พบรายการที่ตรงเงื่อนไข</div>
          )}
        </div>
      </div>
    );
  }

  /* ===== Desktop: table ===== */
  const thP = { sortKey, sortDir, onSort: handleSort };
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F4F7F6', overflow: 'hidden' }}>

      {/* Filter bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EEF2F1', padding: '11px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

          {/* Status tabs */}
          <div style={{ display: 'flex', gap: 5 }}>
            {statusTabs.map(([k, l, c]) => {
              const on = filterStatus === k;
              return (
                <button key={k} onClick={() => setFilterStatus(k)} style={{
                  border: 'none', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
                  padding: '6px 13px', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
                  background: on ? '#0B3D2E' : '#F1F5F9', color: on ? '#fff' : '#64748B',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  {l} <span style={{ fontSize: 11, fontWeight: 800, opacity: on ? 0.85 : 0.55 }}>{c}</span>
                </button>
              );
            })}
          </div>

          <div style={{ width: 1, height: 22, background: '#E2E8F0', flexShrink: 0 }} />

          {/* Dropdown filters */}
          {[
            { k: 'pri',    val: filterPriority, set: setFilterPriority, opts: [['all','ความเร่งด่วน'], ...Object.entries(D.PRIORITIES).map(([k,v])=>[k,v.label])] },
            { k: 'grp',    val: filterGroup,    set: setFilterGroup,    opts: [['all','ทุกกลุ่ม'],    ...D.GROUPS.map(g=>[g.id,g.name])] },
            { k: 'cat',    val: filterCategory, set: setFilterCategory, opts: [['all','ทุกหมวดหมู่'], ...Object.entries(D.CATEGORIES).map(([k,v])=>[k,v.label])] },
            { k: 'assign', val: filterAssignee, set: setFilterAssignee, opts: [['all','ผู้รับผิดชอบ'],['unassigned','ยังไม่มอบหมาย'], ...D.MEMBERS.filter(m=>m.id!=='m0').map(m=>[m.id,m.name])] },
          ].map(f => {
            const active = f.val !== 'all';
            return (
              <select key={f.k} value={f.val} onChange={e => f.set(e.target.value)} style={{
                border: '1.5px solid ' + (active ? '#06C755' : '#E2E8F0'), borderRadius: 9,
                padding: '6px 10px', fontSize: 12.5, fontWeight: 600,
                color: active ? '#0B3D2E' : '#475569', background: active ? '#F0FDF4' : '#fff',
                cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
              }}>
                {f.opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            );
          })}

          {hasFilter && (
            <button onClick={clearAll} style={{
              border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 8px', borderRadius: 8,
            }}>
              <Icon name="x" size={13} />ล้างตัวกรอง
            </button>
          )}

          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>{filtered.length} รายการ</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 960, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {/* Indicator column (no sort) */}
              <th style={{ width: 5, padding: 0, background: '#F8FAFB', borderBottom: '1.5px solid #EEF2F1', position: 'sticky', top: 0, zIndex: 5 }}></th>
              <SortTh col="priority"  {...thP}>ความเร่งด่วน</SortTh>
              <SortTh col="title"     {...thP}>หัวข้อปัญหา</SortTh>
              <SortTh col="reporter"  {...thP}>ผู้แจ้ง</SortTh>
              <SortTh col="group"     {...thP}>กลุ่ม Line</SortTh>
              <SortTh col="category"  {...thP}>หมวดหมู่</SortTh>
              <SortTh col="status"    {...thP}>สถานะ</SortTh>
              <SortTh col="assignee"  {...thP}>ผู้รับผิดชอบ</SortTh>
              <SortTh col="createdAt" {...thP}>วันที่แจ้ง</SortTh>
              <SortTh col="msgs"      {...thP} right>ข้อความ</SortTh>
            </tr>
          </thead>
          <tbody>
            {filtered.map((issue, idx) => {
              const grp      = byId(D.GROUPS, issue.groupId);
              const assignee = byId(D.MEMBERS, issue.assigneeId);
              const msgCount = (issue.thread || []).filter(m => m.from !== 'system').length;
              const priColor = D.PRIORITIES[issue.priority].color;
              const bgBase   = issue.unread ? '#F8FBFF' : idx % 2 === 0 ? '#fff' : '#FAFBFC';
              const cell     = { padding: '0 13px', height: 54 };
              return (
                <tr key={issue.id} onClick={() => onOpen(issue.id)}
                  style={{ cursor: 'pointer', background: bgBase, transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F0FDF8'}
                  onMouseLeave={e => e.currentTarget.style.background = bgBase}
                >
                  {/* Priority color bar */}
                  <td style={{ padding: 0, width: 5, background: priColor }}></td>

                  {/* Priority */}
                  <td style={{ ...cell, width: 112, whiteSpace: 'nowrap' }}>
                    <PriorityTag priority={issue.priority} showLabel />
                  </td>

                  {/* Title */}
                  <td style={{ ...cell, maxWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {issue.unread && <span style={{ width: 7, height: 7, borderRadius: 99, background: '#3B82F6', flexShrink: 0 }} />}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {issue.title}
                        </div>
                        {issue.code && (
                          <div style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 600, marginTop: 1 }}>{issue.code}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Reporter */}
                  <td style={{ ...cell, width: 138 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Avatar initials={issue.reporter.initials} color={issue.reporter.color} size={22} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>
                        {issue.reporter.name}
                      </span>
                    </div>
                  </td>

                  {/* Group */}
                  <td style={{ ...cell, width: 135 }}>
                    {grp
                      ? <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Avatar initials={grp.initials} color={grp.color} size={20} />
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 88 }}>{grp.name}</span>
                        </div>
                      : <span style={{ color: '#CBD5E1', fontSize: 12 }}>–</span>}
                  </td>

                  {/* Category */}
                  <td style={{ ...cell, width: 128, whiteSpace: 'nowrap' }}>
                    <CategoryChip cat={issue.category} />
                  </td>

                  {/* Status */}
                  <td style={{ ...cell, width: 106, whiteSpace: 'nowrap' }}>
                    <StatusPill status={issue.status} size="sm" />
                  </td>

                  {/* Assignee */}
                  <td style={{ ...cell, width: 130 }}>
                    {assignee
                      ? <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Avatar initials={assignee.initials} color={assignee.color} size={20} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 88 }}>{assignee.name}</span>
                        </div>
                      : <span style={{ fontSize: 11.5, color: '#CBD5E1' }}>–</span>}
                  </td>

                  {/* Date */}
                  <td style={{ ...cell, width: 108, whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B' }}>
                      {new Date(issue.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </div>
                    <div style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 500, marginTop: 1 }}>{timeAgo(issue.createdAt)}</div>
                  </td>

                  {/* Msg count */}
                  <td style={{ ...cell, width: 72, textAlign: 'right', paddingRight: 16 }}>
                    {msgCount > 0
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: '#64748B', background: '#F1F5F9', borderRadius: 6, padding: '3px 8px' }}>
                          <Icon name="message" size={11} />{msgCount}
                        </span>
                      : <span style={{ color: '#E2E8F0', fontSize: 12 }}>–</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '72px 0', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
              <Icon name="list" size={26} strokeWidth={1.5} />
            </div>
            <span style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 600 }}>ไม่พบรายการที่ตรงเงื่อนไข</span>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Board, BoardCard, SortTh, IssueListView });
