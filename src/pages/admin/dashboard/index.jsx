// import { Card, Col, Row, Space, Tag, Typography } from "antd";
// import { useEffect, useState } from "react";
// import {
//     AiOutlineShoppingCart,
//     AiOutlineDollarCircle,
//     AiOutlineUserAdd,
//     AiOutlineWarning
// } from "react-icons/ai";
// import DataTable from "../../../components/admin/DataTable.jsx";
// import StatCard from "./StatCard.jsx";
// import RevenueChart from "./RevenueChart.jsx";
// import { dashboardService } from "../../../services/admin/dashboardService.js";
// import "../_shared/admin-page.scss";

// const sampleColumns = [
//     { title: "Mã đơn", dataIndex: "code", key: "code", width: 100 },
//     { title: "Khách hàng", dataIndex: "customer", key: "customer" },
//     { title: "Tổng tiền", dataIndex: "total", key: "total", width: 120 },
//     {
//         title: "Trạng thái",
//         dataIndex: "status",
//         key: "status",
//         width: 100,
//         render: (value) => <Tag color={value === "Completed" ? "green" : value === "Processing" ? "blue" : "gold"}>{value}</Tag>
//     }
// ];

// const fallbackSummary = {
//     metrics: [
//         { label: "Đơn hôm nay", value: 18, suffix: "+12%" },
//         { label: "Doanh thu tháng", value: 12500000, prefix: "đ" },
//         { label: "User mới", value: 24, suffix: "+4" },
//         { label: "Sản phẩm thiếu kho", value: 6 }
//     ],
//     recentOrders: [
//         { key: 1, code: "DH-1024", customer: "Nguyen Thi A", total: "1.250.000đ", status: "Completed" },
//         { key: 2, code: "DH-1025", customer: "Tran Van B", total: "880.000đ", status: "Processing" },
//         { key: 3, code: "DH-1026", customer: "Le Thi C", total: "540.000đ", status: "Pending" }
//     ]
// };

// function AdminDashboardPage() {
//     const [summary, setSummary] = useState(fallbackSummary);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         let active = true;

//         async function loadSummary() {
//             try {
//                 const nextSummary = await dashboardService.summary();

//                 if (active && nextSummary) {
//                     setSummary({
//                         metrics: nextSummary.metrics ?? fallbackSummary.metrics,
//                         recentOrders: nextSummary.recentOrders ?? fallbackSummary.recentOrders,
//                         revenueChart: nextSummary.revenueChart ?? []
//                     });
//                 }
//             } finally {
//                 if (active) {
//                     setLoading(false);
//                 }
//             }
//         }

//         loadSummary();

//         return () => {
//             active = false;
//         };
//     }, []);

//     // Icon mapping cho từng metric
//     const iconMap = {
//         0: <AiOutlineShoppingCart />,    // Đơn hôm nay
//         1: <AiOutlineDollarCircle />,    // Doanh thu tháng
//         2: <AiOutlineUserAdd />,         // User mới
//         3: <AiOutlineWarning />          // Sản phẩm thiếu kho
//     };

//     const colorMap = ["rose", "blue", "green", "orange"];

//     return (
//         <div className="admin-page">
//             <div className="admin-page__toolbar">
//                 <div>
//                     <h2 className="admin-page__title">Dashboard</h2>
//                     <div className="admin-page__subtitle">Tổng quan doanh thu, đơn hàng và tồn kho theo thời gian thực.</div>
//                 </div>
//             </div>

//             <Space direction="vertical" size={24} style={{ width: "100%" }}>

//                 {/* Row 1: 4 Stat Cards */}
//                 <Row gutter={[16, 16]}>
//                     {summary.metrics.map((item, index) => (
//                         <Col key={item.label} xs={24} sm={12} lg={6}>
//                             <StatCard
//                                 icon={iconMap[index]}
//                                 title={item.label}
//                                 value={item.value}
//                                 suffix={item.suffix}
//                                 prefix={item.prefix}
//                                 color={colorMap[index]}
//                                 loading={loading}
//                             />
//                         </Col>
//                     ))}
//                 </Row>

//                 {/* Row 2: Chart + Recent Orders Table */}
//                 <Row gutter={[16, 16]}>
//                     <Col xs={24} lg={16}>
//                         <RevenueChart data={summary.revenueChart} loading={loading} />
//                     </Col>

//                     <Col xs={24} lg={8}>
//                         <Card
//                             style={{
//                                 borderRadius: 12,
//                                 boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
//                                 border: "none"
//                             }}
//                             title="Thông tin nhanh"
//                         >
//                             <Space direction="vertical" size={16} style={{ width: "100%" }}>
//                                 <div>
//                                     <Typography.Text type="secondary" style={{ fontSize: 12 }}>
//                                         Đơn gần nhất
//                                     </Typography.Text>
//                                     <Typography.Title level={5} style={{ margin: "4px 0 0" }}>
//                                         {summary.recentOrders[0]?.code || "—"}
//                                     </Typography.Title>
//                                 </div>

//                                 <div>
//                                     <Typography.Text type="secondary" style={{ fontSize: 12 }}>
//                                         Trạng thái
//                                     </Typography.Text>
//                                     <div style={{ marginTop: 4 }}>
//                                         <Tag color={summary.recentOrders[0]?.status === "Completed" ? "green" : "blue"}>
//                                             {summary.recentOrders[0]?.status || "—"}
//                                         </Tag>
//                                     </div>
//                                 </div>

//                                 <div>
//                                     <Typography.Text type="secondary" style={{ fontSize: 12 }}>
//                                         Khách hàng
//                                     </Typography.Text>
//                                     <Typography.Title level={5} style={{ margin: "4px 0 0" }}>
//                                         {summary.recentOrders[0]?.customer || "—"}
//                                     </Typography.Title>
//                                 </div>
//                             </Space>
//                         </Card>
//                     </Col>
//                 </Row>

