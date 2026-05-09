import { useState, useEffect } from 'react';
import { Drawer, Descriptions, Select, Button, Table, Tag, Timeline, Space, message } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import adminOrderService from "../../../services/admin/adminOrderService.js";
import OrderStatusTag from './OrderStatusTag';

const NEXT_STATUS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipping', 'cancelled'],
    shipping: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

export default function OrderDrawer({ open, orderId, onClose, onStatusChanged }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (open && orderId) {
            setLoading(true);
            adminOrderService.getById(orderId)
                .then(res => setOrder(res.data.data))
                .finally(() => setLoading(false));
        }
    }, [open, orderId]);

    const handleStatusChange = async (newStatus) => {
        setUpdating(true);
        try {
            await adminOrderService.updateStatus(orderId, newStatus);
            message.success('Đã cập nhật trạng thái đơn hàng');
            setOrder(prev => ({ ...prev, status: newStatus }));
            onStatusChanged?.();
        } catch {
            message.error('Cập nhật thất bại, thử lại sau');
        } finally { setUpdating(false); }
    };

    const handlePrint = () => window.print();

    const itemColumns = [
        { title: 'Sản phẩm', dataIndex: ['product', 'name'] },
        { title: 'SL', dataIndex: 'quantity', width: 60 },
        { title: 'Đơn giá', dataIndex: 'price', render: (v) => v.toLocaleString('vi-VN') + '₫' },
        { title: 'Thành tiền', render: (_, r) => (r.price * r.quantity).toLocaleString('vi-VN') + '₫' },
    ];

    return (
        <Drawer
            title={`Chi tiết đơn hàng #${orderId}`}
            open={open}
            onClose={onClose}
            width={700}
            loading={loading}
            extra={
                <Button icon={<PrinterOutlined />} onClick={handlePrint}>In hóa đơn</Button>
            }
        >
            {order && (
                <>
                    <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="Khách hàng">{order.user?.name}</Descriptions.Item>
                        <Descriptions.Item label="SĐT">{order.phone}</Descriptions.Item>
                        <Descriptions.Item label="Email">{order.user?.email}</Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ" span={2}>{order.address}</Descriptions.Item>
                        <Descriptions.Item label="Thanh toán">{order.payment_method}</Descriptions.Item>
                        <Descriptions.Item label="TT Thanh toán">{order.payment_status}</Descriptions.Item>
                        <Descriptions.Item label="Tổng tiền">{order.total?.toLocaleString('vi-VN')}₫</Descriptions.Item>
                        <Descriptions.Item label="Ghi chú">{order.note || '—'}</Descriptions.Item>
                    </Descriptions>

                    {/* Đổi trạng thái */}
                    {NEXT_STATUS[order.status]?.length > 0 && (
                        <Space style={{ marginBottom: 16 }}>
                            <span style={{ fontSize: 13 }}>Chuyển sang:</span>
                            {NEXT_STATUS[order.status].map(s => (
                                <Button
                                    key={s}
                                    size="small"
                                    loading={updating}
                                    onClick={() => handleStatusChange(s)}
                                    danger={s === 'cancelled'}
                                >
                                    {s === 'confirmed' ? 'Xác nhận' : s === 'shipping' ? 'Giao hàng' : s === 'completed' ? 'Hoàn thành' : 'Huỷ đơn'}
                                </Button>
                            ))}
                        </Space>
                    )}

                    {/* Bảng sản phẩm */}
                    <Table
                        columns={itemColumns}
                        dataSource={order.order_details}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        style={{ marginBottom: 16 }}
                    />

                    {/* Lịch sử trạng thái */}
                    {order.status_logs?.length > 0 && (
                        <>
                            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Lịch sử trạng thái</div>
                            <Timeline
                                items={order.status_logs.map(log => ({
                                    color: 'purple',
                                    children: `${log.status} — ${log.created_at}`,
                                }))}
                            />
                        </>
                    )}
                </>
            )}
        </Drawer>
    );
}