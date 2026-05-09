import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../services/authServices.js";
import { AuthContext } from "../../context/AuthContext.jsx";
import "./style.scss";

function RegisterForm({ onClose }) {
    const { loginContext } = useContext(AuthContext);
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        // Validate password: min 8 chars, has letters + numbers
        if (form.password.length < 8) {
            setError("Mật khẩu phải có ít nhất 8 ký tự nhé!");
            return;
        }
        if (!/[a-zA-Z]/.test(form.password)) {
            setError("Mật khẩu phải chứa ít nhất một chữ cái!");
            return;
        }
        if (!/\d/.test(form.password)) {
            setError("Mật khẩu phải chứa ít nhất một chữ số!");
            return;
        }

        setIsLoading(true);

        try {
            const dataToRegister = {
                ...form,
                password_confirmation: form.password
            };

            const data = await register(dataToRegister);

            loginContext(data);
            onClose?.();
            navigate("/", { replace: true });
        } catch (err) {
            const validationMessage = err?.errors
                ? Object.values(err.errors).flat().join(" ")
                : "";
            const message = validationMessage || err?.message || err?.error || "Đăng ký thất bại, bạn kiểm tra lại thông tin nhé!";
            setError(message);
            console.log("Chi tiết lỗi:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="auth-form auth-form--register" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
                <label htmlFor="register-name">Họ tên</label>
                <input
                    id="register-name"
                    placeholder="Nguyen Minh Anh"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="form-group">
                <label htmlFor="register-email">Email</label>
                <input
                    id="register-email"
                    type="email"
                    placeholder="hello@dearrose.vn"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="form-group">
                <label htmlFor="register-password">Mật khẩu</label>
                <input
                    id="register-password"
                    type="password"
                    placeholder="Tạo mật khẩu mới"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    minLength={8}
                    title="Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ cái và số"
                    required
                    disabled={isLoading}
                />
                <small className="field-hint">Mật khẩu tối thiểu 8 ký tự, phải có chữ và số.</small>
            </div>

            <button className="btn-submit" type="submit" disabled={isLoading}>
                {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
        </form>
    );
}

export default RegisterForm;

