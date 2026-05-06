import { Button, Space, Typography } from "antd";

function PageHeader({ title, description, actions }) {
    return (
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
                <Typography.Title level={3} style={{ marginBottom: 8 }}>
                    {title}
                </Typography.Title>
                {description ? <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>{description}</Typography.Paragraph> : null}
            </div>
            {Array.isArray(actions) && actions.length > 0 ? (
                <Space wrap>
                    {actions.map((action) => (
                        <Button
                            key={action.label}
                            type={action.type ?? "default"}
                            icon={action.icon}
                            onClick={action.onClick}
                        >
                            {action.label}
                        </Button>
                    ))}
                </Space>
            ) : null}
        </div>
    );
}

export default PageHeader;