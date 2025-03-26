import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CameraControls,
  AccumulativeShadows,
  RandomizedLight,
  Environment,
  GizmoHelper,
  GizmoViewcube,
} from '@react-three/drei';
import * as THREE from 'three';
import Model from './Model';

function ResponsiveGizmo({ size, margin, controlsRef, onClick }) {
  return (
    <GizmoHelper
      alignment="top-right"
      margin={margin}
      controls={controlsRef}
      key={`gizmo-${size}-${margin[0]}-${margin[1]}`} 
    >
      <GizmoViewcube size={size} onClick={onClick} />
    </GizmoHelper>
  );
}

function Scene({
  params,
  gender,
  getAdjustedInputs,
  convertMeasurements,
  onLoadStart,
  onLoadEnd,
  canvasWrapperRef,
}) {
  const [gizmoSize, setGizmoSize] = useState(80);
  const [gizmoMargin, setGizmoMargin] = useState([110, 100]);
  const footBoneRef = useRef();
  const modelRef = useRef();
  const controlsRef = useRef();
  const shadowGroupRef = useRef();
  const shadowRef = useRef();

  const [modelLoaded, setModelLoaded] = useState(false);

  const handleModelLoaded = () => {
    setModelLoaded(true);
    if (onLoadEnd) onLoadEnd();
  };

  // Handle cube clicks to orient the camera
  function handleCubeClick(event) {
    event.stopPropagation();
    const faceIndexToDirection = {
      0: 'right',
      1: 'right',
      2: 'left',
      3: 'left',
      4: 'top',
      5: 'top',
      6: 'bottom',
      7: 'bottom',
      8: 'front',
      9: 'front',
      10: 'back',
      11: 'back',
    };
    const face = faceIndexToDirection[event.faceIndex];
    if (!face) return;

    const model = modelRef.current;
    const controls = controlsRef.current;
    const cameraPosition = new THREE.Vector3();
    const lookAtTarget = new THREE.Vector3();

    switch (face) {
      case 'front':
        cameraPosition.set(0, 1, 7.5);
        break;
      case 'back':
        cameraPosition.set(0, 1, -7.5);
        break;
      case 'left':
        cameraPosition.set(-7, 1, 0);
        break;
      case 'right':
        cameraPosition.set(7, 1, 0);
        break;
      case 'top':
        cameraPosition.set(0, 8, 0);
        break;
      case 'bottom':
        cameraPosition.set(0, -8, 0);
        break;
      default:
        break;
    }

    if (model) {
      const spineBone = model.getObjectByName('spine');
      if (spineBone) {
        spineBone.getWorldPosition(lookAtTarget);
      } else {
        new THREE.Box3().setFromObject(model).getCenter(lookAtTarget);
      }
    }

    if (controls) {
      controls.setLookAt(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z,
        lookAtTarget.x,
        lookAtTarget.y,
        lookAtTarget.z,
        true
      );
    }
  }

  // Set camera position on model load
  useEffect(() => {
    if (!modelRef.current || !controlsRef.current) return;
    const bbox = new THREE.Box3().setFromObject(modelRef.current);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    center.x += 0.06;
    controlsRef.current.setLookAt(
      -3.3,
      1.5,
      6,
      center.x,
      center.y,
      center.z,
      false
    );
  }, [modelLoaded]);

  //Gizmo Responsiveness
  useEffect(() => {
      function updateGizmoSize() {
        if (!canvasWrapperRef.current) return;
        const width = canvasWrapperRef.current.offsetWidth;
    
        if (width < 480) {
          setGizmoSize(100);
          setGizmoMargin([60, 60]);
        } else if (width < 768) {
          setGizmoSize(100);
          setGizmoMargin([70, 70]);
        } else if (width < 1024) {
          setGizmoSize(100);
          setGizmoMargin([80, 80]);
        } else {
          setGizmoSize(100);
          setGizmoMargin([90, 90]);
        }
      }
    
      updateGizmoSize();
      window.addEventListener('resize', updateGizmoSize);
    
      return () => {
        window.removeEventListener('resize', updateGizmoSize);
      };
    }, []);


  useEffect(() => {
    if (gender && onLoadStart) {
      onLoadStart();
    }
  }, [gender])

  // Shadow group follows foot bone
  useFrame(() => {
    if (footBoneRef.current && shadowGroupRef.current) {
      const worldPos = new THREE.Vector3();
      footBoneRef.current.getWorldPosition(worldPos);
      shadowGroupRef.current.position.copy(worldPos);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />

      <Suspense fallback={null}>
        {gender && (
          <Model
            key={gender}
            params={params}
            footBoneRef={footBoneRef}
            modelRef={modelRef}
            gender={gender}
            getAdjustedInputs={getAdjustedInputs}
            convertMeasurements={convertMeasurements}
            onModelLoaded={() => {
              if (onLoadEnd) onLoadEnd();
              setModelLoaded(true);
            }}
          />
        )}
      </Suspense>

      <spotLight
        position={[2, 4, 3]}
        angle={1}
        penumbra={0.5}
        intensity={10}
        castShadow
      />
      <spotLight
        position={[-2, 4, 3]}
        angle={0.3}
        penumbra={0.5}
        intensity={0.5}
        castShadow
      />
      <group ref={shadowGroupRef}>
        <AccumulativeShadows
          key={gender}
          ref={shadowRef}
          temporal
          frames={70}
          alphaTest={0.75}
          opacity={0.6}
          scale={5}
        >
          <group rotation={[0, Math.PI / 4, 0]}>
            <RandomizedLight radius={6} position={[0, 5, 10]} bias={0.001} />
          </group>
        </AccumulativeShadows>
      </group>
      <CameraControls ref={controlsRef} minDistance={1} maxDistance={8} />
      <Environment files="/hdri/studio.hdr" background={false} intensity={10} />
      <ResponsiveGizmo
        size={gizmoSize}
        margin={gizmoMargin}
        controlsRef={controlsRef}
        onClick={handleCubeClick}
      />
    </>
  );
}

export default Scene;
