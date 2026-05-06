import { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../../services/authServices.js";
import { AuthContext } from "../../context/AuthContext.jsx";
import "./style.scss";

const splitRoleValue = (value) => String(value ?? "")
    .split("|")
    .map((role) => role.trim())
    .filter(Boolean);

const getUserRoles = (userData) => {
    const roles = userData?.roles ?? userData?.role ?? userData?.roles_name ?? userData?.role_name ?? [];

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

const isAdminRole = (userData) => {
    const roles = getUserRoles(userData);
    return roles.includes("admin") || roles.includes("employee");
};

function LoginForm({ onClose }) {
    const { loginContext } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({
        email: "",
        password: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const data = await login(form);
            loginContext(data);
            onClose?.();

            const nextUser = data.user ?? data.data?.user ?? data.profile ?? data.data ?? data;
            const nextPath = location.state?.from;

            if (nextPath) {
                navigate(nextPath, { replace: true });
                return;
            }

            if (isAdminRole(nextUser)) {
                navigate("/admin", { replace: true });
                return;
            }

            navigate("/", { replace: true });
        } catch (err) {
            const message = err?.message || err?.error || "Sai tài khoản hoặc mật khẩu";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="auth-form auth-form--login" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                    id="login-email"
                    type="email"
                    placeholder="hello@dearrose.vn"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="form-group">
                <label htmlFor="login-password">Mật khẩu</label>
                <input
                    id="login-password"
                    type="password"
                    placeholder="Nhập mật khẩu của bạn"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    required
                    disabled={isLoading}
                />
            </div>

            <button className="btn-submit" type="submit" disabled={isLoading}>
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
        </form>
    );
}

export default LoginForm;

