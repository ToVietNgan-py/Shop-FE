import { BrowserRouter, useLocation } from "react-router-dom";
import "./App.css";
import AppRoutes from "./routes/default.jsx";
import Header from "./pages/users/theme/header/index.jsx";
import Footer from "./pages/users/theme/footer/index.jsx";
import CheckoutHeader from "./pages/users/Checkout/CheckoutHeader.jsx";

function AppShell() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const isCheckoutPage = location.pathname.startsWith("/thanh-toan") || location.pathname.startsWith("/tai-khoan") || location.pathname.startsWith("/don-hang");

  if (isAdminPage) {
    return (
      <main className="app-content app-content--admin">
        <AppRoutes />
      </main>
    );
  }

  return (
    <div className="app-shell">
      {isCheckoutPage ? <CheckoutHeader /> : <Header />}
      <main className="app-content">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

function App() {

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
