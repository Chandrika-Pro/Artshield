export default function Navbar() {
  return (
    <nav className="w-full flex justify-between items-center px-8 py-4 border-b border-white/10 backdrop-blur-md bg-black/40">
      
      <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
        ArtShield AI
      </h1>

      <div className="flex items-center gap-6 text-sm text-gray-300">
        <a
          href="/"
          className="hover:text-white transition"
        >
          Home
        </a>

        <a
          href="/dashboard"
          className="hover:text-white transition"
        >
          Dashboard
        </a>
      </div>

    </nav>
  );
}