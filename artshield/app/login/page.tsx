"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export default function LoginPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.5,
      o: Math.random() * 0.4 + 0.1,
    }));

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,170,${n.o})`;
        ctx.fill();
      });
      nodes.forEach((a, i) => nodes.slice(i + 1).forEach((b) => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,229,170,${0.12 * (1 - d / 130)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }));
      animId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse 120% 80% at 50% 0%, #0a1628 0%, #060810 60%)",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

      {/* Main card */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: "420px", margin: "0 20px",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        <div style={{
          borderRadius: "24px", padding: "44px 40px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(0,229,170,0.15)",
          backdropFilter: "blur(30px)",
          boxShadow: "0 0 100px rgba(0,229,170,0.06), 0 20px 60px rgba(0,0,0,0.5)",
        }}>

          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "20px",
              background: "linear-gradient(135deg, rgba(0,229,170,0.12), rgba(108,99,255,0.12))",
              border: "1px solid rgba(0,229,170,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 40px rgba(0,229,170,0.15)",
              animation: "float 3s ease-in-out infinite",
            }}>
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L8 11v12c0 10.5 7 19.5 16 22 9-2.5 16-11.5 16-22V11L24 4z"
                  fill="rgba(0,229,170,0.1)" stroke="#00e5aa" strokeWidth="2" />
                <path d="M24 18c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6"
                  stroke="#00e5aa" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
                <path d="M24 21c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3"
                  stroke="#00e5aa" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
                <circle cx="24" cy="24" r="1.5" fill="#00e5aa" />
                <path d="M17 17c1.8-2.5 4.6-4 7.5-4s5.5 1.3 7.2 3.5"
                  stroke="#6c63ff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "36px", fontWeight: "800",
              letterSpacing: "-1.5px", lineHeight: 1,
              background: "linear-gradient(135deg, #00e5aa 0%, #00b4d8 45%, #6c63ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              ArtShield
            </h1>
            <p style={{
              fontSize: "10px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(0,229,170,0.6)",
              marginTop: "6px",
              fontFamily: "'Syne', sans-serif",
              fontWeight: "600",
            }}>
              Digital Art Protection
            </p>
          </div>

          {/* Description */}
          <p style={{
            textAlign: "center", fontSize: "13px", lineHeight: "1.7",
            color: "rgba(255,255,255,0.4)", margin: "20px 0 28px",
          }}>
            Protect your AI-generated artwork with{" "}
            <span style={{ color: "rgba(0,229,170,0.9)", fontWeight: 500 }}>visual fingerprinting</span>
            {" "}and immutable blockchain ownership records.
          </p>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
              SECURE ACCESS
            </span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Google Button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            style={{
              width: "100%", padding: "14px 20px", borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.85)",
              fontSize: "14px", fontWeight: "600",
              fontFamily: "'Syne', sans-serif",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "12px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,229,170,0.08)";
              e.currentTarget.style.borderColor = "rgba(0,229,170,0.3)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(0,229,170,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3-11.3-7.3l-6.5 5C9.6 39.5 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.7 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </button>

          {/* Feature pills */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px", flexWrap: "wrap" }}>
            {["🔍 pHash Detection", "⛓️ Blockchain Proof", "🛡️ Instant Register"].map((f) => (
              <span key={f} style={{
                fontSize: "11px", padding: "5px 10px", borderRadius: "20px",
                background: "rgba(0,229,170,0.06)",
                border: "1px solid rgba(0,229,170,0.15)",
                color: "rgba(0,229,170,0.7)", fontWeight: 500,
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: "center", marginTop: "20px", fontSize: "11px",
          color: "rgba(255,255,255,0.15)", letterSpacing: "0.05em",
        }}>
          © 2026 ArtShield • Built for creators, by creators
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}