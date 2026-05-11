import { useState } from 'react';

export default function StarRating({ value = 0, onChange, readonly = false, size = 20 }) {
    const [hover, setHover] = useState(0);

    return (
        <div style={{ display: 'flex', gap: 4, cursor: readonly ? 'default' : 'pointer' }}>
            {[1, 2, 3, 4, 5].map(star => (
                <span
                    key={star}
                    style={{ fontSize: size, color: (hover || value) >= star ? '#f59e0b' : '#374151', transition: 'color 0.1s' }}
                    onClick={() => !readonly && onChange?.(star)}
                    onMouseEnter={() => !readonly && setHover(star)}
                    onMouseLeave={() => !readonly && setHover(0)}
                >★</span>
            ))}
        </div>
    );
}