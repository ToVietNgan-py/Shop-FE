import {
    Button,
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

function ProductForm({ visible = false, product = null, categories = [], onSave, onClose }) {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [images, setImages] = useState([]);

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
            setImages(
                product.img
                    ? [{ uid: "existing", name: "image", status: "done", url: product.img }]
                    : []
            );
        } else if (visible) {
            form.resetFields();
            setImages([]);
        }
    }, [visible, product, form]);

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

            // Nếu user chọn file mới thì upload file, ngược lại giữ url cũ
            const newFile = images.find((img) => img.originFileObj);
            if (newFile) {
                formData.append("img", newFile.originFileObj);
            } else if (images[0]?.url) {
                formData.append("img", images[0].url);
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

    return (
        <Drawer
            title={product ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
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
                <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
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
                        <ImageUploader value={images} onChange={setImages} maxCount={1} label="Ảnh sản phẩm" />
                    </Form.Item>
                </Form>
            </Spin>
        </Drawer>
    );
}

export default ProductForm;