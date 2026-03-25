import React, { useMemo } from 'react';
import { Box, Sphere, Cylinder, MeshDistortMaterial, Float } from '@react-three/drei';

interface FactoryProps {
  category: 'protein' | 'carb' | 'fat' | 'mixed' | 'fiber';
  scale?: number;
}

/**
 * FoodModelFactory: Implementação do Strategy Pattern para 
 * representação visual 3D dos macronutrientes.
 */
export const FoodModelFactory: React.FC<FactoryProps> = ({ category, scale = 1 }) => {
  
  // Cores padronizadas com a identidade visual do app
  const colors = {
    protein: '#ff4d4d', // Vermelho Vibrante
    carb: '#ffd700',    // Dourado/Amarelo
    fat: '#00f2fe',     // Cyan (combinando com seu tema)
    fiber: '#2ecc71',   // Verde
    mixed: '#ffffff'    // Branco
  };

  // Renderização baseada na categoria (Strategy)
  const renderModel = useMemo(() => {
    switch (category) {
      case 'protein':
        return (
          <Box args={[1, 1, 1]}>
            <MeshDistortMaterial 
              color={colors.protein} 
              speed={2} 
              distort={0.3} 
              radius={1} 
            />
          </Box>
        );

      case 'carb':
        return (
          <Sphere args={[0.7, 32, 32]}>
            <meshStandardMaterial 
              color={colors.carb} 
              roughness={0.3} 
              metalness={0.8} 
            />
          </Sphere>
        );

      case 'fat':
        return (
          <Cylinder args={[0.6, 0.6, 1, 32]}>
            <meshStandardMaterial 
              color={colors.fat} 
              emissive={colors.fat}
              emissiveIntensity={0.5}
              transparent
              opacity={0.9}
            />
          </Cylinder>
        );

      case 'fiber':
        return (
          <Box args={[0.4, 1.2, 0.4]}>
            <meshStandardMaterial color={colors.fiber} />
          </Box>
        );

      default:
        return (
          <Box args={[0.6, 0.6, 0.6]}>
            <meshStandardMaterial color={colors.mixed} wireframe />
          </Box>
        );
    }
  }, [category]);

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <group scale={scale}>
        {renderModel}
      </group>
    </Float>
  );
};

export default FoodModelFactory;