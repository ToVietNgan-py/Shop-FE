// import { BrowserRouter, useLocation } from "react-router-dom";
// import { ConfigProvider } from "antd";
// import "./App.css";
// import AppRoutes from "./routes/default.jsx";
// import Header from "./pages/users/theme/header/index.jsx";
// import Footer from "./pages/users/theme/footer/index.jsx";
// import CheckoutHeader from "./pages/users/Checkout/CheckoutHeader.jsx";

// // Ant Design theme config — brand color: Dear Rose (rose/pink)
// const antdTheme = {
//   token: {
//     colorPrimary: "#ec4899",
//     colorSuccess: "#10b981",
//     colorWarning: "#f59e0b",
//     colorError: "#ef4444",
//     borderRadius: 8,
//     fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
//   },
//   components: {
//     Table: {
//       borderColor: "#e5e7eb",
//       headerBg: "#f9fafb",
//       headerTextColor: "#4b5563"
//     },
//     Button: {
//       borderRadius: 8,
//       controlHeight: 40
//     }
//   }
// };

// function AppShell() {
//   const location = useLocation();
//   const isAdminPage = location.pathname.startsWith("/admin");
//   const isCheckoutPage = location.pathname.startsWith("/thanh-toan") || location.pathname.startsWith("/tai-khoan") || location.pathname.startsWith("/don-hang");

//   if (isAdminPage) {
//     return (
//       <main className="app-content app-content--admin">
//         <AppRoutes />
//       </main>
//     );
//   }

//   return (
//     <div className="app-shell">
//       {isCheckoutPage ? <CheckoutHeader /> : <Header />}
//       <main className="app-content">
//         <AppRoutes />
//       </main>
//       <Footer />
//     </div>
//   );
// }

// function App() {

//   return (
//     <ConfigProvider theme={antdTheme}>
//       <BrowserRouter>
//         <AppShell />
//       </BrowserRouter>
//     </ConfigProvider>
//   );
// }

// export default App;
import { BrowserRouter, useLocation } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import "./App.css";

import AppRoutes from "./routes/default.jsx";
import Header from "./pages/users/theme/header/index.jsx";
import Footer from "./pages/users/theme/footer/index.jsx";
import CheckoutHeader from "./pages/users/Checkout/CheckoutHeader.jsx";

// Ant Design theme config — brand color: Dear Rose (rose/pink)
const antdTheme = {
  token: {
    colorPrimary: "#ec4899",
    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    borderRadius: 8,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Table: {
      borderColor: "#e5e7eb",
      headerBg: "#f9fafb",
      headerTextColor: "#4b5563",
    },
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    },
  },
};

function AppShell() {
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith("/admin");

  const isCheckoutPage =
    location.pathname.startsWith("/thanh-toan") ||
    location.pathname.startsWith("/tai-khoan") ||
    location.pathname.startsWith("/don-hang");

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
    <ConfigProvider theme={antdTheme}>
      <AntApp>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
