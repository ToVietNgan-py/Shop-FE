import { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Switch, message } from 'antd';
import dayjs from 'dayjs';
import adminVoucherService from '../../../services/admin/adminVoucherService.js';

export default function VoucherModal({ open, voucher, onClose, onSuccess }) {
    const [form] = Form.useForm();
    const isEdit = !!voucher;

    useEffect(() => {
        if (open) {
            if (voucher) {
                form.setFieldsValue({
                    ...voucher,
                    expires_at: voucher.expires_at ? dayjs(voucher.expires_at) : null,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, voucher, form]);

    const handleSubmit = async () => {
        const values = await form.validateFields();
        const payload = {
            ...values,
            expires_at: values.expires_at?.toISOString() || null,
        };
        try {
            if (isEdit) {
                await adminVoucherService.update(voucher.id, payload);
                message.success('Cập nhật voucher thành công');
            } else {
                await adminVoucherService.create(payload);
                message.success('Tạo voucher thành công');
            }
            onSuccess();
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    return (
        <Modal
            title={isEdit ? 'Sửa Voucher' : 'Thêm Voucher mới'}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            okText={isEdit ? 'Lưu thay đổi' : 'Tạo voucher'}
            cancelText="Huỷ"
            width={520}
        >
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item name="code" label="Mã voucher" rules={[{ required: true, message: 'Nhập mã voucher' }]}>
                    <Input placeholder="VD: SUMMER20" style={{ textTransform: 'uppercase' }} />
                </Form.Item>

                <Form.Item name="description" label="Mô tả">
                    <Input.TextArea rows={3} placeholder="VD: Giảm cho đơn hàng từ ..." />
                </Form.Item>
                <Form.Item name="type" label="Loại giảm" rules={[{ required: true }]}>
                    <Select options={[{ value: 'percent', label: 'Phần trăm (%)' }, { value: 'amount', label: 'Số tiền (₫)' }]} />
                </Form.Item>
                <Form.Item name="value" label="Giá trị" rules={[{ required: true, min: 1, type: 'number' }]}>
                    <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
                <Form.Item name="min_order_value" label="Đơn hàng tối thiểu (₫)">
                    <InputNumber style={{ width: '100%' }} min={0} placeholder="0 = không giới hạn" />
                </Form.Item>
                <Form.Item name="max_uses" label="Số lần dùng tối đa">
                    <InputNumber style={{ width: '100%' }} min={1} placeholder="Để trống = không giới hạn" />
                </Form.Item>
                <Form.Item name="expires_at" label="Hạn sử dụng">
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabledDate={(d) => d < dayjs().startOf('day')} />
                </Form.Item>
                <Form.Item name="is_active" label="Kích hoạt" valuePropName="checked" initialValue={true}>
                    <Switch />
                </Form.Item>
            </Form>
        </Modal>
    );
}
