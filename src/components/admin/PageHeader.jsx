import { useState, useEffect, useRef } from "react";
import { Layout, Space, Button, Tag, Avatar, Badge, Dropdown, Typography } from "antd";
import { AiOutlineSearch, AiOutlineSetting, AiOutlineLogout, AiOutlineBell, AiOutlineUser } from "react-icons/ai";

import { MdCreditCard, MdTune } from "react-icons/md";
import AdminBreadcrumb from "./AdminBreadcrumb.jsx";
import { useOrderPolling } from "../../hooks/useOrderPolling";

const { Header } = Layout;

const fmt = (n) => Number(n).toLocaleString("vi-VN") + "đ";

const STATUS_MAP = {
    pending: "Chờ xử lý",
    processing: "Đang xử lý",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
};

export default function AdminHeader({ roleLabel, displayName, logout }) {
    const { orders, unread, markAllRead } = useOrderPolling("/admin/dashboard/summary");

    // ── Notification items ─────────────────────────────────────────────
    const notifItems = orders.length
        ? orders.map((o) => ({
            key: String(o.id),
            label: (
                <div style={{ width: 280 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span>
                            <strong>#DH-{o.id}</strong> — {o.FullName}
                        </span>
                        <strong style={{ flexShrink: 0 }}>{fmt(o.total)}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>
                        {o.PhoneNumber} · {STATUS_MAP[o.Status] ?? o.Status}
                    </div>
                    {o.voucher_code && (
                        <div style={{ fontSize: 12, color: "#d46b08", marginTop: 2 }}>
                            Voucher: {o.voucher_code} · Giảm: {fmt(o.discount)}
                        </div>
                    )}
                </div>
            ),
        }))
        : [
            {
                key: "empty",
                disabled: true,
                label: (
                    <span style={{ color: "#8c8c8c" }}>Chưa có đơn mới</span>
                ),
            },
        ];

    // ── Settings items ─────────────────────────────────────────────────
    const settingsItems = [
        {
            key: "general",
            icon: <MdTune />,
            label: (
                <div>
                    <div style={{ fontWeight: 500 }}>Cài đặt chung</div>
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>Ngôn ngữ, múi giờ, cửa hàng</div>
                </div>
            ),
        },
        { type: "divider" },
        {
            key: "payment",
            icon: <MdCreditCard />,
            label: (
                <div>
                    <div style={{ fontWeight: 500 }}>Cài đặt thanh toán</div>
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>Cổng thanh toán, phí, phương thức</div>
                </div>
            ),
        },
    ];

    return (
        <Header className="admin-layout__header">
            <AdminBreadcrumb />

            <Space size={16} align="center">
                <Button type="text" icon={<AiOutlineSearch />} size="small" />

                {/* Thông báo đơn hàng */}
                <Dropdown
                    menu={{ items: notifItems }}
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

                {/* Cài đặt */}
                <Dropdown
                    menu={{ items: settingsItems }}
                    trigger={["click"]}
                    placement="bottomRight"
                >
                    <Button type="text" icon={<AiOutlineSetting />} size="small">
                        Cài đặt
                    </Button>
                </Dropdown>

                <Tag color="green">{roleLabel}</Tag>
                {/* Avatar */}
                <Space size={8} align="center">
                    <Avatar size={28} icon={<AiOutlineUser />}>
                        {displayName?.slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Typography.Text strong>{roleLabel}</Typography.Text>
                </Space>
                <Button icon={<AiOutlineLogout />} size="small" onClick={logout}>
                    Đăng xuất
                </Button>
            </Space>

            <div className="admin-layout__header-rainbow" />
        </Header>
    );
}