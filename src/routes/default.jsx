import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/users/homePage/index.jsx";
import BeautyBlog from "../pages/users/Blog/index.jsx";
import ProductPage from "../pages/users/productPage/index.jsx";
import ReturnPolicy from "../pages/users/returnPolicy/index.jsx";
import ShippingPolicy from "../pages/users/shippingPolicy/index.jsx";
import PrivacyPolicy from "../pages/users/privacyPolicy/index.jsx";
import TermOfService from "../pages/users/termOfService/index.jsx";
import ProductDetail from "../pages/users/ProductDetail/ProducDetail.jsx";
import CheckoutPage from "../pages/users/Checkout/index.jsx";
import PaymentResult from "../pages/users/PaymentResult/index.jsx";
import MyOrders from "../pages/users/MyOrders/index.jsx";
import OrderDetail from "../pages/users/OrderDetail/index.jsx";
import ReviewOrderPage from "../pages/users/ReviewOrder/index.jsx";
import ProfilePage from "../pages/users/Profile/index.jsx";
import WishlistPage from "../pages/users/Wishlist/index.jsx";
import LoginPage from "../pages/users/auth/LoginPage.jsx";
import RequireRole from "../pages/admin/_guard/RequireRole.jsx";
import AdminLayout from "../pages/admin/_layout/AdminLayout.jsx";
import AdminDashboardPage from "../pages/admin/dashboard/index.jsx";
import AdminProductsPage from "../pages/admin/products/index.jsx";
import AdminCategoriesPage from "../pages/admin/categories/index.jsx";
import AdminModulePage from "../pages/admin/_shared/AdminModulePage.jsx";
import OrdersAdminPage from "../pages/admin/orders/index.jsx";
import VouchersPage from "../pages/admin/vouchers/index.jsx";
import PromotionsPage from "../pages/admin/promotions/index.jsx";
import AdminAccount from "../pages/admin/accounts/index.jsx";
import RequireAuth from "../components/RequireAuth/RequireAuth.jsx";
import PromotionListPage from "../pages/admin/promotions/PromotionListPage.jsx";
import PromotionStatsPage from "../pages/admin/promotions/PromotionStatsPage.jsx";
import ProductListingPage from "../pages/users/ProductListingPage/ProductListingPage.jsx";
function AppRoutes() {
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
                <Route path="/category/:slug" element={<ProductPage />} />
                <Route path="/san-pham/:id" element={<ProductDetail />} />
                <Route path="/thanh-toan" element={<RequireAuth> <CheckoutPage /> </RequireAuth>} />
                <Route path="/thanh-toan/ket-qua" element={<PaymentResult />} />
                <Route path="/tai-khoan" element={<ProfilePage />} />
                <Route path="/yeu-thich" element={<RequireAuth><WishlistPage /></RequireAuth>} />
                <Route path="/don-hang" element={<MyOrders />} />
                <Route path="/don-hang/:id" element={<OrderDetail />} />
                <Route path="/don-hang/:id/danh-gia" element={<ReviewOrderPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/san-pham" element={<ProductListingPage />} />
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
                        element={<AdminProductsPage />}
                    />
                    <Route
                        path="loai-san-pham"
                        element={<AdminCategoriesPage />}
                    />
                    <Route
                        path="don-hang"
                        element={<OrdersAdminPage />}
                    />
                    <Route
                        path="khuyen-mai"
                        element={<VouchersPage />}
                    />
                    <Route
                        path="promotions"
                        element={<PromotionsPage />}
                    />
                    <Route
                        path="promotions"
                        element={<PromotionListPage />}
                    />
                    <Route
                        path="promotions/:id/stats"
                        element={<PromotionStatsPage />}
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
