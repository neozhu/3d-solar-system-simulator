import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/useSimulationStore';
import { solarSystemData } from '../../data/solarSystemData';
import { getScaledRadius } from '../../utils/scaling';

// ============================================================
// CameraDirector — Cinema-Level Camera System
//
// A state-machine camera controller that orchestrates cinematic
// transitions, adaptive framing, breathing animations, and
// automated flythrough tours for the solar system scene.
//
// Modes:
//   INTRO          → Opening cinematic flyover on first load
//   FREE           → User-controlled orbit with subtle breathing
//   TRANSITIONING  → Multi-phase arc transition between targets
//   FOLLOW         → Tracking a selected planet with breathing
//   TOUR           → Automated sequential flythrough of all planets
// ============================================================

// ---------- Easing Functions ----------

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

// ---------- Constants ----------

const OVERVIEW_POSITION = new THREE.Vector3(0, 80, 150);
const OVERVIEW_TARGET   = new THREE.Vector3(0, 0, 0);
const INTRO_START_POS   = new THREE.Vector3(0, 400, 800);

const FREE_FOV     = 50;
const FOLLOW_FOV   = 35;
const INTRO_FOV    = 60;

const INTRO_DURATION    = 4.0;   // seconds
const TOUR_HOLD_TIME    = 4.0;   // seconds per planet
const TOUR_INITIAL_HOLD = 0.5;   // brief pause before first tour transition

// ---------- Interfaces ----------

interface TransitionState {
  startTarget: THREE.Vector3;
  endOffset: THREE.Vector3;
  curve: THREE.CatmullRomCurve3;
  startFov: number;
  endFov: number;
  duration: number;
  elapsed: number;
  targetPlanetId: string | null;
}

interface TourState {
  planetIds: string[];
  currentIndex: number;
  phase: 'transitioning' | 'holding';
  holdTimer: number;
  holdDuration: number;
}

// ============================================================
// Calculate ideal camera offset for viewing a target of given size.
// Larger bodies → camera further away. A 30° elevation angle
// gives a pleasing "three-quarter-view" perspective.
// ============================================================
function getIdealOffset(scaledRadius: number): THREE.Vector3 {
  const distance = Math.max(scaledRadius * 6, 10);
  const elevation = Math.PI / 6; // 30°

  return new THREE.Vector3(
    distance * Math.cos(elevation) * 0.8,
    distance * Math.sin(elevation),
    distance * Math.cos(elevation) * 0.6,
  );
}

// ============================================================
// Build an arc curve between two points. The curve rises above
// the direct line to create a cinematic flyover feel.
// ============================================================
function buildArcCurve(
  startPos: THREE.Vector3,
  endPos: THREE.Vector3,
): THREE.CatmullRomCurve3 {
  const mid = startPos.clone().lerp(endPos, 0.5);
  const distance = startPos.distanceTo(endPos);
  const arcHeight = Math.max(distance * 0.35, 20);

  const arcMid = mid.clone();
  arcMid.y += arcHeight;

  const cp1 = startPos.clone().lerp(arcMid, 0.5);
  cp1.y += arcHeight * 0.3;

  const cp2 = arcMid.clone().lerp(endPos, 0.5);
  cp2.y += arcHeight * 0.2;

  return new THREE.CatmullRomCurve3(
    [startPos.clone(), cp1, arcMid, cp2, endPos.clone()],
    false,
    'catmullrom',
    0.5,
  );
}

// ============================================================
// Component
// ============================================================

