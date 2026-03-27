import { useState, useEffect } from "react";

// jsPDF loaded from CDN via index.html -- available as window.jspdf.jsPDF

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
    question: "If someone gave you 1 million Naira right now with no strings attached, what would you do with it?",
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
  },
  {
    id: "q20", section: "Your Contact",
    question: "What is your WhatsApp number?",
    type: "text",
    placeholder: "e.g. +234 801 234 5678",
    hint: "So a mentor can reach you directly on WhatsApp."
  },
  {
    id: "q21", section: "Your Contact",
    question: "Would you like a mentor to support you on your journey?",
    type: "mentor",
    hint: "A mentor is a Bahá'í adult who will guide and support your journey."
  }
];

const SECTION_COLORS = {
  "Your World": "#E8935A", "How You Think": "#6B9ED4", "Your People": "#8FBF8A",
  "Your Skills": "#C47DB5", "Your Challenges": "#D4796B", "Your Future": "#F0C050",
  "Learning Style": "#6BBFBF", "Your Spirit": "#A08FD4", "Your Environment": "#5BB8A0", "Your Contact": "#7B68EE"
};

async function saveToAirtable(name, answers, result) {
  const formattedAnswers = QUESTIONS.map(q => {
    const ans = answers[q.id];
    let formatted = "--";
    if (ans) {
      if (q.type === "location") {
        formatted = (ans.country || "--") + (ans.access && ans.access.length ? " | Has: " + ans.access.join(", ") : "");
      } else {
        formatted = Array.isArray(ans) ? ans.join(", ") : ans;
      }
    }
    return q.question + "\n-> " + formatted;
  }).join("\n\n");

  const locationAnswer = answers["q19"];
  const locationStr = locationAnswer
    ? (locationAnswer.country || "--") + (locationAnswer.access && locationAnswer.access.length ? " (" + locationAnswer.access.join(", ") + ")" : "")
    : "--";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saveData: {
          Name: name,
          "Submitted At": new Date().toISOString().split("T")[0],
          Answers: formattedAnswers,
          "Location & Access": locationStr,
          "WhatsApp": answers["q20"] || "",
          "Wants Mentor": answers["q21"] ? "Yes" : "No",
          "Identity Title": result?.core_identity?.title || "",
          "Primary Path": result?.primary_path?.title || "",
          "Immediate Win": result?.immediate_win || "",
          "Full Roadmap": JSON.stringify(result, null, 2)
        }
      })
    });
    const data = await res.json();
    if (!data.saved) {
      console.error("Airtable save failed:", data.error);
    }
  } catch (err) {
    console.error("Airtable save error:", err.message);
  }
}


