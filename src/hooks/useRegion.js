import { useEffect, useState } from "react";
import { regionApi } from "../apis/region.js";

/**
 * Tách toàn bộ logic tải tỉnh/huyện/xã ra khỏi CheckoutPage.
 * Trước đây có 3 useEffect lặp code cùng pattern → gom vào 1 hook.
 */
export function useRegion({ cityCode, districtCode }) {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
    const [isLoadingWards, setIsLoadingWards] = useState(false);
    const [regionError, setRegionError] = useState("");
    const [retryNonce, setRetryNonce] = useState(0);

    // Helper: bọc một async loader với isMounted guard + loading + error state
    function makeLoader(setLoading, setter, setError, errorMsg) {
        return async (fetcher, isMountedRef) => {
            setLoading(true);
            setError("");
            try {
                const data = await fetcher();
                if (isMountedRef.current) setter(data);
            } catch {
                if (isMountedRef.current) setError(errorMsg);
            } finally {
                if (isMountedRef.current) setLoading(false);
            }
        };
    }

    // Load tỉnh/thành
    useEffect(() => {
        const ref = { current: true };
        const load = makeLoader(
            setIsLoadingProvinces,
            setProvinces,
            setRegionError,
            "Không tải được dữ liệu tỉnh/thành."
        );
        load(() => regionApi.getProvinces(), ref);
        return () => { ref.current = false; };
    }, [retryNonce]);

    // Load quận/huyện theo tỉnh đã chọn
    useEffect(() => {
        if (!cityCode) {
            setDistricts([]);
            setWards([]);
            return;
        }
        const ref = { current: true };
        const load = makeLoader(
            setIsLoadingDistricts,
            setDistricts,
            setRegionError,
            "Không tải được quận/huyện cho tỉnh/thành đã chọn."
        );
        load(() => regionApi.getDistricts(cityCode), ref);
        return () => { ref.current = false; };
    }, [cityCode, retryNonce]);

    // Load phường/xã theo quận đã chọn
    useEffect(() => {
        if (!districtCode) {
            setWards([]);
            return;
        }
        const ref = { current: true };
        const load = makeLoader(
            setIsLoadingWards,
            setWards,
            setRegionError,
            "Không tải được phường/xã cho quận/huyện đã chọn."
        );
        load(() => regionApi.getWards(districtCode), ref);
        return () => { ref.current = false; };
    }, [districtCode, retryNonce]);

    const retryRegions = () => {
        setRegionError("");
        setRetryNonce((n) => n + 1);
    };

    return {
        provinces,
        districts,
        wards,
        isLoadingProvinces,
        isLoadingDistricts,
        isLoadingWards,
        regionError,
        retryRegions,
    };
}