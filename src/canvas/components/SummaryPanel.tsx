import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { useDietStore } from '../../store/useDietStore';
import { DBLite } from '../../services/db';

// --- COMPONENTE DE ÁGUA 3D ---
const WaterMaterial = ({ color, progress }: { color: string; progress: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const shaderData = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uCurrentProgress: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uCurrentProgress;
      void main() {
        vUv = uv;
        vec3 pos = position;
        if (uCurrentProgress > 0.01) {
          float wave = sin(pos.x * 6.0 + uTime * 2.0) * 0.05 * uCurrentProgress;
          pos.y += wave * smoothstep(uCurrentProgress - 0.2, uCurrentProgress, vUv.y);
        }
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uCurrentProgress;
      void main() {
        if (vUv.y > uCurrentProgress) discard;
        float brightness = mix(0.7, 1.2, vUv.y / uCurrentProgress);
        gl_FragColor = vec4(uColor * brightness, 0.9);
      }
    `
  }), [color]);

  useFrame((s) => {
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.ShaderMaterial;
      m.uniforms.uTime.value = s.clock.getElapsedTime();
      m.uniforms.uCurrentProgress.value = THREE.MathUtils.lerp(m.uniforms.uCurrentProgress.value, progress, 0.04);
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2, 16, 16]} />
      <shaderMaterial args={[shaderData]} transparent />
    </mesh>
  );
};

const NutrientBar = ({ label, value, color, goal }: any) => {
  const progress = Math.min((value || 0) / (goal || 1), 1);
  return (
    <div style={barColumn}>
      <span style={{ ...barValue, color }}>{value.toFixed(0)}</span>
      <div style={barTrack}>
        <div style={barGlassOverlay} />
        <Canvas camera={{ position: [0, 0, 1] }} style={{ borderRadius: '15px' }} dpr={[1, 2]}>
          <WaterMaterial color={color} progress={progress} />
        </Canvas>
      </div>
      <span style={barLabel}>{label}</span>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const SummaryPanel: React.FC<{ user: any }> = ({ user }) => {
  const { foods, totalMacros, removeFood, clearFoods } = useDietStore();
  const [isNaming, setIsNaming] = useState(false);
  const [mealName, setMealName] = useState('');
  
  const goals = {
    p: Number(user?.goalProtein) || 160,
    c: Number(user?.goalCarbs) || 200,
    g: Number(user?.goalFat) || 70,
    cal: Number(user?.goalCalories) || 2000
  };

  const handleFinishMeal = () => {
    if (foods.length === 0) return alert("Adicione alimentos primeiro!");
    setIsNaming(true); // Abre o modal para digitar o nome
  };

  const confirmAndSave = () => {
    const now = new Date();
    const dateKey = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const mealData = {
      userId: user?.id || 'anon',
      timestamp: Date.now(),
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: dateKey,
      name: mealName || `Refeição das ${now.getHours()}h`, // Nome personalizado aqui
      macros: { ...totalMacros }, // Mantém proteínas, carboidratos, etc.
      items: [...foods]
    };

    try {
      DBLite.saveMeal(mealData);
      setIsNaming(false);
      setMealName('');
      if (typeof clearFoods === 'function') clearFoods();
      alert("✅ Refeição guardada!");
    } catch (e) {
      alert("Erro ao guardar.");
    }
  };

  return (
    <div style={mobileContainer}>
      <div style={mainCard}>
        <header style={headerStyle}>
          <h3 style={titleStyle}>Resumo do Dia</h3>
          <div style={dateBadge}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}</div>
        </header>
        
        <div className="list-container" style={scrollList}>
          {foods.length === 0 ? (
            <div style={emptyState}>Aguardando alimentos... 🍎</div>
          ) : (
            foods.map((food, i) => (
              <div key={food.timestamp || i} style={foodItem}>
                <div style={{ flex: 1 }}>
                  <div style={foodName}>{food.name}</div>
                  <div style={foodMeta}>P:{food.proteins.toFixed(0)}g • C:{food.carbs.toFixed(0)}g • G:{food.fats.toFixed(0)}g</div>
                </div>
                <button onClick={() => removeFood(food.timestamp)} style={deleteIcon}>✕</button>
              </div>
            ))
          )}
        </div>

        <section style={chartArea}>
          <div style={barGrid}>
            <NutrientBar label="PROT" value={totalMacros.proteins} color="#4ade80" goal={goals.p} />
            <NutrientBar label="CARB" value={totalMacros.carbs} color="#fbbf24" goal={goals.c} />
            <NutrientBar label="GORD" value={totalMacros.fats} color="#f87171" goal={goals.g} />
            <NutrientBar label="SÓD" value={totalMacros.sodium} color="#a78bfa" goal={2300} />
            <NutrientBar label="FIBRA" value={totalMacros.fiber} color="#2dd4bf" goal={30} />
            <NutrientBar label="AÇÚC" value={totalMacros.sugar} color="#60a5fa" goal={50} />
          </div>
        </section>

        <footer style={summaryFooter}>
          <div style={caloriesCard}>
            <span style={calLabel}>ENERGIA CONSUMIDA</span>
            <div style={calValue}>{totalMacros.calories.toFixed(0)} <small style={{fontSize: '16px'}}>kcal</small></div>
            <button onClick={handleFinishMeal} style={finishButtonStyle}>
              ✅ Finalizar Refeição
            </button>
          </div>
        </footer>
      </div>

      {/* MODAL PARA NOMEAR REFEIÇÃO */}
      <AnimatePresence>
        {isNaming && (
          <div style={modalOverlay}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={nameModal}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '900' }}>NOME DA REFEIÇÃO</h4>
              <input 
                autoFocus
                style={modalInput}
                placeholder="Ex: Almoço, Jantar, Pós-treino..."
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setIsNaming(false)} style={btnCancel}>CANCELAR</button>
                <button onClick={confirmAndSave} style={btnConfirm}>SALVAR</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- ESTILOS ADICIONADOS E ATUALIZADOS ---
const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const nameModal: React.CSSProperties = { background: '#111', border: '1px solid #222', borderRadius: '24px', padding: '25px', width: '100%', maxWidth: '320px', textAlign: 'center' };
const modalInput: React.CSSProperties = { background: '#000', border: '1px solid #333', borderRadius: '12px', padding: '15px', color: '#fff', width: '100%', marginBottom: '20px', outline: 'none', fontSize: '16px' };
const btnConfirm: React.CSSProperties = { flex: 1, background: '#fff', color: '#000', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { flex: 1, background: '#222', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' };

// --- ESTILOS ORIGINAIS MANTIDOS ---
const mobileContainer: React.CSSProperties = { display: 'flex', width: '100%', padding: '12px', justifyContent: 'center' };
const mainCard: React.CSSProperties = { background: '#0f0f0f', width: '100%', maxWidth: '440px', borderRadius: '40px', padding: '24px', border: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '20px' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: '20px', fontWeight: '800', color: '#fff' };
const dateBadge: React.CSSProperties = { fontSize: '10px', color: '#666', background: '#1a1a1a', padding: '6px 12px', borderRadius: '20px' };
const scrollList: React.CSSProperties = { maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' };
const foodItem: React.CSSProperties = { background: '#161616', padding: '14px', borderRadius: '18px', border: '1px solid #1f1f1f', display: 'flex', alignItems: 'center' };
const foodName: React.CSSProperties = { color: '#efefef', fontSize: '14px', fontWeight: '600' };
const foodMeta: React.CSSProperties = { color: '#555', fontSize: '11px' };
const deleteIcon: React.CSSProperties = { background: '#222', border: 'none', color: '#666', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer' };
const chartArea: React.CSSProperties = { background: '#080808', padding: '20px 10px', borderRadius: '25px', border: '1px solid #1a1a1a' };
const barGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', height: '180px' };
const barColumn: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center' };
const barValue: React.CSSProperties = { fontSize: '10px', fontWeight: '800', marginBottom: '8px' };
const barTrack: React.CSSProperties = { flex: 1, width: '28px', background: '#121212', borderRadius: '14px', position: 'relative', border: '1px solid #222' };
const barGlassOverlay: React.CSSProperties = { position: 'absolute', inset: 0, zIndex: 1, borderRadius: '14px', background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, transparent 100%)' };
const barLabel: React.CSSProperties = { fontSize: '8px', fontWeight: 'bold', color: '#444', marginTop: '10px' };
const summaryFooter: React.CSSProperties = { marginTop: 'auto' };
const caloriesCard: React.CSSProperties = { background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', padding: '20px', borderRadius: '24px', color: '#fff', textAlign: 'center' };
const calLabel: React.CSSProperties = { fontSize: '9px', fontWeight: '900', opacity: 0.8, letterSpacing: '1px' };
const calValue: React.CSSProperties = { fontSize: '32px', fontWeight: '900', margin: '5px 0' };
const emptyState: React.CSSProperties = { textAlign: 'center', color: '#333', fontSize: '12px', padding: '20px' };
const finishButtonStyle: React.CSSProperties = { marginTop: '15px', width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'rgba(0,0,0,0.3)', color: '#fff', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' };