import { Modal, Form, Input, message } from 'antd';
import adminUserService from '../../../services/admin/adminUserService.js';

export default function AccountModal({ open, onClose, onSuccess }) {
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        const values = await form.validateFields();
        try {
            // POST /api/admin/users tạo employee, role mặc định là "employee"
            await adminUserService.create({ ...values, role: 'employee' });
            message.success('Đã tạo tài khoản nhân viên');
            form.resetFields();
            onSuccess();
        } catch (err) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors) {
                // Map lỗi BE (Laravel validation) vào form fields
                form.setFields(Object.entries(serverErrors).map(([name, errors]) => ({ name, errors })));
            } else {
                message.error('Tạo tài khoản thất bại');
            }
        }
    };

    return (
        <Modal
            title="Tạo tài khoản nhân viên"
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            okText="Tạo tài khoản"
            cancelText="Huỷ"
            afterClose={() => form.resetFields()}
        >
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item name="name" label="Họ tên" rules={[{ required: true, min: 2 }]}>
                    <Input placeholder="Nguyễn Văn A" />
                </Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input placeholder="nhanvien@dearrose.vn" />
                </Form.Item>
                <Form.Item name="phone" label="Số điện thoại" rules={[{ pattern: /^0[0-9]{9}$/, message: 'SĐT không hợp lệ' }]}>
                    <Input placeholder="0912345678" />
                </Form.Item>
                <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 8 }]}>
                    <Input.Password placeholder="Tối thiểu 8 ký tự" />
                </Form.Item>
            </Form>
        </Modal>
    );
}