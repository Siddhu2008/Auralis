import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Starfield({ count = 2000, speed = 1, direction = 1 }) {
    const points = useRef();

    // Create random star positions
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 20;     // X
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20; // Y
            pos[i * 3 + 2] = (Math.random() - 0.5) * 20; // Z
        }
        return pos;
    }, [count]);

    useFrame((state, delta) => {
        if (!points.current) return;

        const positions = points.current.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            // Move stars along Y axis based on direction and speed
            positions[i * 3 + 1] += speed * delta * direction;

            // Wrap around when they go out of bounds
            if (direction > 0 && positions[i * 3 + 1] > 10) positions[i * 3 + 1] = -10;
            if (direction < 0 && positions[i * 3 + 1] < -10) positions[i * 3 + 1] = 10;
        }
        points.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
            <PointMaterial
                transparent
                color={direction > 0 ? "#22d3ee" : "#818cf8"}
                size={0.03}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={direction > 0 ? 0.4 : 0.6}
            />
        </Points>
    );
}

const Background3D = () => {
    return (
        <div className="fixed inset-0 -z-10 pointer-events-none bg-[#020617]">
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <Starfield count={1500} speed={0.5} direction={1} />  {/* Rising Stars */}
                <Starfield count={500} speed={2.5} direction={-1} /> {/* Falling Meteors */}
            </Canvas>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020617] opacity-80" />
        </div>
    );
};

export default Background3D;
