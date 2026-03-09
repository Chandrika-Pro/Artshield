"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UploadResult {
  hash: string;
  similarity: number;
  message: string;
  is_duplicate: boolean;
  original_owner: string;
  original_email: string;
  registered_at: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
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

      // Phase 2: Send owner info from Google session
      formData.append("owner_name", session.user?.name || "Unknown");
      formData.append("owner_email", session.user?.email || "Unknown");

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

      setResult(data);
      setProgress(100);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed.";
      setError(message);
      setResult(null);
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
    setResult(null);
    setError("");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files[0] || null);
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
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
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
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
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
        {result && (
          <div className={`mt-8 p-5 rounded-xl border transition-all duration-300 ${
            result.is_duplicate
              ? "bg-red-500/10 border-red-500/30"
              : "bg-green-500/10 border-green-500/30"
          }`}>

            {/* Status Message */}
            <p className={`text-center font-semibold text-sm mb-4 ${
              result.is_duplicate ? "text-red-400" : "text-green-400"
            }`}>
              {result.message}
            </p>

            {/* Fingerprint */}
            <div className="bg-white/5 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-400 mb-1">Visual Fingerprint</p>
              <p className="text-xs text-cyan-300 font-mono break-all">{result.hash}</p>
            </div>

            {/* Owner Info */}
            <div className="bg-white/5 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-400 mb-1">
                {result.is_duplicate ? "Original Owner" : "Registered By"}
              </p>
              <p className="text-sm text-white font-semibold">{result.original_owner}</p>
              <p className="text-xs text-gray-400">{result.original_email}</p>
            </div>

            {/* Timestamp */}
            <div className="bg-white/5 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-400 mb-1">
                {result.is_duplicate ? "Originally Registered On" : "Registered On"}
              </p>
              <p className="text-sm text-white">{result.registered_at}</p>
            </div>

            {/* Similarity */}
            <div className={`text-center py-2 rounded-lg text-sm font-semibold ${
              result.similarity >= 80
                ? "bg-red-500/20 text-red-400"
                : result.similarity >= 50
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-green-500/20 text-green-400"
            }`}>
              {result.similarity}% Similarity
            </div>
          </div>
        )}
      </div>
    </div>
  );
}