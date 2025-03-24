// Scene.jsx
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { CameraControls, AccumulativeShadows, RandomizedLight, Environment, GizmoHelper, GizmoViewcube } from '@react-three/drei';
import * as THREE from 'three';
import Model from './Model';

function Scene({ params, gender, getAdjustedInputs, convertMeasurements }) {
  const footBoneRef = useRef();
  const modelRef = useRef();
  const controlsRef = useRef();
  const shadowGroupRef = useRef();

  // Click handler for the GizmoViewcube to reorient the camera
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
      11: 'back'
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
        cameraPosition.x, cameraPosition.y, cameraPosition.z,
        lookAtTarget.x, lookAtTarget.y, lookAtTarget.z,
        true
      );
    }
  }

  // Set initial camera position based on model bounds
  useEffect(() => {
    if (!modelRef.current || !controlsRef.current) return;

    const bbox = new THREE.Box3().setFromObject(modelRef.current);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    center.x += 0.06;

    controlsRef.current.setLookAt(
      -3.3, 1.5, 6,
      center.x, center.y, center.z,
      false
    );
  }, []);

  // Update shadow group to follow the foot bone
  useFrame(() => {
    if (footBoneRef.current && shadowGroupRef.current) {
      const worldPos = new THREE.Vector3();
      footBoneRef.current.getWorldPosition(worldPos);
      shadowGroupRef.current.position.copy(worldPos);
    }
  });

  return (
    <>
      <ambientLight intensity={0} />
      <Model
        key={gender}
        params={params}
        footBoneRef={footBoneRef}
        modelRef={modelRef}
        gender={gender}
        getAdjustedInputs={getAdjustedInputs}
        convertMeasurements={convertMeasurements}
        />
      <spotLight position={[2, 4, 3]} angle={1} penumbra={0.5} intensity={10} castShadow />
      <spotLight position={[-2, 4, 3]} angle={0.3} penumbra={0.5} intensity={0.5} castShadow />
      <group ref={shadowGroupRef}>
        <AccumulativeShadows temporal frames={70} alphaTest={0.75} opacity={0.6} scale={5}>
          <group rotation={[0, Math.PI / 4, 0]}>
            <RandomizedLight radius={6} position={[0, 5, 10]} bias={0.001} />
          </group>
        </AccumulativeShadows>
      </group>
      <CameraControls ref={controlsRef} minDistance={1} maxDistance={8} />
      <Environment files="/hdri/studio.hdr" background={false} intensity={10} />
      <GizmoHelper alignment="top-right" margin={[110, 100]} controls={controlsRef}>
        <GizmoViewcube onClick={handleCubeClick} />
      </GizmoHelper>
    </>
  );
}

export default Scene;
