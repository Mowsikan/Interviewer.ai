let mockQuestions = [
  "Can you walk me through your most recent project and your role in it?",
  "How do you approach debugging complex issues in a full-stack app?",
  "What is your experience with cloud deployment platforms like AWS or Azure?",
  "How do you manage state in large-scale React applications?",
  "Explain how you’ve worked in an Agile or Scrum environment.",
  "Tell me about a time you optimized performance in a backend system.",
  "What makes you a strong candidate for a software engineering role?"
];
let currentQuestionIndex = 0;

async function handleResume() {
  const fileInput = document.getElementById('resumeInput');
  const file = fileInput.files[0];
  const status = document.getElementById('status');

  if (!file) {
    status.innerText = "Please upload a resume.";
    return;
  }

  if (file.type !== "application/pdf") {
    status.innerText = "Only PDF files are supported.";
    return;
  }

  status.innerText = "Reading your resume...";

  const reader = new FileReader();

  reader.onload = async function () {
    const typedarray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;

    let resumeText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      resumeText += strings.join(" ") + "\n";
    }

    console.log("Extracted Resume Text:\n", resumeText);
    status.innerText = "Resume parsed successfully ✅";

    await generateQuestions(resumeText);
  };

  reader.readAsArrayBuffer(file);
}

async function generateQuestions(resumeText) {
  const container = document.getElementById("questionsContainer");
  const status = document.getElementById("status");
  status.innerText = "Generating questions with AI...";

  try {
    const response = await fetch("https://interviewer-ai-u43y.onrender.com/api/generate-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ resumeText: resumeText })
    });

    const data = await response.json();
    const questions = data.questions || [];

    displayQuestions(questions);
    status.innerText = "✅ AI questions generated successfully!";
  } catch (e) {
    console.error("AI generation failed:", e);
    status.innerText = "❌ Failed to generate questions. Please try again.";
  }
}

function displayQuestions(questions) {
  const container = document.getElementById("questionsContainer");
  container.innerHTML = "";

  questions.forEach((q, index) => {
    const card = document.createElement("div");
    card.className = "bg-white shadow-md rounded p-4 mb-6";

    const question = document.createElement("p");
    question.className = "text-gray-800 font-semibold";
    question.textContent = `${index + 1}. ${q}`;

    const speakBtn = document.createElement("button");
    speakBtn.textContent = "🔊 Play Voice";
    speakBtn.className = "bg-blue-500 text-white px-3 py-1 mt-2 rounded hover:bg-blue-600";
    speakBtn.onclick = () => speakQuestion(q);

    const textarea = document.createElement("textarea");
    textarea.className = "w-full p-2 mt-4 border border-gray-300 rounded";
    textarea.placeholder = "Type your answer here...";

    const submitBtn = document.createElement("button");
    submitBtn.textContent = "🧠 Get AI Feedback";
    submitBtn.className = "bg-green-600 text-white px-3 py-1 mt-2 rounded hover:bg-green-700";
    submitBtn.onclick = () => getFeedback(q, textarea.value, card);

    const feedbackDiv = document.createElement("div");
    feedbackDiv.className = "mt-2 text-sm text-gray-700";
    feedbackDiv.textContent = "";

    card.appendChild(question);
    card.appendChild(speakBtn);
    card.appendChild(textarea);
    card.appendChild(submitBtn);
    card.appendChild(feedbackDiv);

    container.appendChild(card);
  });
}

function speakQuestion(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}
async function getFeedback(question, answer, container) {
  if (!answer.trim()) {
    alert("Please type your answer before requesting feedback.");
    return;
  }

  const feedbackDiv = container.querySelector("div:last-child");
  feedbackDiv.innerText = "Analyzing your answer with AI...";

  try {
    const response = await fetch("https://interviewer-ai-u43y.onrender.com/api/get-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer })
    });

    const data = await response.json();
    feedbackDiv.innerText = `🧠 Feedback: ${data.feedback}`;
  } catch (e) {
    console.error("Feedback error:", e);
    feedbackDiv.innerText = "❌ Failed to get feedback from AI.";
  }
}

async function payWithRazorpay() {
  try {
    const res = await fetch("https://interviewer-ai-u43y.onrender.com/api/create-order", { method: "POST" });
    const order = await res.json();

    const options = {
      key: "rzp_live_RbZjUu8cORJ4Pw", // replace with real test key
      amount: order.amount,
      currency: "INR",
      name: "AI Interview Coach",
      description: "Premium Access",
      order_id: order.id,
     handler: function (response) {
  // Mark user as premium (temporary logic)
  localStorage.setItem("isPremium", "true");

  alert("✅ Payment Successful! Premium access unlocked.");
  showPremiumFeatures(); // Enable UI for premium
},
      prefill: {
        name: "Your Name",
        email: "you@example.com"
      },
      theme: {
        color: "#4F46E5"
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    alert("❌ Payment failed. Try again later.");
    console.error(err);
  }
}
window.onload = function () {
  if (localStorage.getItem("isPremium") === "true") {
    showPremiumFeatures();
  }
};

function showPremiumFeatures() {
  document.getElementById("premiumSection").classList.remove("hidden");
}
function startVoiceInterview() {
  alert("🎙️ Voice interview mode starting soon... (Coming in Step 10!)");
}
function startVoiceInterview() {
  document.getElementById("voiceInterview").classList.remove("hidden");
  askNextQuestion();
}

function askNextQuestion() {
  const question = mockQuestions[currentQuestionIndex];
  document.getElementById("interviewQuestion").innerText = question;
  
  // Speak the question
  const speech = new SpeechSynthesisUtterance(question);
  speech.lang = 'en-US';
  speech.pitch = 1;
  speech.rate = 1;
  speechSynthesis.speak(speech);
}

async function submitAnswer() {
  const answer = document.getElementById("userAnswer").value.trim();
  const question = mockQuestions[currentQuestionIndex];

  if (!answer) {
    alert("Please type your answer.");
    return;
  }

  document.getElementById("aiFeedback").innerText = "Analyzing your answer...";

  // Send to backend for feedback
  try {
    const response = await fetch("https://interviewer-ai-u43y.onrender.com/api/analyze-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question, answer })
    });

    const data = await response.json();
    document.getElementById("aiFeedback").innerText = "📊 Feedback: " + data.feedback;

    // Move to next question (optional)
    currentQuestionIndex++;
    if (currentQuestionIndex < mockQuestions.length) {
      setTimeout(() => {
        document.getElementById("userAnswer").value = "";
        document.getElementById("aiFeedback").innerText = "";
        askNextQuestion();
      }, 4000);
    } else {
      document.getElementById("interviewQuestion").innerText = "✅ Interview complete!";
    }

  } catch (e) {
    console.error("Error getting feedback:", e);
    document.getElementById("aiFeedback").innerText = "❌ Failed to get feedback.";
  }
}
