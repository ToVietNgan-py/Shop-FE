import { Button, Card, Col, Row, Space, Statistic, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../components/admin/PageHeader.jsx";
import DataTable from "../../../components/admin/DataTable.jsx";
import { dashboardService } from "../../../services/admin/dashboardService.js";

const orderColumns = [
    { title: "Mã đơn", dataIndex: "code", key: "code" },
    { title: "Khách hàng", dataIndex: "customer", key: "customer" },
    { title: "Tổng tiền", dataIndex: "total", key: "total" },
    {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (value) => <Tag color={value === "Completed" ? "green" : value === "Pending" ? "gold" : "blue"}>{value}</Tag>
    }
];

const topProductsColumns = [
    {
        title: "Sản phẩm",
        dataIndex: "name",
        key: "name",
        render: (value, record) => (
            <div>
                <Typography.Text strong>{value}</Typography.Text>
                {record.sku ? <div style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>Mã SP: {record.sku}</div> : null}
            </div>
        )
    },
    { title: "Đã bán", dataIndex: "sold", key: "sold", align: "right" },
    {
        title: "So với tháng trước",
        dataIndex: "change",
        key: "change",
        align: "right",
        render: (value) => {
            if (value === undefined || value === null || value === "") {
                return "-";
            }

            const normalized = String(value).replace("%", "").replace("+", "");
            const number = Number(normalized);
            const color = Number.isNaN(number) ? "default" : number >= 0 ? "green" : "volcano";
            const label = String(value).startsWith("+") || number >= 0 ? `+${normalized}%` : `${normalized}%`;

            return <Tag color={color}>{label}</Tag>;
        }
    }
];

const fallbackSummary = {
    period: "2026-05",
    metrics: [
        { label: "Đơn hôm nay", value: 18, suffix: "+12%", compare: "So với ngày này tháng trước: +12%" },
        { label: "Doanh thu tháng", value: 12500000, prefix: "đ", compare: "So với tháng trước: +8%" },
        { label: "User mới", value: 24, suffix: "+4", compare: "So với tháng trước: +33%" },
        { label: "Sản phẩm thiếu kho", value: 6, compare: "So với tháng trước: -2%" }
    ],
    topProducts: [
        { key: 1, name: "Phấn Phủ Carslan Kiểm Soát Dầu Tiện Dụng Trang Điểm 10g", sku: "7980357970", sold: 107, change: "+22%" },
        { key: 2, name: "COLORKEY Phấn Phủ Nền Kiểm Dầu, Giữ Lớp Trang Điểm Lâu", sku: "53400527831", sold: 94, change: "+8%" },
        { key: 3, name: "[DUY KHÁNH YÊU THÍCH] Son Bùn COLORKEY, Chất Bùn Mịn", sku: "17582479297", sold: 72, change: "-4%" },
        { key: 4, name: "[Dành cho thành viên] Kem lót chống nắng Carslan SPF50", sku: "44003340600", sold: 41, change: "+14%" },
        { key: 5, name: "Phấn Mắt Đơn Cat's Lab Eye Stamp Shadow 5in1 Lì Mịn Ánh", sku: "28943198543", sold: 36, change: "-2%" }
    ],
    recentOrders: [
        { key: 1, code: "DH-1024", customer: "Nguyen Thi A", total: "1.250.000đ", status: "Completed" },
        { key: 2, code: "DH-1025", customer: "Tran Van B", total: "880.000đ", status: "Processing" },
        { key: 3, code: "DH-1026", customer: "Le Thi C", total: "540.000đ", status: "Pending" }
    ]
};

const buildMonthKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
};

const formatMonthLabel = (monthKey = "") => {
    const [year, month] = monthKey.split("-");
    return month && year ? `Tháng ${month}/${year}` : "";
};

function AdminDashboardPage() {
    const [summary, setSummary] = useState(fallbackSummary);
    const [selectedMonth, setSelectedMonth] = useState(buildMonthKey(new Date()));
    const [appliedMonth, setAppliedMonth] = useState(buildMonthKey(new Date()));
    const [loading, setLoading] = useState(true);

    const periodLabel = useMemo(() => formatMonthLabel(summary.period ?? appliedMonth), [summary.period, appliedMonth]);

    useEffect(() => {
        let active = true;

        async function loadSummary() {
            setLoading(true);

            try {
                const nextSummary = await dashboardService.summary({ month: appliedMonth });

                if (active && nextSummary) {
                    setSummary({
                        period: nextSummary.period ?? appliedMonth,
                        metrics: nextSummary.metrics ?? fallbackSummary.metrics,
                        topProducts: nextSummary.topProducts ?? fallbackSummary.topProducts,
                        recentOrders: nextSummary.recentOrders ?? fallbackSummary.recentOrders
                    });
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadSummary();

        return () => {
            active = false;
        };
    }, [appliedMonth]);

    return (
        <Space direction="vertical" size={24} style={{ width: "100%" }}>

            <Card style={{ borderRadius: 20, boxShadow: "var(--shadow-card)" }}>
                <Row align="middle" justify="space-between" gutter={[16, 16]}>
                    <Col xs={24} lg={14}>
                        <Space direction="vertical" size={4}>
                            <Typography.Text type="secondary">Lọc dữ liệu dashboard theo tháng</Typography.Text>
                            <Typography.Title level={4} style={{ margin: 0 }}>{periodLabel || "Chưa có dữ liệu"}</Typography.Title>
                            <Typography.Text type="secondary">
                                Hiển thị top 5 sản phẩm bán chạy trong tháng và so sánh phần trăm tăng/giảm so với tháng trước.
                            </Typography.Text>
                        </Space>
                    </Col>

                    <Col xs={24} lg={10}>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                            <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
                                <Typography.Text strong>Chọn tháng</Typography.Text>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(event) => setSelectedMonth(event.target.value)}
                                    style={{ padding: 10, borderRadius: 10, border: "1px solid #d9d9d9", width: "100%" }}
                                />
                            </label>
                            <Button
                                type="primary"
                                onClick={() => setAppliedMonth(selectedMonth)}
                                disabled={selectedMonth === appliedMonth}
                            >
                                Áp dụng
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[16, 16]}>
                {summary.metrics.map((item) => (
                    <Col key={item.label} xs={24} sm={12} xl={6}>
                        <Card style={{ borderRadius: 20, boxShadow: "var(--shadow-card)" }}>
                            <Statistic
                                title={item.label}
                                value={item.value}
                                suffix={item.suffix}
                                prefix={item.prefix}
                                loading={loading}
                            />
                            {item.compare ? (
                                <Typography.Text type="secondary" style={{ display: "block", marginTop: 12 }}>
                                    {item.compare}
                                </Typography.Text>
                            ) : null}
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} xl={12}>
                    <DataTable
                        title="Top 5 sản phẩm bán chạy"
                        description="Danh sách sản phẩm bán chạy nhất theo tháng, kèm % tăng/giảm so với tháng trước."
                        loading={loading}
                        rowKey={(record) => record.key ?? record.id ?? record.sku ?? record.name}
                        columns={topProductsColumns}
                        dataSource={summary.topProducts}
                        pagination={false}
                    />
                </Col>

                <Col xs={24} xl={12}>
                    <DataTable
                        title="Đơn gần nhất"
                        description="Đơn hàng mới nhất để quản trị viên nắm tình hình thực tế."
                        loading={loading}
                        rowKey="code"
                        columns={orderColumns}
                        dataSource={summary.recentOrders}
                        pagination={false}
                    />
                </Col>
            </Row>
        </Space>
    );
}

export default AdminDashboardPage;
