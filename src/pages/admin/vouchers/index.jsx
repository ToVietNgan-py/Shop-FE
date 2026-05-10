import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Space, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import DataTable from '../../../components/admin/DataTable.jsx';
import adminVoucherService from '../../../services/admin/adminVoucherService.js';

import VoucherModal from './VoucherModal.jsx';
import VoucherUsageDrawer from './VoucherUsageDrawer.jsx';
import '../_shared/admin-page.scss';

export default function VouchersPage() {
    const [loading, setLoading] = useState(true);
    const [vouchers, setVouchers] = useState([]);
    const [meta, setMeta] = useState({});

    const [filters, setFilters] = useState({
        page: 1,
        per_page: 10,
        search: '',
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);

    const [usageDrawerOpen, setUsageDrawerOpen] = useState(false);
    const [usageVoucherId, setUsageVoucherId] = useState(null);

    const normalizeVoucherResponse = (res, fallbackFilters) => {
        const payload = res?.data ?? {};

        // Common Laravel shapes:
        // 1) { data: [...], meta: {...} }
        // 2) { data: { data: [...], meta: {...} } }
        const nestedData = payload?.data;
        const items = Array.isArray(nestedData)
            ? nestedData
            : Array.isArray(nestedData?.data)
                ? nestedData.data
                : Array.isArray(payload)
                    ? payload
                    : [];

        const rawMeta = nestedData?.meta ?? payload?.meta ?? {};

        const meta = {
            current_page: rawMeta?.current_page ?? fallbackFilters.page,
            per_page: rawMeta?.per_page ?? fallbackFilters.per_page,
            total: rawMeta?.total ?? items.length,
        };

        return { items, meta };
    };

    const fetchVouchers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                // API có thể cần tên khác; tuy nhiên adminVoucherService.getAll nhận params chung
            };
            const res = await adminVoucherService.getAll(params);
            const { items, meta: nextMeta } = normalizeVoucherResponse(res, filters);

            setVouchers(items);
            setMeta(nextMeta);
        } catch (error) {
            const status = error?.response?.status;

            if (status === 401) {
                message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (status === 403) {
                message.error('Tài khoản hiện tại không có quyền xem vouchers admin.');
            } else if (status === 404) {
                message.error('API admin vouchers chưa sẵn sàng trên backend của máy bạn.');
            } else {
                message.error(error?.response?.data?.message || 'Không tải được danh sách voucher từ API.');
            }

            // Giữ UI ổn định khi lỗi
            setVouchers([]);
            setMeta({
                current_page: filters.page,
                per_page: filters.per_page,
                total: 0,
            });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchVouchers();
    }, [fetchVouchers]);

    const columns = useMemo(() => {
        return [
            {
                title: 'Mã voucher',
                dataIndex: 'code',
                render: (code, record) => (
                    <Space direction="vertical" size={0}>
                        <Typography.Text strong>{code}</Typography.Text>
                        <Typography.Text type="secondary">ID: {record?.id}</Typography.Text>
                    </Space>
                ),
            },
            {
                title: 'Mô tả',
                dataIndex: 'description',
                render: (desc) => desc ?? '-',
            },
            {
                title: 'Loại',
                dataIndex: 'type',
                render: (type) => (type === 'percent' ? 'Phần trăm' : type === 'amount' ? 'Số tiền' : type),
            },
            {
                title: 'Giá trị',
                dataIndex: 'value',
                render: (v) => (typeof v === 'number' ? v.toLocaleString('vi-VN') : v),
            },
            {
                title: 'Hạn sử dụng',
                dataIndex: 'expires_at',
                render: (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-'),
            },
            {
                title: 'Trạng thái',
                dataIndex: 'is_active',
                render: (active) => (active ? 'Đang hoạt động' : 'Tạm khóa'),
            },
            {
                title: 'Hành động',
                key: 'actions',
                render: (_, record) => (
                    <Space>
                        <Button
                            size="small"
                            onClick={() => {
                                setSelectedVoucher(record);
                                setModalOpen(true);
                            }}
                        >
                            Sửa
                        </Button>
                        <Button
                            size="small"
                            onClick={() => {
                                setUsageVoucherId(record.id);
                                setUsageDrawerOpen(true);
                            }}
                        >
                            Usage
                        </Button>
                    </Space>
                ),
            },
        ];
    }, []);

    return (
        <>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Input.Search
                            placeholder="Tìm mã voucher..."
                            allowClear
                            style={{ maxWidth: 360 }}
                            value={filters.search}
                            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
                        />

                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setSelectedVoucher(null);
                                setModalOpen(true);
                            }}
                        >
                            Tạo voucher
                        </Button>
                    </Space>
                </div>

            </div>

            <div className="admin-page__card">
                <DataTable
                    columns={columns}
                    dataSource={vouchers}
                    meta={meta}
                    loading={loading}
                    onChange={(page, pageSize) => {
                        setFilters((f) => ({
                            ...f,
                            page,
                            per_page: pageSize,
                        }));
                    }}
                />
            </div>

            <VoucherModal
                open={modalOpen}
                voucher={selectedVoucher}
                onClose={() => setModalOpen(false)}
                onSuccess={() => {
                    setModalOpen(false);
                    fetchVouchers();
                }}
            />

            <VoucherUsageDrawer
                open={usageDrawerOpen}
                voucherId={usageVoucherId}
                onClose={() => {
                    setUsageDrawerOpen(false);
                    setUsageVoucherId(null);
                }}
            />
        </>

    );
}

