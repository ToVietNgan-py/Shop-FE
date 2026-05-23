import { useEffect, useState } from 'react';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Switch, Button, message, Tag } from 'antd';
import dayjs from 'dayjs';
import adminPromotionService from '../../../services/admin/adminPromotionService.js';
import { productService } from '../../../services/productService.js';
import { categoryService } from '../../../services/categoryService.js';

export default function PromotionModal({ open, promotion, onClose, onSuccess }) {
    const isEdit = !!promotion;
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            name: '',
            description: '',
            type: 'percent',
            value: null,
            min_order_total: 0,
            max_discount: 0,
            priority: 0,
            starts_at: null,
            expires_at: null,
            usage_limit: null,
            is_active: true,
            product_ids: [],
            category_ids: [],
            bogo_rules: [],
            // Flash sale: mảng { product_id, flash_price }
            flash_products: [],
        }
    });

    const typeValue = watch('type');
    const flashProducts = watch('flash_products');
    const { fields: bogoFields, append: bogoAppend, remove: bogoRemove } = useFieldArray({ control, name: 'bogo_rules' });

    // Load products & categories khi modal mở
    useEffect(() => {
        if (!open) return;

        (async () => {
            try {
                const p = await productService.list({ page: 1, limit: 200 });
                setProducts(Array.isArray(p?.data) ? p.data : []);
            } catch {
                setProducts([]);
            }
            try {
                const c = await categoryService.list();
                setCategories(c?.data?.data ?? c?.data ?? c ?? []);
            } catch {
                setCategories([]);
            }
        })();

        // Nếu là edit, map data vào form
        if (promotion) {
            // Xây dựng flash_products từ products có flash_price
            const flashProds = (promotion.products ?? [])
                .filter(p => p.flash_price != null)
                .map(p => ({ product_id: p.id, flash_price: p.flash_price }));

            reset({
                ...promotion,
                starts_at: promotion.starts_at ? dayjs(promotion.starts_at) : null,
                expires_at: promotion.expires_at ? dayjs(promotion.expires_at) : null,
                product_ids: promotion.products?.map(p => p.id) ?? [],
                category_ids: promotion.categories?.map(c => c.id) ?? [],
                bogo_rules: promotion.bogo_rules ?? [],
                is_active: promotion.is_active ?? true,
                flash_products: flashProds,
            });
        } else {
            reset({
                name: '', description: '', type: 'percent', value: null,
                min_order_total: null, max_discount: null, priority: 0,
                starts_at: null, expires_at: null, usage_limit: null,
                is_active: true, product_ids: [], category_ids: [],
                bogo_rules: [], flash_products: [],
            });
        }
    }, [open, promotion, reset]);

    // Khi chọn sản phẩm flash sale, tự động thêm vào flash_products
    const handleFlashProductSelect = (selectedIds) => {
        const current = flashProducts ?? [];
        // Giữ lại những sp đã có flash_price, thêm mới những sp mới chọn
        const updated = selectedIds.map(id => {
            const existing = current.find(fp => fp.product_id === id);
            return existing ?? { product_id: id, flash_price: null };
        });
        setValue('flash_products', updated);
        setValue('product_ids', selectedIds);
    };

    const onSubmit = async (values) => {
        const payload = {
            ...values,
            starts_at: values.starts_at?.toISOString() || null,
            expires_at: values.expires_at?.toISOString() || null,
            min_order_total: values.min_order_total ?? 0,
            max_discount: values.max_discount ?? 0,
            product_ids: values.product_ids || [],
            category_ids: values.category_ids || [],

        };

        if (values.type !== 'bogo') delete payload.bogo_rules;

        // Flash sale: gửi product_ids kèm flash_price
        if (values.type === 'flash_sale') {
            // Chuyển flash_products thành format BE mong đợi
            payload.flash_products = (values.flash_products ?? []).map(fp => ({
                product_id: fp.product_id,
                flash_price: Number(fp.flash_price) || 0,
            }));
            // product_ids lấy từ flash_products
            payload.product_ids = payload.flash_products.map(fp => fp.product_id);
            delete payload.value; // flash sale không dùng value
        } else {
            delete payload.flash_products;
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

    // Helper: tìm tên sản phẩm
    const getProductName = (id) => products.find(p => p.id === id)?.name ?? `Product #${id}`;

    return (
        <Modal
            title={isEdit ? 'Sửa Khuyến mãi' : 'Tạo Khuyến mãi mới'}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit(onSubmit)}
            okText={isEdit ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
            cancelText="Huỷ"
            width={740}
            okButtonProps={{ loading: isSubmitting }}
        >
            <form style={{ marginTop: 16 }} onSubmit={handleSubmit(onSubmit)} noValidate>

                {/* Tên */}
                <Form.Item label="Tên" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
                    <Controller name="name" control={control} render={({ field }) => (
                        <Input {...field} value={field.value ?? ''} placeholder="Tên khuyến mãi" />
                    )} />
                </Form.Item>

                {/* Mô tả */}
                <Form.Item label="Mô tả">
                    <Controller name="description" control={control} render={({ field }) => (
                        <Input.TextArea {...field} value={field.value ?? ''} rows={2} placeholder="Mô tả ngắn" />
                    )} />
                </Form.Item>

                {/* Loại */}
                <Form.Item label="Loại">
                    <Controller name="type" control={control} render={({ field }) => (
                        <Select {...field} options={[
                            { value: 'percent', label: 'Phần trăm (%)' },
                            { value: 'amount', label: 'Số tiền (₫)' },
                            { value: 'bogo', label: 'Mua X tặng Y (BOGO)' },
                            { value: 'flash_sale', label: '⚡ Flash Sale' },
                        ]} />
                    )} />
                </Form.Item>

                {/* Giá trị — ẩn khi flash_sale */}
                {typeValue !== 'bogo' && typeValue !== 'flash_sale' && (
                    <Form.Item label="Giá trị">
                        <Controller name="value" control={control} render={({ field }) => (
                            <InputNumber {...field} style={{ width: '100%' }} min={0} />
                        )} />
                    </Form.Item>
                )}

                <Form.Item label="Đơn hàng tối thiểu (₫)">
                    <Controller name="min_order_total" control={control} render={({ field }) => (
                        <InputNumber {...field} style={{ width: '100%' }} min={0} />
                    )} />
                </Form.Item>

                {typeValue !== 'flash_sale' && (
                    <Form.Item label="Giá trị tối đa giảm (₫)">
                        <Controller name="max_discount" control={control} render={({ field }) => (
                            <InputNumber {...field} style={{ width: '100%' }} min={0} />
                        )} />
                    </Form.Item>
                )}

                <Form.Item label="Ưu tiên">
                    <Controller name="priority" control={control} render={({ field }) => (
                        <InputNumber {...field} style={{ width: '100%' }} min={0} />
                    )} />
                </Form.Item>

                <Form.Item label="Bắt đầu">
                    <Controller name="starts_at" control={control} render={({ field }) => (
                        <DatePicker {...field} style={{ width: '100%' }} showTime />
                    )} />
                </Form.Item>

                <Form.Item label="Kết thúc">
                    <Controller name="expires_at" control={control} render={({ field }) => (
                        <DatePicker {...field} style={{ width: '100%' }} showTime />
                    )} />
                </Form.Item>

                <Form.Item label="Số lần dùng tối đa">
                    <Controller name="usage_limit" control={control} render={({ field }) => (
                        <InputNumber {...field} style={{ width: '100%' }} min={1} />
                    )} />
                </Form.Item>

                {/* ── FLASH SALE SECTION ── */}
                {typeValue === 'flash_sale' && (
                    <div style={{
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        borderRadius: 10,
                        padding: '16px 18px',
                        marginBottom: 16,
                    }}>
                        <div style={{ fontWeight: 700, color: '#c2410c', marginBottom: 12, fontSize: 14 }}>
                            ⚡ Cấu hình Flash Sale
                        </div>

                        {/* Chọn sản phẩm flash sale */}
                        <Form.Item label="Sản phẩm Flash Sale" style={{ marginBottom: 12 }}>
                            <Controller name="product_ids" control={control} render={({ field }) => (
                                <Select
                                    mode="multiple"
                                    value={field.value}
                                    onChange={handleFlashProductSelect}
                                    options={products.map(p => ({ value: p.id, label: p.name }))}
                                    placeholder="Chọn sản phẩm tham gia flash sale"
                                    style={{ width: '100%' }}
                                    showSearch
                                    filterOption={(input, option) =>
                                        option.label.toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            )} />
                        </Form.Item>

                        {/* Bảng nhập flash_price cho từng sp */}
                        {(flashProducts ?? []).length > 0 && (
                            <div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 180px',
                                    gap: '8px 12px',
                                    marginBottom: 6,
                                }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', textTransform: 'uppercase' }}>
                                        Sản phẩm
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', textTransform: 'uppercase' }}>
                                        Giá Flash (₫)
                                    </div>
                                </div>

                                {(flashProducts ?? []).map((fp, idx) => (
                                    <div key={fp.product_id} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 180px',
                                        gap: '8px 12px',
                                        alignItems: 'center',
                                        marginBottom: 8,
                                        background: '#fff',
                                        borderRadius: 6,
                                        padding: '8px 10px',
                                        border: '1px solid #fed7aa',
                                    }}>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                                            <Tag color="orange" style={{ marginRight: 6 }}>⚡</Tag>
                                            {getProductName(fp.product_id)}
                                        </div>
                                        <Controller
                                            name={`flash_products.${idx}.flash_price`}
                                            control={control}
                                            render={({ field }) => (
                                                <InputNumber
                                                    {...field}
                                                    style={{ width: '100%' }}
                                                    min={0}
                                                    placeholder="VD: 150000"
                                                    formatter={v => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                                                    parser={v => v?.replace(/,/g, '')}
                                                />
                                            )}
                                        />
                                    </div>
                                ))}

                                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                                    * Giá flash sẽ override giá gốc trong thời gian flash sale
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Sản phẩm áp dụng — ẩn khi flash_sale vì đã xử lý riêng */}
                {typeValue !== 'flash_sale' && (
                    <Form.Item label="Sản phẩm áp dụng">
                        <Controller name="product_ids" control={control} render={({ field }) => (
                            <Select
                                {...field}
                                mode="multiple"
                                options={products.map(p => ({ value: p.id, label: p.name }))}
                                placeholder="Để trống = toàn shop"
                                showSearch
                                filterOption={(input, option) =>
                                    option.label.toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        )} />
                    </Form.Item>
                )}

                {/* Danh mục — ẩn khi flash_sale */}
                {typeValue !== 'flash_sale' && (
                    <Form.Item label="Danh mục áp dụng">
                        <Controller name="category_ids" control={control} render={({ field }) => (
                            <Select
                                {...field}
                                mode="multiple"
                                options={categories.map(c => ({ value: c.id, label: c.name }))}
                                placeholder="Để trống = toàn shop"
                            />
                        )} />
                    </Form.Item>
                )}

                {/* BOGO Rules */}
                {typeValue === 'bogo' && (
                    <Form.Item label="BOGO Rules">
                        {bogoFields.map((f, idx) => (
                            <div key={f.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Controller name={`bogo_rules.${idx}.buy_product_id`} control={control} render={({ field }) => (
                                    <Select {...field} showSearch options={products.map(p => ({ value: p.id, label: p.name }))} placeholder="SP mua" style={{ minWidth: 160 }} />
                                )} />
                                <Controller name={`bogo_rules.${idx}.buy_quantity`} control={control} render={({ field }) => (
                                    <InputNumber {...field} min={1} placeholder="SL mua" style={{ width: 90 }} />
                                )} />
                                <Controller name={`bogo_rules.${idx}.gift_product_id`} control={control} render={({ field }) => (
                                    <Select {...field} showSearch options={products.map(p => ({ value: p.id, label: p.name }))} placeholder="SP quà" style={{ minWidth: 160 }} />
                                )} />
                                <Controller name={`bogo_rules.${idx}.gift_quantity`} control={control} render={({ field }) => (
                                    <InputNumber {...field} min={1} placeholder="SL quà" style={{ width: 90 }} />
                                )} />
                                <Controller name={`bogo_rules.${idx}.gift_discount_percent`} control={control} render={({ field }) => (
                                    <InputNumber {...field} min={0} max={100} placeholder="% giảm" style={{ width: 90 }} />
                                )} />
                                <Button danger onClick={() => bogoRemove(idx)}>Xóa</Button>
                            </div>
                        ))}
                        <Button type="dashed" onClick={() => bogoAppend({
                            buy_product_id: null, buy_quantity: 1,
                            gift_product_id: null, gift_quantity: 1,
                            gift_discount_percent: 100,
                        })}>
                            + Thêm rule
                        </Button>
                    </Form.Item>
                )}

                {/* Kích hoạt */}
                <Form.Item label="Kích hoạt">
                    <Controller name="is_active" control={control} render={({ field }) => (
                        <Switch checked={field.value} onChange={field.onChange} />
                    )} />
                </Form.Item>

            </form>
        </Modal>
    );
}