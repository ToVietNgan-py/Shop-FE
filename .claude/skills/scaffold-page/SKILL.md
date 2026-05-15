---
name: scaffold-page
description: Scaffold a new React page in shop_fe — creates folder under src/pages/users/<name>/ (or src/pages/admin/<name>/) with index.jsx + SCSS, registers the route in src/routes/default.jsx. Use when the user says "tạo page <X>", "thêm trang <X>", or "scaffold trang admin <X>".
---

# Scaffold Page Skill

Tự động sinh khung 1 page React mới trong dự án shop_fe theo đúng convention.

## Khi nào dùng

User nói:
- "tạo page Wishlist"
- "thêm trang my profile cho user"
- "scaffold trang admin products"
- "tạo trang đơn hàng của tôi"

## Đầu vào cần hỏi user

1. **Tên page** (vd: `Wishlist`, `Profile`, `AdminProducts`).
2. **Luồng**: `users` hay `admin`?
3. **Route path** (vd: `/yeu-thich`, `/tai-khoan`, `/admin/san-pham`).

## Các bước thực hiện

### Bước 1 — Tạo folder + file
- Đường dẫn:
  - User: `src/pages/users/<TenPage>/index.jsx`
  - Admin: `src/pages/admin/<tenmodule>/index.jsx`
- Tạo SCSS đi cùng: `<TenPage>.scss` import trong `index.jsx`.

### Bước 2 — Template `index.jsx`

```jsx
import './<TenPage>.scss';

export default function <TenPage>() {
  return (
    <main className="<ten-page>">
      <h1 className="<ten-page>__title">{/* TODO: tiêu đề */}</h1>
      {/* TODO: nội dung */}
    </main>
  );
}
```

### Bước 3 — Template SCSS

```scss
.<ten-page> {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 16px;

  &__title {
    font-size: 24px;
    margin-bottom: 16px;
  }
}
```

### Bước 4 — Đăng ký route

Mở `src/routes/default.jsx`, import component và thêm route mới. **Đặt trước route catch-all `*`** nếu có.

### Bước 5 — Nếu là admin
- Đảm bảo `AdminLayout` đã tồn tại (`src/pages/admin/_layout/AdminLayout.jsx`). Nếu chưa, tạo layout cơ bản với sidebar + outlet và bọc các route admin trong layout đó.
- Thêm route guard kiểm tra role admin/employee từ token (ở giai đoạn sau, khi JWT đã nối).

### Bước 6 — Báo cáo

Kết thúc với:
- ✅ Files đã tạo
- 📍 URL test trong dev (`npm run dev` → mở `http://localhost:5173<route>`)
- ⚠️ TODO trong file mẫu cần user điền tiếp

## Quy tắc

- Không cài thêm package.
- Không đụng tới các page hiện có ngoại trừ `src/routes/default.jsx`.
- Tên class CSS dùng kebab-case theo BEM nhẹ (`.page-name`, `.page-name__element`).
