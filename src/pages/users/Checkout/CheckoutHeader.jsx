import { Link } from "react-router-dom";
import { AiOutlineArrowLeft } from "react-icons/ai";
import "./CheckoutHeader.scss";

export default function CheckoutHeader() {
    return (
        <header className="checkout-header">
            <div className="checkout-header__inner">
                <Link to="/" className="checkout-header__back" aria-label="Trở lại">
                    <AiOutlineArrowLeft />
                    <span>Trở lại</span>
                </Link>


                <Link to="/" className="checkout-header__brand" aria-label="Trang chủ">
                    <img src="/logo.png" alt="Dear Rose" />
                </Link>

                <div className="checkout-header__meta">
                    <span className="checkout-header__pill">Checkout</span>
                </div>
            </div>
        </header>
    );
}

