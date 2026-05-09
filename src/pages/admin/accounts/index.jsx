import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Select, Space, Tag, Popconfirm, message, Typography, Tooltip } from 'antd';
import { PlusOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import DataTable from '../../../components/admin/DataTable';
import adminUserService from '../../../services/admin/adminUserService.js';
import AccountModal from './AccountModal';

const { Title } = Typography;

const ROLE_OPTIONS = [
    { value: '', label: 'Tất cả role' },
    { value: 'admin', label: 'Admin' },
    { value: 'employee', label: 'Nhân viên' },
    { value: 'customer', label: 'Khách hàng' },
];

const ROLE_COLOR = { admin: 'purple', employee: 'blue', customer: 'default' };

export default function AdminAccounts() {
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ page: 1, per_page: 15, role: '', search: '' });
    const [modalOpen, setModalOpen] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminUserService.getAll(filters);
            setUsers(res.data.data);
            setMeta(res.data.meta);
        } finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleLockToggle = async (user) => {
        try {
            if (user.locked_at) {
                await adminUserService.unlock(user.id);
                message.success(`Đã mở khoá tài khoản ${user.name}`);
            } else {
                await adminUserService.lock(user.id);
                message.success(`Đã khoá tài khoản ${user.name}`);
            }
            fetchUsers();
        } catch { message.error('Thao tác thất bại'); }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await adminUserService.updateRole(userId, newRole);
            message.success('Đã cập nhật role');
            fetchUsers();
        } catch { message.error('Không thể đổi role'); }
    };

    const columns = [
        { title: 'Tên', dataIndex: 'name' },
        { title: 'Email', dataIndex: 'email' },
        { title: 'SĐT', dataIndex: 'phone', width: 130 },
        {
            title: 'Role', dataIndex: 'role', width: 130,
            render: (role, record) => (
                <Select
                    value={role}
                    size="small"
                    style={{ width: 120 }}
                    onChange={(v) => handleRoleChange(record.id, v)}
                    options={ROLE_OPTIONS.filter(o => o.value !== '')}
                />
            )
        },
        {
            title: 'Trạng thái', width: 120,
            render: (_, r) => r.locked_at
                ? <Tag color="error">Đã khoá</Tag>
                : <Tag color="success">Hoạt động</Tag>
        },
        { title: 'Ngày tạo', dataIndex: 'created_at', render: (d) => dayjs(d).format('DD/MM/YYYY'), width: 110 },
        {
            title: 'Hành động', width: 100,
            render: (_, record) => (
                <Tooltip title={record.locked_at ? 'Mở khoá' : 'Khoá tài khoản'}>
                    <Popconfirm
                        title={record.locked_at ? `Mở khoá tài khoản ${record.name}?` : `Khoá tài khoản ${record.name}?`}
                        onConfirm={() => handleLockToggle(record)}
                        okText="Xác nhận"
                        cancelText="Huỷ"
                    >
                        <Button
                            size="small"
                            danger={!record.locked_at}
                            icon={record.locked_at ? <UnlockOutlined /> : <LockOutlined />}
                        />
                    </Popconfirm>
                </Tooltip>
            )
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>Quản lý Tài khoản</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                    Tạo nhân viên
                </Button>
            </div>

            <Space wrap style={{ marginBottom: 16 }}>
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

            <DataTable
                columns={columns}
                dataSource={users}
                meta={meta}
                loading={loading}
                onChange={(page, per_page) => setFilters(f => ({ ...f, page, per_page }))}
            />

            <AccountModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={() => { setModalOpen(false); fetchUsers(); }}
            />
        </div>
    );
}