import api from "./default.js";

const SESSION_KEY = "chatbot_session_token";

const toSessionToken = () => {
    if (typeof window === "undefined") {
        return "";
    }

    let token = window.sessionStorage.getItem(SESSION_KEY);
    if (!token) {
        const bytes = new Uint8Array(32);
        window.crypto.getRandomValues(bytes);
        token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
        window.sessionStorage.setItem(SESSION_KEY, token);
    }

    return token;
};

const normalizeMessage = (payload) => {
    if (typeof payload === "string") {
        return payload;
    }

    return payload?.message ?? payload?.reply ?? payload?.content ?? "Xin lỗi, mình chưa thể phản hồi ngay lúc này.";
};

export const chatbotService = {
    getSessionToken: toSessionToken,

    async sendMessage(message, pageContext = "") {
        const sessionToken = toSessionToken();

        const response = await api.post("/chatbot/message", {
            session_token: sessionToken,
            message,
            page_context: pageContext,
        });

        return normalizeMessage(response.data?.data ?? response.data);
    },
};

export default chatbotService;
