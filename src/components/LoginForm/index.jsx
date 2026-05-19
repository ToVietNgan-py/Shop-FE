import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../../services/authService.js";
import { AuthContext } from "../../context/AuthContext.jsx";
import { loginSchema } from "../../validations/authSchema.js";
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
    const [error, setError] = useState("");
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (form) => {
        setError("");

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
        }
    };

    return (
        <form className="auth-form auth-form--login" onSubmit={handleSubmit(onSubmit)} noValidate>
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                    id="login-email"
                    type="email"
                    placeholder="hello@dearrose.vn"
                    autoComplete="email"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.email}
                    {...register("email")}
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div className="form-group">
                <label htmlFor="login-password">Mật khẩu</label>
                <input
                    id="login-password"
                    type="password"
                    placeholder="Nhập mật khẩu của bạn"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.password}
                    {...register("password")}
                />
                {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <button className="btn-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
        </form>
    );
}

export default LoginForm;
