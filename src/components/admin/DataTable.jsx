// import { Card, Input, Space, Table, Typography } from "antd";

// function DataTable({
//     title,
//     description,
//     searchValue,
//     onSearch,
//     searchPlaceholder = "Tìm kiếm...",
//     toolbar,
//     tableProps,
//     loading,
//     ...rest
// }) {
//     const mergedTableProps = tableProps ?? rest;

//     return (
//         <Card
//             style={{ borderRadius: 20, boxShadow: "var(--shadow-card)", borderColor: "var(--color-border)" }}
//             styles={{ body: { padding: 20 } }}
//         >
//             {(title || description || onSearch || toolbar) ? (
//                 <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }} size={12}>
//                     {(title || description) ? (
//                         <div>
//                             {title ? <Typography.Title level={4} style={{ marginBottom: 4 }}>{title}</Typography.Title> : null}
//                             {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
//                         </div>
//                     ) : null}

//                     <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
//                         {onSearch ? (
//                             <Input.Search
//                                 allowClear
//                                 value={searchValue}
//                                 onChange={(event) => onSearch(event.target.value)}
//                                 placeholder={searchPlaceholder}
//                                 style={{ maxWidth: 360 }}
//                             />
//                         ) : <span />}
//                         {toolbar}
//                     </Space>
//                 </Space>
//             ) : null}

//             <Table
//                 {...mergedTableProps}
//                 loading={loading}
//                 pagination={mergedTableProps.pagination ?? { pageSize: 10, showSizeChanger: true }}
//             />
//         </Card>
//     );
// }

// export default DataTable;


/**
 * DataTable — wrapper chuẩn cho mọi trang admin.
 * Props:
 *   columns   — AntD column definitions
 *   dataSource — array data
 *   meta      — { current_page, per_page, total } từ BE
 *   loading   — boolean
 *   onChange  — (page, pageSize) => void — gọi lại API với page mới
 */
import { Table } from 'antd';

export default function DataTable({ columns, dataSource, meta, loading, onChange }) {
    return (
        <>
            <style>{`
                .admin-data-table .ant-table-pagination.ant-pagination {
                    background: #ffffff !important;
                    margin: 0 !important;
                    padding: 12px 16px !important;
                }
                .admin-data-table .ant-pagination-item a,
                .admin-data-table .ant-pagination-total-text,
                .admin-data-table .ant-pagination-prev button,
                .admin-data-table .ant-pagination-next button,
                .admin-data-table .ant-select-selector,
                .admin-data-table .ant-select-arrow {
                    color: #000000 !important;
                }
            `}</style>
            <Table
                className="admin-data-table"
                columns={columns}
                dataSource={dataSource}
                rowKey="id"
                loading={loading}
                scroll={{ x: 'max-content' }}
                style={{ background: '#161b22' }}
                pagination={{
                    current: meta?.current_page || 1,
                    pageSize: meta?.per_page || 15,
                    total: meta?.total || 0,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} bản ghi`,
                    onChange: (page, pageSize) => onChange?.(page, pageSize),
                    position: ['bottomRight'],
                }}
            />
        </>
    );
}