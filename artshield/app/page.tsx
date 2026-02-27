"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    try {
      setLoading(true);
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

      setHash(data.hash);
      setMessage(data.message);
    } catch (error) {
      setMessage("Error analyzing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const isDuplicate = message.toLowerCase().includes("potential");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white px-4">

      <div className="w-full max-w-lg bg-gray-800/70 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-gray-700 transition-all duration-300">

        {/* Header */}
        <h1 className="text-5xl font-extrabold mb-3 text-center bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          ArtShield
        </h1>

        <p className="text-gray-400 text-center mb-8 text-sm tracking-wide">
          Protect your digital artwork with AI-powered fingerprint detection
        </p>

        {/* Upload Area */}
        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer hover:border-cyan-400 hover:bg-gray-700/30 transition-all duration-300">
          <span className="text-sm text-gray-300">
            {file ? file.name : "Click to upload or drag an image"}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Button */}
        <button
          onClick={handleUpload}
          disabled={loading}
          className="mt-8 w-full py-3 rounded-xl font-semibold transition-all duration-300 
          bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 hover:shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <div className="flex justify-center items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </div>
          ) : (
            "Upload & Analyze"
          )}
        </button>

        {/* Preview */}
        {preview && (
          <div className="mt-8">
            <img
              src={preview}
              alt="Preview"
              className="w-full rounded-2xl shadow-lg border border-gray-700"
            />
          </div>
        )}

        {/* Hash Card */}
        {hash && (
          <div className="mt-8 bg-gray-900/80 p-5 rounded-2xl text-sm break-all border border-gray-700 transition-all duration-300">
            <p className="text-gray-400 mb-2 uppercase tracking-wider text-xs">
              Visual Fingerprint
            </p>
            <p className="text-cyan-300 font-mono">{hash}</p>
          </div>
        )}

        {/* Result */}
        {message && (
          <div
            className={`mt-8 py-4 rounded-2xl font-semibold text-center transition-all duration-300 ${
              isDuplicate
                ? "bg-red-600/90 shadow-red-500/40 shadow-lg"
                : "bg-green-600/90 shadow-green-500/40 shadow-lg"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 text-gray-500 text-xs">
        © 2026 ArtShield • Digital Art Protection
      </footer>
    </div>
  );
}