import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DBLite } from '../../services/db';

// --- COMPONENTE DE BARRA RESPONSIVA ---
const NutrientBar = ({ label, value, color, goal, small }: any) => {
  const progress = Math.min((value || 0) / (goal || 1), 1);
  return (
    <div style={small ? barColumnSmall : barColumn}>
      <span style={{
        ...barValue,
        color,
        fontSize: small ? '11px' : '14px',
        fontWeight: '900'
      }}>
        {value > 100 ? Math.round(value) : (value || 0).toFixed(0)}
      </span>

      <div style={small ? barTrackSmall : barTrack}>
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ ...barFill, background: color, boxShadow: `0 0 12px ${color}33` }}
        />
      </div>
      <span style={small ? barLabelSmall : barLabel}>{label}</span>
    </div>
  );
};

export const HistoryPanel: React.FC<{ user: any }> = ({ user }) => {
  const [view, setView] = useState<'month' | 'day' | 'meal'>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null);
  const [history, setHistory] = useState<any>({});

  const goals = {
    p: Number(user?.goalProtein) || 150,
    c: Number(user?.goalCarbs) || 200,
    g: Number(user?.goalFat) || 60,
    water: Number(user?.goalWater) || 3500,
    sodium: 2300,
    fiber: 30,
    sugar: 50
  };

  // Sincroniza o estado local com o LocalStorage sempre que houver interação
  useEffect(() => {
    const data = DBLite.getHistory();
    setHistory(data);
  }, [view, selectedDate]);

  if (!user) return <div style={loadingState}>Carregando...</div>;

  // CÁLCULO DE TOTAIS DINÂMICO
  const getDayTotals = (date: string) => {
    const dayEntries = history[date] || [];
    const userEntries = dayEntries.filter((m: any) => m.userId === user.id);
    
    // Busca hidratação específica (seja do array de histórico ou da chave WATER_KEY)
    const waterData = DBLite.getWaterHistory(date, user.id);
    
    // Filtra apenas refeições para não somar a água nos macros de comida por erro
    const mealsOnly = userEntries.filter((e: any) => e.type !== 'water');

    return mealsOnly.reduce((acc: any, meal: any) => ({
      ...acc,
      calories: acc.calories + (meal.macros?.calories || 0),
      proteins: acc.proteins + (meal.macros?.proteins || 0),
      carbs: acc.carbs + (meal.macros?.carbs || 0),
      fats: acc.fats + (meal.macros?.fats || 0),
      sodium: acc.sodium + (meal.macros?.sodium || 0),
      fiber: acc.fiber + (meal.macros?.fiber || 0),
      sugar: acc.sugar + (meal.macros?.sugar || 0),
    }), { 
      calories: 0, proteins: 0, carbs: 0, fats: 0, sodium: 0, fiber: 0, sugar: 0, 
      water: Number(waterData.amount) || 0 
    });
  };

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthName = today.toLocaleString('pt-BR', { month: 'long' });

  return (
    <div style={containerPanel}>
      <AnimatePresence mode="wait">

        {/* VIEW 1: CALENDÁRIO */}
        {view === 'month' && (
          <motion.div key="month" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={contentArea}>
            <h3 style={mainTitle}>{monthName.toUpperCase()} <span style={{ color: '#222' }}>{currentYear}</span></h3>
            <div style={calendarGrid}>
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i} style={weekDayHeader}>{d}</div>)}
              {Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }, (_, i) => {
                const dayNum = i + 1;
                const dKey = `${String(dayNum).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;
                
                const dayData = history[dKey]?.filter((m: any) => m.userId === user.id) || [];
                const hasMeals = dayData.some((e: any) => e.type !== 'water');
                const hasWater = DBLite.getWaterHistory(dKey, user.id).amount > 0;
                
                const shouldHighlight = hasMeals || hasWater;

                return (
                  <div key={i} 
                    onClick={() => { if (shouldHighlight) { setSelectedDate(dKey); setView('day'); } }}
                    style={{ 
                      ...dayCell, 
                      cursor: shouldHighlight ? 'pointer' : 'default', 
                      background: shouldHighlight ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' : 'rgba(255,255,255,0.02)', 
                      color: shouldHighlight ? '#000' : '#333',
                      border: dKey === today.toLocaleDateString('pt-BR') ? '1px solid #00f2fe' : 'none'
                    }}>
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: RESUMO DO DIA */}
        {view === 'day' && selectedDate && (
          <motion.div key="day" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} style={contentArea}>
            <button onClick={() => setView('month')} style={backButton}>← VOLTAR</button>
            
            {/* CARD DE MACROS */}
            <div style={daySummaryCard}>
              <div style={summaryHeader}>
                <div style={summaryMainInfo}>
                  <span style={summaryCalValue}>{Math.round(getDayTotals(selectedDate).calories)}</span>
                  <span style={summaryCalLabel}>KCAL CONSUMIDAS</span>
                </div>
                <div style={dateBadge}>{selectedDate}</div>
              </div>
              <div style={summaryMacrosGrid}>
                <NutrientBar label="PROT" value={getDayTotals(selectedDate).proteins} color="#4ade80" goal={goals.p} small />
                <NutrientBar label="CARB" value={getDayTotals(selectedDate).carbs} color="#fbbf24" goal={goals.c} small />
                <NutrientBar label="GORD" value={getDayTotals(selectedDate).fats} color="#f87171" goal={goals.g} small />
                <NutrientBar label="SÓD" value={getDayTotals(selectedDate).sodium} color="#a78bfa" goal={goals.sodium} small />
                <NutrientBar label="FIBRA" value={getDayTotals(selectedDate).fiber} color="#2dd4bf" goal={goals.fiber} small />
                <NutrientBar label="AÇÚC" value={getDayTotals(selectedDate).sugar} color="#60a5fa" goal={goals.sugar} small />
              </div>
            </div>

            {/* CARD DE ÁGUA */}
            <div style={waterSummaryCard}>
              <h4 style={waterSectionTitle}>HIDRATAÇÃO DO DIA</h4>
              <div style={waterChartArea}>
                <NutrientBar 
                  label="ÁGUA" 
                  value={getDayTotals(selectedDate).water} 
                  color="#00f2fe" 
                  goal={goals.water} 
                  small 
                />
                <div style={waterStatusInfo}>
                  <div style={waterProgressPerc}>
                    {Math.round((getDayTotals(selectedDate).water / goals.water) * 100)}%
                  </div>
                  <span style={waterStatusText}>{getDayTotals(selectedDate).water}ml / {goals.water}ml</span>
                </div>
              </div>
            </div>

            {/* LISTA DE REFEIÇÕES */}
            <div style={mealListContainer}>
              <h4 style={foodListTitle}>REFEIÇÕES</h4>
              {history[selectedDate]?.filter((m: any) => m.userId === user.id && m.type !== 'water').map((meal: any) => (
                <div key={meal.id || meal.timestamp} style={mealCardCompact} onClick={() => { setSelectedMeal(meal); setView('meal'); }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={mealNameText}>{meal.name}</span>
                    <span style={mealTimeText}>{meal.time}</span>
                  </div>
                  <div style={mealCalorieBadge}>{Math.round(meal.macros?.calories)} <small>kcal</small></div>
                </div>
              ))}
              {(!history[selectedDate] || history[selectedDate].filter((m:any) => m.type !== 'water').length === 0) && (
                <p style={{ textAlign: 'center', color: '#222', fontSize: '11px', marginTop: '10px' }}>Sem refeições sólidas hoje.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 3: DETALHES DA REFEIÇÃO */}
        {view === 'meal' && selectedMeal && (
          <motion.div key="meal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.05, opacity: 0 }} style={contentArea}>
            <button onClick={() => setView('day')} style={backButton}>← VOLTAR</button>
            <div style={premiumDetailsCard}>
              <header style={cardHeader}>
                <h2 style={mealDetailName}>{selectedMeal.name.toUpperCase()}</h2>
                <p style={mealDetailMeta}>{selectedMeal.time} • {selectedMeal.date}</p>
              </header>

              <div style={summaryHeader}>
                <div style={summaryMainInfo}>
                  <span style={summaryCalValue}>{Math.round(selectedMeal.macros.calories)}</span>
                  <span style={summaryCalLabel}>KCAL NESTA REFEIÇÃO</span>
                </div>
              </div>

              <section style={chartAreaResponsive}>
                <div style={barGridSix}>
                  <NutrientBar label="PROT" value={selectedMeal.macros.proteins} color="#4ade80" goal={goals.p} />
                  <NutrientBar label="CARB" value={selectedMeal.macros.carbs} color="#fbbf24" goal={goals.c} />
                  <NutrientBar label="GORD" value={selectedMeal.macros.fats} color="#f87171" goal={goals.g} />
                  <NutrientBar label="SÓD" value={selectedMeal.macros.sodium || 0} color="#a78bfa" goal={goals.sodium} />
                  <NutrientBar label="FIBRA" value={selectedMeal.macros.fiber || 0} color="#2dd4bf" goal={goals.fiber} />
                  <NutrientBar label="AÇÚC" value={selectedMeal.macros.sugar || 0} color="#60a5fa" goal={goals.sugar} />
                </div>
              </section>

              <h4 style={foodListTitle}>ITENS</h4>
              <div style={foodItemsContainer}>
                {selectedMeal.items?.map((item: any, idx: number) => (
                  <div key={idx} style={foodItemCapsule}>
                    <span style={foodItemName}>{item.name}</span>
                    <div style={foodItemCalBadge}>{Math.round(item.calories)} kcal</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- ESTILOS REVISADOS ---
const containerPanel: React.CSSProperties = { padding: '20px', color: '#fff', width: '100%', display: 'flex', justifyContent: 'center' };
const contentArea: React.CSSProperties = { width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column' };
const loadingState: React.CSSProperties = { padding: '100px 0', color: '#222', textAlign: 'center', fontWeight: 'bold' };
const mainTitle: React.CSSProperties = { fontSize: '18px', fontWeight: '950', textAlign: 'center', marginBottom: '25px', letterSpacing: '2px' };
const backButton: React.CSSProperties = { background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#444', padding: '12px 20px', borderRadius: '15px', cursor: 'pointer', fontSize: '10px', fontWeight: '900', marginBottom: '20px', alignSelf: 'flex-start' };
const calendarGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', background: '#050505', padding: '20px', borderRadius: '35px', border: '1px solid #111' };
const weekDayHeader: React.CSSProperties = { textAlign: 'center', fontSize: '10px', color: '#1a1a1a', fontWeight: '900', paddingBottom: '10px' };
const dayCell: React.CSSProperties = { aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', fontSize: '13px', fontWeight: '900' };
const daySummaryCard: React.CSSProperties = { background: '#050505', padding: '25px', borderRadius: '35px', border: '1px solid #111', marginBottom: '15px' };
const summaryHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'flex-start' };
const summaryMainInfo: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const summaryCalValue: React.CSSProperties = { fontSize: '56px', fontWeight: '950', lineHeight: '0.9', letterSpacing: '-2px' };
const summaryCalLabel: React.CSSProperties = { fontSize: '10px', color: '#00f2fe', fontWeight: '900', marginTop: '8px', letterSpacing: '1px' };
const dateBadge: React.CSSProperties = { background: '#111', padding: '6px 12px', borderRadius: '10px', fontSize: '10px', color: '#333', fontWeight: 'bold' };
const summaryMacrosGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', alignItems: 'flex-end' };
const waterSummaryCard: React.CSSProperties = { background: '#050505', padding: '25px', borderRadius: '35px', border: '1px solid #111', marginBottom: '20px' };
const waterSectionTitle: React.CSSProperties = { color: '#1a1a1a', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '20px' };
const waterChartArea: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '35px' };
const waterStatusInfo: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const waterProgressPerc: React.CSSProperties = { fontSize: '38px', fontWeight: '950', color: '#00f2fe', lineHeight: '1' };
const waterStatusText: React.CSSProperties = { fontSize: '11px', color: '#333', fontWeight: '800', marginTop: '5px' };
const mealListContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' };
const mealCardCompact: React.CSSProperties = { background: '#050505', padding: '18px', borderRadius: '25px', border: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' };
const mealNameText: React.CSSProperties = { fontWeight: '900', fontSize: '14px', color: '#fff' };
const mealTimeText: React.CSSProperties = { fontSize: '10px', color: '#222', marginTop: '2px' };
const mealCalorieBadge: React.CSSProperties = { color: '#00f2fe', fontWeight: '900', fontSize: '18px' };
const premiumDetailsCard: React.CSSProperties = { background: '#050505', padding: '30px', borderRadius: '40px', border: '1px solid #111' };
const cardHeader: React.CSSProperties = { textAlign: 'center', marginBottom: '25px' };
const mealDetailName: React.CSSProperties = { color: '#00f2fe', fontSize: '24px', fontWeight: '950', letterSpacing: '1px' };
const mealDetailMeta: React.CSSProperties = { color: '#222', fontSize: '11px', fontWeight: 'bold', marginTop: '5px' };
const chartAreaResponsive: React.CSSProperties = { background: '#000', padding: '30px 15px', borderRadius: '30px', marginBottom: '25px', border: '1px solid #111' };
const barGridSix: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', alignItems: 'flex-end' };
const barColumn: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', height: '160px' };
const barColumnSmall: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', height: '140px', justifyContent: 'flex-end' };
const barValue: React.CSSProperties = { fontWeight: '900', marginBottom: '8px' };
const barTrack: React.CSSProperties = { flex: 1, width: '22px', background: '#050505', borderRadius: '12px', position: 'relative', overflow: 'hidden', border: '1px solid #111' };
const barTrackSmall: React.CSSProperties = { flex: 1, width: '18px', background: '#050505', borderRadius: '10px', position: 'relative', overflow: 'hidden', border: '1px solid #111', margin: '8px 0' };
const barFill: React.CSSProperties = { position: 'absolute', bottom: 0, left: 0, width: '100%', borderRadius: 'inherit' };
const barLabel: React.CSSProperties = { fontWeight: '900', color: '#1a1a1a', marginTop: '10px', fontSize: '9px' };
const barLabelSmall: React.CSSProperties = { fontWeight: '900', color: '#1a1a1a', fontSize: '8px', marginTop: '5px' };
const foodListTitle: React.CSSProperties = { color: '#1a1a1a', fontSize: '10px', fontWeight: '900', textAlign: 'center', marginBottom: '15px', letterSpacing: '2px' };
const foodItemsContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const foodItemCapsule: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', padding: '12px 20px', borderRadius: '15px', border: '1px solid #111' };
const foodItemName: React.CSSProperties = { fontWeight: '800', fontSize: '13px', color: '#eee' };
const foodItemCalBadge: React.CSSProperties = { fontSize: '11px', color: '#00f2fe', fontWeight: '900' };