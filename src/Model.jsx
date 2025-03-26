// Model.jsx
import React, { useRef, useCallback, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const baubleMaterial = new THREE.MeshStandardMaterial({
  color: "#FFFFFF",
  roughness: 0,
  metalness: 0,
  envMapIntensity: 0,
  emissive: "#000000"
});

function Model({ params, footBoneRef, modelRef, gender, getAdjustedInputs, convertMeasurements, onModelLoaded }) {
  const group = useRef();
  const modelMap = {
    female: 'female-model',
    male: 'male-model',
  };
  
  const modelPath = `/${modelMap[gender]}.glb?v=2`;
  const { scene: modelScene } = useGLTF(modelPath);
  
  const originalHeadRotation = useRef(null);
  const lastHeadChildren = useRef("");

  useEffect(() => {
    if (modelScene) {
      modelScene.traverse(child => {
        if (child.isBone) {
          // Inspect bones if needed
        }
      });
    }
  }, [modelScene]);

  const updateModel = useCallback(() => {
    if (!group.current) return;

    const adjustedInputs = getAdjustedInputs(params);
    const outputs = convertMeasurements(adjustedInputs);

    group.current.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        outputs.body_dimensions.forEach(item => {
          const key = item.key;
          const value = item.value;
          if (child.morphTargetDictionary[key] !== undefined) {
            const index = child.morphTargetDictionary[key];
            child.morphTargetInfluences[index] = value;
          }
        });
      }
      if (child.isSkinnedMesh && child.skeleton) {
        outputs.body_dimension_lengths.forEach(item => {
          let boneName = item.key;
          if (boneName === "upper_arm.R") boneName = "upper_armR";
          else if (boneName === "upper_arm.L") boneName = "upper_armL";
          else if (boneName === "forearm.R") boneName = "forearmR";
          else if (boneName === "forearm.L") boneName = "forearmL";
          else if (boneName === "thigh.R") boneName = "thighR";
          else if (boneName === "thigh.L") boneName = "thighL";
          else if (boneName === "shin.R") boneName = "shinR";
          else if (boneName === "shin.L") boneName = "shinL";
          else if (boneName === "foot.R") boneName = "footR";
          else if (boneName === "foot.L") boneName = "footL";
          else if (boneName === "hand.R") boneName = "handR";
          else if (boneName === "hand.L") boneName = "handL";
          const scaleVal = item.value;
          const bone = child.skeleton.getBoneByName(boneName);
          if (bone) {
            bone.scale.set(scaleVal.x, scaleVal.y, scaleVal.z);
          }
        });
      }
    });

    group.current.traverse(child => {
      if (child.isSkinnedMesh && child.skeleton) {
        const headBone = child.skeleton.getBoneByName('head');
        if (headBone && headBone.parent) {
          headBone.parent.updateMatrixWorld();
          const parentWorldScale = new THREE.Vector3();
          headBone.parent.getWorldScale(parentWorldScale);
          const headScaleFactor = params["Head Scale"];
          headBone.scale.set(
            (1 / parentWorldScale.x) * headScaleFactor,
            (1 / parentWorldScale.y) * headScaleFactor,
            (1 / parentWorldScale.z) * headScaleFactor
          );
          headBone.children.forEach(childBone => {
            childBone.scale.set(1, 1, 1);
          });
          if (!originalHeadRotation.current) {
            originalHeadRotation.current = headBone.rotation.clone();
          }
          headBone.rotation.copy(originalHeadRotation.current);
          headBone.rotation.x += params["Head Rotation X"] * Math.PI / 180;
          headBone.rotation.y += params["Head Rotation Y"] * Math.PI / 180;
          headBone.rotation.z += params["Head Rotation Z"] * Math.PI / 180;

          const currentChildrenNames = headBone.children.map(c => c.name).join(',');
          if (currentChildrenNames !== lastHeadChildren.current) {
            lastHeadChildren.current = currentChildrenNames;
          }
        }
      }
    });
  }, [params, getAdjustedInputs, convertMeasurements]);

  useFrame(() => {
    if (group.current) updateModel();
  });

  
  useEffect(() => {
    if (!modelScene || !group.current) return;
  
    group.current.clear();
  
    modelScene.traverse(child => {
      if (child.isMesh) {
        child.material = baubleMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.isBone && child.name === "toeL_end") {
        footBoneRef.current = child;
      }
    });
  
    group.current.add(modelScene);
  
    if (modelRef) modelRef.current = group.current;
  
    updateModel();
  
    // ✅ Confirm callback gets fired once model is added
    if (onModelLoaded) onModelLoaded();
  }, [modelScene]);  

  return <group ref={group} />;
}

export default Model;
