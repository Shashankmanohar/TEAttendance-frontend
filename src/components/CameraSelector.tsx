import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, AlertTriangle } from 'lucide-react';
import { CameraDevice } from '@/hooks/useCameraDevices';

interface CameraSelectorProps {
  label: string;
  devices: CameraDevice[];
  value: string;
  onChange: (deviceId: string) => void;
  disabled?: boolean;
  conflict?: boolean;
}

export function CameraSelector({ label, devices, value, onChange, disabled, conflict }: CameraSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Camera className="w-3.5 h-3.5" />
        {label}
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={conflict ? 'border-destructive' : ''}>
          <SelectValue placeholder="Select camera..." />
        </SelectTrigger>
        <SelectContent>
          {devices.map((d) => (
            <SelectItem key={d.deviceId} value={d.deviceId}>
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {conflict && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Same camera selected for both — please choose a different one
        </p>
      )}
    </div>
  );
}
