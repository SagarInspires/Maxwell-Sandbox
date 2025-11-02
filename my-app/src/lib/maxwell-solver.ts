/**
 * Maxwell's Equations FDTD (Finite-Difference Time-Domain) Solver
 * 
 * Solves the curl equations in 2D (TE or TM mode):
 * ∂E/∂t = (1/ε) * (∇ × H) - (σ/ε) * E
 * ∂H/∂t = -(1/μ) * (∇ × E)
 * 
 * Uses Yee lattice for spatial discretization and leapfrog time-stepping
 */

export interface GridParams {
  nx: number; // Grid points in x
  ny: number; // Grid points in y
  dx: number; // Spatial step (meters)
  dy: number; // Spatial step (meters)
  dt: number; // Time step (seconds)
}

export interface Material {
  epsilon: number; // Permittivity (relative)
  mu: number; // Permeability (relative)
  sigma: number; // Conductivity (S/m)
}

export interface Source {
  id: string;
  type: 'dipole' | 'plane-wave' | 'antenna' | 'gaussian' | 'wire' | 'point-charge' | 'magnet' | 'current-loop';
  x: number; // Grid position
  y: number;
  frequency: number; // Hz
  amplitude: number;
  phase: number; // radians
  width?: number; // For Gaussian beams
  length?: number; // For wire and current loop
  angle?: number; // Rotation angle in radians
  charge?: number; // For point charges (Coulombs)
  current?: number; // For current-carrying wires (Amperes)
  polarity?: 'N-S' | 'S-N'; // For magnets
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  material: Material;
}

export class MaxwellSolver {
  private params: GridParams;
  
  // Field arrays (TE mode: Ez, Hx, Hy)
  private Ez: Float32Array; // Electric field z-component
  private Hx: Float32Array; // Magnetic field x-component
  private Hy: Float32Array; // Magnetic field y-component
  
  // Material arrays
  private epsilon: Float32Array; // Permittivity map
  private mu: Float32Array; // Permeability map
  private sigma: Float32Array; // Conductivity map
  
  // Update coefficients (pre-computed for efficiency)
  private Ca: Float32Array; // E-field update coefficient
  private Cb: Float32Array; // E-field curl coefficient
  private Da: Float32Array; // H-field update coefficient
  private Db: Float32Array; // H-field curl coefficient
  
  private sources: Source[] = [];
  private obstacles: Obstacle[] = [];
  private time: number = 0;
  
  // Physical constants
  private readonly c0 = 299792458; // Speed of light (m/s)
  private readonly eps0 = 8.854187817e-12; // Vacuum permittivity
  private readonly mu0 = 4 * Math.PI * 1e-7; // Vacuum permeability
  private readonly pmlThickness = 20; // Grid cells dedicated to PML boundaries
  private readonly pmlOrder = 3;
  private readonly pmlReflection = 1e-6;
  
  constructor(params: GridParams) {
    this.params = params;
    const size = params.nx * params.ny;
    
    // Initialize field arrays
    this.Ez = new Float32Array(size);
    this.Hx = new Float32Array(size);
    this.Hy = new Float32Array(size);
    
    // Initialize material arrays (default: vacuum)
    this.epsilon = new Float32Array(size).fill(1.0);
    this.mu = new Float32Array(size).fill(1.0);
    this.sigma = new Float32Array(size).fill(0.0);
    
    // Initialize update coefficients
    this.Ca = new Float32Array(size);
    this.Cb = new Float32Array(size);
    this.Da = new Float32Array(size);
    this.Db = new Float32Array(size);
    
    this.setupPML();
    this.updateCoefficients();
  }
  
