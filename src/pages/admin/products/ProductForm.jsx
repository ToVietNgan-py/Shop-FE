import {
    Button,
    Drawer,
    Form,
    Input,
    InputNumber,
    Select,
    Space,
    Spin,
    Tabs,
    Table,
    Popconfirm,
    Tag,
    message,
    Modal,
    Alert,
} from "antd";
import { useEffect, useState, useMemo } from "react";
import { AiOutlineSave, AiOutlinePlus, AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import ImageUploader from "../../../components/admin/ImageUploader.jsx";
import adminProductVariantService from "../../../services/admin/adminProductVariantService.js";
import { uploadToCloudinary } from "../../../utils/cloudinaryUpload.js";

// ─── Category type mapping (theo id trong DB) ────────────────────────────────
// id=1 Quần áo → CLOTHING  | id=3 Giày dép → SHOES  | id=2 Túi xách → BAG (free)
const CATEGORY_TYPE = {
    1: "clothing",  // Quần áo
    3: "shoes",     // Giày dép
    2: "bag",       // Túi xách — không bắt buộc size/màu
};

const getCategoryType = (categoryId) => CATEGORY_TYPE[categoryId] ?? "free";

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = Array.from({ length: 11 }, (_, i) => String(35 + i)); // "35".."45"

// Mô tả hint hiển thị trong modal theo type
const CATEGORY_HINT = {
    clothing: "Quần áo: yêu cầu Màu sắc và Size chữ (XS – XXL).",
    shoes: "Giày dép: yêu cầu Size số (35 – 45). Màu sắc không bắt buộc.",
    bag: "Túi xách: Màu sắc và Size đều không bắt buộc.",
    free: "Danh mục khác: Màu sắc và Size đều không bắt buộc.",
};

// ─── Component ───────────────────────────────────────────────────────────────

function ProductForm({ visible = false, product = null, categories = [], onSave, onClose }) {
    const [form] = Form.useForm();
    const [variantForm] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [images, setImages] = useState([]);
    const [activeTab, setActiveTab] = useState("info");

    // category_id đang được chọn trong form (watch realtime)
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    // ─── Variant state ────────────────────────────────────────────────────
    const [variants, setVariants] = useState([]);
    const [variantLoading, setVariantLoading] = useState(false);
    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);
    const [variantSubmitting, setVariantSubmitting] = useState(false);

    // type của sản phẩm dựa vào category đang chọn
    const categoryType = useMemo(
        () => getCategoryType(selectedCategoryId ?? product?.category_id),
        [selectedCategoryId, product?.category_id]
    );

    // ─── Reset / populate khi open ────────────────────────────────────────
    useEffect(() => {
        if (visible && product) {
            form.setFieldsValue({
                sku: product.sku ?? "",
                name: product.name ?? "",
                brand: product.brand ?? "",
                description: product.description ?? "",
                price: Number(product.price) || 0,
                inventory: product.inventory ?? 0,
                category_id: product.category_id ?? undefined,
            });
            setSelectedCategoryId(product.category_id ?? null);
            setImages(
                product.thumbnail
                    ? [{ uid: "existing", name: "image", status: "done", url: product.thumbnail }]
                    : []
            );
            loadVariants(product.id);
        } else if (visible) {
            form.resetFields();
            setImages([]);
            setVariants([]);
            setSelectedCategoryId(null);
        }
        setActiveTab("info");
    }, [visible, product]);

    const loadVariants = async (productId) => {
        setVariantLoading(true);
        try {
            const data = await adminProductVariantService.list(productId);
            setVariants(data);
        } catch {
            message.error("Không tải được biến thể");
        } finally {
            setVariantLoading(false);
        }
    };

    // ─── Cloudinary direct upload handler (dùng bởi ImageUploader) ──────
    const handleCloudinaryUpload = async ({
        file,
        onSuccess,
        onError,
        onProgress,
    }) => {
        try {
            const url = await uploadToCloudinary(
                file,
                ({ percent }) => onProgress({ percent })
            );

            console.log("Uploaded URL:", url);

            onSuccess(
                {
                    success: true,
                    url,
                },
                file
            );
        } catch (err) {
            console.error(err);
            onError(err);
        }
    };

    // ─── Save product ─────────────────────────────────────────────────────
    // const handleSubmit = async (values) => {
    //     setSubmitting(true);
    //     try {
    //         const formData = new FormData();
    //         formData.append("sku", values.sku);
    //         formData.append("name", values.name);
    //         formData.append("brand", values.brand);
    //         formData.append("description", values.description || "");
    //         formData.append("price", values.price);
    //         formData.append("inventory", values.inventory);
    //         formData.append("category_id", values.category_id);

    //         // FE đã upload lên Cloudinary → chỉ gửi URL string về BE
    //         const imgFile = images[0];
    //         if (imgFile?.url) {
    //             formData.append("img", imgFile.url);
    //         }

    //         await onSave?.(formData);
    //         message.success(product ? "Cập nhật sản phẩm thành công" : "Tạo sản phẩm thành công");
    //         onClose?.();
    //     } catch (error) {
    //         message.error(error.message || "Có lỗi xảy ra");
    //     } finally {
    //         setSubmitting(false);
    //     }
    // };

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("sku", values.sku);
            formData.append("name", values.name);
            formData.append("brand", values.brand);
            formData.append("description", values.description || "");
            formData.append("price", values.price);
            formData.append("inventory", values.inventory);
            formData.append("category_id", values.category_id);

            const imgFile = images[0];
            // ✅ Lấy URL từ response Cloudinary (ảnh mới upload)
            // hoặc từ url trực tiếp (ảnh cũ khi edit)
            const imgUrl = imgFile?.response?.url ?? imgFile?.url ?? null;
            if (imgUrl) {
                formData.append("img", imgUrl);
            }

            await onSave?.(formData);
            message.success(product ? "Cập nhật sản phẩm thành công" : "Tạo sản phẩm thành công");
            onClose?.();
        } catch (error) {
            message.error(error.message || "Có lỗi xảy ra");
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Open variant modal ───────────────────────────────────────────────
    const handleOpenVariantModal = (variant = null) => {
        setEditingVariant(variant);
        if (variant) {
            variantForm.setFieldsValue({
                color: variant.color ?? "",
                size: variant.size ?? undefined,
                sku: variant.sku ?? "",
                price: Number(variant.price) || 0,
                inventory: variant.inventory ?? 0,
            });
        } else {
            variantForm.resetFields();
        }
        setVariantModalOpen(true);
    };

    const handleCloseVariantModal = () => {
        setVariantModalOpen(false);
        setEditingVariant(null);
        variantForm.resetFields();
    };

    // ─── Save variant ─────────────────────────────────────────────────────
    const handleSaveVariant = async (values) => {
        if (!product?.id) return;
        setVariantSubmitting(true);
        try {
            const payload = {
                color: values.color?.trim() || "",
                size: values.size ?? "",
                sku: values.sku.trim(),
                price: values.price,
                inventory: values.inventory,
            };
            if (editingVariant) {
                await adminProductVariantService.update(product.id, editingVariant.id, payload);
                message.success("Cập nhật biến thể thành công");
            } else {
                await adminProductVariantService.create(product.id, payload);
                message.success("Tạo biến thể thành công");
            }
            handleCloseVariantModal();
            await loadVariants(product.id);
        } catch (e) {
            message.error(e?.response?.data?.message || e?.message || "Có lỗi khi lưu biến thể");
        } finally {
            setVariantSubmitting(false);
        }
    };

    // ─── Delete variant ───────────────────────────────────────────────────
    const handleDeleteVariant = async (variantId) => {
        if (!product?.id) return;
        try {
            await adminProductVariantService.remove(product.id, variantId);
            message.success("Đã xoá biến thể");
            await loadVariants(product.id);
        } catch (e) {
            message.error(e?.response?.data?.message || "Không thể xoá biến thể");
        }
    };

    // ─── Variant form fields theo category type ───────────────────────────
    const renderVariantFields = () => {
        const isClothing = categoryType === "clothing";
        const isShoes = categoryType === "shoes";
        const isFree = !isClothing && !isShoes; // bag + unknown

        return (
            <>
                {/* Màu: bắt buộc với quần áo, ẩn với giày, tùy chọn với túi/khác */}
                {!isShoes && (
                    <Form.Item
                        label="Màu sắc"
                        name="color"
                        rules={isClothing ? [{ required: true, message: "Vui lòng nhập màu sắc" }] : []}
                    >
                        <Input placeholder={isClothing ? "Vd: Đỏ, Xanh navy, Cream..." : "Không bắt buộc"} />
                    </Form.Item>
                )}

                {/* Size: select chữ cho quần áo, select số cho giày, input tự do cho túi/khác */}
                {isClothing && (
                    <Form.Item
                        label="Size"
                        name="size"
                        rules={[{ required: true, message: "Vui lòng chọn size" }]}
                    >
                        <Select
                            placeholder="Chọn size"
                            options={CLOTHING_SIZES.map((s) => ({ label: s, value: s }))}
                        />
                    </Form.Item>
                )}

                {isShoes && (
                    <Form.Item
                        label="Size (số)"
                        name="size"
                        rules={[{ required: true, message: "Vui lòng chọn size" }]}
                    >
                        <Select
                            placeholder="Chọn size giày"
                            options={SHOE_SIZES.map((s) => ({ label: s, value: s }))}
                        />
                    </Form.Item>
                )}

                {isFree && (
                    <Form.Item label="Size" name="size">
                        <Input placeholder="Không bắt buộc (Vd: Nhỏ, Vừa, Lớn...)" />
                    </Form.Item>
                )}

                <Form.Item
                    label="SKU biến thể"
                    name="sku"
                    rules={[{ required: true, message: "Vui lòng nhập SKU" }]}
                >
                    <Input placeholder="Vd: DOL01-RED-M" />
                </Form.Item>

                <Form.Item
                    label="Giá riêng (đ)"
                    name="price"
                    rules={[{ required: true, message: "Vui lòng nhập giá" }]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        formatter={(v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
                        placeholder="130000"
                    />
                </Form.Item>

                <Form.Item
                    label="Tồn kho"
                    name="inventory"
                    rules={[{ required: true, message: "Vui lòng nhập tồn kho" }]}
                >
                    <InputNumber style={{ width: "100%" }} min={0} placeholder="20" />
                </Form.Item>
            </>
        );
    };

    // ─── Variant table columns ────────────────────────────────────────────
    const variantColumns = [
        {
            title: "SKU",
            dataIndex: "sku",
            key: "sku",
            ellipsis: true,
        },
        {
            title: "Màu",
            dataIndex: "color",
            key: "color",
            render: (color) => color ? <Tag color="blue">{color}</Tag> : <span style={{ color: "#bbb" }}>—</span>,
        },
        {
            title: "Size",
            dataIndex: "size",
            key: "size",
            render: (size) => size ? <Tag>{size}</Tag> : <span style={{ color: "#bbb" }}>—</span>,
        },
        {
            title: "Giá (đ)",
            dataIndex: "price",
            key: "price",
            render: (price) => parseInt(price || 0).toLocaleString("vi-VN"),
        },
        {
            title: "Tồn kho",
            dataIndex: "inventory",
            key: "inventory",
            width: 80,
            render: (inv) => {
                const n = parseInt(inv || 0);
                if (n === 0) return <Tag color="red">0</Tag>;
                if (n < 5) return <Tag color="orange">{n}</Tag>;
                return <Tag color="green">{n}</Tag>;
            },
        },
        {
            title: "",
            key: "action",
            width: 90,
            render: (_, variant) => (
                <Space size={0}>
                    <Button
                        type="link"
                        size="small"
                        icon={<AiOutlineEdit />}
                        onClick={() => handleOpenVariantModal(variant)}
                    />
                    <Popconfirm
                        title="Xoá biến thể này?"
                        okText="Xoá"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDeleteVariant(variant.id)}
                    >
                        <Button danger type="link" size="small" icon={<AiOutlineDelete />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // ─── Tab items ────────────────────────────────────────────────────────
    const tabItems = [
        {
            key: "info",
            label: "Thông tin",
            children: (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                >
                    <Form.Item label="SKU" name="sku" rules={[{ required: true, message: "Vui lòng nhập SKU" }]}>
                        <Input placeholder="Vd: TEST001" />
                    </Form.Item>

                    <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
                        <Input placeholder="Vd: Áo thun cotton" />
                    </Form.Item>

                    <Form.Item label="Thương hiệu" name="brand" rules={[{ required: true, message: "Vui lòng nhập thương hiệu" }]}>
                        <Input placeholder="Vd: Dear Rose" />
                    </Form.Item>

                    <Form.Item label="Danh mục" name="category_id" rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}>
                        <Select
                            placeholder="Chọn danh mục"
                            options={categories.map((c) => ({ label: c.name, value: c.id }))}
                            onChange={(val) => setSelectedCategoryId(val)}
                        />
                    </Form.Item>

                    <Form.Item label="Giá (đ)" name="price" rules={[{ required: true, message: "Vui lòng nhập giá" }]}>
                        <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            formatter={(v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
                            placeholder="150000"
                        />
                    </Form.Item>

                    <Form.Item label="Tồn kho" name="inventory" rules={[{ required: true, message: "Vui lòng nhập tồn kho" }]}>
                        <InputNumber style={{ width: "100%" }} min={0} placeholder="10" />
                    </Form.Item>

                    <Form.Item label="Mô tả" name="description">
                        <Input.TextArea rows={3} placeholder="Mô tả chi tiết sản phẩm" />
                    </Form.Item>

                    <Form.Item label="Ảnh sản phẩm">
                        <ImageUploader
                            value={images}
                            onChange={setImages}
                            maxCount={1}
                            label="Ảnh sản phẩm"
                            customRequest={handleCloudinaryUpload}
                        />
                    </Form.Item>
                </Form>
            ),
        },
        {
            key: "variants",
            label: `Biến thể${variants.length ? ` (${variants.length})` : ""}`,
            disabled: !product,
            children: (
                <div>
                    {/* Hint theo loại danh mục */}
                    <Alert
                        message={CATEGORY_HINT[categoryType]}
                        type="info"
                        showIcon
                        style={{ marginBottom: 12 }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                        <Button
                            type="primary"
                            icon={<AiOutlinePlus />}
                            onClick={() => handleOpenVariantModal(null)}
                        >
                            Thêm biến thể
                        </Button>
                    </div>
                    <Table
                        columns={variantColumns}
                        dataSource={variants}
                        rowKey="id"
                        loading={variantLoading}
                        pagination={false}
                        size="small"
                        locale={{ emptyText: 'Chưa có biến thể nào. Nhấn "Thêm biến thể" để tạo.' }}
                    />
                </div>
            ),
        },
    ];

    // ─── Render ───────────────────────────────────────────────────────────
    return (
        <>
            <Drawer
                title={product ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
                placement="right"
                width={520}
                onClose={onClose}
                open={visible}
                footer={
                    activeTab === "info" ? (
                        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                            <Button onClick={onClose}>Huỷ</Button>
                            <Button
                                type="primary"
                                icon={<AiOutlineSave />}
                                loading={submitting}
                                onClick={() => form.submit()}
                            >
                                {submitting ? "Đang lưu..." : "Lưu"}
                            </Button>
                        </Space>
                    ) : null
                }
            >
                <Spin spinning={submitting}>
                    <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
                </Spin>
            </Drawer>

            {/* ─── Modal tạo / sửa biến thể ─────────────────────────────── */}
            <Modal
                title={editingVariant ? "Sửa biến thể" : "Thêm biến thể mới"}
                open={variantModalOpen}
                onCancel={handleCloseVariantModal}
                confirmLoading={variantSubmitting}
                okText={editingVariant ? "Cập nhật" : "Tạo"}
                cancelText="Huỷ"
                onOk={() => variantForm.submit()}
                destroyOnClose
            >
                <Alert
                    message={CATEGORY_HINT[categoryType]}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
                <Form
                    form={variantForm}
                    layout="vertical"
                    onFinish={handleSaveVariant}
                    autoComplete="off"
                >
                    {renderVariantFields()}
                </Form>
            </Modal>
        </>
    );
}

export default ProductForm;