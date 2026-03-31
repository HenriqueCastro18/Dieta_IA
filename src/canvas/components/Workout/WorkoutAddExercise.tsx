import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Exercise, UserData } from '../../../services/groq';
import { WorkoutAnalysisService } from '../../../services/workoutAnalysis';

interface WorkoutAddExerciseProps {
    currentWorkoutType: string;
    currentExercises: Exercise[];
    user: UserData;
    onAdd: (newExercise: Exercise) => void;
    onClose: () => void;
}

export const WorkoutAddExercise = ({
    currentWorkoutType,
    currentExercises,
    user,
    onAdd,
    onClose
}: WorkoutAddExerciseProps) => {

    const [availableExercises, setAvailableExercises] = useState<Record<string, Exercise[]>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAvailable = async () => {
            setLoading(true);
            try {
                const activeGroups = Array.from(new Set(
                    currentExercises
                        .map(ex => ex.group?.toUpperCase().trim())
                        .filter(Boolean)
                ));

                let workoutFocus = "";
                if (activeGroups.length > 0) {
                    workoutFocus = `Este treino ${currentWorkoutType} foca em: ${activeGroups.join(' e ')}. Sugira exercícios compatíveis com estes grupos.`;
                } else {
                    const splitMap: Record<string, string> = {
                        'A': 'PEITO e TRÍCEPS', 'B': 'COSTAS e BÍCEPS', 'C': 'PERNAS e OMBROS'
                    };
                    workoutFocus = `Treino ${currentWorkoutType} focado em ${splitMap[currentWorkoutType.toUpperCase()] || 'TREINO EQUILIBRADO'}.`;
                }

                const dummyExercise: Exercise = {
                    name: `Expansão ${currentWorkoutType}`,
                    group: activeGroups.join('/') || currentWorkoutType,
                    sets: "4",
                    reps: "10-12",
                    rest: "60s",
                    notes: "", 
                    analysis: `${workoutFocus} Gere opções variadas para o nível ${user.level}.`,
                };

                const pool = await WorkoutAnalysisService.getSubstitutes(dummyExercise, user);

                const filteredPool: Record<string, Exercise[]> = {};

                Object.entries(pool).forEach(([category, exercises]) => {
                    const filtered = exercises.filter(ex => {
                        if (!ex.name) return false;
                        const exNameLower = ex.name.toLowerCase().trim();
                        const exGroupLower = (ex.group || "").toLowerCase();

                        const alreadyExists = currentExercises.some(curr =>
                            curr.name.toLowerCase().trim() === exNameLower
                        );

                        const searchTerms = activeGroups.flatMap(g => {
                            const base = g.toLowerCase();
                            if (base.includes('bicep')) return ['bicep', 'bícep', 'braço', 'pull'];
                            if (base.includes('tricep')) return ['tricep', 'trícep', 'braço', 'push'];
                            return [base];
                        });

                        const isRelevant = activeGroups.length === 0 || searchTerms.some(term =>
                            exGroupLower.includes(term) ||
                            exNameLower.includes(term) ||
                            category.toLowerCase().includes(term)
                        );

                        return !alreadyExists && isRelevant;
                    });

                    if (filtered.length > 0) {
                        filteredPool[category] = filtered.slice(0, 6);
                    }
                });

                setAvailableExercises(filteredPool);
            } catch (error) {
                console.error("Erro ao buscar exercícios:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAvailable();
    }, [currentWorkoutType, currentExercises, user]);

    const handleAddExercise = (exercise: Exercise) => {
        onAdd(exercise);
        onClose();
    };

    return (
        <div className="v4-editor-root">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="v4-editor-backdrop"
                onClick={onClose}
            />

            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="v4-editor-sheet"
            >
                <div className="v4-editor-header">
                    <div className="v4-system-meta">
                        <span className="v4-meta-tag">ADICIONAR EXERCÍCIO</span>
                        <button className="v4-close-btn" onClick={onClose}>✕</button>
                    </div>

                    <h2 className="v4-editor-title">
                        Adicionar ao Treino <span>{currentWorkoutType}</span>
                    </h2>

                    <div className="v4-original-preview">
                        <div className="v4-preview-label">ADICIONANDO EM:</div>
                        <div className="v4-preview-box">
                            <span className="v4-preview-name">PROTOCOLO {currentWorkoutType}</span>
                        </div>
                    </div>
                </div>

                <div className="v4-editor-body">
                    {loading ? (
                        <div className="v4-loading-state">
                            <div className="v4-shimmer-progress"></div>
                            <p className="v4-loading-txt">
                                BUSCANDO EXERCÍCIOS PARA TREINO {currentWorkoutType}...
                            </p>
                        </div>
                    ) : Object.keys(availableExercises).length === 0 ? (
                        <div className="v4-empty-state">
                            <p>Nenhum exercício novo compatível encontrado para o treino {currentWorkoutType}.</p>
                            <p style={{ fontSize: '11px', marginTop: '12px', color: '#555' }}>
                                O treino já pode estar bem completo.
                            </p>
                        </div>
                    ) : (
                        <div className="v4-scroll-area">
                            {Object.entries(availableExercises).map(([category, items]) => (
                                <div key={category} className="v4-category-group">
                                    <h4 className="v4-category-title">
                                        <span className="v4-category-dot"></span>
                                        {category.toUpperCase()}
                                    </h4>

                                    {items.map((ex, i) => (
                                        <motion.div
                                            key={`${category}-${i}`}
                                            className="v4-sub-card"
                                            whileHover={{ x: -5, borderColor: '#00f2fe' }}
                                            onClick={() => handleAddExercise(ex)}
                                        >
                                            <div className="v4-sub-header">
                                                <span className="v4-match-badge">
                                                    COMPATÍVEL COM {currentWorkoutType}
                                                </span>
                                            </div>

                                            <h3 className="v4-sub-title">{ex.name}</h3>
                                            <p className="v4-sub-desc">{ex.analysis || ex.group || 'Exercício de força'}</p>

                                            <div className="v4-apply-footer">
                                                <span className="v4-apply-text">ADICIONAR AO TREINO</span>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M12 5v14M5 12h14" />
                                                </svg>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="v4-editor-footer">
                    <div className="v4-footer-id">STATUS: READY_TO_ADD {currentWorkoutType}</div>
                </div>
            </motion.div>

            <style>{`
                .v4-editor-root { position: fixed; inset: 0; z-index: 10000; display: flex; justify-content: flex-end; }
                .v4-editor-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); }
                .v4-editor-sheet { 
                    position: relative; width: 100%; max-width: 440px; height: 100%; 
                    background: #050505; border-left: 1px solid #1a1a1a; 
                    display: flex; flex-direction: column;
                }

                .v4-editor-header { padding: 40px 30px 20px; border-bottom: 1px solid #111; }
                .v4-system-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .v4-meta-tag { font-family: 'JetBrains Mono'; font-size: 10px; color: #444; letter-spacing: 2px; }
                .v4-close-btn { background: none; border: 1px solid #222; color: #666; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; }
                
                .v4-editor-title { font-size: 28px; font-weight: 900; color: #fff; margin: 0; letter-spacing: -1px; }
                .v4-editor-title span { color: #00f2fe; }

                .v4-original-preview { margin-top: 25px; }
                .v4-preview-label { font-size: 8px; font-weight: 900; color: #333; margin-bottom: 8px; }
                .v4-preview-box { background: #0a0a0a; border: 1px solid #151515; padding: 12px 18px; border-radius: 12px; }
                .v4-preview-name { font-size: 13px; font-weight: 800; color: #00f2fe; }

                .v4-editor-body { flex: 1; padding: 25px 30px; overflow-y: auto; }

                .v4-category-group { margin-bottom: 35px; }
                .v4-category-title { 
                    display: flex; align-items: center; gap: 10px;
                    font-size: 11px; font-weight: 900; color: #444; 
                    margin-bottom: 20px; letter-spacing: 1px;
                }
                .v4-category-dot { width: 6px; height: 6px; background: #00f2fe; border-radius: 50%; box-shadow: 0 0 10px #00f2fe; }

                .v4-sub-card { 
                    background: #080808; border: 1px solid #161616; padding: 20px; border-radius: 20px; 
                    margin-bottom: 15px; cursor: pointer; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .v4-sub-card:hover { background: #0c0c0c; border-color: #00f2fe; }

                .v4-sub-header { margin-bottom: 12px; }
                .v4-match-badge { font-size: 8px; font-weight: 900; color: #00f2fe; }

                .v4-sub-title { font-size: 17px; font-weight: 800; color: #efefef; margin: 0 0 8px 0; }
                .v4-sub-desc { font-size: 11px; color: #666; line-height: 1.5; margin-bottom: 15px; }

                .v4-apply-footer { 
                    display: flex; justify-content: space-between; align-items: center; 
                    color: #222; transition: 0.3s; 
                }
                .v4-sub-card:hover .v4-apply-footer { color: #00f2fe; }
                .v4-apply-text { font-size: 9px; font-weight: 900; letter-spacing: 1px; }

                .v4-loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60%; gap: 15px; }
                .v4-shimmer-progress { height: 2px; width: 100px; background: linear-gradient(90deg, transparent, #00f2fe, transparent); background-size: 200% 100%; animation: shimmer 1s infinite; }
                .v4-loading-txt { font-family: 'JetBrains Mono'; font-size: 9px; color: #00f2fe; }

                .v4-editor-footer { padding: 20px 30px; border-top: 1px solid #111; }
                .v4-footer-id { font-family: 'JetBrains Mono'; font-size: 8px; color: #222; }

                .v4-empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                }

                @keyframes shimmer { 
                    0% { background-position: -200% 0; } 
                    100% { background-position: 200% 0; } 
                }

                .v4-editor-body::-webkit-scrollbar { width: 4px; }
                .v4-editor-body::-webkit-scrollbar-thumb { background: #1a1a1a; }
            `}</style>
        </div>
    );
};