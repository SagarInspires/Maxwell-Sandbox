/**
 * Electromagnetic Experiment Presets
 * 
 * Research-grade experiment configurations for classical EM phenomena
 */

import type { Source, Obstacle } from './maxwell-solver';

export interface ExperimentPreset {
  id: string;
  name: string;
  description: string;
  category: 'classical' | 'wave' | 'radiation' | 'magnetism' | 'advanced';
  sources: Omit<Source, 'id'>[];
  obstacles: Omit<Obstacle, 'id'>[];
  recommendedSettings?: {
    fieldMode?: 'Ez' | 'Hx' | 'Hy' | 'Poynting' | 'Intensity';
    showVectors?: boolean;
  };
}

export const EXPERIMENT_PRESETS: ExperimentPreset[] = [
  {
    id: 'double-slit',
    name: 'Double-Slit Interference',
    description: 'Classic wave interference through two slits showing interference pattern with observation screens',
    category: 'wave',
    sources: [
      { type: 'plane-wave', x: 30, y: 75, frequency: 6e9, amplitude: 1.2, phase: 0 }
    ],
    obstacles: [
      // Slit barrier (A)
      // Top barrier
      { x: 90, y: 30, width: 4, height: 30, material: { epsilon: 1, mu: 1, sigma: 1e7 } },
      // Upper slit opening at y=60-67 (7 units wide)
      // Middle barrier between slits
      { x: 90, y: 67, width: 4, height: 11, material: { epsilon: 1, mu: 1, sigma: 1e7 } },
      // Lower slit opening at y=78-85 (7 units wide)
      // Bottom barrier
      { x: 90, y: 85, width: 4, height: 35, material: { epsilon: 1, mu: 1, sigma: 1e7 } },
      
      // Observation screen B (near field - shows wave diffraction)
      { x: 120, y: 30, width: 1, height: 90, material: { epsilon: 2.0, mu: 1, sigma: 0.01 } },
      
      // Observation screen C (far field - shows interference pattern)
      { x: 150, y: 30, width: 1, height: 90, material: { epsilon: 2.0, mu: 1, sigma: 0.01 } }
    ],
    recommendedSettings: {
      fieldMode: 'Intensity',
      showVectors: false
    }
  },
  {
    id: 'faraday-cage',
    name: 'Faraday Cage Shielding',
    description: 'Electromagnetic shielding by a conductive enclosure',
    category: 'classical',
    sources: [
      { type: 'dipole', x: 50, y: 75, frequency: 5e9, amplitude: 1.5, phase: 0 }
    ],
    obstacles: [
      { x: 110, y: 50, width: 3, height: 50, material: { epsilon: 1, mu: 1, sigma: 1e7 } },
      { x: 110, y: 50, width: 40, height: 3, material: { epsilon: 1, mu: 1, sigma: 1e7 } },
      { x: 147, y: 50, width: 3, height: 50, material: { epsilon: 1, mu: 1, sigma: 1e7 } },
      { x: 110, y: 97, width: 40, height: 3, material: { epsilon: 1, mu: 1, sigma: 1e7 } }
    ],
    recommendedSettings: {
      fieldMode: 'Ez',
      showVectors: true
    }
  },
  {
    id: 'magnetic-dipole',
    name: 'Magnetic Dipole Field',
    description: 'Bar magnet showing characteristic dipole field lines',
    category: 'magnetism',
    sources: [
      { type: 'magnet', x: 100, y: 75, frequency: 1e8, amplitude: 2.0, phase: 0, angle: Math.PI / 4, polarity: 'N-S' }
    ],
    obstacles: [],
    recommendedSettings: {
      fieldMode: 'Hy',
      showVectors: true
    }
  },
  {
    id: 'wire-magnetic-field',
    name: 'Current-Carrying Wire',
    description: 'Circular magnetic field around a current-carrying conductor',
    category: 'magnetism',
    sources: [
      { type: 'wire', x: 80, y: 40, frequency: 2e9, amplitude: 1.5, phase: 0, length: 70, angle: Math.PI / 2, current: 2.0 }
    ],
    obstacles: [],
    recommendedSettings: {
      fieldMode: 'Hx',
      showVectors: true
    }
  },
  {
    id: 'charge-oscillation',
    name: 'Oscillating Point Charge',
    description: 'EM radiation from an accelerating charge (dipole radiation)',
    category: 'radiation',
    sources: [
      { type: 'point-charge', x: 100, y: 75, frequency: 8e9, amplitude: 1.2, phase: 0, charge: 5e-9 }
    ],
    obstacles: [],
    recommendedSettings: {
      fieldMode: 'Poynting',
      showVectors: true
    }
  },
  {
    id: 'current-loop-antenna',
    name: 'Loop Antenna Radiation',
    description: 'Electromagnetic radiation from a circular current loop',
    category: 'radiation',
    sources: [
      { type: 'current-loop', x: 100, y: 75, frequency: 5e9, amplitude: 1.0, phase: 0, width: 15, current: 1.5 }
    ],
    obstacles: [],
    recommendedSettings: {
      fieldMode: 'Poynting',
      showVectors: true
    }
  },
  {
    id: 'lens-refraction',
    name: 'Electromagnetic Lens',
    description: 'Wave refraction through a high-permittivity lens',
    category: 'wave',
    sources: [
      { type: 'plane-wave', x: 30, y: 75, frequency: 5e9, amplitude: 1.0, phase: 0 }
    ],
    obstacles: [
      { x: 90, y: 5, width: 50, height: 230, material: { epsilon: 9.0, mu: 1, sigma: 0 } }
    ],
    recommendedSettings: {
      fieldMode: 'Intensity',
      showVectors: true
    }
  },
  {
    id: 'waveguide',
    name: 'Rectangular Waveguide',
    description: 'EM wave propagation in a metallic waveguide',
    category: 'wave',
    sources: [
      { type: 'dipole', x: 40, y: 75, frequency: 10e9, amplitude: 1.5, phase: 0 }
    ],
    obstacles: [
      { x: 60, y: 50, width: 100, height: 3, material: { epsilon: 1, mu: 1, sigma: 1e7 } },
      { x: 60, y: 97, width: 100, height: 3, material: { epsilon: 1, mu: 1, sigma: 1e7 } }
    ],
    recommendedSettings: {
      fieldMode: 'Ez',
      showVectors: false
    }
  },
  {
    id: 'interference-multi',
    name: 'Multi-Source Interference',
    description: 'Complex interference pattern from multiple coherent sources',
    category: 'wave',
    sources: [
      { type: 'dipole', x: 80, y: 50, frequency: 5e9, amplitude: 1.0, phase: 0 },
      { type: 'dipole', x: 80, y: 75, frequency: 5e9, amplitude: 1.0, phase: 0 },
      { type: 'dipole', x: 80, y: 100, frequency: 5e9, amplitude: 1.0, phase: 0 }
    ],
    obstacles: [],
    recommendedSettings: {
      fieldMode: 'Intensity',
      showVectors: false
    }
  },
  {
    id: 'metamaterial',
    name: 'Negative Index Metamaterial',
    description: 'Wave behavior in exotic metamaterial with negative permittivity',
    category: 'advanced',
    sources: [
      { type: 'gaussian', x: 50, y: 75, frequency: 5e9, amplitude: 1.0, phase: 0, width: 10 }
    ],
    obstacles: [
      { x: 100, y: 50, width: 30, height: 50, material: { epsilon: -2.0, mu: -1.5, sigma: 0 } }
    ],
    recommendedSettings: {
      fieldMode: 'Ez',
      showVectors: true
    }
  }
];

/**
 * Get experiments by category
 */
export function getExperimentsByCategory(category: ExperimentPreset['category']): ExperimentPreset[] {
  return EXPERIMENT_PRESETS.filter(exp => exp.category === category);
}

/**
 * Get experiment by ID
 */
export function getExperimentById(id: string): ExperimentPreset | undefined {
  return EXPERIMENT_PRESETS.find(exp => exp.id === id);
}
