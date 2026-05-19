import { Link } from "react-router-dom";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { MdLock } from "react-icons/md";
import "./CheckoutHeader.scss";

export default function CheckoutHeader() {
    return (
        <header className="checkout-header">
            <div className="checkout-header__inner">
                <Link to="/" className="checkout-header__back" aria-label="Về trang chủ">
                    <AiOutlineArrowLeft />
                    <span>Về trang chủ</span>
                </Link>

                <Link to="/" className="checkout-header__brand" aria-label="Trang chủ">
                    <img src="/logo.png" alt="Dear Rose" />
                </Link>

                <div className="checkout-header__meta">
                    <MdLock size={15} />
                    <span className="checkout-header__badge">Thanh toán an toàn</span>
                </div>
            </div>
        </header>
    );
}