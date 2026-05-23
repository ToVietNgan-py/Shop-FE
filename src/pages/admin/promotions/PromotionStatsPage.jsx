/**
 * PromotionStatsPage.jsx — Phase 5
 * Route: /admin/promotions/:id/stats
 *
 * Hiển thị:
 * - Tổng lượt áp dụng, tổng discount, conversion rate
 * - Line chart "lượt áp theo ngày" (Chart.js qua react-chartjs-2)
 * - Bảng top sản phẩm được áp dụng nhiều nhất
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import adminPromotionService from '../../../services/admin/adminPromotionService.js';
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
);

// ── Helpers ────────────────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const StatCard = ({ icon, label, value, sub, color = '#db2777' }) => (
    <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 2px 10px rgba(15,23,42,0.07)',
        borderTop: `4px solid ${color}`,
        minWidth: 0,
    }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13.5, color: '#6b7280', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
);

// ── Main ───────────────────────────────────────────────────────────
const PromotionStatsPage = () => {
    const { id } = useParams();
    const [stats, setStats] = useState(null);
    const [promoName, setPromoName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [statsRes, detailRes] = await Promise.all([
                    adminPromotionService.getStats(id),
                    adminPromotionService.detail(id),
                ]);
                setStats(statsRes.data?.data ?? statsRes.data);
                setPromoName(detailRes.data?.data?.name ?? `Promotion #${id}`);
            } catch {
                setError('Không thể tải thống kê. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    // ── Chart data ─────────────────────────────────────────────────
    const chartData = stats?.daily_usage
        ? {
            labels: stats.daily_usage.map((d) => d.date),
            datasets: [
                {
                    label: 'Lượt áp dụng',
                    data: stats.daily_usage.map((d) => d.count),
                    borderColor: '#db2777',
                    backgroundColor: 'rgba(219,39,119,0.08)',
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: '#db2777',
                    fill: true,
                    tension: 0.4,
                },
            ],
        }
        : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => ` ${ctx.parsed.y} lượt`,
                },
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: { font: { size: 12 } },
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: { stepSize: 1, font: { size: 12 } },
            },
        },
    };

    // ── Render ──────────────────────────────────────────────────────
    return (
        <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
            {/* Breadcrumb */}
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
                <Link to="/admin/promotions" style={{ color: '#db2777', textDecoration: 'none' }}>
                    ← Quay lại danh sách
                </Link>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 24 }}>
                📊 Thống kê: <span style={{ color: '#db2777' }}>{promoName}</span>
            </h1>

            {/* Loading / Error */}
            {loading && (
                <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                    Đang tải thống kê...
                </div>
            )}
            {error && (
                <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                    padding: '14px 18px', color: '#dc2626', marginBottom: 20,
                }}>
                    {error}
                </div>
            )}

            {stats && (
                <>
                    {/* Stat Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 16,
                        marginBottom: 28,
                    }}>
                        <StatCard
                            icon="🛒"
                            label="Tổng đơn áp dụng"
                            value={stats.total_orders ?? 0}
                            color="#db2777"
                        />
                        <StatCard
                            icon="💰"
                            label="Tổng tiền giảm"
                            value={fmt(stats.total_discount)}
                            color="#7c3aed"
                        />
                        <StatCard
                            icon="📈"
                            label="Conversion Rate"
                            value={`${(stats.conversion_rate ?? 0).toFixed(1)}%`}
                            sub="Tỷ lệ đơn có promo / tổng đơn"
                            color="#0891b2"
                        />
                        <StatCard
                            icon="🏆"
                            label="Trung bình giảm / đơn"
                            value={fmt(
                                stats.total_orders
                                    ? Math.round(stats.total_discount / stats.total_orders)
                                    : 0
                            )}
                            color="#059669"
                        />
                    </div>

                    {/* Line Chart */}
                    {chartData && (
                        <div style={{
                            background: '#fff',
                            borderRadius: 12,
                            padding: '20px 24px',
                            boxShadow: '0 2px 10px rgba(15,23,42,0.07)',
                            marginBottom: 28,
                        }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 16 }}>
                                📅 Lượt áp dụng theo ngày
                            </h2>
                            <div style={{ height: 260 }}>
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    )}

                    {/* Top Products Table */}
                    {stats.top_products?.length > 0 && (
                        <div style={{
                            background: '#fff',
                            borderRadius: 12,
                            padding: '20px 24px',
                            boxShadow: '0 2px 10px rgba(15,23,42,0.07)',
                        }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 16 }}>
                                🔥 Top sản phẩm được áp dụng nhiều nhất
                            </h2>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb' }}>
                                        {['#', 'Sản phẩm', 'Lượt áp', 'Tổng giảm'].map((h) => (
                                            <th key={h} style={{
                                                padding: '10px 12px', textAlign: 'left',
                                                fontWeight: 600, color: '#374151',
                                                borderBottom: '1px solid #e5e7eb',
                                                fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px',
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.top_products.map((p, idx) => (
                                        <tr key={p.product_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '10px 12px', color: '#9ca3af', fontWeight: 700 }}>
                                                {idx + 1}
                                            </td>
                                            <td style={{ padding: '10px 12px', fontWeight: 500 }}>{p.product_name}</td>
                                            <td style={{ padding: '10px 12px' }}>{p.apply_count}</td>
                                            <td style={{ padding: '10px 12px', color: '#db2777', fontWeight: 600 }}>
                                                {fmt(p.total_discount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PromotionStatsPage;
