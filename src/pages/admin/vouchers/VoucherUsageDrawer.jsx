import { useState, useEffect } from 'react';
import { Drawer, Table } from 'antd';
import dayjs from 'dayjs';
import adminVoucherService from '../../../services/admin/adminVoucherService.js';

export default function VoucherUsageDrawer({ voucherId, open, onClose }) {
    const [usages, setUsages] = useState([]);
    const [loading, setLoading] = useState(false);

    const [hasError, setHasError] = useState(false);



    useEffect(() => {
        if (open && voucherId) {
            setLoading(true);
            adminVoucherService.getUsage(voucherId)
                .then((res) => {
                    const data = res?.data?.data ?? [];
                    setUsages(Array.isArray(data) ? data : []);
                    setHasError(false);
                })
                .catch(() => {
                    setUsages([]);
                    setHasError(true);
                })
                .finally(() => setLoading(false));

        }
    }, [open, voucherId]);

    const columns = [
        { title: 'Khách hàng', dataIndex: ['user', 'name'] },
        { title: 'Mã đơn', dataIndex: 'order_id', render: (id) => `#${id}` },
        { title: 'Giảm', dataIndex: 'discount', render: (v) => v.toLocaleString('vi-VN') + '₫' },
        { title: 'Ngày dùng', dataIndex: 'used_at', render: (d) => dayjs(d).format('DD/MM/YYYY HH:mm') },
    ];

    return (
        <Drawer title="Lịch sử lượt dùng voucher" open={open} onClose={onClose} width={550}>
            <Table columns={columns} dataSource={usages} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} size="small" />
        </Drawer>
    );
}