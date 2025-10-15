/**
 * Historical Electromagnetic Experiments
 * 
 * Classic experiments that established the foundations of electromagnetic theory
 */

import type { Source, Obstacle } from './maxwell-solver';

export interface HistoricalExperiment {
  id: string;
  name: string;
  year: number;
  scientist: string;
  description: string;
  significance: string;
  category: 'electrostatics' | 'electrodynamics' | 'induction' | 'waves' | 'optics' | 'quantum';
  sources: Omit<Source, 'id'>[];
  obstacles: Omit<Obstacle, 'id'>[];
  recommendedSettings?: {
    fieldMode?: 'Ez' | 'Hx' | 'Hy' | 'Poynting' | 'Intensity';
    showVectors?: boolean;
  };
  instructions?: string;
  physicalSetup?: string;
}

export const HISTORICAL_EXPERIMENTS: HistoricalExperiment[] = [
  {
    id: 'coulomb-torsion',
    name: "Coulomb's Torsion Balance",
    year: 1785,
    scientist: 'Charles-Augustin de Coulomb',
    description: 'Established the inverse-square law of electrostatic force',
    significance: 'First quantitative measurement of electrostatic forces. Proved that electric force follows F ∝ q₁q₂/r², analogous to Newton\'s gravitational law. Foundation for electrostatics.',
    category: 'electrostatics',
    sources: [
      { type: 'point-charge', x: 60, y: 75, frequency: 1e8, amplitude: 2.0, phase: 0, charge: 5e-9 },
      { type: 'point-charge', x: 140, y: 75, frequency: 1e8, amplitude: 2.0, phase: Math.PI, charge: -5e-9 }
    ],
    obstacles: [],
    recommendedSettings: {
      fieldMode: 'Ez',
      showVectors: true
    },
    instructions: 'Two charged spheres separated by distance. Observe the inverse-square field intensity decay.',
    physicalSetup: 'Torsion balance with charged pith balls suspended on insulating fibers'
  },
  {
    id: 'oersted-compass',
    name: "Oersted's Compass Experiment",
    year: 1820,
    scientist: 'Hans Christian Oersted',
    description: 'Showed that electric currents produce magnetic fields',
    significance: 'Revolutionary discovery linking electricity and magnetism. Demonstrated that moving charges (current) create magnetic fields, unifying two previously separate phenomena.',
    category: 'electrodynamics',
    sources: [
      { type: 'wire', x: 100, y: 40, frequency: 1e9, amplitude: 2.0, phase: 0, length: 70, angle: Math.PI / 2, current: 3.0 }
    ],
    obstacles: [],
    recommendedSettings: {
      fieldMode: 'Hx',
      showVectors: true
    },
    instructions: 'Current-carrying wire deflects compass needles. Observe circular magnetic field lines around the wire.',
    physicalSetup: 'Straight wire carrying DC current with compass needles placed around it'
  },
  {
    id: 'faraday-induction',
    name: "Faraday's Electromagnetic Induction",
    year: 1831,
    scientist: 'Michael Faraday',
    description: 'Demonstrated electromagnetic induction (basis of generators, transformers)',
    significance: 'Discovered that changing magnetic flux induces electric current. Foundation of electric power generation, transformers, and motors. Led to Maxwell\'s equations.',
    category: 'induction',
    sources: [
      { type: 'current-loop', x: 80, y: 75, frequency: 2e9, amplitude: 1.5, phase: 0, width: 20, current: 2.0 }
    ],
    obstacles: [
      { x: 120, y: 65, width: 25, height: 20, material: { epsilon: 1, mu: 5000, sigma: 1e6 } }
    ],
    recommendedSettings: {
      fieldMode: 'Hy',
      showVectors: true
    },
    instructions: 'Changing magnetic field from coil induces electric field in nearby conductor. Observe field coupling.',
    physicalSetup: 'Primary coil with AC current inducing voltage in secondary coil'
  },
  {
    id: 'ampere-force',
    name: "Ampère's Force Law",
    year: 1826,
    scientist: 'André-Marie Ampère',
    description: 'Showed forces between current-carrying wires, foundations of electrodynamics',
    significance: 'Quantified magnetic force between parallel currents. Parallel currents attract, anti-parallel repel. Foundation for electromagnetic theory and SI unit of current (Ampere).',
    category: 'electrodynamics',
    sources: [
      { type: 'wire', x: 70, y: 40, frequency: 1.5e9, amplitude: 1.5, phase: 0, length: 60, angle: Math.PI / 2, current: 2.5 },
      { type: 'wire', x: 130, y: 40, frequency: 1.5e9, amplitude: 1.5, phase: 0, length: 60, angle: Math.PI / 2, current: 2.5 }
    ],
    obstacles: [],
    recommendedSettings: {
      fieldMode: 'Hx',
      showVectors: true
    },
    instructions: 'Two parallel wires with current in same direction. Observe attractive magnetic force between them.',
    physicalSetup: 'Two parallel wires suspended freely, carrying adjustable DC currents'
  },
  {
    id: 'hertz-waves',
    name: "Hertz's Electromagnetic Waves",
    year: 1887,
    scientist: 'Heinrich Hertz',
    description: 'Produced and detected electromagnetic waves, confirming Maxwell\'s theory',
    significance: 'First experimental proof of Maxwell\'s prediction that light is an electromagnetic wave. Demonstrated wave propagation, reflection, refraction. Birth of radio technology.',
    category: 'waves',
    sources: [
      { type: 'dipole', x: 50, y: 75, frequency: 8e9, amplitude: 1.8, phase: 0 }
    ],
    obstacles: [
      { x: 120, y: 60, width: 5, height: 30, material: { epsilon: 1, mu: 1, sigma: 1e7 } }
    ],
    recommendedSettings: {
      fieldMode: 'Poynting',
      showVectors: true
    },
    instructions: 'Spark gap transmitter emits EM waves. Metal reflector shows wave reflection and interference.',
    physicalSetup: 'Spark gap oscillator (dipole antenna) with loop antenna detector and metal reflector'
  },
  {
    id: 'young-double-slit',
    name: "Young's Double-Slit Experiment",
    year: 1801,
    scientist: 'Thomas Young',
    description: 'Demonstrated interference and wave nature of light',
    significance: 'Definitive proof that light behaves as a wave (not just particles). Showed interference patterns from coherent sources. Later extended to quantum mechanics showing wave-particle duality.',
    category: 'optics',
    sources: [
      { type: 'plane-wave', x: 30, y: 75, frequency: 5e14, amplitude: 1.0, phase: 0 }
    ],
    obstacles: [
      { x: 80, y: 40, width: 3, height: 25, material: { epsilon: 1, mu: 1, sigma: 1e7 } },
      { x: 80, y: 68, width: 3, height: 4, material: { epsilon: 1, mu: 1, sigma: 1e7 } },
      { x: 80, y: 77, width: 3, height: 4, material: { epsilon: 1, mu: 1, sigma: 1e7 } },
      { x: 80, y: 86, width: 3, height: 25, material: { epsilon: 1, mu: 1, sigma: 1e7 } }
    ],
    recommendedSettings: {
      fieldMode: 'Intensity',
      showVectors: false
    },
    instructions: 'Coherent light through two slits creates interference fringes. Bright and dark bands show wave superposition.',
    physicalSetup: 'Monochromatic light source, opaque barrier with two narrow slits, observation screen'
  },
  {
    id: 'millikan-oil-drop',
    name: "Millikan's Oil Drop Experiment",
    year: 1909,
    scientist: 'Robert Millikan',
    description: 'Measured electron\'s charge, a cornerstone for quantized electric charge',
    significance: 'First precise measurement of elementary charge (e = 1.602×10⁻¹⁹ C). Proved charge quantization: all charges are integer multiples of e. Nobel Prize 1923.',
    category: 'quantum',
    sources: [
      { type: 'point-charge', x: 100, y: 50, frequency: 1e8, amplitude: 1.5, phase: 0, charge: 1.6e-19 },
      { type: 'point-charge', x: 100, y: 70, frequency: 1e8, amplitude: 1.5, phase: 0, charge: 3.2e-19 },
      { type: 'point-charge', x: 100, y: 90, frequency: 1e8, amplitude: 1.5, phase: 0, charge: 4.8e-19 }
    ],
    obstacles: [
      { x: 70, y: 40, width: 60, height: 2, material: { epsilon: 1, mu: 1, sigma: 1e7 } },
      { x: 70, y: 108, width: 60, height: 2, material: { epsilon: 1, mu: 1, sigma: 1e7 } }
    ],
    recommendedSettings: {
      fieldMode: 'Ez',
      showVectors: true
    },
    instructions: 'Charged oil droplets suspended between parallel plates. Electric field balances gravity, revealing quantized charge.',
    physicalSetup: 'Atomizer sprays oil droplets between parallel plate capacitor with microscope observation'
  }
];

/**
 * Get experiments sorted chronologically
 */
export function getExperimentsChronologically(): HistoricalExperiment[] {
  return [...HISTORICAL_EXPERIMENTS].sort((a, b) => a.year - b.year);
}

/**
 * Get experiments by category
 */
export function getExperimentsByCategory(category: HistoricalExperiment['category']): HistoricalExperiment[] {
  return HISTORICAL_EXPERIMENTS.filter(exp => exp.category === category);
}

/**
 * Get experiment by ID
 */
export function getHistoricalExperimentById(id: string): HistoricalExperiment | undefined {
  return HISTORICAL_EXPERIMENTS.find(exp => exp.id === id);
}
