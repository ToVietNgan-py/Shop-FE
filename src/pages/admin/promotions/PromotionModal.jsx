import { useEffect, useState } from 'react';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Switch, Button, message } from 'antd';
import dayjs from 'dayjs';
import adminPromotionService from '../../../services/admin/adminPromotionService.js';
import { promotionSchema } from '../../../validations/adminSchema.js';
import { productService } from '../../../services/productService.js';
import { categoryService } from '../../../services/categoryService.js';

export default function PromotionModal({ open, promotion, onClose, onSuccess }) {
    const isEdit = !!promotion;
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        resolver: zodResolver(promotionSchema),
        defaultValues: {
            name: '',
            description: '',
            type: 'percent',
            value: null,
            min_order_total: null,
            max_discount: null,
            priority: 0,
            starts_at: null,
            expires_at: null,
            usage_limit: null,
            is_active: true,
            product_ids: [],
            category_ids: [],
            bogo_rules: [],
        }
    });

    const typeValue = watch('type');
    const { fields: bogoFields, append: bogoAppend, remove: bogoRemove } = useFieldArray({ control, name: 'bogo_rules' });

    useEffect(() => {
        if (!open) return;

        // load selects
        (async () => {
            try {
                const p = await productService.list({ page: 1, limit: 200 });

                setProducts(
                    p?.data?.data ??
                    p?.data ??
                    []
                );
            } catch (e) {
                setProducts([]);
            }

            try {
                const c = await categoryService.list();

                setCategories(
                    c?.data?.data ??
                    c?.data ??
                    c ??
                    []
                );
            } catch (e) {
                setCategories([]);
            }
        })();

        reset(promotion ? {
            ...promotion,
            starts_at: promotion.starts_at ? dayjs(promotion.starts_at) : null,
            expires_at: promotion.expires_at ? dayjs(promotion.expires_at) : null,
            product_ids: promotion.products?.map(p => p.id) ?? [],
            category_ids: promotion.categories?.map(c => c.id) ?? [],
            bogo_rules: promotion.bogo_rules ?? [],
            is_active: promotion.is_active ?? true,
        } : undefined);
    }, [open, promotion, reset]);

    const onSubmit = async (values) => {
        const payload = {
            ...values,
            starts_at: values.starts_at?.toISOString() || null,
            expires_at: values.expires_at?.toISOString() || null,
            product_ids: values.product_ids || [],
            category_ids: values.category_ids || [],
        };

        if (values.type !== 'bogo') {
            delete payload.bogo_rules;
        }

        try {
            if (isEdit) {
                await adminPromotionService.update(promotion.id, payload);
                message.success('Cập nhật khuyến mãi thành công');
            } else {
                await adminPromotionService.create(payload);
                message.success('Tạo khuyến mãi thành công');
            }
            onSuccess();
        } catch (err) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    return (
        <Modal
            title={isEdit ? 'Sửa Khuyến mãi' : 'Tạo Khuyến mãi mới'}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit(onSubmit)}
            okText={isEdit ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
            cancelText="Huỷ"
            width={720}
            okButtonProps={{ loading: isSubmitting }}
        >
            <form style={{ marginTop: 16 }} onSubmit={handleSubmit(onSubmit)} noValidate>
                <Form.Item label="Tên" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
                    <Controller name="name" control={control} render={({ field }) => (
                        <Input {...field} value={field.value ?? ''} placeholder="Tên khuyến mãi" />
                    )} />
                </Form.Item>

                <Form.Item label="Mô tả" validateStatus={errors.description ? 'error' : ''} help={errors.description?.message}>
                    <Controller name="description" control={control} render={({ field }) => (
                        <Input.TextArea {...field} value={field.value ?? ''} rows={2} placeholder="Mô tả ngắn" />
                    )} />
                </Form.Item>

                <Form.Item label="Loại" validateStatus={errors.type ? 'error' : ''} help={errors.type?.message}>
                    <Controller name="type" control={control} render={({ field }) => (
                        <Select {...field} options={[{ value: 'percent', label: 'Phần trăm (%)' }, { value: 'amount', label: 'Số tiền (₫)' }, { value: 'bogo', label: 'Mua X tặng Y (BOGO)' }]} />
                    )} />
                </Form.Item>

                {typeValue !== 'bogo' && (
                    <Form.Item label="Giá trị" validateStatus={errors.value ? 'error' : ''} help={errors.value?.message}>
                        <Controller name="value" control={control} render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} min={0} />} />
                    </Form.Item>
                )}

                <Form.Item label="Đơn hàng tối thiểu (₫)" validateStatus={errors.min_order_total ? 'error' : ''} help={errors.min_order_total?.message}>
                    <Controller name="min_order_total" control={control} render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} min={0} />} />
                </Form.Item>

                <Form.Item label="Giá trị tối đa giảm (₫)" validateStatus={errors.max_discount ? 'error' : ''} help={errors.max_discount?.message}>
                    <Controller name="max_discount" control={control} render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} min={0} />} />
                </Form.Item>

                <Form.Item label="Ưu tiên" validateStatus={errors.priority ? 'error' : ''} help={errors.priority?.message}>
                    <Controller name="priority" control={control} render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} min={0} />} />
                </Form.Item>

                <Form.Item label="Bắt đầu" validateStatus={errors.starts_at ? 'error' : ''} help={errors.starts_at?.message}>
                    <Controller name="starts_at" control={control} render={({ field }) => (
                        <DatePicker {...field} style={{ width: '100%' }} showTime />
                    )} />
                </Form.Item>

                <Form.Item label="Kết thúc" validateStatus={errors.expires_at ? 'error' : ''} help={errors.expires_at?.message}>
                    <Controller name="expires_at" control={control} render={({ field }) => (
                        <DatePicker {...field} style={{ width: '100%' }} showTime />
                    )} />
                </Form.Item>

                <Form.Item label="Số lần dùng tối đa" validateStatus={errors.usage_limit ? 'error' : ''} help={errors.usage_limit?.message}>
                    <Controller name="usage_limit" control={control} render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} min={1} />} />
                </Form.Item>

                <Form.Item label="Sản phẩm áp dụng" help={errors.product_ids?.message}>
                    <Controller name="product_ids" control={control} render={({ field }) => (
                        <Select {...field} mode="multiple" options={products.map(p => ({ value: p.id, label: p.name }))} placeholder="Chọn sản phẩm (để trống = toàn shop)" />
                    )} />
                </Form.Item>

                <Form.Item label="Danh mục áp dụng" help={errors.category_ids?.message}>
                    <Controller name="category_ids" control={control} render={({ field }) => (
                        <Select {...field} mode="multiple" options={categories.map(c => ({ value: c.id, label: c.name }))} placeholder="Chọn danh mục (để trống = toàn shop)" />
                    )} />
                </Form.Item>

                {typeValue === 'bogo' && (
                    <Form.Item label="BOGO Rules" help={errors.bogo_rules?.message}>
                        {bogoFields.map((f, idx) => (
                            <div key={f.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                <Controller name={`bogo_rules.${idx}.buy_product_id`} control={control} render={({ field }) => (
                                    <Select {...field} showSearch options={products.map(p => ({ value: p.id, label: p.name }))} placeholder="Sản phẩm mua" style={{ minWidth: 180 }} />
                                )} />

                                <Controller name={`bogo_rules.${idx}.buy_quantity`} control={control} render={({ field }) => (
                                    <InputNumber {...field} min={1} placeholder="Số lượng mua" />
                                )} />

                                <Controller name={`bogo_rules.${idx}.gift_product_id`} control={control} render={({ field }) => (
                                    <Select {...field} showSearch options={products.map(p => ({ value: p.id, label: p.name }))} placeholder="Sản phẩm quà" style={{ minWidth: 180 }} />
                                )} />

                                <Controller name={`bogo_rules.${idx}.gift_quantity`} control={control} render={({ field }) => (
                                    <InputNumber {...field} min={1} placeholder="Số lượng quà" />
                                )} />

                                <Controller name={`bogo_rules.${idx}.gift_discount_percent`} control={control} render={({ field }) => (
                                    <InputNumber {...field} min={0} max={100} placeholder="% giảm quà" />
                                )} />

                                <Button danger onClick={() => bogoRemove(idx)}>Xóa</Button>
                            </div>
                        ))}

                        <Button type="dashed" onClick={() => bogoAppend({ buy_product_id: null, buy_quantity: 1, gift_product_id: null, gift_quantity: 1, gift_discount_percent: 100 })}>Thêm rule</Button>
                    </Form.Item>
                )}

                <Form.Item label="Kích hoạt">
                    <Controller name="is_active" control={control} render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />} />
                </Form.Item>
            </form>
        </Modal>
    );
}
