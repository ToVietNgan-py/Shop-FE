import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { regionApi } from "../../apis/region";
import { profileAddressSchema, profileFieldSchemas } from "../../validations/profileSchema";
import "./style.scss";

const fieldLabels = {
    name: "Họ và tên",
    dob: "Ngày sinh",
    gender: "Giới tính",
    phone: "Số điện thoại",
    email: "Email",
    address: "Địa chỉ",
    avatar: "Avatar",
};

const genderOptions = [
    { value: "", label: "Chọn giới tính" },
    { value: "male", label: "Nam" },
    { value: "female", label: "Nữ" },
    { value: "other", label: "Khác" },
];

export default function ProfileModal({
    field,
    value,
    setValue,
    onSave,
    onClose,
    saving = false,
}) {
    const isGender = field === "gender";
    const isDob = field === "dob";
    const isAddress = field === "address";
    const isAvatar = field === "avatar";
    const isLocked = field === "email";
    const schema = useMemo(() => profileFieldSchemas[field], [field]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: schema ? zodResolver(schema) : undefined,
        defaultValues: { value: value || "" },
    });

    const {
        register: registerAddress,
        handleSubmit: handleAddressSubmit,
        reset: resetAddress,
        setValue: setAddressValue,
        watch: watchAddress,
        formState: { errors: addressErrors },
    } = useForm({
        resolver: zodResolver(profileAddressSchema),
        defaultValues: {
            provinceCode: "",
            districtCode: "",
            wardCode: "",
            detailAddress: "",
        },
    });

    const selectedProvince = watchAddress("provinceCode");
    const selectedDistrict = watchAddress("districtCode");

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [loadingAddress, setLoadingAddress] = useState(false);

    useEffect(() => {
        reset({ value: value || "" });
    }, [reset, value]);

    useEffect(() => {
        if (isAddress) {
            resetAddress({
                provinceCode: "",
                districtCode: "",
                wardCode: "",
                detailAddress: "",
            });
        }
    }, [isAddress, resetAddress]);

    useEffect(() => {
        if (!isAddress) {
            return;
        }

        let isMounted = true;
        setLoadingAddress(true);

        regionApi.getProvinces()
            .then((data) => {
                if (isMounted) setProvinces(data || []);
            })
            .catch((error) => console.error("Error loading provinces:", error))
            .finally(() => {
                if (isMounted) setLoadingAddress(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isAddress]);

    useEffect(() => {
        if (!selectedProvince) {
            setDistricts([]);
            setWards([]);
            return;
        }

        let isMounted = true;
        setLoadingAddress(true);
        setAddressValue("districtCode", "");
        setAddressValue("wardCode", "");

        regionApi.getDistricts(selectedProvince)
            .then((data) => {
                if (isMounted) setDistricts(data || []);
            })
            .catch((error) => console.error("Error loading districts:", error))
            .finally(() => {
                if (isMounted) setLoadingAddress(false);
            });

        return () => {
            isMounted = false;
        };
    }, [selectedProvince, setAddressValue]);

    useEffect(() => {
        if (!selectedDistrict) {
            setWards([]);
            return;
        }

        let isMounted = true;
        setLoadingAddress(true);
        setAddressValue("wardCode", "");

        regionApi.getWards(selectedDistrict)
            .then((data) => {
                if (isMounted) setWards(data || []);
            })
            .catch((error) => console.error("Error loading wards:", error))
            .finally(() => {
                if (isMounted) setLoadingAddress(false);
            });

        return () => {
            isMounted = false;
        };
    }, [selectedDistrict, setAddressValue]);

    const submitField = ({ value: nextValue }) => {
        setValue(nextValue);
        onSave(nextValue);
    };

    const submitAddress = (form) => {
        const ward = wards.find((item) => String(item.code) === form.wardCode);
        const district = districts.find((item) => String(item.code) === form.districtCode);
        const province = provinces.find((item) => String(item.code) === form.provinceCode);
        const fullAddress = [
            form.detailAddress,
            ward?.name,
            district?.name,
            province?.name,
        ].filter(Boolean).join(", ");

        setValue(fullAddress);
        onSave(fullAddress);
    };

    if (isLocked) {
        return (
            <div className="modal-overlay">
                <div className="modal">
                    <h3>{fieldLabels[field]}</h3>
                    <p className="locked-field">Trường này không thể thay đổi</p>
                    <div className="modal-btns">
                        <button type="button" onClick={onClose}>Đóng</button>
                    </div>
                </div>
            </div>
        );
    }

    if (isAvatar) {
        return (
            <div className="modal-overlay">
                <div className="modal modal-avatar">
                    <h3>Đổi avatar</h3>
                    <div className="avatar-upload">
                        <div className="upload-area">
                            <span className="upload-icon">📁</span>
                            <p>Nhấp để tải ảnh lên</p>
                            <span className="upload-hint">Chấp nhận .jpg, .png tối đa 5MB</span>
                        </div>
                    </div>
                    <div className="modal-btns">
                        <button type="button" onClick={() => onSave(value)} disabled={saving}>
                            {saving ? "Đang lưu..." : "Lưu"}
                        </button>
                        <button type="button" onClick={onClose} disabled={saving}>Hủy</button>
                    </div>
                </div>
            </div>
        );
    }

    if (isAddress) {
        return (
            <div className="modal-overlay">
                <form className="modal" onSubmit={handleAddressSubmit(submitAddress)} noValidate>
                    <h3>{fieldLabels[field]}</h3>

                    <div className="address-selects">
                        {loadingAddress && <div className="loading-address">Đang tải...</div>}

                        <select {...registerAddress("provinceCode")} disabled={loadingAddress}>
                            <option value="">Chọn tỉnh/thành</option>
                            {provinces.map((p) => (
                                <option key={p.code} value={p.code}>{p.name}</option>
                            ))}
                        </select>
                        {addressErrors.provinceCode ? <p className="form-error">{addressErrors.provinceCode.message}</p> : null}

                        <select {...registerAddress("districtCode")} disabled={loadingAddress || !selectedProvince}>
                            <option value="">Chọn quận/huyện</option>
                            {districts.map((d) => (
                                <option key={d.code} value={d.code}>{d.name}</option>
                            ))}
                        </select>
                        {addressErrors.districtCode ? <p className="form-error">{addressErrors.districtCode.message}</p> : null}

                        <select {...registerAddress("wardCode")} disabled={loadingAddress || !selectedDistrict}>
                            <option value="">Chọn phường/xã</option>
                            {wards.map((w) => (
                                <option key={w.code} value={w.code}>{w.name}</option>
                            ))}
                        </select>
                        {addressErrors.wardCode ? <p className="form-error">{addressErrors.wardCode.message}</p> : null}

                        <input
                            type="text"
                            placeholder="Số nhà, đường,..."
                            disabled={saving}
                            {...registerAddress("detailAddress")}
                        />
                        {addressErrors.detailAddress ? <p className="form-error">{addressErrors.detailAddress.message}</p> : null}
                    </div>

                    <div className="modal-btns">
                        <button type="submit" disabled={saving}>
                            {saving ? "Đang lưu..." : "Lưu"}
                        </button>
                        <button type="button" onClick={onClose} disabled={saving}>Hủy</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <form className="modal" onSubmit={handleSubmit(submitField)} noValidate>
                <h3>{fieldLabels[field]}</h3>

                {isGender ? (
                    <select disabled={saving} {...register("value")}>
                        {genderOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                ) : isDob ? (
                    <div className="date-input-wrapper">
                        <input
                            type="date"
                            max={new Date().toISOString().split("T")[0]}
                            disabled={saving}
                            {...register("value")}
                        />
                    </div>
                ) : (
                    <input
                        type={field === "phone" ? "tel" : "text"}
                        placeholder={`Nhập ${fieldLabels[field]?.toLowerCase()}`}
                        disabled={saving}
                        {...register("value")}
                    />
                )}
                {errors.value ? <p className="form-error">{errors.value.message}</p> : null}

                <div className="modal-btns">
                    <button type="submit" disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                    <button type="button" onClick={onClose} disabled={saving}>Hủy</button>
                </div>
            </form>
        </div>
    );
}
