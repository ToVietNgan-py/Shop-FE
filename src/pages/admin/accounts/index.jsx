import { useState, useEffect, useCallback } from 'react';
import {
    Button, Input, Select, Space, Tag, Popconfirm,
    notification, Tooltip, Badge, Avatar
} from 'antd';
import {
    PlusOutlined, LockOutlined, UnlockOutlined,
    EyeOutlined, EditOutlined, DeleteOutlined, UserOutlined,
    CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import DataTable from '../../../components/admin/DataTable';
import adminUserService from '../../../services/admin/adminUserService.js';
import AccountModal from './AccountModal';
import EditAccountModal from './EditAccountModal';
import ViewAccountModal from './ViewAccountModal';
import '../_shared/admin-page.scss';

const ROLE_OPTIONS = [
    { value: '', label: 'Tất cả role' },
    { value: 'admin', label: 'Admin' },
    { value: 'employee', label: 'Nhân viên' },
    { value: 'customer', label: 'Khách hàng' },
];

const ROLE_COLORS = {
    admin: 'purple',
    employee: 'blue',
    customer: 'green',
};

export default function AdminAccounts() {
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ page: 1, per_page: 15, role: '', search: '' });

    const [createOpen, setCreateOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [viewUser, setViewUser] = useState(null);

    // ── useNotification hook — hoạt động đúng trong Ant Design v5 ───────────
    const [api, contextHolder] = notification.useNotification({
        placement: 'topRight',
    });

    const notify = {
        success: (title, desc) => api.success({
            message: <strong>{title}</strong>,
            description: desc,
            duration: 3,
            icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
            style: { borderLeft: '4px solid #52c41a' },
        }),
        error: (title, desc) => api.error({
            message: <strong>{title}</strong>,
            description: desc,
            duration: 4,
            icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} />,
            style: { borderLeft: '4px solid #ff4d4f' },
        }),
        warning: (title, desc) => api.warning({
            message: <strong>{title}</strong>,
            description: desc,
            duration: 4,
            icon: <ExclamationCircleFilled style={{ color: '#faad14' }} />,
            style: { borderLeft: '4px solid #faad14' },
        }),
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminUserService.getAll(filters);
            setUsers(res.data.data);
            setMeta(res.data.meta);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // ── Lock / Unlock ────────────────────────────────────────────────────────
    const handleLockToggle = async (user) => {
        try {
            if (user.locked_at) {
                await adminUserService.unlock(user.id);
                notify.success(
                    'Mở khoá thành công',
                    `Tài khoản "${user.name}" đã được mở khoá và có thể đăng nhập trở lại.`
                );
            } else {
                await adminUserService.lock(user.id);
                notify.warning(
                    'Đã khoá tài khoản',
                    `Tài khoản "${user.name}" bị khoá. Người dùng sẽ không thể đăng nhập.`
                );
            }
            fetchUsers();
        } catch {
            notify.error('Thao tác thất bại', 'Không thể khoá / mở khoá tài khoản. Vui lòng thử lại.');
        }
    };

    // ── Soft delete ──────────────────────────────────────────────────────────
    const handleDelete = async (user) => {
        try {
            await adminUserService.delete(user.id);
            notify.success(
                'Xoá tài khoản thành công',
                `Tài khoản "${user.name}" đã được xoá khỏi hệ thống.`
            );
            fetchUsers();
        } catch (err) {
            const msg = err.response?.data?.message;
            notify.error('Xoá thất bại', msg || 'Không thể xoá tài khoản này.');
        }
    };

    // ── Role change ──────────────────────────────────────────────────────────
    const handleRoleChange = async (userId, newRole, userName) => {
        try {
            await adminUserService.updateRole(userId, newRole);
            const roleLabel = ROLE_OPTIONS.find(o => o.value === newRole)?.label || newRole;
            notify.success(
                'Cập nhật role thành công',
                `"${userName}" đã được chuyển sang role "${roleLabel}".`
            );
            fetchUsers();
        } catch {
            notify.error('Đổi role thất bại', 'Không thể cập nhật role. Vui lòng thử lại.');
        }
    };

    const columns = [
        {
            title: 'Người dùng',
            render: (_, r) => (
                <Space>
                    <Avatar size={32} icon={<UserOutlined />} style={{ background: '#6366f1' }}>
                        {r.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{r.email}</div>
                    </div>
                </Space>
            ),
        },
        { title: 'SĐT', dataIndex: 'phone', width: 130 },
        {
            title: 'Role', dataIndex: 'role', width: 150,
            render: (role, record) => (
                <Select
                    value={role}
                    size="small"
                    style={{ width: 130 }}
                    onChange={(v) => handleRoleChange(record.id, v, record.name)}
                    options={ROLE_OPTIONS.filter(o => o.value !== '')}
                    optionRender={(opt) => (
                        <Tag color={ROLE_COLORS[opt.value] || 'default'}>{opt.label}</Tag>
                    )}
                />
            ),
        },
        {
            title: 'Trạng thái', width: 120,
            render: (_, r) => r.locked_at
                ? <Badge status="error" text="Đã khoá" />
                : <Badge status="success" text="Hoạt động" />,
        },
        {
            title: 'Ngày tạo', dataIndex: 'created_at',
            render: (d) => dayjs(d).format('DD/MM/YYYY'),
            width: 110,
        },
        {
            title: 'Hành động', width: 150, align: 'center',
            render: (_, record) => (
                <Space size={4}>
                    <Tooltip title="Xem chi tiết">
                        <Button size="small" icon={<EyeOutlined />} onClick={() => setViewUser(record)} />
                    </Tooltip>

                    <Tooltip title="Chỉnh sửa thông tin">
                        <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => setEditUser(record)} />
                    </Tooltip>

                    <Tooltip title={record.locked_at ? 'Mở khoá' : 'Khoá tài khoản'}>
                        <Popconfirm
                            title={record.locked_at
                                ? `Mở khoá tài khoản "${record.name}"?`
                                : `Khoá tài khoản "${record.name}"?`}
                            onConfirm={() => handleLockToggle(record)}
                            okText="Xác nhận" cancelText="Huỷ"
                        >
                            <Button
                                size="small"
                                danger={!record.locked_at}
                                icon={record.locked_at ? <UnlockOutlined /> : <LockOutlined />}
                            />
                        </Popconfirm>
                    </Tooltip>

                    <Tooltip title="Xoá tài khoản">
                        <Popconfirm
                            title={`Xoá tài khoản "${record.name}"?`}
                            description="Hành động này không thể hoàn tác."
                            onConfirm={() => handleDelete(record)}
                            okText="Xoá" okButtonProps={{ danger: true }} cancelText="Huỷ"
                        >
                            <Button size="small" danger type="primary" icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <>
            {/* contextHolder PHẢI nằm trong JSX để notification render đúng */}
            {contextHolder}

            <div className="admin-page">
                <div className="admin-page__toolbar">
                    <div>
                        <h2 className="admin-page__title">Tài khoản</h2>
                        <div className="admin-page__subtitle">Phân quyền và khóa/mở khóa tài khoản hệ thống.</div>
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                        Tạo nhân viên
                    </Button>
                </div>

                <Space wrap className="admin-page__filters">
                    <Input.Search
                        placeholder="Tìm tên, email..."
                        style={{ width: 260 }}
                        onSearch={(v) => setFilters(f => ({ ...f, search: v, page: 1 }))}
                        allowClear
                    />
                    <Select
                        options={ROLE_OPTIONS}
                        value={filters.role}
                        onChange={(v) => setFilters(f => ({ ...f, role: v, page: 1 }))}
                        style={{ width: 160 }}
                    />
                </Space>

                <div className="admin-page__card">
                    <DataTable
                        columns={columns}
                        dataSource={users}
                        meta={meta}
                        loading={loading}
                        onChange={(page, per_page) => setFilters(f => ({ ...f, page, per_page }))}
                    />
                </div>

                <AccountModal
                    open={createOpen}
                    onClose={() => setCreateOpen(false)}
                    onSuccess={(name) => {
                        setCreateOpen(false);
                        fetchUsers();
                        notify.success('Tạo tài khoản thành công', `Tài khoản "${name}" đã được tạo và sẵn sàng sử dụng.`);
                    }}
                />

                <EditAccountModal
                    user={editUser}
                    open={!!editUser}
                    onClose={() => setEditUser(null)}
                    onSuccess={(name) => {
                        setEditUser(null);
                        fetchUsers();
                        notify.success('Cập nhật thành công', `Thông tin tài khoản "${name}" đã được lưu.`);
                    }}
                />

                <ViewAccountModal
                    userId={viewUser?.id}
                    open={!!viewUser}
                    onClose={() => setViewUser(null)}
                />
            </div>
        </>
    );
}