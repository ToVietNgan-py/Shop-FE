import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { Link, useSearchParams } from "react-router-dom";
import PageLoading from "../../../components/PageLoading/PageLoading.jsx";
import { paymentService } from "../../../services/paymentService.js";
import "./style.scss";

function PaymentResult() {
    const [searchParams] = useSearchParams();
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const vnpayParams = useMemo(
        () => Object.fromEntries(searchParams.entries()),
        [searchParams]
    );

    useEffect(() => {
        let isMounted = true;

        async function confirmPayment() {
            setIsLoading(true);
            setError("");

            try {
                if (Object.keys(vnpayParams).length === 0) {
                    throw new Error("Khong tim thay du lieu tra ve tu VNPay.");
                }

                if (vnpayParams.mock === "1") {
                    if (isMounted) {
                        const isSuccess = vnpayParams.success === "1";
                        setResult({
                            success: isSuccess,
                            orderCode: vnpayParams.order_code || vnpayParams.order_id || "",
                            orderId: vnpayParams.order_id || "",
                            message: vnpayParams.message || (isSuccess ? "Thanh toan thanh cong." : "Thanh toan that bai."),
                        });
                    }

                    return;
                }

                const data = await paymentService.confirmReturn(vnpayParams);

                if (isMounted) {
                    setResult(data);
                }
            } catch (confirmError) {
                if (isMounted) {
                    setError(confirmError?.message || "Khong xac nhan duoc ket qua thanh toan.");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        confirmPayment();

        return () => {
            isMounted = false;
        };
    }, [vnpayParams]);

    if (isLoading) {
        return (
            <PageLoading
                title="Dang xac nhan thanh toan"
                description="He thong dang doi chieu ket qua tu VNPay."
            />
        );
    }

    const orderRef = result?.orderCode
        || result?.order?.order_code
        || result?.order?.orderCode
        || result?.orderId;
    const isSuccess = Boolean(result?.success) && !error;

    return (
        <section className="payment-result-page">
            <div className={`payment-result-card ${isSuccess ? "success" : "failed"}`}>
                {isSuccess ? (
                    <FaCheckCircle className="result-icon" />
                ) : (
                    <FaTimesCircle className="result-icon" />
                )}

                <h1>{isSuccess ? "Thanh toan thanh cong" : "Thanh toan that bai"}</h1>
                <p>
                    {isSuccess
                        ? "Don hang cua ban da duoc ghi nhan va cap nhat trang thai thanh toan."
                        : error || result?.message || "Giao dich chua duoc xac nhan. Vui long thu lai hoac lien he ho tro."}
                </p>

                {orderRef ? (
                    <p className="order-code">Ma don hang: <strong>{orderRef}</strong></p>
                ) : null}

                <div className="result-actions">
                    {orderRef ? (
                        <Link to={`/don-hang/${orderRef}`} className="primary-action">
                            Xem don hang
                        </Link>
                    ) : null}
                    <Link to="/don-hang" className="secondary-action">
                        Lich su don hang
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default PaymentResult;
