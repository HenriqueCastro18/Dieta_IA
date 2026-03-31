import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DBService } from '../../../services/db';
import { GroqService, WeeklyPlan, Exercise, WorkoutSplit } from '../../../services/groq';
import { format } from 'date-fns';
import { UserSetupForm } from './UserSetupForm';
import { WorkoutCalendar } from './WorkoutCalendar';
import { WorkoutEditor } from './WorkoutEditor';
import { WorkoutAddExercise } from './WorkoutAddExercise';
import { WorkoutStats } from './WorkoutStats';
import { PetSanctuary } from '../Pets/PetSanctuary'; 

const RestTimer = ({ seconds, onFinished }: { seconds: number, onFinished: () => void }) => {
    const [timeLeft, setLeft] = useState(seconds);

    useEffect(() => {
        if (timeLeft <= 0) {
            onFinished();
            return;
        }
        const timer = setInterval(() => setLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, onFinished]);

    return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="v4-timer-overlay">
            <div className="v4-timer-circle">
                <span className="v4-timer-val">{timeLeft}s</span>
                <span className="v4-timer-lab">REPOSIÇÃO</span>
            </div>
            <button className="v4-skip-timer" onClick={onFinished}>PULAR DESCANSO</button>
        </motion.div>
    );
};

export const WorkoutPanel = ({ user: initialUser }: any) => {
    const [user, setUser] = useState<any>(initialUser);
    const [workouts, setWorkouts] = useState<WeeklyPlan | null>(null);

    const [view, setView] = useState<'CALENDAR' | 'EXECUTION' | 'STATS' | 'PETS'>('CALENDAR');
    
    const [selectedTab, setSelectedTab] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [loading, setLoading] = useState(false);
    const [completedEx, setCompletedEx] = useState<string[]>([]);
    const [showSetup, setShowSetup] = useState(false);

    const [seriesProgress, setSeriesProgress] = useState<Record<string, number>>({});
    const [activeRest, setActiveRest] = useState<{ id: string, time: number } | null>(null);

    const [inlineEditingSets, setInlineEditingSets] = useState<{ id: string, sets: string, reps: string, rest: string } | null>(null);
    const [editingExercise, setEditingExercise] = useState<{ ex: Exercise, index: number } | null>(null);
    const [showAddExercise, setShowAddExercise] = useState(false);

    const currentWorkout = (workouts && selectedTab) ? (workouts[selectedTab] as WorkoutSplit) : null;

    useEffect(() => {
        if (initialUser) {
            setUser(initialUser);
            fetchWorkout(initialUser.uid);
        }
    }, [initialUser]);

    useEffect(() => {
        if (!currentWorkout || !selectedTab || view !== 'EXECUTION') return;

        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        const isDayCompleted = user?.workoutHistory?.[dateKey] === 'completed';

        if (isDayCompleted) {
            const allExIds = currentWorkout.exercises.map((_: any, i: number) => `${selectedTab}-${i}`);
            setCompletedEx(allExIds);
            const fullProgress: Record<string, number> = {};
            currentWorkout.exercises.forEach((ex: any, i: number) => {
                fullProgress[`${selectedTab}-${i}`] = parseInt(ex.sets) || 3;
            });
            setSeriesProgress(fullProgress);
        } else {
            setCompletedEx([]);
            setSeriesProgress({});
        }
    }, [selectedDate, selectedTab, currentWorkout, user?.workoutHistory, view]);


    const fetchWorkout = async (uid: string) => {
        if (!uid) return;
        try {
            const data = await DBService.getUserWorkout(uid);
            if (data) setWorkouts(data as WeeklyPlan);
        } catch (error) {
            console.error("Erro ao buscar treino:", error);
        }
    };

    const generateWorkoutPlan = async (currentUser: any) => {
        setLoading(true);
        try {
            const data = await GroqService.generateWorkout(currentUser);
            if (data) {
                setWorkouts(data);
                await DBService.saveUserWorkout(currentUser.uid, data);
                setCompletedEx([]);
                setSeriesProgress({});
                setView('CALENDAR');
            }
        } catch (error) {
            console.error("Erro na geração estratégica:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReplaceExercise = async (newEx: Exercise) => {
        if (!selectedTab || !editingExercise || !workouts) return;
        const updatedWorkouts = JSON.parse(JSON.stringify(workouts));
        const currentSplit = updatedWorkouts[selectedTab] as WorkoutSplit;

        if (currentSplit && currentSplit.exercises) {
            currentSplit.exercises[editingExercise.index] = newEx;
            setWorkouts(updatedWorkouts);
            setEditingExercise(null);
            await DBService.saveUserWorkout(user.uid, updatedWorkouts);
        }
    };

    const handleAddNewExercise = async (newEx: Exercise) => {
        if (!workouts || !selectedTab) return;
        const updatedWorkouts = JSON.parse(JSON.stringify(workouts));
        const currentSplit = updatedWorkouts[selectedTab] as WorkoutSplit;

        if (currentSplit?.exercises) {
            currentSplit.exercises.push(newEx);
            setWorkouts(updatedWorkouts);
            await DBService.saveUserWorkout(user.uid, updatedWorkouts);
        }
        setShowAddExercise(false);
    };

    const handleSeriesDone = (exId: string, totalSets: number, restTime: string) => {
        const currentSeries = seriesProgress[exId] || 0;
        const nextSeries = currentSeries + 1;

        if (nextSeries < totalSets) {
            setSeriesProgress(prev => ({ ...prev, [exId]: nextSeries }));
            const matches = restTime.toString().match(/\d+/);
            const extractedSeconds = matches ? parseInt(matches[0]) : 60;
            setActiveRest({ id: exId, time: Math.min(extractedSeconds, 300) });
        } else {
            setSeriesProgress(prev => ({ ...prev, [exId]: totalSets }));
            setCompletedEx(prev => [...prev, exId]);
            setActiveRest(null);
        }
    };

    const handleSaveInlineEdit = async (index: number) => {
        if (!selectedTab || !inlineEditingSets || !workouts) return;
        const updatedWorkouts = JSON.parse(JSON.stringify(workouts));
        const currentSplit = updatedWorkouts[selectedTab] as WorkoutSplit;

        if (currentSplit && currentSplit.exercises) {
            currentSplit.exercises[index] = { ...currentSplit.exercises[index], ...inlineEditingSets };
            setWorkouts(updatedWorkouts);
            setInlineEditingSets(null);
            await DBService.saveUserWorkout(user.uid, updatedWorkouts);
        }
    };

    const handleFinishDailyWorkout = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const dateKey = format(selectedDate, 'yyyy-MM-dd');
            const updatedHistory = { ...(user.workoutHistory || {}), [dateKey]: 'completed' };
            const updatedUser = { ...user, workoutHistory: updatedHistory };
            setUser(updatedUser);
            await DBService.updateProfile(user.uid, { workoutHistory: updatedHistory });
            setView('CALENDAR');
        } catch (error) {
            console.error("Erro ao registrar conclusão:", error);
        } finally {
            setLoading(false);
        }
    };

    const isAllDone = (currentWorkout?.exercises?.length ?? 0) > 0 && completedEx.length === (currentWorkout?.exercises?.length ?? 0);

    return (
        <div className="elite-container">
            <header className="v4-system-header">
                <div className="v4-brand">
                    <div className="v4-logo-wrapper">
                        <span className="v4-logo-text">CORE</span>
                        <span className="v4-version">V4.0</span>
                    </div>
                    <div className="v4-status-line">
                        <div className={`v4-status-led ${loading ? 'is-syncing' : ''}`}></div>
                        <span className="v4-status-label">{loading ? 'PROCESSANDO...' : 'SISTEMA OPERACIONAL'}</span>
                    </div>
                </div>

                <div className="v4-header-actions">
                    <button className={`v4-config-trigger ${view === 'STATS' ? 'is-active' : ''}`} onClick={() => setView(view === 'STATS' ? 'CALENDAR' : 'STATS')} title="Estatísticas">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                    </button>
                    {view === 'EXECUTION' && selectedTab && selectedTab !== 'CARDIO' && currentWorkout && (
                        <button className="v4-add-exercise-btn" onClick={() => setShowAddExercise(true)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                    )}
                    <button className="v4-config-trigger" onClick={() => setShowSetup(true)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                    </button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {showSetup && (
                    <UserSetupForm initialData={user} onSave={async (newData: any) => {
                        const updatedUser = { ...user, ...newData };
                        setUser(updatedUser);
                        await DBService.updateProfile(user.uid, newData);
                        await generateWorkoutPlan(updatedUser);
                        setShowSetup(false);
                    }} />
                )}
                {editingExercise && <WorkoutEditor exercise={editingExercise.ex} user={user} onClose={() => setEditingExercise(null)} onReplace={handleReplaceExercise} />}
                {showAddExercise && currentWorkout && <WorkoutAddExercise currentWorkoutType={selectedTab!} currentExercises={currentWorkout.exercises || []} user={user} onAdd={handleAddNewExercise} onClose={() => setShowAddExercise(false)} />}
            </AnimatePresence>

            <main className="v4-main-content">
                {view === 'STATS' ? (
                    <WorkoutStats user={user} onBack={() => setView('CALENDAR')} />
                ) : view === 'PETS' ? ( 
                    <PetSanctuary user={user} onBack={() => setView('CALENDAR')} />
                ) : view === 'CALENDAR' ? (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="v4-content">
                        <div className="v4-section-header">
                            <h2 className="v4-title-sm">CRONOGRAMA DE PERFORMANCE</h2>
                            <div className="v4-divider"></div>
                        </div>
                        <WorkoutCalendar
                            workouts={workouts}
                            history={user?.workoutHistory || {}}
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                            userSettings={{
                                offDays: user?.offDays || [0, 6],
                                split: user?.splitType === 'PPL' ? ['PUSH', 'PULL', 'LEGS'] : (user?.splitType?.split('') || ['A', 'B', 'C'])
                            }}
                            onSelectDay={(tab: string) => {
                                setSelectedTab(tab);
                                setView('EXECUTION');
                            }}
                            onOpenSanctuary={() => setView('PETS')} 
                        />
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="v4-content">
                        <button className="v4-back-link" onClick={() => setView('CALENDAR')}>
                            <div className="v4-back-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></div>
                            <span className="v4-back-text">RETORNAR AO DASHBOARD</span>
                        </button>

                        <div className="v4-hero-card">
                            <div className="v4-hero-meta">DATA SELECIONADA: {format(selectedDate, 'dd/MM/yyyy')}</div>
                            <h1 className="v4-hero-title">{selectedTab === 'CARDIO' ? 'CARDIO VASCULAR' : `PROTOCOLO ${selectedTab}`}</h1>
                            <p className="v4-hero-desc">{currentWorkout?.title || 'Protocolo Livre'}</p>
                        </div>

                        <div className="v4-exercise-stack">
                            {currentWorkout?.exercises?.map((ex: any, i: number) => {
                                const exId = `${selectedTab}-${i}`;
                                const isDone = completedEx.includes(exId);
                                const currentSeries = seriesProgress[exId] || 0;
                                const isInlineEditing = inlineEditingSets?.id === exId;

                                return (
                                    <motion.div key={exId} layout className={`v4-card ${isDone ? 'is-complete' : ''} ${isInlineEditing ? 'is-editing' : ''}`}>
                                        <div className="v4-card-header">
                                            <span className="v4-tag">{ex.group}</span>
                                            <div className="v4-actions-row">
                                                <button className={`v4-inline-edit-btn ${isInlineEditing ? 'is-saving' : ''}`} onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isInlineEditing) handleSaveInlineEdit(i);
                                                    else setInlineEditingSets({ id: exId, sets: ex.sets, reps: ex.reps, rest: ex.rest });
                                                }}>
                                                    {isInlineEditing ? (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></svg>
                                                    ) : (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                                                    )}
                                                </button>
                                                {!isDone && (
                                                    <button className="v4-swap-btn" onClick={(e) => { e.stopPropagation(); setEditingExercise({ ex, index: i }); }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 1l4 4-4 4m6-4H11a4 4 0 00-4 4v5M7 23l-4-4 4-4M1 19h12a4 4 0 004-4V10" /></svg>
                                                    </button>
                                                )}
                                                <div className="v4-checkbox" onClick={() => { if (isDone) setCompletedEx(prev => prev.filter(x => x !== exId)); }}>{isDone && '✓'}</div>
                                            </div>
                                        </div>

                                        <h3 className="v4-ex-title">{ex.name}</h3>

                                        <div className="v4-series-container">
                                            <div className="v4-series-dots">
                                                {Array.from({ length: parseInt(ex.sets) || 3 }).map((_, idx) => (
                                                    <div key={idx} className={`v4-dot ${idx < currentSeries ? 'filled' : ''}`} />
                                                ))}
                                            </div>
                                            <span className="v4-series-label">SÉRIE {currentSeries}/{ex.sets}</span>
                                        </div>

                                        <div className="v4-metrics-grid">
                                            <div className="v4-metric">
                                                {isInlineEditing ? <input type="text" className="v4-metric-input" value={inlineEditingSets.sets} onClick={(e) => e.stopPropagation()} onChange={(e) => setInlineEditingSets({ ...inlineEditingSets, sets: e.target.value })} /> : <span className="v4-metric-val">{ex.sets}</span>}
                                                <span className="v4-metric-lab">SÉRIES</span>
                                            </div>
                                            <div className="v4-metric v4-accent">
                                                {isInlineEditing ? <input type="text" className="v4-metric-input" value={inlineEditingSets.reps} onClick={(e) => e.stopPropagation()} onChange={(e) => setInlineEditingSets({ ...inlineEditingSets, reps: e.target.value })} /> : <span className="v4-metric-val">{ex.reps}</span>}
                                                <span className="v4-metric-lab">REPS</span>
                                            </div>
                                            <div className="v4-metric">
                                                {isInlineEditing ? <input type="text" className="v4-metric-input" value={inlineEditingSets.rest} onClick={(e) => e.stopPropagation()} onChange={(e) => setInlineEditingSets({ ...inlineEditingSets, rest: e.target.value })} /> : <span className="v4-metric-val">{ex.rest}</span>}
                                                <span className="v4-metric-lab">DESC.</span>
                                            </div>
                                        </div>

                                        {!isDone && (
                                            isInlineEditing ? (
                                                <button className="v4-action-btn is-save-edit" onClick={() => handleSaveInlineEdit(i)}>SALVAR ALTERAÇÕES BIOMÉTRICAS</button>
                                            ) : (
                                                <button className="v4-action-btn" onClick={() => handleSeriesDone(exId, parseInt(ex.sets), ex.rest)}>
                                                    {currentSeries + 1 === parseInt(ex.sets) ? 'FINALIZAR EXERCÍCIO' : 'CONCLUIR SÉRIE'}
                                                </button>
                                            )
                                        )}

                                        <AnimatePresence>
                                            {activeRest?.id === exId && <RestTimer seconds={activeRest.time} onFinished={() => setActiveRest(null)} />}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <AnimatePresence>
                            {(isAllDone || user?.workoutHistory?.[format(selectedDate, 'yyyy-MM-dd')] === 'completed') && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="v4-finish-workout-card">
                                    <h3>SESSÃO FINALIZADA!</h3>
                                    <p>Você destruiu todas as fibras planejadas para hoje. Parabéns.</p>
                                    <button onClick={handleFinishDailyWorkout} disabled={loading} className="v4-finish-btn">
                                        {loading ? 'SALVANDO...' : 'REGISTRAR NO CALENDÁRIO'}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=JetBrains+Mono:wght@500;800&display=swap');
                
                .elite-container { max-width: 480px; margin: 0 auto; background: #000; min-height: 100vh; padding: 25px; color: #fff; font-family: 'Outfit', sans-serif; position: relative; }
                .v4-system-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
                .v4-header-actions { display: flex; gap: 10px; align-items: center; }
                .v4-add-exercise-btn, .v4-config-trigger { background: #111; border: 1px solid #222; color: #666; width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; cursor: pointer; transition: all 0.3s; }
                .v4-add-exercise-btn:hover { background: rgba(0, 242, 254, 0.18); border-color: #00f2fe; color: #00f2fe; transform: scale(1.08); }
                .v4-config-trigger.is-active, .v4-config-trigger:hover { background: rgba(0, 242, 254, 0.1); border-color: #00f2fe; color: #00f2fe; }

                .v4-finish-workout-card { background: rgba(188, 255, 0, 0.05); border: 1px solid #bcff00; border-radius: 20px; padding: 30px; text-align: center; margin-top: 30px; margin-bottom: 20px; box-shadow: 0 0 30px rgba(188, 255, 0, 0.1); }
                .v4-finish-workout-card h3 { color: #bcff00; font-size: 18px; margin-bottom: 10px; font-weight: 900; }
                .v4-finish-workout-card p { color: #aaa; font-size: 12px; margin-bottom: 20px; font-weight: 500; }
                .v4-finish-btn { background: #bcff00; color: #000; width: 100%; padding: 16px; font-weight: 900; border: none; border-radius: 14px; cursor: pointer; font-size: 14px; letter-spacing: 1px; transition: 0.2s; }
                .v4-finish-btn:hover { background: #d4ff55; transform: scale(1.02); }

                .v4-back-link { display: inline-flex; align-items: center; gap: 12px; background: transparent; border: none; color: #666; cursor: pointer; padding: 8px 0; margin-bottom: 25px; transition: 0.3s; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; position: relative; }
                .v4-back-icon { display: grid; place-items: center; width: 32px; height: 32px; background: #0a0a0a; border: 1px solid #222; border-radius: 8px; color: #444; transition: 0.3s; }
                .v4-back-text { font-size: 10px; font-weight: 800; letter-spacing: 2px; }
                .v4-back-link:hover { color: #00f2fe; }
                .v4-back-link:hover .v4-back-icon { border-color: #00f2fe; color: #00f2fe; background: rgba(0, 242, 254, 0.05); transform: translateX(-4px); box-shadow: 0 0 15px rgba(0, 242, 254, 0.1); }

                .v4-logo-text { font-weight: 900; font-size: 24px; letter-spacing: -1px; }
                .v4-version { font-family: 'JetBrains Mono'; font-size: 10px; color: #00f2fe; margin-left: 5px; background: rgba(0, 242, 254, 0.1); padding: 2px 6px; border-radius: 4px; }
                .v4-status-line { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
                .v4-status-led { width: 6px; height: 6px; border-radius: 50%; background: #00f2fe; box-shadow: 0 0 8px #00f2fe; }
                .v4-status-label { font-size: 9px; font-weight: 800; color: #444; letter-spacing: 1px; }

                .v4-hero-card { background: radial-gradient(circle at top left, #1a1a1a, #000); border: 1px solid #222; padding: 30px; border-radius: 28px; margin-bottom: 30px; }
                .v4-hero-meta { font-family: 'JetBrains Mono'; font-size: 10px; color: #00f2fe; letter-spacing: 3px; margin-bottom: 10px; }
                .v4-hero-title { font-size: 32px; font-weight: 900; margin: 0; letter-spacing: -1px; }
                .v4-hero-desc { font-size: 14px; color: #666; margin-top: 8px; font-weight: 500; }

                .v4-card { background: #080808; border: 1px solid #161616; border-radius: 24px; padding: 20px; margin-bottom: 16px; position: relative; overflow: hidden; transition: 0.3s; }
                .v4-card.is-complete { opacity: 0.15; transform: scale(0.96); filter: grayscale(1); pointer-events: none; }
                .v4-card.is-editing { border-color: #00f2fe; background: rgba(0, 242, 254, 0.02); }
                
                .v4-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .v4-actions-row { display: flex; align-items: center; gap: 12px; }
                .v4-inline-edit-btn, .v4-swap-btn { background: rgba(0, 242, 254, 0.05); border: 1px solid #222; color: #555; width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; cursor: pointer; transition: 0.3s; pointer-events: auto; }
                .v4-inline-edit-btn:hover, .v4-swap-btn:hover { border-color: #00f2fe; color: #00f2fe; background: rgba(0, 242, 254, 0.1); transform: translateY(-2px); }
                .v4-inline-edit-btn.is-saving { background: #00f2fe; color: #000; border-color: #00f2fe; }

                .v4-checkbox { width: 24px; height: 24px; border: 2px solid #222; border-radius: 8px; display: grid; place-items: center; font-weight: 900; font-size: 14px; cursor: pointer; pointer-events: auto; }
                .v4-ex-title { font-size: 20px; font-weight: 800; margin-bottom: 15px; color: #efefef; }

                .v4-series-container { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
                .v4-series-dots { display: flex; gap: 5px; }
                .v4-dot { width: 14px; height: 4px; background: #1a1a1a; border-radius: 2px; transition: 0.3s; }
                .v4-dot.filled { background: #00f2fe; box-shadow: 0 0 8px #00f2fe; }
                .v4-series-label { font-size: 9px; font-weight: 900; color: #444; letter-spacing: 1px; }

                .v4-metrics-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; background: #000; border: 1px solid #111; border-radius: 18px; padding: 15px; margin-bottom: 15px; }
                .v4-metric { display: flex; flex-direction: column; align-items: center; position: relative; }
                .v4-metric-input { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 800; color: #fff; background: #111; border: 1px solid #222; border-radius: 6px; width: 100%; max-width: 50px; text-align: center; padding: 4px; margin-top: -3px; }
                .v4-metric-val { font-family: 'JetBrains Mono'; font-size: 18px; font-weight: 800; }
                .v4-metric-lab { font-size: 8px; font-weight: 800; color: #444; }
                .v4-accent .v4-metric-val, .v4-accent .v4-metric-input { color: #00f2fe; }

                .v4-action-btn { width: 100%; padding: 14px; background: #111; border: 1px solid #00f2fe; color: #00f2fe; border-radius: 14px; font-weight: 900; font-size: 11px; cursor: pointer; letter-spacing: 1px; transition: 0.2s; pointer-events: auto; }
                .v4-action-btn:hover { background: #00f2fe; color: #000; }
                .v4-action-btn.is-save-edit { background: #00f2fe; color: #000; border-color: #fff; }

                .v4-timer-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.95); z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 24px; }
                .v4-timer-circle { width: 90px; height: 90px; border: 4px solid #00f2fe; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 15px; box-shadow: 0 0 20px rgba(0, 242, 254, 0.2); }
                .v4-timer-val { font-family: 'JetBrains Mono'; font-size: 28px; font-weight: 800; }
                .v4-timer-lab { font-size: 7px; color: #00f2fe; font-weight: 900; letter-spacing: 1px; }
                .v4-skip-timer { background: none; border: none; color: #444; font-size: 9px; font-weight: 800; cursor: pointer; }

                .v4-section-header { margin-bottom: 25px; display: flex; flex-direction: column; gap: 8px; }
                .v4-title-sm { font-size: 11px; font-weight: 900; color: #555; letter-spacing: 2px; margin: 0; }
                .v4-divider { height: 1px; width: 100%; background: linear-gradient(90deg, #222, transparent); }
            `}</style>
        </div>
    );
};