// App.jsx
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Leva, useControls } from 'leva';

import femaleDefaultParams from './femaleDefaultParams';
import maleDefaultParams from './maleDefaultParams';
import * as femaleInputAdjustment from './femaleInputAdjustment';
import * as femaleMeasurementConverter from './femaleMeasurementConverter';
import * as maleInputAdjustment from './maleInputAdjustment';
import * as maleMeasurementConverter from './maleMeasurementConverter';

import Scene from './Scene';
import './App.css';

function App() {
  const [gender, setGender] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const femaleParams = useControls('female', femaleDefaultParams);
  const maleParams = useControls('male', maleDefaultParams);

  const currentParams = gender === 'female' ? femaleParams : gender === 'male' ? maleParams : null;
  const getAdjustedInputs = gender === 'female'
    ? femaleInputAdjustment.getAdjustedInputs
    : gender === 'male'
    ? maleInputAdjustment.getAdjustedInputs
    : null;
  const convertMeasurements = gender === 'female'
    ? femaleMeasurementConverter.convertMeasurements
    : gender === 'male'
    ? maleMeasurementConverter.convertMeasurements
    : null;

  return (
    <div className="page-wrapper">
      <div className="button-bar">
        <button onClick={() => setGender('female')}>Female</button>
        <button onClick={() => setGender('male')}>Male</button>
      </div>

      <div className="canvas-wrapper">
      <Canvas
        shadows
        gl={{ antialias: true }}
        dpr={[3, 3]}
        camera={{ position: [-3, 1, 4], rotation: [0, 0, 0], fov: 18 }}
      >
        <Scene
          gender={gender}
          params={currentParams}
          getAdjustedInputs={getAdjustedInputs}
          convertMeasurements={convertMeasurements}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
        />
      </Canvas>

    <div className={`spinner-overlay ${!isLoading ? 'hidden' : ''}`}>
      <div className="spinner"></div>
    </div>

    </div>
      <Leva collapsed />
    </div>
  );
}

export default App;