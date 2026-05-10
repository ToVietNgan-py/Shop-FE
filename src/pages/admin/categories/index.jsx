import { Button, Modal, message } from "antd";
import { useEffect, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import CategoryTable from "./CategoryTable.jsx";
import CategoryForm from "./CategoryForm.jsx";
import { adminCategoryService } from "../../../services/admin/adminCategoryService.js";
import "../_shared/admin-page.scss";

/**
 * Admin Categories Page — Quản lý danh mục sản phẩm
 * - Hiển thị danh sách danh mục
 * - Thêm/Sửa/Xóa danh mục
 */
function AdminCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, per_page: 10, total: 0 });
    const [loading, setLoading] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Load danh sách danh mục
    const loadCategories = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const result = await adminCategoryService.list({
                page,
                per_page: pageSize
            });

            setCategories(result.items || []);
            setMeta(result.meta || { current_page: page, per_page: pageSize, total: 0 });
        } catch (error) {
            message.error("Không thể tải danh sách danh mục");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Load dữ liệu khi component mount
    useEffect(() => {
        loadCategories();
    }, []);

    // Xử lý thêm/sửa danh mục
    const handleSaveCategory = async (formData) => {
        try {
            if (selectedCategory) {
                // Sửa danh mục
                await adminCategoryService.update(selectedCategory.id, formData);
            } else {
                // Tạo danh mục mới
                await adminCategoryService.create(formData);
            }

            loadCategories(meta.current_page);
            setFormVisible(false);
            setSelectedCategory(null);
        } catch (error) {
            throw new Error(error.response?.data?.message || "Có lỗi khi lưu danh mục");
        }
    };

    // Xử lý mở form sửa
    const handleEditCategory = (category) => {
        setSelectedCategory(category);
        setFormVisible(true);
    };

    // Xử lý xóa danh mục
    const handleDeleteCategory = (categoryId) => {
        Modal.confirm({
            title: "Xóa danh mục?",
            content: "Hành động này không thể hoàn tác. Bạn có chắc chắn? (Các sản phẩm trong danh mục sẽ không bị xóa)",
            okText: "Xóa",
            cancelText: "Huỷ",
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await adminCategoryService.remove(categoryId);
                    message.success("Xóa danh mục thành công");
                    loadCategories(meta.current_page);
                } catch (error) {
                    message.error(error.response?.data?.message || "Không thể xóa danh mục");
                }
            }
        });
    };

    // Xử lý mở form tạo mới
    const handleAddCategory = () => {
        setSelectedCategory(null);
        setFormVisible(true);
    };

    // Xử lý đóng form
    const handleCloseForm = () => {
        setFormVisible(false);
        setSelectedCategory(null);
    };

    // Xử lý thay đổi trang/pageSize
    const handleTableChange = (page, pageSize) => {
        loadCategories(page, pageSize);
    };

    return (
        <div className="admin-page">
            <div className="admin-page__toolbar">
                <div>
                    <h2 className="admin-page__title">Danh mục</h2>
                    <div className="admin-page__subtitle">Quản lý nhóm sản phẩm hiển thị trên cửa hàng.</div>
                </div>
                <Button type="primary" icon={<AiOutlinePlus />} onClick={handleAddCategory}>
                    Thêm danh mục
                </Button>
            </div>

            <div className="admin-page__card">
                <CategoryTable
                    data={categories}
                    meta={meta}
                    loading={loading}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                    onChange={handleTableChange}
                />
            </div>

            <CategoryForm
                visible={formVisible}
                category={selectedCategory}
                loading={loading}
                onSave={handleSaveCategory}
                onClose={handleCloseForm}
            />
        </div>
    );
}

export default AdminCategoriesPage;
