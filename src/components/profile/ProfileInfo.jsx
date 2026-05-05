import ProfileRow from "./ProfileRow";
import "./style.scss";

export default function ProfileInfo({ user, openModal }) {
    return (
        <div className="content">
            <div className="content-header">
                <h2>Thông tin cá nhân</h2>
            </div>



            <div className="info-card">
                <ProfileRow
                    label="Họ và tên"
                    value={user.name}
                    onClick={() => openModal("name")}
                />

                <ProfileRow
                    label="Ngày sinh"
                    value={user.dob || "Chưa cập nhật"}
                    onClick={() => openModal("dob")}
                />

                <ProfileRow
                    label="Giới tính"
                    value={user.gender || "Chưa cập nhật"}
                    onClick={() => openModal("gender")}
                />

                <ProfileRow
                    label="Số điện thoại"
                    value={user.phone || "Chưa cập nhật"}
                    onClick={() => openModal("phone")}
                />

                <ProfileRow
                    label="Email"
                    value={user.email}
                    locked
                />

                <ProfileRow
                    label="Địa chỉ"
                    value={user.address || "Chưa cập nhật"}
                    onClick={() => openModal("address")}
                />
            </div>
        </div>
    );
}
