import { useState } from "react";
import { askAI } from "../../api/AIApi";
import  "../../styles/aiPanel.css";

export default function AiPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    setBusy(true);

    try {
      const res = await askAI(input);

      setMessages((prev) => [
        ...prev,
        { role: "user", text: input },
        { role: "ai", text: res.reply },
      ]);

      setInput("");
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
      <div className="ai-panel__messages">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`ai-msg ${
              m.role === "user" ? "ai-msg--user" : "ai-msg--ai"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="ai-panel__input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the diagram..."
        />

        <button onClick={handleSend} disabled={busy}>
          Send
        </button>
      </div>
    </div>
  );
}