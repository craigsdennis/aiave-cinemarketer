export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-t border-white/10 text-center py-3 z-50">
      <div className="text-sm text-blue-200">
        Built with 🧡 on{' '}
        <a
          href="https://agents.cloudflare.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-400 hover:text-orange-300 transition-colors underline"
        >
          Cloudflare Agents SDK
        </a>
        {' '}for{' '}
        <a
          href="https://aiavenue.show"
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-400 hover:text-orange-300 transition-colors underline"
        >
          AI Avenue
        </a>
      </div>
      <div className="text-sm text-blue-200 mt-1">
        <a
          href="https://github.com/craigsdennis/aiave-cinemarketer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-300 hover:text-blue-200 transition-colors underline"
        >
          👀 the code
        </a>
      </div>
    </footer>
  );
}