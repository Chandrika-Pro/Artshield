"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      o: Math.random() * 0.35 + 0.05,
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
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,229,170,${0.1 * (1 - d / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }));
      animId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);

  const handleGetStarted = () => {
    if (session) router.push("/dashboard");
    else router.push("/login");
  };

  const s = {
    accent: "#00e5aa",
    accentPurple: "#6c63ff",
    text: "rgba(255,255,255,0.92)",
    textSub: "rgba(255,255,255,0.5)",
    textMuted: "rgba(255,255,255,0.25)",
    border: "rgba(255,255,255,0.07)",
    borderAccent: "rgba(0,229,170,0.2)",
    card: "rgba(255,255,255,0.03)",
    glow: "rgba(0,229,170,0.1)",
  };

  return (
    <div style={{
      minHeight: "100vh", fontFamily: "'DM Sans', sans-serif",
      background: "#060810", color: s.text, overflowX: "hidden",
    }}>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />

      {/* Background glows */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(10,22,40,0.9) 0%, transparent 70%)",
      }} />

      {/* ===== NAVBAR ===== */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: "64px",
        background: scrollY > 20 ? "rgba(6,8,16,0.9)" : "transparent",
        borderBottom: scrollY > 20 ? `1px solid ${s.border}` : "1px solid transparent",
        backdropFilter: scrollY > 20 ? "blur(20px)" : "none",
        transition: "all 0.3s ease",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
          onClick={() => router.push("/")}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(0,229,170,0.15), rgba(108,99,255,0.15))",
            border: `1px solid ${s.borderAccent}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L8 11v12c0 10.5 7 19.5 16 22 9-2.5 16-11.5 16-22V11L24 4z"
                fill="rgba(0,229,170,0.1)" stroke="#00e5aa" strokeWidth="2.5" />
              <circle cx="24" cy="24" r="2" fill="#00e5aa" />
              <path d="M24 19c-2.8 0-5 2.2-5 5s2.2 5 5 5"
                stroke="#00e5aa" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
            </svg>
          </div>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: "800",
            fontSize: "18px", letterSpacing: "-0.5px",
            background: `linear-gradient(135deg, ${s.accent}, ${s.accentPurple})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            ArtShield
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {["Features", "How It Works", "Tech Stack"].map((link) => (
            <a key={link} href={`#${link.toLowerCase().replace(/ /g, "-")}`} style={{
              fontSize: "14px", fontWeight: "500", color: s.textSub,
              textDecoration: "none", transition: "color 0.2s ease",
            }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = s.text; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = s.textSub; }}
            >
              {link}
            </a>
          ))}
        </div>

        {/* CTA */}
        <button onClick={handleGetStarted} style={{
          padding: "8px 20px", borderRadius: "10px", fontSize: "13px",
          fontWeight: "700", fontFamily: "'Syne', sans-serif", cursor: "pointer",
          background: "linear-gradient(135deg, rgba(0,229,170,0.15), rgba(108,99,255,0.15))",
          border: `1px solid ${s.borderAccent}`,
          color: s.accent, transition: "all 0.2s ease",
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 0 30px rgba(0,229,170,0.15)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {session ? "Go to Dashboard →" : "Get Started →"}
        </button>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section style={{
        position: "relative", zIndex: 10,
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", textAlign: "center",
        padding: "120px 20px 80px",
      }}>
        <div style={{
          maxWidth: "800px",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(30px)",
          transition: "all 1s cubic-bezier(0.16,1,0.3,1)",
        }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 16px", borderRadius: "20px", marginBottom: "32px",
            background: "rgba(0,229,170,0.06)",
            border: "1px solid rgba(0,229,170,0.2)",
          }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.accent, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "12px", fontWeight: "600", color: s.accent, fontFamily: "'Syne', sans-serif", letterSpacing: "0.05em" }}>
              AI-Powered Art Protection
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: "800",
            fontSize: "clamp(40px, 8vw, 80px)",
            letterSpacing: "-3px", lineHeight: 1.05,
            marginBottom: "24px",
          }}>
            <span style={{
              background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.9) 40%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Your Art.
            </span>
            <br />
            <span style={{
              background: "linear-gradient(135deg, #00e5aa 0%, #00b4d8 50%, #6c63ff 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Your Proof.
            </span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            color: s.textSub, lineHeight: 1.7,
            maxWidth: "560px", margin: "0 auto 40px",
          }}>
            ArtShield protects your AI-generated artwork using{" "}
            <span style={{ color: "rgba(0,229,170,0.8)", fontWeight: 500 }}>visual fingerprinting</span>
            {" "}and{" "}
            <span style={{ color: "rgba(108,99,255,0.8)", fontWeight: 500 }}>blockchain ownership records</span>
            {" "}— so you can always prove you were first.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleGetStarted} style={{
              padding: "14px 32px", borderRadius: "14px",
              fontSize: "15px", fontWeight: "700",
              fontFamily: "'Syne', sans-serif", cursor: "pointer",
              background: "linear-gradient(135deg, rgba(0,229,170,0.15), rgba(108,99,255,0.15))",
              border: "1px solid rgba(0,229,170,0.3)",
              color: s.accent, transition: "all 0.2s ease",
              boxShadow: "0 0 40px rgba(0,229,170,0.1)",
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 60px rgba(0,229,170,0.2)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 0 40px rgba(0,229,170,0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              🛡️ {session ? "Go to Dashboard" : "Start Protecting for Free"}
            </button>

            <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} style={{
              padding: "14px 32px", borderRadius: "14px",
              fontSize: "15px", fontWeight: "700",
              fontFamily: "'Syne', sans-serif", cursor: "pointer",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${s.border}`,
              color: s.textSub, transition: "all 0.2s ease",
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.color = s.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = s.textSub;
              }}
            >
              Learn How It Works
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            display: "flex", gap: "40px", justifyContent: "center",
            marginTop: "64px", flexWrap: "wrap",
          }}>
            {[
              { value: "100%", label: "Free to Use" },
              { value: "pHash", label: "Visual Fingerprinting" },
              { value: "⛓️", label: "Blockchain Secured" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <p style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: "800",
                  fontSize: "28px", letterSpacing: "-1px",
                  background: `linear-gradient(135deg, ${s.accent}, ${s.accentPurple})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: "12px", color: s.textMuted, marginTop: "4px", letterSpacing: "0.05em" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" style={{
        position: "relative", zIndex: 10,
        padding: "100px 20px", maxWidth: "1000px", margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <p style={{ fontSize: "12px", fontFamily: "'Syne', sans-serif", fontWeight: "600", letterSpacing: "0.2em", color: s.accent, textTransform: "uppercase", marginBottom: "12px" }}>
            Simple Process
          </p>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: "800",
            fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1.5px",
            background: "linear-gradient(135deg, #ffffff, rgba(255,255,255,0.6))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            How It Works
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {[
            {
              step: "01",
              icon: "🎨",
              title: "Upload Your Artwork",
              desc: "Upload any AI-generated image. Our system accepts PNG, JPG, and WEBP formats.",
              color: "#00e5aa",
            },
            {
              step: "02",
              icon: "🔍",
              title: "Generate Visual Fingerprint",
              desc: "We use perceptual hashing (pHash) to create a unique 64-bit visual fingerprint of your image — resistant to minor edits.",
              color: "#00b4d8",
            },
            {
              step: "03",
              icon: "⛓️",
              title: "Register on Blockchain",
              desc: "Your fingerprint, name, and timestamp are permanently stored on the Polygon blockchain — immutable proof of ownership.",
              color: "#6c63ff",
            },
          ].map((item, i) => (
            <div key={i} style={{
              padding: "28px", borderRadius: "20px",
              background: s.card, border: `1px solid ${s.border}`,
              backdropFilter: "blur(20px)",
              transition: "all 0.3s ease",
              position: "relative", overflow: "hidden",
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = `1px solid ${item.color}30`;
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 20px 60px ${item.color}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = `1px solid ${s.border}`;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                position: "absolute", top: "20px", right: "20px",
                fontFamily: "'Syne', sans-serif", fontWeight: "800",
                fontSize: "48px", color: `${item.color}08`,
                lineHeight: 1,
              }}>
                {item.step}
              </div>
              <div style={{
                width: "50px", height: "50px", borderRadius: "14px",
                background: `${item.color}12`,
                border: `1px solid ${item.color}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "24px", marginBottom: "16px",
              }}>
                {item.icon}
              </div>
              <h3 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: "700",
                fontSize: "17px", letterSpacing: "-0.3px",
                color: s.text, marginBottom: "10px",
              }}>
                {item.title}
              </h3>
              <p style={{ fontSize: "13px", color: s.textSub, lineHeight: 1.7 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" style={{
        position: "relative", zIndex: 10,
        padding: "100px 20px", maxWidth: "1000px", margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <p style={{ fontSize: "12px", fontFamily: "'Syne', sans-serif", fontWeight: "600", letterSpacing: "0.2em", color: s.accent, textTransform: "uppercase", marginBottom: "12px" }}>
            Why ArtShield
          </p>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: "800",
            fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1.5px",
            background: "linear-gradient(135deg, #ffffff, rgba(255,255,255,0.6))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Features
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          {[
            { icon: "👁️", title: "Edit-Resistant Detection", desc: "pHash detects copies even after brightness, contrast, or crop changes." },
            { icon: "⚡", title: "Instant Registration", desc: "Register your artwork in seconds with one click." },
            { icon: "🔒", title: "Immutable Proof", desc: "Blockchain records can never be deleted or altered." },
            { icon: "👤", title: "Owner Identity", desc: "Your name and email are permanently linked to your artwork." },
            { icon: "🕐", title: "Timestamped", desc: "Exact registration time proves you were first." },
            { icon: "🆓", title: "100% Free", desc: "No subscription, no hidden fees. Free forever." },
          ].map((f, i) => (
            <div key={i} style={{
              padding: "24px", borderRadius: "16px",
              background: s.card, border: `1px solid ${s.border}`,
              transition: "all 0.2s ease",
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = `1px solid ${s.borderAccent}`;
                e.currentTarget.style.background = "rgba(0,229,170,0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = `1px solid ${s.border}`;
                e.currentTarget.style.background = s.card;
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: "700", fontSize: "14px", color: s.text, marginBottom: "8px" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: "12px", color: s.textSub, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TECH STACK ===== */}
      <section id="tech-stack" style={{
        position: "relative", zIndex: 10,
        padding: "100px 20px", maxWidth: "1000px", margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <p style={{ fontSize: "12px", fontFamily: "'Syne', sans-serif", fontWeight: "600", letterSpacing: "0.2em", color: s.accent, textTransform: "uppercase", marginBottom: "12px" }}>
            Powered By
          </p>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: "800",
            fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-1.5px",
            background: "linear-gradient(135deg, #ffffff, rgba(255,255,255,0.6))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Tech Stack
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
          {[
            { name: "pHash", role: "Visual Fingerprinting", color: "#00e5aa", desc: "64-bit perceptual hash resistant to minor edits" },
            { name: "Polygon", role: "Blockchain", color: "#8247e5", desc: "Fast, cheap Ethereum-compatible blockchain" },
            { name: "Solidity", role: "Smart Contracts", color: "#627eea", desc: "Immutable ownership registration contracts" },
            { name: "FastAPI", role: "Backend", color: "#009688", desc: "High-performance Python API" },
            { name: "PostgreSQL", role: "Database", color: "#336791", desc: "Persistent, reliable data storage" },
            { name: "Next.js", role: "Frontend", color: "#ffffff", desc: "React framework for production apps" },
          ].map((tech, i) => (
            <div key={i} style={{
              padding: "20px", borderRadius: "16px",
              background: s.card, border: `1px solid ${s.border}`,
              textAlign: "center", transition: "all 0.2s ease",
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = `1px solid ${tech.color}30`;
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = `1px solid ${s.border}`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                fontFamily: "'Syne', sans-serif", fontWeight: "800",
                fontSize: "20px", letterSpacing: "-0.5px",
                color: tech.color, marginBottom: "6px",
              }}>
                {tech.name}
              </div>
              <div style={{
                fontSize: "10px", fontFamily: "'Syne', sans-serif",
                fontWeight: "600", letterSpacing: "0.1em",
                color: s.textMuted, textTransform: "uppercase", marginBottom: "10px",
              }}>
                {tech.role}
              </div>
              <p style={{ fontSize: "12px", color: s.textSub, lineHeight: 1.5 }}>{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section style={{
        position: "relative", zIndex: 10,
        padding: "100px 20px", textAlign: "center",
      }}>
        <div style={{
          maxWidth: "600px", margin: "0 auto",
          padding: "60px 40px", borderRadius: "28px",
          background: "rgba(0,229,170,0.03)",
          border: "1px solid rgba(0,229,170,0.15)",
          boxShadow: "0 0 100px rgba(0,229,170,0.06)",
        }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: "800",
            fontSize: "clamp(28px, 5vw, 40px)", letterSpacing: "-1.5px",
            marginBottom: "16px",
            background: "linear-gradient(135deg, #ffffff, rgba(0,229,170,0.8))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Ready to Protect Your Art?
          </h2>
          <p style={{ fontSize: "15px", color: s.textSub, marginBottom: "32px", lineHeight: 1.6 }}>
            Join ArtShield today and make sure your creativity is always protected.
          </p>
          <button onClick={handleGetStarted} style={{
            padding: "14px 40px", borderRadius: "14px",
            fontSize: "15px", fontWeight: "700",
            fontFamily: "'Syne', sans-serif", cursor: "pointer",
            background: "linear-gradient(135deg, rgba(0,229,170,0.15), rgba(108,99,255,0.15))",
            border: "1px solid rgba(0,229,170,0.3)",
            color: s.accent, transition: "all 0.2s ease",
            boxShadow: "0 0 40px rgba(0,229,170,0.1)",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 0 60px rgba(0,229,170,0.2)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 0 40px rgba(0,229,170,0.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            🛡️ {session ? "Go to Dashboard →" : "Get Started Free →"}
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{
        position: "relative", zIndex: 10,
        borderTop: `1px solid ${s.border}`,
        padding: "32px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: "800", fontSize: "16px",
            background: `linear-gradient(135deg, ${s.accent}, ${s.accentPurple})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            ArtShield
          </span>
          <span style={{ fontSize: "12px", color: s.textMuted }}>• Digital Art Protection</span>
        </div>
        <p style={{ fontSize: "12px", color: s.textMuted }}>
          © 2026 ArtShield • Built for creators, by creators
        </p>
        <div style={{ display: "flex", gap: "20px" }}>
          {["Features", "How It Works", "Dashboard"].map((link) => (
            <a key={link} href={link === "Dashboard" ? "/dashboard" : `#${link.toLowerCase().replace(/ /g, "-")}`}
              style={{ fontSize: "12px", color: s.textMuted, textDecoration: "none", transition: "color 0.2s ease" }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = s.text; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = s.textMuted; }}
            >
              {link}
            </a>
          ))}
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}