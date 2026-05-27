import { Button, Space, Tag } from "antd";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import DataTable from "../../../components/admin/DataTable.jsx";

/**
 * ProductTable — Bảng hiển thị danh sách sản phẩm
 * 
 * Props:
 *   data       — array products
 *   meta       — { current_page, per_page, total }
 *   loading    — boolean
 *   onEdit     — (product) => void
 *   onDelete   — (productId) => void
 *   onChange   — (page, pageSize) => void
 */
function ProductTable({ data, meta, loading, onEdit, onDelete, onChange }) {
    const columns = [
        {
            title: "Ảnh",
            dataIndex: "thumbnail",
            key: "img",
            width: 60,
            render: (img) => (
                <img
                    src={img || "/logo.png"}
                    alt="product"
                    style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                    onError={(e) => { e.currentTarget.src = "/logo.png"; }}
                />
            )
        },
        {
            title: "Tên sản phẩm",
            dataIndex: "name",
            key: "name",
            flex: 1,
            ellipsis: true
        },
        {
            title: "Danh mục",
            key: "category",
            width: 120,
            render: (_, row) => row.category?.name ?? row.category_name ?? "—"
        },
        {
            title: "Giá",
            dataIndex: "price",
            key: "price",
            width: 100,
            render: (price) => `đ${parseInt(price || 0).toLocaleString("vi-VN")}`
        },
        {
            title: "Tồn kho",
            dataIndex: "inventory",
            key: "inventory",
            width: 80,
            render: (inventory) => {
                const num = parseInt(inventory || 0);
                if (num === 0) return <Tag color="red">0</Tag>;
                if (num < 5) return <Tag color="orange">{num}</Tag>;
                return <Tag color="green">{num}</Tag>;
            }
        },
        {
            title: "Trạng thái",
            dataIndex: "is_active",
            key: "is_active",
            width: 80,
            render: () => <Tag color="green">Hoạt động</Tag>
        },
        {
            title: "Hành động",
            key: "action",
            width: 100,
            render: (_, product) => (
                <Space size="small">
                    <Button
                        type="primary"
                        size="small"
                        icon={<AiOutlineEdit />}
                        onClick={() => onEdit?.(product)}
                    >
                        Sửa
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<AiOutlineDelete />}
                        onClick={() => onDelete?.(product.id)}
                    >
                        Xóa
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <DataTable
            columns={columns}
            dataSource={data}
            meta={meta}
            loading={loading}
            onChange={onChange}
            rowKey="id"
            scroll={{ x: 1200 }}
        />
    );
}

export default ProductTable;