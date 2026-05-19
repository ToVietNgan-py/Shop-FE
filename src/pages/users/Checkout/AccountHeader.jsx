import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext.jsx";
import "./AccountHeader.scss";

export default function AccountHeader() {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    const firstName = user?.fullName?.trim().split(" ").pop() ?? "?";
    const initials = firstName.charAt(0).toUpperCase();

    const breadcrumbs = [
        { label: "Trang chủ", to: "/" },
        { label: "Tài khoản", to: "/tai-khoan" },
    ];

    const isOrderDetail = location.pathname.startsWith("/don-hang/");
    const isMyOrder = location.pathname === "/don-hang";

    if (isOrderDetail) {
        breadcrumbs.push({ label: "Đơn hàng của tôi", to: "/don-hang" });
        breadcrumbs.push({ label: "Chi tiết đơn hàng", to: null });
    } else if (isMyOrder) {
        breadcrumbs.push({ label: "Đơn hàng của tôi", to: null });
    }

    return (
        <header className="account-header">
            <div className="account-header__inner">
                <div className="account-header__top">
                    <Link to="/" className="account-header__logo" aria-label="Trang chủ">
                        <img src="/logo.png" alt="Dear Rose" />
                    </Link>
                    <div className="account-header__user">
                        <div className="account-header__avatar">{initials}</div>
                        <span>Xin chào, {firstName}</span>
                    </div>
                </div>
                <nav className="account-header__breadcrumb" aria-label="Breadcrumb">
                    {breadcrumbs.map((crumb, i) => (
                        <span key={i} className="account-header__breadcrumb-item">
                            {i > 0 && <i className="ti ti-chevron-right" aria-hidden="true" />}
                            {crumb.to
                                ? <Link to={crumb.to}>{crumb.label}</Link>
                                : <span>{crumb.label}</span>
                            }
                        </span>
                    ))}
                </nav>
            </div>
        </header>
    );
}