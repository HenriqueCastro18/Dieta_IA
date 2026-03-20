import { Box, Sphere, Cylinder } from '@react-three/drei';

interface FactoryProps {
  category: 'protein' | 'carb' | 'fat' | 'mixed';
  scale: number;
}

export const FoodModelFactory = ({ category, scale }: FactoryProps) => {
  // Strategy Pattern simplificado para a representação visual
  switch (category) {
    case 'protein':
      return (
        <mesh scale={scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#e74c3c" /> {/* Vermelho para Proteína */}
        </mesh>
      );
    case 'carb':
      return (
        <mesh scale={scale}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial color="#f1c40f" /> {/* Amarelo para Carbo */}
        </mesh>
      );
    case 'fat':
      return (
        <mesh scale={scale}>
          <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
          <meshStandardMaterial color="#2ecc71" /> {/* Verde para Gordura */}
        </mesh>
      );
    default:
      return <Box args={[0.5, 0.5, 0.5]} />;
  }
};