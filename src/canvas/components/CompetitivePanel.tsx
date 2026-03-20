import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DBLite } from '../../services/db'; // Certifique-se de que o caminho está correto

export const CompetitivePanel: React.FC<{ user: any, onUpdateUser: (data: any) => void }> = ({ user, onUpdateUser }) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [offset, setOffset] = useState(0); 
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [tempWeight, setTempWeight] = useState(user?.weight?.toString() || '');
  const [realConsistency, setRealConsistency] = useState(0);

  // 1. CARREGAMENTO DE DADOS REAIS DO DBLITE
  useEffect(() => {
    if (user?.id) {
      // Busca a consistência real baseada no histórico do DBLite
      const score = DBLite.getConsistencyScore(user.id, viewMode, offset);
      setRealConsistency(score);
    }
  }, [user?.id, viewMode, offset]);

  // 2. LÓGICA DE PESO (Diferença desde o primeiro registro)
  const weightStats = useMemo(() => {
    const history = user?.weightHistory || [];
    const current = Number(user?.weight) || 0;
    
    if (history.length === 0) return { diff: 0, initial: current, status: 'Estável' };

    const initial = history[0].weight; // Primeiro peso cadastrado na criação da conta
    const diff = current - initial;
    
    return {
      diff: Math.abs(diff).toFixed(1),
      isLoss: diff < 0,
      isGain: diff > 0,
      initial: initial
    };
  }, [user]);

  // 3. NAVEGAÇÃO DE DATAS
  const periodLabel = useMemo(() => {
    const d = new Date();
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - offset);
      return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
    }
    const day = d.getDay();
    const diff = d.getDate() - day - (offset * 7);
    const startOfWeek = new Date(d.setDate(diff));
    return `SEMANA DE ${startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  }, [viewMode, offset]);

  const handleWeightSubmit = () => {
    const val = parseFloat(tempWeight);
    if (!isNaN(val) && user?.id) {
      const updatedUser = DBLite.updateUserWeight(user.id, val);
      if (updatedUser) {
        onUpdateUser(updatedUser);
        setIsEditingWeight(false);
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* SELETOR DE PERÍODO */}
      <div style={styles.navHeader}>
        <div style={styles.selectorGroup}>
          <button 
            style={{...styles.btnToggle, ...(viewMode === 'week' ? styles.activeBtn : {})}} 
            onClick={() => {setViewMode('week'); setOffset(0)}}
          >
            SEMANAL
          </button>
          <button 
            style={{...styles.btnToggle, ...(viewMode === 'month' ? styles.activeBtn : {})}} 
            onClick={() => {setViewMode('month'); setOffset(0)}}
          >
            MENSAL
          </button>
        </div>
        
        <div style={styles.dateNav}>
          <button style={styles.navArrow} onClick={() => setOffset(prev => prev + 1)}>‹</button>
          <span style={styles.dateDisplay}>{periodLabel}</span>
          <button 
            style={{...styles.navArrow, opacity: offset === 0 ? 0.3 : 1}} 
            onClick={() => setOffset(prev => Math.max(0, prev - 1))}
            disabled={offset === 0}
          >
            ›
          </button>
        </div>
      </div>

      {/* CARD DE PERFORMANCE (CONSISTÊNCIA REAL) */}
      <motion.div layout style={styles.mainScoreCard}>
        <div style={styles.scoreInfo}>
          <span style={styles.labelSmall}>CONSISTÊNCIA DA DIETA</span>
          <h2 style={{...styles.scoreText, color: realConsistency === 0 ? '#444' : '#fff'}}>
            {realConsistency}%
          </h2>
          <div style={{...styles.trendTag, color: realConsistency === 0 ? '#444' : '#00f2fe'}}>
             {realConsistency === 0 ? '⚪ SEM REGISTROS' : '📈 PERFORMANCE ATIVA'}
          </div>
        </div>
        <div style={styles.streakBadge}>
          <span style={{fontSize: '20px'}}>{realConsistency === 0 ? '❄️' : '🔥'}</span>
          <span style={styles.streakCount}>{user?.streak || 0} dias</span>
          <p style={styles.labelLabel}>STREAK</p>
        </div>
      </motion.div>

      {/* CONTROLE DE PESO COM HISTÓRICO */}
      <div style={styles.weightCard}>
        <div style={styles.weightHeader}>
          <span style={styles.labelSmall}>PESO ATUAL NO PERFIL</span>
          <button style={styles.editBtn} onClick={() => setIsEditingWeight(!isEditingWeight)}>
            {isEditingWeight ? 'CANCELAR' : 'ATUALIZAR'}
          </button>
        </div>

        {isEditingWeight ? (
          <div style={styles.inputGroup}>
            <input 
              type="number" 
              value={tempWeight} 
              onChange={(e) => setTempWeight(e.target.value)}
              style={styles.weightInput}
              autoFocus
            />
            <button style={styles.saveBtn} onClick={handleWeightSubmit}>OK</button>
          </div>
        ) : (
          <div style={styles.weightDisplayRow}>
            <h1 style={styles.currentWeight}>{user?.weight || '--'}<small style={styles.unitKg}>kg</small></h1>
            <div style={styles.weightDiffCol}>
              <span style={{
                ...styles.diffValue, 
                color: weightStats.isLoss ? '#4ade80' : weightStats.isGain ? '#f87171' : '#666'
              }}>
                {weightStats.isLoss ? '-' : weightStats.isGain ? '+' : ''}{weightStats.diff}kg
              </span>
              <p style={styles.labelMini}>DESDE O INÍCIO ({weightStats.initial}kg)</p>
            </div>
          </div>
        )}
      </div>

      {/* GRID DE MÉTRICAS COMPLEMENTARES */}
      <div style={styles.statsGrid}>
        <div style={styles.miniCard}>
          <span style={styles.labelSmall}>MÉDIA DIÁRIA</span>
          <div style={styles.valueGroup}>
            <span style={styles.valueBig}>{realConsistency === 0 ? 0 : 1950}</span>
            <span style={styles.unitSmall}>kcal</span>
          </div>
        </div>
        <div style={styles.miniCard}>
          <span style={styles.labelSmall}>METAS BATIDAS</span>
          <div style={styles.valueGroup}>
            <span style={styles.valueBig}>{realConsistency === 0 ? 0 : 4}</span>
            <span style={styles.unitSmall}>/ {viewMode === 'week' ? '7' : '30'}</span>
          </div>
        </div>
      </div>

      <div style={styles.insightBox}>
        <p style={styles.insightText}>
          {realConsistency === 0 
            ? "⚠️ Não há registros para este período. Comece a anotar suas refeições para ver sua evolução!"
            : "💡 Dica: Manter a consistência acima de 80% ajudará a atingir seus objetivos mais rápido."}
        </p>
      </div>
    </div>
  );
};

// --- ESTILOS REFINADOS ---
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '450px', margin: '0 auto', color: '#fff' },
  navHeader: { marginBottom: '20px' },
  selectorGroup: { display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '15px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.08)' },
  btnToggle: { flex: 1, background: 'none', border: 'none', color: '#444', padding: '10px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', borderRadius: '12px' },
  activeBtn: { background: 'rgba(255,255,255,0.05)', color: '#00f2fe' },
  dateNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dateDisplay: { fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' },
  navArrow: { background: 'none', border: 'none', color: '#00f2fe', fontSize: '20px', cursor: 'pointer' },
  
  mainScoreCard: { background: '#080808', border: '1px solid #111', padding: '25px', borderRadius: '30px', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  scoreInfo: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  scoreText: { fontSize: '48px', fontWeight: '950', margin: '5px 0', letterSpacing: '-2px' },
  trendTag: { fontSize: '10px', fontWeight: 'bold' },
  streakBadge: { background: '#111', padding: '15px', borderRadius: '25px', textAlign: 'center', border: '1px solid #1a1a1a', minWidth: '95px' },
  streakCount: { display: 'block', fontSize: '14px', fontWeight: '900', margin: '5px 0' },
  labelLabel: { fontSize: '8px', color: '#555', fontWeight: 'bold', margin: 0 },

  weightCard: { background: '#080808', border: '1px solid #111', padding: '20px', borderRadius: '25px', marginBottom: '15px' },
  weightHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  weightDisplayRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  currentWeight: { fontSize: '36px', fontWeight: '900', margin: 0 },
  unitKg: { fontSize: '14px', color: '#444', marginLeft: '5px' },
  weightDiffCol: { textAlign: 'right' },
  diffValue: { fontSize: '20px', fontWeight: '900' },
  labelMini: { fontSize: '8px', color: '#333', fontWeight: 'bold', marginTop: '4px' },

  inputGroup: { display: 'flex', gap: '10px' },
  weightInput: { flex: 1, background: '#000', border: '1px solid #222', color: '#00f2fe', fontSize: '20px', padding: '10px', borderRadius: '12px', textAlign: 'center' },
  saveBtn: { background: '#fff', color: '#000', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: '900' },
  editBtn: { background: 'none', border: 'none', color: '#00f2fe', fontSize: '10px', fontWeight: '900', cursor: 'pointer' },

  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' },
  miniCard: { background: '#080808', padding: '20px', borderRadius: '25px', border: '1px solid #111' },
  valueBig: { fontSize: '24px', fontWeight: '900' },
  unitSmall: { fontSize: '10px', color: '#444', marginLeft: '5px' },
  valueGroup: { display: 'flex', alignItems: 'baseline', marginTop: '10px' },
  labelSmall: { fontSize: '9px', fontWeight: '900', color: '#333', letterSpacing: '1px' },
  insightBox: { background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '20px', border: '1px dashed #222' },
  insightText: { fontSize: '12px', color: '#666', lineHeight: '1.6' }
};