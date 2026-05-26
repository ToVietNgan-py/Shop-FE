import { Tag } from 'antd';

const STATUS_MAP = {
    Pending: { color: 'gold', label: 'Chờ xác nhận' },
    Processing: { color: 'blue', label: 'Đã xác nhận' },
    Delivering: { color: 'cyan', label: 'Đang giao' },
    Completed: { color: 'green', label: 'Hoàn thành' },
    Cancelled: { color: 'red', label: 'Đã huỷ' },
};

export default function OrderStatusTag({ status }) {
    const { color, label } = STATUS_MAP[status] || { color: 'default', label: status };
    return <Tag color={color}>{label}</Tag>;
}