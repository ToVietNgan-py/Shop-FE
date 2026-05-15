import { memo, useState, useContext } from "react";
import "./style.scss";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineSearch, AiOutlineUser, AiOutlineShoppingCart, AiOutlineMenu, AiOutlineRight } from "react-icons/ai";
import { FiBriefcase, FiShoppingBag, FiTag } from "react-icons/fi";
import AuthModal from "../../../../components/AuthModal/AuthModal.jsx";
import Cart from "../../../../components/Cart";
import { AuthContext } from "../../../../context/AuthContext";
import { CartContext } from "../../../../context/CartContext";
import UserDropdown from "../../../../components/UserDropdown/UserDropdown.jsx";
import NotificationBell from '../../../../components/notifications/NotificationBell';
const categoryItems = [
    { label: "QUẦN ÁO", slug: "quan-ao", icon: FiShoppingBag },
    { label: "GIÀY DÉP", slug: "giay-dep", icon: FiTag },
    { label: "TÚI SÁCH", slug: "tui-sach", icon: FiBriefcase }
];

const Header = () => {
    const { user, loading, logout } = useContext(AuthContext);
    const { cartCount } = useContext(CartContext);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [keyword, setKeyword] = useState("");
    const navigate = useNavigate();

    const handleSearch = (event) => {
        event.preventDefault();
        const trimmedKeyword = keyword.trim();

        if (!trimmedKeyword) {
            navigate("/san-pham");
            return;
        }

        navigate(`/san-pham?tu-khoa=${encodeURIComponent(trimmedKeyword)}`);
    };

    const handleCategorySelect = (slug) => {
        setIsCategoryOpen(false);
        navigate(`/category/${slug}`);
    };

    return (
        <header className="header-container">
            <div className="header-top">
                <div className="header-inner">
                    <div className="promo-marquee" aria-label="Khuyen mai">
                        <div className="promo-track">
                            <span>NHẬP MÃ T03FREESHIP30K - GIẢM NGAY 30K CHO ĐƠN HÀNG 199K</span>
                            <span>NHẬP MÃ T03FREESHIP30K - GIẢM NGAY 30K CHO ĐƠN HÀNG 199K</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="header-middle">
                <div className="header-inner content">
                    <Link to="/" className="logo">
                        <img src="/logo.png" alt="Logo" />
                    </Link>

                    <form className="search-box" onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="Bạn cần tìm ..."
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                        />
                        <button type="submit" aria-label="Tìm kiếm sản phẩm">
                            <AiOutlineSearch />
                        </button>
                    </form>

                    <div className="header-actions">
                        {loading ? (
                            <button type="button" className="user-auth-btn user-auth-btn--loading" disabled aria-label="Đang tải tài khoản">
                                <span className="user-auth-skeleton" />
                                <span className="auth-label">Đang tải...</span>
                            </button>
                        ) : user ? (
                            <>
                                <NotificationBell />
                                <UserDropdown user={user} onLogout={logout} />

                            </>
                        ) : (
                            <button
                                type="button"
                                className="user-auth-btn"
                                onClick={() => setIsAuthOpen(true)}
                                aria-label="Đăng nhập"
                            >
                                <AiOutlineUser className="icon" />
                                <span className="auth-label">Đăng nhập</span>
                            </button>
                        )}
                        <div className="cart-icon" onClick={() => setIsCartOpen(true)}>
                            <AiOutlineShoppingCart className="icon" />
                            <span className="badge">{cartCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            <nav className="header-bottom">
                <div className="header-inner">
                    {isCategoryOpen ? (
                        <button
                            type="button"
                            className="category-backdrop"
                            aria-label="Đóng danh mục sản phẩm"
                            onClick={() => setIsCategoryOpen(false)}
                        />
                    ) : null}
                    <ul className="menu-list">
                        <li className="category-menu">
                            <button
                                type="button"
                                className="category-trigger"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setIsCategoryOpen((prev) => !prev);
                                }}
                                aria-expanded={isCategoryOpen}
                                aria-label="Mở danh mục sản phẩm"
                            >
                                <AiOutlineMenu />
                                <span>DANH MỤC SẢN PHẨM</span>
                            </button>
                            {isCategoryOpen && (
                                <div className="category-dropdown">
                                    <p className="dropdown-title">Dear Róse</p>
                                    <ul>
                                        {categoryItems.map((item) => (
                                            <li key={item.label}>
                                                <Link
                                                    to={`/category/${item.slug}`}
                                                    className="category-item"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleCategorySelect(item.slug);
                                                    }}
                                                >
                                                    <span className="item-left">
                                                        <item.icon className="cat-icon" />
                                                        <span>{item.label}</span>
                                                    </span>
                                                    <AiOutlineRight />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </li>
                        <li>
                            <Link to="/">TRANG CHỦ</Link>
                        </li>
                        <li>
                            <Link to="/blog">BLOG</Link>
                        </li>
                        <li>
                            <Link to="/yeu-thich">YÊU THÍCH</Link>
                        </li>
                        <li>
                            <Link to="/don-hang">ĐƠN HÀNG</Link>
                        </li>
                    </ul>
                </div>
            </nav>

            {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
            {isCartOpen && <Cart onClose={() => setIsCartOpen(false)} />}
        </header>
    );
};

export default memo(Header);
