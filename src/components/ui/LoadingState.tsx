import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Analyzing data...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="relative">
        <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
      </div>
      <p className="text-sm font-medium text-slate-400">{message}</p>
    </div>
  );
}
