import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, Text } from "@react-three/drei";
import { Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { Effects } from "./Effects";

function SphereGroup({ connectors }) {
  const groupRef = useRef();

  return (
    <group ref={groupRef}>
      {connectors.map((props, i) => (
        <Sphere key={i} {...props} />
      ))}
    </group>
  );
}

function Sphere({ position, color }) {
  const ref = useRef();
  const offset = useRef(
    new THREE.Vector3(
      Math.random() * 0.02 - 0.01,
      Math.random() * 0.02 - 0.01,
      Math.random() * 0.02 - 0.01
    )
  );

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.position.copy(position);
    ref.current.position.add(
      offset.current.clone().multiplyScalar(Math.sin(t * 2) * 0.05)
    );
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.1} />
    </mesh>
  );
}

function Electron({ curve, rotation, speed, number }) {
    const groupRef = useRef();
    const textRef = useRef();
    const [t, setT] = React.useState(Math.random());
  
    useFrame((state, delta) => {
      setT((prevT) => (prevT + speed * delta) % 1);
      const point = curve.getPointAt(t);
      if (groupRef.current) {
        groupRef.current.position.set(point.x, point.y, 0);
        groupRef.current.position.applyEuler(rotation);
      }
      if (textRef.current) {
        textRef.current.lookAt(state.camera.position);
      }
    });
  
    return (
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#00d7f1" roughness={0.1} metalness={0.8} />
        </mesh>
        <group ref={textRef} position={[0, 0.7, 0]}>
          <Text
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
          {number}
          </Text>
        </group>
      </group>
    );
  }

function generateSpherePacking(count, radius) {
  const positions = [];
  const spheres = [];
  const containerRadius = Math.cbrt(count) * radius * 1.5;

  // Initial placement
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = containerRadius * Math.cbrt(Math.random());

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    const position = new THREE.Vector3(x, y, z);
    spheres.push(position);
    positions.push(position);
  }

  // Pack spheres
  const packingIterations = 100;
  for (let iter = 0; iter < packingIterations; iter++) {
    for (let i = 0; i < spheres.length; i++) {
      const force = new THREE.Vector3();

      // Repulsion from other spheres
      for (let j = 0; j < spheres.length; j++) {
        if (i !== j) {
          const diff = spheres[i].clone().sub(spheres[j]);
          const dist = diff.length();
          if (dist < radius * 2) {
            force.add(diff.normalize().multiplyScalar(radius * 2 - dist));
          }
        }
      }

      // Attraction to center (gravity-like effect)
      const centerForce = spheres[i]
        .clone()
        .negate()
        .normalize()
        .multiplyScalar(0.05);
      force.add(centerForce);

      // Apply force
      spheres[i].add(force.multiplyScalar(0.1));

      // Constrain to container
      if (spheres[i].length() > containerRadius - radius) {
        spheres[i].normalize().multiplyScalar(containerRadius - radius);
      }
    }
  }

  return spheres;
}

function createElectronOrbits(electronCount, baseRadius) {
  const orbits = [];
  let n = 1;
  let remainingElectrons = electronCount;

  while (remainingElectrons > 0) {
    const levelCapacity = 2 * n * n;
    const electronsInThisLevel = Math.min(remainingElectrons, levelCapacity);
    const orbitRadius = baseRadius * (n * 2);

    for (let i = 0; i < electronsInThisLevel; i++) {
      const phi = Math.acos(-1 + (2 * i) / electronsInThisLevel);
      const theta = Math.sqrt(electronsInThisLevel * Math.PI) * phi;

      const curve = new THREE.EllipseCurve(
        0,
        0,
        orbitRadius,
        orbitRadius,
        0,
        2 * Math.PI,
        false,
        0
      );

      const rotation = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      orbits.push({ curve, rotation });
    }

    remainingElectrons -= electronsInThisLevel;
    n++;
  }

  return orbits;
}

function Scene({ atomicNumber = 0, atomicMass = 0, charge = 0 }) {
  const sphereRadius = 0.5;
  const neutronCount = Math.floor(atomicMass - atomicNumber);
  const electronCount = Math.floor(atomicNumber - charge);

  const positions = useMemo(
    () => generateSpherePacking(atomicNumber + neutronCount, sphereRadius),
    [atomicNumber, neutronCount]
  );

  let currentNucleon = "proton";
  const nucleus = useMemo(
    () =>
      positions
        ? positions.map((position, i) => {
            let color;
            if (currentNucleon === "proton") {
              color = "#ff4060";
              currentNucleon = "neutron";
            } else {
              color = "white";
              currentNucleon = "proton";
            }
            return {
              position,
              color,
              roughness: 0.1,
              metalness: 0.1,
            };
          })
        : [],
    [positions, atomicNumber + neutronCount]
  );

  const orbits = useMemo(
    () =>
      createElectronOrbits(
        electronCount,
        sphereRadius * Math.cbrt(atomicNumber + neutronCount) * 3
      ),
    [electronCount, atomicNumber, neutronCount]
  );

  if (!positions) {
    return null;
  }
  return (
    <Canvas camera={{ position: [0, 0, 50], fov: 75, near: 0.1, far: 1000 }}>
      <color attach="background" args={["#141622"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <SphereGroup connectors={nucleus} />
      {orbits.map((orbit, i) => (
        <Electron
          key={i}
          curve={orbit.curve}
          rotation={orbit.rotation}
          speed={.05}
          number={-i+1}
        />
      ))}
      <OrbitControls />
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer
            form="circle"
            intensity={4}
            rotation-x={Math.PI / 2}
            position={[0, 5, -9]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, 1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, -1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={-Math.PI / 2}
            position={[10, 1, 0]}
            scale={8}
          />
          <Lightformer
            form="ring"
            color="#4060ff"
            intensity={5}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
            position={[10, 10, 0]}
            scale={10}
          />
        </group>
      </Environment>
      <Effects />
    </Canvas>
  );
}

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
    {/* Na */}
      <Scene atomicNumber={11} atomicMass={22.9898} charge={0} />
    </div>
  );
}

export default App;
