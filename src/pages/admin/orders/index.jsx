
import { useState, useEffect, useCallback } from 'react';
import { Input, Select, DatePicker, Space, Button, message, Tag, Tooltip, Popconfirm } from 'antd';
import { EyeOutlined, CheckCircleOutlined, CarOutlined, TrophyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import DataTable from '../../../components/admin/DataTable';
import adminOrderService from "../../../services/admin/adminOrderService.js";
import OrderStatusTag from './OrderStatusTag';
import OrderDrawer from './OrderDrawer';
import '../_shared/admin-page.scss';

const { RangePicker } = DatePicker;

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'Pending', label: 'Chờ xác nhận' },
    { value: 'Processing', label: 'Đã xác nhận' },
    { value: 'Delivering', label: 'Đang giao' },
    { value: 'Completed', label: 'Hoàn thành' },
    { value: 'Cancelled', label: 'Đã huỷ' },
];

// Config nút action theo từng trạng thái
const STATUS_ACTIONS = {
    Pending: {
        next: 'Processing',
        label: 'Xác nhận đơn',
        icon: <CheckCircleOutlined />,
        color: '#7c3aed',
        confirmTitle: 'Xác nhận đơn hàng này?',
    },
    Processing: {
        next: 'Delivering',
        label: 'Đã giao',
        icon: <CarOutlined />,
        color: '#0ea5e9',
        confirmTitle: 'Xác nhận đã bàn giao cho đơn vị vận chuyển?',
    },
    Delivering: {
        next: 'Completed',
        label: 'Giao thành công',
        icon: <TrophyOutlined />,
        color: '#16a34a',
        confirmTitle: 'Xác nhận khách đã nhận hàng thành công?',
    },
};

