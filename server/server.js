import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* =====================
   MONGODB CONNECTION
===================== */

mongoose.connect("mongodb://127.0.0.1:27017/aichat");

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  console.log("MongoDB error:", err);
});

/* =====================
   MODELS
===================== */

const Character = mongoose.model("Character", {
  id: String,
  name: String,
  system: String,
  avatar: String
});

const Chat = mongoose.model("Chat", {
  userId: String,
  characterId: String,
  messages: Array
});

/* =====================
   CHARACTERS
===================== */

app.get("/characters", async (req, res) => {

  const chars = await Character.find();

  const result = {};

  chars.forEach(c => {
    result[c.id] = {
      name: c.name,
      system: c.system,
      avatar: c.avatar
    };
  });

  res.json(result);

});

app.post("/character/create", async (req, res) => {

  const { id, name, system, avatar } = req.body;

  if (!id || !name) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const char = new Character({
    id,
    name,
    system: system || "You are helpful",
    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`
  });

  await char.save();

  res.json({ success: true });

});

/* =====================
   CHAT
===================== */

app.post("/chat", async (req, res) => {

  const { message, characterId, userId } = req.body;

  const character = await Character.findOne({ id: characterId });

  if (!character) {
    return res.json({ reply: "Character not found" });
  }

  let chat = await Chat.findOne({ userId, characterId });

  if (!chat) {
    chat = new Chat({
      userId,
      characterId,
      messages: []
    });
  }

  chat.messages.push({
    role: "user",
    content: message
  });

  try {

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: character.system },
            ...chat.messages
          ],
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content || "error";

    chat.messages.push({
      role: "assistant",
      content: reply
    });

    await chat.save();

    res.json({ reply });

  } catch (err) {

    console.log(err);

    res.status(500).json({ error: "AI request failed" });

  }

});

/* =====================
   START SERVER
===================== */

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
