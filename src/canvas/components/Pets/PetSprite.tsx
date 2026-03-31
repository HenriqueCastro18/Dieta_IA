import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export type SpriteType = 'house' | 'tree' | 'tree2' | 'stone' | 'pet' | 'walking_cat' | 'crow';

const assetMap: Record<string, string> = {
    house: '/screenshots/assets/environment/rumah.png',
    tree: '/screenshots/assets/environment/tree 64x64.png',
    tree2: '/screenshots/assets/environment/tree 2 64x64.png',
    stone: '/screenshots/assets/environment/stone 2 32x32.png',
    pet: '/screenshots/assets/pets/ducky_2_spritesheet.png',
    walking_cat: '/screenshots/assets/pets/WALK.png', 
    crow: '/screenshots/assets/pets/Crow.png',
};

export const PetSprite = ({ type, x, y, isAnimated = false }: { type: SpriteType; x: number; y: number; isAnimated?: boolean }) => {
    const [pos, setPos] = useState({ x, y });
    const [direction, setDirection] = useState('down');
    const prevPos = useRef({ x, y });

    const isAnimal = type === 'pet' || type === 'walking_cat' || type === 'crow';

    useEffect(() => {
        if (!isAnimated || !isAnimal) return;
        const moveInterval = setInterval(() => {
            const newX = Math.max(10, Math.min(90, pos.x + (Math.random() - 0.5) * 20));
            const newY = Math.max(20, Math.min(80, pos.y + (Math.random() - 0.5) * 20));
            setPos({ x: newX, y: newY });
        }, 4000);
        return () => clearInterval(moveInterval);
    }, [isAnimated, isAnimal, type]);

    useEffect(() => {
        const dx = pos.x - prevPos.current.x;
        const dy = pos.y - prevPos.current.y;
        
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            if (isAnimal) {
                if (Math.abs(dx) > Math.abs(dy)) setDirection(dx > 0 ? 'right' : 'left');
                else setDirection(dy > 0 ? 'down' : 'up');
            }
            prevPos.current = { x: pos.x, y: pos.y };
        } 
    }, [pos, isAnimal]);

    const renderSprite = () => {
        if (type === 'pet') {
            const config: any = { down: { r: 0, f: 2 }, left: { r: 1, f: 6 }, right: { r: 2, f: 4 }, up: { r: 3, f: 6 } };
            const curr = config[direction];
            return (
                <div style={{
                    width: '32px', height: '32px', backgroundImage: `url(${assetMap.pet})`,
                    backgroundPosition: `0px -${curr.r * 32}px`, imageRendering: 'pixelated', transform: 'scale(2)',
                    animation: `pato-walk-${direction} 0.8s steps(${curr.f}) infinite`
                }}>
                    <style>{`@keyframes pato-walk-${direction} { to { background-position-x: -${curr.f * 32}px; } }`}</style>
                </div>
            );
        }

        if (type === 'walking_cat') {
            const frameWidth = 32; 
            const framesCount = 12;
            const totalWidth = frameWidth * framesCount;
            
            let transform = 'scale(3)';
            let isMoving = true;

            if (direction === 'left') {
                transform = 'scale(3) scaleX(-1)';
            } else if (direction === 'up' || direction === 'down') {
                isMoving = false;
            }

            return (
                <div style={{
                    width: `${frameWidth}px`, height: `${frameWidth}px`,
                    backgroundImage: `url(${assetMap.walking_cat})`,
                    backgroundPosition: '0px 0px',
                    backgroundSize: `${totalWidth}px ${frameWidth}px`, 
                    backgroundRepeat: 'no-repeat',
                    imageRendering: 'pixelated', 
                    transform: transform,
                    transformOrigin: 'center',
                    animation: isMoving ? `cat-walk 0.8s steps(${framesCount}) infinite` : 'none',
                    pointerEvents: 'none',
                }}>
                    <style>{`
                        @keyframes cat-walk { 
                            from { background-position-x: 0px; }
                            to { background-position-x: -${totalWidth}px; } 
                        }
                    `}</style>
                </div>
            );
        }

        if (type === 'crow') {
            const frameSize = 32; 
            const totalWidth = frameSize * 4;
            const totalHeight = frameSize * 4;

            let transform = 'scale(3)'; 
            
            if (direction === 'left') {
                transform = 'scale(3) scaleX(-1)';
            }

            return (
                <div style={{
                    width: `${frameSize}px`, 
                    height: `${frameSize}px`,
                    backgroundImage: `url(${assetMap.crow})`,
                    backgroundSize: `${totalWidth}px ${totalHeight}px`,
                    backgroundPosition: '0px 0px', 
                    backgroundRepeat: 'no-repeat',
                    imageRendering: 'pixelated', 
                    transform: transform, 
                    transformOrigin: 'center center',

                    animation: 'crow-anim 0.6s steps(4) infinite',
                    pointerEvents: 'none',
                }}>
                    <style>{`
                        @keyframes crow-anim { 
                            from { background-position-x: 0px; }
                            to { background-position-x: -${totalWidth}px; } 
                        }
                    `}</style>
                </div>
            );
        }

        return <img src={assetMap[type]} alt={type} style={{ width: type === 'house' ? '150px' : '84px', imageRendering: 'pixelated' }} />;
    };

    return (
        <motion.div
            animate={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            transition={{ duration: isAnimated ? 3 : 0, ease: "linear" }}
            style={{ position: 'absolute', zIndex: Math.floor(pos.y), transform: 'translate(-50%, -100%)', pointerEvents: 'none' }}
        >
            {renderSprite()}
        </motion.div>
    );
};