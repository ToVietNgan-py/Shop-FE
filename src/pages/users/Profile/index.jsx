import { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "react-router-dom";
import { getProfile, updateProfile, changePassword } from "../../../services/userService.js";
import { changePasswordSchema } from "../../../validations/profileSchema.js";

import ProfileSidebar from "../../../components/profile/ProfileSidebar.jsx";
import ProfileInfo from "../../../components/profile/ProfileInfo.jsx";
import ProfileModal from "../../../components/profile/ProfileModal.jsx";
import { AuthContext } from "../../../context/AuthContext.jsx";
import "./style.scss";

const getProfilePayload = (payload) => {
    if (!payload || typeof payload !== "object") return {};
    return payload.user ?? payload.profile ?? payload.data?.user ?? payload.data?.profile ?? payload.data ?? payload;
};

export default function ProfilePage() {
    const location = useLocation();
    const { updateUserContext } = useContext(AuthContext);

    const [user, setUser] = useState(null);
    const [field, setField] = useState(null);
    const [tempValue, setTempValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors: passwordErrors, isSubmitting: isSavingPassword },
    } = useForm({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getProfile();
            setUser(res);
            updateUserContext?.(res);
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError(err?.message || "Không thể tải thông tin profile");
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [updateUserContext]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const openModal = (nextField) => {
        if (nextField === "password") {
            setField("password");
            reset({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
            return;
        }

        setField(nextField);
        setTempValue(user?.[nextField] || "");
    };

    const handleSavePassword = async ({ currentPassword, newPassword }) => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);
            await changePassword({
                current_password: currentPassword,
                new_password: newPassword,
            });

            setField(null);
            setSuccess("Đổi mật khẩu thành công!");
            window.setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error("Error changing password:", err);
            setError(err.response?.data?.message || "Không thể đổi mật khẩu. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const handleMenuChange = (menuKey) => {
        if (menuKey === "password") {
            openModal("password");
        }
    };

    const handleSave = async (nextValue = tempValue) => {
        if (!field) return;

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const updatedProfile = await updateProfile({ [field]: nextValue });
            const profilePayload = getProfilePayload(updatedProfile);

            setUser((prev) => {
                const nextUser = {
                    ...prev,
                    ...profilePayload,
                    [field]: nextValue,
                };
                updateUserContext?.(nextUser);
                return nextUser;
            });

            setField(null);
            setSuccess("Cập nhật thông tin thành công!");
            window.setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err?.message || "Không thể cập nhật thông tin. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

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
            {success && (
                <div className="success-message" onClick={() => setSuccess(null)}>
                    {success}
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
                    <form className="modal" onSubmit={handleSubmit(handleSavePassword)} noValidate>
                        <h3>Đổi mật khẩu</h3>

                        <div className="password-form">
                            <label>Mật khẩu hiện tại</label>
                            <input
                                type="password"
                                placeholder="Nhập mật khẩu hiện tại"
                                disabled={isSavingPassword}
                                {...register("currentPassword")}
                            />
                            {passwordErrors.currentPassword ? <p className="form-error">{passwordErrors.currentPassword.message}</p> : null}

                            <label>Mật khẩu mới</label>
                            <input
                                type="password"
                                placeholder="Nhập mật khẩu mới"
                                disabled={isSavingPassword}
                                {...register("newPassword")}
                            />
                            {passwordErrors.newPassword ? <p className="form-error">{passwordErrors.newPassword.message}</p> : null}

                            <label>Xác nhận mật khẩu mới</label>
                            <input
                                type="password"
                                placeholder="Xác nhận mật khẩu mới"
                                disabled={isSavingPassword}
                                {...register("confirmPassword")}
                            />
                            {passwordErrors.confirmPassword ? <p className="form-error">{passwordErrors.confirmPassword.message}</p> : null}
                        </div>

                        <div className="modal-btns">
                            <button type="submit" disabled={isSavingPassword}>
                                {isSavingPassword || saving ? "Đang lưu..." : "Lưu"}
                            </button>
                            <button type="button" onClick={() => setField(null)} disabled={isSavingPassword}>
                                Hủy
                            </button>
                        </div>
                    </form>
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
