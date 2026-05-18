import { Button, Space } from "antd";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import DataTable from "../../../components/admin/DataTable.jsx";
import dayjs from "dayjs";

function CategoryTable({ data, meta, loading, onEdit, onDelete, onChange }) {
    const columns = [
        {
            title: "Tên danh mục",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            key: "created_at",
            width: 160,
            render: (d) => d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—",
        },
        {
            title: "Hành động",
            key: "action",
            width: 120,
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
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            dataSource={data}
            meta={meta}
            loading={loading}
            onChange={onChange}
            rowKey="id"
        />
    );
}

export default CategoryTable;