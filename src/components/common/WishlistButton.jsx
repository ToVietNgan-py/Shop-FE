import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";

function WishlistButton({ product, className = "" }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext) ?? {};
    const { loading, isWishlisted, toggleWishlist } = useWishlist();

    if (!product?.id) {
        return null;
    }

    const wishlisted = isWishlisted(product.id);

    const handleClick = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!user) {
            navigate("/login", { state: { from: location.pathname + location.search } });
            return;
        }

        try {
            await toggleWishlist(product);
        } catch (error) {
            console.error("Toggle wishlist failed:", error);
        }
    };

    return (
        <button
            type="button"
            className={className}
            onClick={handleClick}
            disabled={loading}
            aria-label={wishlisted ? "Bỏ khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
            title={wishlisted ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
            style={{
                position: "absolute",
                top: 14,
                right: 14,
                zIndex: 4,
                width: 38,
                height: 38,
                borderRadius: 999,
                border: wishlisted ? "1px solid rgba(236, 72, 153, 0.18)" : "1px solid rgba(255,255,255,0.74)",
                background: wishlisted
                    ? "linear-gradient(135deg, rgba(236, 72, 153, 0.98), rgba(219, 39, 119, 0.95))"
                    : "rgba(255,255,255,0.94)",
                color: wishlisted ? "#fff" : "#db2777",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 20px rgba(15, 23, 42, 0.12)",
                cursor: loading ? "wait" : "pointer",
                transition: "transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease, border-color 0.18s ease",
            }}
        >
            {wishlisted ? <FaHeart /> : <FaRegHeart />}
        </button>
    );
}

export default WishlistButton;
