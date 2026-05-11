import { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import adminUserService from '../../../services/admin/adminUserService.js';

/**
 * EditAccountModal
 * PUT /api/admin/users/{id}
 * onSuccess(name) — trả về tên để parent hiện notification
 */
export default function EditAccountModal({ open, user, onClose, onSuccess }) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (open && user) {
            form.setFieldsValue({
                name: user.name,
                email: user.email,
                phone: user.phone,
            });
        }
    }, [open, user, form]);

    const handleSubmit = async () => {
        const values = await form.validateFields();
        try {
            await adminUserService.update(user.id, values);
            onSuccess(values.name);          // ← trả tên về parent
        } catch (err) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors) {
                form.setFields(
                    Object.entries(serverErrors).map(([name, errors]) => ({ name, errors }))
                );
            }
        }
    };

    return (
        <Modal
            title="Chỉnh sửa tài khoản"
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            okText="Lưu thay đổi"
            cancelText="Huỷ"
            afterClose={() => form.resetFields()}
        >
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item name="name" label="Họ tên" rules={[{ required: true, min: 2, message: 'Tên tối thiểu 2 ký tự' }]}>
                    <Input placeholder="Nguyễn Văn A" />
                </Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
                    <Input placeholder="nhanvien@dearrose.vn" />
                </Form.Item>
                <Form.Item name="phone" label="Số điện thoại" rules={[{ pattern: /^0[0-9]{9}$/, message: 'SĐT không hợp lệ' }]}>
                    <Input placeholder="0912345678" />
                </Form.Item>
            </Form>
        </Modal>
    );
}