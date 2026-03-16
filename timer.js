/**
 * Pomodoro Timer - Core Timer Module
 * Handles countdown logic for 25-minute work sessions
 */

class PomodoroTimer {
    constructor() {
        // Timer constants (in seconds)
        this.WORK_TIME = 25 * 60; // 25 minutes
        this.BREAK_TIME = 5 * 60;  // 5 minutes
        
        // State
        this.timeRemaining = this.WORK_TIME;
        this.isRunning = false;
        this.intervalId = null;
        this.currentSession = 1;
        this.totalSessions = 4;
        this.isWorkPhase = true;
        
        // DOM elements
        this.timerDisplay = null;
        this.startBtn = null;
        this.resetBtn = null;
        this.phaseBadge = null;
        this.sessionInfo = null;
        this.progressCircle = null;
        
        // Bind methods
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.reset = this.reset.bind(this);
        this.tick = this.tick.bind(this);
        this.updateDisplay = this.updateDisplay.bind(this);
        this.formatTime = this.formatTime.bind(this);
    }
    
    /**
     * Initialize the timer with DOM elements
     */
    init() {
        this.timerDisplay = document.getElementById('timer');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.phaseBadge = document.getElementById('phase-badge');
        this.sessionInfo = document.getElementById('session-info');
        this.progressCircle = document.getElementById('progress-circle');
        
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => {
                if (this.isRunning) {
                    this.stop();
                } else {
                    this.start();
                }
            });
        }
        
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', this.reset);
        }
        
        this.updateDisplay();
        return this;
    }
    
    /**
     * Start the countdown timer
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            if (this.startBtn) {
                this.startBtn.textContent = 'STOP';
            }
            this.intervalId = setInterval(this.tick, 1000);
        }
    }
    
    /**
     * Stop/pause the countdown timer
     */
    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            if (this.startBtn) {
                this.startBtn.textContent = 'START';
            }
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }
    }
    
    /**
     * Reset timer to initial state (25:00)
     */
    reset() {
        this.stop();
        this.timeRemaining = this.WORK_TIME;
        this.isWorkPhase = true;
        this.updateDisplay();
    }
    
    /**
     * Tick function called every second
     */
    tick() {
        if (this.timeRemaining > 0) {
            this.timeRemaining--;
            this.updateDisplay();
        } else {
            this.onTimerComplete();
        }
    }
    
    /**
     * Called when timer reaches zero
     */
    onTimerComplete() {
        this.stop();
        // Timer complete - could switch phases here in future stories
    }
    
    /**
     * Update the display with current time
     */
    updateDisplay() {
        const formattedTime = this.formatTime(this.timeRemaining);
        if (this.timerDisplay) {
            this.timerDisplay.textContent = formattedTime;
        }
        
        // Update progress ring
        if (this.progressCircle) {
            const totalTime = this.isWorkPhase ? this.WORK_TIME : this.BREAK_TIME;
            const circumference = 2 * Math.PI * 54; // r = 54
            const progress = (totalTime - this.timeRemaining) / totalTime;
            const offset = circumference - (progress * circumference);
            this.progressCircle.style.strokeDashoffset = offset;
        }
        
        // Update phase badge
        if (this.phaseBadge) {
            this.phaseBadge.textContent = this.isWorkPhase ? 'WORK' : 'BREAK';
            this.phaseBadge.className = `phase-badge ${this.isWorkPhase ? 'work' : 'break'}`;
        }
        
        // Update session info
        if (this.sessionInfo) {
            this.sessionInfo.textContent = `Session ${this.currentSession} of ${this.totalSessions}`;
        }
    }
    
    /**
     * Format seconds into MM:SS display
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Get current timer state (for testing)
     * @returns {Object} Current state
     */
    getState() {
        return {
            timeRemaining: this.timeRemaining,
            isRunning: this.isRunning,
            currentSession: this.currentSession,
            isWorkPhase: this.isWorkPhase
        };
    }
    
    /**
     * Set time remaining (for testing)
     * @param {number} seconds - Time in seconds
     */
    setTimeRemaining(seconds) {
        this.timeRemaining = seconds;
        this.updateDisplay();
    }
}

// Initialize timer when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.timerInstance = new PomodoroTimer().init();
        });
    } else {
        window.timerInstance = new PomodoroTimer().init();
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PomodoroTimer;
}
