import { useState, useEffect } from 'react';
import { Drawer, Button, Table, Timeline, Space, message } from 'antd';
import { PrinterOutlined, UserOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, CreditCardOutlined, FileTextOutlined } from '@ant-design/icons';
import adminOrderService from "../../../services/admin/adminOrderService.js";
import OrderStatusTag from './OrderStatusTag';

const NEXT_STATUS = {
    Pending: ['Processing', 'Cancelled'],
    Processing: ['Shipping', 'Cancelled'],
    Shipping: ['Completed', 'Cancelled'],
    Completed: [],
    Cancelled: [],
};

const STATUS_LABEL = {
    Processing: 'Xác nhận',
    Shipping: 'Giao hàng',
    Completed: 'Hoàn thành',
    Cancelled: 'Huỷ đơn',
};
const PAYMENT_METHOD_LABEL = {
    vnpay: 'VNPay',
    cod: 'Tiền mặt (COD)',
    momo: 'MoMo',
};

const PAYMENT_STATUS_COLOR = {
    paid: { color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f', label: 'Đã thanh toán' },
    unpaid: { color: '#cf1322', bg: '#fff2f0', border: '#ffccc7', label: 'Chưa thanh toán' },
    pending: { color: '#d46b08', bg: '#fffbe6', border: '#ffe58f', label: 'Chờ thanh toán' },
};

const infoStyle = {
    row: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 12,
    },
    icon: {
        color: '#7c3aed',
        fontSize: 15,
        marginTop: 2,
        flexShrink: 0,
    },
    label: {
        fontSize: 11,
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: 2,
    },
    value: {
        fontSize: 13,
        color: '#111827',
        fontWeight: 500,
    },
};

function InfoRow({ icon, label, value }) {
    return (
        <div style={infoStyle.row}>
            <span style={infoStyle.icon}>{icon}</span>
            <div>
                <div style={infoStyle.label}>{label}</div>
                <div style={infoStyle.value}>{value || '—'}</div>
            </div>
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#7c3aed',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
        }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #7c3aed 0%, transparent 100%)', opacity: 0.3 }} />
            {children}
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(270deg, #7c3aed 0%, transparent 100%)', opacity: 0.3 }} />
        </div>
    );
}

