"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getContract } from "../blockchain";

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

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#060810",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            border: "2px solid rgba(0,229,170,0.2)",
            borderTopColor: "#00e5aa",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "rgba(0,229,170,0.5)", fontSize: "13px", fontFamily: "'DM Sans', sans-serif" }}>
            Loading ArtShield...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) return null;

  const connectWallet = async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) { alert("Please install MetaMask!"); return; }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
      setWalletConnected(true);
    } catch (err) { console.error(err); }
  };

  const registerOnBlockchain = async (phash: string) => {
    try {
      setBlockchainLoading(true);
      const contract = await getContract();
      if (!contract) return null;
      const tx = await contract.registerArtwork(phash, session.user?.name || "Unknown", session.user?.email || "Unknown");
      await tx.wait();
      setTxHash(tx.hash);
      return tx.hash;
    } catch (err) { return null; }
    finally { setBlockchainLoading(false); }
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => { if (prev >= 90) { clearInterval(interval); return prev; } return prev + 5; });
    }, 120);
  };

  const handleUpload = async () => {
    if (!file) { setError("Please upload an image first."); return; }
    setError(""); setTxHash(""); setLoading(true); simulateProgress();
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("owner_name", session.user?.name || "Unknown");
      formData.append("owner_email", session.user?.email || "Unknown");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Server error.");
      setResult(data); setProgress(100);
      if (!data.is_duplicate && walletConnected) {
        const hash = await registerOnBlockchain(data.hash);
        setHistory((prev) => [{ id: Date.now(), hash: data.hash, owner_name: data.original_owner, registered_at: data.registered_at, tx_hash: hash || undefined }, ...prev]);
      } else if (!data.is_duplicate) {
        setHistory((prev) => [{ id: Date.now(), hash: data.hash, owner_name: data.original_owner, registered_at: data.registered_at }, ...prev]);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); setResult(null); }
    setLoading(false);
  };

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) { setError("Only image files are allowed."); return; }
    setFile(selectedFile); setPreview(URL.createObjectURL(selectedFile));
    setResult(null); setError(""); setTxHash("");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragActive(false);
    handleFileSelect(e.dataTransfer.files[0] || null);
  };

  return (
    <div style={{
      minHeight: "100vh", fontFamily: "'DM Sans', sans-serif",
      background: "radial-gradient(ellipse 100% 60% at 50% 0%, #0a1628 0%, #060810 70%)",
      color: "rgba(255,255,255,0.92)",
    }}>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", height: "60px",
        background: "rgba(6,8,16,0.85)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "160px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "9px", flexShrink: 0,
            background: "linear-gradient(135deg, rgba(0,229,170,0.15), rgba(108,99,255,0.15))",
            border: "1px solid rgba(0,229,170,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L8 11v12c0 10.5 7 19.5 16 22 9-2.5 16-11.5 16-22V11L24 4z"
                fill="rgba(0,229,170,0.1)" stroke="#00e5aa" strokeWidth="2.5" />
              <circle cx="24" cy="24" r="2" fill="#00e5aa" />
              <path d="M24 19c-2.8 0-5 2.2-5 5s2.2 5 5 5"
                stroke="#00e5aa" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
            </svg>
          </div>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: "800",
            fontSize: "17px", letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #00e5aa, #6c63ff)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            ArtShield
          </span>
        </div>

        {/* Center Tabs */}
        <div style={{
          display: "flex", gap: "4px", padding: "4px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          {(["upload", "history"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "6px 18px", borderRadius: "8px", fontSize: "13px",
              fontWeight: "600", fontFamily: "'Syne', sans-serif",
              cursor: "pointer", transition: "all 0.2s ease",
              background: activeTab === tab ? "rgba(0,229,170,0.1)" : "transparent",
              border: activeTab === tab ? "1px solid rgba(0,229,170,0.25)" : "1px solid transparent",
              color: activeTab === tab ? "#00e5aa" : "rgba(255,255,255,0.35)",
            }}>
              {tab === "upload" ? "🛡️ Protect" : "📋 History"}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "160px", justifyContent: "flex-end" }}>

          {/* Wallet button */}
          <button onClick={connectWallet} style={{
            padding: "6px 12px", borderRadius: "9px", fontSize: "12px",
            fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease",
            fontFamily: "'Syne', sans-serif",
            background: walletConnected ? "rgba(0,229,170,0.08)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${walletConnected ? "rgba(0,229,170,0.25)" : "rgba(255,255,255,0.08)"}`,
            color: walletConnected ? "#00e5aa" : "rgba(255,255,255,0.35)",
            whiteSpace: "nowrap",
          }}>
            🦊 {walletConnected ? `${walletAddress.slice(0, 5)}...${walletAddress.slice(-3)}` : "Wallet"}
          </button>

          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {session.user?.image && (
              <img src={session.user.image} alt="avatar" style={{
                width: "30px", height: "30px", borderRadius: "50%",
                border: "1.5px solid rgba(0,229,170,0.3)", flexShrink: 0,
              }} />
            )}
            <span style={{
              fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.6)",
              maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              display: "none",
            }}
              className="sm:block"
            >
              {session.user?.name?.split(" ")[0]}
            </span>
          </div>

          {/* Sign out */}
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
            padding: "6px 12px", borderRadius: "9px", fontSize: "12px",
            fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease",
            fontFamily: "'Syne', sans-serif",
            background: "rgba(255,77,109,0.06)",
            border: "1px solid rgba(255,77,109,0.2)",
            color: "rgba(255,77,109,0.8)",
            whiteSpace: "nowrap",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,77,109,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,77,109,0.06)"; }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Wallet warning */}
        {!walletConnected && (
          <div style={{
            marginBottom: "20px", padding: "12px 16px", borderRadius: "14px",
            background: "rgba(255,179,71,0.06)",
            border: "1px solid rgba(255,179,71,0.2)",
            display: "flex", alignItems: "center", gap: "10px", fontSize: "13px",
            color: "rgba(255,179,71,0.8)",
          }}>
            <span>⚠️</span>
            <span style={{ flex: 1 }}>Connect MetaMask to register artwork on blockchain</span>
            <button onClick={connectWallet} style={{
              padding: "5px 12px", borderRadius: "8px", fontSize: "12px",
              fontWeight: "600", cursor: "pointer",
              background: "rgba(255,179,71,0.1)",
              border: "1px solid rgba(255,179,71,0.3)",
              color: "rgba(255,179,71,0.9)",
            }}>
              Connect
            </button>
          </div>
        )}

        {/* ===== UPLOAD TAB ===== */}
        {activeTab === "upload" && (
          <div style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}>

            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <h1 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: "800",
                fontSize: "clamp(28px, 5vw, 40px)", letterSpacing: "-1.5px",
                lineHeight: 1.1, marginBottom: "10px",
                background: "linear-gradient(135deg, #ffffff 0%, rgba(0,229,170,0.9) 50%, #6c63ff 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Protect Your Artwork
              </h1>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                Upload your creation — get a visual fingerprint and permanent ownership proof
              </p>
            </div>

            {/* Upload Card */}
            <div style={{
              borderRadius: "20px", padding: "24px", marginBottom: "20px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 4px 40px rgba(0,0,0,0.3)",
            }}>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                style={{
                  borderRadius: "16px", padding: "40px 20px",
                  textAlign: "center", cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: `2px dashed ${dragActive ? "#00e5aa" : "rgba(255,255,255,0.1)"}`,
                  background: dragActive ? "rgba(0,229,170,0.04)" : "transparent",
                }}
              >
                <div style={{
                  width: "56px", height: "56px", borderRadius: "16px", margin: "0 auto 16px",
                  background: "rgba(0,229,170,0.08)",
                  border: "1px solid rgba(0,229,170,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="#00e5aa" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                </div>
                {file ? (
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#00e5aa" }}>{file.name}</p>
                ) : (
                  <>
                    <p style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
                      Drop your artwork here
                    </p>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>
                      PNG, JPG, WEBP — click to browse
                    </p>
                  </>
                )}
                <input type="file" hidden ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
              </div>

              {/* Preview */}
              {preview && (
                <div style={{ marginTop: "16px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <img src={preview} alt="Preview" style={{ width: "100%", maxHeight: "280px", objectFit: "cover", display: "block" }} />
                </div>
              )}

              {/* Progress */}
              {loading && (
                <div style={{ marginTop: "16px", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "2px", width: `${progress}%`,
                    background: "linear-gradient(90deg, #00e5aa, #6c63ff)",
                    transition: "width 0.2s ease",
                  }} />
                </div>
              )}

              {/* Error */}
              {error && (
                <p style={{ marginTop: "12px", fontSize: "13px", textAlign: "center", color: "#ff4d6d" }}>
                  {error}
                </p>
              )}

              {/* Analyze Button */}
              <button onClick={handleUpload} disabled={loading || blockchainLoading} style={{
                marginTop: "16px", width: "100%", padding: "14px",
                borderRadius: "14px", fontWeight: "700", fontSize: "14px",
                fontFamily: "'Syne', sans-serif",
                cursor: loading || blockchainLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                background: loading || blockchainLoading
                  ? "rgba(255,255,255,0.03)"
                  : "linear-gradient(135deg, rgba(0,229,170,0.12), rgba(108,99,255,0.12))",
                border: `1px solid ${loading || blockchainLoading ? "rgba(255,255,255,0.07)" : "rgba(0,229,170,0.25)"}`,
                color: loading || blockchainLoading ? "rgba(255,255,255,0.25)" : "#00e5aa",
                boxShadow: loading || blockchainLoading ? "none" : "0 0 30px rgba(0,229,170,0.08)",
              }}>
                {blockchainLoading ? "⛓️ Registering on Blockchain..." : loading ? "🔍 Analyzing Artwork..." : "🛡️ Analyze & Register Artwork"}
              </button>
            </div>

            {/* Results */}
            {result && (
              <div style={{
                borderRadius: "20px", overflow: "hidden",
                border: `1px solid ${result.is_duplicate ? "rgba(255,77,109,0.25)" : "rgba(0,229,170,0.25)"}`,
                background: result.is_duplicate ? "rgba(255,77,109,0.04)" : "rgba(0,229,170,0.04)",
                backdropFilter: "blur(20px)",
                animation: "fadeUp 0.4s ease",
              }}>

                {/* Status header */}
                <div style={{
                  padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px",
                  borderBottom: `1px solid ${result.is_duplicate ? "rgba(255,77,109,0.15)" : "rgba(0,229,170,0.15)"}`,
                }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "12px",
                    background: result.is_duplicate ? "rgba(255,77,109,0.1)" : "rgba(0,229,170,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
                  }}>
                    {result.is_duplicate ? "⚠️" : "✅"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontFamily: "'Syne', sans-serif", fontWeight: "700", fontSize: "14px",
                      color: result.is_duplicate ? "#ff4d6d" : "#00e5aa",
                    }}>
                      {result.is_duplicate ? "Potential Copy Detected" : "Original Artwork Registered!"}
                    </p>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                      {result.message}
                    </p>
                  </div>
                  <span style={{
                    padding: "4px 12px", borderRadius: "20px", fontSize: "12px",
                    fontWeight: "700", fontFamily: "'Syne', sans-serif",
                    background: result.similarity >= 80
                      ? "rgba(255,77,109,0.12)"
                      : result.similarity >= 50
                      ? "rgba(255,179,71,0.12)"
                      : "rgba(0,229,170,0.12)",
                    color: result.similarity >= 80 ? "#ff4d6d" : result.similarity >= 50 ? "#ffb347" : "#00e5aa",
                    border: `1px solid ${result.similarity >= 80 ? "rgba(255,77,109,0.2)" : result.similarity >= 50 ? "rgba(255,179,71,0.2)" : "rgba(0,229,170,0.2)"}`,
                  }}>
                    {result.similarity}% match
                  </span>
                </div>

                {/* Info grid */}
                <div style={{ padding: "20px", display: "grid", gap: "12px" }}>

                  {/* Fingerprint */}
                  <div style={{
                    padding: "14px 16px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <p style={{ fontSize: "10px", fontFamily: "'Syne', sans-serif", fontWeight: "600", letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: "6px" }}>
                      Visual Fingerprint
                    </p>
                    <p style={{ fontSize: "12px", fontFamily: "'DM Mono', monospace", color: "#00e5aa", wordBreak: "break-all" }}>
                      {result.hash}
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ padding: "14px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p style={{ fontSize: "10px", fontFamily: "'Syne', sans-serif", fontWeight: "600", letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: "6px" }}>
                        {result.is_duplicate ? "Original Owner" : "Registered By"}
                      </p>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.9)" }}>{result.original_owner}</p>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {result.original_email}
                      </p>
                    </div>

                    <div style={{ padding: "14px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p style={{ fontSize: "10px", fontFamily: "'Syne', sans-serif", fontWeight: "600", letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: "6px" }}>
                        {result.is_duplicate ? "Originally Registered" : "Registered On"}
                      </p>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>{result.registered_at}</p>
                    </div>
                  </div>

                  {txHash && (
                    <div style={{ padding: "14px 16px", borderRadius: "12px", background: "rgba(0,229,170,0.03)", border: "1px solid rgba(0,229,170,0.15)" }}>
                      <p style={{ fontSize: "10px", fontFamily: "'Syne', sans-serif", fontWeight: "600", letterSpacing: "0.15em", color: "#00e5aa", textTransform: "uppercase", marginBottom: "6px" }}>
                        ⛓️ Blockchain Transaction
                      </p>
                      <p style={{ fontSize: "12px", fontFamily: "'DM Mono', monospace", color: "#00e5aa", wordBreak: "break-all", opacity: 0.8 }}>
                        {txHash}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {activeTab === "history" && (
          <div style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease" }}>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <h1 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: "800",
                fontSize: "32px", letterSpacing: "-1px", marginBottom: "8px",
                background: "linear-gradient(135deg, #ffffff, rgba(0,229,170,0.8))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Registered Artworks
              </h1>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>Your protected artworks this session</p>
            </div>

            {history.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px 20px", borderRadius: "20px",
                border: "2px dashed rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.01)",
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎨</div>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>
                  No artworks registered yet
                </p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.2)", marginBottom: "20px" }}>
                  Go to Protect tab and upload your first artwork!
                </p>
                <button onClick={() => setActiveTab("upload")} style={{
                  padding: "10px 24px", borderRadius: "12px", fontSize: "13px",
                  fontWeight: "700", fontFamily: "'Syne', sans-serif", cursor: "pointer",
                  background: "rgba(0,229,170,0.08)",
                  border: "1px solid rgba(0,229,170,0.2)", color: "#00e5aa",
                }}>
                  Start Protecting →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {history.map((art, i) => (
                  <div key={art.id} style={{
                    padding: "16px 18px", borderRadius: "16px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                    backdropFilter: "blur(20px)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{
                        width: "42px", height: "42px", borderRadius: "12px", flexShrink: 0,
                        background: "rgba(0,229,170,0.08)",
                        border: "1px solid rgba(0,229,170,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
                      }}>
                        🖼️
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "12px", fontFamily: "'DM Mono', monospace", color: "#00e5aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {art.hash}
                        </p>
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "3px" }}>
                          {art.registered_at}
                        </p>
                      </div>
                      <span style={{
                        padding: "4px 10px", borderRadius: "8px", fontSize: "11px",
                        fontWeight: "700", fontFamily: "'Syne', sans-serif", flexShrink: 0,
                        background: "rgba(0,229,170,0.08)",
                        border: "1px solid rgba(0,229,170,0.2)", color: "#00e5aa",
                      }}>
                        ✓ Original
                      </span>
                    </div>
                    {art.tx_hash && (
                      <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <p style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#00e5aa", opacity: 0.6 }}>
                          ⛓️ {art.tx_hash.slice(0, 32)}...
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "20px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        fontSize: "11px", color: "rgba(255,255,255,0.15)",
        letterSpacing: "0.05em",
      }}>
        © 2026 ArtShield • Digital Art Protection • Built for creators
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
