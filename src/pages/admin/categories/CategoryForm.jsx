import { Button, Form, Input, Modal, Spin, message } from "antd";
import { useEffect, useState } from "react";
import { AiOutlineSave } from "react-icons/ai";

function CategoryForm({ visible = false, category = null, onSave, onClose }) {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (visible && category) {
            form.setFieldsValue({ name: category.name });
        } else if (visible) {
            form.resetFields();
        }
    }, [visible, category, form]);

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            await onSave?.({ name: values.name });
            message.success(category ? "Cập nhật danh mục thành công" : "Tạo danh mục thành công");
            onClose?.();
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
                <Button key="cancel" onClick={onClose}>Huỷ</Button>,
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
                <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
                    <Form.Item
                        label="Tên danh mục"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
                    >
                        <Input placeholder="Vd: Quần áo" />
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
}

export default CategoryForm;