import { useState, useEffect, useCallback } from 'react';
import { Input, Select, DatePicker, Space, Button, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import DataTable from '../../../components/admin/DataTable';
import adminOrderService from "../../../services/admin/adminOrderService.js";
import OrderStatusTag from './OrderStatusTag';
import OrderDrawer from './OrderDrawer';
import '../_shared/admin-page.scss';

const { RangePicker } = DatePicker;

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipping', label: 'Đang giao' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã huỷ' },
];

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    // Filter state
    const [filters, setFilters] = useState({ page: 1, per_page: 15, status: '', search: '', date_from: '', date_to: '' });

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
            );
            const res = await adminOrderService.getAll(params);
            setOrders(res.data.data ?? []);
            setMeta(res.data.meta ?? {
                current_page: filters.page,
                per_page: filters.per_page,
                total: 0,
            });
        } catch (error) {
            const status = error?.response?.status;

            if (status === 401) {
                message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (status === 403) {
                message.error('Tài khoản hiện tại không có quyền xem đơn hàng admin.');
            } else if (status === 422) {
                message.error(error?.response?.data?.message || 'Query filter không hợp lệ cho API admin/orders.');
            } else {
                message.error(error?.response?.data?.message || 'Không tải được danh sách đơn hàng.');
            }

            setOrders([]);
            setMeta({
                current_page: filters.page,
                per_page: filters.per_page,
                total: 0,
            });
        } finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const columns = [
        { title: 'Mã đơn', dataIndex: 'id', render: (id) => `#${id}`, width: 90 },
        { title: 'Khách hàng', dataIndex: ['user', 'name'] },
        { title: 'Tổng tiền', dataIndex: 'total', render: (v) => v.toLocaleString('vi-VN') + '₫', width: 130 },
        { title: 'Trạng thái', dataIndex: 'status', render: (s) => <OrderStatusTag status={s} />, width: 140 },
        { title: 'Thanh toán', dataIndex: 'payment_status', width: 110 },
        { title: 'Ngày đặt', dataIndex: 'created_at', render: (d) => dayjs(d).format('DD/MM/YYYY HH:mm'), width: 150 },
        {
            title: 'Hành động', width: 100, render: (_, record) => (
                <Button icon={<EyeOutlined />} size="small" onClick={() => { setSelectedId(record.id); setDrawerOpen(true); }}>
                    Xem
                </Button>
            )
        },
    ];

    return (
        <div className="admin-page">
            <div className="admin-page__breadcrumbs">Home / Admin / Đơn hàng</div>
            <div className="admin-page__toolbar">
                <div>
                    <h2 className="admin-page__title">Đơn hàng</h2>
                    <div className="admin-page__subtitle">Theo dõi trạng thái đơn và xử lý vận hành.</div>
                </div>
            </div>

            {/* Thanh filter */}
            <Space wrap className="admin-page__filters">
                <Input.Search
                    placeholder="Tìm mã đơn, tên khách..."
                    style={{ width: 260 }}
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
                    onChange={(dates) => setFilters(f => ({
                        ...f,
                        date_from: dates?.[0]?.format('YYYY-MM-DD') ?? '',
                        date_to: dates?.[1]?.format('YYYY-MM-DD') ?? '',
                        page: 1,
                    }))}
                    format="DD/MM/YYYY"
                />
            </Space>

            <div className="admin-page__card">
                <DataTable
                    columns={columns}
                    dataSource={Array.isArray(orders) ? orders : []}
                    meta={meta}
                    loading={loading}
                    onChange={(page, pageSize) => setFilters(f => ({ ...f, page, per_page: pageSize }))}
                />
            </div>

            <OrderDrawer
                open={drawerOpen}
                orderId={selectedId}
                onClose={() => { setDrawerOpen(false); setSelectedId(null); }}
                onStatusChanged={fetchOrders}
            />
        </div>
    );
}