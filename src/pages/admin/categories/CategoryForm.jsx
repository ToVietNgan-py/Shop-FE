import { Button, Form, Input, Modal, Spin, Upload, message } from "antd";
import { useEffect, useState } from "react";
import { AiOutlineSave, AiOutlineUpload } from "react-icons/ai";

function CategoryForm({ visible = false, category = null, onSave, onClose }) {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [iconFile, setIconFile] = useState(null);   // File object chờ upload
    const [iconPreview, setIconPreview] = useState(null); // URL preview

    useEffect(() => {
        if (visible && category) {
            form.setFieldsValue({ name: category.name });
            // Nếu category đã có icon_url thì hiển thị preview
            setIconPreview(category.icon_url ?? null);
        } else if (visible) {
            form.resetFields();
            setIconPreview(null);
        }
        // Reset file mỗi lần mở form
        setIconFile(null);
    }, [visible, category, form]);

    // Xử lý chọn file — không upload ngay, chờ submit
    const handleBeforeUpload = (file) => {
        const isImage = file.type.startsWith("image/");
        if (!isImage) {
            message.error("Chỉ chấp nhận file ảnh (jpg, png, webp...)");
            return Upload.LIST_IGNORE;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error("Ảnh phải nhỏ hơn 2MB");
            return Upload.LIST_IGNORE;
        }
        setIconFile(file);
        setIconPreview(URL.createObjectURL(file));
        return false; // Ngăn antd tự upload
    };

    const handleRemoveIcon = () => {
        setIconFile(null);
        setIconPreview(null);
    };

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            await onSave?.({
                name: values.name,
                iconFile: iconFile ?? null, // Truyền file lên index.jsx xử lý
            });
        } catch (error) {
            message.error(error.message || "Có lỗi xảy ra");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title={category ? "Sửa danh mục" : "Thêm danh mục mới"}
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose} disabled={submitting}>
                    Huỷ
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    icon={<AiOutlineSave />}
                    loading={submitting}
                    onClick={() => form.submit()}
                >
                    {submitting ? "Đang lưu..." : "Lưu"}
                </Button>,
            ]}
        >
            <Spin spinning={submitting}>
                <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
                    <Form.Item
                        label="Tên danh mục"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
                    >
                        <Input placeholder="Vd: Quần áo" />
                    </Form.Item>

                    <Form.Item label="Icon danh mục">
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {/* Preview icon hiện tại hoặc file vừa chọn */}
                            {iconPreview && (
                                <img
                                    src={iconPreview}
                                    alt="icon preview"
                                    style={{
                                        width: 56,
                                        height: 56,
                                        objectFit: "cover",
                                        borderRadius: 8,
                                        border: "1px solid #e5e7eb",
                                    }}
                                />
                            )}
                            <Upload
                                accept="image/*"
                                showUploadList={false}
                                beforeUpload={handleBeforeUpload}
                            >
                                <Button icon={<AiOutlineUpload />}>
                                    {iconPreview ? "Đổi icon" : "Chọn icon"}
                                </Button>
                            </Upload>
                            {iconPreview && (
                                <Button type="text" danger size="small" onClick={handleRemoveIcon}>
                                    Xoá
                                </Button>
                            )}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, color: "#9ca3af" }}>
                            Hỗ trợ JPG, PNG, WEBP — tối đa 2MB
                        </div>
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
}

export default CategoryForm;