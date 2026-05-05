import LoginForm from "../../../components/LoginForm/index.jsx";
import "./loginPage.scss";

function LoginPage() {
    return (
        <main className="login-page">
            <section className="login-page__panel">
                <div className="login-page__header">
                    <span className="login-page__badge">Welcome Back</span>
                    <h1>Đăng nhập tài khoản</h1>
                    <p>Nhập email và mật khẩu để tiếp tục mua sắm tại Dear Rose.</p>
                </div>
                <LoginForm />
            </section>
        </main>
    );
}

export default LoginPage;
