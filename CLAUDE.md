# shop_fe — Hướng dẫn cho Claude Code

Frontend của dự án **Shop thời trang Dear Rose**. React 19 + Vite + Sass.
Project gồm 2 luồng nghiệp vụ:
- **User-side**: trang khách (home, sản phẩm, giỏ hàng, checkout, đơn hàng).
- **Admin/Employee-side**: chưa được tạo — sẽ nằm dưới `src/pages/admin/` và có layout riêng.

## Tech stack

- React 19.2 (đã bật `babel-plugin-react-compiler`)
- Vite 8 (dev: `npm run dev`, build: `npm run build`)
- React Router 7 (route config tập trung tại `src/routes/default.jsx`)
- Sass/SCSS (file `.scss` đặt cùng cấp component)
- Axios (instance dùng chung tại `src/apis/default.js`, baseURL hiện trỏ về Laravel: `http://localhost:3000/api` — sẽ đổi sang `http://127.0.0.1:8000/api` khi làm việc với BE thật)
- State: **React Context API** — `AuthContext`, `CartContext` trong `src/context/`
- UI: custom SCSS, không dùng UI lib (admin sắp tới có thể thêm Ant Design)
- Icons: `react-icons`
- Carousel: `swiper`, custom logic
- Không dùng TypeScript (file `.jsx`), không dùng form library (vanilla controlled inputs + HTML5 validation)

## Cấu trúc folder

```
src/
├── apis/            # Axios instance + service theo module
│   ├── default.js   # axios instance dùng chung
│   ├── cart.js      # đang dùng localStorage
│   ├── order.js     # ⚠️ đang mock (USE_ORDER_API_MOCK = true)
│   └── region.js    # gọi provinces.open-api.vn
├── components/      # Component dùng chung (AuthModal, Cart, BestSeller…)
├── context/         # AuthContext, CartContext
├── data/            # Mock data (sẽ bỏ khi nối BE thật)
├── hooks/           # Custom hooks
├── pages/
│   └── users/       # Tất cả trang khách hàng
│       ├── homePage/
│       ├── productPage/
│       ├── ProductDetail/
│       ├── Checkout/
│       ├── Orders/         # stub
│       ├── theme/          # Header, Footer
│       └── ...policy pages (stub)
├── routes/default.jsx
├── style/           # SCSS global + theo page
└── utils/
```

Khi tạo **admin-side** (chưa có), đặt tại `src/pages/admin/<module>/index.jsx` và tách layout `src/pages/admin/_layout/AdminLayout.jsx`.

## Convention khi viết code

1. **Đặt file**: 1 page = 1 folder dưới `src/pages/users/<TenPage>/index.jsx`. SCSS đi cùng (`<TenPage>.scss` hoặc trong `src/style/pages/`).
2. **API call**: không gọi axios trực tiếp trong component. Tạo service trong `src/apis/<module>.js` rồi import.
3. **State global**: dùng Context có sẵn (`useAuth()`, `useCart()`); không tạo Context mới nếu chưa thực sự cần.
4. **Style**: SCSS module-scoped bằng class prefix theo tên page (vd `.product-detail`). Tránh inline style trừ trường hợp dynamic.
5. **Routing**: thêm route tại `src/routes/default.jsx`. Path tiếng Việt không dấu, gạch ngang (`/san-pham`, `/thanh-toan`).
6. **Form validation**: hiện chỉ dùng HTML5 `required`. Khi cần phức tạp hãy đề xuất `react-hook-form + zod`.
7. **Không tự cài** package mới mà không hỏi user trước.

## Commands

```bash
npm install
npm run dev       # dev server (cổng vite mặc định 5173)
npm run build     # production build
npm run preview   # preview build
npm run lint      # eslint
```

## Lưu ý quan trọng (gap hiện tại)

- ⚠️ **Order API đang mock**: `src/apis/order.js` có biến `USE_ORDER_API_MOCK = true`. Khi BE sẵn sàng, đổi thành `false` và sửa lại payload theo contract thật.
- ⚠️ **Auth chưa secure**: hiện lưu `password` plaintext trong `localStorage` (`AuthContext`). Phải thay bằng JWT thật khi nối BE — chỉ lưu token.
- ⚠️ **Mock data sản phẩm**: `src/data/product.js` có 30+ item; cần thay bằng `GET /api/products` ở Phase 2.
- ⚠️ **Admin hoàn toàn chưa có**: 0% tiến độ — toàn bộ Admin/Employee portal sẽ làm ở Phase 4.
- ⚠️ **i18n / theme / TypeScript / form library**: chưa có, để dành Phase 6.

## Tài khoản test

- Admin BE seed sẵn: `admin@gmail.com` / `123456` (dùng để test login khi nối JWT).

## Roadmap chi tiết

Xem báo cáo HTML: [`F:\shop_fe\shop-assessment.html`](../shop-assessment.html). 6 phase, ~10 tuần.

## Hành vi mong đợi của Claude trong source này

- Trả lời tiếng Việt khi user hỏi tiếng Việt.
- Khi tạo page mới: tạo folder + `index.jsx` + SCSS, đăng ký route, không tự ý cài UI lib mới.
- Khi nối API: tạo service trong `src/apis/`, không gọi axios trực tiếp trong component.
- Khi đụng tới `src/apis/order.js`: nhớ xét cờ `USE_ORDER_API_MOCK`.
- Khi user yêu cầu việc chỉ liên quan FE, không tự ý đụng vào `F:\shop_backend`.
