import { App, Button, Input } from "antd";
import { useEffect, useState, useMemo } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import ProductTable from "./ProductTable.jsx";
import ProductForm from "./ProductForm.jsx";
import adminProductService from "../../../services/admin/adminProductService.js";
import adminCategoryService from "../../../services/admin/adminCategoryService.js";
import "../_shared/admin-page.scss";

function AdminProductsPage() {
    const { modal, message } = App.useApp();

    // ─── Master list (tải 1 lần, không bao giờ thay đổi trừ khi CRUD) ───
    const [allProducts, setAllProducts] = useState([]);

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // ─── Filter state ────────────────────────────────────────────────────
    const [searchText, setSearchText] = useState("");

    // ─── Pagination state (FE-side) ──────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // ─── Load toàn bộ sản phẩm 1 lần ────────────────────────────────────
    const loadProducts = async () => {
        setLoading(true);
        try {
            const result = await adminProductService.list({ page: 1, per_page: 10000 });
            setAllProducts(result.items || []);
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

    // ─── Filter thuần FE — chạy lại mỗi khi searchText / allProducts đổi ─
    const filteredProducts = useMemo(() => {
        const keyword = searchText.trim().toLowerCase();
        if (!keyword) return allProducts;

        return allProducts.filter((p) =>
            p.name?.toLowerCase().includes(keyword) ||
            p.sku?.toLowerCase().includes(keyword) ||
            p.category?.name?.toLowerCase().includes(keyword)
        );
    }, [searchText, allProducts]);

    // ─── Reset về trang 1 khi kết quả lọc thay đổi ───────────────────────
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredProducts]);

    // ─── Meta object cho DataTable / ProductTable ─────────────────────────
    const meta = {
        current_page: currentPage,
        per_page: pageSize,
        total: filteredProducts.length,
    };

    // ─── Slice data cho trang hiện tại ───────────────────────────────────
    const pagedProducts = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredProducts.slice(start, start + pageSize);
    }, [filteredProducts, currentPage, pageSize]);

    // ─── CRUD handlers ────────────────────────────────────────────────────
    const handleSaveProduct = async (formData) => {
        try {
            if (selectedProduct) {
                await adminProductService.update(selectedProduct.id, formData);
            } else {
                await adminProductService.create(formData);
            }
            message.success(
                selectedProduct ? "Cập nhật sản phẩm thành công" : "Tạo sản phẩm thành công"
            );
            handleCloseForm();
            await loadProducts(); // reload master list
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
                    await loadProducts(); // reload master list
                } catch (error) {
                    message.error(
                        error.response?.data?.message || "Không thể xóa sản phẩm"
                    );
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

    // ─── Pagination callback từ ProductTable / DataTable ─────────────────
    const handleTableChange = (page, size) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    return (
        <div className="admin-page">
            <div className="admin-page__toolbar">
                <div>
                    <h2 className="admin-page__title">Sản phẩm</h2>
                    <div className="admin-page__subtitle">
                        Quản lý danh sách sản phẩm và thông tin tồn kho.
                    </div>
                </div>
                <Button type="primary" icon={<AiOutlinePlus />} onClick={handleAddProduct}>
                    Thêm sản phẩm
                </Button>
            </div>

            <Input.Search
                placeholder="Tìm theo tên, SKU, danh mục..."
                allowClear
                style={{ width: 300, marginBottom: 16 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                // Hỗ trợ cả nhấn nút kính lúp
                onSearch={(value) => setSearchText(value)}
            />

            <div className="admin-page__card">
                <ProductTable
                    data={pagedProducts}
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