import { Navigate, useLocation } from 'react-router-dom';

// ✅ FIX: AuthContext lưu key 'access_token', KHÔNG phải 'token'
const RequireAuth = ({ children }) => {
    const location = useLocation();
    const token = localStorage.getItem('access_token');

    if (token) return children;

    // Truyền redirect path để sau khi login quay về đúng /checkout
    return <Navigate to="/login" state={{ from: location }} replace />;
};

export default RequireAuth;
