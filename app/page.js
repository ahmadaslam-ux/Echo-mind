"use client";
import React, { useState, useRef, useEffect } from "react";

// Lightweight markdown renderer: handles **bold**, bullet lists, and line breaks
function renderMarkdown(text) {
  const lines = text.split("\n");
  const nodes = [];
  let listBuffer = [];

  const flushList = (key) => {
    if (listBuffer.length) {
      nodes.push(
        <ul key={`ul-${key}`} style={{ margin: "4px 0", paddingLeft: "20px" }}>
          {listBuffer.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^[-*]\s+/, ""));
    } else {
      flushList(idx);
      if (trimmed === "") {
        nodes.push(<div key={idx} style={{ height: "8px" }} />);
      } else {
        nodes.push(<div key={idx}>{renderInline(line)}</div>);
      }
    }
  });
  flushList("end");
  return nodes;
}

function renderInline(line) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function AIChatApp() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask me anything — any topic, any language. You can also share a photo or use your voice." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "hi-IN";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {}
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const plain = text.replace(/\*\*/g, "");
    const utterance = new SpeechSynthesisUtterance(plain);
    window.speechSynthesis.speak(utterance);
  };

  const newChat = () => {
    window.speechSynthesis?.cancel();
    setMessages([
      { role: "assistant", content: "Hi! Ask me anything — any topic, any language. You can also share a photo or use your voice." },
    ]);
    setInput("");
    setPendingImage(null);
  };

  const copyMessage = (text) => {
    navigator.clipboard?.writeText(text);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      const isPdf = file.type === "application/pdf";
      setPendingImage({
        base64,
        mediaType: file.type || "image/jpeg",
        previewUrl: isPdf ? null : reader.result,
        isPdf,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !pendingImage) || loading) return;

    const displayMsg = {
      role: "user",
      content: text,
      image: pendingImage?.previewUrl || null,
      fileName: pendingImage?.isPdf ? pendingImage.fileName : null,
    };
    const newMessages = [...messages, displayMsg];
    setMessages(newMessages);
    setInput("");
    const fileToSend = pendingImage;
    setPendingImage(null);
    setLoading(true);

    try {
      const apiMessages = newMessages.map((m) => {
        if (m.role === "user" && (m.image || m.fileName) && fileToSend) {
          const mediaType = fileToSend.mediaType;
          const base64 = fileToSend.base64;
          const block = fileToSend.isPdf
            ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
            : { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };
          const contentBlocks = [block];
          if (m.content) contentBlocks.push({ type: "text", text: m.content });
          return { role: "user", content: contentBlocks };
        }
        return { role: m.role, content: m.content };
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await response.json();
      const reply = data.reply || data.error || "Sorry, I couldn't get a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection issue — please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.dot} />
        <div style={{ flex: 1 }}>
          <div style={styles.title}>Saathi</div>
          <div style={styles.subtitle}>Ask me anything</div>
        </div>
        <button style={styles.newChatBtn} onClick={newChat} type="button">
          + New Chat
        </button>
      </div>

      <div style={styles.chatArea}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ ...styles.bubbleRow, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ ...styles.bubble, ...(m.role === "user" ? styles.userBubble : styles.assistantBubble) }}>
                {m.image && (
                  <img src={m.image} alt="Shared" style={{ maxWidth: "200px", borderRadius: "10px", display: "block", marginBottom: m.content ? "8px" : 0 }} />
                )}
                {m.fileName && (
                  <div style={styles.fileChip}>📄 {m.fileName}</div>
                )}
                {renderMarkdown(m.content)}
              </div>
            </div>
            {m.role === "assistant" && i > 0 && (
              <button style={styles.copyBtn} onClick={() => copyMessage(m.content)} type="button">
                Copy
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ ...styles.bubbleRow, justifyContent: "flex-start" }}>
            <div style={{ ...styles.bubble, ...styles.assistantBubble, ...styles.thinking }}>
              <span style={styles.dotAnim("0s")} />
              <span style={styles.dotAnim("0.15s")} />
              <span style={styles.dotAnim("0.3s")} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {pendingImage && (
        <div style={styles.previewStrip}>
          {pendingImage.isPdf ? (
            <div style={styles.fileChip}>📄 {pendingImage.fileName}</div>
          ) : (
            <img src={pendingImage.previewUrl} alt="Preview" style={styles.previewThumb} />
          )}
          <button style={styles.removeImageBtn} onClick={() => setPendingImage(null)}>✕</button>
        </div>
      )}

      <div style={styles.inputBar}>
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />
        <button style={styles.cameraBtn} onClick={() => fileInputRef.current?.click()} type="button" aria-label="Add photo">+</button>
        {voiceSupported && (
          <button style={{ ...styles.cameraBtn, ...(isListening ? styles.micActive : {}) }} onClick={toggleListening} type="button" aria-label="Voice input">🎤</button>
        )}
        <textarea style={styles.input} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Type your question..." rows={1} />
        <button style={styles.sendBtn} onClick={send} disabled={loading}>➤</button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        textarea::placeholder { color: #A8A296; }
        textarea:focus { outline: 2px solid #D97757; }
        button:focus-visible { outline: 2px solid #D97757; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", height: "100vh", background: "#F4F1EA", fontFamily: "'Inter', -apple-system, sans-serif", color: "#3D3929" },
  header: { display: "flex", alignItems: "center", gap: "12px", padding: "18px 20px", borderBottom: "1px solid #E5E1D8", background: "#FFFFFF" },
  dot: { width: "10px", height: "10px", borderRadius: "50%", background: "#D97757", boxShadow: "0 0 12px rgba(217,119,87,0.5)" },
  title: { fontFamily: "'Space Grotesk', sans-serif", fontSize: "18px", fontWeight: 600, letterSpacing: "0.3px", color: "#3D3929" },
  subtitle: { fontSize: "12px", color: "#8A8577", marginTop: "2px" },
  chatArea: { flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" },
  bubbleRow: { display: "flex", width: "100%" },
  bubble: { maxWidth: "78%", padding: "12px 16px", borderRadius: "16px", fontSize: "14.5px", lineHeight: 1.5, whiteSpace: "pre-wrap" },
  userBubble: { background: "#D97757", color: "#FFFFFF", borderBottomRightRadius: "4px" },
  assistantBubble: { background: "#FFFFFF", color: "#3D3929", border: "1px solid #E5E1D8", borderBottomLeftRadius: "4px" },
  thinking: { display: "flex", gap: "5px", padding: "16px 18px" },
  dotAnim: (delay) => ({ width: "6px", height: "6px", borderRadius: "50%", background: "#D97757", display: "inline-block", animation: `bounce 1s infinite ${delay}` }),
  inputBar: { display: "flex", gap: "10px", padding: "14px 16px", borderTop: "1px solid #E5E1D8", background: "#FFFFFF" },
  input: { flex: 1, background: "#F4F1EA", border: "1px solid #E5E1D8", borderRadius: "12px", padding: "12px 14px", color: "#3D3929", fontSize: "14.5px", fontFamily: "inherit", resize: "none" },
  sendBtn: { background: "#D97757", color: "#FFFFFF", border: "none", borderRadius: "12px", width: "44px", fontSize: "16px", cursor: "pointer" },
  cameraBtn: { background: "#F4F1EA", border: "1px solid #E5E1D8", borderRadius: "12px", width: "44px", fontSize: "24px", fontWeight: 400, lineHeight: 1, color: "#3D3929", cursor: "pointer", flexShrink: 0 },
  micActive: { background: "#D97757", borderColor: "#D97757", boxShadow: "0 0 0 4px rgba(217,119,87,0.2)" },
  previewStrip: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "#FFFFFF", borderTop: "1px solid #E5E1D8" },
  previewThumb: { width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px", border: "1px solid #E5E1D8" },
  removeImageBtn: { background: "#F4F1EA", border: "1px solid #E5E1D8", borderRadius: "50%", width: "24px", height: "24px", fontSize: "12px", cursor: "pointer", color: "#8A8577" },
  newChatBtn: { background: "#F4F1EA", border: "1px solid #E5E1D8", borderRadius: "10px", padding: "8px 14px", fontSize: "13px", color: "#3D3929", cursor: "pointer", fontFamily: "inherit" },
  copyBtn: { background: "none", border: "none", color: "#8A8577", fontSize: "12px", cursor: "pointer", padding: "4px 4px", marginTop: "2px", fontFamily: "inherit" },
  fileChip: { background: "#F4F1EA", border: "1px solid #E5E1D8", borderRadius: "8px", padding: "6px 10px", fontSize: "13px", display: "inline-block" },
};
