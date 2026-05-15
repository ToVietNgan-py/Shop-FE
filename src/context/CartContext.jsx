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
                const guestItems = loadGuestCart();
                let cart;

                if (isLoggedIn) {
                    try {
                        if (!mergedRef.current && guestItems.length > 0) {
                            console.log("[Cart] 🔄 Login detected - merging guest cart to server", guestItems);
                            const merged = await cartService.mergeGuestCart(guestItems);
                            clearGuestCart();
                            mergedRef.current = true;

                            if (isMounted) {
                                dispatch({ type: "SYNCED", payload: merged });
                                return;
                            }
                        }

                        const serverCart = await cartService.get();
                        if (isMounted) {
                            dispatch({ type: "SYNCED", payload: serverCart });
                            return;
                        }
                    } catch (err) {
                        console.error("[Cart] ❌ Error syncing/merging cart for logged-in user:", err);
                    }
                }

                if (!isLoggedIn) {
                    mergedRef.current = false;
                }

                cart = {
                    id: null,
                    sessionToken: cartService.getSessionToken(),
                    items: guestItems,
                };

                console.log("[Cart] 💾 Using localStorage cart", cart);

                if (isMounted) {
                    dispatch({ type: "SYNCED", payload: cart });
                }
            } catch (err) {
                console.error("[Cart] ❌ Load cart error:", err);
                const fallbackItems = loadGuestCart();
                if (isMounted && fallbackItems.length > 0) {
                    console.log("[Cart] 🛟 Fallback to localStorage items (last resort)");
                    dispatch({
                        type: "SYNCED",
                        payload: {
                            id: null,
                            sessionToken: cartService.getSessionToken(),
                            items: fallbackItems,
                        },
                    });
                    return;
                }

                if (isMounted) {
                    dispatch({ type: "ERROR", payload: err.message ?? "Khong the tai gio hang" });
                }
            }
        }

        loadCart();

        return () => {
            isMounted = false;
        };
    }, [isLoggedIn]);

    // ===== Debounced sync to server (logged-in) or localStorage (guest) =====
    const debouncedSync = useCallback(
        (updatedItems, operationType) => {
            if (debounceTimersRef.current[operationType]) {
                clearTimeout(debounceTimersRef.current[operationType]);
            }

            debounceTimersRef.current[operationType] = setTimeout(async () => {
                dispatch({ type: "SYNCING" });

                try {
                    if (isLoggedIn) {
                        try {
                            await cartService.clear();
                        } catch (clearErr) {
                            console.warn("[Cart] server clear failed (ignored):", clearErr?.message);
                        }

                        if (updatedItems.length > 0) {
                            const cart = await cartService.mergeGuestCart(updatedItems);
                            dispatch({ type: "SYNCED", payload: cart });
                        } else {
                            dispatch({
                                type: "SYNCED",
                                payload: {
                                    id: null,
                                    sessionToken: cartService.getSessionToken(),
                                    items: [],
                                },
                            });
                        }

                        clearGuestCart();
                    } else {
                        saveGuestCart(updatedItems);
                        dispatch({ type: "UPDATE_ITEMS", payload: updatedItems });
                    }
                } catch (err) {
                    console.error("[Cart] Sync error:", err);
                    dispatch({
                        type: "ERROR",
                        payload: err?.message ?? "Khong dong bo duoc gio hang.",
                    });
                    dispatch({ type: "UPDATE_ITEMS", payload: updatedItems });
                } finally {
                    previousStateRef.current = null;
                }
            }, 300);
        },
        [isLoggedIn]
    );

    // ===== Cleanup: Hủy tất cả debounce timers khi unmount =====
    useEffect(() => {
        return () => {
            Object.values(debounceTimersRef.current).forEach(clearTimeout);
        };
    }, []);

    // ===== removeFromCart: Optimistic update + debounce =====
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

                dispatch({ type: "UPDATE_ITEMS", payload: newItems });
                debouncedSync(newItems, "removeItem");

                return { items: newItems };
            } catch (err) {
                console.error("[Cart] ❌ Remove item error:", err);
                dispatch({ type: "ERROR", payload: err.message ?? "Khong the xoa san pham khoi gio" });
            }
        },
        // FIX: bỏ isLoggedIn khỏi deps vì không dùng trực tiếp trong hàm này
        [state.cartItems, debouncedSync]
    );

    // ===== addToCart: Optimistic update + debounce =====
    const addToCart = useCallback(
        async (item) => {
            try {
                console.log(`[Cart] Attempting to add:`, item);
                const normalizedItem = normalizeCartItem(item);
                const newItems = [...state.cartItems];

                const existingIndex = newItems.findIndex(
                    (i) => i.cartKey === normalizedItem.cartKey
                );

                previousStateRef.current = [...state.cartItems];

                if (existingIndex >= 0) {
                    const oldQty = newItems[existingIndex].quantity;
                    const addedQty = normalizedItem.quantity || 1;
                    newItems[existingIndex] = {
                        ...newItems[existingIndex],
                        quantity: oldQty + addedQty,
                    };
                    console.log(`[Cart] ✅ Updated quantity: ${normalizedItem.name} (${oldQty} → ${oldQty + addedQty})`);
                } else {
                    newItems.push(normalizedItem);
                    console.log(`[Cart] ✅ Added item: ${normalizedItem.name} (x${normalizedItem.quantity})`);
                }

                dispatch({ type: "UPDATE_ITEMS", payload: newItems });
                console.log(`[Cart] UI updated, items count: ${newItems.length}`);

                debouncedSync(newItems, "addToCart");

                return { items: newItems };
            } catch (err) {
                console.error("[Cart] ❌ Add to cart error:", err);
                dispatch({ type: "ERROR", payload: err.message ?? "Khong the them san pham vao gio" });
            }
        },
        [state.cartItems, debouncedSync]
    );

    // ===== updateCartItemQuantity: Optimistic update + debounce =====
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

                dispatch({ type: "UPDATE_ITEMS", payload: newItems });
                console.log(`[Cart] UI updated`);

                debouncedSync(newItems, "updateQuantity");

                return { items: newItems };
            } catch (err) {
                console.error("[Cart] ❌ Update quantity error:", err);
                dispatch({ type: "ERROR", payload: err.message ?? "Khong the cap nhat gio hang" });
            }
        },
        [state.cartItems, debouncedSync, removeFromCart]
    );

    // ===== clearCart =====
    const clearCart = useCallback(async () => {
        dispatch({ type: "INIT_LOADING" });

        try {
            if (isLoggedIn) {
                const cart = await cartService.clear();
                clearGuestCart();
                dispatch({ type: "SYNCED", payload: cart });
            } else {
                clearGuestCart();
                dispatch({
                    type: "SYNCED",
                    payload: {
                        id: null,
                        sessionToken: cartService.getSessionToken(),
                        items: [],
                    },
                });
            }
        } catch (err) {
            console.error("[Cart] Clear cart error:", err);
            dispatch({ type: "ERROR", payload: err.message ?? "Khong the xoa gio hang" });
            throw err;
        }
    }, [isLoggedIn]);

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