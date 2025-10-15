import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MaxwellSolver } from '../lib/maxwell-solver';
import { Activity, Zap, TrendingUp, Waves } from 'lucide-react';

interface MetricsPanelProps {
  solver: MaxwellSolver | null;
  isPlaying: boolean;
}

export function MetricsPanel({ solver, isPlaying }: MetricsPanelProps) {
  const [metrics, setMetrics] = useState({
    maxIntensity: 0,
    avgIntensity: 0,
    maxPoynting: 0,
    totalEnergy: 0,
    time: 0
  });
  
  useEffect(() => {
    if (!solver || !isPlaying) return;
    
    const updateMetrics = () => {
      if (!solver) return;
      
      const intensity = solver.getIntensity();
      const poynting = solver.getPoyntingVector();
      
      let maxInt = 0;
      let sumInt = 0;
      let maxPoyn = 0;
      let sumEnergy = 0;
      
      for (let i = 0; i < intensity.length; i++) {
        const int = intensity[i];
        const poyn = poynting[i];
        
        if (int > maxInt) maxInt = int;
        sumInt += int;
        
        if (poyn > maxPoyn) maxPoyn = poyn;
        sumEnergy += int;
      }
      
      setMetrics({
        maxIntensity: maxInt,
        avgIntensity: sumInt / intensity.length,
        maxPoynting: maxPoyn,
        totalEnergy: sumEnergy,
        time: solver.getTime()
      });
    };
    
    const interval = setInterval(updateMetrics, 100); // Update every 100ms
    
    return () => clearInterval(interval);
  }, [solver, isPlaying]);
  
  const formatScientific = (value: number): string => {
    if (value === 0) return '0.00';
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = value / Math.pow(10, exp);
    return `${mantissa.toFixed(2)}e${exp}`;
  };
  
  const formatTime = (time: number): string => {
    const ns = time * 1e9;
    if (ns < 1000) return `${ns.toFixed(2)} ns`;
    const us = ns / 1000;
    if (us < 1000) return `${us.toFixed(2)} μs`;
    const ms = us / 1000;
    return `${ms.toFixed(2)} ms`;
  };
  
  return (
    <div className="w-80 h-full bg-card border-l border-border overflow-y-auto">
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-border">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Live Metrics</h2>
        </div>
        
        <Card className="bg-muted/50 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-medium">Field Intensity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Maximum |E|²</span>
              <span className="text-lg font-mono font-semibold text-foreground">
                {formatScientific(metrics.maxIntensity)}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Average |E|²</span>
              <span className="text-sm font-mono text-foreground">
                {formatScientific(metrics.avgIntensity)}
              </span>
            </div>
            
            <div className="h-2 bg-background rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${Math.min(100, (metrics.maxIntensity / 10) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/50 border-accent/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <CardTitle className="text-sm font-medium">Energy Flow</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Max Poynting</span>
              <span className="text-lg font-mono font-semibold text-foreground">
                {formatScientific(metrics.maxPoynting)}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Total Energy</span>
              <span className="text-sm font-mono text-foreground">
                {formatScientific(metrics.totalEnergy)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Poynting vector magnitude (S = E × H)
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-medium">Simulation Time</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-foreground">
              {formatTime(metrics.time)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Physical simulation time
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Wave Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Speed of light</span>
              <span className="font-mono">3.00×10⁸ m/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wavelength (5 GHz)</span>
              <span className="font-mono">6.00 cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Grid resolution</span>
              <span className="font-mono">{solver?.getParams().nx} × {solver?.getParams().ny}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
