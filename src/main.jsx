import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
// import "antd/dist/reset.css";
import "./style/tokens.scss";
import "./style/style.scss";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { LocaleProvider } from "./context/LocaleContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ThemeProvider>
            <LocaleProvider>
                <AuthProvider>
                    <WishlistProvider>
                        <CartProvider>
                            <App />
                        </CartProvider>
                    </WishlistProvider>
                </AuthProvider>
            </LocaleProvider>
        </ThemeProvider>
    </StrictMode>
);
