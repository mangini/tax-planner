interface Props {
  isEstimate: boolean;
  onChange: (value: boolean) => void;
}

export default function EstimateToggle({ isEstimate, onChange }: Props) {
  return (
    <button
      type="button"
      onClick={() => onChange(!isEstimate)}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
        isEstimate
          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      }`}
    >
      {isEstimate ? 'Estimated' : 'Final'}
    </button>
  );
}
