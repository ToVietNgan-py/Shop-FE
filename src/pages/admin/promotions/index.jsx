import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import DataTable from '../../../components/admin/DataTable.jsx';
import adminPromotionService from '../../../services/admin/adminPromotionService.js';
import { Button, Input, Space, Typography, message, Tag, Modal } from 'antd';
import PromotionModal from './PromotionModal.jsx';
import '../_shared/admin-page.scss';

export default function PromotionsPage() {
    const [loading, setLoading] = useState(true);
    const [promotions, setPromotions] = useState([]);
    const [meta, setMeta] = useState({});

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState(null);
    const [filters, setFilters] = useState({
        page: 1,
        per_page: 10,
        search: '',
    });
    const normalizeResponse = (res, fallbackFilters) => {
        const payload = res?.data ?? {};
        const nestedData = payload?.data;
        const items = Array.isArray(nestedData)
            ? nestedData
            : Array.isArray(nestedData?.data)
                ? nestedData.data
                : Array.isArray(payload)
                    ? payload
                    : [];

        const rawMeta = nestedData?.meta ?? payload?.meta ?? {};

        const meta = {
            current_page: rawMeta?.current_page ?? fallbackFilters.page,
            per_page: rawMeta?.per_page ?? fallbackFilters.per_page,
            total: rawMeta?.total ?? items.length,
        };

        return { items, meta };
    };

    const fetchPromotions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminPromotionService.getAll(filters);
            const { items, meta: nextMeta } = normalizeResponse(res, filters);
            setPromotions(items);
            setMeta(nextMeta);
        } catch (error) {
            const status = error?.response?.status;
            if (status === 401) message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            else if (status === 403) message.error('Tài khoản hiện tại không có quyền xem promotions admin.');
            else if (status === 404) message.error('API admin promotions chưa sẵn sàng trên backend của máy bạn.');
            else message.error(error?.response?.data?.message || 'Không tải được danh sách khuyến mãi.');

            setPromotions([]);
            setMeta({ current_page: filters.page, per_page: filters.per_page, total: 0 });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

    const columns = useMemo(() => [
        { title: 'Tên', dataIndex: 'name', render: (v, r) => <Space direction="vertical"><Typography.Text strong>{v}</Typography.Text><Typography.Text type="secondary">ID: {r.id}</Typography.Text></Space> },
        { title: 'Loại', dataIndex: 'type', render: (t) => (t === 'percent' ? 'Phần trăm' : t === 'amount' ? 'Số tiền' : t) },
        { title: 'Giá trị', dataIndex: 'value', render: (v) => (typeof v === 'number' ? v.toLocaleString('vi-VN') : v) },
        { title: 'Hạn', dataIndex: 'expires_at', render: (d) => (d ? new Date(d).toLocaleString() : '-') },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_, record) => {
                if (!record.is_active) {
                    return <Tag>Tắt</Tag>;
                }

                if (record.is_running) {
                    return <Tag color="green">Đang chạy</Tag>;
                }

                return <Tag color="red">Hết hạn</Tag>;
            }
        },
        {
            title: 'Hành động', key: 'actions', render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        onClick={async () => {
                            try {
                                setLoading(true);

                                const res = await adminPromotionService.getById(record.id);

                                const promotionDetail = res?.data?.data || res?.data;

                                if (!promotionDetail) {
                                    message.error('Không có dữ liệu promotion');
                                    return;
                                }

                                setSelectedPromotion({
                                    ...promotionDetail,
                                    products: promotionDetail.products || [],
                                    categories: promotionDetail.categories || [],
                                    bogo_rules: promotionDetail.bogo_rules || [],
                                });
                                setModalOpen(true);
                            } catch (error) {
                                message.error('Không tải được chi tiết khuyến mãi');
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        Sửa
                    </Button>
                    <Button size="small" danger onClick={async () => {
                        Modal.confirm({
                            title: 'Xoá khuyến mãi',
                            content: 'Bạn có chắc muốn xoá khuyến mãi này?',
                            okText: 'Xoá',
                            okType: 'danger',
                            cancelText: 'Huỷ',
                            async onOk() {
                                try {
                                    await adminPromotionService.remove(record.id);
                                    message.success('Đã xoá');
                                    fetchPromotions();
                                } catch (e) {
                                    message.error('Không thể xoá');
                                }
                            }
                        });
                        try { await adminPromotionService.remove(record.id); message.success('Đã xoá'); fetchPromotions(); } catch (e) { message.error('Không thể xoá'); }
                    }}>Xoá</Button>
                </Space>
            )
        }
    ], [fetchPromotions]);

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Input.Search placeholder="Tìm khuyến mãi..." allowClear style={{ maxWidth: 360 }} value={filters.search} onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />

                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedPromotion(null); setModalOpen(true); }}>Tạo khuyến mãi</Button>
                </Space>
            </div>

            <div className="admin-page__card">
                <DataTable columns={columns} dataSource={promotions} meta={meta} loading={loading} onChange={(page, pageSize) => setFilters(f => ({ ...f, page, per_page: pageSize }))} />
            </div>

            <PromotionModal open={modalOpen} promotion={selectedPromotion} onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); fetchPromotions(); }} />
        </>
    );
}
