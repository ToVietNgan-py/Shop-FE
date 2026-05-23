/**
 * BulkActionBar.jsx — Phase 5
 * Thanh bulk action hiển thị khi có ít nhất 1 promotion được chọn.
 *
 * Props:
 *   selectedIds  - number[]  — danh sách id đang chọn
 *   onClear      - () => void
 *   onAction     - (action: 'activate'|'deactivate'|'delete') => void
 *   loading      - boolean
 */
const BulkActionBar = ({ selectedIds = [], onClear, onAction, loading = false }) => {
    if (selectedIds.length === 0) return null;

    return (
        <div style={{
            position: 'sticky',
            bottom: 16,
            zIndex: 50,
            background: '#1f2937',
            color: '#fff',
            borderRadius: 12,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            flexWrap: 'wrap',
            margin: '12px 0',
        }}>
            {/* Count */}
            <span style={{ fontWeight: 600, fontSize: 14, flex: '0 0 auto' }}>
                ✅ Đã chọn <span style={{ color: '#f9a8d4' }}>{selectedIds.length}</span> promotion
            </span>

            <div style={{ flex: 1 }} />

            {/* Actions */}
            <button
                onClick={() => onAction('activate')}
                disabled={loading}
                style={btnStyle('#16a34a')}
                title="Bật tất cả đã chọn"
            >
                ▶ Bật hàng loạt
            </button>

            <button
                onClick={() => onAction('deactivate')}
                disabled={loading}
                style={btnStyle('#d97706')}
                title="Tắt tất cả đã chọn"
            >
                ⏸ Tắt hàng loạt
            </button>

            <button
                onClick={() => onAction('delete')}
                disabled={loading}
                style={btnStyle('#dc2626')}
                title="Xóa tất cả đã chọn"
            >
                🗑 Xóa hàng loạt
            </button>

            {/* Clear */}
            <button
                onClick={onClear}
                disabled={loading}
                style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#e5e7eb',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 13,
                    cursor: 'pointer',
                }}
            >
                ✕ Bỏ chọn
            </button>
        </div>
    );
};

const btnStyle = (bg) => ({
    background: bg,
    border: 'none',
    color: '#fff',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    opacity: 1,
    whiteSpace: 'nowrap',
});

export default BulkActionBar;