  /**
   * Pre-compute update coefficients for efficiency
   * Coefficients depend on material properties and grid parameters
   */
  private updateCoefficients(): void {
    const { nx, ny, dt, dx, dy } = this.params;
    
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const idx = j * nx + i;
        const eps = this.epsilon[idx] * this.eps0;
        const sig = this.sigma[idx];
        const mu_val = this.mu[idx] * this.mu0;
        
        // E-field coefficients (with lossy term)
        this.Ca[idx] = (1 - sig * dt / (2 * eps)) / (1 + sig * dt / (2 * eps));
        this.Cb[idx] = (dt / eps) / (1 + sig * dt / (2 * eps));
        
        // H-field coefficients
        this.Da[idx] = 1.0;
        this.Db[idx] = dt / mu_val;
      }
    }
  }

  /**
   * Initialize perfectly matched layer (PML) absorbing boundary regions.
   * Adds graded conductivity near the simulation edges to attenuate outgoing waves
   * before they reach the hard walls, reducing artificial reflections.
   */
  private setupPML(): void {
    const { nx, ny, dx, dy } = this.params;
    const thickness = Math.min(this.pmlThickness, Math.floor(Math.min(nx, ny) / 4));
    if (thickness <= 0) return;

    const eta0 = Math.sqrt(this.mu0 / this.eps0);
    const sigmaMaxX = -(this.pmlOrder + 1) * Math.log(this.pmlReflection) / (2 * eta0 * thickness * dx);
    const sigmaMaxY = -(this.pmlOrder + 1) * Math.log(this.pmlReflection) / (2 * eta0 * thickness * dy);

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const idx = j * nx + i;

        let sigmaX = 0;
        if (i < thickness) {
          const ratio = (thickness - i) / thickness;
          sigmaX = sigmaMaxX * Math.pow(ratio, this.pmlOrder);
        } else if (i >= nx - thickness) {
          const ratio = (i - (nx - thickness - 1)) / thickness;
          sigmaX = sigmaMaxX * Math.pow(Math.min(ratio, 1), this.pmlOrder);
        }

        let sigmaY = 0;
        if (j < thickness) {
          const ratio = (thickness - j) / thickness;
          sigmaY = sigmaMaxY * Math.pow(ratio, this.pmlOrder);
        } else if (j >= ny - thickness) {
          const ratio = (j - (ny - thickness - 1)) / thickness;
          sigmaY = sigmaMaxY * Math.pow(Math.min(ratio, 1), this.pmlOrder);
        }

        const pmlSigma = sigmaX + sigmaY;
        if (pmlSigma > 0) {
          this.sigma[idx] = Math.max(this.sigma[idx], pmlSigma);
        }
      }
    }
  }
  
  /**
   * Update magnetic field components (Hx, Hy)
   * Leapfrog scheme: H^(n+1/2) from E^n
   */
  private updateH(): void {
    const { nx, ny, dx, dy } = this.params;
    
    // Update Hx (uses Ez)
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx; i++) {
        const idx = j * nx + i;
        const dEz_dy = (this.Ez[idx + nx] - this.Ez[idx]) / dy;
        this.Hx[idx] = this.Da[idx] * this.Hx[idx] - this.Db[idx] * dEz_dy;
      }
    }
    
    // Update Hy (uses Ez)
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const idx = j * nx + i;
        const dEz_dx = (this.Ez[idx + 1] - this.Ez[idx]) / dx;
        this.Hy[idx] = this.Da[idx] * this.Hy[idx] + this.Db[idx] * dEz_dx;
      }
    }
  }
  
  /**
   * Update electric field component (Ez)
   * Leapfrog scheme: E^(n+1) from H^(n+1/2)
   */
  private updateE(): void {
    const { nx, ny, dx, dy } = this.params;
    
    // Update Ez (uses Hx and Hy)
    for (let j = 1; j < ny; j++) {
      for (let i = 1; i < nx; i++) {
        const idx = j * nx + i;
        const dHy_dx = (this.Hy[idx] - this.Hy[idx - 1]) / dx;
        const dHx_dy = (this.Hx[idx] - this.Hx[idx - nx]) / dy;
        const curlH = dHy_dx - dHx_dy;
        
        this.Ez[idx] = this.Ca[idx] * this.Ez[idx] + this.Cb[idx] * curlH;
      }
    }
  }
  
  /**
   * Apply source excitations at current time step
   */
  private applySources(): void {
  const { nx, ny, dt } = this.params;
    const omega = 2 * Math.PI;
    
    for (const source of this.sources) {
      const i = Math.floor(source.x);
      const j = Math.floor(source.y);
      
      if (i < 0 || i >= nx || j < 0 || j >= ny) continue;
      
      const idx = j * nx + i;
      const t = this.time * dt;
      const freq = source.frequency;
      
      let value = 0;
      
      switch (source.type) {
        case 'dipole':
        case 'antenna':
          // Sinusoidal source: A * sin(ωt + φ)
          value = source.amplitude * Math.sin(omega * freq * t + source.phase);
          this.Ez[idx] += value;
          break;
          
        case 'plane-wave':
          // Plane wave with soft source
          value = source.amplitude * Math.sin(omega * freq * t + source.phase);
          this.Ez[idx] += value;
          break;
          
        case 'gaussian':
          // Gaussian pulse: A * exp(-((t - t0) / τ)^2) * sin(ωt)
          const t0 = 3 / freq; // Pulse center time
          const tau = 1 / freq; // Pulse width
          const envelope = Math.exp(-Math.pow((t - t0) / tau, 2));
          value = source.amplitude * envelope * Math.sin(omega * freq * t + source.phase);
          this.Ez[idx] += value;
          break;
          
        case 'wire':
          // Current-carrying wire: creates circular magnetic field
          // Apply along wire length with direction
          const wireLength = source.length || 20;
          const wireAngle = source.angle || 0;
          const current = source.current || 1.0;
          
          for (let k = 0; k < wireLength; k++) {
            const wi = Math.floor(i + k * Math.cos(wireAngle));
            const wj = Math.floor(j + k * Math.sin(wireAngle));
            if (wi >= 0 && wi < nx && wj >= 0 && wj < ny) {
              const widx = wj * nx + wi;
              // Time-varying current creates EM wave
              const wireCurrent = current * Math.sin(omega * freq * t + source.phase);
              this.Ez[widx] += wireCurrent * source.amplitude * 0.5;
            }
          }
          break;
          
        case 'point-charge':
          // Stationary charge creates radial E-field
          // Oscillating charge creates EM radiation
          const charge = source.charge || 1e-9; // 1 nC
          const oscillation = Math.sin(omega * freq * t + source.phase);
          
          // Apply radial field pattern
          for (let dj = -10; dj <= 10; dj++) {
            for (let di = -10; di <= 10; di++) {
              const ci = i + di;
              const cj = j + dj;
              if (ci >= 0 && ci < nx && cj >= 0 && cj < ny) {
                const cidx = cj * nx + ci;
                const r = Math.sqrt(di * di + dj * dj) + 1e-6;
                const fieldStrength = (charge / (r * r)) * oscillation;
                this.Ez[cidx] += fieldStrength * source.amplitude;
              }
            }
          }
          break;
          
        case 'magnet':
          // Magnetic dipole: creates dipole magnetic field pattern
          const magnetStrength = source.amplitude;
          const magnetAngle = source.angle || 0;
          const polarity = source.polarity === 'N-S' ? 1 : -1;
          
          // Create dipole pattern
          for (let dj = -15; dj <= 15; dj++) {
            for (let di = -15; di <= 15; di++) {
              const mi = i + di;
              const mj = j + dj;
              if (mi >= 0 && mi < nx && mj >= 0 && mj < ny) {
                const midx = mj * nx + mi;
                const r = Math.sqrt(di * di + dj * dj) + 1e-6;
                
                // Rotate coordinates for angled magnet
                const dx_rot = di * Math.cos(magnetAngle) - dj * Math.sin(magnetAngle);
                const dy_rot = di * Math.sin(magnetAngle) + dj * Math.cos(magnetAngle);
                
                // Dipole field components
                const dipoleField = polarity * magnetStrength * (3 * dx_rot * dy_rot) / Math.pow(r, 5);
                this.Ez[midx] += dipoleField * Math.sin(omega * freq * t + source.phase);
              }
            }
          }
          break;
          
        case 'current-loop':
          // Circular current loop creates magnetic dipole
          const loopRadius = source.width || 10;
          const loopCurrent = source.current || 1.0;
          const numPoints = Math.floor(2 * Math.PI * loopRadius);
          
          for (let k = 0; k < numPoints; k++) {
            const theta = (2 * Math.PI * k) / numPoints;
            const li = Math.floor(i + loopRadius * Math.cos(theta));
            const lj = Math.floor(j + loopRadius * Math.sin(theta));
            
            if (li >= 0 && li < nx && lj >= 0 && lj < ny) {
              const lidx = lj * nx + li;
              const loopField = loopCurrent * Math.sin(omega * freq * t + source.phase);
              this.Ez[lidx] += loopField * source.amplitude * 0.3;
            }
          }
          break;
      }
    }
  }
  
  /**
   * Apply boundary conditions (absorbing boundaries - Mur ABC)
   * Simple first-order absorbing boundary
   */
  private applyBoundaries(): void {
    const { nx, ny } = this.params;
    
    // Zero boundaries (simple but reflective - can be improved with PML)
    // Left and right
    for (let j = 0; j < ny; j++) {
      this.Ez[j * nx] = 0;
      this.Ez[j * nx + nx - 1] = 0;
    }
    
    // Top and bottom
    for (let i = 0; i < nx; i++) {
      this.Ez[i] = 0;
      this.Ez[(ny - 1) * nx + i] = 0;
    }
  }
  
  /**
   * Single time step: advance simulation by dt
   */
  public step(): void {
    this.updateH(); // H^(n+1/2) from E^n
    this.applySources(); // Add sources
    this.updateE(); // E^(n+1) from H^(n+1/2)
    this.applyBoundaries(); // Apply boundary conditions
    this.time++;
  }
  
  /**
   * Run multiple time steps
   */
  public run(steps: number): void {
    for (let i = 0; i < steps; i++) {
      this.step();
    }
  }
  
  /**
   * Add a wave source to the simulation
   */
  public addSource(source: Source): void {
    this.sources.push(source);
  }
  
  /**
   * Remove a source by id
   */
  public removeSource(id: string): void {
    this.sources = this.sources.filter(s => s.id !== id);
  }
  
  /**
   * Update source parameters
   */
  public updateSource(id: string, updates: Partial<Source>): void {
    const source = this.sources.find(s => s.id === id);
    if (source) {
      Object.assign(source, updates);
    }
  }
  
  /**
   * Add an obstacle with specific material properties
   */
  public addObstacle(obstacle: Obstacle): void {
  this.obstacles.push(obstacle);
  this.applyObstacle(obstacle);
  this.setupPML();
  this.updateCoefficients();
  }
  
  /**
   * Remove an obstacle by id
   */
  public removeObstacle(id: string): void {
    const obstacle = this.obstacles.find(o => o.id === id);
    if (obstacle) {
  this.removeObstacleMaterial(obstacle);
  this.obstacles = this.obstacles.filter(o => o.id !== id);
  this.setupPML();
  this.updateCoefficients();
    }
  }
  
  /**
   * Apply obstacle material to grid
   */
  private applyObstacle(obstacle: Obstacle): void {
    const { nx } = this.params;
    const x1 = Math.floor(obstacle.x);
    const y1 = Math.floor(obstacle.y);
    const x2 = Math.floor(obstacle.x + obstacle.width);
    const y2 = Math.floor(obstacle.y + obstacle.height);
    
    for (let j = y1; j < y2; j++) {
      for (let i = x1; i < x2; i++) {
        if (i >= 0 && i < this.params.nx && j >= 0 && j < this.params.ny) {
          const idx = j * nx + i;
          this.epsilon[idx] = obstacle.material.epsilon;
          this.mu[idx] = obstacle.material.mu;
          this.sigma[idx] = obstacle.material.sigma;
        }
      }
    }
  }
  
  /**
   * Remove obstacle material (reset to vacuum)
   */
  private removeObstacleMaterial(obstacle: Obstacle): void {
    const { nx } = this.params;
    const x1 = Math.floor(obstacle.x);
    const y1 = Math.floor(obstacle.y);
    const x2 = Math.floor(obstacle.x + obstacle.width);
    const y2 = Math.floor(obstacle.y + obstacle.height);
    
    for (let j = y1; j < y2; j++) {
      for (let i = x1; i < x2; i++) {
        if (i >= 0 && i < this.params.nx && j >= 0 && j < this.params.ny) {
          const idx = j * nx + i;
          this.epsilon[idx] = 1.0;
          this.mu[idx] = 1.0;
          this.sigma[idx] = 0.0;
        }
      }
    }
  }
  
  /**
   * Reset simulation to initial state
   */
  public reset(): void {
    this.Ez.fill(0);
    this.Hx.fill(0);
    this.Hy.fill(0);
  this.time = 0;
  this.setupPML();
  }
  
  /**
   * Get current field data
   */
  public getFields(): { Ez: Float32Array; Hx: Float32Array; Hy: Float32Array } {
    return { Ez: this.Ez, Hx: this.Hx, Hy: this.Hy };
  }
  
  /**
   * Get field value at specific position
   */
  public getFieldAt(x: number, y: number): { Ez: number; Hx: number; Hy: number } {
    const { nx } = this.params;
    const i = Math.floor(x);
    const j = Math.floor(y);
    const idx = j * nx + i;
    
    return {
      Ez: this.Ez[idx] || 0,
      Hx: this.Hx[idx] || 0,
      Hy: this.Hy[idx] || 0
    };
  }
  
  /**
   * Calculate Poynting vector (energy flow): S = E × H
   * Returns magnitude of Poynting vector at each point
   */
  public getPoyntingVector(): Float32Array {
    const size = this.params.nx * this.params.ny;
    const poynting = new Float32Array(size);
    
    for (let i = 0; i < size; i++) {
      // S_z = Ex * Hy - Ey * Hx (for TE mode with Ez only)
      // Simplified: |S| ≈ |Ez| * sqrt(Hx^2 + Hy^2)
      const H_mag = Math.sqrt(this.Hx[i] * this.Hx[i] + this.Hy[i] * this.Hy[i]);
      poynting[i] = Math.abs(this.Ez[i]) * H_mag;
    }
    
    return poynting;
  }
  
  /**
   * Calculate field intensity (|E|^2)
   */
  public getIntensity(): Float32Array {
    const size = this.params.nx * this.params.ny;
    const intensity = new Float32Array(size);
    
    for (let i = 0; i < size; i++) {
      intensity[i] = this.Ez[i] * this.Ez[i];
    }
    
    return intensity;
  }
  
  /**
   * Get simulation parameters
   */
  public getParams(): GridParams {
    return this.params;
  }
  
  /**
   * Get current simulation time
   */
  public getTime(): number {
    return this.time * this.params.dt;
  }
  
  /**
   * Get all sources
   */
  public getSources(): Source[] {
    return this.sources;
  }
  
  /**
   * Get all obstacles
   */
  public getObstacles(): Obstacle[] {
    return this.obstacles;
  }
}
