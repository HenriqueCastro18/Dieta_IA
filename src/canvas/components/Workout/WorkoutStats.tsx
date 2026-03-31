import React from 'react';
import { motion } from 'framer-motion';

interface WorkoutStatsProps {
    user: any;
    onBack: () => void;
}

export const calculateUserStats = (user: any) => {
    const history = user?.workoutHistory || {};

    const completedDates = Object.keys(history)
        .filter(date => history[date] === 'completed')
        .sort();

    let totalXP = 0;
    let currentStreak = 0;

    const BASE_XP = 55500;
    const BONUS_PER_STREAK = 300; 
    const MAX_BONUS = 1500; 

    for (let i = 0; i < completedDates.length; i++) {
        if (i > 0) {

            const d1 = new Date(completedDates[i - 1] + 'T00:00:00').getTime();
            const d2 = new Date(completedDates[i] + 'T00:00:00').getTime();
            const diffInDays = Math.round((d2 - d1) / (1000 * 3600 * 24));

            if (diffInDays === 1) {

                currentStreak++;
            } else if (diffInDays > 2) {

                currentStreak = 0;
            }

        }

        const bonus = Math.min(currentStreak * BONUS_PER_STREAK, MAX_BONUS);
        totalXP += (BASE_XP + bonus);
    }

    const currentLevel = Math.floor(totalXP / 1000) + 1;
    const progressPercent = (totalXP % 1000) / 10;

    return { totalXP, currentLevel, progressPercent, currentStreak };
};

const PET_REWARDS = [
    { level: 10, name: 'Pato', img: '/screenshots/assets/pets/ducky_2_spritesheet.png', width: 32, height: 32, bgPos: '0px -32px', bgSize: 'auto', scale: 2.0 },
    { level: 20, name: 'Gato', img: '/screenshots/assets/pets/WALK.png', width: 32, height: 32, bgPos: '0px 0px', bgSize: 'auto 32px', scale: 3.2 },
    { level: 30, name: 'Corvo', img: '/screenshots/assets/pets/Crow.png', width: 32, height: 32, bgPos: '0px 0px', bgSize: '128px 128px', scale: 3.0 },
];

