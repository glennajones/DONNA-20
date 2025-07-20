import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateTimeOptions, formatTime12To24, parseTimeToDisplay } from "@/lib/timeUtils";

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

export function TimeSelect({ value, onChange, placeholder = "Select time", id, disabled }: TimeSelectProps) {
  const timeOptions = generateTimeOptions();
  
  // Convert the value to display format (12-hour) for selection
  const displayValue = parseTimeToDisplay(value);
  
  const handleValueChange = (selectedTime: string) => {
    // Convert the selected 12-hour time to 24-hour format for storage
    const time24 = formatTime12To24(selectedTime);
    onChange(time24);
  };

  return (
    <Select value={displayValue} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {timeOptions.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}