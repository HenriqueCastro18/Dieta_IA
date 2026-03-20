import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DBLite } from '../../services/db'; 

export const WaterPanel: React.FC<{ user: any }> = ({ user }) => {
  const [currentIntake, setCurrentIntake] = useState(0);
  const [inputAmount, setInputAmount] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  const todayDate = new Date().toLocaleDateString('pt-BR');
  const goalML = useMemo(() => Number(user?.goalWater) || 3500, [user]);
  const progress = Math.min(currentIntake / goalML, 1);

  // 1. CARREGA OS DADOS DO BANCO AO INICIAR
  useEffect(() => {
    if (user?.id) {
      const saved = DBLite.getWaterHistory(todayDate, user.id);
      setCurrentIntake(Number(saved.amount) || 0);
    }
  }, [user?.id, todayDate]);

  const addWater = () => {
    const amount = parseInt(inputAmount);
    if (isNaN(amount) || amount <= 0) return;
    setCurrentIntake(prev => prev + amount);
    setInputAmount('');
  };

  // 2. SALVA NO BANCO E SINCRONIZA COM O HISTÓRICO
  const handleSaveToDB = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      // Simula um delay de rede/processamento
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const success = DBLite.saveWaterIntake(todayDate, user.id, currentIntake);
      
      if (success) {
        alert("Hidratação sincronizada com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao sincronizar dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Deseja zerar o progresso de hoje?")) {
      setCurrentIntake(0);
    }
  };

  return (
    <section style={containerStyle}>
      <div style={cardStyle}>
        
        {/* COLUNA ESQUERDA: INPUT E CONTROLE LOCAL */}
        <div style={uiSide}>
          <header>
            <span style={dateText}>{todayDate}</span>
            <h1 style={titleText}>HIDRATAÇÃO</h1>
          </header>

          <div style={displayBox}>
            <div style={mlText}>
              {currentIntake}<small style={unitStyle}>ml</small>
            </div>
            <p style={goalLabel}>META DIÁRIA: {goalML}ml</p>
          </div>

          <div style={inputActionGroup}>
            <input 
              type="number" 
              placeholder="Qtd em ml" 
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              style={inputStyle}
            />
            <button style={btnAddStyle} onClick={addWater}>
              ADICIONAR
            </button>
          </div>

          <button style={btnReset} onClick={handleReset}>
            ZERAR PROGRESSO
          </button>
        </div>

        {/* COLUNA DIREITA: VISUALIZAÇÃO E PERSISTÊNCIA */}
        <div style={visualSide}>
          <div style={percBadge}>{Math.round(progress * 100)}%</div>
          
          <div style={bottleSection}>
            <div style={bottleContainer}>
              <svg viewBox="0 0 100 200" style={svgStyle}>
                <defs>
                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f2fe" />
                    <stop offset="100%" stopColor="#4facfe" />
                  </linearGradient>
                  <clipPath id="bottleClip">
                    <rect x="10" y="10" width="80" height="180" rx="25" />
                  </clipPath>
                </defs>
                
                {/* Garrafa (Fundo) */}
                <rect x="10" y="10" width="80" height="180" rx="25" fill="#080808" stroke="#1a1a1a" strokeWidth="2" />
                
                {/* Água (Animada) */}
                <g clipPath="url(#bottleClip)">
                  <motion.rect
                    x="10"
                    y="10"
                    width="80"
                    height="180"
                    fill="url(#waterGrad)"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: progress }}
                    style={{ originY: "100%" }} // Garante que encha de baixo para cima
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                  />
                </g>
              </svg>
            </div>

            <button 
              style={{
                ...btnSaveDB,
                opacity: isSaving ? 0.6 : 1,
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }} 
              onClick={handleSaveToDB}
              disabled={isSaving}
            >
              {isSaving ? 'SALVANDO...' : 'SALVAR NO HISTÓRICO'}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

// --- ESTILOS ---
const containerStyle: React.CSSProperties = { width: '100%', maxWidth: '850px', margin: '20px auto', padding: '0 15px' };
const cardStyle: React.CSSProperties = { background: '#0a0a0a', borderRadius: '40px', border: '1px solid #1a1a1a', display: 'flex', minHeight: '520px', overflow: 'hidden', flexWrap: 'wrap' };
const uiSide: React.CSSProperties = { flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: '320px' };
const dateText: React.CSSProperties = { fontSize: '10px', color: '#444', fontWeight: '800', letterSpacing: '2px' };
const titleText: React.CSSProperties = { color: '#00f2fe', fontSize: '30px', fontWeight: '900', margin: '8px 0 35px' };
const displayBox: React.CSSProperties = { background: '#050505', padding: '30px', borderRadius: '30px', border: '1px solid #111', textAlign: 'center' };
const mlText: React.CSSProperties = { fontSize: '64px', fontWeight: '900', color: '#fff' };
const unitStyle: React.CSSProperties = { fontSize: '20px', color: '#333', marginLeft: '10px' };
const goalLabel: React.CSSProperties = { fontSize: '10px', color: '#444', fontWeight: 'bold', marginTop: '10px' };
const inputActionGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '30px' };
const inputStyle: React.CSSProperties = { background: '#111', border: '1px solid #222', borderRadius: '15px', padding: '15px', color: '#fff', fontSize: '16px', outline: 'none', textAlign: 'center' };
const btnAddStyle: React.CSSProperties = { background: '#111', border: '1px solid #222', color: '#00f2fe', padding: '15px', borderRadius: '15px', fontSize: '12px', cursor: 'pointer', fontWeight: '900', letterSpacing: '1px' };
const btnReset: React.CSSProperties = { background: 'none', border: 'none', color: '#222', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px', textAlign: 'center' };
const visualSide: React.CSSProperties = { width: '40%', background: '#000', borderLeft: '1px solid #111', minWidth: '320px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' };
const bottleSection: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', width: '100%' };
const bottleContainer: React.CSSProperties = { width: '160px', height: '320px' };
const svgStyle: React.CSSProperties = { width: '100%', height: '100%', filter: 'drop-shadow(0 0 15px rgba(0,242,254,0.2))' };
const btnSaveDB: React.CSSProperties = { width: '100%', maxWidth: '240px', background: '#00f2fe', border: 'none', color: '#000', padding: '16px', borderRadius: '15px', fontWeight: '900', fontSize: '12px', letterSpacing: '1px' };
const percBadge: React.CSSProperties = { position: 'absolute', top: '30px', right: '30px', background: '#00f2fe', color: '#000', padding: '6px 15px', borderRadius: '12px', fontWeight: '900', fontSize: '14px' };