// App.jsx
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Leva, useControls } from 'leva';

// Import gender-specific modules:
import femaleDefaultParams from './femaleDefaultParams';
import maleDefaultParams from './maleDefaultParams';
import * as femaleInputAdjustment from './femaleInputAdjustment';
import * as femaleMeasurementConverter from './femaleMeasurementConverter';
import * as maleInputAdjustment from './maleInputAdjustment';
import * as maleMeasurementConverter from './maleMeasurementConverter';

// Import Scene which will receive the conversion functions, gender, and params
import Scene from './Scene';

import './App.css';

function App() {
  // Gender toggle state: 'female' or 'male'
  const [gender, setGender] = useState('female');

  // Toggle function: switches between 'female' and 'male'
  const toggleGender = () => {
    setGender(prev => (prev === 'female' ? 'male' : 'female'));
  };

  // Separate Leva controls for each gender:
  const femaleParams = useControls('female', femaleDefaultParams);
  const maleParams = useControls('male', maleDefaultParams);

  return (
    <div>
      {/* Toggle Button and Status */}
      <div style={{ margin: '10px' }}>
        <button onClick={toggleGender}>
          Switch to {gender === 'female' ? 'male' : 'female'}
        </button>
        <span style={{ marginLeft: '10px' }}>Current: {gender}</span>
      </div>

      {/* Conditionally Render the Canvas based on selected gender */}
      {gender === 'female' && (
        <Canvas
          shadows
          gl={{ antialias: true }}
          dpr={[3, 3]}
          camera={{ position: [-3, 1, 4], rotation: [0, 0, 0], fov: 18 }}
          style={{ width: '780px', height: '1200px', background: '#E3E3E3' }}
        >
          <Scene
            params={femaleParams}
            gender="female"
            getAdjustedInputs={femaleInputAdjustment.getAdjustedInputs}
            convertMeasurements={femaleMeasurementConverter.convertMeasurements}
          />
        </Canvas>
      )}
      {gender === 'male' && (
        <Canvas
          shadows
          gl={{ antialias: true }}
          dpr={[3, 3]}
          camera={{ position: [-3, 1, 4], rotation: [0, 0, 0], fov: 18 }}
          style={{ width: '780px', height: '1200px', background: '#E3E3E3' }}
        >
          <Scene
            params={maleParams}
            gender="male"
            getAdjustedInputs={maleInputAdjustment.getAdjustedInputs}
            convertMeasurements={maleMeasurementConverter.convertMeasurements}
          />
        </Canvas>
      )}
    </div>
  );
}

export default App;
