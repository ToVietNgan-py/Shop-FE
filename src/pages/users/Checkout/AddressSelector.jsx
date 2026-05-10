import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../apis/default';

export default function AddressSelector({ selected, onSelect }) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/auth/addresses')
            .then(res => {
                const list = res.data?.data || [];
                setAddresses(list);
                // auto-select địa chỉ mặc định
                const def = list.find(a => a.is_default) || list[0];
                if (def) onSelect(def.id);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="addr-loading">Đang tải địa chỉ...</div>;

    if (!addresses.length) return (
        <div className="addr-empty">
            Chưa có địa chỉ giao hàng.
            <Link to="/tai-khoan?tab=address">Thêm địa chỉ →</Link>
        </div>
    );

    return (
        <div className="addr-list">
            {addresses.map(addr => (
                <label key={addr.id} className={`addr-card ${selected === addr.id ? 'active' : ''}`}>
                    <input
                        type="radio" name="address"
                        value={addr.id}
                        checked={selected === addr.id}
                        onChange={() => onSelect(addr.id)}
                    />
                    <div>
                        <strong>{addr.recipient_name}</strong> · {addr.phone}
                        <br />
                        {addr.address_line}, {addr.district}, {addr.city}
                        {addr.is_default && <span className="default-tag">Mặc định</span>}
                    </div>
                </label>
            ))}
        </div>
    );
}