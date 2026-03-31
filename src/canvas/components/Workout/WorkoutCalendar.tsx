import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    format, startOfMonth, endOfMonth, eachDayOfInterval, 
    isSameDay, addMonths, subMonths, getDay, isToday, isBefore, startOfToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkoutCalendarProps {
    workouts: any | null;
    userSettings: {
        offDays: number[];
        split: string[]; 
    };
    history: Record<string, string>;
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    onSelectDay: (type: string) => void;
    onOpenSanctuary: () => void;
}

export const WorkoutCalendar = ({ 
    workouts, userSettings, history, selectedDate, onSelectDate, onSelectDay, onOpenSanctuary 
}: WorkoutCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const workoutKeys = useMemo(() => {
        if (userSettings?.split && userSettings.split.length > 0) return userSettings.split;
        if (!workouts) return ['A', 'B', 'C'];
        return Object.keys(workouts).filter(key => typeof workouts[key] === 'object' && key !== 'Descanso' && key !== 'observations');
    }, [workouts, userSettings.split]);

    const days = useMemo(() => eachDayOfInterval({ 
        start: startOfMonth(currentDate), 
        end: endOfMonth(currentDate) 
    }), [currentDate]);

    const getWorkoutType = (date: Date): string => {
        const dayOfWeek = getDay(date);
        if (userSettings?.offDays?.includes(dayOfWeek)) return 'CARDIO';

        const startAnchor = startOfMonth(currentDate);
        const daysInInterval = eachDayOfInterval({ start: startAnchor, end: date });
        
        const trainingDaysCount = daysInInterval.filter(d => !userSettings?.offDays?.includes(getDay(d))).length;
        if (trainingDaysCount === 0) return workoutKeys[0];

        return workoutKeys[(trainingDaysCount - 1) % workoutKeys.length];
    };

    const selectedType = useMemo(() => getWorkoutType(selectedDate), [selectedDate, userSettings, workoutKeys]);
    const currentColor = useMemo(() => {
        const t = selectedType.toUpperCase();
        if (t === 'CARDIO') return '#ff0077';
        if (t.includes('A') || t === 'PUSH') return '#ff3e3e';
        if (t.includes('B') || t === 'PULL') return '#00f2fe';
        if (t.includes('C') || t === 'LEGS') return '#bcff00';
        return '#ffffff';
    }, [selectedType]);

    return (
        <div className="v4-cal-container">
            <div className="v4-glass-card">
                <header className="v4-cal-header">
                    <div className="v4-nav-group">
                        <button className="v4-nav-btn" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>
                        
                        <div className="v4-month-display">
                            <span className="v4-month-text">{format(currentDate, 'MMMM', { locale: ptBR })}</span>
                            <span className="v4-year-text">{format(currentDate, 'yyyy')}</span>
                        </div>

                        <button className="v4-nav-btn" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                    </div>
                </header>

                <div className="v4-week-header">
                    {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => <span key={d}>{d}</span>)}
                </div>

                <div className="v4-days-grid">
                    {days.map((day, index) => {
                        const type = getWorkoutType(day);
                        const isSel = isSameDay(day, selectedDate);
                        const isTod = isToday(day);
                        const status = history[format(day, 'yyyy-MM-dd')];
                        const isPast = isBefore(day, startOfToday());
                        const isRestDay = userSettings?.offDays?.includes(getDay(day));

                        let stateClass = '';
                        let icon = type === 'CARDIO' ? '♥' : type;

                        if (status === 'completed') { icon = '✓'; stateClass = 'is-completed'; }
                        else if (isPast && !isRestDay) { icon = '✕'; stateClass = 'is-missed'; }

                        return (
                            <motion.div
                                key={day.toISOString()}
                                style={{ gridColumnStart: index === 0 ? getDay(day) + 1 : 'auto' }}
                                whileHover={{ y: -2 }}
                                className={`v4-day-cell ${isSel ? 'is-selected' : ''} ${isTod ? 'is-today' : ''} ${stateClass}`}
                                onClick={() => onSelectDate(day)}
                            >
                                <span className="v4-day-number">{format(day, 'd')}</span>
                                <div className="v4-status-indicator">{icon}</div>
                            </motion.div>
                        );
                    })}
                </div>

                {}
                <div className="v4-cal-divider"></div>
                <button className="v4-pet-banner-btn" onClick={onOpenSanctuary}>
                    <div className="v4-pet-banner-left">
                        <span className="v4-pet-emoji">🐥</span>
                        <span className="v4-pet-banner-title">CORE PETS // SANTUÁRIO</span>
                    </div>
                    <div className="v4-pet-banner-right">
                        <span>VER COLEÇÃO</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div 
                    key={selectedDate.toString()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="v4-detail-card"
                    style={{ borderLeftColor: currentColor }}
                >
                    <div className="v4-detail-info">
                        <span className="v4-full-date">{format(selectedDate, "eeee, dd 'de' MMMM", { locale: ptBR })}</span>
                        <h3 className="v4-workout-name">{selectedType === 'CARDIO' ? 'Recuperação Ativa' : workouts?.[selectedType]?.title || `Treino ${selectedType}`}</h3>
                    </div>
                    
                    <button 
                        className="v4-main-action" 
                        onClick={() => onSelectDay(selectedType)}
                        style={{ backgroundColor: currentColor, color: ['#00f2fe', '#bcff00'].includes(currentColor) ? '#000' : '#fff' }}
                    >
                        <span>{selectedType === 'CARDIO' ? 'VER CARDIO' : `INICIAR TREINO ${selectedType}`}</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                </motion.div>
            </AnimatePresence>

            <style>{`
                .v4-cal-container { width: 100%; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; overflow: hidden; }
                
                .v4-glass-card { 
                    background: rgba(13, 13, 13, 0.6); 
                    backdrop-filter: blur(12px); 
                    -webkit-backdrop-filter: blur(12px); 
                    border: 1px solid rgba(255, 255, 255, 0.05); 
                    border-radius: 28px; 
                    padding: 16px; 
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
                    width: 100%;
                    box-sizing: border-box;
                    overflow: hidden;
                }
                
                .v4-cal-header { display: flex; justify-content: center; align-items: center; margin-bottom: 20px; width: 100%; box-sizing: border-box; }
                .v4-nav-group { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 5px; box-sizing: border-box; } 
                
                .v4-month-display { display: flex; flex-direction: column; align-items: center; }
                .v4-month-text { text-transform: uppercase; font-weight: 950; color: #fff; font-size: 16px; letter-spacing: 1px; line-height: 1.2; }
                .v4-year-text { font-size: 10px; color: #555; font-weight: 800; letter-spacing: 2px; }
                
                .v4-nav-btn { background: #151515; border: 1px solid #222; color: #fff; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
                .v4-nav-btn:active { transform: scale(0.90); }
                
                .v4-week-header { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); text-align: center; margin-bottom: 12px; font-size: 8px; font-weight: 900; color: #555; gap: 4px; width: 100%; box-sizing: border-box; }
                .v4-days-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; width: 100%; box-sizing: border-box; }
                
                .v4-day-cell { 
                    aspect-ratio: 1/1.15; 
                    border-radius: 10px; 
                    background: rgba(17, 17, 17, 0.8); 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    cursor: pointer; 
                    border: 1px solid transparent; 
                    transition: 0.2s; 
                    padding: 2px 0;
                    box-sizing: border-box;
                    width: 100%;
                }
                .v4-day-cell:active { transform: scale(0.92); }
                
                .v4-day-number { font-size: 13px; font-weight: 800; color: #555; line-height: 1; }
                .v4-status-indicator { font-size: 9px; font-weight: 900; margin-top: 2px; color: #333; line-height: 1; }
                
                .v4-day-cell.is-selected { background: #fff !important; box-shadow: 0 0 15px rgba(255,255,255,0.2); border-color: #fff; }
                .v4-day-cell.is-selected .v4-day-number, .v4-day-cell.is-selected .v4-status-indicator { color: #000 !important; }
                
                .v4-day-cell.is-completed { background: rgba(139, 156, 129, 0.9); border-color: rgba(139, 156, 129, 0.5); }
                .v4-day-cell.is-completed .v4-day-number, .v4-day-cell.is-completed .v4-status-indicator { color: #050505 !important; }
                
                .v4-day-cell.is-missed { background: rgba(255, 62, 62, 0.05); border: 1px dashed rgba(255, 62, 62, 0.2); }
                .v4-day-cell.is-missed .v4-day-number { color: #ff3e3e70 !important; text-decoration: line-through; }

                .v4-cal-divider { height: 1px; background: rgba(255, 255, 255, 0.05); margin: 20px 0 16px 0; }
                .v4-pet-banner-btn {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(188, 255, 0, 0.05);
                    border: 1px solid rgba(188, 255, 0, 0.2);
                    padding: 12px 14px;
                    border-radius: 16px;
                    cursor: pointer;
                    transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-sizing: border-box;
                    overflow: hidden;
                }
                .v4-pet-banner-btn:hover {
                    background: rgba(188, 255, 0, 0.1);
                    border-color: rgba(188, 255, 0, 0.5);
                    transform: translateY(-2px);
                }
                .v4-pet-banner-btn:active { transform: scale(0.97); }
                
                .v4-pet-banner-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
                .v4-pet-emoji { font-size: 16px; flex-shrink: 0; }
                .v4-pet-banner-title { color: #bcff00; font-size: 9px; font-weight: 900; letter-spacing: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                
                .v4-pet-banner-right { display: flex; align-items: center; gap: 4px; color: #bcff00; font-size: 8px; font-weight: 800; letter-spacing: 1px; white-space: nowrap; flex-shrink: 0; }

                .v4-detail-card { 
                    background: rgba(17, 17, 17, 0.8); 
                    backdrop-filter: blur(10px); 
                    -webkit-backdrop-filter: blur(10px); 
                    border-radius: 28px; 
                    padding: 20px; 
                    border-left: 6px solid #333; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 16px; 
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2); 
                    width: 100%;
                    box-sizing: border-box;
                    overflow: hidden;
                }
                .v4-full-date { font-size: 10px; font-weight: 800; color: #555; text-transform: uppercase; }
                .v4-workout-name { font-size: 18px; font-weight: 900; color: #fff; margin: 0; }
                
                .v4-main-action { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding: 16px 20px; 
                    border-radius: 16px; 
                    border: none; 
                    font-weight: 900; 
                    font-size: 12px; 
                    cursor: pointer; 
                    transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
                    width: 100%;
                    box-sizing: border-box;
                }
                .v4-main-action:active { transform: scale(0.97); }
            `}</style>
        </div>
    );
};