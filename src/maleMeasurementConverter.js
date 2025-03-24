// maleMeasurementConverter.js
const config = await (await fetch('./maleData.json')).json();

function computeVirtualSpine(basis, spineRow, spineScale, keys) {
  const virtual = {};
  keys.forEach(k => {
    virtual[k] = basis[k] + 2 * (spineRow[k] - basis[k]) * (spineScale - 1);
  });
  return virtual;
}

function computeVirtual(prevVirtual, basis, row, ctrlKey, realValue, keys) {
  const virtual = {};
  const denom = row[ctrlKey] - basis[ctrlKey];
  if (denom === 0) {
    throw new Error(`Zero denominator for ${ctrlKey} when computing K-values.`);
  }
  keys.forEach(k => {
    const K = (row[k] - basis[k]) / denom;
    virtual[k] = prevVirtual[k] + K * (realValue - prevVirtual[ctrlKey]);
  });
  return virtual;
}

function computeShapeKeys(real, virtualLength, basis, sizeRows, coeffMatrix, shapeKeyMap) {
  const virtualAdjusted = {};
  let rowUsed;
  let b_main_overweight = 0;
  let b_main_skinny = 0;
  if (real["Body Fat"] > basis["Body Fat"]) {
    rowUsed = sizeRows["b_main_overweight"];
    b_main_overweight = ((real["Body Fat"] - basis["Body Fat"]) /
      (rowUsed["Point1"]["Body Fat"] - basis["Body Fat"])) * rowUsed["ShapeKeyMultiplier"];
  } else {
    rowUsed = sizeRows["b_main_skinny"];
    b_main_skinny = ((real["Body Fat"] - basis["Body Fat"]) /
      (rowUsed["Point1"]["Body Fat"] - basis["Body Fat"])) * rowUsed["ShapeKeyMultiplier"];
  }
  
  // For every measurement key
  for (const k in real) {
    if (k === "Body Fat") {
      virtualAdjusted[k] = virtualLength[k];
    } else {
      const point1_val = rowUsed["Point1"][k] !== undefined ? rowUsed["Point1"][k] : basis[k];
      const K = (point1_val - basis[k]) / (rowUsed["Point1"]["Body Fat"] - basis["Body Fat"]);
      virtualAdjusted[k] = virtualLength[k] + K * (real["Body Fat"] - virtualLength["Body Fat"]);
    }
  }
  
  const muscular = sizeRows["b_main_muscular"];
  let b_main_muscular = 0;
  if ((muscular["Point1"]["Muscle"] - muscular["Basis"]["Muscle"]) !== 0) {
    b_main_muscular = ((real["Muscle"] - basis["Muscle"]) /
      (muscular["Point1"]["Muscle"] - muscular["Basis"]["Muscle"])) * muscular["ShapeKeyMultiplier"];
  }
  
  // Define the shape key list (order matters)
  const shapeKeyList = [
    "b_main_muscular",
    "b_Torso_Shoulder_Width",
    "b_Torso_Chest_Width",
    "b_Torso_Waist_Thickness",
    "b_Torso_Hips_Size",
    "b_Torso_Belly_Size",
    "b_Torso_Breast_Size",
    "b_Legs_Thigh_Thickness",
    "b_Arms_Upper_Arm_Thickness",
    "b_Legs_Shin_Thickness",
    "b_Arms_Forearm_Thickness",
    "b_Arms_Hand_Thickness",
    "b_Head_Neck_Thickness"
  ];
  // Build delta vector (difference between real and virtual adjusted values for each shape key)
  const deltaVector = [];
  shapeKeyList.forEach(sk => {
    const meas = shapeKeyMap[sk];
    const delta = real[meas] - virtualAdjusted[meas];
    deltaVector.push(delta);
  });
  
  // Solve the linear system: coeffMatrix * x = deltaVector
  const x = solveLinearSystem(coeffMatrix, deltaVector);
  
  const shapeKeys = {};
  shapeKeyList.forEach((sk, i) => {
    shapeKeys[sk] = x[i];
  });
  shapeKeys["b_main_overweight"] = b_main_overweight;
  shapeKeys["b_main_skinny"] = b_main_skinny;
  shapeKeys["b_main_muscular"] = b_main_muscular;
  
  return { virtualAdjusted, shapeKeys };
}

