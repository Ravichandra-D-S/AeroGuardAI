import { useState } from 'react';
import { Brain, RotateCcw } from 'lucide-react';
import type { PredictionInput, PredictionResult } from '@/types/aircraft';
import { LoadingState } from '@/components/ui/LoadingState';
import { RiskBadge } from '@/components/ui/RiskBadge';

interface PredictionResultCardProps {
  result: PredictionResult | null;
  loading: boolean;
  input: PredictionInput | null;
  onReset: () => void;
}

const riskGlow: Record<string, string> = {
  Low: 'from-emerald-500/10 border-emerald-500/30',
  Medium: 'from-amber-500/10 border-amber-500/30',
  High: 'from-red-500/10 border-red-500/30',
};

const riskAccent: Record<string, string> = {
  Low: 'text-emerald-400',
  Medium: 'text-amber-400',
  High: 'text-red-400',
};

export function PredictionResultCard({ result, loading, input, onReset }: PredictionResultCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6">
        <LoadingState message="AI model analyzing health parameters..." />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-800/20 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/30">
          <Brain className="h-6 w-6 text-slate-500" />
        </div>
        <div>
          <p className="font-semibold text-slate-300">No prediction yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Fill in the health parameters and run the prediction to see results.
          </p>
        </div>
      </div>
    );
  }

  const glow = riskGlow[result.riskLevel];
  const accent = riskAccent[result.riskLevel];

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${glow} to-slate-800/40 p-6 backdrop-blur-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-400" />
          <h3 className="text-base font-semibold text-white">AI Prediction Result</h3>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700/40 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {input && (
        <p className="mt-2 text-xs text-slate-400">
          Analysis for aircraft <span className="font-semibold text-slate-300">{input.aircraftId}</span>
        </p>
      )}

      <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center sm:items-start">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Risk Level</span>
          <div className="mt-2">
            <RiskBadge level={result.riskLevel} />
          </div>
        </div>

        <div className="h-12 w-px bg-slate-700/60" />

        <div className="flex flex-col items-center sm:items-start">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Risk Probability</span>
          <span className={`mt-1 text-4xl font-bold ${accent}`}>{result.riskProbability}%</span>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recommendation</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{result.recommendation}</p>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Contributing Factors</p>
        <div className="space-y-2.5">
          {result.factors.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-xs font-medium text-slate-400">{f.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    f.impact >= 70 ? 'bg-red-500' : f.impact >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${f.impact}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-semibold text-slate-300">{f.impact}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
