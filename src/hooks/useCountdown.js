import { useEffect, useState, useCallback } from 'react';

/**
 * Hook đếm ngược từ initialSeconds về 0.
 * Re-render mỗi giây, tự clear interval khi về 0.
 *
 * @param {number} initialSeconds - Số giây ban đầu (lấy từ API remaining_seconds)
 * @returns {{ hours, minutes, seconds, finished, reset }}
 */
export const useCountdown = (initialSeconds) => {
  const [seconds, setSeconds] = useState(() => Math.max(0, initialSeconds ?? 0));

  // Reset khi prop thay đổi (ví dụ polling refetch trả remaining_seconds mới)
  useEffect(() => {
    setSeconds(Math.max(0, initialSeconds ?? 0));
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds === 0]);

  const reset = useCallback((newSeconds) => {
    setSeconds(Math.max(0, newSeconds ?? 0));
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return {
    hours: h,
    minutes: m,
    seconds: s,
    totalSeconds: seconds,
    finished: seconds <= 0,
    reset,
  };
};

export default useCountdown;
