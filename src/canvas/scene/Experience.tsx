import { OrbitControls, Stage } from '@react-three/drei';

export const Experience = () => {


  return (
    <>
      <color attach="background" args={['#111']} />
      
      <Stage environment="city" intensity={0.6}>
      </Stage>

      <OrbitControls makeDefault />
    </>
  );
};