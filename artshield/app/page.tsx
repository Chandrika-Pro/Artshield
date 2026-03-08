"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hash, setHash] = useState("");
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show spinner while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render anything if not logged in
  if (!session) return null;

  // Smooth progress simulation
  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 120);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    setError("");
    setLoading(true);
    simulateProgress();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Server error. Please try again.");
      }

      setHash(data.hash);
      setSimilarity(data.similarity);
      setProgress(100);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed.";
      setError(message);
      setSimilarity(null);
      setHash("");
    }

    setLoading(false);
  };

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setHash("");
    setSimilarity(null);
    setError("");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files[0] || null);
  };

  const getRiskLevel = () => {
    if (similarity === null) return null;
    if (similarity >= 80) return "High Risk";
    if (similarity >= 50) return "Moderate Risk";
    return "Low Risk";
  };

  const getRiskColor = () => {
    if (similarity === null) return "";
    if (similarity >= 80) return "bg-red-500/20 text-red-400";
    if (similarity >= 50) return "bg-yellow-500/20 text-yellow-400";
    return "bg-green-500/20 text-green-400";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background Glow Effects */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl top-[-100px] left-[-100px]" />
      <div className="absolute w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl bottom-[-100px] right-[-100px]" />

      <div className="relative w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl z-10">

        {/* User Info + Sign Out */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {session.user?.image && (
              <img
                src={session.user.image}
                alt="avatar"
                className="w-8 h-8 rounded-full border border-white/20"
              />
            )}
            <span className="text-sm text-gray-300">
              {session.user?.name}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-gray-500 hover:text-red-400 transition"
          >
            Sign Out
          </button>
        </div>

        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          ArtShield AI
        </h1>

        <p className="text-center text-gray-400 mt-2 text-sm">
          Advanced Artwork Similarity Detection
        </p>

        {/* Drag & Drop Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`mt-6 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
            ${dragActive ? "border-cyan-400 bg-white/10" : "border-white/20"}
          `}
        >
          {file ? (
            <p className="text-sm">{file.name}</p>
          ) : (
            <p className="text-gray-400">
              Drag & drop your artwork here or click to upload
            </p>
          )}

          <input
            type="file"
            hidden
            ref={fileInputRef}
            onChange={(e) =>
              handleFileSelect(e.target.files?.[0] || null)
            }
          />
        </div>

        {/* Image Preview */}
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="mt-6 rounded-xl shadow-lg max-h-60 w-full object-cover"
          />
        )}

        {/* Progress Bar */}
        {loading && (
          <div className="mt-4 w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">
            {error}
          </p>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleUpload}
          disabled={loading}
          className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-semibold hover:scale-105 transition disabled:opacity-50"
        >
          {loading ? "Analyzing Artwork..." : "Analyze Artwork"}
        </button>

        {/* Results */}
        {hash && similarity !== null && (
          <div className="mt-8 p-5 bg-white/10 rounded-xl border border-white/10">
            <p className="text-sm text-gray-400">Fingerprint</p>
            <p className="text-xs break-all mt-1">{hash}</p>

            <div className="mt-4 flex flex-col items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getRiskColor()}`}
              >
                {similarity}% Similarity
              </span>

              <span className="text-sm text-gray-300">
                {getRiskLevel()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}