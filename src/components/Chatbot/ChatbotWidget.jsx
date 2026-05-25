import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaCommentDots, FaPaperPlane, FaTimes } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { useChatbot } from "../../hooks/useChatbot.js";
import "./chatbot.scss";

function ChatbotWidget() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [mounted, setMounted] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const location = useLocation();
    const { messages, loading, error, suggestions, sendMessage, resetChat } = useChatbot(location.pathname);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        const timer = window.setTimeout(() => {
            inputRef.current?.focus();
        }, 120);

        return () => window.clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const showSuggestions = useMemo(() => messages.length === 1 && !loading, [messages.length, loading]);

    const handleSend = async (value = input) => {
        const content = String(value ?? "").trim();
        if (!content) {
            return;
        }

        setInput("");
        await sendMessage(content);
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    if (!mounted) {
        return null;
    }

    return createPortal(
        <div className="chatbot-root">
            <button
                type="button"
                className={`chatbot-fab ${open ? "is-open" : ""}`}
                onClick={() => setOpen((current) => !current)}
                aria-label={open ? "Đóng chatbot" : "Mở chatbot"}
                title={open ? "Đóng chatbot" : "Mở chatbot"}
            >
                {open ? <FaTimes /> : <FaCommentDots />}
            </button>

            {open && (
                <section className="chatbot-panel" aria-label="Chatbot Dear Rose">
                    <header className="chatbot-panel__header">
                        <div className="chatbot-panel__avatar">
                            <img src="/logo.png" alt="Dear Rose" />
                        </div>
                        <div className="chatbot-panel__meta">
                            <p className="chatbot-panel__title">Dear Rose</p>
                            <p className="chatbot-panel__status">Đang hoạt động</p>
                        </div>
                        <button
                            type="button"
                            className="chatbot-panel__reset"
                            onClick={resetChat}
                            title="Xóa nội dung chat"
                        >
                            Đặt lại
                        </button>
                    </header>

                    <div className="chatbot-panel__messages" role="log" aria-live="polite">
                        {messages.map((message, index) => (
                            <div key={`${message.role}-${index}`} className={`chatbot-msg chatbot-msg--${message.role}`}>
                                {message.role === 'assistant' && (
                                    <div className="chatbot-msg__avatar-wrap">
                                        <img src="/logo.png" alt="Dear Rose" className="chatbot-msg__avatar" />
                                    </div>
                                )}

                                <div className="chatbot-msg__bubble">{message.content}</div>
                            </div>
                        ))}

                        {loading && (
                            <div className="chatbot-msg chatbot-msg--assistant chatbot-msg--typing" aria-label="Đang trả lời">
                                <span />
                                <span />
                                <span />
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {error && (
                        <div className="chatbot-panel__error" role="status">
                            {error}
                        </div>
                    )}

                    {showSuggestions && (
                        <div className="chatbot-panel__suggestions">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    className="chatbot-suggestion"
                                    onClick={() => handleSend(suggestion)}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    <footer className="chatbot-panel__footer">
                        <textarea
                            ref={inputRef}
                            className="chatbot-input"
                            rows={1}
                            placeholder="Nhắn tin với Rose..."
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                        />
                        <button
                            type="button"
                            className="chatbot-send"
                            onClick={() => handleSend()}
                            disabled={loading || !input.trim()}
                            aria-label="Gửi tin nhắn"
                        >
                            <FaPaperPlane />
                        </button>
                    </footer>
                </section>
            )}
        </div>,
        document.body
    );
}

export default ChatbotWidget;
