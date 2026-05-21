// import { memo } from 'react';
// import { useState } from "react";
// import Btn from "./nutDangNhap/Btn.jsx";
// import Header from "../../../theme/header/index.jsx";
// import "./style.scss";

import { memo, useEffect, useState } from 'react';
import HomeSlider from './HomeSlider/HomeSlider.jsx';
import "./style.scss";
import BestSeller from '../../../components/BestSeller/BestSeller.jsx';
import NewArrival from '../../../components/NewArrival/NewArrival.jsx';
import { promotionService } from '../../../services/promotionService.js';
function HomePage() {
    const [promos, setPromos] = useState([]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const list = await promotionService.fetchActive().catch(() => []);
                if (!alive) return;
                setPromos(Array.isArray(list) ? list : []);
            } catch (e) {
                // ignore
            }
        })();
        return () => { alive = false; };
    }, []);
    return (
        <div className="home-page">
            {promos.length > 0 && (
                <div className="home-promo" style={{ background: '#06b6d4', color: '#fff', padding: '12px 16px', textAlign: 'center', borderRadius: 8, margin: '12px 16px' }}>
                    <strong>{promos[0].name}</strong>
                    <div style={{ fontSize: 14 }}>{promos[0].description || promos[0].subtitle || ''}</div>
                </div>
            )}
            <HomeSlider />
            <BestSeller />
            <NewArrival />

        </div >

    );
}
export default memo(HomePage);