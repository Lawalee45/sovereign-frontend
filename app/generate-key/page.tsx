"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onboardClient } from "@/lib/api";

const WORD_COUNT = 12;

const WORD_LIST: string[] = [
  "signal",
  "ledger",
  "vector",
  "cipher",
  "anchor",
  "metric",
  "kernel",
  "static",
  "packet",
  "archive",
  "circuit",
  "delta",
  "matrix",
  "vertex",
  "quantum",
  "buffer",
  "ciphertext",
  "audit",
  "entropy",
  "hash",
  "key",
  "anchor",
  "record",
  "evidence",
  "vector",
  "binary",
  "cluster",
  "ledger",
  "buffer",
  "module",
  "policy",
  "schema",
  "table",
  "window",
  "thread",
  "socket",
  "kernel",
  "packet",
  "channel",
  "cursor",
  "stream",
  "domain",
  "domain",
  "switch",
  "branch",
  "index",
  "column",
  "row",
  "ratio",
  "margin",
  "profit",
  "loss",
  "credit",
  "debit",
  "signal",
  "metric",
  "risk",
  "hedge",
  "option",
  "future",
  "bond",
  "equity",
  "volume",
  "spread",
  "vector",
  "basis",
  "gamma",
  "theta",
  "vega",
  "delta",
  "margin",
  "rate",
  "cap",
  "floor",
  "swap",
  "notional",
  "limit",
  "order",
  "ticket",
  "ledger",
  "factor",
  "hurdle",
  "stack",
  "branch",
  "epoch",
  "window",
  "kernel",
  "round",
  "cipher",
  "anchor",
  "vector",
  "signal",
  "metric",
  "packet",
  "record",
  "evidence",
  "audit",
  "ledger",
  "cursor",
  "buffer",
  "static",
  "matrix",
  "vertex",
  "delta",
  "block",
  "chain",
  "oracle",
  "shard",
  "node",
  "vault",
  "mirror",
  "bridge",
  "index",
  "oracle",
  "anchor",
  "credit",
  "claim",
  "tax",
  "return",
  "policy",
  "fixture",
  "probe",
  "vector",
  "kernel",
  "entropy",
  "signal",
  "horizon",
  "alpha",
  "beta",
  "gamma",
  "measure",
  "series",
  "window",
  "buffer",
  "nonce",
  "salt",
  "pepper",
  "cipher",
  "ledger",
  "index",
  "vector",
  "delta",
  "static",
  "matrix",
  "audit",
  "record",
  "evidence",
  "vault",
  "bridge",
  "chain",
  "block",
  "oracle",
  "signal",
  "metric",
  "packet",
  "kernel",
  "node",
  "stack",
  "frame",
  "thread",
  "sample",
  "vector",
  "anchor",
  "cipher",
  "entropy",
  "hash",
  "series",
  "window",
  "buffer"
];

function pickRandomWords(list: string[], count: number): string[] {
  const copy = [...list];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export default function GenerateKeyPage() {
  const router = useRouter();
  const [words, setWords] = useState<string[]>([]);
  const [ack1, setAck1] = useState(false);
  const [ack2, setAck2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWords(pickRandomWords(WORD_LIST, WORD_COUNT));
  }, []);

  const handleConfirm = async () => {
    if (!ack1 || !ack2 || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onboardClient(words, "uk");
      router.push("/login");
    } catch (err) {
      setError("Onboarding failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4">
      <div className="max-w-2xl w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="mb-4">
          <p className="text-[11px] tracking-[0.3em] uppercase text-slate-300">
            SOVEREIGN VAULT
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Generate Your Paper Key</h1>
          <p className="mt-1 text-xs text-slate-400">
            This 12-word sequence is the only way to recover your forensic vault.
          </p>
        </div>

        <div className="mb-4 rounded-md border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          You are about to receive your vault access credential. Write these
          words down. They cannot be recovered.
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {words.map((word, idx) => (
            <div
              key={idx}
              className="rounded-md bg-white/10 border border-white/10 px-3 py-2"
            >
              <div className="text-[10px] text-slate-400 mb-1">{idx + 1}</div>
              <div className="font-mono-hash text-xs text-white break-all">
                {word}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 text-xs text-slate-200 mb-4">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-[3px] h-3 w-3 border border-slate-500 bg-black/40"
              checked={ack1}
              onChange={(e) => setAck1(e.target.checked)}
            />
            <span>I have written down all 12 words in the correct order.</span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-[3px] h-3 w-3 border border-slate-500 bg-black/40"
              checked={ack2}
              onChange={(e) => setAck2(e.target.checked)}
            />
            <span>
              I understand this key cannot be recovered or reset.
            </span>
          </label>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-md px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!ack1 || !ack2 || loading}
          onClick={handleConfirm}
          className="w-full rounded-md bg-[#003153] hover:bg-[#003153]/90 text-sm font-medium py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Securing..." : "Secure My Vault"}
        </button>
      </div>
    </main>
  );
}

