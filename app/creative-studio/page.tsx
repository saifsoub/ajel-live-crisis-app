"use client";
import { useState, useRef, useEffect } from "react";

const MEDIA_TYPES = [
  { id: "infographic", label: "Viral Infographic", icon: "📊", desc: "Animated GIF for LinkedIn" },
  { id: "social", label: "Social Graphic", icon: "📱", desc: "Instagram / LinkedIn card" },
  { id: "logo", label: "Logo / Icon", icon: "✦", desc: "SVG vector output" },
  { id: "poster", label: "Poster / Flyer", icon: "🎨", desc: "HTML visual mockup" },
];

const CREDS = {
  telegramToken: "7630400192:AAHE72R4MANmtVFDX_Ey-UovTNdPAAqwQ78",
  telegramChatId: "1231430352",
  linkedinToken: "AQXYXgelogpxiAFDG6_w8W-e9RG4STX1ULgc8kIwNAL6I1sT-8JrjHACo2CdzJBUVeLdrV11pQv23ZJOw6mbiarOXrCMbBQKRVOhhW9i2FSUGc1fUPilgIVGrB1cxazkmdjUObghbsSF6J_dfH7YPcEEzhKOmgxpEGK2WmRyJmO53oDIF1M8muHqh6XZAZ1hek2pXdjhLD9dMDbqGmrWgzo8astq5wNkW5u_Z5mCZ82oUeyf90DkS3r_c4FLW66O917SwIMjXmWwCBihYpNSAa2rwtJupF4xnk3pDXaIq2GR5spv2H39_uUHuAwFA-1qpHpmfO9Q_x-4kIPG0Xzv1iwtg",
};

async function callClaude(system: string, user: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const d = await res.json();
  return d.content?.[0]?.text || "";
}

// ── Telegram: via server-side API route to avoid CORS ───────────────────────
async function sendTelegramMsg(text: string) {
  const res = await fetch("/api/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: CREDS.telegramToken,
      chatId: CREDS.telegramChatId,
      text,
    }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || "Telegram failed");
  return d;
}

