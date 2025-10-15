import { useEffect, useRef, useState } from 'react';
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

/**
 * SimulationCanvas: WebGL/Three.js visualization of EM fields
 * 
 * Renders the electromagnetic field data from Maxwell solver as:
 * - 2D heatmap with color-coded intensity
 * - Optional vector field arrows
 * - Interactive camera controls
 */
export function SimulationCanvas({ 
  isPlaying, 
  solver, 
  fieldMode, 
  showVectors,
  onFieldClick 
}: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const vectorGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number>(0);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  useEffect(() => {
    if (!containerRef.current || !solver) return;
    
    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    setDimensions({ width, height });
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    sceneRef.current = scene;
    
    // Camera setup (orthographic for 2D view)
    const params = solver.getParams();
    const aspect = width / height;
    const frustumSize = params.nx;
    const camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    camera.position.set(params.nx / 2, params.ny / 2, 100);
    camera.lookAt(params.nx / 2, params.ny / 2, 0);
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Controls (orbit for 3D exploration)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false; // 2D mode
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.5;
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
    scene.add(mesh);
    meshRef.current = mesh;
    
    // Vector field group
    const vectorGroup = new THREE.Group();
    scene.add(vectorGroup);
    vectorGroupRef.current = vectorGroup;
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(params.nx, 20, 0x333366, 0x222244);
    gridHelper.rotation.x = Math.PI / 2;
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
      const { width, height } = container.getBoundingClientRect();
      setDimensions({ width, height });
      
      const aspect = width / height;
      camera.left = -frustumSize * aspect / 2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
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
  }, [solver]);
  
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
  }, [isPlaying, solver, fieldMode, showVectors]);
  
  // Update vector field visualization
  const updateVectorField = () => {
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
  };
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-gradient-to-br from-background to-muted rounded-lg overflow-hidden border border-border min-h-[320px] sm:min-h-[420px] md:min-h-[520px] lg:min-h-[600px]"
    />
  );
}
