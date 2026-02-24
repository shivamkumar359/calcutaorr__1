const display = document.getElementById('display');
const buttons = document.querySelectorAll('.btn');
const historyToggleBtn = document.getElementById('btn-history-toggle');
const historyPanel = document.getElementById('history-panel');
const closeHistoryBtn = document.getElementById('btn-close-history');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('btn-clear-history');
const hapticSlider = document.getElementById('haptic-slider');

let currentExpression = "";
let hapticStrength = parseInt(hapticSlider.value);

// --- GLOBAL KEYBOARD BLOCK ---
// Strictly prevents all physical keyboard input
document.addEventListener('keydown', (e) => {
    e.preventDefault();
});

// --- HAPTICS ---
hapticSlider.addEventListener('input', (e) => {
    hapticStrength = parseInt(e.target.value);
});

function triggerHaptic() {
    if (navigator.vibrate && hapticStrength > 0) {
        navigator.vibrate(hapticStrength);
    }
}

// --- CALCULATION LOGIC ---
function updateDisplay(value) {
    display.textContent = value || "0";
}

function handleInput(val) {
    triggerHaptic();

    if (val === 'C') {
        currentExpression = "";
        updateDisplay("0");
        return;
    }

    if (val === 'Backspace') {
        currentExpression = currentExpression === "Error" ? "" : currentExpression.slice(0, -1);
        updateDisplay(currentExpression);
        return;
    }

    if (val === '=') {
        calculateResult();
        return;
    }

    if (currentExpression === "Error") currentExpression = "";
    
    currentExpression += val;
    updateDisplay(currentExpression);
}

function calculateResult() {
    if (!currentExpression) return;

    try {
        // Validation: Reject anything that isn't a number or basic operator
        if (/[^0-9+\-*/.]/.test(currentExpression)) {
            throw new Error("Invalid characters");
        }

        // Safe evaluation
        const result = new Function(`'use strict'; return (${currentExpression})`)();
        
        if (!isFinite(result)) throw new Error("Math Error");

        // Format to prevent floating point bugs (e.g., 0.1 + 0.2)
        const cleanResult = Math.round(result * 100000000) / 100000000;
        
        saveToHistory(currentExpression, cleanResult);
        
        currentExpression = cleanResult.toString();
        updateDisplay(currentExpression);

    } catch (e) {
        currentExpression = "Error";
        updateDisplay(currentExpression);
    }
}

buttons.forEach(button => {
    button.addEventListener('click', (e) => {
        handleInput(e.target.getAttribute('data-val'));
    });
});

// --- HISTORY LOGIC ---
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('calcHistory')) || [];
    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <div>${item.expression} =</div>
            <div><strong>${item.result}</strong></div>
        </div>
    `).join('');
}

function saveToHistory(expression, result) {
    const history = JSON.parse(localStorage.getItem('calcHistory')) || [];
    history.unshift({ expression, result });
    if (history.length > 50) history.pop();
    localStorage.setItem('calcHistory', JSON.stringify(history));
    loadHistory();
}

historyToggleBtn.addEventListener('click', () => {
    triggerHaptic();
    loadHistory();
    historyPanel.classList.remove('hidden');
});

closeHistoryBtn.addEventListener('click', () => {
    triggerHaptic();
    historyPanel.classList.add('hidden');
});

clearHistoryBtn.addEventListener('click', () => {
    triggerHaptic();
    localStorage.removeItem('calcHistory');
    loadHistory();
});

// --- PWA SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(err => console.error('Service Worker Registration Failed:', err));
    });
}