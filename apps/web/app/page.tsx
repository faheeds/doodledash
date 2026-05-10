export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-400 flex items-center justify-center">
      <div className="text-center px-8">
        {/* Logo area */}
        <div className="mb-6">
          <span className="text-8xl">🎨</span>
        </div>

        <h1 className="text-6xl font-black text-white drop-shadow-lg mb-4 tracking-tight">
          Doodle Dash
        </h1>

        <p className="text-2xl font-bold text-white/90 mb-2">
          The competitive drawing game for kids!
        </p>

        <p className="text-lg text-white/75 mb-10 max-w-md mx-auto">
          Draw fast. Vote for the funniest. Let the AI judge decide. Ages 8–13.
        </p>

        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 inline-block border-2 border-white/40">
          <p className="text-white font-bold text-xl mb-1">🚀 Coming Soon</p>
          <p className="text-white/80 text-sm">Building something awesome — check back soon!</p>
        </div>

        <div className="mt-12 flex justify-center gap-6 text-4xl">
          <span title="Draw">✏️</span>
          <span title="Compete">🏆</span>
          <span title="Vote">⭐</span>
          <span title="Have fun">🎉</span>
        </div>
      </div>
    </main>
  );
}
