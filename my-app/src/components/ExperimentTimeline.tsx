import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
// If Badge is a default export:
import { Badge } from './ui/badge'

// Or, if the correct named export is 'BadgeComponent' (replace with actual name):
// import { BadgeComponent as Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { getExperimentsChronologically } from '../lib/historical-experiments';
import type { HistoricalExperiment } from '../lib/historical-experiments';
import { Play, Info, Calendar, User, Award, BookOpen } from 'lucide-react';

interface ExperimentTimelineProps {
  onLoadExperiment: (experimentId: string) => void;
}

export function ExperimentTimeline({ onLoadExperiment }: ExperimentTimelineProps) {
  const experiments = getExperimentsChronologically();
  const [selectedExperiment, setSelectedExperiment] = useState<HistoricalExperiment | null>(null);

  const categoryColors: Record<HistoricalExperiment['category'], string> = {
    'electrostatics': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    'electrodynamics': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    'induction': 'bg-green-500/20 text-green-400 border-green-500/50',
    'waves': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    'optics': 'bg-pink-500/20 text-pink-400 border-pink-500/50',
    'quantum': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
  };

  const categoryLabels: Record<HistoricalExperiment['category'], string> = {
    'electrostatics': 'Electrostatics',
    'electrodynamics': 'Electrodynamics',
    'induction': 'Induction',
    'waves': 'EM Waves',
    'optics': 'Optics',
    'quantum': 'Quantum'
  };

  return (
    <Card className="bg-muted/50 h-auto md:h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Historical Experiments Timeline
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {experiments.length} Experiments
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] md:h-[calc(100vh-12rem)]">
          <div className="space-y-3 pr-6">
            {experiments.map((experiment, index) => (
              <div key={experiment.id} className="relative">
                {/* Timeline connector line */}
                {index < experiments.length - 1 && (
                  <div className="absolute left-[19px] top-12 w-0.5 h-full bg-border z-0" />
                )}
                
                <div className="flex gap-3 relative z-10 min-w-0">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center font-mono text-xs font-bold text-primary">
                      {experiment.year.toString().slice(-2)}
                    </div>
                  </div>
                  
                  {/* Experiment card */}
                  <Card className="flex-1 min-w-0 bg-background/50 hover:bg-background/80 transition-colors border-l-2 border-primary/50">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex flex-col gap-1 min-w-0">
                          <h3 className="font-semibold text-sm leading-tight break-words">
                            {experiment.name}
                          </h3>
                          <Badge className={`text-[10px] mt-1 self-start sm:self-end px-2 py-0.5 rounded-full ${categoryColors[experiment.category]}`}
                            style={{letterSpacing: '0.01em'}}>
                            {categoryLabels[experiment.category]}
                          </Badge>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground flex-wrap">
                            <User className="w-3 h-3" />
                            <span>{experiment.scientist}</span>
                            <span className="text-[10px] ml-1">({experiment.year})</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {experiment.description}
                        </p>
                        
                        <div className="flex gap-2 pt-1 flex-col sm:flex-row">
                          <Button
                            size="sm"
                            onClick={() => {
                              onLoadExperiment(experiment.id);
                              setSelectedExperiment(experiment);
                            }}
                            className="h-7 text-xs flex items-center gap-1 w-full sm:w-auto"
                          >
                            <Play className="w-3 h-3" />
                            Simulate
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 w-full sm:w-auto"
                                onClick={() => setSelectedExperiment(experiment)}
                              >
                                <Info className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Award className="w-5 h-5 text-primary" />
                                  {experiment.name}
                                </DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-4 text-sm">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground border-b border-border pb-3">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{experiment.year}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    <span>{experiment.scientist}</span>
                                  </div>
                                  <Badge className={`text-[10px] ${categoryColors[experiment.category]}`}>
                                    {categoryLabels[experiment.category]}
                                  </Badge>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold text-xs mb-2 flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    Description
                                  </h4>
                                  <p className="text-muted-foreground text-xs leading-relaxed">
                                    {experiment.description}
                                  </p>
                                </div>
                                
                                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                                  <h4 className="font-semibold text-xs mb-2 flex items-center gap-1">
                                    <Award className="w-3 h-3 text-primary" />
                                    Historical Significance
                                  </h4>
                                  <p className="text-muted-foreground text-xs leading-relaxed">
                                    {experiment.significance}
                                  </p>
                                </div>
                                
                                {experiment.physicalSetup && (
                                  <div>
                                    <h4 className="font-semibold text-xs mb-2">Physical Setup</h4>
                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                      {experiment.physicalSetup}
                                    </p>
                                  </div>
                                )}
                                
                                {experiment.instructions && (
                                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                                    <h4 className="font-semibold text-xs mb-2">Simulation Instructions</h4>
                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                      {experiment.instructions}
                                    </p>
                                  </div>
                                )}
                                
                                <Button
                                  onClick={() => {
                                    onLoadExperiment(experiment.id);
                                  }}
                                  className="w-full"
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Load Experiment
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
