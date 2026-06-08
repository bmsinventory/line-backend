/* ===== Board view (Kanban) ===== */
function BoardCard({ issue, onClick, onDragStart, dragging }) {
  const group = byId(D.GROUPS, issue.groupId) || { initials: '??', color: '#94A3B8', name: 'ไม่ระบุกลุ่ม' };
  const assignee = issue.assigneeId ? byId(D.MEMBERS, issue.assigneeId) : null;
  return (
    <div draggable onDragStart={onDragStart} onClick={onClick} style={{
      background: '#fff', borderRadius: 14, padding: '13px 14px', cursor: 'grab',
      boxShadow: '0 1px 3px rgba(15,23,42,.06), 0 0 0 1px rgba(15,23,42,.04)',
      opacity: dragging ? 0.4 : 1, transition: 'box-shadow .15s, transform .1s',
      borderLeft: '3px solid ' + D.PRIORITIES[issue.priority].color,
    }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,23,42,.12), 0 0 0 1px rgba(15,23,42,.05)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,.06), 0 0 0 1px rgba(15,23,42,.04)'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <Avatar initials={group.initials} color={group.color} size={18} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{group.name}</span>
        {issue.priority === 'urgent' && <Icon name="fire" size={14} className="" strokeWidth={2} style={{ color: '#DC2626' }} />}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1E293B', lineHeight: 1.4, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{issue.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <CategoryChip cat={issue.category} />
        <div style={{ flex: 1 }}></div>
        <span style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 600 }}>{timeAgo(issue.createdAt)}</span>
        {assignee && <Avatar initials={assignee.initials} color={assignee.color} size={22} />}
      </div>
    </div>
  );
}

function Board({ issues, onUpdate, onOpen, isMobile }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const cols = Object.keys(D.STATUSES);
  return (
    <div style={{ display: 'flex', gap: 16, padding: isMobile ? '16px' : '20px 24px', height: '100%', overflowX: 'auto', alignItems: 'flex-start' }}>
      {cols.map((col) => {
        const list = issues.filter((i) => i.status === col).sort((a, b) => D.PRIORITIES[b.priority].rank - D.PRIORITIES[a.priority].rank);
        const s = D.STATUSES[col];
        const isOver = overCol === col;
        return (
          <div key={col}
            onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
            onDragLeave={() => setOverCol((c) => c === col ? null : c)}
            onDrop={() => { if (dragId) onUpdate(dragId, { status: col }); setDragId(null); setOverCol(null); }}
            style={{
              width: isMobile ? 280 : 300, flexShrink: 0, background: isOver ? s.color + '0E' : '#EEF2F1',
              borderRadius: 16, padding: 10, maxHeight: '100%', display: 'flex', flexDirection: 'column',
              outline: isOver ? '2px dashed ' + s.color + '66' : '2px dashed transparent', transition: 'background .12s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px 12px' }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: s.dot }}></span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#334155', fontFamily: 'Anuphan, sans-serif' }}>{s.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', background: '#fff', borderRadius: 99, padding: '1px 9px' }}>{list.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, overflowY: 'auto', flex: 1, padding: '0 2px 4px' }}>
              {list.map((i) => (
                <BoardCard key={i.id} issue={i} dragging={dragId === i.id}
                  onDragStart={() => setDragId(i.id)}
                  onClick={() => onOpen(i.id)} />
              ))}
              {list.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12.5, color: '#CBD5E1', fontWeight: 600 }}>ไม่มีรายการ</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { Board, BoardCard });
