import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#0a0f1a] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,49,83,0.32),_transparent_60%)]" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="w-full px-8 py-6 flex items-center justify-between">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-200">
            SOVEREIGN VAULT
          </div>
          <Link
            href="/login"
            className="text-sm text-slate-200 hover:text-white underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </header>

        <section className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in">
          <div className="max-w-4xl text-center space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
              Your R&amp;D. Cryptographically Proven.
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto">
              Automated forensic evidence capture for HMRC, IRS, and FTA R&amp;D
              tax claims. Every block, every signal, archived against the
              regulator that matters.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/login"
                className="px-6 py-3 rounded-md bg-white text-[#0a0f1a] text-sm font-medium shadow-sm hover:bg-slate-100"
              >
                Login with Paper Key
              </Link>
              <Link
                href="/generate-key"
                className="px-6 py-3 rounded-md border border-[#003153] text-sm font-medium text-white hover:bg-[#003153]/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        <section className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-6 py-10">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                <p className="text-xs tracking-[0.25em] uppercase text-slate-300 mb-2">
                  HMRC
                </p>
                <p className="text-sm font-medium">UK R&amp;D Tax Relief</p>
                <p className="text-xs text-slate-400 mt-2">33% benefit rate</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                <p className="text-xs tracking-[0.25em] uppercase text-slate-300 mb-2">
                  IRS
                </p>
                <p className="text-sm font-medium">Section 41 Credit</p>
                <p className="text-xs text-slate-400 mt-2">
                  20% federal rate
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                <p className="text-xs tracking-[0.25em] uppercase text-slate-300 mb-2">
                  FTA / ZATCA
                </p>
                <p className="text-sm font-medium">UAE &amp; Saudi Arabia</p>
                <p className="text-xs text-slate-400 mt-2">
                  50% qualifying rate
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="relative z-10 px-6 py-4 text-center text-[11px] text-slate-500">
          Forensic evidence. Not financial advice.
        </footer>
      </div>
    </main>
  );
}