export default function OrderDrawer({ open, orderId, orderData, onClose, onStatusChanged }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (open && orderId) {
            setLoading(true);
            adminOrderService.getById(orderId)
                .then(res => {
                    const detail = res.data.data;
                    setOrder({
                        ...detail,
                        details: orderData?.details ?? [],
                    });
                })
                .finally(() => setLoading(false));
        }
        if (!open) setOrder(null);
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

    const paymentInfo = PAYMENT_STATUS_COLOR[order?.payment_status]
        ?? { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', label: order?.payment_status };

    const itemColumns = [
        {
            title: 'Sản phẩm',
            dataIndex: ['product', 'name'],
            render: (name) => <span style={{ color: '#111827', fontWeight: 500 }}>{name}</span>,
        },
        {
            title: 'SL',
            dataIndex: 'quantity',
            width: 50,
            align: 'center',
            render: (v) => <span style={{ color: '#7c3aed', fontWeight: 600 }}>{v}</span>,
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            width: 110,
            align: 'right',
            render: (v) => <span style={{ color: '#6b7280' }}>{Number(v).toLocaleString('vi-VN')}₫</span>,
        },
        {
            title: 'Thành tiền',
            width: 120,
            align: 'right',
            render: (_, r) => (
                <span style={{ color: '#111827', fontWeight: 600 }}>
                    {(Number(r.price) * r.quantity).toLocaleString('vi-VN')}₫
                </span>
            ),
        },
    ];

    const drawerStyles = {
        header: { background: '#ffffff', borderBottom: '1px solid #e5e7eb' },
        body: { background: '#f9fafb', padding: '20px 24px' },
        mask: { backdropFilter: 'blur(2px)' },
    };

    const card = {
        background: '#ffffff',
        borderRadius: 10,
        padding: '16px 20px',
        border: '1px solid #e5e7eb',
    };

    return (
        <Drawer
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#111827', fontWeight: 700, fontSize: 15 }}>Đơn hàng</span>
                    <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: 15 }}>#{orderId}</span>
                    {order && <OrderStatusTag status={order.status} />}
                </div>
            }
            open={open}
            onClose={onClose}
            width={680}
            loading={loading}
            styles={drawerStyles}
            extra={
                <Button
                    icon={<PrinterOutlined />}
                    onClick={handlePrint}
                    style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                >
                    In hóa đơn
                </Button>
            }
        >
            {order && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Thông tin khách hàng */}
                    <div style={card}>
                        <SectionTitle>Thông tin khách hàng</SectionTitle>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                            <InfoRow icon={<UserOutlined />} label="Họ tên" value={order.full_name} />
                            <InfoRow icon={<PhoneOutlined />} label="SĐT" value={order.phone_number} />
                            <InfoRow icon={<MailOutlined />} label="Email" value={order.email} />
                            <InfoRow icon={<EnvironmentOutlined />} label="Địa chỉ" value={order.address} />
                        </div>
                    </div>

                    {/* Thanh toán */}
                    <div style={card}>
                        <SectionTitle>Thanh toán</SectionTitle>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', alignItems: 'center' }}>
                            <InfoRow
                                icon={<CreditCardOutlined />}
                                label="Phương thức"
                                value={PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method}
                            />
                            <div style={infoStyle.row}>
                                <span style={{ ...infoStyle.icon, marginTop: 2 }}>💳</span>
                                <div>
                                    <div style={infoStyle.label}>Trạng thái</div>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '2px 10px',
                                        borderRadius: 20,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: paymentInfo.color,
                                        background: paymentInfo.bg,
                                        border: `1px solid ${paymentInfo.border}`,
                                    }}>
                                        {paymentInfo.label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Summary tiền */}
                        <div style={{ marginTop: 8, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
                            {[
                                { label: 'Tạm tính', value: order.subtotal },
                                { label: 'Phí ship', value: order.shipping_fee },
                                { label: 'Giảm giá', value: order.discount, prefix: '-' },
                            ].map(({ label, value, prefix }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ color: '#9ca3af', fontSize: 13 }}>{label}</span>
                                    <span style={{ color: '#374151', fontSize: 13 }}>
                                        {prefix}{Number(value).toLocaleString('vi-VN')}₫
                                    </span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                                <span style={{ color: '#111827', fontWeight: 700, fontSize: 14 }}>Tổng cộng</span>
                                <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: 16 }}>
                                    {Number(order.total).toLocaleString('vi-VN')}₫
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action đổi trạng thái */}
                    {NEXT_STATUS[order.status]?.length > 0 && (
                        <div style={card}>
                            <SectionTitle>Cập nhật trạng thái</SectionTitle>
                            <Space wrap>
                                {NEXT_STATUS[order.status].map(s => (
                                    <Button
                                        key={s}
                                        loading={updating}
                                        onClick={() => handleStatusChange(s)}
                                        danger={s === 'Cancelled'}
                                        type={s === 'Cancelled' ? 'default' : 'primary'}
                                        style={s !== 'Cancelled' ? {
                                            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                                            border: 'none',
                                            fontWeight: 600,
                                        } : { fontWeight: 600 }}
                                    >
                                        {STATUS_LABEL[s]}
                                    </Button>
                                ))}
                            </Space>
                        </div>
                    )}

                    {/* Bảng sản phẩm */}
                    <div style={card}>
                        <SectionTitle>Sản phẩm đặt hàng</SectionTitle>
                        <Table
                            columns={itemColumns}
                            dataSource={order.details ?? []}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            style={{ background: 'transparent' }}
                        />
                    </div>

                    {/* Ghi chú */}
                    {order.note && (
                        <div style={card}>
                            <SectionTitle>Ghi chú</SectionTitle>
                            <div style={{ color: '#6b7280', fontSize: 13, fontStyle: 'italic' }}>
                                <FileTextOutlined style={{ marginRight: 8, color: '#7c3aed' }} />
                                {order.note}
                            </div>
                        </div>
                    )}

                    {/* Lịch sử trạng thái */}
                    {order.status_logs?.length > 0 && (
                        <div style={card}>
                            <SectionTitle>Lịch sử trạng thái</SectionTitle>
                            <Timeline
                                items={order.status_logs.map(log => ({
                                    color: '#7c3aed',
                                    children: (
                                        <div>
                                            <span style={{ color: '#111827', fontWeight: 600, fontSize: 13 }}>{log.status}</span>
                                            <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 8 }}>{log.created_at}</span>
                                        </div>
                                    ),
                                }))}
                            />
                        </div>
                    )}

                </div>
            )}
        </Drawer>
    );
}