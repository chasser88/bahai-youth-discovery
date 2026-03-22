import { useState, useEffect } from "react";

// jsPDF loaded from CDN via index.html -- available as window.jspdf.jsPDF

const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;

const QUESTIONS = [
  {
    id: "q1", section: "Your World",
    question: "When you have a completely free Saturday with no obligations, what do you find yourself doing?",
    type: "text", placeholder: "e.g. I end up drawing, watching tutorials, helping neighbors, playing music...",
    hint: "Be honest -- no right answer here."
  },
  {
    id: "q2", section: "Your World",
    question: "Which of these best describes how you feel about your current daily life?",
    type: "single",
    options: ["I feel stuck and don't know where to start", "I have ideas but don't know how to act on them", "I'm already doing things but need direction", "I'm moving forward but want to accelerate"]
  },
  {
    id: "q3", section: "Your World",
    question: "If someone gave you $500 right now with no strings attached, what would you do with it?",
    type: "text", placeholder: "Be real -- buy something, invest it, start something?",
    hint: "This reveals your mindset more than you think."
  },
  {
    id: "q4", section: "How You Think",
    question: "When you face a problem, which approach do you naturally take?",
    type: "single",
    options: ["I research everything before starting", "I jump in and figure it out as I go", "I ask someone who's done it before", "I think about it deeply before deciding"]
  },
  {
    id: "q5", section: "How You Think",
    question: "What kinds of topics could you talk about for hours without getting bored?",
    type: "multi",
    options: ["Technology & Gadgets", "Art & Design", "Business & Money", "Health & Wellness", "Education & Teaching", "Social Media & Content", "Nature & Environment", "Fashion & Style", "Music & Performance", "Food & Cooking", "Spirituality & Community", "Sports & Fitness", "Writing & Storytelling", "Science & Research", "Helping People"]
  },
  {
    id: "q6", section: "How You Think",
    question: "Pick the sentence that sounds most like something YOU would say:",
    type: "single",
    options: ["I love making things -- whether with my hands or on a screen", "I love connecting people and making things happen socially", "I love analyzing, understanding systems and patterns", "I love performing, speaking, or expressing myself"]
  },
  {
    id: "q7", section: "Your People",
    question: "Think of someone you deeply admire. What about them inspires you most?",
    type: "text", placeholder: "e.g. My uncle built a business from nothing. I admire his persistence...",
    hint: "What you admire often mirrors what you want to become."
  },
  {
    id: "q8", section: "Your People",
    question: "How do people around you usually describe you?",
    type: "multi",
    options: ["Creative", "Reliable", "Funny", "Smart", "Leader", "Listener", "Problem-solver", "Energetic", "Calm", "Ambitious", "Caring", "Quiet but deep"]
  },
  {
    id: "q9", section: "Your Skills",
    question: "Which of these have you ever done, even once -- even casually?",
    type: "multi",
    options: ["Taught or tutored someone", "Sold something (anything)", "Made or edited a video", "Designed something digitally", "Coded or built a website", "Written something people read", "Fixed something broken", "Led a group or event", "Cooked/baked for others", "Made something with your hands", "Managed money or a budget", "Performed on stage"]
  },
  {
    id: "q10", section: "Your Skills",
    question: "What's the ONE thing you believe you're genuinely better at than most people your age?",
    type: "text", placeholder: "Don't be modest. What do people come to you for?",
    hint: "Even if it seems small, it matters."
  },
  {
    id: "q11", section: "Your Challenges",
    question: "What's the biggest thing currently holding you back?",
    type: "single",
    options: ["I don't have money or resources to start", "I don't have the right skills yet", "I don't know what I want to do", "I'm afraid of failing or what people will think", "I lack support from family or community", "I have too many ideas and can't pick one"]
  },
  {
    id: "q12", section: "Your Challenges",
    question: "How do you respond when something you worked hard on doesn't go well?",
    type: "single",
    options: ["I feel down but bounce back fairly quickly", "I analyze what went wrong and adjust", "I give up and try something different", "I tend to avoid trying again for a while"]
  },
  {
    id: "q13", section: "Your Future",
    question: "Imagine your life 3 years from now if everything goes well. Describe what a typical Tuesday looks like.",
    type: "text", placeholder: "Where are you? What are you doing? Who's around you? How do you feel?",
    hint: "Dream big -- this shapes your roadmap."
  },
  {
    id: "q14", section: "Your Future",
    question: "How urgently do you need to start generating income?",
    type: "single",
    options: ["Within 1-3 months (urgent)", "Within 6 months (moderate)", "Within a year (I have some runway)", "I'm learning for the future (no pressure)"]
  },
  {
    id: "q15", section: "Your Future",
    question: "Which of these best matches your vision of success?",
    type: "multi",
    options: ["Financial independence", "Helping my community", "Creative freedom", "Building something that lasts", "Spiritual contribution", "Recognition & impact", "Family stability", "Global reach"]
  },
  {
    id: "q16", section: "Learning Style",
    question: "How do you best absorb new information?",
    type: "single",
    options: ["Watching videos and seeing things demonstrated", "Reading books, articles, or guides", "Doing it hands-on, learning by trial", "Discussing and learning from mentors or peers"]
  },
  {
    id: "q17", section: "Learning Style",
    question: "How many hours per week can you realistically dedicate to learning and building something new?",
    type: "single",
    options: ["Less than 5 hours", "5-10 hours", "10-20 hours", "More than 20 hours"]
  },
  {
    id: "q18", section: "Your Spirit",
    question: "How does being a Bahá'í shape what you want to do or become?",
    type: "text", placeholder: "e.g. I want my work to serve humanity. I want to build something honest...",
    hint: "Your values are your greatest compass."
  },
  {
    id: "q19", section: "Your Environment",
    question: "Where are you based, and what does your immediate environment look like?",
    type: "location",
    placeholder: "e.g. Nairobi, Kenya / Lagos, Nigeria / London, UK...",
    hint: "Your location and resources shape your starting point -- not your ceiling.",
    accessOptions: [
      "📱 Smartphone", "💻 Laptop or PC", "🌐 Reliable internet",
      "📚 Library or learning centre", "🤝 Supportive community space", "⚡ Consistent electricity"
    ]
  }
];