// ── LinkedIn: via allorigins CORS proxy ─────────────────────────────────────
async function postLinkedIn(postText: string) {
  const body = {
    author: "urn:li:person:me",
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: postText },
        shareMediaCategory: "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  const target = "https://api.linkedin.com/v2/ugcPosts";
  const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
  const res = await fetch(proxy, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CREDS.linkedinToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text;
}

// ── Animated Infographic Canvas ──────────────────────────────────────────────
function InfographicCanvas({ data }: { data: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!data) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let t = 0;
    const nodes: string[] = data.nodes || [];
    const center = { x: 400, y: 240 };

    function draw() {
      ctx.clearRect(0, 0, 800, 480);
      const bg = ctx.createLinearGradient(0, 0, 800, 480);
      bg.addColorStop(0, "#0a0a1a");
      bg.addColorStop(1, "#0d0d2b");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 800, 480);

      ctx.strokeStyle = "rgba(100,100,255,0.07)";
      ctx.lineWidth = 1;
      for (let x = 0; x < 800; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 480); ctx.stroke();
      }
      for (let y = 0; y < 480; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
      }

      nodes.forEach((node, i) => {
        const angle = (i / nodes.length) * Math.PI * 2;
        const r = 160;
        const nx = center.x + Math.cos(angle) * r;
        const ny = center.y + Math.sin(angle) * r;

        ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(nx, ny);
        const g = ctx.createLinearGradient(center.x, center.y, nx, ny);
        g.addColorStop(0, "rgba(0,255,255,0.4)");
        g.addColorStop(1, "rgba(160,0,255,0.2)");
        ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.stroke();

        const prog = (t * 0.5 + i * 0.3) % 1;
        const dx = center.x + Math.cos(angle) * r * prog;
        const dy = center.y + Math.sin(angle) * r * prog;
        ctx.beginPath(); ctx.arc(dx, dy, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,255,${0.9 - prog * 0.5})`; ctx.fill();

        const pulse = Math.sin(t * 2 + i) * 3;
        ctx.beginPath(); ctx.arc(nx, ny, 28 + pulse, 0, Math.PI * 2);
        const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, 28 + pulse);
        ng.addColorStop(0, "rgba(160,0,255,0.35)");
        ng.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = ng; ctx.fill();

        ctx.beginPath(); ctx.arc(nx, ny, 22, 0, Math.PI * 2);
        ctx.strokeStyle =
          i === Math.floor((t * 0.3) % nodes.length) ? "#00ffff" : "rgba(160,0,255,0.7)";
        ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = "#0a0a1a"; ctx.fill();

        ctx.font = "bold 10px 'Segoe UI',sans-serif";
        ctx.fillStyle = "#e0e0ff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const words = node.split(" ");
        words.forEach((w, wi) =>
          ctx.fillText(w, nx, ny - (words.length - 1) * 6 + wi * 12)
        );
      });

      const cp = Math.sin(t * 1.5) * 4;
      ctx.beginPath(); ctx.arc(center.x, center.y, 52 + cp, 0, Math.PI * 2);
      const cg = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 52 + cp);
      cg.addColorStop(0, "rgba(0,255,255,0.2)");
      cg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cg; ctx.fill();

      ctx.beginPath(); ctx.arc(center.x, center.y, 44, 0, Math.PI * 2);
      ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "rgba(0,20,40,0.9)"; ctx.fill();

      ctx.font = "bold 13px 'Segoe UI',sans-serif";
      ctx.fillStyle = "#00ffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const titleWords = (data.title || "").split(" ");
      titleWords.forEach((w: string, wi: number) =>
        ctx.fillText(w, center.x, center.y - (titleWords.length - 1) * 8 + wi * 16)
      );

      ctx.font = "bold 15px 'Segoe UI',sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(data.headline || "", 20, 16);

      ctx.font = "11px 'Segoe UI',sans-serif";
      ctx.fillStyle = "rgba(150,150,255,0.7)";
      ctx.fillText(data.pattern || "", 20, 36);

      ctx.font = "10px 'Segoe UI',sans-serif";
      ctx.fillStyle = "rgba(0,255,255,0.5)";
      ctx.textAlign = "right";
      ctx.fillText("Creative Studio Agent", 780, 465);

      t += 0.02;
      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={480}
      style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(0,255,255,0.2)" }}
    />
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function CreativeStudio() {
  const [step, setStep] = useState("home");
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [infographicData, setInfographicData] = useState<any>(null);
  const [svgOutput, setSvgOutput] = useState<string | null>(null);
  const [editedPost, setEditedPost] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState("error");

  const setStatus = (msg: string, type = "error") => {
    setStatusMsg(msg);
    setStatusType(type);
  };

  const generate = async () => {
    if (!prompt.trim() || !mediaType) return;
    setLoading(true);
    setStep("generating");
    try {
      if (mediaType === "infographic") {
        setLoadingMsg("🧠 Analyzing your idea...");
        const raw = await callClaude(
          `You are a viral infographic designer. Return ONLY valid JSON, no markdown, no backticks.
Schema: {"title":"short center label","headline":"engaging headline max 8 words","pattern":"pattern name","nodes":["node1","node2","node3","node4","node5","node6"]}
Nodes: 5-7 short labels (2-3 words each). Pick best pattern from: Ecosystem Map, Hub & Spoke, Layered Architecture, Workflow Pipeline, Evolution Timeline, Before vs After, Concept Breakdown, Landscape Grid, Step-by-Step Guide, Transformation Diagram.`,
          prompt
        );
        let parsed: any;
        try {
          parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        } catch {
          parsed = {
            title: prompt,
            headline: prompt,
            pattern: "Hub & Spoke",
            nodes: ["AI Tools", "Automation", "Data", "Models", "Agents", "Output"],
          };
        }
        setInfographicData(parsed);
      } else {
        setSvgOutput(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0a0a1a"/><stop offset="100%" stop-color="#1a0a2e"/></linearGradient></defs>
  <rect width="400" height="400" fill="url(#g)"/>
  <circle cx="200" cy="200" r="120" fill="none" stroke="#00ffff" stroke-width="1.5" opacity="0.4"/>
  <circle cx="200" cy="200" r="80" fill="none" stroke="#a000ff" stroke-width="1" opacity="0.5"/>
  <text x="200" y="195" text-anchor="middle" fill="#00ffff" font-size="18" font-family="Segoe UI" font-weight="bold">${prompt.slice(0, 20)}</text>
  <text x="200" y="220" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="11" font-family="Segoe UI">${mediaType}</text>
</svg>`);
      }

      setLoadingMsg("✍️ Writing your LinkedIn post...");
      const post = await callClaude(
        `You are a top LinkedIn content creator specializing in AI and tech. Write a viral LinkedIn post.
Format: punchy hook line, blank line, bold key insight, numbered framework 3-5 steps with bold labels, separator line, regulations or context, CTA with save/repost ask, 8-10 hashtags.
Use 𝐔𝐧𝐢𝐜𝐨𝐝𝐞 𝐛𝐨𝐥𝐝 for emphasis. Use emojis. Be authoritative. Max 400 words.`,
        `Topic: ${prompt}`
      );
      setEditedPost(post);
      setStep("preview");
    } catch (e: any) {
      setStatus("Generation error: " + e.message);
      setStep("home");
    }
    setLoading(false);
    setLoadingMsg("");
  };

  const sendTelegram = async () => {
    setLoading(true);
    setLoadingMsg("📲 Sending to Telegram...");
    try {
      const text = `🎨 *Creative Studio — Approval Request*\n\n*Type:* ${mediaType}\n*Topic:* ${prompt}\n\n━━━━━━━━━━━━━\n${editedPost.slice(0, 800)}\n━━━━━━━━━━━━━\n\n✅ Go back to the app and click *Post to LinkedIn* to confirm.`;
      await sendTelegramMsg(text);
      setStatus("✅ Sent to Telegram! Check your messages, then confirm below.", "success");
      setStep("telegram");
    } catch (e: any) {
      setStatus("Telegram error: " + e.message);
    }
    setLoading(false);
    setLoadingMsg("");
  };

  const postToLinkedIn = async () => {
    setLoading(true);
    setLoadingMsg("🚀 Posting to LinkedIn...");
    try {
      await postLinkedIn(editedPost);
      await sendTelegramMsg(`✅ *Posted to LinkedIn!*\n\nTopic: ${prompt}\nType: ${mediaType}`);
      setStep("done");
    } catch (e: any) {
      setStatus("LinkedIn error: " + e.message);
    }
    setLoading(false);
    setLoadingMsg("");
  };

  const reset = () => {
    setStep("home");
    setPrompt("");
    setInfographicData(null);
    setSvgOutput(null);
    setEditedPost("");
    setStatusMsg("");
    setMediaType(null);
  };

  const btn = (label: string, onClick: () => void, color = "#00ffff", disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "14px 20px",
        background: `rgba(${color === "#00ffff" ? "0,255,255" : color === "#00ff88" ? "0,255,136" : color === "#ff9090" ? "255,144,144" : "0,119,181"},0.12)`,
        border: `1px solid ${color}66`,
        borderRadius: 12,
        color,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 700,
        fontSize: 14,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#07071a", color: "#e0e0ff", fontFamily: "'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(100,100,255,0.15)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#00ffff,#a000ff)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✦</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>CREATIVE STUDIO</div>
          <div style={{ fontSize: 11, color: "rgba(150,150,255,0.6)" }}>AI-Powered Design Agent · Claude Relay Active</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <span style={{ fontSize: 11, padding: "4px 10px", background: "rgba(0,255,100,0.1)", border: "1px solid rgba(0,255,100,0.3)", borderRadius: 20, color: "#00ff88" }}>📲 Telegram ✓</span>
          <span style={{ fontSize: 11, padding: "4px 10px", background: "rgba(0,119,181,0.1)", border: "1px solid rgba(0,119,181,0.3)", borderRadius: 20, color: "#29b6f6" }}>in LinkedIn ✓</span>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px" }}>
        {/* HOME */}
        {step === "home" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px", background: "linear-gradient(135deg,#00ffff,#a000ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                What will you create?
              </h1>
              <p style={{ color: "rgba(180,180,255,0.6)", fontSize: 15 }}>
                Select a media type, describe your idea, and let the agent do the rest.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 32 }}>
              {MEDIA_TYPES.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setMediaType(m.id)}
                  style={{
                    padding: "20px 24px",
                    borderRadius: 14,
                    border: `2px solid ${mediaType === m.id ? "#00ffff" : "rgba(100,100,255,0.2)"}`,
                    background: mediaType === m.id ? "rgba(0,255,255,0.06)" : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{m.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: "rgba(180,180,255,0.5)" }}>{m.desc}</div>
                  {m.id === "infographic" && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#00ffff", background: "rgba(0,255,255,0.1)", display: "inline-block", padding: "2px 8px", borderRadius: 20 }}>
                      Animated GIF
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(100,100,255,0.25)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, color: "rgba(200,200,255,0.6)", marginBottom: 10 }}>
                Describe your idea or topic
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mediaType === "infographic"
                    ? "e.g. AI Governance Framework, 5-Step Tax Compliance, Future of Work..."
                    : "Describe what you want to create..."
                }
                rows={3}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#e0e0ff", fontSize: 15, resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>
            <button
              onClick={generate}
              disabled={!prompt.trim() || !mediaType}
              style={{
                width: "100%",
                padding: 16,
                background: prompt.trim() && mediaType ? "linear-gradient(135deg,#00c8ff,#8000ff)" : "rgba(100,100,255,0.1)",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                cursor: prompt.trim() && mediaType ? "pointer" : "not-allowed",
                letterSpacing: 1,
              }}
            >
              ✦ Generate
            </button>
          </>
        )}

        {/* GENERATING */}
        {step === "generating" && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 24, display: "inline-block", animation: "spin 2s linear infinite" }}>✦</div>
            <div style={{ fontSize: 18, color: "#00ffff", marginBottom: 8 }}>{loadingMsg}</div>
            <div style={{ fontSize: 13, color: "rgba(180,180,255,0.4)" }}>Claude relay is working...</div>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* PREVIEW */}
        {step === "preview" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: "#00ffff" }}>✦ Preview & Edit</h2>
              <button onClick={reset} style={{ background: "transparent", border: "1px solid rgba(100,100,255,0.3)", borderRadius: 8, padding: "6px 14px", color: "rgba(200,200,255,0.6)", cursor: "pointer", fontSize: 13 }}>
                ← New
              </button>
            </div>
            {mediaType === "infographic" && infographicData && (
              <div style={{ marginBottom: 28 }}>
                <InfographicCanvas data={infographicData} />
              </div>
            )}
            {mediaType !== "infographic" && svgOutput && (
              <div
                style={{ marginBottom: 28, borderRadius: 12, border: "1px solid rgba(0,255,255,0.2)", overflow: "hidden" }}
                dangerouslySetInnerHTML={{ __html: svgOutput }}
              />
            )}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(100,100,255,0.2)", borderRadius: 14, padding: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, background: "#0077b5", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>in</div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>LinkedIn Post</span>
                <span style={{ fontSize: 11, color: "rgba(150,150,255,0.5)", marginLeft: "auto" }}>Edit before posting</span>
              </div>
              <textarea
                value={editedPost}
                onChange={(e) => setEditedPost(e.target.value)}
                rows={12}
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(100,100,255,0.15)", borderRadius: 10, padding: 14, color: "#e0e0ff", fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.6 }}
              />
            </div>
            {statusMsg && (
              <div style={{ marginBottom: 16, padding: "10px 16px", background: statusType === "success" ? "rgba(0,255,100,0.08)" : "rgba(255,100,100,0.1)", border: `1px solid ${statusType === "success" ? "rgba(0,255,100,0.3)" : "rgba(255,100,100,0.3)"}`, borderRadius: 8, fontSize: 13, color: statusType === "success" ? "#00ff88" : "#ff9090" }}>
                {statusMsg}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {btn("📲 Send to Telegram for Approval", sendTelegram, "#29b6f6")}
              {btn("🔗 Post Directly to LinkedIn", postToLinkedIn, "#0ea5e9")}
            </div>
          </>
        )}

        {/* TELEGRAM CONFIRM */}
        {step === "telegram" && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>📲</div>
            <h2 style={{ color: "#29b6f6", margin: "0 0 12px" }}>Check Your Telegram!</h2>
            <p style={{ color: "rgba(180,180,255,0.6)", marginBottom: 32, lineHeight: 1.7 }}>
              Post preview sent via Claude relay.<br />Review it on Telegram, then confirm below.
            </p>
            {statusMsg && (
              <div style={{ marginBottom: 24, padding: "10px 20px", background: "rgba(0,255,100,0.08)", border: "1px solid rgba(0,255,100,0.3)", borderRadius: 8, fontSize: 13, color: "#00ff88", display: "inline-block" }}>
                {statusMsg}
              </div>
            )}
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              {btn("✅ Confirmed — Post to LinkedIn", postToLinkedIn, "#00ff88")}
              {btn("❌ Cancel", () => setStep("preview"), "#ff9090")}
            </div>
          </div>
        )}

        {/* DONE */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🚀</div>
            <h2 style={{ color: "#00ffff", margin: "0 0 12px", fontSize: 28 }}>Posted Successfully!</h2>
            <p style={{ color: "rgba(180,180,255,0.6)", marginBottom: 32 }}>Your content is now live on LinkedIn.</p>
            <button onClick={reset} style={{ padding: "14px 32px", background: "linear-gradient(135deg,#00c8ff,#8000ff)", border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
              ✦ Create Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
