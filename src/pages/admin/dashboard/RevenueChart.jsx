import { Card, Spin } from "antd";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

/**
 * RevenueChart — Biểu đồ đường doanh thu 30 ngày
 * 
 * Props:
 *   data    — array { day: "2026-05-01", revenue: 2500000 }
 *   loading — boolean
 */
function RevenueChart({ data = [], loading = false }) {
    // Fallback data nếu API chưa trả
    const chartData = data.length > 0 ? data : [
        { day: "Ngày 1", revenue: 1200000 },
        { day: "Ngày 2", revenue: 1900000 },
        { day: "Ngày 3", revenue: 1500000 },
        { day: "Ngày 4", revenue: 2200000 },
        { day: "Ngày 5", revenue: 2800000 },
        { day: "Ngày 6", revenue: 3900000 },
        { day: "Ngày 7", revenue: 3800000 }
    ];

    if (loading) {
        return (
            <Card
                style={{
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 300
                }}
            >
                <Spin />
            </Card>
        );
    }

    return (
        <Card
            style={{
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "none"
            }}
            title="Doanh thu 30 ngày"
        >
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="day"
                        stroke="#9ca3af"
                        style={{ fontSize: 12 }}
                    />
                    <YAxis
                        stroke="#9ca3af"
                        style={{ fontSize: 12 }}
                        tickFormatter={(value) => `đ${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                        contentStyle={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8
                        }}
                        formatter={(value) => `đ${value.toLocaleString("vi-VN")}`}
                    />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#ec4899"
                        strokeWidth={3}
                        dot={{ fill: "#ec4899", r: 5 }}
                        activeDot={{ r: 7 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}

export default RevenueChart;
