import { useEffect, useState } from 'react';
import { Modal, Descriptions, Tag, Badge, Avatar, Spin, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import adminUserService from '../../../services/admin/adminUserService.js';

const ROLE_COLORS = {
    admin: 'purple',
    employee: 'blue',
    customer: 'green',
};

const ROLE_LABELS = {
    admin: 'Admin',
    employee: 'Nhân viên',
    customer: 'Khách hàng',
};

/**
 * ViewAccountModal
 * GET /api/admin/users/{id}  — chi tiết một user
 */
export default function ViewAccountModal({ open, userId, onClose }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && userId) {
            setLoading(true);
            adminUserService.getById(userId)
                .then(res => setUser(res.data.data ?? res.data))
                .catch(() => setUser(null))
                .finally(() => setLoading(false));
        }
    }, [open, userId]);

    return (
        <Modal
            title="Chi tiết tài khoản"
            open={open}
            onCancel={onClose}
            footer={null}
            width={560}
            afterClose={() => setUser(null)}
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin />
                </div>
            ) : user ? (
                <Space direction="vertical" style={{ width: '100%', marginTop: 16 }} size={20}>
                    {/* Avatar header */}
                    <Space align="center" size={16}>
                        <Avatar
                            size={56}
                            icon={<UserOutlined />}
                            style={{ background: '#6366f1', flexShrink: 0 }}
                        >
                            {user.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</div>
                            <div style={{ color: '#888', fontSize: 13 }}>{user.email}</div>
                        </div>
                    </Space>

                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="ID">{user.id}</Descriptions.Item>
                        <Descriptions.Item label="Họ tên">{user.name}</Descriptions.Item>
                        <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">{user.phone || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Role">
                            <Tag color={ROLE_COLORS[user.role] || 'default'}>
                                {ROLE_LABELS[user.role] || user.role}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            {user.locked_at
                                ? <Badge status="error" text={`Đã khoá lúc ${dayjs(user.locked_at).format('DD/MM/YYYY HH:mm')}`} />
                                : <Badge status="success" text="Đang hoạt động" />
                            }
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {dayjs(user.created_at).format('DD/MM/YYYY HH:mm')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Cập nhật lần cuối">
                            {dayjs(user.updated_at).format('DD/MM/YYYY HH:mm')}
                        </Descriptions.Item>
                        {user.deleted_at && (
                            <Descriptions.Item label="Đã xoá lúc">
                                <Tag color="red">{dayjs(user.deleted_at).format('DD/MM/YYYY HH:mm')}</Tag>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </Space>
            ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                    Không tìm thấy thông tin tài khoản.
                </div>
            )}
        </Modal>
    );
}