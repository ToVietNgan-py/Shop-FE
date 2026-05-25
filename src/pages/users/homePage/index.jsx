// import { memo } from 'react';
// import { useState } from "react";
// import Btn from "./nutDangNhap/Btn.jsx";
// import Header from "../../../theme/header/index.jsx";
// import "./style.scss";

import { memo, useEffect, useMemo, useState } from 'react';
import HomeSlider from './HomeSlider/HomeSlider.jsx';
import "./style.scss";
import BestSeller from '../../../components/BestSeller/BestSeller.jsx';
import NewArrival from '../../../components/NewArrival/NewArrival.jsx';
import FlashSaleSection from '../../../components/FlashSaleSection/FlashSaleSection.jsx';
import { promotionService } from '../../../services/promotionService.js';
import { promotionUtils } from '../../../services/promotionService.js';
function HomePage() {
    const [promos, setPromos] = useState([]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const list = await promotionUtils.fetchPromotionCatalog().catch(() => []);
                if (!alive) return;
                setPromos(Array.isArray(list) ? list : []);
            } catch (e) {
                // ignore
            }
        })();
        return () => { alive = false; };
    }, []);

    const featuredPromo = useMemo(() => {
        const list = Array.isArray(promos) ? promos : [];
        return list.find((promo) => promo?.is_running && promo?.is_active) ?? list[0] ?? null;
    }, [promos]);

    const promoLabel = useMemo(() => {
        if (!featuredPromo) return "";

        if (featuredPromo.type === 'percent') {
            return `Đang giảm ${Number(featuredPromo.value ?? 0)}%`;
        }

        if (featuredPromo.type === 'amount') {
            return `Đang giảm ${Number(featuredPromo.value ?? 0).toLocaleString('vi-VN')}đ`;
        }

        return 'Ưu đãi đang chạy';
    }, [featuredPromo]);
    return (
        <div className="home-page">
            <HomeSlider />
            <FlashSaleSection />
            <BestSeller />
            <NewArrival />

        </div >

    );
}
export default memo(HomePage);