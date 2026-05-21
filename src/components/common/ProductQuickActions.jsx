import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCreditCard, FiShoppingCart } from "react-icons/fi";
import { CartContext } from "../../context/CartContext.jsx";
import "./ProductQuickActions.scss";

const getProductImage = (product) => (
    product?.img ??
    product?.image ??
    product?.image_url ??
    product?.thumbnail ??
    ""
);

const getDefaultOption = (product, key, fallback = "") => {
    const pluralKey = `${key}s`;
    const options = product?.[pluralKey];

    if (Array.isArray(options) && options.length > 0) {
        return options[0];
    }

    return product?.[key] ?? product?.[`default_${key}`] ?? product?.[`default${key[0].toUpperCase()}${key.slice(1)}`] ?? fallback;
};

const createCartPayload = (product, quantity = 1) => ({
    id: product.id,
    productId: product.id,
    name: product.name,
    price: Number(product.price ?? 0),
    image: getProductImage(product),
    quantity,
    color: getDefaultOption(product, "color"),
    size: getDefaultOption(product, "size"),
});

export default function ProductQuickActions({ product, className = "" }) {
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext) ?? {};
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const stockValue = product?.inventory ?? product?.stock;
    const isUnavailable = product?.in_stock === false || Number(stockValue) === 0;

    const addProductToCart = async () => {
        if (isUnavailable) {
            throw new Error("Sản phẩm hiện đã hết hàng.");
        }

        if (!product?.id || !addToCart) {
            throw new Error("Không thể thêm sản phẩm vào giỏ.");
        }

        await addToCart(createCartPayload(product));
    };

    const handleAddToCart = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        setError("");
        setStatus("adding");

        try {
            await addProductToCart();
            setStatus("added");
            window.setTimeout(() => setStatus("idle"), 1600);
        } catch (err) {
            setStatus("idle");
            setError(err?.message || "Không thể thêm vào giỏ.");
        }
    };

    const handleBuyNow = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        setError("");
        setStatus("buying");

        try {
            await addProductToCart();
            navigate("/thanh-toan");
        } catch (err) {
            setStatus("idle");
            setError(err?.message || "Không thể mua sản phẩm này.");
        }
    };

    const isBusy = status === "adding" || status === "buying";

    return (
        <div className={`product-quick-actions ${className}`}>
            <div className="product-quick-actions__buttons">
                <button
                    type="button"
                    className="quick-action-btn quick-action-btn--cart"
                    onClick={handleAddToCart}
                    disabled={isBusy || isUnavailable}
                    aria-label={isUnavailable ? "Sản phẩm hết hàng" : "Thêm vào giỏ hàng"}
                    title={isUnavailable ? "Hết hàng" : status === "added" ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
                >
                    <FiShoppingCart aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="quick-action-btn quick-action-btn--buy"
                    onClick={handleBuyNow}
                    disabled={isBusy || isUnavailable}
                    aria-label="Mua ngay"
                    title={status === "buying" ? "Đang mua" : "Mua ngay"}
                >
                    <FiCreditCard aria-hidden="true" />
                </button>
            </div>
            {error ? <p className="product-quick-actions__error">{error}</p> : null}
        </div>
    );
}
