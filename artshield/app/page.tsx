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

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    setHash(data.hash);
    setMessage(data.message);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const isDuplicate = message.includes("Potential");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black text-white px-4">

      <div className="w-full max-w-md bg-gray-800/60 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gray-700">

        <h1 className="text-4xl font-bold mb-2 text-center text-cyan-400">
          ArtShield
        </h1>

        <p className="text-gray-400 text-center mb-6">
          AI-powered visual fingerprinting & duplicate detection
        </p>

        {/* Upload Area */}
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-cyan-400 transition duration-300">
          <span className="text-sm text-gray-300">
            {file ? file.name : "Click to upload image"}
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
          className="mt-6 w-full py-3 bg-cyan-500 rounded-lg font-semibold hover:bg-cyan-400 transition duration-300"
        >
          {loading ? "Analyzing..." : "Upload & Analyze"}
        </button>

        {/* Preview */}
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="mt-6 w-full rounded-xl shadow-md"
          />
        )}

        {/* Hash */}
        {hash && (
          <div className="mt-6 bg-gray-900 p-4 rounded-xl text-sm break-all border border-gray-700">
            <p className="text-gray-400 mb-1">Visual Fingerprint</p>
            <p className="text-cyan-300">{hash}</p>
          </div>
        )}

        {/* Result */}
        {message && (
          <div
            className={`mt-6 py-3 rounded-xl font-semibold text-center ${
              isDuplicate
                ? "bg-red-600/90"
                : "bg-green-600/90"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}