import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Exercise, UserData } from '../../../services/groq';
import { WorkoutAnalysisService } from '../../../services/workoutAnalysis';

interface WorkoutEditorProps {
    exercise: Exercise;
    user: UserData;
    onReplace: (newExercise: Exercise) => void;
    onClose: () => void;
}

const SubstituteCard = ({ sub, onReplace }: { sub: Exercise, onReplace: (ex: Exercise) => void }) => {
    const [sets, setSets] = useState(Number(sub.sets) || 3);
    
    const initialReps = parseInt(sub.reps.toString().split('-')[0]) || 10;
    const [reps, setReps] = useState(initialReps);

    const handleConfirm = (e: React.MouseEvent) => {
        e.stopPropagation();
        onReplace({
            ...sub,
            sets: sets,
            reps: reps.toString()
        });
    };

    return (
        <motion.div 
            className="v4-sub-card"
            whileHover={{ x: -5, borderColor: '#00f2fe' }}
            onClick={handleConfirm}
        >
            <div className="v4-sub-header">
                <span className="v4-match-badge">RESERVA V4</span>
                
                {}
                <div className="v4-volume-controls" onClick={(e) => e.stopPropagation()}>
                    <div className="v4-control-group">
                        <button onClick={() => setSets(Math.max(1, sets - 1))}>-</button>
                        <span className="v4-val">{sets}<span>S</span></span>
                        <button onClick={() => setSets(sets + 1)}>+</button>
                    </div>
                    <div className="v4-divider"></div>
                    <div className="v4-control-group">
                        <button onClick={() => setReps(Math.max(1, reps - 1))}>-</button>
                        <span className="v4-val">{reps}<span>R</span></span>
                        <button onClick={() => setReps(reps + 1)}>+</button>
                    </div>
                </div>
            </div>

            <h3 className="v4-sub-title">{sub.name}</h3>
            <p className="v4-sub-desc">{sub.analysis}</p>
            
            <div className="v4-apply-footer">
                <span className="v4-apply-text">CONFIRMAR SUBSTITUIÇÃO</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </div>
        </motion.div>
    );
};

export const WorkoutEditor = ({ exercise, user, onReplace, onClose }: WorkoutEditorProps) => {
    const [substitutePool, setSubstitutePool] = useState<Record<string, Exercise[]>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPool = async () => {
            setLoading(true);
            try {
                const data = await WorkoutAnalysisService.getSubstitutes(exercise, user);
                setSubstitutePool(data);
            } catch (error) {
                console.error("Falha na geração da reserva biomecânica:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPool();
    }, [exercise, user]);

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
                        <span className="v4-meta-tag">BIOMECHANICAL POOL // V4.0</span>
                        <button className="v4-close-btn" onClick={onClose}>✕</button>
                    </div>

                    <h2 className="v4-editor-title">Reserva de <span>Exercícios</span></h2>
                    
                    <div className="v4-original-preview">
                        <div className="v4-preview-label">SUBSTITUINDO ATUAL:</div>
                        <div className="v4-preview-box">
                            <span className="v4-preview-name">{exercise.name}</span>
                            <span className="v4-preview-group">{exercise.group}</span>
                        </div>
                    </div>
                </div>

                <div className="v4-editor-body">
                    {loading ? (
                        <div className="v4-loading-state">
                            <div className="v4-shimmer-progress"></div>
                            <p className="v4-loading-txt">MAPEANDO SUBGRUPOS ANATÔMICOS...</p>
                        </div>
                    ) : (
                        <div className="v4-scroll-area">
                            {Object.entries(substitutePool).map(([category, items], idx) => (
                                <div key={category} className="v4-category-group">
                                    <h4 className="v4-category-title">
                                        <span className="v4-category-dot"></span>
                                        {category.toUpperCase()}
                                    </h4>
                                    
                                    {items.map((sub, i) => (
                                        <SubstituteCard 
                                            key={`${idx}-${i}`} 
                                            sub={sub} 
                                            onReplace={onReplace} 
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="v4-editor-footer">
                    <div className="v4-footer-id">STATUS: READY_TO_DEPLOY // {user.level}</div>
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
                .v4-preview-box { background: #0a0a0a; border: 1px solid #151515; padding: 12px 18px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
                .v4-preview-name { font-size: 13px; font-weight: 800; color: #555; text-decoration: line-through; }
                .v4-preview-group { font-size: 9px; font-weight: 900; color: #00f2fe; }

                .v4-editor-body { flex: 1; padding: 25px 30px; overflow-y: auto; }
                
                .v4-volume-controls { 
                    display: flex; align-items: center; 
                    background: #111; border-radius: 10px; 
                    padding: 4px 8px; gap: 8px; border: 1px solid #1a1a1a;
                }
                .v4-control-group { display: flex; align-items: center; gap: 8px; }
                .v4-control-group button { 
                    background: #1a1a1a; border: none; color: #00f2fe; 
                    width: 22px; height: 22px; border-radius: 6px; 
                    font-weight: 900; cursor: pointer; transition: 0.2s;
                }
                .v4-control-group button:hover { background: #00f2fe; color: #000; }
                .v4-val { font-family: 'JetBrains Mono'; font-size: 12px; color: #fff; font-weight: 800; min-width: 28px; text-align: center; }
                .v4-val span { font-size: 8px; color: #444; margin-left: 2px; }
                .v4-divider { width: 1px; height: 12px; background: #222; }

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
                .v4-sub-card:hover { background: #0c0c0c; }

                .v4-sub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .v4-match-badge { font-size: 8px; font-weight: 900; color: #00f2fe; }

                .v4-sub-title { font-size: 17px; font-weight: 800; color: #efefef; margin: 0 0 8px 0; }
                .v4-sub-desc { font-size: 11px; color: #666; line-height: 1.5; margin-bottom: 15px; }

                .v4-apply-footer { display: flex; justify-content: space-between; align-items: center; color: #222; transition: 0.3s; }
                .v4-sub-card:hover .v4-apply-footer { color: #00f2fe; }
                .v4-apply-text { font-size: 9px; font-weight: 900; letter-spacing: 1px; }

                .v4-loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60%; gap: 15px; }
                .v4-shimmer-progress { height: 2px; width: 100px; background: linear-gradient(90deg, transparent, #00f2fe, transparent); background-size: 200% 100%; animation: shimmer 1s infinite; }
                .v4-loading-txt { font-family: 'JetBrains Mono'; font-size: 9px; color: #00f2fe; }

                .v4-editor-footer { padding: 20px 30px; border-top: 1px solid #111; }
                .v4-footer-id { font-family: 'JetBrains Mono'; font-size: 8px; color: #222; }

                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                .v4-editor-body::-webkit-scrollbar { width: 4px; }
                .v4-editor-body::-webkit-scrollbar-thumb { background: #1a1a1a; }
            `}</style>
        </div>
    );
};