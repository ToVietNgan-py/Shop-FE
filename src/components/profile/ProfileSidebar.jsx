import { useContext } from "react";
import "./style.scss";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";
import { FiLock, FiLogOut, FiPackage, FiUser } from "react-icons/fi";

const menuItems = [
    { key: "info", label: "Thông tin tài khoản", path: "/tai-khoan", icon: FiUser },
    { key: "orders", label: "Lịch sử đơn hàng", path: "/don-hang", icon: FiPackage },
    { key: "password", label: "Đổi mật khẩu", action: "changePassword", icon: FiLock },
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
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.key}
                            className={`menu-item ${activeMenu === item.key ? "active" : ""}`}
                            onClick={() => handleMenuClick(item)}
                        >
                            <Icon className="menu-icon" aria-hidden="true" />
                            <span className="menu-label">{item.label}</span>
                        </div>
                    );
                })}
            </div>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={handleLogout}>
                    <FiLogOut className="menu-icon" aria-hidden="true" />
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}
