import { Tag } from 'antd';

const STATUS_MAP = {
    pending: { color: 'gold', label: 'Chờ xác nhận' },
    confirmed: { color: 'blue', label: 'Đã xác nhận' },
    shipping: { color: 'cyan', label: 'Đang giao' },
    completed: { color: 'green', label: 'Hoàn thành' },
    cancelled: { color: 'red', label: 'Đã huỷ' },
};

export default function OrderStatusTag({ status }) {
    const { color, label } = STATUS_MAP[status] || { color: 'default', label: status };
    return <Tag color={color}>{label}</Tag>;
}