export default function AdminOrders() {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [allOrders, setAllOrders] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [dateRange, setDateRange] = useState(null);

    const [filters, setFilters] = useState({
        page: 1, per_page: 15,
        status: '', search: '',
        date_from: '', date_to: '',
    });

    // ── 1. Fetch TOÀN BỘ đơn hàng về frontend để filter ───────────────────
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            // Lấy trang đầu để biết total pages
            const first = await adminOrderService.getAll({ page: 1 });
            const pagination = first.data.data;
            const lastPage = pagination.last_page ?? 1;
            let allData = [...(pagination.data ?? [])];

            // Nếu còn trang sau thì fetch song song
            if (lastPage > 1) {
                const rest = await Promise.all(
                    Array.from({ length: lastPage - 1 }, (_, i) =>
                        adminOrderService.getAll({ page: i + 2 })
                    )
                );
                rest.forEach((r) => {
                    allData = allData.concat(r.data.data.data ?? []);
                });
            }

            setAllOrders(allData);
        } catch (error) {
            const status = error?.response?.status;
            if (status === 401) message.error('Phiên đăng nhập đã hết hạn.');
            else if (status === 403) message.error('Không có quyền xem đơn hàng.');
            else message.error('Không tải được danh sách đơn hàng.');
            setAllOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // ── 2. Filter hoàn toàn ở frontend ──────────────────────────────────────
    useEffect(() => {
        let result = [...allOrders];

        // Filter status — so sánh không phân biệt hoa thường
        if (filters.status) {
            result = result.filter((o) =>
                (o.Status ?? o.status ?? '').toLowerCase() === filters.status.toLowerCase()
            );
        }

        // Filter search — mã đơn hoặc tên khách
        if (filters.search) {
            const keyword = filters.search.toLowerCase();
            result = result.filter((o) =>
                String(o.id).includes(keyword) ||
                (o.FullName ?? '').toLowerCase().includes(keyword)
            );
        }

        // Filter ngày đặt hàng (created_at)
        if (filters.date_from) {
            const from = dayjs(filters.date_from).startOf('day');
            const to = filters.date_to
                ? dayjs(filters.date_to).endOf('day')
                : dayjs(filters.date_from).endOf('day');

            result = result.filter((o) => {
                const created = dayjs(o.created_at);
                return (created.isAfter(from) || created.isSame(from)) &&
                    (created.isBefore(to) || created.isSame(to));
            });
        }

        setOrders(result);
    }, [allOrders, filters.status, filters.search, filters.date_from, filters.date_to]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleDateChange = (dates) => {
        setDateRange(dates);
        setFilters(f => ({
            ...f, page: 1,
            date_from: dates?.[0] ? dates[0].format('YYYY-MM-DD') : '',
            date_to: dates?.[1] ? dates[1].format('YYYY-MM-DD') : '',
        }));
    };

    const handleReset = () => {
        setDateRange(null);
        setFilters({ page: 1, per_page: 15, status: '', search: '', date_from: '', date_to: '' });
    };

    const hasFilter = filters.status || filters.search || filters.date_from;

    const handleUpdateStatus = useCallback(async (orderId, nextStatus) => {
        setUpdatingId(orderId);
        try {
            await adminOrderService.updateStatus(orderId, nextStatus);
            const labelMap = { Processing: 'Đã xác nhận', Delivering: 'Đã giao', Completed: 'Giao thành công' };
            message.success(`Đơn #${orderId}: ${labelMap[nextStatus] ?? nextStatus}`);
            fetchOrders();
        } catch (err) {
            const msg = err?.response?.data?.message;
            message.error(msg || 'Cập nhật thất bại, thử lại sau');
        } finally {
            setUpdatingId(null);
        }
    }, [fetchOrders]);

    // ── Columns ──────────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'id',
            render: (id) => `#${id}`,
            width: 90,
        },
        {
            title: 'Khách hàng',
            dataIndex: 'FullName',
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'total',
            render: (v) => `${Number(v).toLocaleString('vi-VN')}₫`,
            width: 130,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'Status',
            render: (s) => <OrderStatusTag status={s} />,
            width: 140,
        },
        {
            title: 'Thanh toán',
            dataIndex: 'payment_status',
            width: 140,
            render: (v) => {
                const map = {
                    paid: { color: 'green', label: 'Đã thanh toán' },
                    pending: { color: 'gold', label: 'Chờ thanh toán' },
                    failed: { color: 'red', label: 'Thất bại' },
                };
                const { color, label } = map[v] || { color: 'default', label: v };
                return <Tag color={color}>{label}</Tag>;
            },
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'created_at',
            render: (d) => dayjs(d).format('DD/MM/YYYY HH:mm'),
            width: 150,
        },
        {
            title: 'Hành động',
            width: 200,
            render: (_, record) => {
                const action = STATUS_ACTIONS[record.Status];
                const isUpdating = updatingId === record.id;
                return (
                    <Space size={4}>
                        {action && (
                            <Tooltip title={action.confirmTitle}>
                                <Popconfirm
                                    title={action.confirmTitle}
                                    okText="Xác nhận"
                                    cancelText="Huỷ"
                                    onConfirm={() => handleUpdateStatus(record.id, action.next)}
                                    disabled={isUpdating}
                                >
                                    <Button
                                        size="small"
                                        type="primary"
                                        icon={action.icon}
                                        loading={isUpdating}
                                        style={{
                                            background: action.color,
                                            borderColor: action.color,
                                            fontWeight: 600,
                                            fontSize: 12,
                                        }}
                                    >
                                        {action.label}
                                    </Button>
                                </Popconfirm>
                            </Tooltip>
                        )}
                        <Tooltip title="Xem chi tiết">
                            <Button
                                icon={<EyeOutlined />}
                                size="small"
                                onClick={() => {
                                    setSelectedId(record.id);
                                    setSelectedOrder(record);
                                    setDrawerOpen(true);
                                }}
                            />
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];

    return (
        <div className="admin-page">
            <div className="admin-page__toolbar">
                <div>
                    <h2 className="admin-page__title">Đơn hàng</h2>
                    <div className="admin-page__subtitle">Theo dõi trạng thái đơn và xử lý vận hành.</div>
                </div>
            </div>

            <Space wrap className="admin-page__filters">
                <Input.Search
                    placeholder="Tìm mã đơn, tên khách..."
                    style={{ width: 260 }}
                    value={filters.search}
                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                    onSearch={(v) => setFilters(f => ({ ...f, search: v, page: 1 }))}
                    allowClear
                />
                <Select
                    options={STATUS_OPTIONS}
                    value={filters.status}
                    onChange={(v) => setFilters(f => ({ ...f, status: v, page: 1 }))}
                    style={{ width: 180 }}
                />
                <RangePicker
                    value={dateRange}
                    onChange={handleDateChange}
                    format="DD/MM/YYYY"
                    placeholder={['Từ ngày', 'Đến ngày']}
                    allowClear
                />
                {hasFilter && (
                    <Button onClick={handleReset}>Xoá bộ lọc</Button>
                )}
            </Space>

            <div className="admin-page__card">
                <DataTable
                    columns={columns}
                    dataSource={orders}
                    meta={{ current_page: filters.page, per_page: filters.per_page, total: orders.length }}
                    loading={loading}
                    onChange={(page, pageSize) => setFilters(f => ({ ...f, page, per_page: pageSize }))}
                />
            </div>

            <OrderDrawer
                open={drawerOpen}
                orderId={selectedId}
                orderData={selectedOrder}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedOrder(null);
                    setSelectedId(null);
                }}
                onStatusChanged={fetchOrders}
            />
        </div>
    );
}