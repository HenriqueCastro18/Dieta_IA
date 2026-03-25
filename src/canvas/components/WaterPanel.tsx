import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DBService } from '../../services/db'; 

export const WaterPanel: React.FC<{ user: any }> = ({ user }) => {
  const [currentIntake, setCurrentIntake] = useState(0);
  const [inputAmount, setInputAmount] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  
  const todayDate = new Date().toLocaleDateString('pt-BR');

  // Garante que a meta seja sempre um número em ML
  const goalML = useMemo(() => {
    const rawGoal = user?.goalWater;
    if (!rawGoal) return 3500;
    const parsed = typeof rawGoal === 'string' ? parseFloat(rawGoal.replace(',', '.')) : rawGoal;
    return parsed < 100 ? parsed * 1000 : parsed;
  }, [user]);

  const progress = Math.min(currentIntake / goalML, 1);

  // Busca inicial do banco
  useEffect(() => {
    const fetchWater = async () => {
      const uid = user?.uid || user?.id;
      if (uid) {
        try {
          const saved = await DBService.getWaterHistory(uid, todayDate);
          if (saved && saved.amount) {
            setCurrentIntake(Number(saved.amount));
          }
        } catch (e) {
          console.error("Erro ao carregar água:", e);
        }
      }
    };
    fetchWater();
  }, [user, todayDate]);

  const addWater = (amount?: number) => {
    const value = amount || parseInt(inputAmount);
    if (isNaN(value) || value <= 0) return;
    setCurrentIntake(prev => prev + value);
    setInputAmount('');
  };

  // FUNÇÃO CORRIGIDA: Enviando parâmetros separados para o DBService
  const handleSaveToDB = async () => {
    const uid = user?.uid || user?.id;
    
    if (!uid) {
      alert("Erro: Usuário não autenticado.");
      return;
    }

    if (isSaving) return;
    
    setIsSaving(true);
    try {
      // CORREÇÃO AQUI: Passando UID, Valor numérico e Data como argumentos individuais
      await DBService.saveWater(uid, Number(currentIntake), todayDate);
      
      setLastSync(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      alert("Hidratação sincronizada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar no Firebase:", error);
      alert("Erro ao sincronizar. Verifique o console.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section style={containerStyle}>
      <div style={cardStyle}>
        <div style={uiSide}>
          <header>
            <span style={dateText}>{todayDate.toUpperCase()}</span>
            <h1 style={titleText}>HIDRATAÇÃO</h1>
          </header>

          <div style={displayBox}>
            <div style={mlText}>
              {currentIntake}<small style={unitStyle}>ml</small>
            </div>
            <p style={goalLabel}>META: {goalML}ml</p>
          </div>

          <div style={quickAddRow}>
            <button onClick={() => addWater(250)} style={quickBtn}>+250ml</button>
            <button onClick={() => addWater(500)} style={quickBtn}>+500ml</button>
          </div>

          <div style={inputActionGroup}>
            <input 
              type="number" 
              placeholder="Outra quantidade..." 
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              style={inputStyle}
            />
            <button style={btnAddStyle} onClick={() => addWater()}>
              ADICIONAR À LISTA
            </button>
          </div>

          <div style={footerActions}>
             <button style={btnReset} onClick={() => setCurrentIntake(0)}>ZERAR HOJE</button>
             {lastSync && <span style={syncStatus}>Sincronizado às {lastSync}</span>}
          </div>
        </div>

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
                    <rect x="10" y="5" width="80" height="190" rx="25" />
                  </clipPath>
                </defs>
                <rect x="10" y="5" width="80" height="190" rx="25" fill="#080808" stroke="#1a1a1a" strokeWidth="2" />
                <g clipPath="url(#bottleClip)">
                  <motion.g
                    initial={{ y: 200 }}
                    animate={{ y: 200 - (progress * 190) }}
                    transition={{ type: "spring", stiffness: 40, damping: 12 }}
                  >
                    <motion.path
                      d="M 0 0 Q 25 -10 50 0 T 100 0 V 200 H 0 Z"
                      fill="url(#waterGrad)"
                      animate={{ x: [-20, 0, -20] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    />
                    <rect y="0" width="100" height="200" fill="url(#waterGrad)" />
                  </motion.g>
                </g>
              </svg>
            </div>

            <button 
              style={{
                ...btnSaveDB,
                background: isSaving ? '#111' : '#00f2fe',
                color: isSaving ? '#444' : '#000',
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }} 
              onClick={handleSaveToDB}
              disabled={isSaving}
            >
              {isSaving ? 'SINCRONIZANDO...' : 'SALVAR NO CLOUD'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- ESTILOS (MANTIDOS) ---
const containerStyle: React.CSSProperties = { width: '100%', maxWidth: '900px', margin: '20px auto', padding: '0 15px' };
const cardStyle: React.CSSProperties = { background: '#050505', borderRadius: '40px', border: '1px solid #111', display: 'flex', minHeight: '550px', overflow: 'hidden', flexWrap: 'wrap', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' };
const uiSide: React.CSSProperties = { flex: 1.2, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: '320px' };
const dateText: React.CSSProperties = { fontSize: '10px', color: '#222', fontWeight: '900', letterSpacing: '3px' };
const titleText: React.CSSProperties = { color: '#fff', fontSize: '32px', fontWeight: '950', margin: '10px 0 40px', letterSpacing: '-1px' };
const displayBox: React.CSSProperties = { background: '#080808', padding: '40px 20px', borderRadius: '35px', border: '1px solid #111', textAlign: 'center', marginBottom: '20px' };
const mlText: React.CSSProperties = { fontSize: '72px', fontWeight: '950', color: '#fff', lineHeight: 1 };
const unitStyle: React.CSSProperties = { fontSize: '18px', color: '#00f2fe', marginLeft: '8px', textTransform: 'uppercase', letterSpacing: '1px' };
const goalLabel: React.CSSProperties = { fontSize: '10px', color: '#333', fontWeight: '900', marginTop: '15px', letterSpacing: '1px' };
const quickAddRow: React.CSSProperties = { display: 'flex', gap: '10px', marginBottom: '15px' };
const quickBtn: React.CSSProperties = { flex: 1, background: '#111', border: '1px solid #1a1a1a', color: '#fff', padding: '15px', borderRadius: '18px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' };
const inputActionGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px' };
const inputStyle: React.CSSProperties = { background: '#000', border: '1px solid #1a1a1a', borderRadius: '18px', padding: '18px', color: '#fff', fontSize: '14px', outline: 'none', textAlign: 'center' };
const btnAddStyle: React.CSSProperties = { background: '#fff', color: '#000', padding: '18px', borderRadius: '18px', border: 'none', fontSize: '11px', cursor: 'pointer', fontWeight: '950', letterSpacing: '1px' };
const footerActions: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '25px' };
const btnReset: React.CSSProperties = { background: 'none', border: 'none', color: '#222', fontSize: '10px', fontWeight: '900', cursor: 'pointer', letterSpacing: '1px' };
const syncStatus: React.CSSProperties = { fontSize: '10px', color: '#15803d', fontWeight: 'bold' };
const visualSide: React.CSSProperties = { width: '38%', background: '#030303', borderLeft: '1px solid #0f0f0f', minWidth: '320px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' };
const bottleSection: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', width: '100%' };
const bottleContainer: React.CSSProperties = { width: '150px', height: '300px' };
const svgStyle: React.CSSProperties = { width: '100%', height: '100%', filter: 'drop-shadow(0 0 20px rgba(0,242,254,0.1))' };
const btnSaveDB: React.CSSProperties = { width: '100%', maxWidth: '240px', border: 'none', padding: '20px', borderRadius: '22px', fontWeight: '950', fontSize: '12px', letterSpacing: '1px', transition: '0.3s' };
const percBadge: React.CSSProperties = { position: 'absolute', top: '35px', right: '35px', background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', color: '#000', padding: '8px 18px', borderRadius: '15px', fontWeight: '950', fontSize: '14px', boxShadow: '0 10px 20px rgba(0,242,254,0.2)' };

export default WaterPanel;