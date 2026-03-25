import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { useDietStore } from '../../store/useDietStore';
import { DBService } from '../../services/db';

// --- COMPONENTE DE ÁGUA 3D (SHADERS OTIMIZADOS) ---
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
          float wave = sin(pos.x * 5.0 + uTime * 1.5) * 0.04 * uCurrentProgress;
          pos.y += wave * smoothstep(uCurrentProgress - 0.15, uCurrentProgress, vUv.y);
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
        float depth = vUv.y / uCurrentProgress;
        float brightness = mix(0.6, 1.3, depth);
        gl_FragColor = vec4(uColor * brightness, 0.95);
      }
    `
  }), [color]);

  useFrame((s) => {
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.ShaderMaterial;
      m.uniforms.uTime.value = s.clock.getElapsedTime();
      m.uniforms.uCurrentProgress.value = THREE.MathUtils.lerp(
        m.uniforms.uCurrentProgress.value, 
        progress, 
        0.05
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2, 32, 32]} />
      <shaderMaterial args={[shaderData]} transparent />
    </mesh>
  );
};

// --- BARRINHA DE NUTRIENTE INDIVIDUAL ---
const NutrientBar = ({ label, value, color, goal }: any) => {
  const progress = Math.min((value || 0) / (goal || 1), 1);
  return (
    <div style={barColumn}>
      <span style={{ ...barValue, color }}>{value.toFixed(0)}</span>
      <div style={barTrack}>
        <div style={barGlassOverlay} />
        <Canvas camera={{ position: [0, 0, 1] }} style={{ borderRadius: '15px' }} dpr={1} flat>
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
  const [isSaving, setIsSaving] = useState(false);

  // Normalização do ID do usuário (Firebase usa uid)
  const userId = user?.uid || user?.id;

  const goals = {
    p: Number(user?.goalProtein) || 160,
    c: Number(user?.goalCarbs) || 200,
    g: Number(user?.goalFat) || 70,
    cal: Number(user?.goalCalories) || 2000
  };

  const handleFinishMeal = () => {
    if (foods.length === 0) return;
    setIsNaming(true);
  };

  const confirmAndSave = async () => {
    if (isSaving || !userId) {
        console.error("ID do usuário não encontrado ou salvamento em curso.");
        return;
    }

    setIsSaving(true);
    const now = new Date();

    // Criamos uma cópia limpa dos dados para evitar erros de referência do Proxy do Zustand
    const mealData = {
      timestamp: Date.now(),
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('pt-BR'),
      name: mealName.trim() || `Refeição das ${now.getHours()}h`,
      macros: JSON.parse(JSON.stringify(totalMacros)), // Deep copy simples
      items: JSON.parse(JSON.stringify(foods))
    };

    try {
      await DBService.saveMeal(userId, mealData);
      
      // Limpa os estados após sucesso
      if (typeof clearFoods === 'function') clearFoods();
      setIsNaming(false);
      setMealName('');
      alert("Refeição salva com sucesso!");
    } catch (e) {
      console.error("Erro crítico ao salvar:", e);
      alert("Erro ao salvar no banco de dados. Verifique sua conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={mobileContainer}>
      <div style={mainCard}>
        <header style={headerStyle}>
          <div>
            <h3 style={titleStyle}>RESUMO ATUAL</h3>
            <div style={dateBadge}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase()}
            </div>
          </div>
          <div style={totalPill}>{totalMacros.calories.toFixed(0)} KCAL</div>
        </header>
        
        <div style={scrollList}>
          {foods.length === 0 ? (
            <div style={emptyState}>LISTA VAZIA</div>
          ) : (
            foods.map((food) => (
              <motion.div 
                layout 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                key={food.timestamp} 
                style={foodItem}
              >
                <div style={{ flex: 1 }}>
                  <div style={foodName}>{food.name.toUpperCase()}</div>
                  <div style={foodMeta}>
                    P {food.proteins.toFixed(0)}g • C {food.carbs.toFixed(0)}g • G {food.fats.toFixed(0)}g
                  </div>
                </div>
                <button onClick={() => removeFood(food.timestamp)} style={deleteIcon}>✕</button>
              </motion.div>
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

        <button 
          onClick={handleFinishMeal} 
          disabled={foods.length === 0}
          style={{...finishButtonStyle, opacity: foods.length === 0 ? 0.3 : 1}}
        >
          FINALIZAR E SALVAR REFEIÇÃO
        </button>
      </div>

      <AnimatePresence>
        {isNaming && (
          <div style={modalOverlay}>
            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              style={nameModal}
            >
              <h4 style={modalTitle}>NOME DA REFEIÇÃO</h4>
              <input 
                autoFocus
                style={modalInput}
                placeholder="Ex: Almoço Pós-Treino"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setIsNaming(false)} style={btnCancel}>VOLTAR</button>
                <button onClick={confirmAndSave} disabled={isSaving} style={btnConfirm}>
                  {isSaving ? 'SALVANDO...' : 'CONFIRMAR'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- ESTILOS ---
const mobileContainer: React.CSSProperties = { display: 'flex', width: '100%', padding: '10px', justifyContent: 'center' };
const mainCard: React.CSSProperties = { background: '#050505', width: '100%', maxWidth: '420px', borderRadius: '35px', padding: '25px', border: '1px solid #111', boxShadow: '0 25px 50px rgba(0,0,0,0.9)' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' };
const titleStyle: React.CSSProperties = { fontSize: '12px', fontWeight: '900', color: '#333', letterSpacing: '2px' };
const dateBadge: React.CSSProperties = { fontSize: '18px', color: '#fff', fontWeight: '900' };
const totalPill: React.CSSProperties = { background: '#111', color: '#00f2fe', padding: '8px 15px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', border: '1px solid #1a1a1a' };
const scrollList: React.CSSProperties = { height: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', paddingRight: '5px' };
const foodItem: React.CSSProperties = { background: '#080808', padding: '15px', borderRadius: '20px', border: '1px solid #111', display: 'flex', alignItems: 'center' };
const foodName: React.CSSProperties = { color: '#fff', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' };
const foodMeta: React.CSSProperties = { color: '#444', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' };
const deleteIcon: React.CSSProperties = { background: 'transparent', border: 'none', color: '#333', fontSize: '14px', cursor: 'pointer', padding: '10px' };
const chartArea: React.CSSProperties = { background: '#030303', padding: '20px', borderRadius: '25px', border: '1px solid #0f0f0f', marginBottom: '20px' };
const barGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', height: '160px' };
const barColumn: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center' };
const barValue: React.CSSProperties = { fontSize: '9px', fontWeight: '900', marginBottom: '8px' };
const barTrack: React.CSSProperties = { flex: 1, width: '100%', maxWidth: '30px', background: '#000', borderRadius: '15px', position: 'relative', border: '1px solid #111', overflow: 'hidden' };
const barGlassOverlay: React.CSSProperties = { position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(110deg, rgba(255,255,255,0.05) 0%, transparent 50%)', pointerEvents: 'none' };
const barLabel: React.CSSProperties = { fontSize: '8px', fontWeight: '900', color: '#222', marginTop: '10px' };
const finishButtonStyle: React.CSSProperties = { width: '100%', padding: '20px', borderRadius: '20px', border: 'none', background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', color: '#000', fontWeight: '950', fontSize: '13px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,242,254,0.15)' };
const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' };
const nameModal: React.CSSProperties = { background: '#080808', border: '1px solid #1a1a1a', borderRadius: '35px', padding: '35px', width: '100%', maxWidth: '340px', textAlign: 'center' };
const modalTitle: React.CSSProperties = { fontSize: '10px', fontWeight: '900', color: '#333', marginBottom: '20px', letterSpacing: '2px' };
const modalInput: React.CSSProperties = { background: '#000', border: '1px solid #1a1a1a', borderRadius: '18px', padding: '18px', color: '#fff', width: '100%', marginBottom: '25px', outline: 'none', fontSize: '16px', textAlign: 'center' };
const btnConfirm: React.CSSProperties = { flex: 1.5, background: '#fff', color: '#000', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { flex: 1, background: '#111', color: '#444', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer' };
const emptyState: React.CSSProperties = { textAlign: 'center', color: '#222', fontSize: '10px', fontWeight: '900', padding: '40px', letterSpacing: '1px' };

export default SummaryPanel;