//                 {/* Row 3: Recent Orders Table */}
//                 <Row>
//                     <Col span={24}>
//                         <DataTable
//                             title="5 đơn hàng gần nhất"
//                             description="Danh sách các đơn hàng mới nhất trong hệ thống"
//                             loading={loading}
//                             rowKey="code"
//                             columns={sampleColumns}
//                             dataSource={summary.recentOrders.slice(0, 5)}
//                             pagination={false}
//                             scroll={{ x: 600 }}
//                         />
//                     </Col>
//                 </Row>
//             </Space>
//         </div>
//     );
// }

// export default AdminDashboardPage;
import { Card, Col, Row, Space, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import {
    AiOutlineShoppingCart,
    AiOutlineDollarCircle,
    AiOutlineUserAdd,
    AiOutlineWarning
} from "react-icons/ai";
import DataTable from "../../../components/admin/DataTable.jsx";
import StatCard from "./StatCard.jsx";
import RevenueChart from "./RevenueChart.jsx";
import { dashboardService } from "../../../services/admin/dashboardService.js";
import "../_shared/admin-page.scss";

const sampleColumns = [
    { title: "Mã đơn", dataIndex: "code", key: "code", width: 100 },
    { title: "Khách hàng", dataIndex: "customer", key: "customer" },
    {
        title: "Tổng tiền",
        dataIndex: "total",
        key: "total",
        width: 120,
        render: (value) =>
            typeof value === "number"
                ? `${value.toLocaleString("vi-VN")}đ`
                : value
    },
    {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (value) => {
            const colorMap = {
                Completed: "green",
                Processing: "blue",
                Pending: "gold",
                Cancelled: "red"
            };
            return <Tag color={colorMap[value] ?? "default"}>{value || "—"}</Tag>;
        }
    }
];

const fallbackSummary = {
    metrics: [
        { label: "Đơn hôm nay", value: 0 },
        { label: "Doanh thu tháng", value: 0, prefix: "đ" },
        { label: "User mới", value: 0 },
        { label: "Sản phẩm thiếu kho", value: 0 }
    ],
    revenueChart: [],
    recentOrders: []
};

function AdminDashboardPage() {
    const [summary, setSummary] = useState(fallbackSummary);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function loadSummary() {
            try {
                // dashboardService.summary() đã normalize sẵn → dùng thẳng
                const data = await dashboardService.summary();
                if (active && data) setSummary(data);
            } catch (err) {
                console.error("Dashboard API error:", err);
            } finally {
                if (active) setLoading(false);
            }
        }

        loadSummary();
        return () => { active = false; };
    }, []);

    const iconMap = {
        0: <AiOutlineShoppingCart />,
        1: <AiOutlineDollarCircle />,
        2: <AiOutlineUserAdd />,
        3: <AiOutlineWarning />
    };

    const colorMap = ["rose", "blue", "green", "orange"];

    const latestOrder = summary.recentOrders?.[0];

    return (
        <div className="admin-page">
            <div className="admin-page__toolbar">
                <div>
                    <h2 className="admin-page__title">Dashboard</h2>
                    <div className="admin-page__subtitle">
                        Tổng quan doanh thu, đơn hàng và tồn kho theo thời gian thực.
                    </div>
                </div>
            </div>

            <Space direction="vertical" size={24} style={{ width: "100%" }}>

                {/* Row 1: 4 Stat Cards */}
                <Row gutter={[16, 16]}>
                    {summary.metrics.map((item, index) => (
                        <Col key={item.label} xs={24} sm={12} lg={6}>
                            <StatCard
                                icon={iconMap[index]}
                                title={item.label}
                                value={item.value}
                                suffix={item.suffix}
                                prefix={item.prefix}
                                color={colorMap[index]}
                                loading={loading}
                            />
                        </Col>
                    ))}
                </Row>

                {/* Row 2: Chart + Quick Info */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <RevenueChart data={summary.revenueChart} loading={loading} />
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card
                            style={{
                                borderRadius: 12,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                border: "none"
                            }}
                            title="Thông tin nhanh"
                        >
                            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                                <div>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        Đơn gần nhất
                                    </Typography.Text>
                                    <Typography.Title level={5} style={{ margin: "4px 0 0" }}>
                                        {latestOrder?.code || "—"}
                                    </Typography.Title>
                                </div>

                                <div>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        Trạng thái
                                    </Typography.Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Tag color={
                                            latestOrder?.status === "Completed" ? "green" :
                                                latestOrder?.status === "Processing" ? "blue" :
                                                    latestOrder?.status === "Cancelled" ? "red" : "gold"
                                        }>
                                            {latestOrder?.status || "—"}
                                        </Tag>
                                    </div>
                                </div>

                                <div>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        Khách hàng
                                    </Typography.Text>
                                    <Typography.Title level={5} style={{ margin: "4px 0 0" }}>
                                        {latestOrder?.customer || "—"}
                                    </Typography.Title>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                {/* Row 3: Recent Orders Table */}
                <Row>
                    <Col span={24}>
                        <DataTable
                            title="5 đơn hàng gần nhất"
                            description="Danh sách các đơn hàng mới nhất trong hệ thống"
                            loading={loading}
                            rowKey="code"
                            columns={sampleColumns}
                            dataSource={summary.recentOrders.slice(0, 5)}
                            pagination={false}
                            scroll={{ x: 600 }}
                        />
                    </Col>
                </Row>

            </Space>
        </div>
    );
}

export default AdminDashboardPage;