import { App, Button } from "antd";
import { useEffect, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import CategoryTable from "./CategoryTable.jsx";
import CategoryForm from "./CategoryForm.jsx";
import { adminCategoryService } from "../../../services/admin/adminCategoryService.js";
import "../_shared/admin-page.scss";

function AdminCategoriesPage() {
    // ✅ Dùng hook thay vì Modal.confirm / message static
    // — tránh lỗi "missing context" khiến modal không hiện
    const { modal, message } = App.useApp();

    const [categories, setCategories] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, per_page: 10, total: 0 });
    const [loading, setLoading] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const loadCategories = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const result = await adminCategoryService.list({ page, per_page: pageSize });
            setCategories(result.items || []);
            setMeta(result.meta || { current_page: page, per_page: pageSize, total: 0 });
        } catch (error) {
            message.error("Không thể tải danh sách danh mục");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleSaveCategory = async ({ name, iconFile }) => {
        try {
            let savedCategory;

            if (selectedCategory) {
                const res = await adminCategoryService.update(selectedCategory.id, { name });
                savedCategory = res?.data ?? { id: selectedCategory.id };
            } else {
                const res = await adminCategoryService.create({ name });
                savedCategory = res?.data ?? res;
            }

            if (iconFile && savedCategory?.id) {
                try {
                    await adminCategoryService.uploadIcon(savedCategory.id, iconFile);
                } catch {
                    message.warning("Lưu danh mục thành công nhưng upload icon thất bại");
                }
            }

            message.success(selectedCategory ? "Cập nhật danh mục thành công" : "Tạo danh mục thành công");
            handleCloseForm();
            loadCategories(meta.current_page);
        } catch (error) {
            throw new Error(error.response?.data?.message || "Có lỗi khi lưu danh mục");
        }
    };

    const handleEditCategory = (category) => {
        setSelectedCategory(category);
        setFormVisible(true);
    };

    const handleDeleteCategory = (categoryId) => {
        // ✅ modal.confirm từ hook — hoạt động đúng trong mọi trường hợp
        modal.confirm({
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
            },
        });
    };

    const handleAddCategory = () => {
        setSelectedCategory(null);
        setFormVisible(true);
    };

    const handleCloseForm = () => {
        setFormVisible(false);
        setSelectedCategory(null);
    };

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
                onSave={handleSaveCategory}
                onClose={handleCloseForm}
            />
        </div>
    );
}

export default AdminCategoriesPage;