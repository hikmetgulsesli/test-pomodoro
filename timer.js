/**
 * Pomodoro Timer - Core Timer Module
 * Handles countdown logic with circular progress ring animation
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
        
        // Progress ring constants
        this.radius = 54;
        this.circumference = 2 * Math.PI * this.radius;
        
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
        this.updateProgressRing = this.updateProgressRing.bind(this);
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
        
        // Initialize progress ring
        this.initializeProgressRing();
        
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
     * Initialize the SVG progress ring
     * Sets up stroke-dasharray for proper animation
     */
    initializeProgressRing() {
        if (this.progressCircle) {
            // Set the stroke-dasharray to the circumference
            this.progressCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
            // Start with full ring (no progress)
            this.progressCircle.style.strokeDashoffset = this.circumference;
        }
    }
    
    /**
     * Get the circumference of the progress ring
     * @returns {number} The circumference value
     */
    getCircumference() {
        return this.circumference;
    }
    
    /**
     * Calculate progress offset for the ring
     * @param {number} elapsed - Elapsed time in seconds
     * @param {number} total - Total time in seconds
     * @returns {number} The stroke-dashoffset value
     */
    calculateProgressOffset(elapsed, total) {
        const progress = elapsed / total;
        return this.circumference - (progress * this.circumference);
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
        this.updateProgressRing();
        
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
     * Update the circular progress ring
     * Ring fills clockwise as time elapses
     */
    updateProgressRing() {
        if (this.progressCircle) {
            const totalTime = this.isWorkPhase ? this.WORK_TIME : this.BREAK_TIME;
            const elapsed = totalTime - this.timeRemaining;
            const offset = this.calculateProgressOffset(elapsed, totalTime);
            this.progressCircle.style.strokeDashoffset = offset;
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
    
    /**
     * Get progress ring offset (for testing)
     * @returns {number|null} Current stroke-dashoffset value
     */
    getProgressRingOffset() {
        if (this.progressCircle) {
            return parseFloat(this.progressCircle.style.strokeDashoffset);
        }
        return null;
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
