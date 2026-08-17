import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Terrain = () => {
  const meshRef = useRef(null);

  // Create a plane geometry
  const geometry = useMemo(() => new THREE.PlaneGeometry(30, 30, 64, 64), []);

  // Modify vertices to create a terrain/wave effect
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const positions = meshRef.current.geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      // Calculate a wave-like Z position
      const z = Math.sin(x * 0.5 + time * 0.5) * Math.cos(y * 0.5 + time * 0.5) * 1.5;
      positions.setZ(i, z);
    }
    
    positions.needsUpdate = true;
    
    // Slowly rotate the entire mesh
    meshRef.current.rotation.z = time * 0.05;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2.5, 0, 0]}>
      <meshBasicMaterial 
        color="#8da978" 
        wireframe={true} 
        transparent={true} 
        opacity={0.3} 
      />
    </mesh>
  );
};

export default function WireframeTerrain() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, -5, 10], fov: 50 }}>
        <fog attach="fog" args={['#f9faf8', 5, 25]} />
        <Terrain />
      </Canvas>
    </div>
  );
}