// A simple Gaussian elimination solver for a system Ax = b
function solveLinearSystem(A, b) {
  const n = A.length;
  // Create deep copies
  const M = A.map(row => row.slice());
  const B = b.slice();
  
  for (let k = 0; k < n; k++) {
    // Find the pivot row
    let i_max = k;
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(M[i][k]) > Math.abs(M[i_max][k])) {
        i_max = i;
      }
    }
    // Swap rows in M and B
    [M[k], M[i_max]] = [M[i_max], M[k]];
    [B[k], B[i_max]] = [B[i_max], B[k]];
    
    // Make sure the pivot is not zero
    if (Math.abs(M[k][k]) < 1e-12) {
      throw new Error("Matrix is singular or nearly singular");
    }
    
    // Eliminate column k
    for (let i = k + 1; i < n; i++) {
      const f = M[i][k] / M[k][k];
      B[i] -= f * B[k];
      for (let j = k; j < n; j++) {
        M[i][j] -= f * M[k][j];
      }
    }
  }
  
  // Back substitution
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += M[i][j] * x[j];
    }
    x[i] = (B[i] - sum) / M[i][i];
  }
  return x;
}

export function convertMeasurements(adjustedInputs) {
  // Unpack config data
  const keys         = config.keys;
  const extra        = config.extra;
  const basis        = config.basis;
  const rows         = config.rows;
  const ctrl         = config.ctrl;
  const sizeRows     = config.size_rows;
  const shapeKeyMap  = config.shape_key_map;
  const coeffMatrix  = config.size_coeff_matrix;
  
  const real = adjustedInputs;
  
  // PART 1: Length-to-scale calculations
  const realTorso = real["Height"] - extra["Head Length"] - real["Neck Length"] - real["Thigh Length"] - real["Calf Length"];
  const spineScale = realTorso / extra["Torso Length"];
  
  const virtualSpine = computeVirtualSpine(basis, rows["spine"], spineScale, keys);
  const thighScale = real["Thigh Length"] / virtualSpine["Thigh Length"];
  const virtualThigh = computeVirtual(virtualSpine, basis, rows["thigh"], ctrl["thigh"], real["Thigh Length"], keys);
  const calfScale = real["Calf Length"] / virtualThigh["Calf Length"];
  const virtualCalf = computeVirtual(virtualThigh, basis, rows["calf"], ctrl["calf"], real["Calf Length"], keys);
  const feetScale = real["Feet Length"] / virtualCalf["Feet Length"];
  const virtualFeet = computeVirtual(virtualCalf, basis, rows["feet"], ctrl["feet"], real["Feet Length"], keys);
  const neckScale = real["Neck Length"] / virtualFeet["Neck Length"];
  const virtualNeck = computeVirtual(virtualFeet, basis, rows["neck"], ctrl["neck"], real["Neck Length"], keys);
  const upperArmScale = real["Upper Arm Length"] / virtualNeck["Upper Arm Length"];
  const virtualUpperArm = computeVirtual(virtualNeck, basis, rows["upper_arm"], ctrl["upper_arm"], real["Upper Arm Length"], keys);
  const forearmScale = real["Forearm Length"] / virtualUpperArm["Forearm Length"];
  const virtualForearm = computeVirtual(virtualUpperArm, basis, rows["forearm"], ctrl["forearm"], real["Forearm Length"], keys);
  const handScale = real["Hand Length"] / virtualForearm["Hand Length"];
  const virtualHand = computeVirtual(virtualForearm, basis, rows["hand"], ctrl["hand"], real["Hand Length"], keys);
  
  // PART 2: Shape key calculations
  const { virtualAdjusted, shapeKeys } = computeShapeKeys(real, virtualHand, basis, sizeRows, coeffMatrix, shapeKeyMap);
  
  // Build the output for morph targets (body dimensions)
  const orderedShapeKeys = [
    "b_{main}_overweight",
    "b_{main}_skinny",
    "b_{main}_muscular",
    "b_{Torso}_Shoulder Width",
    "b_{Torso}_Chest Width",
    "b_{Torso}_Waist Thickness",
    "b_{Torso}_Hips Size",
    "b_{Torso}_Belly Size",
    "b_{Torso}_Breast Size",
    "b_{Legs}_Thigh Thickness",
    "b_{Arms}_Upper Arm Thickness",
    "b_{Legs}_Shin Thickness",
    "b_{Arms}_Forearm Thickness",
    "b_{Arms}_Hand Thickness",
    "b_{Head}_Neck Thickness"
  ];
  const shapeKeyOutputMapping = {
    "b_main_overweight": "b_{main}_overweight",
    "b_main_skinny": "b_{main}_skinny",
    "b_main_muscular": "b_{main}_muscular",
    "b_Torso_Shoulder_Width": "b_{Torso}_Shoulder Width",
    "b_Torso_Chest_Width": "b_{Torso}_Chest Width",
    "b_Torso_Waist_Thickness": "b_{Torso}_Waist Thickness",
    "b_Torso_Hips_Size": "b_{Torso}_Hips Size",
    "b_Torso_Belly_Size": "b_{Torso}_Belly Size",
    "b_Torso_Breast_Size": "b_{Torso}_Breast Size",
    "b_Legs_Thigh_Thickness": "b_{Legs}_Thigh Thickness",
    "b_Arms_Upper_Arm_Thickness": "b_{Arms}_Upper Arm Thickness",
    "b_Legs_Shin_Thickness": "b_{Legs}_Shin Thickness",
    "b_Arms_Forearm_Thickness": "b_{Arms}_Forearm Thickness",
    "b_Arms_Hand_Thickness": "b_{Arms}_Hand Thickness",
    "b_Head_Neck_Thickness": "b_{Head}_Neck Thickness"
  };
  
  const bodyDimensions = [];
  orderedShapeKeys.forEach(key => {
    let compKey = null;
    for (const ck in shapeKeyOutputMapping) {
      if (shapeKeyOutputMapping[ck] === key) {
        compKey = ck;
        break;
      }
    }
    const value = shapeKeys[compKey] || 0;
    // Format to 10 decimal places
    bodyDimensions.push({ key, value: parseFloat(value.toFixed(10)) });
  });
  
  // Build bone scale outputs
  const boneScaleMapping = {
    "spine": spineScale,
    "thigh.R": thighScale,
    "thigh.L": thighScale,
    "shin.R": calfScale,
    "shin.L": calfScale,
    "foot.R": feetScale,
    "foot.L": feetScale,
    "neck": neckScale,
    "upper_arm.R": upperArmScale,
    "upper_arm.L": upperArmScale,
    "forearm.R": forearmScale,
    "forearm.L": forearmScale,
    "hand.R": handScale,
    "hand.L": handScale
  };
  const orderedBones = [
    "spine", "thigh.R", "thigh.L", "shin.R", "shin.L",
    "foot.R", "foot.L", "neck", "upper_arm.R", "upper_arm.L",
    "forearm.R", "forearm.L", "hand.R", "hand.L"
  ];
  const bodyDimensionLengths = [];
  orderedBones.forEach(bone => {
    const scaleVal = boneScaleMapping[bone] || 1.0;
    let boneScale;
    if (bone === "spine") {
      boneScale = { x: parseFloat(scaleVal.toFixed(10)), y: parseFloat(scaleVal.toFixed(10)), z: parseFloat(scaleVal.toFixed(10)) };
    } else {
      boneScale = { x: 1.0, y: parseFloat(scaleVal.toFixed(10)), z: 1.0 };
    }
    bodyDimensionLengths.push({ key: bone, value: boneScale });
  });
  
  // --- Logging: Print computed shape key values ---
  // console.log("Computed Shape Key Values:");
  // for (const [key, value] of Object.entries(shapeKeys)) {
  //   console.log(`${key}: ${value}`);
  // }
  
  // --- Logging: Print each bone's scale values ---
  // console.log("Computed Bone Scale Values:");
  // bodyDimensionLengths.forEach(item => {
  //   console.log(`${item.key}: x = ${item.value.x}, y = ${item.value.y}, z = ${item.value.z}`);
  // });
  // ------------------------------------------------------
  
  return {
    body_dimensions: bodyDimensions,
    body_dimension_lengths: bodyDimensionLengths
  };
}