const SECTION_COLORS = {
  "Your World": "#E8935A", "How You Think": "#6B9ED4", "Your People": "#8FBF8A",
  "Your Skills": "#C47DB5", "Your Challenges": "#D4796B", "Your Future": "#F0C050",
  "Learning Style": "#6BBFBF", "Your Spirit": "#A08FD4", "Your Environment": "#5BB8A0"
};

async function saveToAirtable(name, answers, result) {
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) return;
  const formattedAnswers = QUESTIONS.map(q => {
    const ans = answers[q.id];
    let formatted = "--";
    if (ans) {
      if (q.type === "location") {
        formatted = `${ans.country || "--"}${ans.access?.length ? ` | Has: ${ans.access.join(", ")}` : ""}`;
      } else {
        formatted = Array.isArray(ans) ? ans.join(", ") : ans;
      }
    }
    return `${q.question}\n→ ${formatted}`;
  }).join("\n\n");

  const locationAnswer = answers["q19"];
  const locationStr = locationAnswer
    ? `${locationAnswer.country || "--"}${locationAnswer.access?.length ? ` (${locationAnswer.access.join(", ")})` : ""}`
    : "--";

  try {
    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Responses`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          Name: name,
          "Submitted At": new Date().toISOString().split("T")[0],
          Answers: formattedAnswers,
          "Location & Access": locationStr,
          "Identity Title": result?.core_identity?.title || "",
          "Primary Path": result?.primary_path?.title || "",
          "Immediate Win": result?.immediate_win || "",
          "Full Roadmap": JSON.stringify(result, null, 2)
        }
      })
    });
  } catch (err) {
    console.error("Airtable save error:", err);
  }
}

export default function App() {
  const [phase, setPhase] = useState("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loadingDots, setLoadingDots] = useState("");
  const [fadeIn, setFadeIn] = useState(true);
  const [userName, setUserName] = useState("");
  const [saved, setSaved] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (phase === "loading") {
      const dots = setInterval(() => setLoadingDots(d => d.length >= 3 ? "" : d + "."), 500);
      analyzeAnswers();
      return () => clearInterval(dots);
    }
  }, [phase]);

  useEffect(() => {
    setFadeIn(false);
    const t = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(t);
  }, [currentQ]);

  const q = QUESTIONS[currentQ];
  const progress = (currentQ / QUESTIONS.length) * 100;
  const sectionColor = SECTION_COLORS[q?.section] || "#E8935A";

  function handleAnswer(value) { setAnswers(p => ({ ...p, [q.id]: value })); }
  function handleMultiToggle(opt) {
    const prev = answers[q.id] || [];
    setAnswers(p => ({ ...p, [q.id]: prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt] }));
  }
  function canProceed() {
    const ans = answers[q?.id];
    if (!ans) return false;
    if (q?.type === "location") return ans.country && ans.country.trim().length > 0;
    return typeof ans === "string" ? ans.trim().length > 0 : ans.length > 0;
  }
  function goNext() { currentQ < QUESTIONS.length - 1 ? setCurrentQ(n => n + 1) : setPhase("loading"); }
  function goPrev() { if (currentQ > 0) setCurrentQ(n => n - 1); }

  async function analyzeAnswers() {
    const formatted = QUESTIONS.map(q => {
      const ans = answers[q.id];
      let answerStr = "Not answered";
      if (ans) {
        if (q.type === "location") {
          answerStr = `Based in: ${ans.country || "--"}. Has access to: ${ans.access?.length ? ans.access.join(", ") : "Nothing selected"}`;
        } else {
          answerStr = Array.isArray(ans) ? ans.join(", ") : ans;
        }
      }
      return { question: q.question, answer: answerStr };
    });

    const locationAnswer = answers["q19"];
    const locationContext = locationAnswer
      ? `The youth is based in ${locationAnswer.country || "an unspecified location"} and has access to: ${locationAnswer.access?.length ? locationAnswer.access.join(", ") : "limited resources"}.`
      : "";

    const prompt = `You are an expert youth development coach with deep knowledge of entrepreneurship and Bahá'í principles of service. A Bahá'í youth named ${userName} has completed a discovery questionnaire.

${locationContext ? `IMPORTANT CONTEXT: ${locationContext} Tailor ALL recommendations, tools, and resources to be realistic and accessible given their location and available resources. If they lack a laptop, suggest mobile-first tools. If internet is unreliable, suggest offline-friendly options. If they're in a developing economy, recommend income opportunities relevant to their local market as well as global remote opportunities.` : ""}

Responses:
${formatted.map((a, i) => `Q${i + 1}: ${a.question}\nAnswer: ${a.answer}`).join("\n\n")}

Return ONLY a JSON object (no markdown, no backticks) with this exact structure:
{
  "name_greeting": "warm personalized opening sentence using their name",
  "core_identity": {"title": "Their archetype e.g. The Creative Builder", "description": "2-3 sentences about who they truly are"},
  "top_interests": ["Interest 1", "Interest 2", "Interest 3"],
  "hidden_strength": "one surprising strength noticed in their answers",
  "primary_path": {"title": "Path title e.g. Freelance Designer → Studio Owner", "why": "why this fits them specifically, referencing their location and access where relevant", "income_timeline": "realistic timeline"},
  "alternative_path": {"title": "Alternative path title", "why": "why also worth considering"},
  "90_day_plan": [
    {"week": "Week 1-2", "focus": "Focus area", "action": "Specific action", "resource": "Free tool or resource accessible given their setup"},
    {"week": "Week 3-4", "focus": "Focus area", "action": "Specific action", "resource": "Free tool or resource"},
    {"week": "Month 2", "focus": "Focus area", "action": "Specific action", "resource": "Free tool or resource"},
    {"week": "Month 3", "focus": "Focus area", "action": "Specific action", "resource": "Free tool or resource"}
  ],
  "skill_gaps": ["Gap 1", "Gap 2", "Gap 3"],
  "immediate_win": "one thing they can do THIS WEEK with the resources they actually have",
  "bahai_connection": "how their path connects to Bahá'í principles of service and civilization-building",
  "affirmation": "powerful personalized closing affirmation"
}`;

    try {
      // Call our secure Vercel backend proxy instead of Anthropic directly
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        const errData = await res.json();
        setResult({ error: true, message: errData?.error || `Server error: ${res.status}` });
        setPhase("result");
        return;
      }

      const parsed = await res.json();

      if (!parsed || typeof parsed !== "object") {
        setResult({ error: true, message: "Invalid response from server. Please try again." });
        setPhase("result");
        return;
      }

      setResult(parsed);
      await saveToAirtable(userName, answers, parsed);
      setSaved(true);
      setPhase("result");
    } catch (err) {
      console.error("API Error:", err);
      setResult({ error: true, message: err.message || "Network error. Check your connection and try again." });
      setPhase("result");
    }
  }

  async function downloadPDF() {
    setPdfLoading(true);
    try {
    // Dynamically load jsPDF if not already loaded
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 18;
    const usable = pageW - margin * 2;
    let y = 0;

    const ORANGE = [232, 147, 90];
    const DARK = [30, 25, 22];
    const MID = [120, 110, 100];
    const LIGHT = [200, 192, 184];
    const GREEN = [143, 191, 138];
    const BLUE = [107, 158, 212];
    const PURPLE = [160, 143, 212];

    function checkPage(needed = 18) {
      if (y + needed > 270) { doc.addPage(); y = 18; }
    }

    function label(text, color = MID) {
      checkPage(10);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...color);
      doc.text(text.toUpperCase(), margin, y);
      y += 6;
    }

    function heading(text, size = 18, color = LIGHT) {
      checkPage(size * 0.6 + 6);
      doc.setFontSize(size);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, usable);
      doc.text(lines, margin, y);
      y += lines.length * (size * 0.4) + 4;
    }

    function body(text, color = LIGHT, size = 10) {
      checkPage(14);
      doc.setFontSize(size);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, usable);
      lines.forEach(line => {
        checkPage(6);
        doc.text(line, margin, y);
        y += 5.5;
      });
      y += 2;
    }

    function divider(color = [50, 45, 40]) {
      checkPage(8);
      doc.setDrawColor(...color);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
    }

    function chip(text, x, cy, color = ORANGE) {
      doc.setFillColor(...color.map(c => Math.round(c * 0.15 + 13)));
      doc.setDrawColor(...color);
      doc.setLineWidth(0.3);
      const w = text.length * 2.2 + 8;
      doc.roundedRect(x, cy - 4, w, 6, 2, 2, "FD");
      doc.setTextColor(...color);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(text, x + 4, cy);
      return w + 4;
    }

    // ── COVER ──────────────────────────────────────────
    doc.setFillColor(13, 13, 13);
    doc.rect(0, 0, 210, 297, "F");
    y = 36;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ORANGE);
    doc.text("BAHAI YOUTH EMPOWERMENT PROGRAM", margin, y);
    y += 10;

    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...LIGHT);
    doc.text("Your Personal", margin, y); y += 11;
    doc.setTextColor(...ORANGE);
    doc.text("Roadmap", margin, y); y += 16;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MID);
    const greetLines = doc.splitTextToSize(result.name_greeting, usable);
    greetLines.forEach(l => { doc.text(l, margin, y); y += 6; });
    y += 8;

    // Identity box
    doc.setFillColor(40, 32, 26);
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, usable, 36, 4, 4, "FD");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ORANGE);
    doc.text("YOUR CORE IDENTITY", margin + 6, y + 8);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...LIGHT);
    doc.text(`"${result.core_identity.title}"`, margin + 6, y + 17);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MID);
    const idLines = doc.splitTextToSize(result.core_identity.description, usable - 12);
    idLines.slice(0, 2).forEach((l, i) => doc.text(l, margin + 6, y + 24 + i * 5));
    y += 44;

    // Interests chips
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MID);
    doc.text("CORE INTERESTS", margin, y); y += 7;
    let cx = margin;
    result.top_interests.forEach(interest => {
      if (cx + interest.length * 2.2 + 12 > pageW - margin) { cx = margin; y += 9; }
      const w = chip(interest, cx, y, ORANGE);
      cx += w;
    });
    y += 14;

    // ── PAGE 2+ ────────────────────────────────────────
    doc.addPage();
    doc.setFillColor(13, 13, 13);
    doc.rect(0, 0, 210, 297, "F");
    y = 20;

    // Hidden Strength
    label("Hidden Strength We Noticed", BLUE);
    body(result.hidden_strength, LIGHT);
    divider();

    // Primary Path
    label("Recommended Path", GREEN);
    heading(result.primary_path.title, 14, LIGHT);
    body(result.primary_path.why, LIGHT);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GREEN);
    doc.text(`First income estimate: ${result.primary_path.income_timeline}`, margin, y);
    y += 10;
    divider();

    // Alternative Path
    label("Alternative Path", MID);
    heading(result.alternative_path.title, 12, LIGHT);
    body(result.alternative_path.why, MID, 9);
    divider();

    // 90 Day Plan
    label("Your 90-Day Action Plan", ORANGE);
    y += 2;
    result["90_day_plan"].forEach((step, i) => {
      checkPage(28);
      doc.setFillColor(25, 22, 18);
      doc.setDrawColor(50, 45, 40);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, usable, 24, 3, 3, "FD");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...ORANGE);
      doc.text(step.week, margin + 4, y + 7);
      doc.setTextColor(...MID);
      doc.setFontSize(7.5);
      doc.text(step.focus.toUpperCase(), margin + 4, y + 13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...LIGHT);
      doc.setFontSize(9);
      const actionLines = doc.splitTextToSize(step.action, usable - 55);
      actionLines.slice(0, 2).forEach((l, li) => doc.text(l, margin + 52, y + 7 + li * 5));
      doc.setTextColor(107, 158, 212);
      doc.setFontSize(8);
      doc.text(`→ ${step.resource}`, margin + 52, y + 18);
      y += 27;
    });
    y += 4;
    divider();

    // Skill Gaps
    label("Skills to Develop", [212, 121, 107]);
    let sx = margin;
    result.skill_gaps.forEach(gap => {
      if (sx + gap.length * 2.2 + 12 > pageW - margin) { sx = margin; y += 9; }
      const w = chip(gap, sx, y, [212, 121, 107]);
      sx += w;
    });
    y += 14;
    divider();

    // Immediate Win
    checkPage(24);
    doc.setFillColor(20, 35, 25);
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, usable, 22, 3, 3, "FD");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GREEN);
    doc.text("DO THIS THIS WEEK", margin + 4, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...LIGHT);
    doc.setFontSize(9);
    const winLines = doc.splitTextToSize(result.immediate_win, usable - 8);
    winLines.slice(0, 2).forEach((l, i) => doc.text(l, margin + 4, y + 13 + i * 5));
    y += 28;
    divider();

    // Spiritual Compass
    checkPage(30);
    doc.setFillColor(28, 24, 40);
    doc.setDrawColor(...PURPLE);
    doc.setLineWidth(0.4);
    const scLines = doc.splitTextToSize(result.bahai_connection, usable - 10);
    const scH = Math.min(scLines.length, 4) * 5.5 + 18;
    doc.roundedRect(margin, y, usable, scH, 3, 3, "FD");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PURPLE);
    doc.text("YOUR SPIRITUAL COMPASS", margin + 4, y + 7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...MID);
    doc.setFontSize(9);
    scLines.slice(0, 4).forEach((l, i) => doc.text(l, margin + 4, y + 13 + i * 5.5));
    y += scH + 8;

    // Affirmation
    checkPage(24);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bolditalic");
    doc.setTextColor(...ORANGE);
    const affLines = doc.splitTextToSize(result.affirmation, usable);
    affLines.forEach(l => { checkPage(8); doc.text(l, margin, y); y += 6.5; });
    y += 6;

    // Quote
    checkPage(22);
    doc.setDrawColor(...GREEN.map(c => Math.round(c * 0.4)));
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin, y + 16);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(90, 106, 88);
    const q3Lines = doc.splitTextToSize(
      '"The earth is but one country, and mankind its citizens. - Bahá u lláh"',
      usable - 8
    );
    q3Lines.forEach(l => { doc.text(l, margin + 6, y + 5); y += 6; });
    y += 8;

    // Footer
    checkPage(12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 55, 50);
    doc.text(`Generated by BYEP · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, margin, y);

      doc.save(`BYEP-Roadmap-${userName || "Youth"}.pdf`);
    } catch(e) {
      alert("PDF generation failed. Please try again.");
      console.error(e);
    } finally {
      setPdfLoading(false);
    }
  }

  const btnStyle = (active, color = "#E8935A") => ({
    background: active ? color : "rgba(255,255,255,0.05)",
    border: `1.5px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
    borderRadius: 10, padding: "15px 20px",
    textAlign: "left", color: active ? "#0D0D0D" : "#A0988F",
    fontSize: 15, cursor: "pointer", fontFamily: "'Georgia', serif",
    transition: "all 0.2s", width: "100%"
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", fontFamily: "'Georgia', serif", color: "#F0EDE8", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(232,147,90,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(107,158,212,0.05) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>

        {/* INTRO */}
        {phase === "intro" && (
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, letterSpacing: 6, color: "#E8935A", marginBottom: 28, textTransform: "uppercase" }}>Bahá'í Youth Initiative</div>
              <h1 style={{ fontSize: "clamp(36px, 8vw, 64px)", fontWeight: 400, lineHeight: 1.1, marginBottom: 24, color: "#F0EDE8" }}>
                Discover Your<br /><span style={{ color: "#E8935A", fontStyle: "italic" }}>True Path</span>
              </h1>
              <p style={{ fontSize: 17, lineHeight: 1.8, color: "#B8B0A8", maxWidth: 500, margin: "0 auto 40px" }}>
                Answer 19 thoughtfully crafted questions and receive a deeply personalized roadmap to unlock your gifts, build real skills, and start creating value for yourself and your community.
              </p>

              {/* Quote 1 -- The Call */}
              <div style={{ maxWidth: 480, margin: "0 auto 44px", padding: "24px 28px", borderLeft: "2px solid rgba(232,147,90,0.4)", textAlign: "left" }}>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "#8A8078", fontStyle: "italic", margin: "0 0 10px" }}>
                  "Be anxiously concerned with the needs of the age ye live in, and center your deliberations on its exigencies and requirements."
                </p>
                <span style={{ fontSize: 11, letterSpacing: 3, color: "#5A5450", textTransform: "uppercase" }}>-- Bahá'u'lláh</span>
              </div>

              <input
                type="text" placeholder="What's your first name?"
                value={userName} onChange={e => setUserName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && userName.trim() && setPhase("questionnaire")}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,147,90,0.4)", borderRadius: 8, padding: "16px 24px", fontSize: 17, color: "#F0EDE8", width: "100%", maxWidth: 300, outline: "none", textAlign: "center", fontFamily: "'Georgia', serif", marginBottom: 24, boxSizing: "border-box" }}
              />
              <br />
              <button onClick={() => userName.trim() && setPhase("questionnaire")} disabled={!userName.trim()}
                style={{ background: userName.trim() ? "#E8935A" : "rgba(232,147,90,0.2)", color: "#0D0D0D", border: "none", borderRadius: 8, padding: "17px 44px", fontSize: 15, fontWeight: 700, cursor: userName.trim() ? "pointer" : "not-allowed", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Georgia', serif", transition: "all 0.3s" }}>
                Begin My Discovery →
              </button>
              <div style={{ marginTop: 40, display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
                {["19 Questions", "~14 Minutes", "AI-Powered Roadmap", "Free & Private"].map(item => (
                  <div key={item} style={{ fontSize: 12, color: "#4A4440" }}>• {item}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QUESTIONNAIRE */}
        {phase === "questionnaire" && (
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 0" }}>
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 12 }}>
                <span style={{ color: sectionColor, letterSpacing: 3, textTransform: "uppercase", fontSize: 10 }}>{q.section}</span>
                <span style={{ color: "#4A4440" }}>{currentQ + 1} / {QUESTIONS.length}</span>
              </div>
              <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                <div style={{ height: "100%", borderRadius: 2, background: sectionColor, width: `${progress}%`, transition: "width 0.5s ease, background 0.5s" }} />
              </div>
            </div>

            <div style={{ opacity: fadeIn ? 1 : 0, transform: fadeIn ? "translateY(0)" : "translateY(10px)", transition: "all 0.35s ease" }}>
              <div style={{ fontSize: 12, color: "#4A4440", marginBottom: 16 }}>Question {currentQ + 1}</div>
              <h2 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 400, lineHeight: 1.4, marginBottom: q.hint ? 10 : 28, color: "#F0EDE8" }}>{q.question}</h2>
              {q.hint && <p style={{ fontSize: 13, color: "#5A5450", marginBottom: 28, fontStyle: "italic" }}>{q.hint}</p>}

              {q.type === "text" && (
                <textarea value={answers[q.id] || ""} onChange={e => handleAnswer(e.target.value)} placeholder={q.placeholder} rows={4}
                  style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "16px 18px", fontSize: 16, color: "#F0EDE8", resize: "vertical", outline: "none", fontFamily: "'Georgia', serif", lineHeight: 1.7, boxSizing: "border-box" }} />
              )}

              {q.type === "single" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {q.options.map(opt => {
                    const sel = answers[q.id] === opt;
                    return (
                      <button key={opt} onClick={() => handleAnswer(opt)} style={btnStyle(sel, sectionColor)}>
                        <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%", border: `2px solid ${sel ? sectionColor : "#3A3430"}`, marginRight: 12, verticalAlign: "middle", background: sel ? sectionColor : "transparent", transition: "all 0.2s" }} />
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === "multi" && (
                <div>
                  <p style={{ fontSize: 12, color: "#5A5450", marginBottom: 14 }}>Select all that apply</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {q.options.map(opt => {
                      const sel = (answers[q.id] || []).includes(opt);
                      return (
                        <button key={opt} onClick={() => handleMultiToggle(opt)}
                          style={{ background: sel ? `rgba(232,147,90,0.12)` : "rgba(255,255,255,0.03)", border: `1.5px solid ${sel ? sectionColor : "rgba(255,255,255,0.08)"}`, borderRadius: 50, padding: "9px 16px", color: sel ? "#F0EDE8" : "#8A8078", fontSize: 13, cursor: "pointer", fontFamily: "'Georgia', serif", transition: "all 0.2s" }}>
                          {sel ? "✓ " : ""}{opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {q.type === "location" && (
                <div>
                  <input
                    type="text"
                    placeholder={q.placeholder}
                    value={answers[q.id]?.country || ""}
                    onChange={e => setAnswers(p => ({ ...p, [q.id]: { ...p[q.id], country: e.target.value } }))}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "16px 18px", fontSize: 16, color: "#F0EDE8", outline: "none", fontFamily: "'Georgia', serif", marginBottom: 24, boxSizing: "border-box" }}
                  />
                  <p style={{ fontSize: 12, color: "#5A5450", marginBottom: 14 }}>What do you currently have access to? <span style={{ color: "#3A3430" }}>(select all that apply)</span></p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {q.accessOptions.map(opt => {
                      const sel = (answers[q.id]?.access || []).includes(opt);
                      return (
                        <button key={opt} onClick={() => {
                          const prev = answers[q.id]?.access || [];
                          const updated = prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt];
                          setAnswers(p => ({ ...p, [q.id]: { ...p[q.id], access: updated } }));
                        }}
                          style={{ background: sel ? "rgba(91,184,160,0.12)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${sel ? "#5BB8A0" : "rgba(255,255,255,0.08)"}`, borderRadius: 50, padding: "9px 16px", color: sel ? "#F0EDE8" : "#8A8078", fontSize: 13, cursor: "pointer", fontFamily: "'Georgia', serif", transition: "all 0.2s" }}>
                          {sel ? "✓ " : ""}{opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 44, alignItems: "center" }}>
              <button onClick={goPrev} disabled={currentQ === 0}
                style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "12px 22px", color: currentQ === 0 ? "#2A2420" : "#8A8078", cursor: currentQ === 0 ? "not-allowed" : "pointer", fontSize: 14, fontFamily: "'Georgia', serif" }}>
                ← Back
              </button>
              <button onClick={goNext} disabled={!canProceed()}
                style={{ background: canProceed() ? sectionColor : "rgba(255,255,255,0.04)", border: "none", borderRadius: 8, padding: "14px 34px", color: canProceed() ? "#0D0D0D" : "#3A3430", cursor: canProceed() ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 700, fontFamily: "'Georgia', serif", letterSpacing: 1, transition: "all 0.3s" }}>
                {currentQ === QUESTIONS.length - 1 ? "Generate My Roadmap →" : "Next →"}
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {phase === "loading" && (
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ width: 72, height: 72, borderRadius: "50%", border: "2px solid rgba(232,147,90,0.15)", borderTop: "2px solid #E8935A", animation: "spin 1.2s linear infinite", marginBottom: 36 }} />
            <h2 style={{ fontSize: 26, fontWeight: 400, marginBottom: 14, color: "#F0EDE8" }}>Crafting your roadmap{loadingDots}</h2>
            <p style={{ fontSize: 15, color: "#5A5450", maxWidth: 360, marginBottom: 48 }}>Your answers are being woven into a personalized guide built just for you.</p>
            {/* Quote 2 -- Unlocking the Talisman */}
            <div style={{ maxWidth: 420, padding: "24px 28px", borderLeft: "2px solid rgba(160,143,212,0.4)", textAlign: "left" }}>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: "#6A6260", fontStyle: "italic", margin: "0 0 10px" }}>
                "Man is the supreme Talisman. Lack of a proper education hath, however, deprived him of that which he doth inherently possess."
              </p>
              <span style={{ fontSize: 11, letterSpacing: 3, color: "#4A4450", textTransform: "uppercase" }}>-- Bahá'u'lláh</span>
            </div>
          </div>
        )}

        {/* RESULT */}
        {phase === "result" && result && !result.error && (
          <div style={{ padding: "60px 0" }}>
            {saved && (
              <div style={{ background: "rgba(143,191,138,0.1)", border: "1px solid rgba(143,191,138,0.25)", borderRadius: 8, padding: "10px 20px", marginBottom: 40, fontSize: 13, color: "#8FBF8A", textAlign: "center" }}>
                ✓ Your responses have been saved
              </div>
            )}

            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontSize: 11, letterSpacing: 5, color: "#E8935A", marginBottom: 20, textTransform: "uppercase" }}>Your Personal Roadmap</div>
              <p style={{ fontSize: 19, lineHeight: 1.8, color: "#C8C0B8", maxWidth: 540, margin: "0 auto" }}>{result.name_greeting}</p>
            </div>

            {/* Identity */}
            <div style={{ background: "linear-gradient(135deg, rgba(232,147,90,0.09), rgba(160,143,212,0.07))", border: "1px solid rgba(232,147,90,0.2)", borderRadius: 16, padding: "36px 36px", marginBottom: 24, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: 5, color: "#E8935A", marginBottom: 14, textTransform: "uppercase" }}>Your Core Identity</div>
              <h2 style={{ fontSize: 30, fontWeight: 400, color: "#F0EDE8", marginBottom: 14, fontStyle: "italic" }}>"{result.core_identity.title}"</h2>
              <p style={{ fontSize: 16, color: "#B8B0A8", lineHeight: 1.7, margin: 0 }}>{result.core_identity.description}</p>
            </div>

            {/* Hidden Strength */}
            <div style={{ background: "rgba(107,158,212,0.07)", border: "1px solid rgba(107,158,212,0.18)", borderRadius: 12, padding: "22px 30px", marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: 5, color: "#6B9ED4", marginBottom: 10, textTransform: "uppercase" }}>Hidden Strength We Noticed</div>
              <p style={{ fontSize: 15, color: "#C8C0B8", lineHeight: 1.7, margin: 0 }}>{result.hidden_strength}</p>
            </div>

            {/* Interests */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#5A5450", marginBottom: 14, textTransform: "uppercase" }}>Your Core Interests</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.top_interests.map(i => (
                  <span key={i} style={{ background: "rgba(232,147,90,0.08)", border: "1px solid rgba(232,147,90,0.25)", borderRadius: 50, padding: "7px 18px", fontSize: 13, color: "#E8935A" }}>{i}</span>
                ))}
              </div>
            </div>

            {/* Primary Path */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "32px 36px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#8FBF8A", marginBottom: 14, textTransform: "uppercase" }}>Recommended Path</div>
              <h3 style={{ fontSize: 22, fontWeight: 400, color: "#F0EDE8", marginBottom: 14 }}>{result.primary_path.title}</h3>
              <p style={{ fontSize: 15, color: "#B8B0A8", lineHeight: 1.7, marginBottom: 16 }}>{result.primary_path.why}</p>
              <div style={{ fontSize: 13, color: "#8FBF8A" }}>⏱ First income estimate: {result.primary_path.income_timeline}</div>
            </div>

            {/* Alt Path */}
            <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "22px 28px", marginBottom: 44 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#4A4440", marginBottom: 10, textTransform: "uppercase" }}>Alternative Path</div>
              <h4 style={{ fontSize: 17, fontWeight: 400, color: "#C8C0B8", marginBottom: 8 }}>{result.alternative_path.title}</h4>
              <p style={{ fontSize: 14, color: "#7A7068", lineHeight: 1.6, margin: 0 }}>{result.alternative_path.why}</p>
            </div>

            {/* 90 Day Plan */}
            <div style={{ marginBottom: 44 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#5A5450", marginBottom: 20, textTransform: "uppercase" }}>Your 90-Day Action Plan</div>
              {result["90_day_plan"].map((step, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "22px 26px", marginBottom: 10, alignItems: "start" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#E8935A", fontWeight: 700, marginBottom: 4 }}>{step.week}</div>
                    <div style={{ fontSize: 12, color: "#5A5450" }}>{step.focus}</div>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, color: "#C8C0B8", lineHeight: 1.6, margin: "0 0 8px" }}>{step.action}</p>
                    <div style={{ fontSize: 12, color: "#6B9ED4" }}>→ {step.resource}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Skill Gaps */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#5A5450", marginBottom: 14, textTransform: "uppercase" }}>Skills to Develop</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.skill_gaps.map(g => (
                  <span key={g} style={{ background: "rgba(212,121,107,0.07)", border: "1px solid rgba(212,121,107,0.2)", borderRadius: 50, padding: "7px 16px", fontSize: 13, color: "#D4796B" }}>{g}</span>
                ))}
              </div>
            </div>

            {/* Immediate Win */}
            <div style={{ background: "linear-gradient(135deg, rgba(143,191,138,0.09), rgba(107,191,191,0.07))", border: "1px solid rgba(143,191,138,0.25)", borderRadius: 12, padding: "26px 32px", marginBottom: 32 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#8FBF8A", marginBottom: 10, textTransform: "uppercase" }}>Do This This Week</div>
              <p style={{ fontSize: 16, color: "#C8C0B8", lineHeight: 1.7, margin: 0 }}>{result.immediate_win}</p>
            </div>

            {/* Bahá'í Connection */}
            <div style={{ background: "rgba(160,143,212,0.07)", border: "1px solid rgba(160,143,212,0.18)", borderRadius: 12, padding: "26px 32px", marginBottom: 44 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#A08FD4", marginBottom: 10, textTransform: "uppercase" }}>Your Spiritual Compass</div>
              <p style={{ fontSize: 15, color: "#C8C0B8", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{result.bahai_connection}</p>
            </div>

            {/* Affirmation */}
            <div style={{ textAlign: "center", padding: "44px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: "clamp(17px, 3vw, 22px)", color: "#E8935A", lineHeight: 1.8, fontStyle: "italic", maxWidth: 520, margin: "0 auto 36px" }}>"{result.affirmation}"</p>

              {/* Quote 3 -- Go Serve the World */}
              <div style={{ maxWidth: 460, margin: "0 auto 40px", padding: "24px 28px", borderLeft: "2px solid rgba(143,191,138,0.35)", textAlign: "left" }}>
                <p style={{ fontSize: 14, lineHeight: 1.9, color: "#6A7A68", fontStyle: "italic", margin: "0 0 10px" }}>
                  "It is not for him to pride himself who loveth his own country, but rather for him who loveth the whole world. The earth is but one country, and mankind its citizens."
                </p>
                <span style={{ fontSize: 11, letterSpacing: 3, color: "#4A5A48", textTransform: "uppercase" }}>-- Bahá'u'lláh</span>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={downloadPDF} disabled={pdfLoading}
                  style={{ background: pdfLoading ? "rgba(232,147,90,0.5)" : "#E8935A", border: "none", borderRadius: 8, padding: "14px 32px", color: "#0D0D0D", cursor: pdfLoading ? "wait" : "pointer", fontSize: 15, fontWeight: 700, fontFamily: "'Georgia', serif", letterSpacing: 1, transition: "all 0.3s" }}>
                  {pdfLoading ? "Preparing PDF..." : "↓ Download My Roadmap (PDF)"}
                </button>
                <button onClick={() => { setPhase("intro"); setAnswers({}); setCurrentQ(0); setResult(null); setUserName(""); setSaved(false); }}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "14px 26px", color: "#5A5450", cursor: "pointer", fontSize: 13, fontFamily: "'Georgia', serif" }}>
                  Start Over
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "result" && result?.error && (
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ maxWidth: 480 }}>
              <div style={{ fontSize: 32, marginBottom: 20 }}>⚠️</div>
              <h3 style={{ color: "#D4796B", fontSize: 20, fontWeight: 400, marginBottom: 16 }}>Roadmap generation failed</h3>
              <div style={{ background: "rgba(212,121,107,0.08)", border: "1px solid rgba(212,121,107,0.25)", borderRadius: 10, padding: "16px 20px", marginBottom: 24, textAlign: "left" }}>
                <p style={{ fontSize: 13, color: "#D4796B", margin: 0, fontFamily: "monospace", lineHeight: 1.6 }}>
                  {result.message || "Unknown error"}
                </p>
              </div>
              <p style={{ fontSize: 14, color: "#6B6460", marginBottom: 28, lineHeight: 1.7 }}>
                Common fixes: check your Anthropic API key is correct in Vercel, ensure billing is active at console.anthropic.com, then redeploy.
              </p>
              <button onClick={() => setPhase("loading")} style={{ background: "#E8935A", border: "none", borderRadius: 8, padding: "13px 30px", color: "#0D0D0D", cursor: "pointer", fontSize: 14, fontFamily: "'Georgia', serif", marginRight: 12 }}>Try Again</button>
              <button onClick={() => { setPhase("intro"); setAnswers({}); setCurrentQ(0); setResult(null); setUserName(""); setSaved(false); }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "13px 24px", color: "#6B6460", cursor: "pointer", fontSize: 14, fontFamily: "'Georgia', serif" }}>Start Over</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
