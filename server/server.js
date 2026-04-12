import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const characters = {
  nova: {
    name: "Nova",
    system: "You are a friendly AI assistant",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Nova"
  }
};

app.get("/characters", (req, res) => {
  res.json(characters);
});

app.post("/character/create", (req, res) => {
  const { id, name, system, avatar } = req.body;

  if (!id || !name) {
    return res.status(400).json({ error: "Missing fields" });
  }

  characters[id] = {
    name,
    system: system || "You are helpful",
    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`
  };

  res.json({ success: true });
});

app.post("/chat", async (req, res) => {
  const { message, characterId } = req.body;
  const character = characters[characterId];

  if (!character) {
    return res.json({ reply: "Character not found" });
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: character.system },
            { role: "user", content: message }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();
    res.json({
      reply: data?.choices?.[0]?.message?.content || "error"
    });
  } catch (err) {
    res.status(500).json({ error: "API Error" });
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
