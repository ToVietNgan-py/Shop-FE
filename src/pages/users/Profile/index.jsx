import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getProfile, updateProfile, changePassword } from "../../../services/userService.js";

import ProfileSidebar from "../../../components/profile/ProfileSidebar.jsx";
import ProfileInfo from "../../../components/profile/ProfileInfo.jsx";
import ProfileModal from "../../../components/profile/ProfileModal.jsx";
import "./style.scss";

export default function ProfilePage() {
    const location = useLocation();

    const [user, setUser] = useState(null);
    const [field, setField] = useState(null);
    const [tempValue, setTempValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Fetch profile data from API
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getProfile();
            setUser(res);
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError(err?.message || "Không thể tải thông tin profile");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (f) => {
        // If it's password change, handle differently
        if (f === "password") {
            setField("password");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } else {
            setField(f);
            setTempValue(user?.[f] || "");
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSavePassword = async () => {
        const { currentPassword, newPassword, confirmPassword } = passwordData;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Mật khẩu mới không khớp");
            return;
        }

        if (newPassword.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            // Call API to change password
            await changePassword({
                current_password: currentPassword,
                new_password: newPassword,
            });

            // Close modal and show success
            setField(null);
            setError("Đổi mật khẩu thành công!");

            // Clear error after 3 seconds
            setTimeout(() => setError(null), 3000);
        } catch (err) {
            console.error("Error changing password:", err);
            setError(err.response?.data?.message || "Không thể đổi mật khẩu. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    // Handle menu change from sidebar
    const handleMenuChange = (menuKey) => {
        if (menuKey === "password") {
            openModal("password");
        }
    };

    const handleSave = async () => {
        if (!field) return;

        try {
            setSaving(true);
            setError(null);

            // Call API to update profile
            await updateProfile({ [field]: tempValue });

            // Update local state with new value
            setUser((prev) => ({
                ...prev,
                [field]: tempValue,
            }));

            // Close modal
            setField(null);
        } catch (err) {
            console.error("Error updating profile:", err);
            setError("Không thể cập nhật thông tin. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    // Determine active menu based on current path
    const getActiveMenu = () => {
        const path = location.pathname;
        if (path.includes("don-hang")) return "orders";
        if (path.includes("addresses")) return "addresses";
        if (path.includes("loyalty")) return "loyalty";
        if (field === "password") return "password";
        return "info";
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-page">
                <div className="error-message">
                    {error || "Không thể tải thông tin tài khoản."}
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {error && (
                <div className="error-message" onClick={() => setError(null)}>
                    {error}
                </div>
            )}

            <div className="profile-container">
                <ProfileSidebar
                    user={user}
                    activeMenu={getActiveMenu()}
                    onMenuChange={handleMenuChange}
                />

                <ProfileInfo user={user} openModal={openModal} />
            </div>

            {field === "password" ? (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Đổi mật khẩu</h3>

                        <div className="password-form">
                            <label>Mật khẩu hiện tại</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                placeholder="Nhập mật khẩu hiện tại"
                                disabled={saving}
                            />

                            <label>Mật khẩu mới</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                placeholder="Nhập mật khẩu mới"
                                disabled={saving}
                            />

                            <label>Xác nhận mật khẩu mới</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder="Xác nhận mật khẩu mới"
                                disabled={saving}
                            />
                        </div>

                        <div className="modal-btns">
                            <button onClick={handleSavePassword} disabled={saving}>
                                {saving ? "Đang lưu..." : "Lưu"}
                            </button>
                            <button onClick={() => setField(null)} disabled={saving}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            ) : field && (
                <ProfileModal
                    field={field}
                    value={tempValue}
                    setValue={setTempValue}
                    onSave={handleSave}
                    onClose={() => setField(null)}
                    saving={saving}
                />
            )}
        </div>
    );
}
