// FemaleControls.jsx
import React from 'react';
import { useControls } from 'leva';
import femaleDefaultParams from './femaleDefaultParams';

export default function FemaleControls() {
  const params = useControls(femaleDefaultParams);
  // Optionally, you could pass params to a context if needed.
  return null;
}
