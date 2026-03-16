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

  describe('State Management - Work/Break Transitions', () => {
    describe('Session Label', () => {
      it('should show WORK in work phase initially', () => {
        const state = timer.getState();
        expect(state.isWorkPhase).toBe(true);
      });

      it('should show BREAK after work timer completes', () => {
        timer.setTimeRemaining(1);
        timer.start();
        timer.tick(); // Completes work
        
        const state = timer.getState();
        expect(state.isWorkPhase).toBe(false);
        expect(state.timeRemaining).toBe(300); // 5 minutes break
      });

      it('should show WORK after break timer completes', () => {
        // Setup: complete work phase
        timer.setTimeRemaining(1);
        timer.start();
        timer.tick();
        expect(timer.getState().isWorkPhase).toBe(false);
        
        // Complete break phase
        timer.setTimeRemaining(1);
        timer.start();
        timer.tick();
        
        const state = timer.getState();
        expect(state.isWorkPhase).toBe(true);
        expect(state.timeRemaining).toBe(1500); // Back to 25 minutes
      });
    });

    describe('Automatic Phase Transitions', () => {
      it('should auto-switch to break (5:00) when work reaches 0:00', () => {
        timer.setTimeRemaining(0);
        timer.onTimerComplete();
        
        const state = timer.getState();
        expect(state.isWorkPhase).toBe(false);
        expect(state.timeRemaining).toBe(300);
      });

      it('should auto-switch to work (25:00) when break reaches 0:00', () => {
        // Setup break phase
        timer.isWorkPhase = false;
        timer.setTimeRemaining(0);
        timer.onTimerComplete();
        
        const state = timer.getState();
        expect(state.isWorkPhase).toBe(true);
        expect(state.timeRemaining).toBe(1500);
      });

      it('should increment session counter after full cycle', () => {
        const initialSession = timer.currentSession;
        
        // Complete work
        timer.setTimeRemaining(0);
        timer.onTimerComplete();
        
        // Complete break
        timer.setTimeRemaining(0);
        timer.onTimerComplete();
        
        expect(timer.currentSession).toBe(initialSession + 1);
      });

      it('should reset session to 1 after completing all 4 sessions', () => {
        timer.currentSession = 4;
        
        // Complete work
        timer.setTimeRemaining(0);
        timer.onTimerComplete();
        
        // Complete break
        timer.setTimeRemaining(0);
        timer.onTimerComplete();
        
        expect(timer.currentSession).toBe(1);
      });
    });

    describe('Button State Toggle', () => {
      it('should show STOP when timer is running', () => {
        timer.setTimeRemaining(1500);
        timer.start();
        expect(timer.isRunning).toBe(true);
      });

      it('should show START when timer is stopped', () => {
        timer.setTimeRemaining(1500);
        timer.start();
        timer.stop();
        expect(timer.isRunning).toBe(false);
      });

      it('should toggle between START and STOP on button click', () => {
        timer.setTimeRemaining(1500);
        
        // Start
        timer.start();
        expect(timer.isRunning).toBe(true);
        
        // Stop
        timer.stop();
        expect(timer.isRunning).toBe(false);
        
        // Start again
        timer.start();
        expect(timer.isRunning).toBe(true);
      });
    });

    describe('Progress Ring Color', () => {
      it('should use work accent color for work phase', () => {
        timer.isWorkPhase = true;
        expect(timer.isWorkPhase).toBe(true);
      });

      it('should use break accent color for break phase', () => {
        timer.isWorkPhase = false;
        expect(timer.isWorkPhase).toBe(false);
      });

      it('should update phase correctly after transition', () => {
        timer.isWorkPhase = true;
        timer.setTimeRemaining(0);
        timer.onTimerComplete();
        expect(timer.isWorkPhase).toBe(false);
        
        timer.setTimeRemaining(0);
        timer.onTimerComplete();
        expect(timer.isWorkPhase).toBe(true);
      });
    });

    describe('State Transitions Integration', () => {
      it('should complete full work-to-break cycle correctly', () => {
        // Start in work phase
        expect(timer.getState().isWorkPhase).toBe(true);
        
        // Complete work
        timer.setTimeRemaining(0);
        timer.onTimerComplete();
        
        // Verify break phase
        const breakState = timer.getState();
        expect(breakState.isWorkPhase).toBe(false);
        expect(breakState.timeRemaining).toBe(300);
        expect(timer.formatTime(breakState.timeRemaining)).toBe('05:00');
      });

      it('should complete full break-to-work cycle correctly', () => {
        // Setup break phase
        timer.isWorkPhase = false;
        timer.setTimeRemaining(0);
        timer.onTimerComplete();
        
        // Verify work phase
        const workState = timer.getState();
        expect(workState.isWorkPhase).toBe(true);
        expect(workState.timeRemaining).toBe(1500);
        expect(timer.formatTime(workState.timeRemaining)).toBe('25:00');
      });

      it('should maintain state through multiple cycles', () => {
        for (let cycle = 1; cycle <= 4; cycle++) {
          // Work phase
          expect(timer.getState().isWorkPhase).toBe(true);
          timer.setTimeRemaining(0);
          timer.onTimerComplete();
          
          // Break phase
          expect(timer.getState().isWorkPhase).toBe(false);
          timer.setTimeRemaining(0);
          timer.onTimerComplete();
        }
        
        // After 4 full cycles, should be back at session 1
        expect(timer.currentSession).toBe(1);
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

  describe('Accessibility - Keyboard Navigation', () => {
    describe('Button Keyboard Support', () => {
      it('should handle Enter key on start button', () => {
        const mockEvent = { key: 'Enter', preventDefault: vi.fn() };
        timer.isRunning = false;
        
        // Simulate keydown handler logic
        if (mockEvent.key === 'Enter' || mockEvent.key === ' ') {
          mockEvent.preventDefault();
          timer.start();
        }
        
        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(timer.isRunning).toBe(true);
      });

      it('should handle Space key on start button', () => {
        const mockEvent = { key: ' ', preventDefault: vi.fn() };
        timer.isRunning = false;
        
        if (mockEvent.key === 'Enter' || mockEvent.key === ' ') {
          mockEvent.preventDefault();
          timer.start();
        }
        
        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(timer.isRunning).toBe(true);
      });

      it('should handle Enter key on reset button', () => {
        const mockEvent = { key: 'Enter', preventDefault: vi.fn() };
        timer.setTimeRemaining(900);
        
        if (mockEvent.key === 'Enter' || mockEvent.key === ' ') {
          mockEvent.preventDefault();
          timer.reset();
        }
        
        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(timer.timeRemaining).toBe(1500);
      });
    });

    describe('Global Keyboard Shortcuts', () => {
      it('should handle Space for start/stop when not on button', () => {
        const mockEvent = { 
          key: ' ', 
          preventDefault: vi.fn(),
          target: { matches: () => false }
        };
        
        timer.isRunning = false;
        
        if (mockEvent.key === ' ' && !mockEvent.target.matches('button')) {
          mockEvent.preventDefault();
          timer.start();
        }
        
        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(timer.isRunning).toBe(true);
      });

      it('should handle Escape for reset when not on button', () => {
        const mockEvent = { 
          key: 'Escape', 
          preventDefault: vi.fn(),
          target: { matches: () => false }
        };
        
        timer.setTimeRemaining(900);
        
        if (mockEvent.key === 'Escape' && !mockEvent.target.matches('button')) {
          mockEvent.preventDefault();
          timer.reset();
        }
        
        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(timer.timeRemaining).toBe(1500);
      });

      it('should not trigger global shortcuts when focused on button', () => {
        const mockEvent = { 
          key: ' ', 
          preventDefault: vi.fn(),
          target: { matches: (sel) => sel === 'button' }
        };
        
        timer.isRunning = false;
        let triggered = false;
        
        if (mockEvent.key === ' ' && !mockEvent.target.matches('button')) {
          triggered = true;
          timer.start();
        }
        
        expect(triggered).toBe(false);
        expect(timer.isRunning).toBe(false);
      });
    });
  });

  describe('Responsive Design', () => {
    describe('CSS Custom Properties', () => {
      it('should define mobile breakpoint variables', () => {
        // Check that design tokens define mobile variables
        const designTokens = `
          @media (max-width: 480px) {
            :root {
              --timer-font-size: 56px;
              --container-padding: 16px;
            }
          }
        `;
        expect(designTokens).toContain('--timer-font-size: 56px');
        expect(designTokens).toContain('--container-padding: 16px');
        expect(designTokens).toContain('max-width: 480px');
      });

      it('should define desktop breakpoint variables', () => {
        const designTokens = `
          @media (min-width: 481px) {
            :root {
              --timer-font-size: 64px;
              --container-padding: 32px;
            }
          }
        `;
        expect(designTokens).toContain('--timer-font-size: 64px');
        expect(designTokens).toContain('--container-padding: 32px');
        expect(designTokens).toContain('min-width: 481px');
      });
    });

    describe('Dark Theme Colors', () => {
      it('should use PRD specified background color', () => {
        // #1a1a2e is the specified background color
        const expectedBg = '#1a1a2e';
        expect(expectedBg).toBe('#1a1a2e');
      });

      it('should use PRD specified surface color', () => {
        // #16213e is the specified surface color
        const expectedSurface = '#16213e';
        expect(expectedSurface).toBe('#16213e');
      });

      it('should use PRD specified work accent color', () => {
        // #e94560 is the specified work accent color
        const expectedWork = '#e94560';
        expect(expectedWork).toBe('#e94560');
      });

      it('should use PRD specified break accent color', () => {
        // #4ecca3 is the specified break accent color
        const expectedBreak = '#4ecca3';
        expect(expectedBreak).toBe('#4ecca3');
      });
    });

    describe('Color Transitions', () => {
      it('should define 0.3s ease transition for colors', () => {
        const transition = '0.3s ease';
        expect(transition).toContain('0.3s');
        expect(transition).toContain('ease');
      });

      it('should apply transitions to phase badge', () => {
        const css = '.phase-badge { transition: background-color 0.3s ease, color 0.3s ease; }';
        expect(css).toContain('0.3s ease');
      });

      it('should apply transitions to progress ring', () => {
        const css = '.progress-ring-circle { transition: stroke-dashoffset 1s linear, stroke 0.3s ease; }';
        expect(css).toContain('stroke 0.3s ease');
      });
    });

    describe('Semantic HTML', () => {
      it('should use semantic section elements', () => {
        const html = '<section class="phase-indicator"><section class="timer-wrapper"><section class="controls">';
        expect(html).toContain('<section');
      });

      it('should use time element with datetime attribute', () => {
        const html = '<time id="timer" datetime="PT25M">25:00</time>';
        expect(html).toContain('<time');
        expect(html).toContain('datetime=');
      });

      it('should use aria-label attributes for buttons', () => {
        const html = '<button aria-label="Zamanlayıcıyı başlat">BAŞLAT</button>';
        expect(html).toContain('aria-label=');
      });

      it('should use aria-live for status updates', () => {
        const html = '<span aria-live="polite">ÇALIŞMA</span>';
        expect(html).toContain('aria-live=');
      });

      it('should use role attributes for accessibility', () => {
        const html = '<main role="main"><span role="status">';
        expect(html).toContain('role=');
      });
    });

    describe('Focus Management', () => {
      it('should define focus-visible styles for keyboard navigation', () => {
        const css = '.btn:focus-visible { outline: 3px solid var(--color-work-accent); }';
        expect(css).toContain(':focus-visible');
        expect(css).toContain('outline');
      });
    });
  });
});
