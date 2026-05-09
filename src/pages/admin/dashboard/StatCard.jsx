import { Card, Statistic } from "antd";
import {
    AiOutlineShoppingCart,
    AiOutlineDollarCircle,
    AiOutlineUserAdd,
    AiOutlineWarning
} from "react-icons/ai";

/**
 * StatCard — Thẻ hiển thị một số liệu thống kê
 * 
 * Props:
 *   icon       — ReactNode icon hiển thị bên trái
 *   title      — tiêu đề (vd "Đơn hôm nay")
 *   value      — số liệu chính (vd 18)
 *   suffix     — text phía sau (vd "+12%")
 *   prefix     — text phía trước (vd "đ")
 *   color      — màu nền theme (vd "rose", "blue", "green")
 *   loading    — boolean loading state
 */
function StatCard({ icon, title, value, suffix, prefix, color = "rose", loading }) {
    const colorMap = {
        rose: "#ec4899",
        blue: "#3b82f6",
        green: "#10b981",
        orange: "#f97316"
    };

    return (
        <Card
            style={{
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "none",
                background: "#fff"
            }}
            hoverable
        >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 8,
                        background: `${colorMap[color]}15`, // 15% opacity
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 28,
                        color: colorMap[color]
                    }}
                >
                    {icon}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                        {title}
                    </div>
                    <Statistic
                        value={value}
                        suffix={suffix}
                        prefix={prefix}
                        loading={loading}
                        valueStyle={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: "#1f2937"
                        }}
                    />
                </div>
            </div>
        </Card>
    );
}

export default StatCard;
