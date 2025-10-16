import { useState } from 'react';
import { Button } from './ui/button'; 
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { Source } from '../lib/maxwell-solver';
import type { Obstacle } from '../lib/maxwell-solver'; // source, obstacle
import { Plus, Radio, Waves, Antenna, Sparkles, Box, Cable, Zap, Magnet as MagnetIcon, CircleDot, FlaskConical } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { EXPERIMENT_PRESETS, getExperimentsByCategory } from '../lib/experiments';
import { ExperimentTimeline } from './ExperimentTimeline';

interface ControlPanelProps {
  onAddSource: (source: Omit<Source, 'id'>) => void;
  onAddObstacle: (obstacle: Omit<Obstacle, 'id'>) => void;
  sources: Source[];
  obstacles: Obstacle[];
  onUpdateSource: (id: string, updates: Partial<Source>) => void;
  onRemoveSource: (id: string) => void;
  onRemoveObstacle: (id: string) => void;
  onLoadExperiment?: (experimentId: string) => void;
  onLoadHistoricalExperiment?: (experimentId: string) => void;
}

export function ControlPanel({
  onAddSource,
  onAddObstacle,
  sources,
  obstacles,
  onUpdateSource,
  onRemoveSource,
  onRemoveObstacle,
  onLoadExperiment,
  onLoadHistoricalExperiment
}: ControlPanelProps) {
  // Source controls
  const [sourceType, setSourceType] = useState<Source['type']>('dipole');
  const [frequency, setFrequency] = useState(5e9); // 5 GHz
  const [amplitude, setAmplitude] = useState(1.0);
  const [phase, setPhase] = useState(0);
  const [wireLength, setWireLength] = useState(30);
  const [wireAngle, setWireAngle] = useState(0);
  const [charge, setCharge] = useState(1e-9); // 1 nC
  const [current, setCurrent] = useState(1.0); // 1 A
  const [magnetPolarity, setMagnetPolarity] = useState<'N-S' | 'S-N'>('N-S');
  const [loopRadius, setLoopRadius] = useState(10);
  
  // Obstacle controls
  const [obstacleSize, setObstacleSize] = useState({ width: 20, height: 20 });
  const [epsilon, setEpsilon] = useState(4.0); // Glass
  const [mu, setMu] = useState(1.0);
  const [sigma, setSigma] = useState(0.0);
  
  const handleAddSource = () => {
    const baseSource = {
      type: sourceType,
      x: 50,
      y: 50,
      frequency,
      amplitude,
      phase
    };
    
    let additionalProps = {};
    
    switch (sourceType) {
      case 'gaussian':
        additionalProps = { width: 10 };
        break;
      case 'wire':
        additionalProps = { length: wireLength, angle: wireAngle, current };
        break;
      case 'point-charge':
        additionalProps = { charge };
        break;
      case 'magnet':
        additionalProps = { angle: wireAngle, polarity: magnetPolarity };
        break;
      case 'current-loop':
        additionalProps = { width: loopRadius, current };
        break;
    }
    
    onAddSource({ ...baseSource, ...additionalProps });
  };
  
  const handleAddObstacle = () => {
    onAddObstacle({
      x: 100,
      y: 100,
      width: obstacleSize.width,
      height: obstacleSize.height,
      material: { epsilon, mu, sigma }
    });
  };
  
  const sourceIcons = {
    'dipole': Radio,
    'plane-wave': Waves,
    'antenna': Antenna,
    'gaussian': Sparkles,
    'wire': Cable,
    'point-charge': Zap,
    'magnet': MagnetIcon,
    'current-loop': CircleDot
  };
  
  return (
    <div className="w-full md:w-80 h-auto md:h-full bg-card border-b md:border-b-0 md:border-r border-border overflow-y-visible md:overflow-y-auto">
      <div className="p-3 sm:p-4 space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-border">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h2 className="text-lg font-semibold text-foreground">Control Panel</h2>
        </div>
        
        <Tabs defaultValue="sources" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sources" className="space-y-4 mt-4">
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Add Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Wave Sources</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['dipole', 'plane-wave', 'antenna', 'gaussian'] as const).map((type) => {
                      const Icon = sourceIcons[type];
                      return (
                        <Button
                          key={type}
                          variant={sourceType === type ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSourceType(type)}
                          className="flex items-center gap-1.5"
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[10px] capitalize">{type.split('-').join(' ')}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Classical EM</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['wire', 'point-charge', 'magnet', 'current-loop'] as const).map((type) => {
                      const Icon = sourceIcons[type];
                      return (
                        <Button
                          key={type}
                          variant={sourceType === type ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSourceType(type)}
                          className="flex items-center gap-1.5"
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[10px] capitalize">{type.split('-').join(' ')}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="frequency" className="text-xs">Frequency (GHz)</Label>
                    <Input
                      id="frequency"
                      type="number"
                      value={(frequency / 1e9).toFixed(2)}
                      onChange={(e) => setFrequency(parseFloat(e.target.value) * 1e9)}
                      className="h-8 text-xs"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Amplitude: {amplitude.toFixed(2)}</Label>
                    <Slider
                      value={[amplitude]}
                      onValueChange={([v]: [number]) => setAmplitude(v)}
                      min={0.1}
                      max={2.0}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Phase: {(phase * 180 / Math.PI).toFixed(0)}°</Label>
                    <Slider
                      value={[phase]}
                      onValueChange={([v]: [number]) => setPhase(v)}
                      min={0}
                      max={2 * Math.PI}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                  
                  {/* Wire-specific controls */}
                  {sourceType === 'wire' && (
                    <>
                      <div>
                        <Label className="text-xs">Wire Length: {wireLength}</Label>
                        <Slider
                          value={[wireLength]}
                          onValueChange={([v]: [number]) => setWireLength(v)}
                          min={10}
                          max={80}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Angle: {(wireAngle * 180 / Math.PI).toFixed(0)}°</Label>
                        <Slider
                          value={[wireAngle]}
                          onValueChange={([v]: [number]) => setWireAngle(v)}
                          min={0}
                          max={2 * Math.PI}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Current: {current.toFixed(1)} A</Label>
                        <Slider
                          value={[current]}
                          onValueChange={([v]: [number]) => setCurrent(v)}
                          min={0.1}
                          max={5.0}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Point charge controls */}
                  {sourceType === 'point-charge' && (
                    <div>
                      <Label className="text-xs">Charge: {(charge * 1e9).toFixed(1)} nC</Label>
                      <Slider
                        value={[charge * 1e9]}
                        onValueChange={([v]: [number]) => setCharge(v / 1e9)}
                        min={0.1}
                        max={10}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  )}
                  
                  {/* Magnet controls */}
                  {sourceType === 'magnet' && (
                    <>
                      <div>
                        <Label className="text-xs">Orientation: {(wireAngle * 180 / Math.PI).toFixed(0)}°</Label>
                        <Slider
                          value={[wireAngle]}
                          onValueChange={([v]: [number]) => setWireAngle(v)}
                          min={0}
                          max={2 * Math.PI}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Polarity</Label>
                        <Select value={magnetPolarity} onValueChange={(v: string) => setMagnetPolarity(v as 'N-S' | 'S-N')}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="N-S">North → South</SelectItem>
                            <SelectItem value="S-N">South → North</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  
                  {/* Current loop controls */}
                  {sourceType === 'current-loop' && (
                    <>
                      <div>
                        <Label className="text-xs">Loop Radius: {loopRadius}</Label>
                        <Slider
                          value={[loopRadius]}
                          onValueChange={([v]: [number]) => setLoopRadius(v)}
                          min={5}
                          max={30}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Current: {current.toFixed(1)} A</Label>
                        <Slider
                          value={[current]}
                          onValueChange={([v]: [number]) => setCurrent(v)}
                          min={0.1}
                          max={5.0}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <Button onClick={handleAddSource} className="w-full" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Source
                </Button>
              </CardContent>
            </Card>
            
            {sources.length > 0 && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Active Sources ({sources.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sources.map((source) => {
                    const Icon = sourceIcons[source.type];
                    return (
                      <div key={source.id} className="flex items-center justify-between p-2 rounded bg-background/50 border border-border">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <div className="text-xs">
                            <div className="font-medium capitalize">{source.type.split('-').join(' ')}</div>
                            <div className="text-muted-foreground">
                              {(source.frequency / 1e9).toFixed(1)} GHz
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveSource(source.id)}
                          className="h-6 px-2 text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="materials" className="space-y-4 mt-4">
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Add Obstacle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="epsilon" className="text-xs">Permittivity (εᵣ)</Label>
                    <Input
                      id="epsilon"
                      type="number"
                      value={epsilon.toFixed(2)}
                      onChange={(e) => setEpsilon(parseFloat(e.target.value))}
                      className="h-8 text-xs"
                      step="0.1"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Vacuum: 1.0, Glass: 4.0, Water: 80.0
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="mu" className="text-xs">Permeability (μᵣ)</Label>
                    <Input
                      id="mu"
                      type="number"
                      value={mu.toFixed(2)}
                      onChange={(e) => setMu(parseFloat(e.target.value))}
                      className="h-8 text-xs"
                      step="0.1"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Non-magnetic: 1.0, Iron: ~5000
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="sigma" className="text-xs">Conductivity (S/m)</Label>
                    <Input
                      id="sigma"
                      type="number"
                      value={sigma.toFixed(2)}
                      onChange={(e) => setSigma(parseFloat(e.target.value))}
                      className="h-8 text-xs"
                      step="0.1"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Insulator: 0, Metal: ~10⁷
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="width" className="text-xs">Width</Label>
                      <Input
                        id="width"
                        type="number"
                        value={obstacleSize.width}
                        onChange={(e) => setObstacleSize(s => ({ ...s, width: parseInt(e.target.value) }))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="text-xs">Height</Label>
                      <Input
                        id="height"
                        type="number"
                        value={obstacleSize.height}
                        onChange={(e) => setObstacleSize(s => ({ ...s, height: parseInt(e.target.value) }))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleAddObstacle} className="w-full" size="sm">
                  <Box className="w-4 h-4 mr-2" />
                  Add Obstacle
                </Button>
              </CardContent>
            </Card>
            
            {obstacles.length > 0 && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Obstacles ({obstacles.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {obstacles.map((obstacle) => (
                    <div key={obstacle.id} className="flex items-center justify-between p-2 rounded bg-background/50 border border-border">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-accent" />
                        <div className="text-xs">
                          <div className="font-medium">
                            {obstacle.width}×{obstacle.height}
                          </div>
                          <div className="text-muted-foreground">
                            ε={obstacle.material.epsilon.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveObstacle(obstacle.id)}
                        className="h-6 px-2 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="presets" className="space-y-4 mt-4">
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" />
                  Modern EM Experiments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {EXPERIMENT_PRESETS.map((experiment) => (
                  <Card key={experiment.id} className="bg-background/50 hover:bg-background/80 transition-colors">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-xs font-semibold">{experiment.name}</h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                            {experiment.description}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onLoadExperiment?.(experiment.id)}
                          className="w-full h-7 text-xs"
                        >
                          Load
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            {onLoadHistoricalExperiment && (
              <ExperimentTimeline onLoadExperiment={onLoadHistoricalExperiment} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}