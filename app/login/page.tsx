"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyPaperKey } from "@/lib/api";
import { saveAuth } from "@/lib/auth";

const WORD_COUNT = 12;

export default function LoginPage() {
  const router = useRouter();
  const [words, setWords] = useState<string[]>(Array(WORD_COUNT).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, value: string) => {
    const updated = [...words];
    updated[index] = value.trim();
    setWords(updated);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = index + 1;
      if (next < WORD_COUNT) {
        inputsRef.current[next]?.focus();
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleaned = words.map((w) => w.trim());
    if (cleaned.some((w) => !w)) {
      setError("Enter all 12 words in the correct order.");
      setLoading(false);
      return;
    }

    try {
      const res = await verifyPaperKey(cleaned);
      const { client_hash, is_active, jurisdiction } = res as any;
      saveAuth(client_hash, is_active, jurisdiction);
      router.push(`/${jurisdiction}/dashboard`);
    } catch (err: any) {
      if (err?.status === 401) {
        setError("Paper key not recognised. Check the words and order.");
      } else if (err?.status === 429) {
        setError("Too many attempts. Please wait before trying again.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4">
      <div className="max-w-2xl w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="mb-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-slate-300">
            SOVEREIGN VAULT
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Enter Paper Key</h1>
          <p className="mt-1 text-xs text-slate-400">
            12-word credential for your forensic R&amp;D vault.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: WORD_COUNT }).map((_, idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-[10px] text-slate-400">
                  {idx + 1}
                </label>
                <input
                  ref={(el) => {
                    inputsRef.current[idx] = el;
                  }}
                  type="text"
                  className="w-full rounded-md bg-white/10 border border-white/10 px-2 py-1.5 text-center text-xs text-white font-mono-hash focus:outline-none focus:ring-1 focus:ring-[#003153] focus:border-[#003153]"
                  value={words[idx]}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-md bg-[#003153] hover:bg-[#003153]/90 text-sm font-medium py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Unlocking…" : "Unlock Vault"}
          </button>
        </form>

        <div className="mt-4 text-xs text-slate-400">
          New client?{" "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-slate-200"
            onClick={() => router.push("/generate-key")}
          >
            Generate your Paper Key →
          </button>
        </div>
      </div>
    </main>
  );
}

