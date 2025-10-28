import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MaxwellSolver } from '../lib/maxwell-solver';

interface SimulationCanvasProps {
  isPlaying: boolean;
  solver: MaxwellSolver | null;
  fieldMode: 'Ez' | 'Hx' | 'Hy' | 'Poynting' | 'Intensity';
  showVectors: boolean;
  onFieldClick?: (x: number, y: number) => void;
}

type CaptureOptions = {
  format?: 'image/png' | 'image/jpeg';
  quality?: number;
};

export interface SimulationCanvasHandle {
  captureFrame: (options?: CaptureOptions) => Promise<Blob>;
}

/**
 * SimulationCanvas: WebGL/Three.js visualization of EM fields
 * 
 * Renders the electromagnetic field data from Maxwell solver as:
 * - 2D heatmap with color-coded intensity
 * - Optional vector field arrows
 * - Interactive camera controls
 */
export const SimulationCanvas = forwardRef<SimulationCanvasHandle, SimulationCanvasProps>(function SimulationCanvas({ 
  isPlaying, 
  solver, 
  fieldMode, 
  showVectors,
  onFieldClick 
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const vectorGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Update vector field visualization
  const updateVectorField = useCallback(() => {
    if (!solver || !vectorGroupRef.current) return;

    // Clear existing vectors
    while (vectorGroupRef.current.children.length > 0) {
      vectorGroupRef.current.remove(vectorGroupRef.current.children[0]);
    }

    const params = solver.getParams();
    const fields = solver.getFields();
    const stride = 8; // Show vectors at every 8th grid point

    for (let j = 0; j < params.ny; j += stride) {
      for (let i = 0; i < params.nx; i += stride) {
        const idx = j * params.nx + i;
        const Hx = fields.Hx[idx];
        const Hy = fields.Hy[idx];
        const magnitude = Math.sqrt(Hx * Hx + Hy * Hy);

        if (magnitude > 0.001) {
          const dir = new THREE.Vector3(Hy, -Hx, 0).normalize();
          const origin = new THREE.Vector3(i, j, 0.5);
          const length = Math.min(magnitude * 5, stride * 0.8);
          const color = 0x00ffff;

          const arrow = new THREE.ArrowHelper(dir, origin, length, color, length * 0.2, length * 0.15);
          vectorGroupRef.current.add(arrow);
        }
      }
    }
  }, [solver]);

  useImperativeHandle(ref, () => ({
    captureFrame: (options?: CaptureOptions) => {
      return new Promise<Blob>((resolve, reject) => {
        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;

        if (!renderer || !scene || !camera) {
          reject(new Error('Visualization is not ready yet.'));
          return;
        }

        renderer.render(scene, camera);
        const canvas = renderer.domElement;
        const format = options?.format ?? 'image/png';
        const quality = options?.quality;

        if (canvas.toBlob) {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Canvas capture returned empty data.'));
              return;
            }
            resolve(blob);
          }, format, quality);
          return;
        }

        try {
          const dataUrl = canvas.toDataURL(format, quality);
          const base64 = dataUrl.split(',')[1];
          if (!base64) {
            reject(new Error('Failed to serialize canvas output.'));
            return;
          }
          const byteString = atob(base64);
          const arrayBuffer = new ArrayBuffer(byteString.length);
          const uintArray = new Uint8Array(arrayBuffer);
          for (let i = 0; i < byteString.length; i++) {
            uintArray[i] = byteString.charCodeAt(i);
          }
          resolve(new Blob([uintArray], { type: format }));
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Unknown capture error.'));
        }
      });
    }
  }), []);
  
  useEffect(() => {
    if (!containerRef.current || !solver) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    const params = solver.getParams();
    const aspect = width / Math.max(height, 1);
    const gridAspect = params.nx / params.ny;

    const computeFrustum = () => {
      if (aspect >= gridAspect) {
        const frustumHeight = params.ny;
        return {
          frustumWidth: frustumHeight * aspect,
          frustumHeight
        };
      }

      const frustumWidth = params.nx;
      return {
        frustumWidth,
        frustumHeight: frustumWidth / aspect
      };
    };

    const { frustumWidth, frustumHeight } = computeFrustum();

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    sceneRef.current = scene;
    
    // Camera setup (orthographic for perfect 2D rectangular view)
    const camera = new THREE.OrthographicCamera(
      -frustumWidth / 2,
      frustumWidth / 2,
      frustumHeight / 2,
      -frustumHeight / 2,
      0.1,
      1000
    );
    // Position camera directly above center, looking straight down
    camera.position.set(params.nx / 2, params.ny / 2, 100);
    camera.lookAt(params.nx / 2, params.ny / 2, 0);
    camera.up.set(0, 1, 0); // Ensure camera is perfectly upright (Y-axis is up)
    camera.rotation.set(0, 0, 0); // No rotation at all
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Controls - strict 2D mode (no rotation allowed)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false; // Prevent rotation
    controls.enablePan = true; // Allow panning
    controls.enableZoom = true; // Allow zoom
    controls.zoomSpeed = 0.5;
    controls.screenSpacePanning = true; // Pan in screen space (more intuitive for 2D)
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    controls.target.set(params.nx / 2, params.ny / 2, 0);
    controls.update();
    controlsRef.current = controls;
    
    // Create field visualization plane
    const geometry = new THREE.PlaneGeometry(params.nx, params.ny, params.nx - 1, params.ny - 1);
    
    // Custom shader material for field visualization
    const material = new THREE.ShaderMaterial({
      uniforms: {
        fieldData: { value: new THREE.DataTexture(new Float32Array(params.nx * params.ny), params.nx, params.ny, THREE.RedFormat, THREE.FloatType) },
        colorScale: { value: 1.0 },
        minValue: { value: -1.0 },
        maxValue: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D fieldData;
        uniform float colorScale;
        uniform float minValue;
        uniform float maxValue;
        varying vec2 vUv;
        
        // Turbo colormap (perceptually uniform)
        vec3 turboColormap(float t) {
          const vec3 c0 = vec3(0.1140890109226559, 0.06288340699912215, 0.2248337216805064);
          const vec3 c1 = vec3(6.716419496985708, 3.182286745507522, 7.571581586103393);
          const vec3 c2 = vec3(-66.09402360453038, -4.9279827041226, -10.09439367561635);
          const vec3 c3 = vec3(228.7660791526501, 25.04986699771073, -91.54105330182436);
          const vec3 c4 = vec3(-334.8351565777451, -69.31749712757485, 288.5858850615712);
          const vec3 c5 = vec3(218.7637218434795, 67.52150567819112, -305.2045772184957);
          const vec3 c6 = vec3(-52.88903478218835, -21.54527364654712, 110.5174647748972);
          
          return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
        }
        
        void main() {
          float value = texture2D(fieldData, vUv).r;
          float normalized = (value - minValue) / (maxValue - minValue);
          normalized = clamp(normalized, 0.0, 1.0);
          
          vec3 color = turboColormap(normalized);
          gl_FragColor = vec4(color, 0.95);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(params.nx / 2, params.ny / 2, 0);
    mesh.rotation.set(0, 0, 0); // Ensure no rotation
    scene.add(mesh);
    meshRef.current = mesh;
    
    // Vector field group
    const vectorGroup = new THREE.Group();
    scene.add(vectorGroup);
    vectorGroupRef.current = vectorGroup;
    
    // Simple 2D grid overlay (no 3D perspective effect)
    const gridHelper = new THREE.GridHelper(params.nx, 20, 0x333366, 0x222244);
    gridHelper.rotation.x = Math.PI / 2; // Flat on XY plane
    gridHelper.rotation.y = 0;
    gridHelper.rotation.z = 0;
    gridHelper.position.set(params.nx / 2, params.ny / 2, -0.5);
    scene.add(gridHelper);
    
    // Mouse click handler
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(mesh);
      
      if (intersects.length > 0 && onFieldClick) {
        const point = intersects[0].point;
        onFieldClick(point.x, point.y);
      }
    };
    
    renderer.domElement.addEventListener('click', handleClick);
    
    // Resize handler
    const handleResize = () => {
      const { width: newWidth, height: newHeight } = container.getBoundingClientRect();
      const newAspect = newWidth / Math.max(newHeight, 1);

      let nextFrustumWidth: number;
      let nextFrustumHeight: number;

      if (newAspect >= gridAspect) {
        nextFrustumHeight = params.ny;
        nextFrustumWidth = nextFrustumHeight * newAspect;
      } else {
        nextFrustumWidth = params.nx;
        nextFrustumHeight = nextFrustumWidth / newAspect;
      }
      
      camera.left = -nextFrustumWidth / 2;
      camera.right = nextFrustumWidth / 2;
      camera.top = nextFrustumHeight / 2;
      camera.bottom = -nextFrustumHeight / 2;
      camera.updateProjectionMatrix();
      
      renderer.setSize(newWidth, newHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
  renderer.domElement.removeEventListener('click', handleClick);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [solver, onFieldClick]);
  
  // Update field visualization
  useEffect(() => {
    if (!solver || !meshRef.current || !isPlaying) return;
    
    const updateFields = () => {
      if (!solver || !meshRef.current) return;
      
      const params = solver.getParams();
      const material = meshRef.current.material as THREE.ShaderMaterial;
      
      let fieldData: Float32Array;
      
      switch (fieldMode) {
        case 'Ez':
          fieldData = solver.getFields().Ez;
          break;
        case 'Hx':
          fieldData = solver.getFields().Hx;
          break;
        case 'Hy':
          fieldData = solver.getFields().Hy;
          break;
        case 'Poynting':
          fieldData = solver.getPoyntingVector();
          break;
        case 'Intensity':
          fieldData = solver.getIntensity();
          break;
        default:
          fieldData = solver.getFields().Ez;
      }
      
      // Find min/max for color scaling
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < fieldData.length; i++) {
        if (fieldData[i] < min) min = fieldData[i];
        if (fieldData[i] > max) max = fieldData[i];
      }
      
      // Update texture
      const texture = new THREE.DataTexture(fieldData, params.nx, params.ny, THREE.RedFormat, THREE.FloatType);
      texture.needsUpdate = true;
      material.uniforms.fieldData.value = texture;
      material.uniforms.minValue.value = min;
      material.uniforms.maxValue.value = max;
      
      // Update vectors if enabled
      if (showVectors && vectorGroupRef.current) {
        updateVectorField();
      }
      
      // Run simulation step
      solver.step();
    };
    
    const interval = setInterval(updateFields, 1000 / 60); // 60 FPS
    
    return () => clearInterval(interval);
  }, [isPlaying, solver, fieldMode, showVectors, updateVectorField]);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-gradient-to-br from-background to-muted rounded-lg border border-border"
      style={{ minHeight: '500px', aspectRatio: '5/3' }}
    />
  );
});