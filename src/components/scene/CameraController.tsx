import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/useSimulationStore';
import { solarSystemData } from '../../data/solarSystemData';
import { getScaledRadius } from '../../utils/scaling';

const CameraController: React.FC = () => {
  const controlsRef = useRef<any>(null);
  const { camera, scene } = useThree();
  const selectedPlanetId = useSimulationStore(state => state.selectedPlanetId);
  
  // Track target position for semantic orbital camera
  const targetPos = useRef(new THREE.Vector3());

  // Set initial camera position
  useEffect(() => {
    camera.position.set(0, 80, 150);
  }, [camera]);

  useFrame(() => {
    if (!controlsRef.current) return;
    
    // We update simulation time here since Camera is active every frame
    const delta = globalThis.performance.now(); // Not perfect but good enough for demo if useFrame delta isn't used
    // Actually use the r3f state delta
  });
  
  // Separate useFrame for delta injection
  useFrame((state, delta) => {
    useSimulationStore.getState().incrementTime(delta);
    
    // Camera follow logic
    if (selectedPlanetId && controlsRef.current) {
      // Find the mesh in the scene
      let planetMesh: THREE.Object3D | undefined;
      
      // Need a recursive deep search just in case
      scene.traverse((child) => {
        if (child.name === selectedPlanetId && child.type === 'Mesh') {
          planetMesh = child;
        }
      });

      if (planetMesh) {
        // Get global position
        const globalPos = new THREE.Vector3();
        planetMesh.getWorldPosition(globalPos);
        
        // Lerp controls target to the planet's position
        controlsRef.current.target.lerp(globalPos, 0.05);
        
        // Optional: Also lerp camera position slightly to follow the object if it's moving fast
        // but OrbitControls handles pan. We only lerp target so user can still zoom and orbit around the moving target.
      }
    } else if (!selectedPlanetId && controlsRef.current) {
      // Return target to sun if none selected
      controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
    }
    
    controlsRef.current.update();
  });

  return (
    <OrbitControls 
      ref={controlsRef} 
      enableDamping 
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={2000}
      enablePan={true}
    />
  );
};

export default CameraController;
