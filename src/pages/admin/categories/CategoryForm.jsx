import {
    Button,
    Checkbox,
    Form,
    Input,
    Modal,
    Spin,
    message
} from "antd";
import { useEffect, useState } from "react";
import { AiOutlineSave } from "react-icons/ai";

/**
 * CategoryForm — Form thêm/sửa danh mục trong modal
 * 
 * Props:
 *   visible    — boolean mở/đóng modal
 *   category   — object danh mục (null nếu thêm mới)
 *   loading    — boolean
 *   onSave     — async (formData) => void
 *   onClose    — () => void
 */
function CategoryForm({
    visible = false,
    category = null,
    loading = false,
    onSave,
    onClose
}) {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // Reset form khi modal mở
    useEffect(() => {
        if (visible && category) {
            // Chỉnh sửa danh mục cũ
            form.setFieldsValue({
                name: category.name,
                slug: category.slug,
                description: category.description,
                is_active: category.is_active
            });
        } else if (visible) {
            // Tạo danh mục mới
            form.resetFields();
        }
    }, [visible, category, form]);

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const formData = {
                name: values.name,
                slug: values.slug,
                description: values.description || "",
                is_active: values.is_active ? 1 : 0
            };

            await onSave?.(formData);
            message.success(category ? "Cập nhật danh mục thành công" : "Tạo danh mục thành công");
            onClose?.();
        } catch (error) {
            message.error(error.message || "Có lỗi xảy ra");
        } finally {
            setSubmitting(false);
        }
    };

    const isEditing = !!category;

    return (
        <Modal
            title={isEditing ? "Sửa danh mục" : "Thêm danh mục mới"}
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
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
                </Button>
            ]}
        >
            <Spin spinning={submitting}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                >
                    {/* Tên danh mục */}
                    <Form.Item
                        label="Tên danh mục"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
                    >
                        <Input placeholder="Vd: Đầm dạo phố" />
                    </Form.Item>

                    {/* Slug */}
                    <Form.Item
                        label="Slug (đường dẫn thân thiện)"
                        name="slug"
                        rules={[
                            { required: true, message: "Vui lòng nhập slug" },
                            {
                                pattern: /^[a-z0-9-]+$/,
                                message: "Slug chỉ chứa chữ cái thường, số và dấu gạch ngang"
                            }
                        ]}
                    >
                        <Input placeholder="Vd: dam-dao-pho" />
                    </Form.Item>

                    {/* Mô tả */}
                    <Form.Item
                        label="Mô tả"
                        name="description"
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Mô tả danh mục"
                        />
                    </Form.Item>

                    {/* Trạng thái */}
                    <Form.Item
                        name="is_active"
                        valuePropName="checked"
                    >
                        <Checkbox>Hoạt động</Checkbox>
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
}

export default CategoryForm;
