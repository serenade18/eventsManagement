import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuantityPicker({
  value,
  onChange,
  min = 1,
  max = 10,
  id,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  id: string;
}) {
  return (
    <div
      className="inline-flex items-center rounded-lg border border-input bg-surface"
      role="group"
      aria-labelledby={`${id}-label`}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Fewer tickets"
      >
        <Minus />
      </Button>
      <output id={id} aria-live="polite" className="w-10 text-center text-lg font-semibold tabular">
        {value}
      </output>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="More tickets"
      >
        <Plus />
      </Button>
    </div>
  );
}
