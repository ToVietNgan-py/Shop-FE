/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { cartService, normalizeCartItem } from "../services/cartService.js";
import { AuthContext } from "./AuthContext.jsx";

const GUEST_CART_KEY = "guest_cart";

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
    status: "loading",
    error: null,
};

const syncPayload = (cart) => ({
    cartId: cart?.id ?? null,
    sessionToken: cart?.sessionToken ?? cartService.getSessionToken(),
    cartItems: cart?.items ?? [],
});

const cartReducer = (state, action) => {
    switch (action.type) {
        case "LOADING":
            return { ...state, status: "loading", error: null };
        case "SYNCED":
            return { ...state, ...syncPayload(action.payload), status: "synced", error: null };
        case "ERROR":
            return { ...state, status: "error", error: action.payload };
        default:
            return state;
    }
};

export const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [state, dispatch] = useReducer(cartReducer, initialState);
    const { user } = useContext(AuthContext) ?? {};
    const isLoggedIn = Boolean(user);

    const syncCart = useCallback(async () => {
        dispatch({ type: "LOADING" });

        try {
            const cart = await cartService.get();
            dispatch({ type: "SYNCED", payload: cart });
            return cart;
        } catch (err) {
            dispatch({ type: "ERROR", payload: err.message ?? "Khong the tai gio hang" });
            throw err;
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function loadCart() {
            dispatch({ type: "LOADING" });

            try {
                const guestItems = loadGuestCart();
                const cart = isLoggedIn && guestItems.length > 0
                    ? await cartService.mergeGuestCart(guestItems)
                    : await cartService.get();

                if (isLoggedIn) {
                    clearGuestCart();
                }

                if (isMounted) {
                    dispatch({ type: "SYNCED", payload: cart });
                }
            } catch (err) {
                const fallbackItems = loadGuestCart();

                if (isMounted && fallbackItems.length > 0) {
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

    useEffect(() => {
        if (!isLoggedIn && state.status === "synced") {
            saveGuestCart(state.cartItems);
        }
    }, [isLoggedIn, state.cartItems, state.status]);

    const addToCart = useCallback(async (item) => {
        dispatch({ type: "LOADING" });

        try {
            const cart = await cartService.add(item);
            dispatch({ type: "SYNCED", payload: cart });
            return cart;
        } catch (err) {
            dispatch({ type: "ERROR", payload: err.message ?? "Khong the them san pham vao gio" });
            throw err;
        }
    }, []);

    const removeFromCart = useCallback(async (cartKey) => {
        const cartItem = state.cartItems.find((item) => item.cartKey === cartKey || String(item.cartItemId) === String(cartKey));

        if (!cartItem?.cartItemId) {
            return null;
        }

        dispatch({ type: "LOADING" });

        try {
            const cart = await cartService.remove(cartItem.cartItemId);
            dispatch({ type: "SYNCED", payload: cart });
            return cart;
        } catch (err) {
            dispatch({ type: "ERROR", payload: err.message ?? "Khong the xoa san pham khoi gio" });
            throw err;
        }
    }, [state.cartItems]);

    const updateCartItemQuantity = useCallback(async (cartKey, quantity) => {
        if (quantity <= 0) {
            return removeFromCart(cartKey);
        }

        const cartItem = state.cartItems.find((item) => item.cartKey === cartKey || String(item.cartItemId) === String(cartKey));

        if (!cartItem?.cartItemId) {
            return null;
        }

        dispatch({ type: "LOADING" });

        try {
            const cart = await cartService.update(cartItem.cartItemId, quantity);
            dispatch({ type: "SYNCED", payload: cart });
            return cart;
        } catch (err) {
            dispatch({ type: "ERROR", payload: err.message ?? "Khong the cap nhat gio hang" });
            throw err;
        }
    }, [removeFromCart, state.cartItems]);

    const clearCart = useCallback(async () => {
        dispatch({ type: "LOADING" });

        try {
            const cart = await cartService.clear(state.cartId);
            clearGuestCart();
            dispatch({ type: "SYNCED", payload: cart });
            return cart;
        } catch (err) {
            dispatch({ type: "ERROR", payload: err.message ?? "Khong the xoa gio hang" });
            throw err;
        }
    }, [state.cartId]);

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
            cartId: state.cartId,
            sessionToken: state.sessionToken,
            cartItems: state.cartItems,
            items: state.cartItems,
            status: state.status,
            error: state.error,
            cartCount,
            count: cartCount,
            cartSubtotal,
            subtotal: cartSubtotal,
            isLoading: state.status === "loading",
            isSynced: state.status === "synced",
            cartError: state.error,
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
