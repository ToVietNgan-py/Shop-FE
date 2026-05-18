import { App, Button } from "antd";
import { useEffect, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import ProductTable from "./ProductTable.jsx";
import ProductForm from "./ProductForm.jsx";
import { ProductService } from "../../../services/admin/adminProductService.js";
import { CategoryService } from "../../../services/admin/adminCategoryService.js";
import "../_shared/admin-page.scss";

function AdminProductsPage() {
    const { modal, message } = App.useApp();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, per_page: 10, total: 0 });
    const [loading, setLoading] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const loadProducts = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const result = await adminProductService.list({ page, per_page: pageSize });
            setProducts(result.items || []);
            setMeta(result.meta || { current_page: page, per_page: pageSize, total: 0 });
        } catch (error) {
            message.error("Không thể tải danh sách sản phẩm");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const result = await adminCategoryService.list();
            setCategories(result.items || []);
        } catch (error) {
            console.error("Không thể tải danh mục", error);
        }
    };

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    const handleSaveProduct = async (formData) => {
        try {
            if (selectedProduct) {
                await adminProductService.update(selectedProduct.id, formData);
            } else {
                await adminProductService.create(formData);
            }
            message.success(selectedProduct ? "Cập nhật sản phẩm thành công" : "Tạo sản phẩm thành công");
            handleCloseForm();
            loadProducts(meta.current_page);
        } catch (error) {
            throw new Error(error.response?.data?.message || "Có lỗi khi lưu sản phẩm");
        }
    };

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setFormVisible(true);
    };

    const handleDeleteProduct = (productId) => {
        modal.confirm({
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
            },
        });
    };

    const handleAddProduct = () => {
        setSelectedProduct(null);
        setFormVisible(true);
    };

    const handleCloseForm = () => {
        setFormVisible(false);
        setSelectedProduct(null);
    };

    const handleTableChange = (page, pageSize) => {
        loadProducts(page, pageSize);
    };

    return (
        <div className="admin-page">
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