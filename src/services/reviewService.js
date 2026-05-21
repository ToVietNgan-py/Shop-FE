// import api from "../apis/default.js";

// const extractList = (payload) => {
//     if (Array.isArray(payload)) {
//         return payload;
//     }

//     if (Array.isArray(payload?.items)) {
//         return payload.items;
//     }

//     if (Array.isArray(payload?.data)) {
//         return payload.data;
//     }

//     if (Array.isArray(payload?.reviews)) {
//         return payload.reviews;
//     }

//     return [];
// };

// export const normalizeReview = (review) => {
//     if (!review) {
//         return null;
//     }

//     const user = review.user ?? {};

//     return {
//         id: review.id ?? review.review_id ?? review.reviewId ?? `${review.user_name ?? review.userName ?? "review"}-${review.created_at ?? review.createdAt ?? Date.now()}`,
//         userName: review.user_name ?? review.userName ?? user.name ?? user.full_name ?? "Khách hàng",
//         userAvatar: review.user_avatar ?? review.userAvatar ?? user.avatar ?? "",
//         rating: Number(review.rating ?? review.score ?? 0),
//         comment: review.comment ?? review.content ?? review.message ?? "",
//         createdAt: review.created_at ?? review.createdAt ?? "",
//         images: Array.isArray(review.images) ? review.images : [],
//     };
// };

// const buildSummary = (reviews) => {
//     if (!reviews.length) {
//         return { total: 0, averageRating: 0 };
//     }

//     const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);

//     return {
//         total: reviews.length,
//         averageRating: totalRating / reviews.length,
//     };
// };

// export const reviewService = {
//     async list(productId, params = {}) {
//         try {
//             const response = await api.get(`/products/${productId}/reviews`, {
//                 params: {
//                     per_page: params.perPage ?? 10,
//                     page: params.page ?? 1,
//                     ...(params.rating ? { rating: params.rating } : {}),
//                 },
//             });

//             const payload = response.data?.data ?? response.data;
//             const reviews = extractList(payload).map(normalizeReview).filter(Boolean);
//             const total = Number(payload?.meta?.total ?? payload?.total ?? reviews.length);
//             const averageRating = Number(payload?.meta?.average_rating ?? payload?.average_rating ?? buildSummary(reviews).averageRating);
//             const ratingBreakdown = payload?.meta?.rating_breakdown ?? payload?.rating_breakdown ?? [];

//             return {
//                 items: reviews,
//                 total,
//                 averageRating,
//                 ratingBreakdown,
//                 currentPage: Number(payload?.meta?.current_page ?? payload?.current_page ?? params.page ?? 1),
//                 perPage: Number(payload?.meta?.per_page ?? payload?.per_page ?? params.perPage ?? 10),
//                 lastPage: Number(payload?.meta?.last_page ?? payload?.last_page ?? 1),
//             };
//         } catch (error) {
//             const errData = error.response?.data;
//             throw {
//                 message: errData?.message || errData?.error || "Không thể tải danh sách đánh giá",
//                 errors: errData?.errors,
//             };
//         }
//     },

//     async create(productId, data) {
//         const payload = {
//             order_id: Number(data?.orderId ?? data?.order_id ?? 0),
//             rating: Number(data?.rating ?? 0),
//             comment: String(data?.comment ?? "").trim(),
//             images: Array.isArray(data?.images) ? data.images : [],
//         };

//         try {
//             const response = await api.post(`/products/${productId}/reviews`, payload);
//             return normalizeReview(response.data?.data ?? response.data);
//         } catch (error) {
//             const errData = error.response?.data;
//             throw {
//                 message: errData?.message || errData?.error || "Không thể gửi đánh giá",
//                 errors: errData?.errors,
//             };
//         }
//     },
// };
import api from "../apis/default.js";

const extractList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.reviews)) return payload.reviews;
    return [];
};

export const normalizeReview = (review) => {
    if (!review) return null;

    // Lấy thông tin user lồng từ API hoặc fallback về dữ liệu phẳng
    const userObj = review.user ?? {};

    return {
        id: review.id ?? review.review_id ?? review.reviewId ?? `review-${Date.now()}`,
        userName: userObj.name ?? review.user_name ?? review.userName ?? userObj.full_name ?? "Khách hàng",
        userAvatar: userObj.avatar ?? review.user_avatar ?? review.userAvatar ?? "",
        rating: Number(review.rating ?? review.score ?? 0),
        comment: review.comment ?? review.content ?? review.message ?? "",
        createdAt: review.created_at ?? review.createdAt ?? "",
        images: Array.isArray(review.images) ? review.images : [],
    };
};

const buildSummary = (reviews) => {
    if (!reviews.length) return { total: 0, averageRating: 0 };
    const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return { total: reviews.length, averageRating: totalRating / reviews.length };
};

export const reviewService = {
    async list(productId, params = {}) {
        try {
            const response = await api.get(`/products/${productId}/reviews`, {
                params: {
                    per_page: params.perPage ?? 10,
                    page: params.page ?? 1,
                    ...(params.rating ? { rating: params.rating } : {}),
                },
            });

            const payload = response.data?.data ?? response.data;
            const reviews = extractList(payload).map(normalizeReview).filter(Boolean);
            const total = Number(payload?.meta?.total ?? payload?.total ?? reviews.length);
            const averageRating = Number(payload?.meta?.average_rating ?? payload?.average_rating ?? buildSummary(reviews).averageRating);
            const ratingBreakdown = payload?.meta?.rating_breakdown ?? payload?.rating_breakdown ?? [];

            return {
                items: reviews,
                total,
                averageRating,
                ratingBreakdown,
                currentPage: Number(payload?.meta?.current_page ?? payload?.current_page ?? params.page ?? 1),
                perPage: Number(payload?.meta?.per_page ?? payload?.per_page ?? params.perPage ?? 10),
                lastPage: Number(payload?.meta?.last_page ?? payload?.last_page ?? 1),
            };
        } catch (error) {
            const errData = error.response?.data;
            throw {
                message: errData?.message || errData?.error || "Không thể tải danh sách đánh giá",
                errors: errData?.errors,
            };
        }
    },

    async create(productId, data) {
        const payload = {
            order_id: Number(data?.orderId ?? data?.order_id ?? 0),
            rating: Number(data?.rating ?? 0),
            comment: String(data?.comment ?? "").trim(),
            images: Array.isArray(data?.images) ? data.images : [],
        };

        try {
            const response = await api.post(`/products/${productId}/reviews`, payload);
            return normalizeReview(response.data?.data ?? response.data);
        } catch (error) {
            const errData = error.response?.data;
            throw {
                message: errData?.message || errData?.error || "Không thể gửi đánh giá",
                errors: errData?.errors,
            };
        }
    },
};
