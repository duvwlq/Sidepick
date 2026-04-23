import React from 'react';

type Props = {
  step: number;
  progress: number;
};

export default function ProgressHeader({ step, progress }: Props) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-2">
        <div>
          <span className="font-medium">{step}</span>
          <span className="text-gray-400">/4 단계</span>
        </div>
        <span className="font-semibold">{progress}%</span>
      </div>

      <div className="w-full h-1.5 bg-gray-200 rounded-full">
        <div
          className="h-1.5 bg-black rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
