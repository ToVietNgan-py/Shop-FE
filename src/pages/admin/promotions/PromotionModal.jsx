import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Modal, Form, Input, Select, InputNumber, DatePicker, Switch, Button, message, Tag } from "antd";
import dayjs from "dayjs";
import adminPromotionService from "../../../services/admin/adminPromotionService.js";
import adminProductService from "../../../services/admin/adminProductService.js";
import { productService } from "../../../services/productService.js";
import { categoryService } from "../../../services/categoryService.js";

const toNumberList = (values = []) =>
    values
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0);

const normalizeListResponse = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload?.items)) {
        return payload.items;
    }

    if (Array.isArray(payload?.data?.data)) {
        return payload.data.data;
    }

    return [];
};

export default function PromotionModal({ open, promotion, onClose, onSuccess }) {
    const isEdit = !!promotion;
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        mode: "onChange",
        reValidateMode: "onChange",
        defaultValues: {
            name: "",
            description: "",
            type: "percent",
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
            flash_products: [],
        },
    });

    const typeValue = watch("type");
    const flashProducts = watch("flash_products") ?? [];

    const {
        fields: bogoFields,
        append: bogoAppend,
        remove: bogoRemove,
        replace: bogoReplace,
    } = useFieldArray({
        control,
        name: "bogo_rules",
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        let alive = true;

        (async () => {
            try {
                const [adminProductResp, publicProductResp, categoryResp] = await Promise.allSettled([
                    adminProductService.list({ page: 1, limit: 200 }),
                    productService.list({ page: 1, limit: 200 }),
                    categoryService.list(),
                ]);

                if (!alive) {
                    return;
                }

                const adminProducts = normalizeListResponse(adminProductResp.status === "fulfilled" ? adminProductResp.value : []);
                const publicProducts = normalizeListResponse(publicProductResp.status === "fulfilled" ? publicProductResp.value : []);
                const nextProducts = adminProducts.length > 0 ? adminProducts : publicProducts;
                setProducts(nextProducts);

                const nextCategories = normalizeListResponse(categoryResp.status === "fulfilled" ? categoryResp.value : []);
                setCategories(nextCategories);
            } catch {
                if (!alive) {
                    return;
                }

                setProducts([]);
                setCategories([]);
            }
        })();

        if (promotion) {
            const flashProds = (promotion.products ?? [])
                .filter((item) => item.flash_price != null)
                .map((item) => ({
                    product_id: item.id,
                    flash_price: item.flash_price,
                }));

            reset({
                ...promotion,
                starts_at: promotion.starts_at ? dayjs(promotion.starts_at) : null,
                expires_at: promotion.expires_at ? dayjs(promotion.expires_at) : null,
                product_ids: promotion.products?.map((item) => item.id) ?? [],
                category_ids: promotion.categories?.map((item) => item.id) ?? [],
                bogo_rules: promotion.bogo_rules ?? [],
                is_active: promotion.is_active ?? true,
                flash_products: flashProds,
            });
        } else {
            reset({
                name: "",
                description: "",
                type: "percent",
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
                flash_products: [],
            });
        }

        return () => {
            alive = false;
        };
    }, [open, promotion, reset]);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (typeValue === "bogo" && bogoFields.length === 0) {
            bogoAppend({
                buy_product_id: null,
                buy_quantity: 1,
                gift_product_id: null,
                gift_quantity: 1,
                gift_discount_percent: 100,
            });
        }

        if (typeValue !== "bogo" && bogoFields.length > 0) {
            bogoReplace([]);
        }
    }, [typeValue, open, bogoFields.length, bogoAppend, bogoReplace]);

    const normalizedProducts = useMemo(
        () => products.map((item) => ({ value: item.id, label: item.name })),
        [products]
    );

    const normalizedCategories = useMemo(
        () => categories.map((item) => ({ value: item.id, label: item.name })),
        [categories]
    );
    const handleFlashProductSelect = (selectedIds) => {
        const current = flashProducts ?? [];
        const selectedNumberIds = toNumberList(selectedIds);

        const updated = selectedNumberIds.map((id) => {
            const existing = current.find((item) => Number(item.product_id) === Number(id));
            return existing ?? { product_id: id, flash_price: null };
        });

        setValue("flash_products", updated, { shouldDirty: true, shouldValidate: true });
        setValue("product_ids", selectedNumberIds, { shouldDirty: true, shouldValidate: true });
    };

    const getProductName = (id) => products.find((item) => Number(item.id) === Number(id))?.name ?? `Product #${id}`;

    const onSubmit = async (values) => {
        const payload = {
            ...values,
            starts_at: values.starts_at ? values.starts_at.toISOString() : null,
            expires_at: values.expires_at ? values.expires_at.toISOString() : null,
            min_order_total: Number(values.min_order_total ?? 0),
            max_discount: Number(values.max_discount ?? 0),
            priority: Number(values.priority ?? 0),
            usage_limit: values.usage_limit == null ? null : Number(values.usage_limit),
            product_ids: toNumberList(values.product_ids || []),
            category_ids: toNumberList(values.category_ids || []),
        };

        if (values.type === "bogo") {
            payload.bogo_rules = (values.bogo_rules || [])
                .map((rule) => ({
                    buy_product_id: Number(rule.buy_product_id),
                    buy_quantity: Number(rule.buy_quantity ?? 1),
                    gift_product_id: Number(rule.gift_product_id),
                    gift_quantity: Number(rule.gift_quantity ?? 1),
                    gift_discount_percent: Number(rule.gift_discount_percent ?? 100),
                }))
                .filter(
                    (rule) =>
                        Number.isFinite(rule.buy_product_id) &&
                        rule.buy_product_id > 0 &&
                        Number.isFinite(rule.gift_product_id) &&
                        rule.gift_product_id > 0
                );
        } else {
            delete payload.bogo_rules;
        }

        if (values.type === "flash_sale") {
            payload.flash_products = (values.flash_products ?? [])
                .map((item) => ({
                    product_id: Number(item.product_id),
                    flash_price: Number(item.flash_price) || 0,
                }))
                .filter((item) => Number.isFinite(item.product_id) && item.product_id > 0);

            payload.product_ids = payload.flash_products.map((item) => item.product_id);
            delete payload.value;
        } else {
            delete payload.flash_products;
        }

        try {
            if (isEdit) {
                await adminPromotionService.update(promotion.id, payload);
                message.success("Cập nhật khuyến mãi thành công");
            } else {
                await adminPromotionService.create(payload);
                message.success("Tạo khuyến mãi thành công");
            }

            onSuccess();
        } catch (err) {
            message.error(err.response?.data?.message || "Có lỗi xảy ra");
        }
    };

    return (
        <Modal
            title={isEdit ? "Sửa Khuyến mãi" : "Tạo Khuyến mãi mới"}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit(onSubmit)}
            okText={isEdit ? "Lưu thay đổi" : "Tạo khuyến mãi"}
            cancelText="Huỷ"
            width={740}
            okButtonProps={{ loading: isSubmitting }}
        >
            <form style={{ marginTop: 16 }} onSubmit={handleSubmit(onSubmit)} noValidate>
                <Form.Item label="Tên" validateStatus={errors.name ? "error" : ""} help={errors.name?.message}>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input {...field} value={field.value ?? ""} placeholder="Tên khuyến mãi" />
                        )}
                    />
                </Form.Item>

                <Form.Item label="Mô tả">
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <Input.TextArea {...field} value={field.value ?? ""} rows={2} placeholder="Mô tả ngắn" />
                        )}
                    />
                </Form.Item>

                <Form.Item label="Loại">
                    <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                options={[
                                    { value: "percent", label: "Phần trăm (%)" },
                                    { value: "amount", label: "Số tiền (₫)" },
                                    { value: "bogo", label: "Mua X tặng Y (BOGO)" },
                                    { value: "flash_sale", label: "⚡ Flash Sale" },
                                ]}
                            />
                        )}
                    />
                </Form.Item>

                {typeValue !== "bogo" && typeValue !== "flash_sale" && (
                    <Form.Item label="Giá trị">
                        <Controller
                            name="value"
                            control={control}
                            render={({ field }) => <InputNumber {...field} style={{ width: "100%" }} min={0} />}
                        />
                    </Form.Item>
                )}
                <Form.Item label="Đơn hàng tối thiểu (₫)">
                    <Controller
                        name="min_order_total"
                        control={control}
                        render={({ field }) => <InputNumber {...field} style={{ width: "100%" }} min={0} />}
                    />
                </Form.Item>

                {typeValue !== "flash_sale" && (
                    <Form.Item label="Giá trị tối đa giảm (₫)">
                        <Controller
                            name="max_discount"
                            control={control}
                            render={({ field }) => <InputNumber {...field} style={{ width: "100%" }} min={0} />}
                        />
                    </Form.Item>
                )}

                <Form.Item label="Ưu tiên">
                    <Controller
                        name="priority"
                        control={control}
                        render={({ field }) => <InputNumber {...field} style={{ width: "100%" }} min={0} />}
                    />
                </Form.Item>

                <Form.Item label="Bắt đầu">
                    <Controller
                        name="starts_at"
                        control={control}
                        render={({ field }) => <DatePicker {...field} style={{ width: "100%" }} showTime />}
                    />
                </Form.Item>

                <Form.Item label="Kết thúc">
                    <Controller
                        name="expires_at"
                        control={control}
                        render={({ field }) => <DatePicker {...field} style={{ width: "100%" }} showTime />}
                    />
                </Form.Item>

                <Form.Item label="Số lần dùng tối đa">
                    <Controller
                        name="usage_limit"
                        control={control}
                        render={({ field }) => <InputNumber {...field} style={{ width: "100%" }} min={1} />}
                    />
                </Form.Item>

                <Form.Item label="Sản phẩm áp dụng" help="Để trống = toàn shop">
                    <Controller
                        name="product_ids"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                mode="multiple"
                                showSearch
                                optionFilterProp="label"
                                options={normalizedProducts}
                                placeholder="Chọn sản phẩm"
                                notFoundContent={products.length === 0 ? "Không có sản phẩm để chọn" : null}
                            />
                        )}
                    />
                </Form.Item>

                <Form.Item label="Danh mục áp dụng" help="Để trống = toàn shop">
                    <Controller
                        name="category_ids"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                mode="multiple"
                                showSearch
                                optionFilterProp="label"
                                options={normalizedCategories}
                                placeholder="Chọn danh mục"
                                notFoundContent={categories.length === 0 ? "Không có danh mục để chọn" : null}
                            />
                        )}
                    />
                </Form.Item>

                {typeValue === "flash_sale" && (
                    <div
                        style={{
                            background: "#fff7ed",
                            border: "1px solid #fed7aa",
                            borderRadius: 10,
                            padding: "16px 18px",
                            marginBottom: 16,
                        }}
                    >
                        <div style={{ fontWeight: 700, color: "#c2410c", marginBottom: 12, fontSize: 14 }}>
                            ⚡ Cấu hình Flash Sale
                        </div>

                        <Form.Item label="Sản phẩm Flash Sale" style={{ marginBottom: 12 }}>
                            <Controller
                                name="product_ids"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        mode="multiple"
                                        value={field.value ?? []}
                                        onChange={handleFlashProductSelect}
                                        options={normalizedProducts}
                                        placeholder="Chọn sản phẩm tham gia flash sale"
                                        style={{ width: "100%" }}
                                        showSearch
                                        filterOption={(input, option) =>
                                            String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                        }
                                    />
                                )}
                            />
                        </Form.Item>

                        {(flashProducts ?? []).length > 0 && (
                            <div>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 180px",
                                        gap: "8px 12px",
                                        marginBottom: 6,
                                    }}
                                >
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e", textTransform: "uppercase" }}>
                                        Sản phẩm
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e", textTransform: "uppercase" }}>
                                        Giá Flash (₫)
                                    </div>
                                </div>

                                {(flashProducts ?? []).map((fp, idx) => (
                                    <div
                                        key={fp.product_id}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 180px",
                                            gap: "8px 12px",
                                            alignItems: "center",
                                            marginBottom: 8,
                                            background: "#fff",
                                            borderRadius: 6,
                                            padding: "8px 10px",
                                            border: "1px solid #fed7aa",
                                        }}
                                    >
                                        <div style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                                            <Tag color="orange" style={{ marginRight: 6 }}>
                                                ⚡
                                            </Tag>
                                            {getProductName(fp.product_id)}
                                        </div>
                                        <Controller
                                            name={`flash_products.${idx}.flash_price`}
                                            control={control}
                                            render={({ field }) => (
                                                <InputNumber
                                                    {...field}
                                                    style={{ width: "100%" }}
                                                    min={0}
                                                    placeholder="VD: 150000"
                                                    formatter={(value) =>
                                                        value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
                                                    }
                                                    parser={(value) => value?.replace(/,/g, "")}
                                                />
                                            )}
                                        />
                                    </div>
                                ))}
                                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                                    * Giá flash sẽ override giá gốc trong thời gian flash sale
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {typeValue === "bogo" && (
                    <Form.Item label="BOGO Rules">
                        {bogoFields.map((field, idx) => (
                            <div
                                key={field.id}
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    marginBottom: 8,
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                }}
                            >
                                <Controller
                                    name={`bogo_rules.${idx}.buy_product_id`}
                                    control={control}
                                    render={({ field: selectField }) => (
                                        <Select
                                            {...selectField}
                                            showSearch
                                            optionFilterProp="label"
                                            options={normalizedProducts}
                                            placeholder="SP mua"
                                            style={{ minWidth: 160 }}
                                        />
                                    )}
                                />
                                <Controller
                                    name={`bogo_rules.${idx}.buy_quantity`}
                                    control={control}
                                    render={({ field: numberField }) => (
                                        <InputNumber {...numberField} min={1} placeholder="SL mua" style={{ width: 90 }} />
                                    )}
                                />
                                <Controller
                                    name={`bogo_rules.${idx}.gift_product_id`}
                                    control={control}
                                    render={({ field: selectField }) => (
                                        <Select
                                            {...selectField}
                                            showSearch
                                            optionFilterProp="label"
                                            options={normalizedProducts}
                                            placeholder="SP quà"
                                            style={{ minWidth: 160 }}
                                        />
                                    )}
                                />
                                <Controller
                                    name={`bogo_rules.${idx}.gift_quantity`}
                                    control={control}
                                    render={({ field: numberField }) => (
                                        <InputNumber {...numberField} min={1} placeholder="SL quà" style={{ width: 90 }} />
                                    )}
                                />
                                <Controller
                                    name={`bogo_rules.${idx}.gift_discount_percent`}
                                    control={control}
                                    render={({ field: numberField }) => (
                                        <InputNumber {...numberField} min={0} max={100} placeholder="% giảm" style={{ width: 90 }} />
                                    )}
                                />
                                <Button danger onClick={() => bogoRemove(idx)}>
                                    Xóa
                                </Button>
                            </div>
                        ))}

                        <Button
                            type="dashed"
                            onClick={() =>
                                bogoAppend({
                                    buy_product_id: null,
                                    buy_quantity: 1,
                                    gift_product_id: null,
                                    gift_quantity: 1,
                                    gift_discount_percent: 100,
                                })
                            }
                        >
                            + Thêm rule
                        </Button>
                    </Form.Item>
                )}

                <Form.Item label="Kích hoạt">
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
