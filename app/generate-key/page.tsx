"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onboardWithJurisdiction } from "@/lib/api";

const WORD_COUNT = 12;
const JURISDICTIONS = [
  { value: "uk", label: "UK" },
  { value: "us", label: "US" },
  { value: "uae", label: "UAE" },
] as const;

const WORD_LIST: string[] = [
  "apple", "bird", "bridge", "cloud", "coast", "creek", "daisy", "dolphin",
  "eagle", "field", "flame", "forest", "grape", "haven", "hills", "horse",
  "ivy", "lake", "lamp", "leaf", "maple", "moon", "mountain", "ocean",
  "olive", "orchid", "otter", "pearl", "pine", "pond", "river", "rock",
  "rose", "sand", "shell", "shore", "sky", "star", "stone", "stream",
  "sun", "swan", "tiger", "tulip", "valley", "water", "wave", "wolf",
  "anchor", "basket", "bench", "blade", "brush", "candle", "clock", "cloth",
  "coral", "crown", "cup", "desk", "door", "drum", "feather", "flask",
  "gate", "glass", "hammer", "key", "knife", "ladder", "lantern", "lock",
  "mirror", "needle", "paper", "path", "plate", "ring", "rope", "shelf",
  "shield", "spoon", "table", "thread", "tower", "vase", "wheel", "window",
  "alder", "birch", "cedar", "clover", "fern", "frost", "haze", "honey",
  "jade", "jasmine", "juniper", "larch", "lily", "moss", "nectar", "oak",
  "petal", "quartz", "rain", "snow", "spruce", "storm", "thorn", "vine",
  "willow", "amber", "basin", "beacon", "bloom", "breeze", "canopy", "cascade",
  "dawn", "dusk", "ember", "garden", "glade", "grove", "harbor", "haven",
  "hedge", "horizon", "meadow", "mist", "pebble", "prairie", "ridge", "summit",
  "timber", "twig", "acorn", "berry", "blossom", "bough", "brook", "bush",
  "chime", "cipher", "cobalt", "coral", "crimson", "crystal", "ember", "flint",
  "garnet", "glacier", "granite", "haze", "hearth", "ivory", "jade", "jet",
  "lime", "marble", "mint", "opal", "pearl", "rust", "sapphire", "silver",
  "slate", "steel", "topaz", "umber", "zinc", "arch", "beam", "bolt", "card",
  "chord", "code", "curve", "digit", "flask", "frame", "gauge", "grid",
  "hinge", "latch", "lever", "logic", "matrix", "pixel", "pulse", "relay",
  "scope", "sensor", "signal", "socket", "token", "trace", "vector", "volt",
];

function pickRandomWords(list: string[], count: number): string[] {
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function GenerateKeyPage() {
  const router = useRouter();
  const [jurisdiction, setJurisdiction] = useState<string>("uk");
  const [words, setWords] = useState<string[] | null>(null);
  const [ack, setAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => ["uk", "us", "uae"].includes(jurisdiction),
    [jurisdiction]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    const twelveWords = pickRandomWords(WORD_LIST, WORD_COUNT);
    try {
      await onboardWithJurisdiction(
        twelveWords,
        jurisdiction.toLowerCase()
      );
      setWords(twelveWords);
      setAck(false);
    } catch {
      setError("Failed to create vault. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4 py-8">
      <div className="max-w-2xl w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="mb-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-slate-400">
            SOVEREIGN VAULT
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Generate Your Paper Key
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Your 12-word paper key is the only way to access your forensic vault.
          </p>
        </div>

        {!words ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
                Jurisdiction
              </label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#003153] focus:border-[#003153]"
              >
                {JURISDICTIONS.map((j) => (
                  <option key={j.value} value={j.value} className="bg-[#0a0f1a] text-white">
                    {j.label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full rounded-md bg-[#003153] hover:bg-[#003153]/90 text-sm font-medium py-2.5 text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating vault…" : "Generate Paper Key"}
            </button>

            <p className="text-xs text-slate-400">
              Already have a key?{" "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-slate-200"
                onClick={() => router.push("/login")}
              >
                Go to Login →
              </button>
            </p>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {words.map((word, idx) => (
                <div
                  key={idx}
                  className="rounded-md bg-white/10 border border-white/10 px-3 py-2"
                >
                  <div className="text-[10px] text-slate-400 mb-0.5">
                    {idx + 1}
                  </div>
                  <div className="font-mono-hash text-sm text-white break-all">
                    {word}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-red-500/50 bg-red-500/15 px-3 py-3 text-xs text-red-200 mb-4">
              Write down all 12 words in order. This key cannot be recovered if
              lost.
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-200 mb-4 cursor-pointer">
              <input
                type="checkbox"
                className="mt-[3px] h-3 w-3 border border-slate-500 bg-black/40 rounded"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              <span>
                I have written down my 12-word paper key and stored it safely
                offline. I understand it cannot be recovered.
              </span>
            </label>

            <div className="flex flex-col gap-3">
              {ack && (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full rounded-md bg-[#003153] hover:bg-[#003153]/90 text-sm font-medium py-2.5 text-white"
                >
                  Go to Login
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setWords(null);
                  setAck(false);
                  setError(null);
                }}
                className="w-full rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-medium py-2.5 text-slate-200"
              >
                Generate another key
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
