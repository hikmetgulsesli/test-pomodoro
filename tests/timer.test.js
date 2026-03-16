import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import PomodoroTimer from '../timer.js';

describe('PomodoroTimer', () => {
  let timer;

  beforeEach(() => {
    vi.useFakeTimers();
    timer = new PomodoroTimer();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Circular Progress Ring', () => {
    describe('SVG Ring Rendering', () => {
      it('should have correct radius for progress ring', () => {
        expect(timer.radius).toBe(54);
      });

      it('should calculate circumference correctly', () => {
        const expectedCircumference = 2 * Math.PI * 54;
        expect(timer.circumference).toBeCloseTo(expectedCircumference, 2);
        expect(timer.getCircumference()).toBeCloseTo(expectedCircumference, 2);
      });

      it('should initialize with full circumference value', () => {
        // Circumference = 2 * PI * 54 ≈ 339.292
        expect(timer.circumference).toBeCloseTo(339.292, 1);
      });
    });

    describe('Progress Ring Animation', () => {
      it('should calculate progress offset correctly at start (0% elapsed)', () => {
        const totalTime = 1500; // 25 minutes
        const elapsed = 0;
        const offset = timer.calculateProgressOffset(elapsed, totalTime);
        
        // At start, offset should equal circumference (full ring)
        expect(offset).toBe(timer.circumference);
      });

      it('should calculate progress offset correctly at 50% elapsed', () => {
        const totalTime = 1500;
        const elapsed = 750; // 50%
        const offset = timer.calculateProgressOffset(elapsed, totalTime);
        
        // At 50%, offset should be half the circumference
        expect(offset).toBeCloseTo(timer.circumference * 0.5, 1);
      });

      it('should calculate progress offset correctly at 100% elapsed', () => {
        const totalTime = 1500;
        const elapsed = 1500; // 100%
        const offset = timer.calculateProgressOffset(elapsed, totalTime);
        
        // At 100%, offset should be 0 (ring fully filled)
        expect(offset).toBe(0);
      });

      it('should fill ring clockwise as timer counts down', () => {
        timer.setTimeRemaining(1500);
        const initialOffset = timer.calculateProgressOffset(0, 1500);
        
        // After 300 seconds (5 minutes)
        timer.setTimeRemaining(1200);
        const laterOffset = timer.calculateProgressOffset(300, 1500);
        
        // As time elapses, offset decreases (ring fills)
        expect(laterOffset).toBeLessThan(initialOffset);
      });

      it('should update progress smoothly throughout countdown', () => {
        const totalTime = 1500;
        const checkpoints = [0, 375, 750, 1125, 1500]; // 0%, 25%, 50%, 75%, 100%
        
        const offsets = checkpoints.map(elapsed => 
          timer.calculateProgressOffset(elapsed, totalTime)
        );
        
        // Offsets should decrease monotonically
        for (let i = 1; i < offsets.length; i++) {
          expect(offsets[i]).toBeLessThan(offsets[i - 1]);
        }
        
        // First should be full circumference, last should be 0
        expect(offsets[0]).toBe(timer.circumference);
        expect(offsets[offsets.length - 1]).toBe(0);
      });
    });

    describe('Progress Ring Reset', () => {
      it('should reset progress ring to full when timer resets', () => {
        // Set timer to partial elapsed time
        timer.setTimeRemaining(900); // 15 minutes elapsed of 25
        timer.isWorkPhase = true;
        
        // Reset the timer
        timer.reset();
        
        // After reset, time should be back to full
        expect(timer.timeRemaining).toBe(1500);
        expect(timer.getState().timeRemaining).toBe(1500);
      });

      it('should calculate full ring offset after reset', () => {
        timer.setTimeRemaining(0); // Timer completed
        timer.reset();
        
        const offset = timer.calculateProgressOffset(0, timer.WORK_TIME);
        expect(offset).toBe(timer.circumference);
      });
    });

    describe('Circumference Calculation', () => {
      it('should use correct radius for container size', () => {
        // SVG viewBox is 120x120, radius 54 gives diameter 108
        // This leaves 6px padding (3px on each side) for stroke width
        const diameter = timer.radius * 2;
        const viewBoxSize = 120;
        const strokeWidth = 8;
        
        // Diameter + stroke should fit within viewBox
        expect(diameter + strokeWidth).toBeLessThanOrEqual(viewBoxSize);
      });

      it('should maintain consistent circumference calculation', () => {
        const calculated = 2 * Math.PI * timer.radius;
        expect(timer.circumference).toBe(calculated);
        expect(timer.getCircumference()).toBe(calculated);
      });
    });
  });

  describe('Core Timer Functionality', () => {
    describe('Initial State', () => {
      it('should display 25:00 on initial load', () => {
        const state = timer.getState();
        expect(state.timeRemaining).toBe(25 * 60);
        expect(timer.formatTime(state.timeRemaining)).toBe('25:00');
      });

      it('should be in work phase initially', () => {
        const state = timer.getState();
        expect(state.isWorkPhase).toBe(true);
      });

      it('should not be running initially', () => {
        const state = timer.getState();
        expect(state.isRunning).toBe(false);
      });
    });

    describe('Start Button', () => {
      it('should begin countdown from current time when start is called', () => {
        timer.setTimeRemaining(1500);
        timer.start();
        
        const state = timer.getState();
        expect(state.isRunning).toBe(true);
      });

      it('should decrement time every second', () => {
        timer.setTimeRemaining(1500);
        timer.start();
        timer.tick();
        
        const state = timer.getState();
        expect(state.timeRemaining).toBe(1499);
        expect(timer.formatTime(state.timeRemaining)).toBe('24:59');
      });
    });

    describe('Stop Button', () => {
      it('should pause countdown and preserve remaining time', () => {
        timer.setTimeRemaining(1500);
        timer.start();
        
        for (let i = 0; i < 10; i++) {
          timer.tick();
        }
        
        expect(timer.getState().timeRemaining).toBe(1490);
        timer.stop();
        
        const state = timer.getState();
        expect(state.isRunning).toBe(false);
        expect(state.timeRemaining).toBe(1490);
      });
    });

    describe('Reset Button', () => {
      it('should return timer to 25:00', () => {
        timer.setTimeRemaining(900);
        timer.reset();
        
        const state = timer.getState();
        expect(state.timeRemaining).toBe(1500);
        expect(timer.formatTime(state.timeRemaining)).toBe('25:00');
      });

      it('should stop timer if running when reset', () => {
        timer.setTimeRemaining(1500);
        timer.start();
        timer.tick();
        timer.reset();
        
        const state = timer.getState();
        expect(state.isRunning).toBe(false);
        expect(state.timeRemaining).toBe(1500);
      });
    });

    describe('Time Formatting', () => {
      it('should format time in MM:SS format', () => {
        expect(timer.formatTime(1500)).toBe('25:00');
        expect(timer.formatTime(900)).toBe('15:00');
        expect(timer.formatTime(60)).toBe('01:00');
        expect(timer.formatTime(0)).toBe('00:00');
      });

      it('should pad single digits with zero', () => {
        expect(timer.formatTime(65)).toBe('01:05');
        expect(timer.formatTime(5)).toBe('00:05');
        expect(timer.formatTime(305)).toBe('05:05');
      });
    });
  });
});
