/**
 * PromotionListPage.jsx — Phase 5
 * Route: /admin/promotions
 *
 * Features:
 * - Danh sách promotions với filter + search
 * - Checkbox multi-select → BulkActionBar
 * - Badge flash_sale ⚡
 * - Clone / Stats / Edit / Delete per row
 * - Dear Rose aesthetic: tối giản, hồng-trắng-xám
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminPromotionService from '../../../services/admin/adminPromotionService.js';
import BulkActionBar from './BulkActionBar';
import './PromotionListPage.scss';

// ── Helpers ────────────────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const fmtDate = (iso) =>
    iso
        ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
            new Date(iso)
        )
        : '—';

// ── Status badge ───────────────────────────────────────────────────
const STATUS_MAP = {
    active: { label: 'Đang chạy', cls: 'badge badge--active' },
    inactive: { label: 'Tắt', cls: 'badge badge--inactive' },
    expired: { label: 'Hết hạn', cls: 'badge badge--expired' },
    scheduled: { label: 'Lên lịch', cls: 'badge badge--scheduled' },
};

const TYPE_MAP = {
    flash_sale: { label: '⚡ Flash Sale', cls: 'type-chip type-chip--flash' },
    percentage: { label: '% Giảm', cls: 'type-chip type-chip--pct' },
    fixed_amount: { label: '₫ Cố định', cls: 'type-chip type-chip--fixed' },
    free_shipping: { label: '🚚 Freeship', cls: 'type-chip type-chip--ship' },
};

const Badge = ({ status }) => {
    const cfg = STATUS_MAP[status] ?? { label: status, cls: 'badge badge--inactive' };
    return <span className={cfg.cls}>{cfg.label}</span>;
};

const TypeChip = ({ type }) => {
    const cfg = TYPE_MAP[type] ?? { label: type, cls: 'type-chip' };
    return <span className={cfg.cls}>{cfg.label}</span>;
};

// ── Confirm modal ──────────────────────────────────────────────────
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <div className="modal-overlay">
        <div className="modal">
            <p className="modal__msg">{message}</p>
            <div className="modal__actions">
                <button className="btn btn--ghost" onClick={onCancel}>Huỷ</button>
                <button className="btn btn--danger" onClick={onConfirm}>Xác nhận</button>
            </div>
        </div>
    </div>
);

// ── Empty state ────────────────────────────────────────────────────
const EmptyState = ({ hasFilter }) => (
    <div className="empty-state">
        <span className="empty-state__icon">🏷️</span>
        <p className="empty-state__title">
            {hasFilter ? 'Không tìm thấy promotion nào' : 'Chưa có promotion nào'}
        </p>
        <p className="empty-state__sub">
            {hasFilter
                ? 'Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm'
                : 'Tạo promotion đầu tiên để bắt đầu'}
        </p>
        {!hasFilter && (
            <Link to="/admin/promotions/new" className="btn btn--primary" style={{ marginTop: 16 }}>
                + Tạo mới
            </Link>
        )}
    </div>
);

// ── Main ───────────────────────────────────────────────────────────
const PromotionListPage = () => {
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [confirm, setConfirm] = useState(null); // { message, onConfirm }
    const [cloneLoading, setCloneLoading] = useState(null); // id đang clone

    // ── Fetch ──────────────────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await adminPromotionService.list({
                search: search || undefined,
                type: filterType || undefined,
                status: filterStatus || undefined,
            });
            setItems(res.data?.data ?? res.data ?? []);
        } catch {
            setError('Không thể tải danh sách. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [search, filterType, filterStatus]);

    useEffect(() => { load(); }, [load]);

    // ── Select ─────────────────────────────────────────────────────
    const allIds = items.map((p) => p.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

    const toggleAll = () =>
        setSelectedIds(allSelected ? [] : allIds);

    const toggleOne = (id) =>
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    // ── Bulk action ────────────────────────────────────────────────
    const handleBulkAction = (action) => {
        const labelMap = {
            activate: `Bật ${selectedIds.length} promotion?`,
            deactivate: `Tắt ${selectedIds.length} promotion?`,
            delete: `Xoá vĩnh viễn ${selectedIds.length} promotion? Không thể hoàn tác.`,
        };
        setConfirm({
            message: labelMap[action],
            onConfirm: async () => {
                setConfirm(null);
                setBulkLoading(true);
                try {
                    await adminPromotionService.bulkAction({ action, ids: selectedIds });
                    setSelectedIds([]);
                    await load();
                } catch {
                    setError('Thao tác thất bại. Vui lòng thử lại.');
                } finally {
                    setBulkLoading(false);
                }
            },
        });
    };

    // ── Single delete ──────────────────────────────────────────────
    const handleDelete = (item) => {
        setConfirm({
            message: `Xoá promotion "${item.name}"? Không thể hoàn tác.`,
            onConfirm: async () => {
                setConfirm(null);
                try {
                    await adminPromotionService.remove(item.id);
                    await load();
                } catch {
                    setError('Xoá thất bại. Vui lòng thử lại.');
                }
            },
        });
    };

    // ── Clone ──────────────────────────────────────────────────────
    const handleClone = async (id) => {
        setCloneLoading(id);
        try {
            const res = await adminPromotionService.clone(id);
            const newId = res.data?.data?.id;
            await load();
            if (newId) navigate(`/admin/promotions/${newId}/edit`);
        } catch {
            setError('Clone thất bại. Vui lòng thử lại.');
        } finally {
            setCloneLoading(null);
        }
    };

    const hasFilter = !!(search || filterType || filterStatus);

    return (
        <div className="plist">
            {/* ── Header ── */}
            <div className="plist__header">
                <div>
                    <h1 className="plist__title">Promotions</h1>
                    <p className="plist__sub">Quản lý khuyến mãi &amp; flash sale</p>
                </div>
                <Link to="/admin/promotions/new" className="btn btn--primary">
                    + Tạo mới
                </Link>
            </div>

            {/* ── Filters ── */}
            <div className="plist__filters">
                <div className="search-wrap">
                    <span className="search-wrap__icon">🔍</span>
                    <input
                        className="search-wrap__input"
                        type="text"
                        placeholder="Tìm tên, mã promotion..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="search-wrap__clear" onClick={() => setSearch('')}>✕</button>
                    )}
                </div>

                <select
                    className="filter-select"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="">Tất cả loại</option>
                    <option value="flash_sale">⚡ Flash Sale</option>
                    <option value="percentage">% Giảm</option>
                    <option value="fixed_amount">₫ Cố định</option>
                    <option value="free_shipping">🚚 Freeship</option>
                </select>

                <select
                    className="filter-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang chạy</option>
                    <option value="inactive">Tắt</option>
                    <option value="scheduled">Lên lịch</option>
                    <option value="expired">Hết hạn</option>
                </select>

                {hasFilter && (
                    <button
                        className="btn btn--ghost"
                        onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); }}
                    >
                        Xoá lọc
                    </button>
                )}
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="error-bar">
                    {error}
                    <button className="error-bar__close" onClick={() => setError('')}>✕</button>
                </div>
            )}

            {/* ── Table ── */}
            <div className="plist__table-wrap">
                {loading ? (
                    <div className="loading-rows">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="loading-row" style={{ opacity: 1 - i * 0.15 }} />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState hasFilter={hasFilter} />
                ) : (
                    <table className="ptable">
                        <thead>
                            <tr>
                                <th className="ptable__th ptable__th--check">
                                    <input
                                        type="checkbox"
                                        className="ptable__checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        title="Chọn tất cả"
                                    />
                                </th>
                                <th className="ptable__th">Tên promotion</th>
                                <th className="ptable__th">Loại</th>
                                <th className="ptable__th">Giá trị</th>
                                <th className="ptable__th">Thời gian</th>
                                <th className="ptable__th">Trạng thái</th>
                                <th className="ptable__th ptable__th--action"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr
                                    key={item.id}
                                    className={`ptable__row${selectedIds.includes(item.id) ? ' ptable__row--selected' : ''}`}
                                >
                                    {/* Checkbox */}
                                    <td className="ptable__td ptable__td--check">
                                        <input
                                            type="checkbox"
                                            className="ptable__checkbox"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => toggleOne(item.id)}
                                        />
                                    </td>

                                    {/* Name */}
                                    <td className="ptable__td">
                                        <span className="ptable__name">{item.name}</span>
                                        {item.code && (
                                            <span className="ptable__code">{item.code}</span>
                                        )}
                                    </td>

                                    {/* Type */}
                                    <td className="ptable__td">
                                        <TypeChip type={item.type} />
                                    </td>

                                    {/* Value */}
                                    <td className="ptable__td ptable__td--mono">
                                        {item.type === 'percentage'
                                            ? `${item.value}%`
                                            : item.type === 'fixed_amount'
                                                ? fmt(item.value)
                                                : item.type === 'flash_sale'
                                                    ? <span className="flash-tag">⚡ flash_price</span>
                                                    : '—'}
                                    </td>

                                    {/* Date range */}
                                    <td className="ptable__td ptable__td--date">
                                        <span>{fmtDate(item.starts_at)}</span>
                                        <span className="date-sep">→</span>
                                        <span>{fmtDate(item.ends_at)}</span>
                                    </td>

                                    {/* Status */}
                                    <td className="ptable__td">
                                        <Badge status={item.status} />
                                    </td>

                                    {/* Actions */}
                                    <td className="ptable__td ptable__td--actions">
                                        <div className="row-actions">
                                            <Link
                                                to={`/admin/promotions/${item.id}/stats`}
                                                className="row-btn row-btn--stats"
                                                title="Thống kê"
                                            >
                                                📊
                                            </Link>
                                            <Link
                                                to={`/admin/promotions/${item.id}/edit`}
                                                className="row-btn row-btn--edit"
                                                title="Chỉnh sửa"
                                            >
                                                ✏️
                                            </Link>
                                            <button
                                                className="row-btn row-btn--clone"
                                                title="Clone"
                                                onClick={() => handleClone(item.id)}
                                                disabled={cloneLoading === item.id}
                                            >
                                                {cloneLoading === item.id ? '…' : '⎘'}
                                            </button>
                                            <button
                                                className="row-btn row-btn--delete"
                                                title="Xoá"
                                                onClick={() => handleDelete(item)}
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Bulk bar ── */}
            <BulkActionBar
                selectedIds={selectedIds}
                onClear={() => setSelectedIds([])}
                onAction={handleBulkAction}
                loading={bulkLoading}
            />

            {/* ── Confirm modal ── */}
            {confirm && (
                <ConfirmModal
                    message={confirm.message}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </div>
    );
};

export default PromotionListPage;