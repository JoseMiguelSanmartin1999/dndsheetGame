import { Injectable } from '@nestjs/common';

@Injectable()
export class GameRulesService {
  getRaceSizeInfo(raceName: string) {
    const name = (raceName || '').toLowerCase().trim();
    if (name.includes('aasimar')) {
      return {
        hasChoice: true,
        sizes: [
          { name: 'Mediano', min: 1.2, max: 2.1, description: 'Mediano (entre 1,2 y 2,1 m de altura) o Pequeño (entre 60 cm y 1,2 m de altura)' },
          { name: 'Pequeño', min: 0.6, max: 1.2, description: 'Pequeño (entre 60 cm y 1,2 m de altura)' }
        ]
      };
    }
    if (name.includes('dracónido') || name.includes('draconido')) {
      return {
        hasChoice: false,
        sizes: [
          { name: 'Mediano', min: 1.5, max: 2.1, description: 'Mediano (entre 1,5 y 2,1 m de altura)' }
        ]
      };
    }
    if (name.includes('elfo')) {
      return {
        hasChoice: false,
        sizes: [
          { name: 'Mediano', min: 1.5, max: 1.8, description: 'Mediano (entre 1,5 y 1,8 m de altura)' }
        ]
      };
    }
    if (name.includes('enano')) {
      return {
        hasChoice: false,
        sizes: [
          { name: 'Mediano', min: 1.2, max: 1.5, description: 'Mediano (entre 1,2 y 1,5 m de altura)' }
        ]
      };
    }
    if (name.includes('gnomo')) {
      return {
        hasChoice: false,
        sizes: [
          { name: 'Pequeño', min: 0.9, max: 1.2, description: 'Pequeño (entre 90 cm y 1,2 m de altura)' }
        ]
      };
    }
    if (name.includes('goliat') || name.includes('goliath')) {
      return {
        hasChoice: false,
        sizes: [
          { name: 'Mediano', min: 2.1, max: 2.4, description: 'Mediano (entre 2,1 y 2,4 m de altura)' }
        ]
      };
    }
    if (name.includes('humano')) {
      return {
        hasChoice: true,
        sizes: [
          { name: 'Mediano', min: 1.2, max: 2.1, description: 'Mediano (entre 1,2 y 2,1 m de altura)' },
          { name: 'Pequeño', min: 0.6, max: 1.2, description: 'Pequeño (entre 60 cm y 1,2 m de altura)' }
        ]
      };
    }
    if (name.includes('mediano')) {
      return {
        hasChoice: false,
        sizes: [
          { name: 'Pequeño', min: 0.6, max: 0.9, description: 'Pequeño (entre 60 y 90 cm de altura)' }
        ]
      };
    }
    if (name.includes('orco')) {
      return {
        hasChoice: false,
        sizes: [
          { name: 'Mediano', min: 1.8, max: 2.1, description: 'Mediano (entre 1.8 y 2.1 m de altura)' }
        ]
      };
    }
    if (name.includes('tiflin') || name.includes('tiefling')) {
      return {
        hasChoice: true,
        sizes: [
          { name: 'Mediano', min: 1.2, max: 2.1, description: 'Mediano (entre 1,2 y 2,1 m de altura)' },
          { name: 'Pequeño', min: 0.9, max: 1.2, description: 'Pequeño (entre 90 cm y 1,2 m de altura)' }
        ]
      };
    }
    return {
      hasChoice: false,
      sizes: [
        { name: 'Mediano', min: 1.0, max: 2.0, description: 'Mediano (entre 1.0 y 2.0 m)' }
      ]
    };
  }

  calculateCarryingCapacity(strength: number, sizeClass: string, isGoliath: boolean) {
    let size = sizeClass || 'Mediano';
    if (isGoliath) {
      if (size === 'Mediano') size = 'Grande';
      else if (size === 'Pequeño') size = 'Mediano';
    }

    let factorMax = 7.5;
    let factorDrag = 15.0;

    const s = size.toLowerCase().trim();
    if (s === 'diminuto') {
      factorMax = 3.75;
      factorDrag = 7.5;
    } else if (s === 'pequeño' || s === 'mediano') {
      factorMax = 7.5;
      factorDrag = 15.0;
    } else if (s === 'grande') {
      factorMax = 15.0;
      factorDrag = 30.0;
    } else if (s === 'enorme') {
      factorMax = 30.0;
      factorDrag = 60.0;
    } else if (s === 'gargantuesco') {
      factorMax = 60.0;
      factorDrag = 120.0;
    }

    const maxKg = strength * factorMax;
    const maxLb = strength * factorMax * 2;
    const dragKg = strength * factorDrag;
    const dragLb = strength * factorDrag * 2;

    return { maxKg, maxLb, dragKg, dragLb };
  }

  rollSingleStat() {
    const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    let lowestVal = 7;
    let lowestIdx = -1;
    for (let i = 0; i < 4; i++) {
      if (dice[i] < lowestVal) {
        lowestVal = dice[i];
        lowestIdx = i;
      }
    }
    let sum = 0;
    for (let i = 0; i < 4; i++) {
      if (i !== lowestIdx) {
        sum += dice[i];
      }
    }
    return {
      dice,
      sortedDice: [...dice].sort((a, b) => a - b),
      sum,
      discardedIdx: lowestIdx
    };
  }
}
