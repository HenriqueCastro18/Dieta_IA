import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DBService } from '../../services/db';

export const CompetitivePanel: React.FC<{ user: any, onUpdateUser: (data: any) => void }> = ({ user, onUpdateUser }) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [offset, setOffset] = useState(0); 
  const [isEditing, setIsEditing] = useState(false); 
  const [tempWeight, setTempWeight] = useState(user?.weight?.toString() || '');
  const [realConsistency, setRealConsistency] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [ranking, setRanking] = useState<any[]>([]);

  const userId = user?.uid || user?.id;

  // 1. CARREGAMENTO DOS DADOS (SCORE E RANKING)
  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      if (!userId) return;
      try {
        const days = viewMode === 'week' ? 7 : 30;
        const score = await DBService.getConsistencyScore(userId, days, offset);
        const topUsers = await DBService.getGlobalRanking();
        
        if (isMounted) {
          setRealConsistency(score || 0);
          if (Array.isArray(topUsers)) {
            setRanking(topUsers);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do painel:", err);
      }
    };
    loadStats();
    return () => { isMounted = false; };
  }, [userId, viewMode, offset]);

  // 2. LÓGICA DE EVOLUÇÃO DE PESO
  const weightStats = useMemo(() => {
    const history = user?.weightHistory || [];
    const current = Number(user?.weight) || 0;
    // Pega o primeiro peso registrado no histórico ou o peso atual se estiver vazio
    const initial = history.length > 0 ? Number(history[0].weight) : current; 
    const diff = current - initial;
    
    return {
      diff: Math.abs(diff).toFixed(1),
      isLoss: diff < 0,
      isGain: diff > 0,
      initial: initial
    };
  }, [user]);

  // 3. SALVAR NOVO PESO (CORRIGIDO PARA USAR UPDATEPROFILE)
  const handleWeightSubmit = async () => {
    const val = parseFloat(tempWeight.replace(',', '.'));
    if (!isNaN(val) && userId) {
      setIsSaving(true);
      try {
        // No seu db.ts, a função updateProfile já cuida de adicionar ao weightHistory
        const success = await DBService.updateProfile(userId, { weight: val });
        
        if (success) {
          // Atualiza o estado local para refletir a mudança na UI imediatamente
          onUpdateUser({ 
            ...user, 
            weight: val,
            weightHistory: [...(user.weightHistory || []), { date: new Date().toISOString(), weight: val }]
          });
          setIsEditing(false);
        }
      } catch (error) {
        console.error(error);
        alert("Erro ao salvar peso.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  // 4. RÓTULO DE DATA
  const periodLabel = useMemo(() => {
    const d = new Date();
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - offset);
      return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
    }
    const current = new Date();
    current.setDate(current.getDate() - (offset * 7));
    const day = current.getDay();
    const diff = current.getDate() - day;
    const startOfWeek = new Date(current.setDate(diff));
    return `SEMANA DE ${startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  }, [viewMode, offset]);

  return (
    <div style={styles.container}>
      <div style={styles.navHeader}>
        <div style={styles.selectorGroup}>
          <button 
            style={{...styles.btnToggle, ...(viewMode === 'week' ? styles.activeBtn : {})}} 
            onClick={() => {setViewMode('week'); setOffset(0)}}
          >SEMANAL</button>
          <button 
            style={{...styles.btnToggle, ...(viewMode === 'month' ? styles.activeBtn : {})}} 
            onClick={() => {setViewMode('month'); setOffset(0)}}
          >MENSAL</button>
        </div>
        
        <div style={styles.dateNav}>
          <button style={styles.navArrow} onClick={() => setOffset(prev => prev + 1)}>‹</button>
          <span style={styles.dateDisplay}>{periodLabel}</span>
          <button 
            style={{...styles.navArrow, opacity: offset === 0 ? 0.3 : 1}} 
            onClick={() => setOffset(prev => Math.max(0, prev - 1))}
            disabled={offset === 0}
          >›</button>
        </div>
      </div>

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

      <div style={styles.weightCard}>
        <div style={styles.weightHeader}>
          <span style={styles.labelSmall}>PESO ATUAL</span>
          <button style={styles.editBtn} onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'CANCELAR' : 'ATUALIZAR'}
          </button>
        </div>

        {isEditing ? (
          <div style={styles.inputGroup}>
            <input 
              type="number" 
              step="0.1" 
              value={tempWeight} 
              onChange={(e) => setTempWeight(e.target.value)} 
              style={styles.weightInput} 
              disabled={isSaving} 
              autoFocus 
            />
            <button style={styles.saveBtn} onClick={handleWeightSubmit} disabled={isSaving}>
              {isSaving ? '...' : 'OK'}
            </button>
          </div>
        ) : (
          <div style={styles.weightDisplayRow}>
            <h1 style={styles.currentWeight}>{user?.weight || '--'}<small style={styles.unitKg}>kg</small></h1>
            <div style={styles.weightDiffCol}>
              <span style={{...styles.diffValue, color: weightStats.isLoss ? '#4ade80' : weightStats.isGain ? '#f87171' : '#666'}}>
                {weightStats.isLoss ? '-' : weightStats.isGain ? '+' : ''}{weightStats.diff}kg
              </span>
              <p style={styles.labelMini}>DESDE O INÍCIO ({weightStats.initial}kg)</p>
            </div>
          </div>
        )}
      </div>

      <div style={styles.rankingSection}>
        <span style={styles.labelSmall}>RANKING DE CONSISTÊNCIA</span>
        <div style={styles.rankingList}>
          {ranking.length > 0 ? (
            ranking.slice(0, 5).map((player, idx) => {
              const pId = player.uid || player.id;
              const isMe = pId === userId;
              return (
                <div key={pId || idx} style={{
                  ...styles.rankItem,
                  border: isMe ? '1px solid #00f2fe' : '1px solid #111',
                  background: isMe ? 'rgba(0,242,254,0.05)' : '#080808'
                }}>
                  <div style={styles.rankInfoLeft}>
                    <span style={{...styles.rankPos, color: idx === 0 ? '#fbbf24' : '#555'}}>{idx + 1}º</span>
                    <span style={styles.rankName}>
                      {(player.name || 'Atleta').toUpperCase()} {isMe && '(VOCÊ)'}
                    </span>
                  </div>
                  <span style={styles.rankValue}>{player.consistency || 0}%</span>
                </div>
              );
            })
          ) : (
            <p style={styles.emptyRanking}>Carregando ranking global...</p>
          )}
        </div>
      </div>

      <div style={{...styles.insightBox, marginTop: '20px'}}>
        <p style={styles.insightText}>
          {realConsistency === 0 
            ? "⚠️ Registre seu dia no histórico para subir no ranking."
            : `💡 Você está mantendo uma consistência de ${realConsistency}%! Continue firme.`}
        </p>
      </div>
    </div>
  );
};

// ... (Estilos permanecem os mesmos que você enviou)
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
  weightInput: { flex: 1, background: '#000', border: '1px solid #222', color: '#00f2fe', fontSize: '20px', padding: '10px', borderRadius: '12px', textAlign: 'center', outline: 'none' },
  saveBtn: { background: '#fff', color: '#000', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' },
  editBtn: { background: 'none', border: 'none', color: '#00f2fe', fontSize: '10px', fontWeight: '900', cursor: 'pointer' },
  labelSmall: { fontSize: '9px', fontWeight: '900', color: '#333', letterSpacing: '1px', marginBottom: '12px', display: 'block' },
  insightBox: { background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '20px', border: '1px dashed #222' },
  insightText: { fontSize: '12px', color: '#666', lineHeight: '1.6' },
  rankingSection: { marginTop: '10px' },
  rankingList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  rankItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderRadius: '20px' },
  rankInfoLeft: { display: 'flex', alignItems: 'center', gap: '15px' },
  rankPos: { fontSize: '16px', fontWeight: '950' },
  rankName: { fontSize: '12px', fontWeight: '800', color: '#ddd' },
  rankValue: { fontSize: '14px', fontWeight: '900', color: '#00f2fe' },
  emptyRanking: { fontSize: '11px', color: '#333', textAlign: 'center', padding: '20px' }
};

export default CompetitivePanel;