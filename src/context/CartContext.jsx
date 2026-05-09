/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { cartService, normalizeCartItem } from "../services/cartService.js";
import { AuthContext } from "./AuthContext.jsx";

const GUEST_CART_KEY = "guest_cart";

// ===== Debounce Utility =====
const createDebounce = (callback, delay = 300) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            callback(...args);
        }, delay);
    };
};

// ===== localStorage Helpers =====
const loadGuestCart = () => {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const parsed = JSON.parse(window.localStorage.getItem(GUEST_CART_KEY));
        return Array.isArray(parsed) ? parsed.map(normalizeCartItem) : [];
    } catch {
        return [];
    }
};

const saveGuestCart = (items) => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

const clearGuestCart = () => {
    if (typeof window !== "undefined") {
        window.localStorage.removeItem(GUEST_CART_KEY);
    }
};

export const createCartKey = (item) => {
    const productId = item.productId ?? item.product_id ?? item.id;
    return `${productId}-${item.color ?? ""}-${item.size ?? ""}`;
};

const initialState = {
    cartId: null,
    sessionToken: "",
    cartItems: [],
    status: "idle", // idle | loading | syncing | error
    error: null,
};

const syncPayload = (cart) => ({
    cartId: cart?.id ?? null,
    sessionToken: cart?.sessionToken ?? cartService.getSessionToken(),
    cartItems: cart?.items ?? [],
});

const cartReducer = (state, action) => {
    switch (action.type) {
        case "INIT_LOADING":
            return { ...state, status: "loading", error: null };
        case "SYNCED":
            return { ...state, ...syncPayload(action.payload), status: "idle", error: null };
        case "SYNCING":
            return { ...state, status: "syncing" };
        case "UPDATE_ITEMS":
            return { ...state, cartItems: action.payload };
        case "ERROR":
            return { ...state, status: "idle", error: action.payload };
        default:
            return state;
    }
};

