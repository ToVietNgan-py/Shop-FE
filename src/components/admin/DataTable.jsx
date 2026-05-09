// src/components/admin/DataTable.jsx
import { Table } from 'antd';

/**
 * DataTable — wrapper chuẩn cho mọi trang admin.
 * Props:
 *   columns   — AntD column definitions
 *   dataSource — array data
 *   meta      — { current_page, per_page, total } từ BE
 *   loading   — boolean
 *   onChange  — (page, pageSize) => void — gọi lại API với page mới
 */
export default function DataTable({ columns, dataSource, meta, loading, onChange }) {
    return (
        <Table
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            loading={loading}
            pagination={{
                current: meta?.current_page || 1,
                pageSize: meta?.per_page || 15,
                total: meta?.total || 0,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} bản ghi`,
                onChange: (page, pageSize) => onChange?.(page, pageSize),
            }}
            scroll={{ x: 'max-content' }}
            style={{ background: '#161b22' }}
        />
    );
}