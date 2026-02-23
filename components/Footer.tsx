export default function Footer() {
  return (
    <footer className="border-t border-border-subtle py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center text-text-tertiary text-sm">
        <p>
          Built with{" "}
          <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-text-secondary transition-colors">Next.js</a> ·{" "}
          Powered by{" "}
          <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="underline hover:text-text-secondary transition-colors">Gemini AI</a> ·{" "}
          AutoBlog
        </p>
      </div>
    </footer>
  );
}
