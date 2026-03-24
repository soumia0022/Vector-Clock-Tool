import { useEffect, useRef, useState } from "react";
import { askAI } from "../../api/AIApi";
import "../../styles/aiPanel.css";

export default function AiPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi! Ask me about the current diagram, for example: Why are e2 and e5 concurrent?",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const handleSend = async () => {
    if (!input.trim() || busy) return;

    const userText = input.trim();
    setInput("");
    setBusy(true);

    setMessages((prev) => [...prev, { role: "user", text: userText }]);

    try {
      const res = await askAI(userText);

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: res.reply || "Sorry, I could not generate a reply." },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Error: " + e.message },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel__header">
        <div>
          <h3 className="ai-panel__title">AI Assistant</h3>
          <p className="ai-panel__subtitle">Ask about the diagram or quiz answers</p>
        </div>
        <span className="ai-panel__badge">Beta</span>
      </div>

      <div className="ai-panel__messages">
        {messages.length === 0 && (
          <div className="ai-panel__empty">
            Start a conversation about the current diagram.
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`ai-row ${m.role === "user" ? "ai-row--user" : "ai-row--ai"}`}
          >
            <div className="ai-msg-meta">
              {m.role === "user" ? "You" : "AI"}
            </div>

            <div
              className={`ai-msg ${
                m.role === "user" ? "ai-msg--user" : "ai-msg--ai"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {busy && (
          <div className="ai-row ai-row--ai">
            <div className="ai-msg-meta">AI</div>
            <div className="ai-msg ai-msg--ai ai-msg--typing">
              Thinking...
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="ai-panel__composer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the diagram..."
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />

        <button onClick={handleSend} disabled={busy || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}