# Maxwell Sandbox
Maxwell Sandbox is an interactive electromagnetic wave laboratory built with React, Three.js, and a custom 2D FDTD (finite-difference time-domain) solver. Explore classic experiments such as the double-slit, Faraday shielding, waveguides, and metamaterials with real-time visuals, live metrics, audio feedback, and exportable snapshots.

## Highlights

- **Research-grade Solver**: TE-mode Maxwell equations on a Yee grid with CFL-stable stepping, heterogeneous materials, and perfectly matched layer (PML) absorbing boundaries that suppress artificial reflections.
- **Experiment Presets**: One-click setups for Young''s double slit, Faraday cage, magnetic dipole, metamaterial refraction, and additional historical scenarios with recommended visualization modes.
- **Interactive Controls**: Add, edit, or remove sources and obstacles, tune frequency and amplitude, and probe any grid cell for Ez/Hx/Hy values.
- **Immersive Visualization**: Orthographic Three.js canvas with turbo colormap, optional vector arrows, responsive layout, and toolbar controls for play, pause, reset, field mode, and audio sonification.
- **Live Metrics and Export**: Stream maximum and average intensity, peak Poynting magnitude, total energy, and simulation clock; export synchronized PNG snapshots and JSON metric reports.
- **Quality Tooling**: TypeScript-first codebase with ESLint, Stylelint, Tailwind/Shadcn UI primitives, CSS variable validation, and reusable hooks.

## Tech Stack

- Core: React 19, Vite 7, TypeScript 5
- 3D and Math: Three.js, @react-three/fiber, @react-three/drei
- UI: Tailwind CSS, Shadcn/ui, Radix primitives, Lucide icons
- Tooling: ESLint, Stylelint, TypeScript, Sonner, date-fns, Zod

## Repository Layout

```
Maxwell-Sandbox/
├─ my-app/                # Vite project root
│  ├─ src/
│  │  ├─ components/      # UI, canvas, control panels, shadcn wrappers
│  │  ├─ hooks/           # React hooks (toast manager, responsive helpers)
│  │  ├─ lib/
│  │  │  ├─ maxwell-solver.ts         # 2D FDTD engine with PML
│  │  │  ├─ experiments.ts            # Modern experiment presets
│  │  │  └─ historical-experiments.tsx# Curated timeline scenarios
│  │  └─ main.tsx, App.tsx            # Application bootstrap and composition
│  ├─ public/             # Static assets and redirects
│  └─ package.json        # App-level dependencies and scripts
├─ package.json           # Workspace helper scripts
└─ vercel.json            # Monorepo build and deployment config for Vercel
```

## Getting Started

### Prerequisites

- Node.js 18 or newer (latest LTS recommended)
- npm 9 or newer

### Installation

```bash
# Clone the repository
git clone https://github.com/SagarInspires/Maxwell-Sandbox.git
cd Maxwell-Sandbox

# Install dependencies (runs npm install inside my-app)
npm run install:all
```

### Development Server

```bash
# From repo root
npm run dev

# Or directly in the Vite project
cd my-app
npm run dev
```

Browse to http://localhost:5173/ for hot reloading during development.

### Production Build

```bash
cd my-app
npm run build     # Outputs to my-app/dist
npm run preview   # Serves the production build locally
```

### Quality Checks

```bash
cd my-app
npm run lint              # TypeScript, ESLint, Stylelint, CSS variable/class audits
npm run lint:types        # Type-only diagnostics
npm run lint:js           # ESLint for ts/tsx files
npm run lint:css          # Stylelint with auto-fix
npm run check:css-vars    # Ensures Tailwind variables exist in CSS
npm run check:css-classes # Validates Tailwind class usage
```

## Using the Sandbox

- **Toolbar**: Play or pause the solver, reset the grid, switch field visualization (Ez, Hx, Hy, Poynting, Intensity), toggle vector arrows, enable audio sonification, and export results.
- **Control Panel**: Manage sources and obstacles, adjust parameters, and load curated experiments or historical scenarios.
- **Simulation Canvas**: Orthographic Three.js renderer with pan and zoom. Click anywhere to inspect Ez, Hx, and Hy at that point; the camera auto-fits the full grid while the PML absorbs edge reflections.
- **Metrics Panel**: Streams intensity, Poynting, total energy, and simulated time via the same solver metrics used for exports.

### Exporting Results

Selecting **Export** downloads two files:

1. A PNG screenshot of the canvas.
2. A `*.metrics.json` report with timestamped solver parameters, intensity statistics, Poynting peaks, active sources, obstacles, and visualization flags.

Pair them for lab notes, lectures, or regression comparisons.

## Deployment

`vercel.json` configures Vercel to install dependencies and build from `my-app`:

```bash
npm install --prefix my-app
npm run build --prefix my-app
```

Reuse the same steps in any CI/CD pipeline and serve `my-app/dist`.

## Simulation Notes

- Default grid: 250 x 150 cells at roughly 20 samples per wavelength (about 6 cm at 5 to 6 GHz).
- PML thickness: 20 cells with third-order grading and 1e-6 target reflection.
- Experiment presets live in `lib/experiments.ts` and `lib/historical-experiments.tsx`; extend or modify as needed.
- Solver parameters (grid size, CFL condition, PML strength) are centralized in `lib/maxwell-solver.ts`.

## Troubleshooting

- **"vite: command not found" during CI**: Ensure the build runs with `--prefix my-app` or reuse the provided `vercel.json`.
- **High GPU usage**: Reduce grid size in the solver initialization inside `App.tsx` or pause the simulation when idle.
- **Unexpected reflections**: Increase `pmlThickness` or adjust material conductivities if you introduce custom obstacles.

## Contributing

Pull requests and issues are welcome. Please run `npm run lint` inside `my-app` before submitting changes.

