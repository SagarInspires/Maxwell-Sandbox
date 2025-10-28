import { useState, useEffect, useRef, useCallback } from 'react';
import { MaxwellSolver } from './lib/maxwell-solver';
import type { Source } from './lib/maxwell-solver';
import type { Obstacle } from './lib/maxwell-solver';
import { SimulationCanvas, type SimulationCanvasHandle } from './components/SimulationCanvas';
import { ControlPanel } from './components/ControlPanel';
import { MetricsPanel } from './components/MetricsPanel';
import { Toolbar } from './components/Toolbar';
import { getExperimentById } from './lib/experiments';
import { getHistoricalExperimentById } from './lib/historical-experiments';
import { toast } from 'sonner';

type ExtendedWindow = Window & { webkitAudioContext?: typeof AudioContext };

type ExportReport = {
  createdAt: string;
  simulationTime: number;
  fieldMode: 'Ez' | 'Hx' | 'Hy' | 'Poynting' | 'Intensity';
  showVectors: boolean;
  grid: {
    nx: number;
    ny: number;
    dx: number;
    dy: number;
    dt: number;
  };
  metrics: {
    maxIntensity: number;
    avgIntensity: number;
    maxPoynting: number;
    totalEnergy: number;
  };
  sources: Source[];
  obstacles: Obstacle[];
};

const buildExportReport = (
  solver: MaxwellSolver,
  fieldMode: 'Ez' | 'Hx' | 'Hy' | 'Poynting' | 'Intensity',
  showVectors: boolean
): ExportReport => {
  const intensity = solver.getIntensity();
  const poynting = solver.getPoyntingVector();

  let maxIntensity = 0;
  let sumIntensity = 0;
  let maxPoynting = 0;

  for (let i = 0; i < intensity.length; i++) {
    const currentIntensity = intensity[i];
    const currentPoynting = poynting[i];
    if (currentIntensity > maxIntensity) maxIntensity = currentIntensity;
    if (currentPoynting > maxPoynting) maxPoynting = currentPoynting;
    sumIntensity += currentIntensity;
  }

  const params = solver.getParams();

  return {
    createdAt: new Date().toISOString(),
    simulationTime: solver.getTime(),
    fieldMode,
    showVectors,
    grid: {
      nx: params.nx,
      ny: params.ny,
      dx: params.dx,
      dy: params.dy,
      dt: params.dt
    },
    metrics: {
      maxIntensity,
      avgIntensity: intensity.length ? sumIntensity / intensity.length : 0,
      maxPoynting,
      totalEnergy: sumIntensity
    },
    sources: solver.getSources().map(source => ({ ...source })),
    obstacles: solver.getObstacles().map(obstacle => ({ ...obstacle }))
  };
};

/**
 * Maxwell Sandbox - Main Application
 * 
 * Research-grade EM wave simulator with real-time visualization
 * Implements full Maxwell's equations using FDTD method
 */
