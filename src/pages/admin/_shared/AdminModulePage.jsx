import { Card, Empty, List, Space, Typography } from "antd";
import PageHeader from "../../../components/admin/PageHeader.jsx";

function AdminModulePage({ title, description, highlights = [] }) {
    return (
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <PageHeader
                title={title}
                description={description}
            />

            <Card style={{ borderRadius: 20, boxShadow: "var(--shadow-card)" }}>
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <Typography.Text strong>Khung chung đã sẵn sàng</Typography.Text>
                    {highlights.length > 0 ? (
                        <List
                            bordered={false}
                            dataSource={highlights}
                            renderItem={(item) => <List.Item>{item}</List.Item>}
                        />
                    ) : null}
                    <Empty description="Trang này sẽ nối API admin thật ở phase tiếp theo." />
                </Space>
            </Card>
        </Space>
    );
}

export default AdminModulePage;