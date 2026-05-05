import { useContext } from "react";
import "./style.scss";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";

const menuItems = [
    { key: "info", label: "Thông tin tài khoản", path: "/tai-khoan", icon: "user" },
    { key: "orders", label: "Lịch sử đơn hàng", path: "/don-hang", icon: "package" },
    { key: "password", label: "Đổi mật khẩu", action: "changePassword", icon: "lock" },
];

export default function ProfileSidebar({ user, activeMenu = "info", onMenuChange }) {
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);

    const handleMenuClick = (item) => {
        if (item.action === "changePassword") {
            // Trigger password change modal via onMenuChange callback
            if (onMenuChange) {
                onMenuChange(item.key);
            }
        } else if (item.path) {
            navigate(item.path);
        }
    };

    const handleLogout = () => {
        if (logout) {
            logout();
        }
        navigate("/");
    };

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    // Render different icons based on icon type
    const renderIcon = (iconType) => {
        switch (iconType) {
            case "user":
                return (
                    <svg className="menu-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                );
            case "package":
                return (
                    <svg className="menu-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                );
            case "lock":
                return (
                    <svg className="menu-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                );
            case "logout":
                return (
                    <svg className="menu-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                );
            default:
                return (
                    <svg className="menu-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.78 6-3.78s5.97 1.79 6 3.78c-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                );
        }
    };

    return (
        <div className="sidebar">
            <div className="user-card">
                <div className="avatar">
                    {getInitials(user?.name)}
                </div>
                <div className="user-info">
                    <span className="member-badge">Thành viên</span>
                    <h3>{user?.name}</h3>
                    <p className="email">{user?.email}</p>
                </div>
            </div>

            <div className="menu">
                {menuItems.map((item) => (
                    <div
                        key={item.key}
                        className={`menu-item ${activeMenu === item.key ? "active" : ""}`}
                        onClick={() => handleMenuClick(item)}
                    >
                        {renderIcon(item.icon)}
                        <span className="menu-label">{item.label}</span>
                    </div>
                ))}
            </div>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={handleLogout}>
                    {renderIcon("logout")}
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}
