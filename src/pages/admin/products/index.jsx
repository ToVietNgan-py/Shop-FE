import { Button, Modal, message } from "antd";
import { useEffect, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import ProductTable from "./ProductTable.jsx";
import ProductForm from "./ProductForm.jsx";
import { adminProductService } from "../../../services/admin/adminProductService.js";
import { adminCategoryService } from "../../../services/admin/adminCategoryService.js";
import "../_shared/admin-page.scss";

/**
 * Admin Products Page — Quản lý sản phẩm
 * - Hiển thị danh sách sản phẩm
 * - Thêm/Sửa/Xóa sản phẩm
 */
function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, per_page: 10, total: 0 });
    const [loading, setLoading] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Load danh sách sản phẩm
    const loadProducts = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const result = await adminProductService.list({
                page,
                per_page: pageSize
            });

            setProducts(result.items || []);
            setMeta(result.meta || { current_page: page, per_page: pageSize, total: 0 });
        } catch (error) {
            message.error("Không thể tải danh sách sản phẩm");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Load danh mục
    const loadCategories = async () => {
        try {
            const result = await adminCategoryService.list();
            setCategories(result.items || []);
        } catch (error) {
            console.error("Không thể tải danh mục", error);
        }
    };

    // Load dữ liệu khi component mount
    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    // Xử lý thêm/sửa sản phẩm
    const handleSaveProduct = async (formData) => {
        try {
            if (selectedProduct) {
                // Sửa sản phẩm
                await adminProductService.update(selectedProduct.id, formData);
            } else {
                // Tạo sản phẩm mới
                await adminProductService.create(formData);
            }

            loadProducts(meta.current_page);
            setFormVisible(false);
            setSelectedProduct(null);
        } catch (error) {
            throw new Error(error.response?.data?.message || "Có lỗi khi lưu sản phẩm");
        }
    };

    // Xử lý mở form sửa
    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setFormVisible(true);
    };

    // Xử lý xóa sản phẩm
    const handleDeleteProduct = (productId) => {
        Modal.confirm({
            title: "Xóa sản phẩm?",
            content: "Hành động này không thể hoàn tác. Bạn có chắc chắn?",
            okText: "Xóa",
            cancelText: "Huỷ",
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await adminProductService.remove(productId);
                    message.success("Xóa sản phẩm thành công");
                    loadProducts(meta.current_page);
                } catch (error) {
                    message.error(error.response?.data?.message || "Không thể xóa sản phẩm");
                }
            }
        });
    };

    // Xử lý mở form tạo mới
    const handleAddProduct = () => {
        setSelectedProduct(null);
        setFormVisible(true);
    };

    // Xử lý đóng form
    const handleCloseForm = () => {
        setFormVisible(false);
        setSelectedProduct(null);
    };

    // Xử lý thay đổi trang/pageSize
    const handleTableChange = (page, pageSize) => {
        loadProducts(page, pageSize);
    };

    return (
        <div className="admin-page">
            <div className="admin-page__breadcrumbs">Home / Admin / Sản phẩm</div>
            <div className="admin-page__toolbar">
                <div>
                    <h2 className="admin-page__title">Sản phẩm</h2>
                    <div className="admin-page__subtitle">Quản lý danh sách sản phẩm và thông tin tồn kho.</div>
                </div>
                <Button type="primary" icon={<AiOutlinePlus />} onClick={handleAddProduct}>
                    Thêm sản phẩm
                </Button>
            </div>

            <div className="admin-page__card">
                <ProductTable
                    data={products}
                    meta={meta}
                    loading={loading}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    onChange={handleTableChange}
                />
            </div>

            <ProductForm
                visible={formVisible}
                product={selectedProduct}
                categories={categories}
                loading={loading}
                onSave={handleSaveProduct}
                onClose={handleCloseForm}
            />
        </div>
    );
}

export default AdminProductsPage;
