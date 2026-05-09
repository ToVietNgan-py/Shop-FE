import { Avatar, Button, Layout, Menu, Space, Tag } from "antd";
import {
    AiOutlineAppstore,
    AiOutlineDashboard,
    AiOutlineLogout,
    AiOutlineSetting,
    AiOutlineShopping,
    AiOutlineTags,
    AiOutlineTeam,
    AiOutlineMenuFold,
    AiOutlineMenuUnfold
} from "react-icons/ai";
import { useContext, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext.jsx";
import "./AdminLayout.scss";

const { Sider, Header, Content } = Layout;

const splitRoleValue = (value) => String(value ?? "")
    .split("|")
    .map((role) => role.trim())
    .filter(Boolean);

const normalizeRoles = (user) => {
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

const menuItems = [
    { key: "/admin", icon: <AiOutlineDashboard />, label: <Link to="/admin">Dashboard</Link> },
    { key: "/admin/san-pham", icon: <AiOutlineShopping />, label: <Link to="/admin/san-pham">Sản phẩm</Link> },
    { key: "/admin/loai-san-pham", icon: <AiOutlineTags />, label: <Link to="/admin/loai-san-pham">Danh mục</Link> },
    { key: "/admin/don-hang", icon: <AiOutlineAppstore />, label: <Link to="/admin/don-hang">Đơn hàng</Link> },
    { key: "/admin/khuyen-mai", icon: <AiOutlineSetting />, label: <Link to="/admin/khuyen-mai">Khuyến mãi</Link> },
    { key: "/admin/tai-khoan", icon: <AiOutlineTeam />, label: <Link to="/admin/tai-khoan">Tài khoản</Link> }
];

function AdminLayout() {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const selectedKey = useMemo(() => {
        const currentPath = location.pathname;
        const matchedItem = [...menuItems]
            .sort((firstItem, secondItem) => secondItem.key.length - firstItem.key.length)
            .find((item) => currentPath === item.key || currentPath.startsWith(`${item.key}/`));

        return matchedItem?.key ?? "/admin";
    }, [location.pathname]);

    const roleLabel = normalizeRoles(user).join(", ") || "admin";
    const displayName = user?.name ?? user?.fullName ?? user?.email ?? "Quản trị viên";

    return (
        <Layout className="admin-layout">
            <Sider width={248} className="admin-layout__sider" breakpoint="lg" collapsedWidth={60} collapsed={sidebarCollapsed} onCollapse={(collapsed) => setSidebarCollapsed(collapsed)}>
                <div className="admin-layout__brand">

                    <img className="admin-layout__brand-logo" src="/logo.png" alt="Dear Rose" />
                    <span>Khung quản trị chung</span>
                </div>
                <Menu
                    className="admin-layout__menu"
                    mode="inline"
                    theme="dark"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                />
            </Sider>

            <Layout className="admin-layout__shell">
                <Header className="admin-layout__header">
                    <div className="admin-layout__header-meta">
                        <img className="admin-layout__header-logo" src="/logo.png" alt="Dear Rose" />
                        <span>Mang đến những thiết kế váy đầm nữ tính, chất liệu mềm mại, giúp cô gái tuổi 20 tỏa sáng nhẹ nhàng.</span>
                    </div>

                    <div className="admin-layout__header-user">
                        <Space size={10} align="center">
                            <Tag color="green">{roleLabel}</Tag>
                            <Avatar>{displayName.slice(0, 1).toUpperCase()}</Avatar>
                            <div>
                                <strong>{displayName}</strong>
                            </div>
                        </Space>
                        <Button icon={<AiOutlineLogout />} onClick={logout}>
                            Đăng xuất
                        </Button>
                    </div>
                </Header>

                <Content className="admin-layout__content">
                    <Outlet />
                </Content>
            </Layout>
        </Layout >
    );
}

export default AdminLayout;