import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/useSimulationStore';
import { getScaledDistance } from '../../utils/scaling';

interface AsteroidData {
  distanceAU: number;
  initialAngle: number;
  orbitalSpeed: number; // radians per simulation day
  inclination: number;
  scale: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  rotationAxis: THREE.Vector3;
}

const ASTEROID_COUNT = 2200;

export const AsteroidBelt: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const showAsteroids = useSimulationStore(state => state.showAsteroids);

  // Generate asteroid orbital parameters once
  const asteroids = useMemo<AsteroidData[]>(() => {
    const list: AsteroidData[] = [];
    for (let i = 0; i < ASTEROID_COUNT; i++) {
      // Main belt sits between 2.1 AU and 3.3 AU (Kirkwood gaps distribution)
      // Slight gaussian-like concentration around 2.7 AU
      const r1 = Math.random();
      const r2 = Math.random();
      const distanceAU = 2.1 + (r1 + r2) * 0.6; // 2.1 to 3.3 AU

      // Keplerian period in days = (distanceAU ^ 1.5) * 365.25
      const periodDays = Math.pow(distanceAU, 1.5) * 365.25;
      const orbitalSpeed = (Math.PI * 2) / periodDays;

      // Small random inclination (-9 to +9 degrees)
      const inclination = (Math.random() - 0.5) * THREE.MathUtils.degToRad(18);

      // Irregular scale
      const baseSize = 0.08 + Math.random() * 0.18;
      const scale = new THREE.Vector3(
        baseSize * (0.8 + Math.random() * 0.4),
        baseSize * (0.7 + Math.random() * 0.6),
        baseSize * (0.8 + Math.random() * 0.4)
      );

      list.push({
        distanceAU,
        initialAngle: Math.random() * Math.PI * 2,
        orbitalSpeed,
        inclination,
        scale,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ),
        rotationAxis: new THREE.Vector3(
          Math.random(),
          Math.random(),
          Math.random()
        ).normalize(),
      });
    }
    return list;
  }, []);

  // Geometry: low-poly dodecahedron for irregular rock shape
  const rockGeometry = useMemo(() => {
    const geom = new THREE.DodecahedronGeometry(1, 1);
    // Perturb vertices slightly for organic rocky look
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      v.multiplyScalar(0.85 + Math.random() * 0.3);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Frame update to revolve asteroids along their individual orbits
  useFrame(() => {
    if (!meshRef.current || !showAsteroids) return;

    const timeDays = useSimulationStore.getState().globalTimeElapsedDays;

    for (let i = 0; i < ASTEROID_COUNT; i++) {
      const ast = asteroids[i];
      const angle = ast.initialAngle + ast.orbitalSpeed * timeDays;
      const scaledDist = getScaledDistance(ast.distanceAU);

      const x = Math.cos(angle) * scaledDist;
      const z = Math.sin(angle) * scaledDist;
      const y = Math.sin(angle) * scaledDist * Math.sin(ast.inclination);

      dummy.position.set(x, y, z);
      dummy.scale.copy(ast.scale);

      // Tumbling rotation
      dummy.rotation.x = ast.rotationSpeed.x * timeDays * 0.1;
      dummy.rotation.y = ast.rotationSpeed.y * timeDays * 0.1;
      dummy.rotation.z = ast.rotationSpeed.z * timeDays * 0.1;

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!showAsteroids) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[rockGeometry, undefined, ASTEROID_COUNT]}
    >
      <meshStandardMaterial
        color="#857b70"
        roughness={0.9}
        metalness={0.1}
        bumpScale={0.05}
      />
    </instancedMesh>
  );
};

export default AsteroidBelt;