function App() {
  const [solver, setSolver] = useState<MaxwellSolver | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fieldMode, setFieldMode] = useState<'Ez' | 'Hx' | 'Hy' | 'Poynting' | 'Intensity'>('Ez');
  const [showVectors, setShowVectors] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const simulationRef = useRef<SimulationCanvasHandle | null>(null);
  
  // Initialize solver
  useEffect(() => {
    // Grid parameters (2D simulation) - Rectangular canvas for double-slit
    const wavelength = 0.06; // 6 cm at 5 GHz
    const dx = wavelength / 20; // 20 points per wavelength
    const dy = dx;
    const nx = 250; // Grid points (wider for rectangular view)
    const ny = 150; // Grid points (height)
    
    // CFL condition: dt < dx / (c * sqrt(2))
    const c = 299792458; // Speed of light
    const dt = dx / (2 * c);
    
    const newSolver = new MaxwellSolver({
      nx,
      ny,
      dx,
      dy,
      dt
    });
    
    setSolver(newSolver);
    
    toast.success('Maxwell Sandbox initialized', {
      description: `Grid: ${nx}×${ny}, Δx: ${(dx * 1000).toFixed(2)} mm`
    });
  }, []);
  
  // Audio sonification
  useEffect(() => {
    if (audioEnabled && !audioContextRef.current) {
      const extendedWindow = window as ExtendedWindow;
      const AudioConstructor = window.AudioContext || extendedWindow.webkitAudioContext;
      if (!AudioConstructor) {
        toast.error('Audio unavailable', {
          description: 'Web Audio API is not supported in this browser.'
        });
        return;
      }

      audioContextRef.current = new AudioConstructor();
      oscillatorRef.current = audioContextRef.current.createOscillator();
      gainNodeRef.current = audioContextRef.current.createGain();
      
      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      oscillatorRef.current.type = 'sine';
      oscillatorRef.current.frequency.value = 440; // A4 note
      gainNodeRef.current.gain.value = 0.1;
      
      oscillatorRef.current.start();
    } else if (!audioEnabled && audioContextRef.current) {
      oscillatorRef.current?.stop();
      audioContextRef.current.close();
      audioContextRef.current = null;
      oscillatorRef.current = null;
      gainNodeRef.current = null;
    }
  }, [audioEnabled]);
  
  // Update audio frequency based on field intensity
  useEffect(() => {
    if (!audioEnabled || !solver || !isPlaying || !oscillatorRef.current || !gainNodeRef.current) return;
    
    const updateAudio = () => {
      if (!solver || !oscillatorRef.current || !gainNodeRef.current) return;
      
      const intensity = solver.getIntensity();
      let maxIntensity = 0;
      for (let i = 0; i < intensity.length; i++) {
        if (intensity[i] > maxIntensity) maxIntensity = intensity[i];
      }
      
      // Map intensity to frequency (200 Hz - 2000 Hz)
      const freq = 200 + Math.min(maxIntensity * 1000, 1800);
      oscillatorRef.current.frequency.setValueAtTime(freq, audioContextRef.current!.currentTime);
      
      // Map to volume
      const volume = Math.min(maxIntensity * 0.5, 0.3);
      gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current!.currentTime);
    };
    
    const interval = setInterval(updateAudio, 50);
    return () => clearInterval(interval);
  }, [audioEnabled, solver, isPlaying]);
  
  const handleAddSource = (sourceData: Omit<Source, 'id'>) => {
    if (!solver) return;
    
    const source: Source = {
      ...sourceData,
      id: `source-${Date.now()}`
    };
    
    solver.addSource(source);
    setSources([...solver.getSources()]);
    
    toast.success('Source added', {
      description: `${source.type} at ${(source.frequency / 1e9).toFixed(1)} GHz`
    });
  };
  
  const handleAddObstacle = (obstacleData: Omit<Obstacle, 'id'>) => {
    if (!solver) return;
    
    const obstacle: Obstacle = {
      ...obstacleData,
      id: `obstacle-${Date.now()}`
    };
    
    solver.addObstacle(obstacle);
    setObstacles([...solver.getObstacles()]);
    
    toast.success('Obstacle added', {
      description: `ε=${obstacle.material.epsilon.toFixed(1)}, ${obstacle.width}×${obstacle.height}`
    });
  };
  
  const handleUpdateSource = (id: string, updates: Partial<Source>) => {
    if (!solver) return;
    solver.updateSource(id, updates);
    setSources([...solver.getSources()]);
  };
  
  const handleRemoveSource = (id: string) => {
    if (!solver) return;
    solver.removeSource(id);
    setSources([...solver.getSources()]);
    toast.info('Source removed');
  };
  
  const handleRemoveObstacle = (id: string) => {
    if (!solver) return;
    solver.removeObstacle(id);
    setObstacles([...solver.getObstacles()]);
    toast.info('Obstacle removed');
  };
  
  const handleReset = () => {
    if (!solver) return;
    solver.reset();
    setIsPlaying(false);
    toast.info('Simulation reset');
  };
  
  const handleExport = async () => {
    if (!simulationRef.current || !solver) {
      toast.error('Export unavailable', {
        description: 'Visualization or solver is not ready yet.'
      });
      return;
    }

    try {
      const frameBlob = await simulationRef.current.captureFrame();
      const report = buildExportReport(solver, fieldMode, showVectors);
      const metricsBlob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json'
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const frameFilename = `maxwell-sandbox-${timestamp}.png`;
      const metricsFilename = `maxwell-sandbox-${timestamp}.metrics.json`;

      const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };

      downloadBlob(frameBlob, frameFilename);
      downloadBlob(metricsBlob, metricsFilename);

      toast.success('Export complete', {
        description: `Saved ${frameFilename} and ${metricsFilename}`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Export failed', {
        description: message
      });
    }
  };
  
  const handleFieldClick = useCallback((x: number, y: number) => {
    if (!solver) return;
    const field = solver.getFieldAt(x, y);
    toast.info(`Field at (${x.toFixed(0)}, ${y.toFixed(0)})`, {
      description: `Ez: ${field.Ez.toFixed(4)}, Hx: ${field.Hx.toFixed(4)}, Hy: ${field.Hy.toFixed(4)}`
    });
  }, [solver]);
  
  const handleLoadExperiment = (experimentId: string) => {
    if (!solver) return;
    
    const experiment = getExperimentById(experimentId);
    if (!experiment) return;
    
    // Reset simulation
    solver.reset();
    setIsPlaying(false);
    
    // Clear existing sources and obstacles
    sources.forEach(s => solver.removeSource(s.id));
    obstacles.forEach(o => solver.removeObstacle(o.id));
    
    // Add experiment sources
    experiment.sources.forEach(sourceData => {
      const source: Source = {
        ...sourceData,
        id: `source-${Date.now()}-${Math.random()}`
      };
      solver.addSource(source);
    });
    
    // Add experiment obstacles
    experiment.obstacles.forEach(obstacleData => {
      const obstacle: Obstacle = {
        ...obstacleData,
        id: `obstacle-${Date.now()}-${Math.random()}`
      };
      solver.addObstacle(obstacle);
    });
    
    // Update state
    setSources([...solver.getSources()]);
    setObstacles([...solver.getObstacles()]);
    
    // Apply recommended settings
    if (experiment.recommendedSettings?.fieldMode) {
      setFieldMode(experiment.recommendedSettings.fieldMode);
    }
    if (experiment.recommendedSettings?.showVectors !== undefined) {
      setShowVectors(experiment.recommendedSettings.showVectors);
    }
    
    toast.success('Experiment loaded', {
      description: experiment.name
    });
  };
  
  const handleLoadHistoricalExperiment = (experimentId: string) => {
    if (!solver) return;
    
    const experiment = getHistoricalExperimentById(experimentId);
    if (!experiment) return;
    
    // Reset simulation
    solver.reset();
    setIsPlaying(false);
    
    // Clear existing sources and obstacles
    sources.forEach(s => solver.removeSource(s.id));
    obstacles.forEach(o => solver.removeObstacle(o.id));
    
    // Add experiment sources
    experiment.sources.forEach(sourceData => {
      const source: Source = {
        ...sourceData,
        id: `source-${Date.now()}-${Math.random()}`
      };
      solver.addSource(source);
    });
    
    // Add experiment obstacles
    experiment.obstacles.forEach(obstacleData => {
      const obstacle: Obstacle = {
        ...obstacleData,
        id: `obstacle-${Date.now()}-${Math.random()}`
      };
      solver.addObstacle(obstacle);
    });
    
    // Update state
    setSources([...solver.getSources()]);
    setObstacles([...solver.getObstacles()]);
    
    // Apply recommended settings
    if (experiment.recommendedSettings?.fieldMode) {
      setFieldMode(experiment.recommendedSettings.fieldMode);
    }
    if (experiment.recommendedSettings?.showVectors !== undefined) {
      setShowVectors(experiment.recommendedSettings.showVectors);
    }
    
    toast.success('Historical experiment loaded', {
      description: `${experiment.name} (${experiment.year}) - ${experiment.scientist}`,
      duration: 5000
    });
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-y-auto md:overflow-hidden">
      <Toolbar
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onReset={handleReset}
        fieldMode={fieldMode}
        onFieldModeChange={setFieldMode}
        showVectors={showVectors}
        onToggleVectors={() => setShowVectors(!showVectors)}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        onExport={handleExport}
      />
      
  <div className="flex flex-1 overflow-y-auto md:overflow-hidden flex-col md:flex-row gap-4 md:gap-0">
        <ControlPanel
          onAddSource={handleAddSource}
          onAddObstacle={handleAddObstacle}
          sources={sources}
          obstacles={obstacles}
          onUpdateSource={handleUpdateSource}
          onRemoveSource={handleRemoveSource}
          onRemoveObstacle={handleRemoveObstacle}
          onLoadExperiment={handleLoadExperiment}
          onLoadHistoricalExperiment={handleLoadHistoricalExperiment}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 p-3 sm:p-4 flex items-center justify-center">
            <SimulationCanvas
              isPlaying={isPlaying}
              solver={solver}
              fieldMode={fieldMode}
              showVectors={showVectors}
              onFieldClick={handleFieldClick}
              ref={simulationRef}
            />
          </div>
        </div>
        
        <MetricsPanel solver={solver} isPlaying={isPlaying} />
      </div>
    </div>
  );
}

export default App;