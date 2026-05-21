import ProfileRow from "./ProfileRow";
import { FiCalendar, FiMail, FiMapPin, FiPhone, FiUser, FiUsers } from "react-icons/fi";
import "./style.scss";

export default function ProfileInfo({ user, openModal }) {
    const genderLabel = {
        male: "Nam",
        female: "Nữ",
        other: "Khác",
    }[user.gender] ?? user.gender;

    return (
        <div className="content">
            <div className="content-header">
                <div>
                    <span className="content-eyebrow">Tài khoản của tôi</span>
                    <h2>Thông tin cá nhân</h2>
                    <p className="subtitle">Quản lý thông tin liên hệ và hồ sơ mua hàng của bạn.</p>
                </div>
            </div>

            <div className="info-card">
                <ProfileRow
                    label="Họ và tên"
                    value={user.name}
                    onClick={() => openModal("name")}
                    icon={FiUser}
                />

                <ProfileRow
                    label="Ngày sinh"
                    value={user.dob || "Chưa cập nhật"}
                    onClick={() => openModal("dob")}
                    icon={FiCalendar}
                />

                <ProfileRow
                    label="Giới tính"
                    value={genderLabel || "Chưa cập nhật"}
                    onClick={() => openModal("gender")}
                    icon={FiUsers}
                />

                <ProfileRow
                    label="Số điện thoại"
                    value={user.phone || "Chưa cập nhật"}
                    onClick={() => openModal("phone")}
                    icon={FiPhone}
                />

                <ProfileRow
                    label="Email"
                    value={user.email}
                    locked
                    icon={FiMail}
                />

                <ProfileRow
                    label="Địa chỉ"
                    value={user.address || "Chưa cập nhật"}
                    onClick={() => openModal("address")}
                    icon={FiMapPin}
                />
            </div>
        </div>
    );
}
