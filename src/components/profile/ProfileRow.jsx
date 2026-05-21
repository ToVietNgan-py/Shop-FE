import "./style.scss";
import { FiChevronRight, FiLock } from "react-icons/fi";

export default function ProfileRow({ label, value, locked, onClick, icon: Icon }) {
    return (
        <div className={`row ${locked ? "locked" : ""}`} onClick={!locked ? onClick : undefined}>
            <div className="row-label">
                {Icon ? (
                    <span className="row-icon" aria-hidden="true">
                        <Icon />
                    </span>
                ) : null}
                <span>{label}</span>
            </div>

            <div className="row-value">
                <span className={value ? "value" : "empty"}>
                    {value || "Thêm thông tin"}
                </span>
                {locked ? <FiLock className="row-action-icon" aria-hidden="true" /> : <FiChevronRight className="row-action-icon" aria-hidden="true" />}
            </div>
        </div>
    );
}