const CameraDirector: React.FC = () => {
  const controlsRef = useRef<any>(null);
  const { camera, scene } = useThree();

  // --- Internal state refs (mutable, no re-renders) ---
  const modeRef              = useRef<'intro' | 'free' | 'transitioning' | 'follow' | 'tour'>('intro');
  const transitionRef        = useRef<TransitionState | null>(null);
  const tourRef              = useRef<TourState | null>(null);
  const prevSelectedRef      = useRef<string | null>(null);
  const breathingTimeRef     = useRef(0);
  const introElapsedRef      = useRef(0);
  const introCurveRef        = useRef<THREE.CatmullRomCurve3 | null>(null);
  const tourTransitioningRef = useRef(false); // flag: tour-initiated planet change

  // --- Store subscriptions ---
  const selectedPlanetId = useSimulationStore(state => state.selectedPlanetId);
  const isTourActive     = useSimulationStore(state => state.isTourActive);

  // ============ Initialize Intro ============
  useEffect(() => {
    camera.position.copy(INTRO_START_POS);
    (camera as THREE.PerspectiveCamera).fov = INTRO_FOV;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    introCurveRef.current = buildArcCurve(INTRO_START_POS, OVERVIEW_POSITION);
    modeRef.current = 'intro';
  }, [camera]);

  // ============ Helpers ============

  const findPlanetWorldPos = useCallback((planetId: string): THREE.Vector3 | null => {
    let found: THREE.Object3D | undefined;
    scene.traverse((child) => {
      if (child.name === planetId && child.type === 'Mesh') {
        found = child;
      }
    });
    if (!found) return null;
    const pos = new THREE.Vector3();
    found.getWorldPosition(pos);
    return pos;
  }, [scene]);

  // ============ Transition Engine ============

  const startTransition = useCallback((targetPlanetId: string | null) => {
    const currentPos    = camera.position.clone();
    const currentTarget = controlsRef.current
      ? controlsRef.current.target.clone()
      : new THREE.Vector3(0, 0, 0);
    const currentFov = (camera as THREE.PerspectiveCamera).fov;

    let endPos: THREE.Vector3;
    let endOffset: THREE.Vector3;
    let endFov: number;

    if (targetPlanetId) {
      const data         = solarSystemData.find(p => p.id === targetPlanetId);
      const scaledRadius = data ? getScaledRadius(data.radiusKm, data.id) : 2;
      endOffset          = getIdealOffset(scaledRadius);

      const planetPos = findPlanetWorldPos(targetPlanetId);
      endPos = planetPos
        ? planetPos.clone().add(endOffset)
        : OVERVIEW_POSITION.clone();
      endFov = FOLLOW_FOV;
    } else {
      endPos    = OVERVIEW_POSITION.clone();
      endOffset = new THREE.Vector3();
      endFov    = FREE_FOV;
    }

    const curve    = buildArcCurve(currentPos, endPos);
    const distance = currentPos.distanceTo(endPos);
    const duration = Math.min(Math.max(distance * 0.008, 1.5), 3.5);

    transitionRef.current = {
      startTarget: currentTarget,
      endOffset,
      curve,
      startFov: currentFov,
      endFov,
      duration,
      elapsed: 0,
      targetPlanetId,
    };

    modeRef.current = 'transitioning';
    if (controlsRef.current) controlsRef.current.enabled = false;
  }, [camera, findPlanetWorldPos]);

  // ============ React to planet selection changes ============

  useEffect(() => {
    if (selectedPlanetId === prevSelectedRef.current) return;

    // If this change was triggered by the tour, skip (tour handles its own transitions)
    if (tourTransitioningRef.current) {
      tourTransitioningRef.current = false;
      prevSelectedRef.current = selectedPlanetId;
      return;
    }

    // User manually changed planet during tour → stop tour
    const tourActive = useSimulationStore.getState().isTourActive;
    if (tourActive) {
      useSimulationStore.getState().stopTour();
      tourRef.current = null;
      if (controlsRef.current) controlsRef.current.enabled = true;
    }

    if (modeRef.current !== 'intro') {
      startTransition(selectedPlanetId);
    }
    prevSelectedRef.current = selectedPlanetId;
  }, [selectedPlanetId, startTransition]);

  // ============ React to tour activation ============

  useEffect(() => {
    if (isTourActive && modeRef.current !== 'intro') {
      const planetIds = solarSystemData.filter(p => p.id !== 'sun').map(p => p.id);
      const firstId   = planetIds[0];
      if (!firstId) return;

      tourRef.current = {
        planetIds,
        currentIndex: 0,
        phase: 'transitioning',
        holdTimer: 0,
        holdDuration: TOUR_INITIAL_HOLD,
      };

      tourTransitioningRef.current = true;
      useSimulationStore.getState().setSelectedPlanetId(firstId);
      prevSelectedRef.current = firstId;
      startTransition(firstId);
      if (controlsRef.current) controlsRef.current.enabled = false;
    }
  }, [isTourActive, startTransition]);

  // ============ Main Animation Loop ============

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1); // clamp to avoid huge jumps
    useSimulationStore.getState().incrementTime(dt);

    const perspCamera = camera as THREE.PerspectiveCamera;
    const mode = modeRef.current;

    // ==================== INTRO ====================
    if (mode === 'intro') {
      introElapsedRef.current += dt;
      const progress = Math.min(introElapsedRef.current / INTRO_DURATION, 1);
      const eased    = easeOutQuart(progress);

      if (introCurveRef.current) {
        camera.position.copy(introCurveRef.current.getPointAt(eased));
      }

      perspCamera.fov = THREE.MathUtils.lerp(INTRO_FOV, FREE_FOV, eased);
      perspCamera.updateProjectionMatrix();

      if (controlsRef.current) {
        controlsRef.current.target.copy(OVERVIEW_TARGET);
        controlsRef.current.enabled = false;
        controlsRef.current.update();
      }

      if (progress >= 1) {
        modeRef.current = 'free';
        camera.position.copy(OVERVIEW_POSITION);
        if (controlsRef.current) {
          controlsRef.current.target.copy(OVERVIEW_TARGET);
          controlsRef.current.enabled = true;
        }
      }
      return;
    }

    // ==================== TRANSITIONING ====================
    if (mode === 'transitioning' && transitionRef.current) {
      const t = transitionRef.current;
      t.elapsed += dt;
      const progress = Math.min(t.elapsed / t.duration, 1);
      const eased    = easeInOutCubic(progress);

      // Compute current end position (tracks moving planet)
      let currentEndPos: THREE.Vector3;
      let currentEndTarget: THREE.Vector3;

      if (t.targetPlanetId) {
        const planetPos = findPlanetWorldPos(t.targetPlanetId);
        if (planetPos) {
          currentEndPos    = planetPos.clone().add(t.endOffset);
          currentEndTarget = planetPos.clone();
        } else {
          currentEndPos    = t.curve.getPointAt(1);
          currentEndTarget = OVERVIEW_TARGET.clone();
        }
      } else {
        currentEndPos    = OVERVIEW_POSITION.clone();
        currentEndTarget = OVERVIEW_TARGET.clone();
      }

      // Follow arc, then increasingly track actual position in final 30%
      const arcPos        = t.curve.getPointAt(eased);
      const trackingBlend = Math.max(0, (eased - 0.7) / 0.3);
      const finalPos      = arcPos.clone().lerp(currentEndPos, trackingBlend * trackingBlend);

      camera.position.copy(finalPos);

      // Interpolate look-at target
      const interpolatedTarget = t.startTarget.clone().lerp(currentEndTarget, eased);
      camera.lookAt(interpolatedTarget);

      // Update controls target (so OrbitControls is in sync when we re-enable)
      if (controlsRef.current) {
        controlsRef.current.target.copy(interpolatedTarget);
      }

      // FOV
      perspCamera.fov = THREE.MathUtils.lerp(t.startFov, t.endFov, eased);
      perspCamera.updateProjectionMatrix();

      // Transition complete
      if (progress >= 1) {
        const tourActive = useSimulationStore.getState().isTourActive;

        if (t.targetPlanetId) {
          modeRef.current = tourActive ? 'tour' : 'follow';
          if (controlsRef.current) controlsRef.current.enabled = !tourActive;
        } else {
          modeRef.current = 'free';
          if (controlsRef.current) controlsRef.current.enabled = true;
        }

        // Sync OrbitControls exactly
        if (controlsRef.current) {
          controlsRef.current.target.copy(interpolatedTarget);
          controlsRef.current.update();
        }

        transitionRef.current = null;
      }
      return;
    }

    // ==================== FOLLOW ====================
    if (mode === 'follow') {
      const currentSelected = useSimulationStore.getState().selectedPlanetId;
      if (currentSelected && controlsRef.current) {
        const planetPos = findPlanetWorldPos(currentSelected);
        if (planetPos) {
          controlsRef.current.target.lerp(planetPos, 0.08);
        }

        // Camera breathing: subtle multi-axis sinusoidal drift
        breathingTimeRef.current += dt;
        const bt        = breathingTimeRef.current;
        const distance  = camera.position.distanceTo(controlsRef.current.target);
        // Reduced amplitude by 60% for less distracting shake
        const amplitude = distance * 0.0004;

        const breathOffset = new THREE.Vector3(
          Math.sin(bt * 0.95) * amplitude,
          Math.sin(bt * 1.43) * amplitude * 0.7,
          Math.sin(bt * 1.17) * amplitude * 0.5,
        );
        camera.position.add(breathOffset);
        controlsRef.current.update();
      }
      return;
    }

    // ==================== TOUR ====================
    if (mode === 'tour') {
      const tourActive = useSimulationStore.getState().isTourActive;

      if (!tourActive) {
        // Tour was externally stopped
        const currentSelected = useSimulationStore.getState().selectedPlanetId;
        modeRef.current = currentSelected ? 'follow' : 'free';
        tourRef.current = null;
        if (controlsRef.current) controlsRef.current.enabled = true;
        return;
      }

      if (!tourRef.current) return; // safety

      const tour = tourRef.current;

      if (tour.phase === 'holding') {
        tour.holdTimer += dt;

        // Breathing + tracking during hold
        const currentSelected = useSimulationStore.getState().selectedPlanetId;
        if (currentSelected) {
          const planetPos = findPlanetWorldPos(currentSelected);
          if (planetPos && controlsRef.current) {
            controlsRef.current.target.lerp(planetPos, 0.08);
          }

          breathingTimeRef.current += dt;
          const bt        = breathingTimeRef.current;
          const distance  = camera.position.distanceTo(
            controlsRef.current?.target || new THREE.Vector3(),
          );
          // Reduced amplitude for tour breathing
          const amplitude = distance * 0.0003;

          camera.position.add(new THREE.Vector3(
            Math.sin(bt * 0.95) * amplitude,
            Math.sin(bt * 1.43) * amplitude * 0.7,
            Math.sin(bt * 1.17) * amplitude * 0.5,
          ));
        }

        if (controlsRef.current) controlsRef.current.update();

        // Timer expired → advance to next planet
        if (tour.holdTimer >= tour.holdDuration) {
          tour.currentIndex++;

          if (tour.currentIndex >= tour.planetIds.length) {
            // Tour complete → return to overview
            useSimulationStore.getState().stopTour();
            useSimulationStore.getState().setSelectedPlanetId(null);
            prevSelectedRef.current = null;
            startTransition(null);
            tourRef.current = null;
            return;
          }

          const nextId = tour.planetIds[tour.currentIndex];
          tourTransitioningRef.current = true;
          useSimulationStore.getState().setSelectedPlanetId(nextId);
          prevSelectedRef.current = nextId;
          startTransition(nextId);
          tour.phase = 'transitioning';
        }
      } else if (tour.phase === 'transitioning') {
        // We just returned to 'tour' mode from a completed transition
        tour.phase = 'holding';
        tour.holdTimer = 0;
        tour.holdDuration = TOUR_HOLD_TIME;
      }
      return;
    }

    // ==================== FREE ====================
    if (mode === 'free') {
      const currentSelected = useSimulationStore.getState().selectedPlanetId;
      if (!currentSelected && controlsRef.current) {
        controlsRef.current.target.lerp(OVERVIEW_TARGET, 0.02);
      }

      // Even free mode gets gentle breathing
      breathingTimeRef.current += dt;
      const bt        = breathingTimeRef.current;
      // Reduced free mode breathing amplitude
      const amplitude = 0.008;
      camera.position.add(new THREE.Vector3(
        Math.sin(bt * 0.7) * amplitude,
        Math.sin(bt * 1.1) * amplitude * 0.5,
        Math.sin(bt * 0.9) * amplitude * 0.3,
      ));

      if (controlsRef.current) controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.04}
      minDistance={2}
      maxDistance={2000}
      enablePan={true}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
    />
  );
};

export default CameraDirector;
