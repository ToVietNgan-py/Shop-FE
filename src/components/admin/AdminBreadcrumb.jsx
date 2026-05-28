import { Breadcrumb } from 'antd';
import { Link, useLocation } from 'react-router-dom';

const ROUTE_LABELS = {
    'admin': 'Admin',
    'dashboard': 'Dashboard',
    'san-pham': 'Sản phẩm',
    'loai-san-pham': 'Danh mục',
    'don-hang': 'Đơn hàng',
    'khuyen-mai': 'Khuyến mãi',
    'promotions': 'Chiến dịch Khuyến mãi',
    'tai-khoan': 'Tài khoản',
};

export default function AdminBreadcrumb() {
    const { pathname } = useLocation();

    // pathname = "/admin/khuyen-mai" → ["admin", "khuyen-mai"]
    const segments = pathname.split('/').filter(Boolean);

    const items = [
        { title: <Link to="/">Home</Link> },
        ...segments.map((seg, idx) => {
            const path = '/' + segments.slice(0, idx + 1).join('/');
            const label = ROUTE_LABELS[seg] ?? seg;
            const isLast = idx === segments.length - 1;
            return {
                title: isLast ? label : <Link to={path}>{label}</Link>,
            };
        }),
    ];

    return <Breadcrumb items={items} />;
}
