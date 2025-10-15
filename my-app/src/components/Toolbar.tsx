import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  Download, 
  Volume2,
  VolumeX,
  Layers
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ToolbarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  fieldMode: 'Ez' | 'Hx' | 'Hy' | 'Poynting' | 'Intensity';
  onFieldModeChange: (mode: 'Ez' | 'Hx' | 'Hy' | 'Poynting' | 'Intensity') => void;
  showVectors: boolean;
  onToggleVectors: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onExport: () => void;
}

export function Toolbar({
  isPlaying,
  onTogglePlay,
  onReset,
  fieldMode,
  onFieldModeChange,
  showVectors,
  onToggleVectors,
  audioEnabled,
  onToggleAudio,
  onExport
}: ToolbarProps) {
  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Maxwell Sandbox</h1>
            <p className="text-xs text-muted-foreground">EM Wave Simulator</p>
          </div>
        </div>
        
        <div className="h-8 w-px bg-border mx-2" />
        
        <div className="flex items-center gap-2">
          <Button
            onClick={onTogglePlay}
            size="sm"
            variant={isPlaying ? "default" : "outline"}
            className="gap-2"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Play
              </>
            )}
          </Button>
          
          <Button onClick={onReset} size="sm" variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Label htmlFor="field-mode" className="text-xs text-muted-foreground">
            Field Mode
          </Label>
          <Select value={fieldMode} onValueChange={(value) => onFieldModeChange(value as any)}>
            <SelectTrigger id="field-mode" className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ez">Electric (Ez)</SelectItem>
              <SelectItem value="Hx">Magnetic (Hx)</SelectItem>
              <SelectItem value="Hy">Magnetic (Hy)</SelectItem>
              <SelectItem value="Poynting">Poynting Vector</SelectItem>
              <SelectItem value="Intensity">Intensity |E|²</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            id="show-vectors"
            checked={showVectors}
            onCheckedChange={onToggleVectors}
          />
          <Label htmlFor="show-vectors" className="text-xs text-muted-foreground cursor-pointer">
            <Eye className="w-4 h-4 inline mr-1" />
            Vectors
          </Label>
        </div>
        
        <div className="h-6 w-px bg-border" />
        
        <Button
          onClick={onToggleAudio}
          size="sm"
          variant="ghost"
          className="gap-2"
        >
          {audioEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </Button>
        
        <Button onClick={onExport} size="sm" variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
