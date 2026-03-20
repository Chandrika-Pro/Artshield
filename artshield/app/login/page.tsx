"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export default function LoginPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes: {
      x: number; y: number; vx: number; vy: number;
      radius: number; opacity: number;
    }[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 200, ${n.opacity})`;
        ctx.fill();
      });

      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0, 255, 200, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#020408]">

      {/* Animated canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Deep radial glow */}
      <div className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,255,180,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Top-left accent */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full z-0"
        style={{
          background: "radial-gradient(circle, rgba(0,200,255,0.08) 0%, transparent 70%)",
          transform: "translate(-40%, -40%)",
        }}
      />

      {/* Bottom-right accent */}
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full z-0"
        style={{
          background: "radial-gradient(circle, rgba(120,0,255,0.08) 0%, transparent 70%)",
          transform: "translate(40%, 40%)",
        }}
      />

      {/* Main card */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <div
          className="rounded-3xl p-10 text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(0,255,180,0.15)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 80px rgba(0,255,180,0.05), 0 0 0 1px rgba(255,255,255,0.05) inset",
          }}
        >
          {/* Shield icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(0,255,180,0.15), rgba(0,150,255,0.1))",
                border: "1px solid rgba(0,255,180,0.3)",
                boxShadow: "0 0 30px rgba(0,255,180,0.15)",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path
                  d="M20 4L6 10v10c0 8.5 6 16.5 14 19 8-2.5 14-10.5 14-19V10L20 4z"
                  stroke="url(#shieldGrad)"
                  strokeWidth="2"
                  fill="rgba(0,255,180,0.08)"
                />
                <path
                  d="M14 20l4 4 8-8"
                  stroke="#00ffb4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="shieldGrad" x1="6" y1="4" x2="34" y2="33">
                    <stop offset="0%" stopColor="#00ffb4" />
                    <stop offset="100%" stopColor="#0096ff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-5xl font-black tracking-tight mb-1"
            style={{
              background: "linear-gradient(135deg, #00ffb4 0%, #00c8ff 50%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "'Georgia', serif",
              letterSpacing: "-1px",
            }}
          >
            ArtShield
          </h1>

          {/* Tagline */}
          <p
            className="text-xs uppercase tracking-[0.3em] mb-1"
            style={{ color: "rgba(0,255,180,0.6)" }}
          >
            Digital Art Protection
          </p>

          <p className="text-sm mt-4 mb-8 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Your artwork deserves a <span style={{ color: "rgba(0,255,180,0.8)" }}>permanent identity</span>.
            Register. Protect. Own.
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>secure access</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Google Button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-semibold text-sm transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.9)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,255,180,0.1)";
              e.currentTarget.style.border = "1px solid rgba(0,255,180,0.4)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(0,255,180,0.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
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

          {/* Features row */}
          <div className="flex justify-center gap-6 mt-8">
            {["pHash Protected", "Instant Verify", "Ownership Proof"].map((f) => (
              <div key={f} className="flex flex-col items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ffb4" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
          © 2026 ArtShield • Built for creators, by creators
        </p>
      </div>
    </div>
  );
}