export const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [state, dispatch] = useReducer(cartReducer, initialState);
    const { user } = useContext(AuthContext) ?? {};
    const isLoggedIn = Boolean(user);

    // ===== Refs để lưu debounce functions, previous state, và merge status =====
    const debounceTimersRef = useRef({});
    const previousStateRef = useRef(null);
    const mergedRef = useRef(false);

    // ===== Sync cart từ server khi load lần đầu hoặc khi login =====
    const syncCart = useCallback(async () => {
        dispatch({ type: "INIT_LOADING" });

        try {
            const cart = await cartService.get();
            dispatch({ type: "SYNCED", payload: cart });
            return cart;
        } catch (err) {
            dispatch({ type: "ERROR", payload: err.message ?? "Khong the tai gio hang" });
            throw err;
        }
    }, []);

    // ===== Effect: Load giỏ khi component mount hoặc user login/logout =====
    useEffect(() => {
        let isMounted = true;

        async function loadCart() {
            dispatch({ type: "INIT_LOADING" });

            try {
                // Luôn gọi API backend để sync cart
                const cart = await cartService.get();
                console.log("[Cart] 💾 Using backend cart", cart);

                if (isMounted) {
                    dispatch({ type: "SYNCED", payload: cart });
                }
            } catch (err) {
                console.error("[Cart] ❌ Load cart error:", err);
                // Fallback: dùng empty cart nếu API fail
                if (isMounted) {
                    dispatch({ type: "SYNCED", payload: { id: null, sessionToken: cartService.getSessionToken(), items: [] } });
                    dispatch({ type: "ERROR", payload: err.message ?? "Khong the tai gio hang" });
                }
            }
        }

        loadCart();

        return () => {
            isMounted = false;
        };
    }, [isLoggedIn]);

    // ===== Helper: Revert UI khi API call thất bại =====
    const revertToPreview = () => {
        if (previousStateRef.current) {
            dispatch({ type: "UPDATE_ITEMS", payload: previousStateRef.current });
        }
    };

    // ===== Debounced sync to API/localStorage =====
    const debouncedSync = useCallback(
        (updatedItems, operationType) => {
            // Cleanup previous debounce timer
            if (debounceTimersRef.current[operationType]) {
                clearTimeout(debounceTimersRef.current[operationType]);
            }

            debounceTimersRef.current[operationType] = setTimeout(async () => {
                dispatch({ type: "SYNCING" });

                try {
                    // Sync với backend API thay vì chỉ localStorage
                    console.log("[Cart] 🔄 Syncing with backend API...");
                    const cart = await cartService.get();
                    dispatch({ type: "SYNCED", payload: cart });
                    console.log("[Cart] ✅ Backend synced successfully");
                } catch (err) {
                    console.error("[Cart] ❌ Backend sync error:", err);
                    // Fallback: lưu localStorage nếu API fail
                    saveGuestCart(updatedItems);
                    dispatch({ type: "UPDATE_ITEMS", payload: updatedItems });
                    dispatch({ type: "ERROR", payload: err.message ?? "Khong the dong bo gio hang" });
                } finally {
                    previousStateRef.current = null;
                }
            }, 300); // 300ms debounce
        },
        [isLoggedIn]
    );

    // ===== Cleanup: Hủy tất cả debounce timers khi unmount =====
    useEffect(() => {
        return () => {
            Object.values(debounceTimersRef.current).forEach(clearTimeout);
        };
    }, []);

    // ===== removeFromCart: Optimistic update + API call =====
    const removeFromCart = useCallback(
        async (cartKey) => {
            try {
                console.log(`[Cart] Attempting to remove: ${cartKey}`);
                const cartItem = state.cartItems.find(
                    (item) => item.cartKey === cartKey || String(item.cartItemId) === String(cartKey)
                );

                if (!cartItem) {
                    console.warn("[Cart] Item not found:", cartKey);
                    return null;
                }

                previousStateRef.current = [...state.cartItems];
                const newItems = state.cartItems.filter(
                    (item) => item.cartKey !== cartKey && String(item.cartItemId) !== String(cartKey)
                );

                console.log(`[Cart] ✅ Removed item: ${cartItem.name}`);

                // Update UI ngay (optimistic)
                dispatch({ type: "UPDATE_ITEMS", payload: newItems });

                // Gọi API remove item
                try {
                    const cart = await cartService.remove(cartItem.cartItemId || cartItem.id);
                    dispatch({ type: "SYNCED", payload: cart });
                    console.log("[Cart] ✅ API remove successful");
                } catch (apiErr) {
                    console.error("[Cart] ❌ API remove failed:", apiErr);
                    // Revert UI nếu API fail
                    revertToPreview();
                    dispatch({ type: "ERROR", payload: apiErr.message ?? "Khong the xoa san pham khoi gio" });
                }

                return { items: newItems };
            } catch (err) {
                console.error("[Cart] ❌ Remove item error:", err);
                dispatch({ type: "ERROR", payload: err.message ?? "Khong the xoa san pham khoi gio" });
                // Not throwing - keep local state
            }
        },
        [state.cartItems, isLoggedIn]
    );

    // ===== addToCart: Optimistic update + API call =====
    const addToCart = useCallback(
        async (item) => {
            try {
                console.log(`[Cart] Attempting to add:`, item);
                const normalizedItem = normalizeCartItem(item);
                const newItems = [...state.cartItems];

                // Kiểm tra item đã tồn tại?
                const existingIndex = newItems.findIndex(
                    (i) => i.cartKey === normalizedItem.cartKey
                );

                previousStateRef.current = [...state.cartItems];

                if (existingIndex >= 0) {
                    // Item tồn tại: cộng quantity
                    const oldQty = newItems[existingIndex].quantity;
                    const addedQty = normalizedItem.quantity || 1;
                    newItems[existingIndex] = {
                        ...newItems[existingIndex],
                        quantity: oldQty + addedQty,
                    };
                    console.log(`[Cart] ✅ Updated quantity: ${normalizedItem.name} (${oldQty} → ${oldQty + addedQty})`);
                } else {
                    // Item mới: thêm vào
                    newItems.push(normalizedItem);
                    console.log(`[Cart] ✅ Added item: ${normalizedItem.name} (x${normalizedItem.quantity})`);
                }

                // Update UI ngay (optimistic)
                dispatch({ type: "UPDATE_ITEMS", payload: newItems });
                console.log(`[Cart] UI updated, items count: ${newItems.length}`);

                // Gọi API add item
                try {
                    const cart = await cartService.add(normalizedItem);
                    dispatch({ type: "SYNCED", payload: cart });
                    console.log("[Cart] ✅ API add successful");
                } catch (apiErr) {
                    console.error("[Cart] ❌ API add failed:", apiErr);
                    // Revert UI nếu API fail
                    revertToPreview();
                    dispatch({ type: "ERROR", payload: apiErr.message ?? "Khong the them san pham vao gio" });
                }

                return { items: newItems };
            } catch (err) {
                console.error("[Cart] ❌ Add to cart error:", err);
                dispatch({ type: "ERROR", payload: err.message ?? "Khong the them san pham vao gio" });
                // Not throwing - keep local state
            }
        },
        [state.cartItems, isLoggedIn]
    );

    // ===== updateCartItemQuantity: Optimistic update + API call =====
    const updateCartItemQuantity = useCallback(
        async (cartKey, quantity) => {
            try {
                console.log(`[Cart] Attempting to update quantity: ${cartKey} → ${quantity}`);

                if (quantity <= 0) {
                    console.log("[Cart] Quantity <= 0, removing item instead");
                    return removeFromCart(cartKey);
                }

                const cartItem = state.cartItems.find(
                    (item) => item.cartKey === cartKey || String(item.cartItemId) === String(cartKey)
                );

                if (!cartItem) {
                    console.error("[Cart] ❌ Item not found:", cartKey);
                    throw new Error("San pham khong ton tai trong gio");
                }

                previousStateRef.current = [...state.cartItems];
                const newItems = state.cartItems.map((item) =>
                    item.cartKey === cartKey || String(item.cartItemId) === String(cartKey)
                        ? { ...item, quantity }
                        : item
                );

                console.log(`[Cart] ✅ Updated quantity: ${cartItem.name} (${cartItem.quantity} → ${quantity})`);

                // Update UI ngay (optimistic)
                dispatch({ type: "UPDATE_ITEMS", payload: newItems });
                console.log(`[Cart] UI updated`);

                // Gọi API update quantity
                try {
                    const cart = await cartService.update(cartItem.cartItemId || cartItem.id, quantity);
                    dispatch({ type: "SYNCED", payload: cart });
                    console.log("[Cart] ✅ API update successful");
                } catch (apiErr) {
                    console.error("[Cart] ❌ API update failed:", apiErr);
                    // Revert UI nếu API fail
                    revertToPreview();
                    dispatch({ type: "ERROR", payload: apiErr.message ?? "Khong the cap nhat gio hang" });
                }

                return { items: newItems };
            } catch (err) {
                console.error("[Cart] ❌ Update quantity error:", err);
                dispatch({ type: "ERROR", payload: err.message ?? "Khong the cap nhat gio hang" });
                // Not throwing - keep local state
            }
        },
        [state.cartItems, isLoggedIn, removeFromCart]
    );

    // ===== clearCart =====
    const clearCart = useCallback(async () => {
        dispatch({ type: "INIT_LOADING" });

        try {
            console.log("[Cart] Clearing cart...");
            clearGuestCart();
            dispatch({
                type: "SYNCED",
                payload: {
                    id: null,
                    sessionToken: cartService.getSessionToken(),
                    items: [],
                },
            });
            console.log("[Cart] Cart cleared from localStorage");
        } catch (err) {
            console.error("[Cart] Clear cart error:", err);
            dispatch({ type: "ERROR", payload: err.message ?? "Khong the xoa gio hang" });
            throw err;
        }
    }, []);

    // ===== Computed values =====
    const cartCount = useMemo(
        () => state.cartItems.reduce((total, item) => total + item.quantity, 0),
        [state.cartItems]
    );

    const cartSubtotal = useMemo(
        () => state.cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
        [state.cartItems]
    );

    const contextValue = useMemo(
        () => ({
            // State
            cartId: state.cartId,
            sessionToken: state.sessionToken,
            cartItems: state.cartItems,
            items: state.cartItems,
            status: state.status,
            error: state.error,

            // Computed
            cartCount,
            count: cartCount,
            cartSubtotal,
            subtotal: cartSubtotal,

            // Status helpers
            isLoading: state.status === "loading",
            isSyncing: state.status === "syncing",
            isSynced: state.status === "idle" || state.status === "syncing",
            cartError: state.error,

            // Methods
            syncCart,
            addToCart,
            addItem: addToCart,
            updateCartItemQuantity,
            updateItemQuantity: updateCartItemQuantity,
            removeFromCart,
            removeItem: removeFromCart,
            clearCart,
        }),
        [state, cartCount, cartSubtotal, syncCart, addToCart, updateCartItemQuantity, removeFromCart, clearCart]
    );

    return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}