// 9-pointed Baha'i star — crisp stroke outline, matches reference image
// ViewBox 120x120 with star centred at 60,60 gives full padding so no tips are clipped
const BahaiStar = ({ size = 40, variant = "gold" }) => {
  const cx = 60, cy = 60, outerR = 42, innerR = 20;
  const pts = [];
  for (let i = 0; i < 18; i++) {
    const a = (i * 20 - 90) * Math.PI / 180;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const d = pts.map(([x,y],i) => `${i===0?"M":"L"}${x.toFixed(3)},${y.toFixed(3)}`).join(" ") + " Z";
  const gid = `sg_${variant}_${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{display:"block",flexShrink:0,overflow:"visible"}}>
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          {variant==="gold" ? <>
            <stop offset="0%"   stopColor="#F7D030"/>
            <stop offset="35%"  stopColor="#D4A020"/>
            <stop offset="70%"  stopColor="#F0C030"/>
            <stop offset="100%" stopColor="#A87010"/>
          </> : <>
            <stop offset="0%"   stopColor="#2A7A5A"/>
            <stop offset="100%" stopColor="#1B5E4B"/>
          </>}
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#${gid})`}
        strokeWidth={variant==="gold"?"8":"6"}
        strokeLinejoin="miter" strokeMiterlimit="50" strokeLinecap="butt"/>
    </svg>
  );
};

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
  const [wantsMentor, setWantsMentor] = useState(false);

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
    if (q?.type === "mentor") return true; // mentor checkbox always optional
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

    // Light theme PDF colours matching the form
    const ORANGE = [201, 148, 58];   // Gold accent
    const DARK   = [26, 26, 26];     // Near black text
    const MID    = [45, 45, 45];     // Dark grey — high contrast on white
    const LIGHT  = [26, 26, 26];     // Near black — maximum body text contrast
    const GREEN  = [27, 94, 75];     // Primary green
    const BLUE   = [27, 94, 75];     // Use green
    const PURPLE = [201, 148, 58];   // Use gold
    const BG_PAGE = [247, 245, 242]; // Warm off-white
    const BG_CARD = [238, 246, 243]; // Light green tint
    const BG_GOLD = [255, 251, 244]; // Light gold tint

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
      // Clamp size down if text is very long so it always fits on one or two lines
      const maxW = usable;
      doc.setFontSize(size);
      doc.setFont("helvetica", "bold");
      const testLines = doc.splitTextToSize(text, maxW);
      // If wraps to more than 2 lines, reduce font size to fit
      const actualSize = testLines.length > 2 ? Math.max(10, size - 3) : size;
      doc.setFontSize(actualSize);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxW);
      checkPage(lines.length * (actualSize * 0.45) + 8);
      doc.text(lines, margin, y);
      y += lines.length * (actualSize * 0.45) + 5;
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

    function divider(color = [220, 215, 210]) {
      checkPage(8);
      doc.setDrawColor(...color);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
    }

    function chip(text, x, cy, color = ORANGE) {
      doc.setFillColor(238, 246, 243);
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

    // ── COVER -- Light Theme ──────────────────────────────
    // White background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, "F");

    // Green header band
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, 210, 52, "F");
    y = 18;

    // Draw simple 9-pointed star on cover using polygons
    const drawStar = (cx, cy, r, fill) => {
      doc.setFillColor(...fill);
      for (let i = 0; i < 9; i++) {
        const a1 = (i * 40 - 90) * Math.PI / 180;
        const a2 = ((i + 4.5) * 40 - 90) * Math.PI / 180;
        const x1 = cx + r * Math.cos(a1);
        const y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * 0.42 * Math.cos(a2);
        const y2 = cy + r * 0.42 * Math.sin(a2);
        doc.triangle(cx, cy, x1, y1, x2, y2, "F");
      }
      doc.setFillColor(...fill);
      doc.circle(cx, cy, r * 0.18, "F");
    };
    drawStar(pageW - 30, 26, 16, [201, 148, 58]);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(201, 148, 58);
    doc.text("BAHÁ'Í YOUTH EMPOWERMENT PROGRAM", margin, y);
    y += 9;
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("Your Personal Roadmap", margin, y);
    y += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 220, 210);
    doc.text(`Prepared for ${userName || "BYEP Participant"}`, margin, y);
    y = 62;

    // Greeting
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MID);
    const greetLines = doc.splitTextToSize(result.name_greeting, usable);
    greetLines.forEach(l => { doc.text(l, margin, y); y += 6; });
    y += 8;

    // Identity box -- light green card
    doc.setFillColor(...BG_CARD);
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, y, usable, 40, 4, 4, "FD");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ORANGE);
    doc.text("YOUR CORE IDENTITY", margin + 6, y + 8);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GREEN);
    doc.text('"' + result.core_identity.title + '"', margin + 6, y + 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MID);
    const idLines = doc.splitTextToSize(result.core_identity.description, usable - 12);
    idLines.slice(0, 2).forEach((l, i) => doc.text(l, margin + 6, y + 26 + i * 5));
    y += 48;

    // Interests chips
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GREEN);
    doc.text("CORE INTERESTS", margin, y); y += 7;
    let cx = margin;
    result.top_interests.forEach(interest => {
      if (cx + interest.length * 2.2 + 12 > pageW - margin) { cx = margin; y += 9; }
      const w = chip(interest, cx, y, ORANGE);
      cx += w;
    });
    y += 14;

    // ── PAGE 2+ -- Light Theme ─────────────────────────
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, "F");
    // Green top stripe on subsequent pages
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, 210, 8, "F");
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
    const LEFT_COL = 46;   // width of the week/focus left column
    const PAD = 5;          // inner padding
    const RIGHT_START = margin + LEFT_COL + PAD;
    // Subtract left col, left pad, AND right edge padding so text never overflows
    const RIGHT_WIDTH = usable - LEFT_COL - PAD - 8;

    result["90_day_plan"].forEach((step, i) => {
      // CRITICAL: set font BEFORE splitTextToSize so measurements are accurate
      // Use a tighter RIGHT_WIDTH with generous safety margin
      const SAFE_WIDTH = RIGHT_WIDTH - 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const actionLines = doc.splitTextToSize(step.action, SAFE_WIDTH);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const resourceLines = doc.splitTextToSize(`→ ${step.resource}`, SAFE_WIDTH);

      const contentLines = Math.min(actionLines.length, 3) + Math.min(resourceLines.length, 2);
      const boxH = Math.max(28, contentLines * 5.8 + 16);

      checkPage(boxH + 4);

      // White box with thin grey border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 215, 210);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, usable, boxH, 3, 3, "FD");

      // Bold green left accent bar
      doc.setFillColor(...GREEN);
      doc.rect(margin, y, 3.5, boxH, "F");

      // Left column — week label + focus
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...ORANGE);
      doc.text(step.week, margin + PAD + 1, y + 9);
      doc.setTextColor(...MID);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(step.focus.toUpperCase(), margin + PAD + 1, y + 15);

      // Vertical divider
      doc.setDrawColor(220, 215, 210);
      doc.setLineWidth(0.3);
      doc.line(margin + LEFT_COL, y + 5, margin + LEFT_COL, y + boxH - 5);

      // Right column — action text
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK);
      doc.setFontSize(9);
      let ry = y + 9;
      actionLines.slice(0, 3).forEach(l => {
        doc.text(l, RIGHT_START, ry);
        ry += 5.2;
      });

      // Resource line — smaller font, green, wrapped
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GREEN);
      ry += 1.5;
      resourceLines.slice(0, 2).forEach(l => {
        doc.text(l, RIGHT_START, ry);
        ry += 4.5;
      });

      y += boxH + 5;
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
    doc.setFillColor(27, 94, 75);
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, usable, 22, 3, 3, "FD");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(168, 213, 194);
    doc.text("DO THIS THIS WEEK", margin + 4, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    const winLines = doc.splitTextToSize(result.immediate_win, usable - 8);
    winLines.slice(0, 2).forEach((l, i) => doc.text(l, margin + 4, y + 13 + i * 5));
    y += 28;
    divider();

    // Spiritual Compass
    checkPage(30);
    doc.setFillColor(245, 240, 255);
    doc.setDrawColor(...PURPLE);
    doc.setLineWidth(0.4);
    const scLines = doc.splitTextToSize(result.bahai_connection, usable - 10);
    const scH = Math.min(scLines.length, 4) * 5.5 + 18;
    doc.roundedRect(margin, y, usable, scH, 3, 3, "FD");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(106, 80, 184);
    doc.text("YOUR SPIRITUAL COMPASS", margin + 4, y + 7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(30, 20, 60);
    doc.setFontSize(9);
    scLines.slice(0, 4).forEach((l, i) => doc.text(l, margin + 4, y + 13 + i * 5.5));
    y += scH + 8;

    // Affirmation
    checkPage(24);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bolditalic");
    doc.setTextColor(139, 90, 20);
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
      "The earth is but one country, and mankind its citizens. - Bahaui-llah",
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

  // LIGHT THEME COLOURS
  const BG       = "#F7F5F2";
  const CARD     = "#FFFFFF";
  const BORDER   = "#E2DDD8";
  const PRIMARY  = "#1B5E4B";
  const ACCENT   = "#C9943A";
  const TEXTDARK = "#1A1A1A";
  const TEXTMID  = "#5A5450";
  const TEXTSOFT = "#9A9490";

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Georgia', serif", color: TEXTDARK, position: "relative" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        input, textarea, button { font-family: 'Georgia', serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #D0CCC8; border-radius: 4px; }
      `}</style>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(ellipse at 20% 30%, rgba(27,94,75,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(201,148,58,0.04) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>

        {/* INTRO */}
        {phase === "intro" && (
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 0", animation: "fadeUp 0.6s ease" }}>
            {/* Faint green watermark */}
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",opacity:.05,pointerEvents:"none"}}>
              <BahaiStar size={460} variant="green"/>
            </div>
            <div style={{ textAlign: "center", position:"relative", zIndex:1 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <BahaiStar size={72} variant="gold" />
              </div>
              <div style={{ fontSize: 11, letterSpacing: 6, color: "#1B5E4B", marginBottom: 16, textTransform: "uppercase", fontWeight: 700 }}>Bahá'í Youth Empowerment Program</div>
              <h1 style={{ fontSize: "clamp(34px, 7vw, 58px)", fontWeight: 400, lineHeight: 1.1, marginBottom: 20, color: "#1A1A1A" }}>
                Discover Your<br /><span style={{ color: "#C9943A", fontStyle: "italic" }}>True Path</span>
              </h1>
              <p style={{ fontSize: 17, lineHeight: 1.8, color: "#5A5450", maxWidth: 500, margin: "0 auto 32px" }}>
                Answer 21 thoughtfully crafted questions and receive a deeply personalised roadmap to unlock your gifts, build real skills, and start creating value for yourself and your community.
              </p>
              {/* Quote 1 */}
              <div style={{ maxWidth: 480, margin: "0 auto 36px", padding: "20px 24px", borderLeft: "3px solid #C9943A", background: "#FFFBF4", textAlign: "left", borderRadius: "0 8px 8px 0" }}>
                <p style={{ fontSize: 14, lineHeight: 1.9, color: "#5A5450", fontStyle: "italic", margin: "0 0 8px" }}>"Be anxiously concerned with the needs of the age ye live in, and center your deliberations on its exigencies and requirements."</p>
                <span style={{ fontSize: 10, letterSpacing: 3, color: "#C9943A", textTransform: "uppercase", fontWeight: 700 }}>-- Bahá'u'lláh</span>
              </div>
              <label style={{display:"block",fontSize:11,color:"#9A9490",marginBottom:8,letterSpacing:3,textTransform:"uppercase",fontWeight:700}}>Full Name</label>
              <input
                type="text" placeholder="Enter your full name"
                value={userName} onChange={e => setUserName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && userName.trim() && setPhase("questionnaire")}
                style={{ background: "#FFFFFF", border: "2px solid #C9943A", borderRadius: 8, padding: "16px 24px", fontSize: 17, color: "#1A1A1A", width: "100%", maxWidth: 300, outline: "none", textAlign: "center", marginBottom: 24, boxSizing: "border-box", boxShadow: "0 2px 8px rgba(201,148,58,0.15)" }}
              />
              <br />
              <button onClick={() => userName.trim() && setPhase("questionnaire")} disabled={!userName.trim()}
                style={{ background: userName.trim() ? "#1B5E4B" : "#C8D8D2", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "17px 44px", fontSize: 15, fontWeight: 700, cursor: userName.trim() ? "pointer" : "not-allowed", letterSpacing: 2, textTransform: "uppercase", transition: "all 0.3s", boxShadow: userName.trim() ? "0 4px 14px rgba(27,94,75,0.3)" : "none" }}>
                Begin My Discovery →
              </button>
              <div style={{ marginTop: 36, display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
                {["21 Questions", "~15 Minutes", "AI-Powered Roadmap", "Free & Private"].map(item => (
                  <div key={item} style={{ fontSize: 12, color: "#9A9490" }}>• {item}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QUESTIONNAIRE */}
        {phase === "questionnaire" && (
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 0", position:"relative", overflow:"hidden" }}>
            <div style={{position:"absolute",bottom:-60,right:-60,opacity:.04,pointerEvents:"none"}}>
              <BahaiStar size={280} variant="green"/>
            </div>
            {/* Star header on every question screen */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
              <BahaiStar size={32} variant="gold" />
              <span style={{ fontSize: 12, color: "#9A9490" }}>{currentQ + 1} / {QUESTIONS.length}</span>
            </div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 11 }}>
                <span style={{ color: "#1B5E4B", letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>{q.section}</span>
              </div>
              <div style={{ height: 4, background: "#E8E4E0", borderRadius: 4 }}>
                <div style={{ height: "100%", borderRadius: 4, background: "#1B5E4B", width: `${progress}%`, transition: "width 0.5s ease" }} />
              </div>
            </div>

            <div style={{ opacity: fadeIn ? 1 : 0, transform: fadeIn ? "translateY(0)" : "translateY(10px)", transition: "all 0.35s ease" }}>
              <div style={{ fontSize: 11, color: "#9A9490", marginBottom: 12, fontWeight: 700 }}>Question {currentQ + 1}</div>
              <h2 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, lineHeight: 1.4, marginBottom: q.hint ? 10 : 24, color: "#1A1A1A" }}>{q.question}</h2>
              {q.hint && <p style={{ fontSize: 13, color: "#9A9490", marginBottom: 24, fontStyle: "italic" }}>{q.hint}</p>}

              {q.type === "text" && (
                <textarea value={answers[q.id] || ""} onChange={e => handleAnswer(e.target.value)} placeholder={q.placeholder} rows={4}
                  style={{ width: "100%", background: "#FFFFFF", border: "2px solid #E2DDD8", borderRadius: 10, padding: "16px 18px", fontSize: 16, color: "#1A1A1A", resize: "vertical", outline: "none", fontFamily: "'Georgia', serif", lineHeight: 1.7, boxSizing: "border-box", transition: "border-color 0.2s" }}
                  onFocus={e => e.target.style.borderColor = "#1B5E4B"}
                  onBlur={e => e.target.style.borderColor = "#E2DDD8"}
                />
              )}

              {q.type === "single" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {q.options.map(opt => {
                    const sel = answers[q.id] === opt;
                    return (
                      <button key={opt} onClick={() => handleAnswer(opt)} style={{ background: sel ? "#EEF6F3" : "#FFFFFF", border: `2px solid ${sel ? "#1B5E4B" : "#E2DDD8"}`, borderRadius: 10, padding: "14px 18px", textAlign: "left", color: sel ? "#1B5E4B" : "#5A5450", fontSize: 15, cursor: "pointer", transition: "all 0.2s", fontWeight: sel ? 700 : 400 }}>
                        <span style={{ display: "inline-block", width: 18, height: 18, borderRadius: "50%", border: `2px solid ${sel ? "#1B5E4B" : "#C8C4C0"}`, marginRight: 12, verticalAlign: "middle", background: sel ? "#1B5E4B" : "transparent", transition: "all 0.2s" }} />
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === "multi" && (
                <div>
                  <p style={{ fontSize: 12, color: "#9A9490", marginBottom: 14, fontStyle: "italic" }}>Select all that apply</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {q.options.map(opt => {
                      const sel = (answers[q.id] || []).includes(opt);
                      return (
                        <button key={opt} onClick={() => handleMultiToggle(opt)}
                          style={{ background: sel ? "#EEF6F3" : "#FFFFFF", border: `2px solid ${sel ? "#1B5E4B" : "#E2DDD8"}`, borderRadius: 50, padding: "9px 18px", color: sel ? "#1B5E4B" : "#5A5450", fontSize: 13, cursor: "pointer", transition: "all 0.2s", fontWeight: sel ? 700 : 400 }}>
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
                    style={{ width: "100%", background: "#FFFFFF", border: "2px solid #E2DDD8", borderRadius: 10, padding: "16px 18px", fontSize: 16, color: "#1A1A1A", outline: "none", marginBottom: 20, boxSizing: "border-box" }}
                  />
                  <p style={{ fontSize: 12, color: "#9A9490", marginBottom: 14, fontStyle: "italic" }}>What do you currently have access to? (select all that apply)</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {q.accessOptions.map(opt => {
                      const sel = (answers[q.id]?.access || []).includes(opt);
                      return (
                        <button key={opt} onClick={() => {
                          const prev = answers[q.id]?.access || [];
                          const updated = prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt];
                          setAnswers(p => ({ ...p, [q.id]: { ...p[q.id], access: updated } }));
                        }}
                          style={{ background: sel ? "#EEF6F3" : "#FFFFFF", border: `2px solid ${sel ? "#1B5E4B" : "#E2DDD8"}`, borderRadius: 50, padding: "9px 18px", color: sel ? "#1B5E4B" : "#5A5450", fontSize: 13, cursor: "pointer", transition: "all 0.2s", fontWeight: sel ? 700 : 400 }}>
                          {sel ? "✓ " : ""}{opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {q.type === "mentor" && (
                <div>
                  <div onClick={() => { setWantsMentor(!wantsMentor); setAnswers(p => ({ ...p, [q.id]: !wantsMentor })); }}
                    style={{ display: "flex", alignItems: "center", gap: 16, background: wantsMentor ? "#EEF6F3" : "#FFFFFF", border: `2px solid ${wantsMentor ? "#1B5E4B" : "#E2DDD8"}`, borderRadius: 12, padding: "20px 24px", cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${wantsMentor ? "#1B5E4B" : "#C8C4C0"}`, background: wantsMentor ? "#1B5E4B" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                      {wantsMentor && <span style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: wantsMentor ? "#1B5E4B" : "#1A1A1A", marginBottom: 4 }}>Yes, I would love a mentor!</div>
                      <div style={{ fontSize: 13, color: "#9A9490" }}>A Bahá'í adult with experience in your area will be matched with you to guide and support your journey.</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "#9A9490", marginTop: 12, fontStyle: "italic", textAlign: "center" }}>This is optional -- you can continue without selecting this.</p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, alignItems: "center" }}>
              <button onClick={goPrev} disabled={currentQ === 0}
                style={{ background: "none", border: "2px solid #E2DDD8", borderRadius: 8, padding: "12px 22px", color: currentQ === 0 ? "#C8C4C0" : "#5A5450", cursor: currentQ === 0 ? "not-allowed" : "pointer", fontSize: 14, transition: "all 0.2s" }}>
                ← Back
              </button>
              <button onClick={goNext} disabled={!canProceed()}
                style={{ background: canProceed() ? "#1B5E4B" : "#C8D8D2", border: "none", borderRadius: 8, padding: "14px 34px", color: "#FFFFFF", cursor: canProceed() ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 700, letterSpacing: 1, transition: "all 0.3s", boxShadow: canProceed() ? "0 4px 14px rgba(27,94,75,0.25)" : "none" }}>
                {currentQ === QUESTIONS.length - 1 ? "Generate My Roadmap →" : "Next →"}
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {phase === "loading" && (
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <BahaiStar size={72} variant="gold" />
            <div style={{ width: 60, height: 60, borderRadius: "50%", border: "3px solid #E2DDD8", borderTop: "3px solid #1B5E4B", animation: "spin 1.2s linear infinite", margin: "24px auto 32px" }} />
            <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 14, color: "#1A1A1A" }}>Crafting your roadmap{loadingDots}</h2>
            <p style={{ fontSize: 15, color: "#9A9490", maxWidth: 360, marginBottom: 48, lineHeight: 1.7 }}>Your answers are being woven into a personalised guide built just for you.</p>
            <div style={{ maxWidth: 420, padding: "24px 28px", borderLeft: "3px solid #C9943A", background: "#FFFBF4", textAlign: "left", borderRadius: "0 8px 8px 0" }}>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: "#5A5450", fontStyle: "italic", margin: "0 0 8px" }}>"Man is the supreme Talisman. Lack of a proper education hath, however, deprived him of that which he doth inherently possess."</p>
              <span style={{ fontSize: 10, letterSpacing: 3, color: "#C9943A", textTransform: "uppercase", fontWeight: 700 }}>-- Bahá'u'lláh</span>
            </div>
          </div>
        )}

        {/* RESULT */}
        {phase === "result" && result && !result.error && (
          <div style={{ padding: "60px 0" }}>
            {saved && (
              <div style={{ background: "#EEF6F3", border: "1px solid #A8D5C2", borderRadius: 8, padding: "12px 20px", marginBottom: 40, fontSize: 13, color: "#1B5E4B", textAlign: "center", fontWeight: 700 }}>
                ✓ Your responses have been saved
              </div>
            )}

            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
                <BahaiStar size={64} variant="gold"/>
              </div>
              <div style={{ fontSize: 11, letterSpacing: 5, color: "#C9943A", marginBottom: 16, textTransform: "uppercase", fontWeight: 700 }}>Your Personal Roadmap</div>
              <p style={{ fontSize: 18, lineHeight: 1.85, color: "#2C2C2C", maxWidth: 540, margin: "0 auto" }}>{result.name_greeting}</p>
            </div>

            {/* Identity */}
            <div style={{ background: "linear-gradient(135deg, #EEF6F3, #FDF8EE)", border: "2px solid #C9943A", borderRadius: 16, padding: "36px 36px", marginBottom: 24, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: 5, color: "#C9943A", marginBottom: 14, textTransform: "uppercase", fontWeight: 700 }}>Your Core Identity</div>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1B5E4B", marginBottom: 14, fontStyle: "italic" }}>"{result.core_identity.title}"</h2>
              <p style={{ fontSize: 16, color: "#5A5450", lineHeight: 1.7, margin: 0 }}>{result.core_identity.description}</p>
            </div>

            {/* Hidden Strength */}
            <div style={{ background: "#F0F5FF", border: "1px solid #6B9ED4", borderRadius: 12, padding: "22px 30px", marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: 5, color: "#4A80B8", marginBottom: 10, textTransform: "uppercase", fontWeight: 700 }}>Hidden Strength We Noticed</div>
              <p style={{ fontSize: 15, color: "#2C2C2C", lineHeight: 1.7, margin: 0 }}>{result.hidden_strength}</p>
            </div>

            {/* Interests */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#5A5450", marginBottom: 14, textTransform: "uppercase" }}>Your Core Interests</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.top_interests.map(i => (
                  <span key={i} style={{ background: "#FEF3E8", border: "1.5px solid #C9943A", borderRadius: 50, padding: "7px 18px", fontSize: 13, color: "#8B5E1A", fontWeight: 700 }}>{i}</span>
                ))}
              </div>
            </div>

            {/* Primary Path */}
            <div style={{ background: "#FFFFFF", border: "2px solid #1B5E4B", borderRadius: 14, padding: "28px 32px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#1B5E4B", marginBottom: 10, textTransform: "uppercase", fontWeight: 700 }}>Recommended Path</div>
              <h3 style={{ fontSize: 21, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>{result.primary_path.title}</h3>
              <p style={{ fontSize: 15, color: "#2C2C2C", lineHeight: 1.75, marginBottom: 14 }}>{result.primary_path.why}</p>
              <div style={{ fontSize: 13, color: "#1B5E4B", fontWeight: 700, background: "#EEF6F3", padding: "8px 12px", borderRadius: 6, display: "inline-block" }}>⏱ First income estimate: {result.primary_path.income_timeline}</div>
            </div>

            {/* Alt Path */}
            <div style={{ background: "#FAFAFA", border: "1.5px solid #E2DDD8", borderRadius: 10, padding: "22px 28px", marginBottom: 36 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#5A5450", marginBottom: 8, textTransform: "uppercase", fontWeight: 700 }}>Alternative Path</div>
              <h4 style={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>{result.alternative_path.title}</h4>
              <p style={{ fontSize: 14, color: "#3C3C3C", lineHeight: 1.7, margin: 0 }}>{result.alternative_path.why}</p>
            </div>

            {/* 90 Day Plan */}
            <div style={{ marginBottom: 44 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#5A5450", marginBottom: 20, textTransform: "uppercase" }}>Your 90-Day Action Plan</div>
              {result["90_day_plan"].map((step, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 16, background: "#FFFFFF", border: "1.5px solid #E2DDD8", borderRadius: 10, padding: "20px 24px", marginBottom: 10, alignItems: "start", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#C9943A", fontWeight: 700, marginBottom: 4 }}>{step.week}</div>
                    <div style={{ fontSize: 11, color: "#5A5450", textTransform: "uppercase", letterSpacing: 1 }}>{step.focus}</div>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, color: "#1A1A1A", lineHeight: 1.7, margin: "0 0 8px" }}>{step.action}</p>
                    <div style={{ fontSize: 12, color: "#1B5E4B", fontWeight: 700 }}>→ {step.resource}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Skill Gaps */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#5A5450", marginBottom: 14, textTransform: "uppercase" }}>Skills to Develop</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.skill_gaps.map(g => (
                  <span key={g} style={{ background: "#FEF0EE", border: "1.5px solid #D4796B", borderRadius: 50, padding: "7px 16px", fontSize: 13, color: "#9B3A2C", fontWeight: 600 }}>{g}</span>
                ))}
              </div>
            </div>

            {/* Immediate Win */}
            <div style={{ background: "linear-gradient(135deg, #1B5E4B, #1E7055)", borderRadius: 12, padding: "26px 32px", marginBottom: 32 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#A8D5C2", marginBottom: 10, textTransform: "uppercase", fontWeight: 700 }}>Do This This Week</div>
              <p style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 1.75, margin: 0, fontWeight: 600 }}>{result.immediate_win}</p>
            </div>

            {/* Bahá'í Connection */}
            <div style={{ background: "#F5F0FF", border: "1.5px solid #A08FD4", borderRadius: 12, padding: "24px 28px", marginBottom: 36 }}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "#6A50B8", marginBottom: 10, textTransform: "uppercase", fontWeight: 700 }}>Your Spiritual Compass</div>
              <p style={{ fontSize: 15, color: "#2C2C2C", lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>{result.bahai_connection}</p>
            </div>

            {/* Affirmation */}
            <div style={{ textAlign: "center", padding: "44px 0", borderTop: "2px solid #E2DDD8" }}>
              <p style={{ fontSize: "clamp(17px, 3vw, 22px)", color: "#1B5E4B", lineHeight: 1.8, fontStyle: "italic", maxWidth: 520, margin: "0 auto 36px" }}>"{result.affirmation}"</p>

              {/* Quote 3 -- Go Serve the World */}
              <div style={{ maxWidth: 460, margin: "0 auto 40px", padding: "20px 24px", borderLeft: "3px solid #1B5E4B", background: "#EEF6F3", textAlign: "left", borderRadius: "0 8px 8px 0" }}>
                <p style={{ fontSize: 14, lineHeight: 1.9, color: "#5A5450", fontStyle: "italic", margin: "0 0 8px" }}>
                  "It is not for him to pride himself who loveth his own country, but rather for him who loveth the whole world. The earth is but one country, and mankind its citizens."
                </p>
                <span style={{ fontSize: 10, letterSpacing: 3, color: "#1B5E4B", textTransform: "uppercase", fontWeight: 700 }}>-- Bahá'u'lláh</span>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={downloadPDF} disabled={pdfLoading}
                  style={{ background: pdfLoading ? "#A8D5C2" : "#1B5E4B", border: "none", borderRadius: 8, padding: "14px 32px", color: "#0D0D0D", cursor: pdfLoading ? "wait" : "pointer", fontSize: 15, fontWeight: 700, letterSpacing: 1, transition: "all 0.3s", boxShadow: pdfLoading ? "none" : "0 4px 14px rgba(27,94,75,0.3)" }}>
                  {pdfLoading ? "Preparing PDF..." : "↓ Download My Roadmap (PDF)"}
                </button>
                <button onClick={() => { setPhase("intro"); setAnswers({}); setCurrentQ(0); setResult(null); setUserName(""); setSaved(false); }}
                  style={{ background: "none", border: "2px solid #E2DDD8", borderRadius: 8, padding: "14px 26px", color: "#9A9490", cursor: "pointer", fontSize: 13, transition: "all 0.2s" }}>
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
