import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Form, Input, Select } from 'antd';
import adminUserService from '../../../services/admin/adminUserService.js';
import { accountCreateSchema } from '../../../validations/adminSchema.js';

const ROLE_CREATE_OPTIONS = [
    { value: 'employee', label: 'Nhân viên' },
    { value: 'admin', label: 'Admin' },
    { value: 'customer', label: 'Khách hàng' },
];

const mapServerErrors = (serverErrors, setError) => {
    Object.entries(serverErrors || {}).forEach(([name, messages]) => {
        setError(name, {
            type: 'server',
            message: Array.isArray(messages) ? messages.join(' ') : String(messages),
        });
    });
};

export default function AccountModal({ open, onClose, onSuccess }) {
    const {
        register,
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(accountCreateSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            role: 'employee',
            password: '',
        },
    });

    const onSubmit = async (values) => {
        try {
            await adminUserService.create(values);
            reset();
            onSuccess(values.name);
        } catch (err) {
            mapServerErrors(err.response?.data?.errors, setError);
        }
    };

    return (
        <Modal
            title="Tạo tài khoản mới"
            open={open}
            onCancel={onClose}
            onOk={handleSubmit(onSubmit)}
            okText="Tạo tài khoản"
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
                <Form.Item label="Role" validateStatus={errors.role ? 'error' : ''} help={errors.role?.message}>
                    <Controller
                        name="role"
                        control={control}
                        render={({ field }) => <Select {...field} options={ROLE_CREATE_OPTIONS} />}
                    />
                </Form.Item>
                <Form.Item label="Mật khẩu" validateStatus={errors.password ? 'error' : ''} help={errors.password?.message}>
                    <Input.Password placeholder="Tối thiểu 8 ký tự, gồm chữ và số" {...register('password')} />
                </Form.Item>
            </form>
        </Modal>
    );
}
