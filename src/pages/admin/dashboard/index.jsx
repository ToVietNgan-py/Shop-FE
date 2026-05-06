import { Card, Col, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import PageHeader from "../../../components/admin/PageHeader.jsx";
import DataTable from "../../../components/admin/DataTable.jsx";
import ImageUploader from "../../../components/admin/ImageUploader.jsx";
import { dashboardService } from "../../../services/admin/dashboardService.js";

const sampleColumns = [
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

const fallbackSummary = {
    metrics: [
        { label: "Đơn hôm nay", value: 18, suffix: "+12%" },
        { label: "Doanh thu tháng", value: 12500000, prefix: "đ" },
        { label: "User mới", value: 24, suffix: "+4" },
        { label: "Sản phẩm thiếu kho", value: 6 }
    ],
    recentOrders: [
        { key: 1, code: "DH-1024", customer: "Nguyen Thi A", total: "1.250.000đ", status: "Completed" },
        { key: 2, code: "DH-1025", customer: "Tran Van B", total: "880.000đ", status: "Processing" },
        { key: 3, code: "DH-1026", customer: "Le Thi C", total: "540.000đ", status: "Pending" }
    ]
};

function AdminDashboardPage() {
    const [summary, setSummary] = useState(fallbackSummary);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function loadSummary() {
            try {
                const nextSummary = await dashboardService.summary();

                if (active && nextSummary) {
                    setSummary({
                        metrics: nextSummary.metrics ?? fallbackSummary.metrics,
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
    }, []);

    return (
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
            <PageHeader
                title="Dashboard quản trị"
                description="Khung chung để phase 4 bám vào: theme AntD, layout admin, role guard, DataTable và upload ảnh."
            />

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
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} xl={16}>
                    <DataTable
                        title="Đơn gần nhất"
                        description="Ví dụ DataTable dùng cho list, search và phân trang ở các trang admin CRUD."
                        loading={loading}
                        rowKey="code"
                        columns={sampleColumns}
                        dataSource={summary.recentOrders}
                        pagination={false}
                    />
                </Col>
                <Col xs={24} xl={8}>
                    <Card style={{ borderRadius: 20, boxShadow: "var(--shadow-card)", marginBottom: 16 }}>
                        <Typography.Title level={4} style={{ marginTop: 0 }}>
                            Upload ảnh demo
                        </Typography.Title>
                        <Typography.Paragraph type="secondary">
                            ImageUploader dùng chung cho form sản phẩm, danh mục hoặc voucher nếu cần ảnh minh hoạ.
                        </Typography.Paragraph>
                        <ImageUploader value={[]} onChange={() => undefined} maxCount={3} />
                    </Card>

                    <Card style={{ borderRadius: 20, boxShadow: "var(--shadow-card)" }}>
                        <Typography.Title level={4} style={{ marginTop: 0 }}>
                            Service admin đã tách
                        </Typography.Title>
                        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                            dashboardService, adminProductService, adminCategoryService, adminOrderService, adminVoucherService và adminUserService sẽ dùng cùng axios instance, cùng format response.
                        </Typography.Paragraph>
                    </Card>
                </Col>
            </Row>
        </Space>
    );
}

export default AdminDashboardPage;