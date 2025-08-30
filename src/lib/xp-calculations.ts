// XP and Level calculation utilities for exponential progression system

export interface LevelProgress {
  level: number;
  xpInLevel: number;
  xpForNext: number;
  totalXPForCurrentLevel: number;
  progress: number; // 0 to 1
}

// Constants for level calculation
const DEFAULT_BASE_XP = 100;
const DEFAULT_GROWTH_FACTOR = 1.5;

/**
 * Calculate XP required to reach a specific level from level 1
 */
export function getXPRequiredForLevel(level: number, baseXP = DEFAULT_BASE_XP, growthFactor = DEFAULT_GROWTH_FACTOR): number {
  if (level <= 1) return 0;
  return Math.round(baseXP * Math.pow(growthFactor, level - 2));
}

/**
 * Calculate total XP needed to reach a specific level (cumulative)
 */
export function getTotalXPForLevel(level: number, baseXP = DEFAULT_BASE_XP, growthFactor = DEFAULT_GROWTH_FACTOR): number {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += getXPRequiredForLevel(i, baseXP, growthFactor);
  }
  return totalXP;
}

/**
 * Main function to calculate level and progress from total XP
 */
export function getLevelAndProgress(totalXP: number, baseXP = DEFAULT_BASE_XP, growthFactor = DEFAULT_GROWTH_FACTOR): LevelProgress {
  let level = 1;
  let remainingXP = totalXP;
  
  // Calculate current level by deducting required XP for each level
  while (remainingXP >= 0) {
    const xpForNext = getXPRequiredForLevel(level + 1, baseXP, growthFactor);
    if (remainingXP >= xpForNext) {
      remainingXP -= xpForNext;
      level++;
    } else {
      break;
    }
  }
  
  const xpForNext = getXPRequiredForLevel(level + 1, baseXP, growthFactor);
  const totalXPForCurrentLevel = getTotalXPForLevel(level, baseXP, growthFactor);
  const progress = xpForNext > 0 ? remainingXP / xpForNext : 0;
  
  return {
    level,
    xpInLevel: remainingXP,
    xpForNext,
    totalXPForCurrentLevel,
    progress: Math.min(progress, 1) // Cap at 1
  };
}

/**
 * Calculate progress percentage in current level (0-100)
 */
export function getLevelProgressPercentage(totalXP: number, baseXP = DEFAULT_BASE_XP, growthFactor = DEFAULT_GROWTH_FACTOR): number {
  const { progress } = getLevelAndProgress(totalXP, baseXP, growthFactor);
  return Math.round(progress * 100);
}

/**
 * Generate level ladder data for visualization
 */
export function generateLevelLadder(totalXP: number, showLevels = 8, baseXP = DEFAULT_BASE_XP, growthFactor = DEFAULT_GROWTH_FACTOR) {
  const { level: currentLevel } = getLevelAndProgress(totalXP, baseXP, growthFactor);
  const startLevel = Math.max(1, currentLevel - 2);
  const endLevel = Math.max(startLevel + showLevels - 1, currentLevel + 3);
  
  const ladder = [];
  
  for (let level = startLevel; level <= endLevel; level++) {
    const totalXPForLevel = getTotalXPForLevel(level, baseXP, growthFactor);
    const xpRequired = getXPRequiredForLevel(level, baseXP, growthFactor);
    const isCompleted = totalXP >= totalXPForLevel;
    const isCurrent = level === currentLevel;
    
    let progress = 0;
    if (level === currentLevel) {
      const { progress: currentProgress } = getLevelAndProgress(totalXP, baseXP, growthFactor);
      progress = currentProgress;
    } else if (isCompleted) {
      progress = 1;
    }
    
    ladder.push({
      level,
      totalXPRequired: totalXPForLevel,
      xpRequired,
      isCompleted,
      isCurrent,
      isLocked: !isCompleted && !isCurrent,
      progress
    });
  }
  
  return ladder;
}

/**
 * Format XP numbers for display
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  } else if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}

/**
 * Calculate XP rewards for different actions
 */
export interface XPRewards {
  lesson: number;
  correctAnswer: number;
  streakBonus: (streakDays: number) => number;
}

export function getXPRewards(): XPRewards {
  return {
    lesson: 10, // Default XP per lesson
    correctAnswer: 2, // Default XP per correct answer
    streakBonus: (streakDays: number) => 5 * streakDays // 5 XP × streak length
  };
}