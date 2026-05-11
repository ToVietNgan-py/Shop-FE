import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Switch, message } from 'antd';
import dayjs from 'dayjs';
import adminVoucherService from '../../../services/admin/adminVoucherService.js';
import { voucherSchema } from '../../../validations/adminSchema.js';

export default function VoucherModal({ open, voucher, onClose, onSuccess }) {
    const isEdit = !!voucher;
    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(voucherSchema),
        defaultValues: {
            code: '',
            description: '',
            type: 'percent',
            value: null,
            min_order_value: null,
            max_uses: null,
            expires_at: null,
            is_active: true,
        },
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        reset(voucher ? {
            ...voucher,
            description: voucher.description || '',
            expires_at: voucher.expires_at ? dayjs(voucher.expires_at) : null,
            is_active: voucher.is_active ?? true,
        } : {
            code: '',
            description: '',
            type: 'percent',
            value: null,
            min_order_value: null,
            max_uses: null,
            expires_at: null,
            is_active: true,
        });
    }, [open, reset, voucher]);

    const onSubmit = async (values) => {
        const payload = {
            ...values,
            code: values.code.toUpperCase(),
            min_order_value: values.min_order_value ?? 0,
            max_uses: values.max_uses || null,
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
            onOk={handleSubmit(onSubmit)}
            okText={isEdit ? 'Lưu thay đổi' : 'Tạo voucher'}
            cancelText="Huỷ"
            width={520}
            okButtonProps={{ loading: isSubmitting }}
        >
            <form style={{ marginTop: 16 }} onSubmit={handleSubmit(onSubmit)} noValidate>
                <Form.Item label="Mã voucher" validateStatus={errors.code ? 'error' : ''} help={errors.code?.message}>
                    <Input placeholder="VD: SUMMER20" style={{ textTransform: 'uppercase' }} {...register('code')} />
                </Form.Item>

                <Form.Item label="Mô tả" validateStatus={errors.description ? 'error' : ''} help={errors.description?.message}>
                    <Input.TextArea rows={3} placeholder="VD: Giảm cho đơn hàng từ ..." {...register('description')} />
                </Form.Item>

                <Form.Item label="Loại giảm" validateStatus={errors.type ? 'error' : ''} help={errors.type?.message}>
                    <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                options={[
                                    { value: 'percent', label: 'Phần trăm (%)' },
                                    { value: 'amount', label: 'Số tiền (₫)' },
                                ]}
                            />
                        )}
                    />
                </Form.Item>

                <Form.Item label="Giá trị" validateStatus={errors.value ? 'error' : ''} help={errors.value?.message}>
                    <Controller
                        name="value"
                        control={control}
                        render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} min={1} />}
                    />
                </Form.Item>

                <Form.Item label="Đơn hàng tối thiểu (₫)" validateStatus={errors.min_order_value ? 'error' : ''} help={errors.min_order_value?.message}>
                    <Controller
                        name="min_order_value"
                        control={control}
                        render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} min={0} placeholder="0 = không giới hạn" />}
                    />
                </Form.Item>

                <Form.Item label="Số lần dùng tối đa" validateStatus={errors.max_uses ? 'error' : ''} help={errors.max_uses?.message}>
                    <Controller
                        name="max_uses"
                        control={control}
                        render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} min={1} placeholder="Để trống = không giới hạn" />}
                    />
                </Form.Item>

                <Form.Item label="Hạn sử dụng" validateStatus={errors.expires_at ? 'error' : ''} help={errors.expires_at?.message}>
                    <Controller
                        name="expires_at"
                        control={control}
                        render={({ field }) => (
                            <DatePicker
                                {...field}
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                disabledDate={(date) => date < dayjs().startOf('day')}
                            />
                        )}
                    />
                </Form.Item>

                <Form.Item label="Kích hoạt" validateStatus={errors.is_active ? 'error' : ''} help={errors.is_active?.message}>
                    <Controller
                        name="is_active"
                        control={control}
                        render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
                    />
                </Form.Item>
            </form>
        </Modal>
    );
}
