import { FaCheckCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { ORDER_PAYMENT_METHODS } from "../services/orderService.js";

/**
 * Màn hình thành công sau khi đặt hàng / xác nhận chuyển khoản.
 */
export function SuccessStep({ orderData, phone }) {
    return (
        <div className="payment-success-card">
            <FaCheckCircle className="success-icon" />
            <h1>Đặt hàng thành công</h1>
            <p>
                Đơn hàng <strong>{orderData?.orderCode}</strong> đã được ghi nhận.{" "}
                {orderData?.paymentMethod === ORDER_PAYMENT_METHODS.COD
                    ? "Bạn sẽ thanh toán khi nhận hàng."
                    : "Hệ thống đã nhận yêu cầu xác nhận chuyển khoản của bạn."}
            </p>
            <p>
                Dear Rose sẽ liên hệ với bạn <strong>{phone || "số điện thoại của bạn"}</strong> để xác
                nhận và giao hàng sớm nhất.
            </p>
            <div className="payment-step-actions success-actions">
                <Link to="/" className="secondary-action-btn link-btn">Về trang chủ</Link>
                <Link to="/don-hang" className="place-order-btn link-btn">Xem đơn hàng</Link>
            </div>
        </div>
    );
}