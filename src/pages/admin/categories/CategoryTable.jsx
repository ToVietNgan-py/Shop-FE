import { Button, Space, Tag } from "antd";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import DataTable from "../../../components/admin/DataTable.jsx";

/**
 * CategoryTable — Bảng hiển thị danh sách danh mục
 * 
 * Props:
 *   data       — array categories
 *   meta       — { current_page, per_page, total }
 *   loading    — boolean
 *   onEdit     — (category) => void
 *   onDelete   — (categoryId) => void
 *   onChange   — (page, pageSize) => void
 */
function CategoryTable({ data, meta, loading, onEdit, onDelete, onChange }) {
    const columns = [
        {
            title: "Tên danh mục",
            dataIndex: "name",
            key: "name",
            flex: 1
        },
        {
            title: "Slug",
            dataIndex: "slug",
            key: "slug",
            width: 150,
            ellipsis: true
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
            flex: 1,
            ellipsis: true,
            render: (text) => text || "—"
        },
        {
            title: "Trạng thái",
            dataIndex: "is_active",
            key: "is_active",
            width: 80,
            render: (value) => <Tag color={value ? "green" : "red"}>{value ? "Hoạt động" : "Tắt"}</Tag>
        },
        {
            title: "Hành động",
            key: "action",
            width: 100,
            render: (_, category) => (
                <Space size="small">
                    <Button
                        type="primary"
                        size="small"
                        icon={<AiOutlineEdit />}
                        onClick={() => onEdit?.(category)}
                    >
                        Sửa
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<AiOutlineDelete />}
                        onClick={() => onDelete?.(category.id)}
                    >
                        Xóa
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <DataTable
            title="Danh sách danh mục"
            description="Quản lý toàn bộ danh mục sản phẩm"
            columns={columns}
            dataSource={data}
            meta={meta}
            loading={loading}
            onChange={onChange}
            rowKey="id"
            scroll={{ x: 900 }}
        />
    );
}

export default CategoryTable;
