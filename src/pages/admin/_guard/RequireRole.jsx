import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext.jsx";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";

const splitRoleValue = (value) => String(value ?? "")
    .split("|")
    .map((role) => role.trim())
    .filter(Boolean);

const normalizeRoles = (user) => {
    const roles = user?.roles ?? user?.role ?? user?.roles_name ?? user?.role_name ?? [];

    if (Array.isArray(roles)) {
        return roles
            .flatMap((item) => {
                if (typeof item === "string") {
                    return splitRoleValue(item);
                }

                if (item && typeof item === "object") {
                    return splitRoleValue(item.name ?? item.slug ?? item.role ?? item.code);
                }

                return [];
            })
            .filter(Boolean);
    }

    return splitRoleValue(roles);
};

function RequireRole({ role, children }) {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return <PageLoading title="Đang kiểm tra quyền truy cập" description="Vui lòng chờ trong giây lát." compact />;
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    const allowedRoles = splitRoleValue(role);
    const userRoles = normalizeRoles(user);
    const isAllowed = allowedRoles.length === 0 || allowedRoles.some((currentRole) => userRoles.includes(currentRole));

    if (!isAllowed) {
        return <Navigate to="/" replace state={{ from: location.pathname, reason: "forbidden" }} />;
    }

    return children;
}

export default RequireRole;