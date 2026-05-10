import { useEffect, useRef } from "react";
import { Badge, Dropdown, Button, Tag, notification } from "antd";
import { AiOutlineBell, AiOutlineShoppingCart } from "react-icons/ai";
import { useOrderPolling } from "../../hooks/useOrderPolling";

const STATUS_MAP = {
    pending: { label: "Chờ xử lý", color: "warning" },
    processing: { label: "Đang xử lý", color: "processing" },
    completed: { label: "Hoàn thành", color: "success" },
    cancelled: { label: "Đã hủy", color: "error" },
};

const fmt = (n) => Number(n).toLocaleString("vi-VN") + "đ";

export default function OrderNotification() {
    const { orders, unread, markAllRead } = useOrderPolling("/api/orders/recent");
    const prevUnread = useRef(0);

    // Hiện toast khi có đơn mới
    useEffect(() => {
        const diff = unread - prevUnread.current;
        if (diff > 0) {
            const o = orders[0];
            notification.open({
                message: (
                    <span>
                        Đơn mới <strong>#DH-{o.id}</strong> — {o.FullName}
                    </span>
                ),
                description: (
                    <div style={{ fontSize: 13 }}>
                        <div>{o.PhoneNumber} · {o.payment_method}</div>
                        <div style={{ marginTop: 4 }}>
                            Tổng: <strong>{fmt(o.total)}</strong>
                            {o.voucher_code && <> · Voucher: <Tag color="orange">{o.voucher_code}</Tag></>}
                            {o.discount > 0 && <> · Giảm: <span style={{ color: "#cf1322" }}>-{fmt(o.discount)}</span></>}
                        </div>
                    </div>
                ),
                icon: <AiOutlineShoppingCart style={{ color: "#185fa5", fontSize: 20 }} />,
                duration: 5,
            });
        }
        prevUnread.current = unread;
    }, [unread, orders]);

    const menu = {
        items: orders.map(o => ({
            key: o.id,
            label: (
                <div style={{ width: 300 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span><strong>#DH-{o.id}</strong> — {o.FullName}</span>
                        <strong>{fmt(o.total)}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>
                        {o.PhoneNumber} · {o.Address}
                    </div>
                    <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <Tag color={STATUS_MAP[o.Status]?.color}>{STATUS_MAP[o.Status]?.label}</Tag>
                        <Tag color={o.payment_status === "paid" ? "success" : "default"}>
                            {o.payment_status === "paid" ? "Đã TT" : "Chưa TT"}
                        </Tag>
                        <Tag>{o.payment_method}</Tag>
                        {o.voucher_code && <Tag color="orange">{o.voucher_code}</Tag>}
                    </div>
                </div>
            ),
        })),
    };

    return (
        <Dropdown
            menu={menu}
            trigger={["click"]}
            placement="bottomRight"
            onOpenChange={(open) => open && markAllRead()}
        >
            <Badge count={unread} size="small">
                <Button type="text" icon={<AiOutlineBell />} size="small">
                    Thông báo
                </Button>
            </Badge>
        </Dropdown>
    );
}