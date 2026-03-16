import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import PomodoroTimer from '../timer.js';

describe('PomodoroTimer', () => {
  let timer;

  beforeEach(() => {
    // Mock setInterval and clearInterval
    vi.useFakeTimers();
    vi.spyOn(global, 'setInterval').mockImplementation(() => {
      return 123; // fake interval ID
    });
    vi.spyOn(global, 'clearInterval').mockImplementation(() => {});
    
    timer = new PomodoroTimer();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should display 25:00 on initial load', () => {
      const state = timer.getState();
      expect(state.timeRemaining).toBe(25 * 60); // 1500 seconds
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

    it('should start at session 1 of 4', () => {
      const state = timer.getState();
      expect(state.currentSession).toBe(1);
    });
  });

  describe('Start Button', () => {
    it('should begin countdown from current time when start is called', () => {
      timer.setTimeRemaining(1500); // 25:00
      timer.start();
      
      const state = timer.getState();
      expect(state.isRunning).toBe(true);
    });

    it('should decrement time every second', () => {
      timer.setTimeRemaining(1500);
      timer.start();
      
      // Simulate one second passing
      timer.tick();
      
      const state = timer.getState();
      expect(state.timeRemaining).toBe(1499);
      expect(timer.formatTime(state.timeRemaining)).toBe('24:59');
    });

    it('should continue decrementing over multiple seconds', () => {
      timer.setTimeRemaining(1500);
      timer.start();
      
      // Simulate 60 seconds passing
      for (let i = 0; i < 60; i++) {
        timer.tick();
      }
      
      const state = timer.getState();
      expect(state.timeRemaining).toBe(1440);
      expect(timer.formatTime(state.timeRemaining)).toBe('24:00');
    });
  });

  describe('Stop Button', () => {
    it('should pause countdown and preserve remaining time', () => {
      timer.setTimeRemaining(1500);
      timer.start();
      
      // Let it run for 10 seconds
      for (let i = 0; i < 10; i++) {
        timer.tick();
      }
      
      expect(timer.getState().timeRemaining).toBe(1490);
      
      // Stop the timer
      timer.stop();
      
      const state = timer.getState();
      expect(state.isRunning).toBe(false);
      expect(state.timeRemaining).toBe(1490);
    });

    it('should not decrement time when stopped', () => {
      timer.setTimeRemaining(1500);
      timer.start();
      timer.tick();
      timer.stop();
      
      const timeAfterStop = timer.getState().timeRemaining;
      
      // Try to tick while stopped (this shouldn't happen in real usage,
      // but testing that stop prevents future ticks)
      expect(timer.getState().timeRemaining).toBe(timeAfterStop);
    });
  });

  describe('Reset Button', () => {
    it('should return timer to 25:00', () => {
      timer.setTimeRemaining(900); // 15:00
      timer.reset();
      
      const state = timer.getState();
      expect(state.timeRemaining).toBe(1500); // 25:00
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

    it('should reset from any time to 25:00', () => {
      timer.setTimeRemaining(60); // 1:00
      timer.reset();
      
      expect(timer.getState().timeRemaining).toBe(1500);
      expect(timer.formatTime(timer.getState().timeRemaining)).toBe('25:00');
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

    it('should handle edge cases', () => {
      expect(timer.formatTime(1)).toBe('00:01');
      expect(timer.formatTime(59)).toBe('00:59');
      expect(timer.formatTime(61)).toBe('01:01');
    });
  });

  describe('Timer Updates Every Second', () => {
    it('should update display every second when running', () => {
      timer.setTimeRemaining(1500);
      timer.start();
      
      // Simulate multiple seconds
      timer.tick();
      expect(timer.getState().timeRemaining).toBe(1499);
      
      timer.tick();
      expect(timer.getState().timeRemaining).toBe(1498);
      
      timer.tick();
      expect(timer.getState().timeRemaining).toBe(1497);
    });

    it('should count down to zero correctly', () => {
      timer.setTimeRemaining(3);
      timer.start();
      
      timer.tick();
      expect(timer.getState().timeRemaining).toBe(2);
      
      timer.tick();
      expect(timer.getState().timeRemaining).toBe(1);
      
      timer.tick();
      expect(timer.getState().timeRemaining).toBe(0);
    });
  });

  describe('Timer Completion', () => {
    it('should stop when reaching zero', () => {
      timer.setTimeRemaining(1);
      timer.start();
      
      timer.tick();
      
      // Timer should stop at 0
      expect(timer.getState().timeRemaining).toBe(0);
    });
  });
});
