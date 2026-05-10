import {
    Button,
    Checkbox,
    Drawer,
    Form,
    Input,
    InputNumber,
    Select,
    Space,
    Spin,
    message
} from "antd";
import { useEffect, useState } from "react";
import { AiOutlineSave } from "react-icons/ai";
import ImageUploader from "../../../components/admin/ImageUploader.jsx";

/**
 * ProductForm — Form thêm/sửa sản phẩm trong drawer
 * 
 * Props:
 *   visible    — boolean mở/đóng drawer
 *   product    — object sản phẩm (null nếu thêm mới)
 *   categories — array danh mục chọn
 *   loading    — boolean
 *   onSave     — async (formData) => void
 *   onClose    — () => void
 */
function ProductForm({
    visible = false,
    product = null,
    categories = [],
    loading = false,
    onSave,
    onClose
}) {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [images, setImages] = useState([]);

    // Reset form khi drawer mở
    useEffect(() => {
        if (visible && product) {
            // Chỉnh sửa sản phẩm cũ
            form.setFieldsValue({
                name: product.name,
                description: product.description,
                price: product.price,
                category_id: product.category_id,
                inventory: product.inventory,
                is_active: product.is_active
            });

            // Set ảnh nếu có
            if (product.img || product.images) {
                setImages([
                    {
                        uid: "main-image",
                        name: "main-image",
                        status: "done",
                        url: product.img
                    }
                ]);
            }
        } else if (visible) {
            // Tạo sản phẩm mới
            form.resetFields();
            setImages([]);
        }
    }, [visible, product, form]);

    const handleSubmit = async (values) => {
        if (images.length === 0) {
            message.error("Vui lòng upload ảnh sản phẩm");
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();

            // Text fields
            formData.append("name", values.name);
            formData.append("description", values.description || "");
            formData.append("price", values.price);
            formData.append("category_id", values.category_id);
            formData.append("inventory", values.inventory);
            formData.append("is_active", values.is_active ? 1 : 0);

            // Images
            images.forEach((img, index) => {
                if (img.originFileObj) {
                    formData.append(`images[${index}]`, img.originFileObj);
                }
            });

            await onSave?.(formData);
            message.success(product ? "Cập nhật sản phẩm thành công" : "Tạo sản phẩm thành công");
            onClose?.();
        } catch (error) {
            message.error(error.message || "Có lỗi xảy ra");
        } finally {
            setSubmitting(false);
        }
    };

    const isEditing = !!product;

    return (
        <Drawer
            title={isEditing ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
            placement="right"
            width={500}
            onClose={onClose}
            open={visible}
            footer={
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
            }
        >
            <Spin spinning={submitting}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                >
                    {/* Tên sản phẩm */}
                    <Form.Item
                        label="Tên sản phẩm"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
                    >
                        <Input placeholder="Vd: Đầm xoè hoa xinh xắn" />
                    </Form.Item>

                    {/* Mô tả */}
                    <Form.Item
                        label="Mô tả"
                        name="description"
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Mô tả chi tiết sản phẩm"
                        />
                    </Form.Item>

                    {/* Danh mục */}
                    <Form.Item
                        label="Danh mục"
                        name="category_id"
                        rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
                    >
                        <Select
                            placeholder="Chọn danh mục"
                            options={categories.map((cat) => ({
                                label: cat.name,
                                value: cat.id
                            }))}
                        />
                    </Form.Item>

                    {/* Giá */}
                    <Form.Item
                        label="Giá (đ)"
                        name="price"
                        rules={[{ required: true, message: "Vui lòng nhập giá" }]}
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            placeholder="0"
                            min={0}
                            formatter={(value) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
                        />
                    </Form.Item>

                    {/* Tồn kho */}
                    <Form.Item
                        label="Tồn kho"
                        name="inventory"
                        rules={[{ required: true, message: "Vui lòng nhập tồn kho" }]}
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            placeholder="0"
                            min={0}
                        />
                    </Form.Item>

                    {/* Trạng thái */}
                    <Form.Item
                        name="is_active"
                        valuePropName="checked"
                    >
                        <Checkbox>Hoạt động</Checkbox>
                    </Form.Item>

                    {/* Image uploader */}
                    <Form.Item label="Ảnh sản phẩm (tối đa 5 ảnh)">
                        <ImageUploader
                            value={images}
                            onChange={setImages}
                            maxCount={5}
                            label="Ảnh sản phẩm"
                        />
                    </Form.Item>
                </Form>
            </Spin>
        </Drawer>
    );
}

export default ProductForm;
