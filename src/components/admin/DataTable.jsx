import { Card, Input, Space, Table, Typography } from "antd";

function DataTable({
    title,
    description,
    searchValue,
    onSearch,
    searchPlaceholder = "Tìm kiếm...",
    toolbar,
    tableProps,
    loading,
    ...rest
}) {
    const mergedTableProps = tableProps ?? rest;

    return (
        <Card
            style={{ borderRadius: 20, boxShadow: "var(--shadow-card)", borderColor: "var(--color-border)" }}
            styles={{ body: { padding: 20 } }}
        >
            {(title || description || onSearch || toolbar) ? (
                <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }} size={12}>
                    {(title || description) ? (
                        <div>
                            {title ? <Typography.Title level={4} style={{ marginBottom: 4 }}>{title}</Typography.Title> : null}
                            {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
                        </div>
                    ) : null}

                    <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
                        {onSearch ? (
                            <Input.Search
                                allowClear
                                value={searchValue}
                                onChange={(event) => onSearch(event.target.value)}
                                placeholder={searchPlaceholder}
                                style={{ maxWidth: 360 }}
                            />
                        ) : <span />}
                        {toolbar}
                    </Space>
                </Space>
            ) : null}

            <Table
                {...mergedTableProps}
                loading={loading}
                pagination={mergedTableProps.pagination ?? { pageSize: 10, showSizeChanger: true }}
            />
        </Card>
    );
}

export default DataTable;