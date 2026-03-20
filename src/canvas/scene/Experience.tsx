import { OrbitControls, Stage } from '@react-three/drei';

export const Experience = () => {
  // Removido o uso do totalMacros e do FoodModelFactory 
  // para que os objetos não apareçam mais na cena.

  return (
    <>
      <color attach="background" args={['#111']} />
      
      {/* O Stage pode ser mantido caso você queira adicionar outros modelos no futuro */}
      <Stage environment="city" intensity={0.6}>
        {/* Os objetos 3D foram removidos daqui */}
      </Stage>

      <OrbitControls makeDefault />
    </>
  );
};