import { Card, Empty, Space, Typography } from "antd";
import PageHeader from "../../../components/admin/PageHeader.jsx";

function AdminModulePage({ title, description, highlights = [] }) {
    return (
        <Space orientation="vertical" size={20} style={{ width: "100%" }}>
            <PageHeader
                title={title}
                description={description}
            />

            <Card style={{ borderRadius: 20, boxShadow: "var(--shadow-card)" }}>
                <Space orientation="vertical" size={16} style={{ width: "100%" }}>
                    <Typography.Text strong>Khung chung đã sẵn sàng</Typography.Text>
                    {highlights.length > 0 ? (
                        <ul style={{ paddingLeft: 20, margin: 0 }}>
                            {highlights.map((item, idx) => (
                                <li key={idx} style={{ padding: "4px 0" }}>{item}</li>
                            ))}
                        </ul>
                    ) : null}
                    <Empty description="Trang này sẽ nối API admin thật ở phase tiếp theo." />
                </Space>
            </Card>
        </Space>
    );
}

export default AdminModulePage;