import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import DataTable from '../../../components/admin/DataTable.jsx';
import adminVoucherService from '../../../services/admin/adminVoucherService.js';

import VoucherModal from './VoucherModal.jsx';
import VoucherUsageDrawer from './VoucherUsageDrawer.jsx';

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

    const fetchVouchers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                // API có thể cần tên khác; tuy nhiên adminVoucherService.getAll nhận params chung
            };
            const res = await adminVoucherService.getAll(params);
            setVouchers(res?.data?.data ?? []);
            setMeta(res?.data?.meta ?? {});
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

            <DataTable
                columns={columns}
                dataSource={vouchers}
                meta={meta}
                loading={loading}
                tableProps={{
                    rowKey: 'id',
                    onChange: (pagination) => {
                        setFilters((f) => ({
                            ...f,
                            page: pagination?.current ?? 1,
                            per_page: pagination?.pageSize ?? f.per_page,
                        }));
                    },
                    pagination: {
                        current: meta?.current_page ?? filters.page,
                        pageSize: meta?.per_page ?? filters.per_page,
                        total: meta?.total ?? 0,
                        showSizeChanger: true,
                    },
                }}
            />

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
        </div>
    );
}

