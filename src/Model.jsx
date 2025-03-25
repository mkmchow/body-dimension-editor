// Model.jsx
import React, { useRef, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const baubleMaterial = new THREE.MeshStandardMaterial({
  color: "#FFFFFF",
  roughness: 0,
  metalness: 0,
  envMapIntensity: 0,
  emissive: "#000000"
});

function Model({ params, footBoneRef, modelRef, gender, getAdjustedInputs, convertMeasurements }) {
  const group = useRef();
  // Load the correct model based on gender (e.g. '/female.glb' or '/male.glb')
  const version = "v=2"; // bump when the file changes
  useGLTF(`/${gender}.glb?${version}`);  
  const originalHeadRotation = useRef(null);
  const lastHeadChildren = useRef("");

  useEffect(() => {
    if (modelScene) {
      modelScene.traverse(child => {
        if (child.isBone) {
          // Optionally, log or inspect bones
          // console.log("Bone:", child.name);
        }
      });
    }
  }, [modelScene]);

  // Update the model based on user measurements and conversions
  const updateModel = useCallback(() => {
    if (!group.current) return;

    const adjustedInputs = getAdjustedInputs(params);
    const outputs = convertMeasurements(adjustedInputs);

    group.current.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      // Update morph target influences using the calculated shape keys
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
      // Update bone scales based on converted measurements
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

    // Adjust head scaling and rotations
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

  // Call updateModel on every frame
  useFrame(() => {
    if (group.current) updateModel();
  });

  // Once the model scene is loaded, adjust materials and add it to the group
  useEffect(() => {
    if (modelScene && group.current && group.current.children.length === 0) {
      modelScene.traverse(child => {
        if (child.isMesh) {
          child.material = baubleMaterial;
          child.castShadow = true;
          child.receiveShadow = true;
        }
        // Set the foot bone reference if not already set
        if (child.isBone && child.name === "toeL_end") {
          footBoneRef.current = child;
        }        
      });
      group.current.add(modelScene);
      if (modelRef) modelRef.current = group.current;
      updateModel();
    }
  }, [modelScene, updateModel, footBoneRef, modelRef]);

  return <group ref={group} />;
}

export default Model;
