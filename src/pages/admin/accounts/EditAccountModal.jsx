import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Form, Input } from 'antd';
import adminUserService from '../../../services/admin/adminUserService.js';
import { accountUpdateSchema } from '../../../validations/adminSchema.js';

const mapServerErrors = (serverErrors, setError) => {
    Object.entries(serverErrors || {}).forEach(([name, messages]) => {
        setError(name, {
            type: 'server',
            message: Array.isArray(messages) ? messages.join(' ') : String(messages),
        });
    });
};

export default function EditAccountModal({ open, user, onClose, onSuccess }) {
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(accountUpdateSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
        },
    });

    useEffect(() => {
        if (open && user) {
            reset({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    }, [open, reset, user]);

    const onSubmit = async (values) => {
        try {
            await adminUserService.update(user.id, values);
            onSuccess(values.name);
        } catch (err) {
            mapServerErrors(err.response?.data?.errors, setError);
        }
    };

    return (
        <Modal
            title="Chỉnh sửa tài khoản"
            open={open}
            onCancel={onClose}
            onOk={handleSubmit(onSubmit)}
            okText="Lưu thay đổi"
            cancelText="Huỷ"
            okButtonProps={{ loading: isSubmitting }}
            afterClose={() => reset()}
        >
            <form style={{ marginTop: 16 }} onSubmit={handleSubmit(onSubmit)} noValidate>
                <Form.Item label="Họ tên" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
                    <Input placeholder="Nguyễn Văn A" {...register('name')} />
                </Form.Item>
                <Form.Item label="Email" validateStatus={errors.email ? 'error' : ''} help={errors.email?.message}>
                    <Input placeholder="nhanvien@dearrose.vn" {...register('email')} />
                </Form.Item>
                <Form.Item label="Số điện thoại" validateStatus={errors.phone ? 'error' : ''} help={errors.phone?.message}>
                    <Input placeholder="0912345678" {...register('phone')} />
                </Form.Item>
            </form>
        </Modal>
    );
}
