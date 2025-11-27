export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-6">
            <span className="text-mint">Idea</span>Forge
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            AI-powered business idea generation and evaluation platform.
            Generate, score, and manage innovative software business ideas.
          </p>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface rounded-md border border-border-subtle p-5 text-center">
            <div className="w-10 h-10 bg-mint/10 rounded-md flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              AI-Powered Generation
            </h3>
            <p className="text-xs text-text-secondary">
              Generate unique business ideas using Claude and Gemini AI models
            </p>
          </div>

          <div className="bg-surface rounded-md border border-border-subtle p-5 text-center">
            <div className="w-10 h-10 bg-success/10 rounded-md flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Smart Scoring
            </h3>
            <p className="text-xs text-text-secondary">
              Evaluate ideas across multiple criteria with configurable weights
            </p>
          </div>

          <div className="bg-surface rounded-md border border-border-subtle p-5 text-center">
            <div className="w-10 h-10 bg-info/10 rounded-md flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Organized Management
            </h3>
            <p className="text-xs text-text-secondary">
              Browse, filter, and manage your ideas with powerful search tools
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center text-text-muted text-xs">
          <p>IdeaForge - Internal Tool</p>
        </div>
      </main>
    </div>
  );
}