import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { register } from "../../services/authService.js";
import { AuthContext } from "../../context/AuthContext.jsx";
import { registerSchema } from "../../validations/authSchema.js";
import "./style.scss";

function RegisterForm({ onClose }) {
    const { loginContext } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const {
        register: registerField,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            password_confirmation: "",
        },
    });

    const onSubmit = async (form) => {
        setError("");

        try {
            const data = await register(form);

            loginContext(data);
            onClose?.();
            navigate("/", { replace: true });
        } catch (err) {
            const validationMessage = err?.errors
                ? Object.values(err.errors).flat().join(" ")
                : "";
            const message = validationMessage || err?.message || err?.error || "Đăng ký thất bại, bạn kiểm tra lại thông tin nhé!";
            setError(message);
        }
    };

    return (
        <form className="auth-form auth-form--register" onSubmit={handleSubmit(onSubmit)} noValidate>
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
                <label htmlFor="register-name">Họ tên</label>
                <input
                    id="register-name"
                    placeholder="Nguyen Minh Anh"
                    autoComplete="name"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.name}
                    {...registerField("name")}
                />
                {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            <div className="form-group">
                <label htmlFor="register-email">Email</label>
                <input
                    id="register-email"
                    type="email"
                    placeholder="hello@dearrose.vn"
                    autoComplete="email"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.email}
                    {...registerField("email")}
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div className="form-group">
                <label htmlFor="register-password">Mật khẩu</label>
                <input
                    id="register-password"
                    type="password"
                    placeholder="Tạo mật khẩu mới"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.password}
                    {...registerField("password")}
                />
                {errors.password && <p className="form-error">{errors.password.message}</p>}
                <small className="field-hint">Mật khẩu tối thiểu 8 ký tự, phải có chữ và số.</small>
            </div>

            <div className="form-group">
                <label htmlFor="register-password-confirmation">Xác nhận mật khẩu</label>
                <input
                    id="register-password-confirmation"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.password_confirmation}
                    {...registerField("password_confirmation")}
                />
                {errors.password_confirmation && <p className="form-error">{errors.password_confirmation.message}</p>}
            </div>

            <button className="btn-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
        </form>
    );
}

export default RegisterForm;
