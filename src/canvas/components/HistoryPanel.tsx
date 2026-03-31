import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DBService } from '../../services/db';

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

  const [dayMeals, setDayMeals] = useState<any[]>([]);
  const [dayWater, setDayWater] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [monthPresenceData, setMonthPresenceData] = useState<Record<string, boolean>>({});
  const [loadingMonth, setLoadingMonth] = useState(false);

  const userId = user?.uid || user?.id;

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    const fetchMonthData = async () => {
      setLoadingMonth(true);
      setMonthPresenceData({}); 
      
      const presence: Record<string, boolean> = {};
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const promises = [];
      
      for (let i = 1; i <= daysInMonth; i++) {
        const dayDate = new Date(currentYear, currentMonth, i);
        const dKey = `${String(i).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;

        if (dayDate > today) {
          presence[dKey] = false;
          continue;
        }

        promises.push(
          DBService.getMealsByDate(userId, dKey)
            .then((meals: any) => {
              if (isMounted) presence[dKey] = meals && meals.length > 0;
            })
            .catch(() => {
              if (isMounted) presence[dKey] = false;
            })
        );
      }
      
      await Promise.all(promises);
      
      if (isMounted) {
        setMonthPresenceData(presence);
        setLoadingMonth(false);
      }
    };

    fetchMonthData();
    return () => { isMounted = false; };
  }, [currentMonth, currentYear, userId]);

  const goals = useMemo(() => {
    const parseValue = (val: any) => {
      if (!val) return 0;
      const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : Number(val);
      return isNaN(num) ? 0 : num;
    };

    const waterGoalRaw = parseValue(user?.goalWater) || 3.5;

    return {
      p: parseValue(user?.goalProtein) || 150,
      c: parseValue(user?.goalCarbs) || 200,
      g: parseValue(user?.goalFat) || 60,
      water: waterGoalRaw < 100 ? waterGoalRaw * 1000 : waterGoalRaw,
      sodium: 2300,
      fiber: 30,
      sugar: 50
    };
  }, [user]);

  useEffect(() => {
    if (selectedDate && userId && view === 'day') {
      const loadData = async () => {
        setLoading(true);
        try {
          const [meals, waterData] = await Promise.all([
            DBService.getMealsByDate(userId, selectedDate),
            DBService.getWaterHistory(userId, selectedDate)
          ]);

          const sortedMeals = (meals || []).sort((a: any, b: any) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });

          setDayMeals(sortedMeals);
          setDayWater(Number(waterData?.amount) || 0);
        } catch (err) {
          console.error("Erro ao carregar histórico do dia:", err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [selectedDate, userId, view]);

  const totals = useMemo(() => {
    const base = dayMeals.reduce((acc: any, meal: any) => ({
      calories: acc.calories + (meal.macros?.calories || meal.calories || 0),
      proteins: acc.proteins + (meal.macros?.proteins || meal.protein || meal.proteins || 0),
      carbs: acc.carbs + (meal.macros?.carbs || meal.carbs || 0),
      fats: acc.fats + (meal.macros?.fats || meal.fat || meal.fats || 0),
      sodium: acc.sodium + (meal.macros?.sodium || meal.sodium || 0),
      fiber: acc.fiber + (meal.macros?.fiber || meal.fiber || 0),
      sugar: acc.sugar + (meal.macros?.sugar || meal.sugar || 0),
    }), {
      calories: 0, proteins: 0, carbs: 0, fats: 0, sodium: 0, fiber: 0, sugar: 0
    });

    return { ...base, water: dayWater };
  }, [dayMeals, dayWater]);

  const structuredMeals = dayMeals.filter(m => m.items !== undefined);

  if (!user) return <div style={loadingState}>Carregando perfil...</div>;

  const monthName = new Date(currentYear, currentMonth).toLocaleString('pt-BR', { month: 'long' });
  const todayNormalized = new Date();
  todayNormalized.setHours(0, 0, 0, 0);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const nextMonth = prev - 1;
      if (nextMonth < 0) { setCurrentYear(y => y - 1); return 11; }
      return nextMonth;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const nextMonth = prev + 1;
      if (nextMonth > 11) { setCurrentYear(y => y + 1); return 0; }
      return nextMonth;
    });
  };

  const daysInMonthCount = new Date(currentYear, currentMonth + 1, 0).getDate();

  return (
    <div style={containerPanel}>
      <AnimatePresence mode="wait">

        {view === 'month' && (
          <motion.div key="month" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={contentArea}>
            
            <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' }}>
              <button style={closeButton} onClick={() => {}}>CLOSE</button>
              <h2 style={{ color: '#00f2fe', fontSize: '24px', fontWeight: '950', letterSpacing: '1px', margin: 0 }}>HISTORY</h2>
            </header>

            <div className="v4-glass-card">
              <div className="v4-cal-header-row">
                <button onClick={handlePrevMonth} className="v4-nav-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div className="v4-month-title-box">
                  <span className="v4-month-text">{monthName}</span>
                  <span className="v4-year-text">{currentYear}</span>
                </div>
                <button onClick={handleNextMonth} className="v4-nav-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>

              <div className="v4-weekdays">
                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => <span key={d}>{d}</span>)}
              </div>

              <div className="v4-days-grid" style={{ opacity: loadingMonth ? 0.5 : 1, transition: '0.3s' }}>
                {Array.from({ length: daysInMonthCount }, (_, i) => {
                  const dayNum = i + 1;
                  const dayDate = new Date(currentYear, currentMonth, dayNum);
                  const dayOfWeek = dayDate.getDay(); 
                  const dKey = `${String(dayNum).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;
                  
                  const isToday = dayDate.getTime() === todayNormalized.getTime();
                  const isFuture = dayDate > todayNormalized;
                  const hasData = monthPresenceData[dKey] === true;
                  const isPastEmpty = !isFuture && !isToday && !hasData;
                  const isSelected = selectedDate === dKey;

                  let cellClass = 'v4-day-cell';
                  let icon = '';

                  if (isFuture) {
                    cellClass += ' v4-day-future';
                  } else if (isToday) {
                    cellClass += ' v4-day-today';
                    icon = hasData ? '✓' : ''; 
                  } else if (hasData) {
                    cellClass += ' v4-day-done';
                    icon = '✓';
                  } else if (isPastEmpty) {
                    cellClass += ' v4-day-missed';
                    icon = '×';
                  }

                  if (isSelected) cellClass += ' v4-day-selected';

                  return (
                    <motion.div
                      key={i}
                      whileHover={{ y: -2 }}
                      style={{ gridColumnStart: i === 0 ? dayOfWeek + 1 : 'auto' }}
                      className={cellClass}
                      onClick={() => { setSelectedDate(dKey); setView('day'); }}
                    >
                      <span className="v4-day-num">{dayNum}</span>
                      <div className="v4-day-icon">{icon}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {view === 'day' && selectedDate && (
          <motion.div key="day" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} style={contentArea}>
            <button onClick={() => setView('month')} style={backButton}>← CALENDÁRIO</button>

            {loading ? (
              <div style={loadingState}>Buscando dados no Firebase...</div>
            ) : (
              <>
                <div style={daySummaryCard}>
                  <div style={summaryHeader}>
                    <div style={summaryMainInfo}>
                      <span style={summaryCalValue}>{Math.round(totals.calories)}</span>
                      <span style={summaryCalLabel}>KCAL CONSUMIDAS</span>
                    </div>
                    <div style={dateBadge}>{selectedDate}</div>
                  </div>
                  <div style={summaryMacrosGrid}>
                    <NutrientBar label="PROT" value={totals.proteins} color="#4ade80" goal={goals.p} small />
                    <NutrientBar label="CARB" value={totals.carbs} color="#fbbf24" goal={goals.c} small />
                    <NutrientBar label="GORD" value={totals.fats} color="#f87171" goal={goals.g} small />
                    <NutrientBar label="SÓD" value={totals.sodium} color="#a78bfa" goal={goals.sodium} small />
                    <NutrientBar label="FIBRA" value={totals.fiber} color="#2dd4bf" goal={goals.fiber} small />
                    <NutrientBar label="AÇÚC" value={totals.sugar} color="#60a5fa" goal={goals.sugar} small />
                  </div>
                </div>

                <div style={waterSummaryCard}>
                  <h4 style={waterSectionTitle}>HIDRATAÇÃO DO DIA</h4>
                  <div style={waterChartArea}>
                    <NutrientBar label="ÁGUA" value={totals.water} color="#00f2fe" goal={goals.water} small />
                    <div style={waterStatusInfo}>
                      <div style={waterProgressPerc}>
                        {goals.water > 0 ? Math.round((totals.water / goals.water) * 100) : 0}%
                      </div>
                      <span style={waterStatusText}>{totals.water}ml / {goals.water}ml</span>
                    </div>
                  </div>
                </div>

                <div style={mealListContainer}>
                  <h4 style={foodListTitle}>REFEIÇÕES</h4>
                  
                  {structuredMeals.length > 0 ? (
                    structuredMeals.map((meal: any) => (
                      <div key={meal.id} style={mealCardCompact} onClick={() => { setSelectedMeal(meal); setView('meal'); }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={mealNameText}>{meal.name}</span>
                          <span style={mealTimeText}>
                            {meal.createdAt?.seconds
                              ? new Date(meal.createdAt.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                              : '--:--'}
                          </span>
                        </div>
                        <div style={mealCalorieBadge}>{Math.round(meal.macros?.calories || 0)} <small>kcal</small></div>
                      </div>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', color: '#444', fontSize: '11px', marginTop: '10px' }}>Nenhum registro para este dia.</p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {view === 'meal' && selectedMeal && (
          <motion.div key="meal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.05, opacity: 0 }} style={contentArea}>
            <button onClick={() => setView('day')} style={backButton}>← RESUMO DO DIA</button>
            <div style={premiumDetailsCard}>
              <header style={{ textAlign: 'center', marginBottom: '25px' }}>
                <h2 style={{ color: '#00f2fe', fontSize: '24px', fontWeight: '950', letterSpacing: '1px' }}>{selectedMeal.name.toUpperCase()}</h2>
                <p style={{ color: '#222', fontSize: '11px', fontWeight: 'bold', marginTop: '5px' }}>{selectedMeal.date}</p>
              </header>

              <div style={summaryHeader}>
                <div style={summaryMainInfo}>
                  <span style={summaryCalValue}>{Math.round(selectedMeal.macros?.calories || selectedMeal.calories || 0)}</span>
                  <span style={summaryCalLabel}>KCAL NA REFEIÇÃO</span>
                </div>
              </div>

              <section style={chartAreaResponsive}>
                <div style={barGridSix}>
                  <NutrientBar label="PROT" value={selectedMeal.macros?.proteins || selectedMeal.protein || selectedMeal.proteins} color="#4ade80" goal={goals.p} />
                  <NutrientBar label="CARB" value={selectedMeal.macros?.carbs || selectedMeal.carbs} color="#fbbf24" goal={goals.c} />
                  <NutrientBar label="GORD" value={selectedMeal.macros?.fats || selectedMeal.fat || selectedMeal.fats} color="#f87171" goal={goals.g} />
                  <NutrientBar label="SÓD" value={selectedMeal.macros?.sodium || selectedMeal.sodium || 0} color="#a78bfa" goal={goals.sodium} />
                  <NutrientBar label="FIBRA" value={selectedMeal.macros?.fiber || selectedMeal.fiber || 0} color="#2dd4bf" goal={goals.fiber} />
                  <NutrientBar label="AÇÚC" value={selectedMeal.macros?.sugar || selectedMeal.sugar || 0} color="#60a5fa" goal={goals.sugar} />
                </div>
              </section>

              {selectedMeal.items && (
                <>
                  <h4 style={foodListTitle}>ITENS DETALHADOS</h4>
                  <div style={foodItemsContainer}>
                    {selectedMeal.items.map((item: any, idx: number) => (
                      <div key={idx} style={foodItemCapsule}>
                        <span style={foodItemName}>{item.name}</span>
                        <div style={foodItemCalBadge}>{Math.round(item.calories)} kcal</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .v4-glass-card {
            background: rgba(13, 13, 13, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 28px;
            padding: 20px; 
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
            width: 100%;
            box-sizing: border-box;
        }
        
        .v4-cal-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; width: 100%; }
        .v4-nav-btn { background: #151515; border: 1px solid #222; color: #fff; width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .v4-nav-btn:active { transform: scale(0.90); }
        
        .v4-month-title-box { display: flex; flex-direction: column; align-items: center; min-width: 120px; }
        .v4-month-text { text-transform: uppercase; font-weight: 950; color: #fff; font-size: 16px; letter-spacing: 1px; line-height: 1.2; }
        .v4-year-text { font-size: 10px; color: #555; font-weight: 800; letter-spacing: 2px; }

        .v4-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 12px; font-size: 9px; font-weight: 900; color: #444; gap: 6px; width: 100%; box-sizing: border-box; }
        .v4-days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; width: 100%; box-sizing: border-box; }

        .v4-day-cell {
            aspect-ratio: 1/1.15; 
            border-radius: 12px; 
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: 1px solid transparent;
            transition: 0.2s;
            background: transparent;
            padding: 4px 0;
            box-sizing: border-box;
        }
        .v4-day-num { font-size: 14px; font-weight: 800; line-height: 1; }
        .v4-day-icon { font-size: 9px; font-weight: 900; margin-top: 2px; line-height: 1; }

        .v4-day-future { color: #444; }
        
        .v4-day-missed { border: 1px dashed rgba(255, 62, 62, 0.3); color: #ff3e3e; }
        .v4-day-missed .v4-day-icon { color: #ff3e3e; }
        
        .v4-day-done { background: #bcff00; color: #050505; }
        .v4-day-done .v4-day-icon { color: #050505; }
        
        .v4-day-today { background: #fff; color: #000; box-shadow: 0 0 15px rgba(255,255,255,0.2); }
        .v4-day-today .v4-day-icon { color: #000; }
        
        .v4-day-selected { border: 2px solid #00f2fe; }
      `}</style>
    </div>
  );
};

const containerPanel: React.CSSProperties = { padding: '15px', color: '#fff', width: '100%', display: 'flex', justifyContent: 'center', boxSizing: 'border-box' };
const contentArea: React.CSSProperties = { width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' };
const loadingState: React.CSSProperties = { padding: '100px 0', color: '#444', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' };
const closeButton: React.CSSProperties = { background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#555', padding: '12px 20px', borderRadius: '15px', cursor: 'pointer', fontSize: '10px', fontWeight: '900', marginBottom: '10px', alignSelf: 'flex-end' };
const backButton: React.CSSProperties = { background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#555', padding: '12px 20px', borderRadius: '15px', cursor: 'pointer', fontSize: '10px', fontWeight: '900', marginBottom: '20px', alignSelf: 'flex-start' };
const daySummaryCard: React.CSSProperties = { background: '#050505', padding: '25px', borderRadius: '35px', border: '1px solid #111', marginBottom: '15px', boxSizing: 'border-box' };
const summaryHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'flex-start' };
const summaryMainInfo: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const summaryCalValue: React.CSSProperties = { fontSize: '56px', fontWeight: '950', lineHeight: '0.9', letterSpacing: '-2px' };
const summaryCalLabel: React.CSSProperties = { fontSize: '10px', color: '#00f2fe', fontWeight: '900', marginTop: '8px', letterSpacing: '1px' };
const dateBadge: React.CSSProperties = { background: '#111', padding: '6px 12px', borderRadius: '10px', fontSize: '10px', color: '#444', fontWeight: 'bold' };
const summaryMacrosGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', alignItems: 'flex-end', width: '100%', boxSizing: 'border-box' };
const waterSummaryCard: React.CSSProperties = { background: '#050505', padding: '25px', borderRadius: '35px', border: '1px solid #111', marginBottom: '20px', boxSizing: 'border-box' };
const waterSectionTitle: React.CSSProperties = { color: '#222', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '20px' };
const waterChartArea: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '35px' };
const waterStatusInfo: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const waterProgressPerc: React.CSSProperties = { fontSize: '38px', fontWeight: '950', color: '#00f2fe', lineHeight: '1' };
const waterStatusText: React.CSSProperties = { fontSize: '11px', color: '#333', fontWeight: '800', marginTop: '5px' };
const mealListContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' };
const mealCardCompact: React.CSSProperties = { background: '#050505', padding: '18px', borderRadius: '25px', border: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' };
const mealNameText: React.CSSProperties = { fontWeight: '900', fontSize: '14px', color: '#fff' };
const mealTimeText: React.CSSProperties = { fontSize: '10px', color: '#222', marginTop: '2px' };
const mealCalorieBadge: React.CSSProperties = { color: '#00f2fe', fontWeight: '900', fontSize: '18px' };
const premiumDetailsCard: React.CSSProperties = { background: '#050505', padding: '30px', borderRadius: '40px', border: '1px solid #111', width: '100%', boxSizing: 'border-box' };
const chartAreaResponsive: React.CSSProperties = { background: '#000', padding: '30px 15px', borderRadius: '30px', marginBottom: '25px', border: '1px solid #111', width: '100%', boxSizing: 'border-box' };
const barGridSix: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', alignItems: 'flex-end' };
const barColumn: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', height: '160px' };
const barColumnSmall: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', height: '140px', justifyContent: 'flex-end' };
const barValue: React.CSSProperties = { fontWeight: '900', marginBottom: '8px' };
const barTrack: React.CSSProperties = { flex: 1, width: '22px', background: '#050505', borderRadius: '12px', position: 'relative', overflow: 'hidden', border: '1px solid #111' };
const barTrackSmall: React.CSSProperties = { flex: 1, width: '18px', background: '#050505', borderRadius: '10px', position: 'relative', overflow: 'hidden', border: '1px solid #111', margin: '8px 0' };
const barFill: React.CSSProperties = { position: 'absolute', bottom: 0, left: 0, width: '100%', borderRadius: 'inherit' };
const barLabel: React.CSSProperties = { fontWeight: '900', color: '#222', marginTop: '10px', fontSize: '9px' };
const barLabelSmall: React.CSSProperties = { fontWeight: '900', color: '#222', fontSize: '8px', marginTop: '5px' };
const foodListTitle: React.CSSProperties = { color: '#222', fontSize: '10px', fontWeight: '900', textAlign: 'center', marginBottom: '15px', letterSpacing: '2px' };
const foodItemsContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const foodItemCapsule: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', padding: '12px 20px', borderRadius: '15px', border: '1px solid #111' };
const foodItemName: React.CSSProperties = { fontWeight: '800', fontSize: '13px', color: '#eee' };
const foodItemCalBadge: React.CSSProperties = { fontSize: '11px', color: '#00f2fe', fontWeight: '900' };

export default HistoryPanel;