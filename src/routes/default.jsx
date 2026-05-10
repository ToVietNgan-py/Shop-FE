import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/users/homePage/index.jsx";
import BeautyBlog from "../pages/users/Blog/index.jsx";
import ProductPage from "../pages/users/productPage/index.jsx";
import ReturnPolicy from "../pages/users/returnPolicy/index.jsx";
import ShippingPolicy from "../pages/users/shippingPolicy/index.jsx";
import PrivacyPolicy from "../pages/users/privacyPolicy/index.jsx";
import TermOfService from "../pages/users/termOfService/index.jsx";
import CategoryPage from "../pages/users/CategoryPage/index.jsx";
import ProductDetail from "../pages/users/ProductDetail/ProducDetail.jsx";
import CheckoutPage from "../pages/users/Checkout/index.jsx";
import PaymentResult from "../pages/users/PaymentResult/index.jsx";
import MyOrders from "../pages/users/MyOrders/index.jsx";
import OrderDetail from "../pages/users/OrderDetail/index.jsx";
import ProfilePage from "../pages/users/Profile/index.jsx";
import LoginPage from "../pages/users/auth/LoginPage.jsx";
import RequireRole from "../pages/admin/_guard/RequireRole.jsx";
import AdminLayout from "../pages/admin/_layout/AdminLayout.jsx";
import AdminDashboardPage from "../pages/admin/dashboard/index.jsx";
import AdminModulePage from "../pages/admin/_shared/AdminModulePage.jsx";
import OrdersAdminPage from "../pages/admin/orders/index.jsx";
import VoucherModal from "../pages/admin/vouchers/index.jsx";
import AdminAccount from "../pages/admin/accounts/index.jsx";
import RequireAuth from "../components/RequireAuth/RequireAuth.jsx"; function AppRoutes() {
    return (
        <div>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/san-pham" element={<ProductPage />} />
                <Route path="/blog" element={<BeautyBlog />} />
                <Route path="/return" element={<ReturnPolicy />} />
                <Route path="/shipping" element={<ShippingPolicy />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermOfService />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/san-pham/:id" element={<ProductDetail />} />
                <Route path="/thanh-toan" element={<RequireAuth> <CheckoutPage /> </RequireAuth>} />
                <Route path="/thanh-toan/ket-qua" element={<PaymentResult />} />
                <Route path="/tai-khoan" element={<ProfilePage />} />
                <Route path="/don-hang" element={<MyOrders />} />
                <Route path="/don-hang/:id" element={<OrderDetail />} />
                <Route path="/login" element={<LoginPage />} />

                <Route
                    path="/admin"
                    element={
                        <RequireRole role="admin|employee">
                            <AdminLayout />
                        </RequireRole>
                    }
                >
                    <Route index element={<AdminDashboardPage />} />
                    <Route
                        path="san-pham"
                        element={
                            <AdminModulePage
                                title="Quản lý sản phẩm"
                                description="Khung chung cho CRUD sản phẩm, ảnh phụ, tìm kiếm và phân trang."
                                highlights={[
                                    "DataTable dùng chung cho list sản phẩm",
                                    "ImageUploader cho ảnh chính/ảnh phụ",
                                    "Service adminProductService để đồng bộ API"
                                ]}
                            />
                        }
                    />
                    <Route
                        path="loai-san-pham"
                        element={
                            <AdminModulePage
                                title="Quản lý danh mục"
                                description="Khung chung cho danh mục, icon, soft delete và validation khi xóa."
                                highlights={[
                                    "DataTable + modal CRUD đơn giản",
                                    "Tái sử dụng PageHeader và ConfirmAction",
                                    "Service adminCategoryService"
                                ]}
                            />
                        }
                    />
                    <Route
                        path="don-hang"
                        element={<OrdersAdminPage />}
                    />
                    <Route
                        path="khuyen-mai"
                        element={
                            <VoucherModal />
                        }
                    />
                    <Route
                        path="tai-khoan"
                        element={
                            <AdminAccount />
                        }
                    />

                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

export default AppRoutes;
