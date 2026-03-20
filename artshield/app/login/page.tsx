"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getContract } from "./blockchain";

interface UploadResult {
  hash: string;
  similarity: number;
  message: string;
  is_duplicate: boolean;
  original_owner: string;
  original_email: string;
  registered_at: string;
}

interface ArtworkHistory {
  id: number;
  hash: string;
  owner_name: string;
  registered_at: string;
  tx_hash?: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");
  const [history, setHistory] = useState<ArtworkHistory[]>([]);
  const [txHash, setTxHash] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Animated background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; color: string;
    }[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.5 ? "0,255,180" : "120,80,255",
    }));

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
        ctx.fill();
      });
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0,255,180,${0.08 * (1 - dist / 100)})`;
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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020408]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "rgba(0,255,180,0.6)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "rgba(0,255,180,0.5)" }}>Loading ArtShield...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Connect MetaMask wallet
  const connectWallet = async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        alert("Please install MetaMask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
      setWalletConnected(true);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  // Register on blockchain
  const registerOnBlockchain = async (phash: string) => {
    try {
      setBlockchainLoading(true);
      const contract = await getContract();
      if (!contract) return;

      const tx = await contract.registerArtwork(
        phash,
        session.user?.name || "Unknown",
        session.user?.email || "Unknown"
      );

      await tx.wait();
      setTxHash(tx.hash);
      return tx.hash;
    } catch (err) {
      console.error("Blockchain registration failed:", err);
      return null;
    } finally {
      setBlockchainLoading(false);
    }
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) { clearInterval(interval); return prev; }
        return prev + 5;
      });
    }, 120);
  };

  const handleUpload = async () => {
    if (!file) { setError("Please upload an image first."); return; }
    setError("");
    setTxHash("");
    setLoading(true);
    simulateProgress();

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("owner_name", session.user?.name || "Unknown");
      formData.append("owner_email", session.user?.email || "Unknown");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Server error.");

      setResult(data);
      setProgress(100);

      // If original → register on blockchain
      if (!data.is_duplicate && walletConnected) {
        const hash = await registerOnBlockchain(data.hash);
        const newEntry: ArtworkHistory = {
          id: Date.now(),
          hash: data.hash,
          owner_name: data.original_owner,
          registered_at: data.registered_at,
          tx_hash: hash || undefined,
        };
        setHistory((prev) => [newEntry, ...prev]);
      } else if (!data.is_duplicate) {
        setHistory((prev) => [{
          id: Date.now(),
          hash: data.hash,
          owner_name: data.original_owner,
          registered_at: data.registered_at,
        }, ...prev]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setResult(null);
    }
    setLoading(false);
  };

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) { setError("Only image files are allowed."); return; }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError("");
    setTxHash("");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files[0] || null);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "#020408", color: "white" }}>

      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 20% 20%, rgba(0,255,180,0.04) 0%, transparent 70%)" }} />
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 80% 80%, rgba(120,80,255,0.05) 0%, transparent 70%)" }} />

      {/* NAVBAR */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(0,255,180,0.2), rgba(120,80,255,0.2))", border: "1px solid rgba(0,255,180,0.3)" }}>
            <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L6 10v10c0 8.5 6 16.5 14 19 8-2.5 14-10.5 14-19V10L20 4z"
                stroke="#00ffb4" strokeWidth="2.5" fill="rgba(0,255,180,0.1)" />
              <path d="M14 20l4 4 8-8" stroke="#00ffb4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-black text-lg tracking-tight"
            style={{ background: "linear-gradient(135deg, #00ffb4, #7850ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "Georgia, serif" }}>
            ArtShield
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-xl p-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["upload", "history"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize"
              style={{
                background: activeTab === tab ? "rgba(0,255,180,0.12)" : "transparent",
                color: activeTab === tab ? "#00ffb4" : "rgba(255,255,255,0.4)",
                border: activeTab === tab ? "1px solid rgba(0,255,180,0.25)" : "1px solid transparent",
              }}>
              {tab === "upload" ? "🛡️ Protect" : "📋 History"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Wallet Connect Button */}
          <button onClick={connectWallet}
            className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{
              background: walletConnected ? "rgba(0,255,180,0.08)" : "rgba(255,255,255,0.05)",
              border: walletConnected ? "1px solid rgba(0,255,180,0.3)" : "1px solid rgba(255,255,255,0.1)",
              color: walletConnected ? "#00ffb4" : "rgba(255,255,255,0.5)",
            }}>
            {walletConnected ? `🦊 ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "🦊 Connect Wallet"}
          </button>

          {session.user?.image && (
            <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full"
              style={{ border: "2px solid rgba(0,255,180,0.3)" }} />
          )}
          <div className="hidden sm:block">
            <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{session.user?.name}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{session.user?.email}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{ background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.2)", color: "rgba(255,100,100,0.8)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,60,60,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,60,60,0.08)"; }}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-10">

        {/* Wallet warning */}
        {!walletConnected && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-3"
            style={{ background: "rgba(255,180,0,0.06)", border: "1px solid rgba(255,180,0,0.2)", color: "rgba(255,180,0,0.8)" }}>
            ⚠️ Connect your MetaMask wallet to register artwork on blockchain!
            <button onClick={connectWallet} className="ml-auto text-xs px-3 py-1 rounded-lg"
              style={{ background: "rgba(255,180,0,0.1)", border: "1px solid rgba(255,180,0,0.3)" }}>
              Connect Now
            </button>
          </div>
        )}

        {/* UPLOAD TAB */}
        {activeTab === "upload" && (
          <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s ease" }}>

            <div className="text-center mb-10">
              <h1 className="text-4xl font-black mb-3"
                style={{ fontFamily: "Georgia, serif", background: "linear-gradient(135deg, #ffffff 0%, rgba(0,255,180,0.9) 50%, #7850ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Protect Your Artwork
              </h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                Upload your creation — we'll fingerprint it and register ownership on blockchain
              </p>
            </div>

            <div className="rounded-2xl p-6 mb-6"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>

              <div onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className="rounded-xl p-10 text-center cursor-pointer transition-all duration-300"
                style={{
                  border: dragActive ? "2px dashed rgba(0,255,180,0.6)" : "2px dashed rgba(255,255,255,0.1)",
                  background: dragActive ? "rgba(0,255,180,0.05)" : "rgba(255,255,255,0.01)",
                }}>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(0,255,180,0.08)", border: "1px solid rgba(0,255,180,0.2)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0,255,180,0.8)" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {file ? (
                    <p className="text-sm font-medium" style={{ color: "rgba(0,255,180,0.9)" }}>{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Drop your artwork here</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>or click to browse — PNG, JPG, WEBP</p>
                    </>
                  )}
                </div>
                <input type="file" hidden ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
              </div>

              {preview && (
                <div className="mt-4 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  <img src={preview} alt="Preview" className="w-full max-h-64 object-cover" />
                </div>
              )}

              {loading && (
                <div className="mt-4 w-full rounded-full h-1 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-1 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%`, background: "linear-gradient(90deg, #00ffb4, #7850ff)" }} />
                </div>
              )}

              {error && <p className="mt-3 text-xs text-center" style={{ color: "rgba(255,100,100,0.9)" }}>{error}</p>}

              <button onClick={handleUpload} disabled={loading || blockchainLoading}
                className="mt-5 w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300"
                style={{
                  background: (loading || blockchainLoading) ? "rgba(0,255,180,0.05)" : "linear-gradient(135deg, rgba(0,255,180,0.15), rgba(120,80,255,0.15))",
                  border: "1px solid rgba(0,255,180,0.3)",
                  color: (loading || blockchainLoading) ? "rgba(255,255,255,0.3)" : "#00ffb4",
                  boxShadow: (loading || blockchainLoading) ? "none" : "0 0 20px rgba(0,255,180,0.08)",
                }}>
                {blockchainLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: "rgba(0,255,180,0.4)", borderTopColor: "transparent" }} />
                    Registering on Blockchain...
                  </span>
                ) : loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: "rgba(0,255,180,0.4)", borderTopColor: "transparent" }} />
                    Analyzing Artwork...
                  </span>
                ) : "🛡️ Analyze & Register Artwork"}
              </button>
            </div>

            {/* Results */}
            {result && (
              <div className="rounded-2xl overflow-hidden"
                style={{
                  border: result.is_duplicate ? "1px solid rgba(255,80,80,0.25)" : "1px solid rgba(0,255,180,0.25)",
                  background: result.is_duplicate ? "rgba(255,60,60,0.04)" : "rgba(0,255,180,0.04)",
                  backdropFilter: "blur(20px)",
                }}>

                <div className="px-6 py-4 flex items-center gap-3"
                  style={{ borderBottom: result.is_duplicate ? "1px solid rgba(255,80,80,0.15)" : "1px solid rgba(0,255,180,0.15)" }}>
                  <span className="text-2xl">{result.is_duplicate ? "⚠️" : "✅"}</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: result.is_duplicate ? "#ff6464" : "#00ffb4" }}>
                      {result.is_duplicate ? "Potential Copy Detected" : "Original Artwork Registered!"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{result.message}</p>
                  </div>
                  <span className="ml-auto text-xs px-3 py-1 rounded-full font-semibold"
                    style={{
                      background: result.similarity >= 80 ? "rgba(255,60,60,0.15)" : result.similarity >= 50 ? "rgba(255,180,0,0.15)" : "rgba(0,255,180,0.15)",
                      color: result.similarity >= 80 ? "#ff6464" : result.similarity >= 50 ? "#ffb400" : "#00ffb4",
                    }}>
                    {result.similarity}% match
                  </span>
                </div>

                <div className="p-6 grid grid-cols-1 gap-3">
                  <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Visual Fingerprint</p>
                    <p className="text-xs font-mono break-all" style={{ color: "rgba(0,255,180,0.8)" }}>{result.hash}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {result.is_duplicate ? "Original Owner" : "Registered By"}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{result.original_owner}</p>
                      <p className="text-xs mt-1 truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{result.original_email}</p>
                    </div>

                    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {result.is_duplicate ? "Originally Registered" : "Registered On"}
                      </p>
                      <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{result.registered_at}</p>
                    </div>
                  </div>

                  {/* Blockchain TX */}
                  {txHash && (
                    <div className="rounded-xl p-4" style={{ background: "rgba(0,255,180,0.03)", border: "1px solid rgba(0,255,180,0.15)" }}>
                      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(0,255,180,0.5)" }}>⛓️ Blockchain Transaction</p>
                      <p className="text-xs font-mono break-all" style={{ color: "rgba(0,255,180,0.8)" }}>{txHash}</p>
                    </div>
                  )}

                  <div className={`text-center py-2 rounded-lg text-sm font-semibold ${
                    result.similarity >= 80 ? "bg-red-500/20 text-red-400" :
                    result.similarity >= 50 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-green-500/20 text-green-400"
                  }`}>
                    {result.similarity}% Similarity
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease" }}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black mb-2"
                style={{ fontFamily: "Georgia, serif", background: "linear-gradient(135deg, #ffffff, rgba(0,255,180,0.8))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Your Registered Artworks
              </h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>All artworks you've protected this session</p>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-20 rounded-2xl"
                style={{ border: "1px dashed rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.01)" }}>
                <p className="text-4xl mb-4">🎨</p>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>No artworks registered yet</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Go to Protect tab and upload your first artwork!</p>
                <button onClick={() => setActiveTab("upload")}
                  className="mt-6 px-6 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(0,255,180,0.1)", border: "1px solid rgba(0,255,180,0.25)", color: "#00ffb4" }}>
                  Start Protecting →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((art, i) => (
                  <div key={art.id} className="rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(0,255,180,0.08)", border: "1px solid rgba(0,255,180,0.2)" }}>
                        <span className="text-lg">🖼️</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate" style={{ color: "rgba(0,255,180,0.7)" }}>{art.hash}</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{art.registered_at}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ background: "rgba(0,255,180,0.08)", color: "rgba(0,255,180,0.7)", border: "1px solid rgba(0,255,180,0.15)" }}>
                        ✓ Original
                      </span>
                    </div>
                    {art.tx_hash && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <p className="text-xs" style={{ color: "rgba(0,255,180,0.4)" }}>⛓️ TX: <span className="font-mono" style={{ color: "rgba(0,255,180,0.6)" }}>{art.tx_hash.slice(0, 20)}...</span></p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="relative z-10 text-center py-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.15)", fontSize: "11px" }}>
        © 2026 ArtShield • Digital Art Protection • Built for creators
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}