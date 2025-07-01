const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Razorpay = require("razorpay");

const app = express();
const PORT = 5000;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.use(cors());
app.use(express.json());

app.post("/api/create-order", async (req, res) => {
  const options = {
    amount: 100, // ₹199 in paise
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("❌ Razorpay order error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.post('/api/generate-questions', async (req, res) => {
  const { resumeText } = req.body;

  if (!resumeText) {
    return res.status(400).json({ error: 'Resume text is required' });
  }

  const prompt = `You are an AI interview coach. Based on the following resume, generate 7 realistic and relevant mock interview questions tailored to the user's skills, experience, and technical background. Avoid generic questions. Also dont start the questions with any starter like this ->Here are 7 realistic and relevant mock interview questions for the user.(I want just a 7 questions)


Resume:
${resumeText}`;

  try {
    const palmApiKey = process.env.PALM_API_KEY;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyCdod3LzIHRnRmBDNk2z8n_rZlBo8_fHGY`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await response.json();
    console.log("🧠 Gemini 1.5 Flash Response:", JSON.stringify(data, null, 2));

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const questions = aiText
      .split('\n')
      .map(q => q.replace(/^\d+[\.\)]?\s*/, "").trim())
      .filter(q => q.length > 0);

    res.json({ questions });
  } catch (error) {
    console.error('❌ AI generation error:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

app.post('/api/get-feedback', async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Both question and answer are required.' });
  }

  const prompt = `You are a senior interview coach. A candidate was asked the following question:\n"${question}"\n\nTheir answer:\n"${answer}"\n\nGive constructive feedback, pointing out strengths, weaknesses, and suggestions for improvement.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.PALM_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ feedback: aiText });
  } catch (err) {
    console.error("❌ Feedback AI error:", err);
    res.status(500).json({ error: "Failed to get feedback." });
  }
});

app.post('/api/analyze-answer', async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer required' });
  }

  const prompt = `You are an AI interview coach. Analyze the candidate's response to the following interview question.

Question: ${question}

Answer: ${answer}

Give detailed feedback on the strengths and areas for improvement. Use a friendly tone.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.PALM_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await response.json();
    const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text || "No feedback generated.";

    res.json({ feedback });
  } catch (error) {
    console.error("❌ Feedback generation error:", error);
    res.status(500).json({ error: 'Failed to analyze answer' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
