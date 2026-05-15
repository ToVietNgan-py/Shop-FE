/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext.jsx";
import { normalizeWishlistProduct, wishlistService } from "../services/wishlistService.js";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
    const { user } = useContext(AuthContext) ?? {};
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const refreshWishlist = useCallback(async () => {
        if (!user) {
            setWishlistItems([]);
            setLoading(false);
            setError("");
            return [];
        }

        setLoading(true);
        setError("");

        try {
            const items = await wishlistService.list();
            setWishlistItems(items);
            return items;
        } catch (loadError) {
            setError(loadError?.message || "Không thể tải wishlist.");
            setWishlistItems([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshWishlist();
    }, [refreshWishlist]);

    const isWishlisted = useCallback(
        (productId) => wishlistItems.some((item) => String(item.id) === String(productId)),
        [wishlistItems]
    );

    const toggleWishlist = useCallback(async (product) => {
        const normalized = normalizeWishlistProduct(product);

        if (!normalized?.id) {
            return null;
        }

        const currentlyWishlisted = wishlistItems.some((item) => String(item.id) === String(normalized.id));
        const previousItems = wishlistItems;
        const nextItems = currentlyWishlisted
            ? wishlistItems.filter((item) => String(item.id) !== String(normalized.id))
            : [normalized, ...wishlistItems.filter((item) => String(item.id) !== String(normalized.id))];

        setWishlistItems(nextItems);

        try {
            if (currentlyWishlisted) {
                await wishlistService.remove(normalized.id);
            } else {
                await wishlistService.add(normalized.id);
            }

            return nextItems;
        } catch (toggleError) {
            setWishlistItems(previousItems);
            throw toggleError;
        }
    }, [wishlistItems]);

    const removeFromWishlist = useCallback(async (productId) => {
        const previousItems = wishlistItems;
        const nextItems = wishlistItems.filter((item) => String(item.id) !== String(productId));

        setWishlistItems(nextItems);

        try {
            await wishlistService.remove(productId);
            return nextItems;
        } catch (removeError) {
            setWishlistItems(previousItems);
            throw removeError;
        }
    }, [wishlistItems]);

    const wishlistIds = useMemo(
        () => wishlistItems.map((item) => item.id),
        [wishlistItems]
    );

    const value = useMemo(() => ({
        wishlistItems,
        wishlistIds,
        loading,
        error,
        refreshWishlist,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
    }), [wishlistItems, wishlistIds, loading, error, refreshWishlist, isWishlisted, toggleWishlist, removeFromWishlist]);

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);

    if (!context) {
        throw new Error("useWishlist must be used within WishlistProvider");
    }

    return context;
}
