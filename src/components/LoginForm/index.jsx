import { useContext, useState } from "react";
import { login } from "../../services/authServices.js";
import { AuthContext } from "../../context/AuthContext.jsx";
import "./style.scss";

function LoginForm({ onClose }) {
    const { loginContext } = useContext(AuthContext);
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

