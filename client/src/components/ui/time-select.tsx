import { Input } from "@/components/ui/input";

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

export function TimeSelect({ value, onChange, placeholder = "e.g. 9:00 AM", id, disabled }: TimeSelectProps) {
  return (
    <Input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full"
    />
  );
}