export const WorkoutStats = ({ user, onBack }: WorkoutStatsProps) => {
    const { totalXP, currentLevel, progressPercent, currentStreak } = calculateUserStats(user);
    const activeAccent = localStorage.getItem('v8-accent') || '#00f2fe';

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="v4-content">
            <div className="v4-section-header">
                <h2 className="v4-title-sm">PROGRESSÃO E RECOMPENSAS</h2>
                <div className="v4-divider"></div>
            </div>

            <div className="v4-rank-hero" style={{ borderColor: `${activeAccent}40` }}>
                <div className="v4-rank-circle" style={{ borderColor: activeAccent, color: activeAccent }}>
                    <span className="v4-lvl-tag">LVL</span>{currentLevel}
                </div>
                <div className="v4-rank-info">
                    <div className="v4-hero-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: 'clamp(10px, 3vw, 12px)' }}>
                        STATUS DO SISTEMA // {totalXP.toLocaleString()} XP
                        
                        {currentStreak > 0 && (
                            <span style={{ 
                                color: '#ffaa00', 
                                background: 'rgba(255, 170, 0, 0.1)', 
                                padding: '2px 6px', 
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                🔥 {currentStreak} COMBO
                            </span>
                        )}
                    </div>
                    
                    <h1 className="v4-hero-title" style={{ color: activeAccent }}>
                        {currentLevel >= 30 ? 'Mestre do Santuário' : 'Operador Core'}
                    </h1>
                    <div className="v4-xp-container">
                        <div className="v4-xp-bar-bg">
                            <div className="v4-xp-bar-fill" style={{ width: `${progressPercent}%`, backgroundColor: activeAccent }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="v4-rewards-section">
                <div className="v4-pet-header" style={{ marginBottom: '15px' }}>
                    <h3 className="v4-affinity-title">COLEÇÃO DE PETS</h3>
                </div>
                
                <div className="v4-rewards-grid">
                    {PET_REWARDS.map((pet, index) => {
                        const isUnlocked = currentLevel >= pet.level;
                        
                        return (
                            <div key={index} className={`v4-reward-card ${isUnlocked ? 'unlocked' : 'locked'}`} style={{ borderColor: isUnlocked ? activeAccent : '#1a1a1a' }}>
                                <div className="v4-reward-img-container">
                                    {isUnlocked ? (
                                        <div className="v4-pet-thumbnail" style={{ backgroundImage: `url(${pet.img})`, width: `${pet.width}px`, height: `${pet.height}px`, backgroundPosition: pet.bgPos, backgroundSize: pet.bgSize, transform: `scale(${pet.scale})` }} />
                                    ) : (
                                        <div className="v4-lock-icon">🔒</div>
                                    )}
                                </div>
                                <div className="v4-reward-info">
                                    <div className="v4-reward-name" style={{ color: isUnlocked ? '#fff' : '#555' }}>
                                        {isUnlocked ? pet.name : '???'}
                                    </div>
                                    <div className="v4-reward-lvl" style={{ color: isUnlocked ? activeAccent : '#444' }}>
                                        {isUnlocked ? 'DESBLOQUEADO' : `NV. ${pet.level}`}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <button className="v4-back-link" onClick={onBack} style={{ marginTop: '30px' }}>
                <span className="v4-back-text">VOLTAR</span>
            </button>

            <style>{`
                .v4-rank-hero { display: flex; align-items: center; gap: clamp(10px, 4vw, 20px); background: #080808; border: 1px solid #1a1a1a; padding: clamp(15px, 5vw, 25px); border-radius: 28px; margin-bottom: 30px; }
                .v4-rank-info { flex: 1; min-width: 0; }
                .v4-rank-circle { width: clamp(50px, 15vw, 65px); height: clamp(50px, 15vw, 65px); border-radius: 50%; border: 3px solid; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: clamp(18px, 5vw, 24px); font-weight: 900; background: #000; flex-shrink: 0; }
                .v4-lvl-tag { font-size: clamp(8px, 2.5vw, 10px); color: #666; }
                .v4-hero-title { font-size: clamp(14px, 5vw, 18px); font-weight: 900; margin: 5px 0; text-transform: uppercase; word-wrap: break-word; line-height: 1.2; }
                .v4-xp-bar-bg { width: 100%; height: 6px; background: #111; border-radius: 10px; overflow: hidden; margin-top: 10px; border: 1px solid #222; }
                .v4-xp-bar-fill { height: 100%; transition: width 1s ease; }
                .v4-rewards-section { background: #050505; border: 1px solid #161616; padding: 25px; border-radius: 28px; }
                .v4-rewards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 15px; }
                .v4-reward-card { background: #0a0a0a; border: 1px solid; border-radius: 16px; padding: 20px 10px; display: flex; flex-direction: column; align-items: center; text-align: center; transition: all 0.3s ease; }
                .v4-reward-card.locked { background: #030303; opacity: 0.7; }
                .v4-reward-card.unlocked { background: #0c0c0c; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); }
                .v4-reward-img-container { height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
                .v4-pet-thumbnail { background-repeat: no-repeat; image-rendering: pixelated; transform-origin: center center; }
                .v4-lock-icon { font-size: 24px; filter: grayscale(100%) opacity(0.5); }
                .v4-reward-name { font-size: 14px; font-weight: 800; margin-bottom: 4px; text-transform: uppercase; }
                .v4-reward-lvl { font-size: 10px; font-weight: 900; letter-spacing: 1px; }
                .v4-back-link { background: none; border: none; color: #444; cursor: pointer; font-weight: 800; font-size: 10px; }
            `}</style>
        </motion.div>
    );
};