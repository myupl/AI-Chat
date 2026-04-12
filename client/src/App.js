import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [characters, setCharacters] = useState({});
  const [character, setCharacter] = useState("nova");
  const [newName, setNewName] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newAvatar, setNewAvatar] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/characters")
      .then((res) => res.json())
      .then((data) => setCharacters(data));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("chat_" + character);
    if (saved) setChat(JSON.parse(saved));
    else setChat([]);
  }, [character]);

  useEffect(() => {
    localStorage.setItem("chat_" + character, JSON.stringify(chat));
  }, [chat, character]);

  const createCharacter = async () => {
    if (!newName.trim()) return;
    const id = newName.toLowerCase().replace(/\s+/g, "_");

    await axios.post("http://localhost:3001/character/create", {
      id,
      name: newName,
      system: newPrompt,
      avatar: newAvatar,
    });

    const res = await fetch("http://localhost:3001/characters");
    const data = await res.json();
    setCharacters(data);
    setNewName("");
    setNewPrompt("");
    setNewAvatar("");
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    const userMsg = message;
    setChat((prev) => [...prev, { role: "user", text: userMsg }]);
    setMessage("");

    const res = await axios.post("http://localhost:3001/chat", {
      message: userMsg,
      characterId: character,
    });

    setChat((prev) => [
      ...prev,
      { role: "ai", text: res.data.reply },
    ]);
  };

  const inputStyle = {
    width: "100%",
    padding: 10,
    marginBottom: 8,
    borderRadius: 10,
    border: "none",
    outline: "none",
    background: "#1b2130",
    color: "white",
    boxSizing: "border-box"
  };

  const btnStyle = {
    padding: 10,
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#4f7cff",
    color: "white",
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial", background: "#0f1115", color: "white" }}>
      {/* SIDEBAR */}
      <div style={{ width: 300, background: "#141824", padding: 15, borderRight: "1px solid #222", display: "flex", flexDirection: "column", gap: 10 }}>
        <h2>🤖 Characters</h2>
        <input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />
        <input placeholder="Avatar URL (optional)" value={newAvatar} onChange={(e) => setNewAvatar(e.target.value)} style={inputStyle} />
        <textarea placeholder="Personality" value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} style={{ ...inputStyle, height: 60 }} />
        <button onClick={createCharacter} style={btnStyle}>➕ Create</button>

        <div style={{ marginTop: 10, overflowY: "auto" }}>
          {Object.entries(characters).map(([id, char]) => (
            <div
              key={id}
              onClick={() => setCharacter(id)}
              style={{
                padding: 10,
                marginBottom: 8,
                borderRadius: 10,
                cursor: "pointer",
                background: character === id ? "#2a3447" : "#1b2130",
                display: "flex",
                alignItems: "center",
                gap: 10
              }}
            >
              <img src={char.avatar} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
              {char.name}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 15 }}>
        <h2>💬 Chat with {characters[character]?.name}</h2>
        <div style={{ flex: 1, overflowY: "auto", padding: 15, background: "#0d1018", borderRadius: 15, border: "1px solid #222" }}>
          {chat.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: c.role === "user" ? "flex-end" : "flex-start", margin: "12px 0", gap: 10, alignItems: "flex-end", flexDirection: c.role === "user" ? "row-reverse" : "row" }}>
              {c.role === "ai" && <img src={characters[character]?.avatar} style={{ width: 35, height: 35, borderRadius: "50%" }} alt="" />}
              <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: 15, background: c.role === "user" ? "#4f7cff" : "#1f2635", color: "white" }}>
                {c.text}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", marginTop: 10, gap: 10 }}>
          <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} placeholder="Type a message..." />
          <button onClick={sendMessage} style={btnStyle}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;