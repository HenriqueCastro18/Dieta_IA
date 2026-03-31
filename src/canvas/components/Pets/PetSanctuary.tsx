import React, { useMemo } from 'react';
import { PetSprite } from './PetSprite';
import { calculateUserStats } from '../Workout/WorkoutStats'; 

export const PetSanctuary: React.FC<{ user: any; onBack: () => void }> = ({ user, onBack }) => {

    const { totalXP, currentLevel } = calculateUserStats(user);

    const isPatoUnlocked = currentLevel >= 10;
    const isGatoUnlocked = currentLevel >= 20;
    const isCorvoUnlocked = currentLevel >= 30;

    const columns = 20; 
    const rows = 20;
    const tileSize = 40;

    const groundTiles = useMemo(() => {
        const tiles = [];
        const middleColumn = Math.floor(columns / 2);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                tiles.push({
                    img: (c === middleColumn) 
                        ? '/screenshots/assets/environment/Example.png' 
                        : '/screenshots/assets/environment/Grass 002.png'
                });
            }
        }
        return tiles;
    }, [columns, rows]);

    let unlockedNames = [];
    if (isPatoUnlocked) unlockedNames.push('PATO');
    if (isGatoUnlocked) unlockedNames.push('GATO');
    if (isCorvoUnlocked) unlockedNames.push('CORVO');

    const footerText = unlockedNames.length > 0 
        ? `${unlockedNames.join(', ')} CARREGADO(S) COM SUCESSO`
        : 'SANTUÁRIO VAZIO. COMPLETE TREINOS PARA DESBLOQUEAR PETS!';

    return (
        <div style={{ 
            background: '#050505', height: '100%', minHeight: '650px',
            display: 'flex', flexDirection: 'column', borderRadius: '32px',
            border: '1px solid #1a1a1a', overflow: 'hidden', fontFamily: "'Outfit', sans-serif"
        }}>
            <header style={{ 
                padding: '20px 30px', display: 'flex', justifyContent: 'space-between', 
                alignItems: 'center', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(10px)', zIndex: 100
            }}>
                <div>
                    <div style={{ color: '#555', fontSize: '10px', fontWeight: 900, letterSpacing: '2px' }}>SANCTUARY V8.2</div>
                    <div style={{ color: '#bcff00', fontSize: '26px', fontWeight: 900 }}>XP: {totalXP.toLocaleString()}</div>
                </div>
                <button onClick={onBack} style={{ background: '#bcff00', color: '#000', padding: '12px 30px', borderRadius: '16px', border: 'none', fontWeight: 900, cursor: 'pointer' }}>VOLTAR</button>
            </header>

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#3b7d4f', display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, ${tileSize}px)`, width: 'fit-content' }}>
                    {groundTiles.map((tile, i) => (
                        <div key={i} style={{ width: tileSize, height: tileSize, backgroundImage: `url('${tile.img}')`, backgroundSize: 'cover', imageRendering: 'pixelated' }} />
                    ))}
                </div>


                <PetSprite type="house" x={25} y={48} />
                

                <PetSprite type="tree" x={12} y={32} />  
                <PetSprite type="tree2" x={20} y={85} /> 

                <PetSprite type="tree" x={85} y={25} />  
                <PetSprite type="tree2" x={78} y={75} /> 

                {isPatoUnlocked && <PetSprite type="pet" x={50} y={60} isAnimated={true} />}
                {isGatoUnlocked && <PetSprite type="walking_cat" x={40} y={45} isAnimated={true} />}
                {isCorvoUnlocked && <PetSprite type="crow" x={65} y={65} isAnimated={true} />}
            </div>

            <footer style={{ padding: '15px 30px', background: '#080808', borderTop: '1px solid #151515', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                        width: '8px', height: '8px', 
                        background: unlockedNames.length > 0 ? '#bcff00' : '#ff3333', 
                        borderRadius: '50%', 
                        boxShadow: `0 0 10px ${unlockedNames.length > 0 ? '#bcff00' : '#ff3333'}` 
                    }}></div>
                    <span style={{ 
                        fontSize: '11px', fontWeight: 800, 
                        color: unlockedNames.length > 0 ? '#bcff00' : '#ff3333' 
                    }}>
                        {footerText}
                    </span>
                </div>
            </footer>
        </div>
    );
};