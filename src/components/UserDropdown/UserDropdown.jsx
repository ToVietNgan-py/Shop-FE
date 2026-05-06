import { memo, useEffect, useMemo, useRef, useState } from "react";
import { AiOutlineCaretDown, AiOutlineLogout, AiOutlineShopping, AiOutlineUser } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import "./style.scss";

const getDisplayName = (user) => user?.full_name || user?.fullName || user?.name || user?.email || "Khách hàng";

const getInitials = (displayName) => {
    const parts = String(displayName).trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return "KH";
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const splitRoleValue = (value) => String(value ?? "")
    .split("|")
    .map((role) => role.trim())
    .filter(Boolean);

const getUserRoles = (user) => {
    const roles = user?.roles ?? user?.role ?? user?.roles_name ?? user?.role_name ?? [];

    if (Array.isArray(roles)) {
        return roles.flatMap((item) => {
            if (typeof item === "string") {
                return splitRoleValue(item);
            }

            if (item && typeof item === "object") {
                return splitRoleValue(item.name ?? item.slug ?? item.role ?? item.code);
            }

            return [];
        });
    }

    return splitRoleValue(roles);
};

const isAdminUser = (user) => {
    const roles = getUserRoles(user);
    return roles.includes("admin") || roles.includes("employee");
};

function UserDropdown({ user, onLogout }) {
    const navigate = useNavigate();
    const wrapperRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);

    const displayName = useMemo(() => getDisplayName(user), [user]);
    const initials = useMemo(() => getInitials(displayName), [displayName]);
    const adminVisible = useMemo(() => isAdminUser(user), [user]);

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (!wrapperRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const closeMenu = () => setIsOpen(false);

    return (
        <div className={`user-dropdown ${isOpen ? "is-open" : ""}`} ref={wrapperRef}>
            <button
                type="button"
                className="user-dropdown__trigger"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
            >
                <span className="user-dropdown__avatar" aria-hidden="true">
                    {initials}
                </span>
                <span className="user-dropdown__meta">
                    <strong>{displayName}</strong>
                    <span>Tài khoản</span>
                </span>
                <AiOutlineCaretDown className="user-dropdown__chevron" aria-hidden="true" />
            </button>

            {isOpen ? (
                <div className="user-dropdown__menu" role="menu">
                    <div className="user-dropdown__profile">
                        <div className="user-dropdown__avatar user-dropdown__avatar--large" aria-hidden="true">
                            {initials}
                        </div>
                        <div>
                            <strong>{displayName}</strong>
                            <p>{user?.email || "Đã đăng nhập"}</p>
                        </div>
                    </div>

                    <Link
                        to="/tai-khoan"
                        className="user-dropdown__item"
                        onClick={() => {
                            closeMenu();
                            navigate("/tai-khoan")
                        }
                        }

                    >
                        <AiOutlineUser />
                        <span>Tài khoản</span>
                    </Link>

                    {adminVisible ? (
                        <button
                            type="button"
                            className="user-dropdown__item"
                            onClick={() => {
                                closeMenu();
                                navigate("/admin");
                            }}
                        >
                            <AiOutlineShopping />
                            <span>Trang quản trị</span>
                        </button>
                    ) : null}

                    <button
                        type="button"
                        className="user-dropdown__item"
                        onClick={() => {
                            closeMenu();
                            navigate("/don-hang");
                        }}
                    >
                        <AiOutlineShopping />
                        <span>Đơn hàng</span>
                    </button>

                    <button
                        type="button"
                        className="user-dropdown__item user-dropdown__item--logout"
                        onClick={() => {
                            closeMenu();
                            onLogout();
                        }}
                    >
                        <AiOutlineLogout />
                        <span>Đăng xuất</span>
                    </button>

                    <Link to="/don-hang" className="user-dropdown__footer-link" onClick={closeMenu}>
                        Xem lịch sử đơn hàng
                    </Link>
                </div>
            ) : null}
        </div>
    );
}

export default memo(UserDropdown);