import { useCallback, useMemo, useState } from "react";
import { chatbotService } from "../apis/chatbot.js";

const DEFAULT_GREETING = "Xin chào! Mình là Rose - trợ lý thời trang của Dear Rose. Mình có thể giúp gì cho bạn hôm nay?";

const PAGE_SUGGESTIONS = {
    "/san-pham": ["Có màu mới nào đang hot không?", "Gợi ý váy hoa size M cho tôi", "Sản phẩm nào đang giảm giá?"],
    "/yeu-thich": ["Sắp xếp ưu tiên sản phẩm trong wishlist", "Thêm sản phẩm này vào giỏ hàng"],
    "/thanh-toan": ["Tôi có thể dùng mã giảm giá không?", "Phí vận chuyển bao nhiêu?"],
    "/don-hang": ["Đơn hàng gần nhất của tôi", "Cách hủy đơn hàng như thế nào?"],
    "/tai-khoan": ["Cập nhật thông tin cá nhân", "Đổi mật khẩu như thế nào?"],
};

const buildPageContext = (pathname = "") => {
    if (!pathname) {
        return "home";
    }

    if (pathname.startsWith("/san-pham/")) {
        return `product:${pathname.split("/")[2] || ""}`;
    }

    if (pathname.startsWith("/don-hang/")) {
        return `order:${pathname.split("/")[2] || ""}`;
    }

    return pathname.replace(/^\/+/, "") || "home";
};

export function useChatbot(pathname = "") {
    const [messages, setMessages] = useState([{ role: "assistant", content: DEFAULT_GREETING }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const suggestions = useMemo(() => {
        if (!pathname) {
            return ["Gợi ý sản phẩm phù hợp cho tôi", "Cách đổi trả như thế nào?", "Đơn hàng của tôi ở đâu?"];
        }

        return PAGE_SUGGESTIONS[pathname] ?? ["Gợi ý sản phẩm phù hợp cho tôi", "Cách đổi trả như thế nào?", "Đơn hàng của tôi ở đâu?"];
    }, [pathname]);

    const sendMessage = useCallback(async (text) => {
        const content = String(text ?? "").trim();
        if (!content || loading) {
            return;
        }

        const userMessage = { role: "user", content };
        setMessages((current) => [...current, userMessage]);
        setLoading(true);
        setError("");

        try {
            const reply = await chatbotService.sendMessage(content, buildPageContext(pathname));
            setMessages((current) => [...current, { role: "assistant", content: reply }]);
        } catch (requestError) {
            const fallback = requestError?.response?.data?.message
                || requestError?.message
                || "Xin lỗi, chatbot đang gặp lỗi tạm thời.";
            setError(fallback);
            setMessages((current) => [...current, {
                role: "assistant",
                content: fallback,
            }]);
        } finally {
            setLoading(false);
        }
    }, [loading, pathname]);

    const resetChat = useCallback(() => {
        setMessages([{ role: "assistant", content: DEFAULT_GREETING }]);
        setError("");
    }, []);

    return {
        messages,
        loading,
        error,
        suggestions,
        sendMessage,
        resetChat,
    };
}
