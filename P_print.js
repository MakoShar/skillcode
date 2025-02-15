// DOM Elements
const input = document.getElementById('terminal-input');
const output = document.getElementById('terminal-output');
const lowerTerminal = document.querySelector('.section-3 .terminal-output');
const executeBtn = document.querySelector('.execute-btn');

// Variables
let commandHistory = [];
let historyIndex = -1;
let lineCount = 0;
let completedTasks = new Set();
const totalTasks = 3;

// Add at the start with other variables
const cornerImage = document.querySelector('.corner-image');
const originalBgGif = cornerImage.src;
const levelUpGif = 'Images/Level UP.gif';

// Add new element for level up overlay
const levelUpOverlay = document.createElement('img');
levelUpOverlay.className = 'level-up-overlay';
levelUpOverlay.src = levelUpGif;
levelUpOverlay.style.display = 'none';
document.querySelector('.section-1').appendChild(levelUpOverlay);

// Add blur overlay element
const blurOverlay = document.createElement('div');
blurOverlay.className = 'blur-overlay';
document.querySelector('.section-1').appendChild(blurOverlay);

// Toggle sidebar
document.querySelector('.menu-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelector('.side-nav').classList.toggle('active');
});

// Handle textarea input
input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        
        const start = this.selectionStart;
        const value = this.value;
        
        this.value = value.substring(0, start) + '\n' + value.substring(start);
        this.selectionStart = this.selectionEnd = start + 1;
        
        adjustTextareaHeight(this);
        updateLineNumbers(this);
        this.scrollTop = this.scrollHeight;
    }
});

// Height adjustment function
function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    const newHeight = Math.max(textarea.scrollHeight, 21);
    textarea.style.height = newHeight + 'px';
    
    const cursorPosition = textarea.selectionStart;
    const lines = textarea.value.substring(0, cursorPosition).split('\n');
    const currentLine = lines.length;
    const lineHeight = 21;
    const cursorY = (currentLine - 1) * lineHeight;
    
    if (cursorY < textarea.scrollTop) {
        textarea.scrollTop = cursorY;
    } else if (cursorY > textarea.scrollTop + textarea.clientHeight - lineHeight) {
        textarea.scrollTop = cursorY - textarea.clientHeight + lineHeight;
    }
}

// Update line numbers
function updateLineNumbers(textarea) {
    const lines = textarea.value.split('\n');
    lineCount = lines.length;
    const lineNumbers = document.querySelector('.line-numbers');
    lineNumbers.innerHTML = Array.from({length: lineCount}, (_, i) => {
        return `<div class="line-number">${i + 1}</div>`;
    }).join('');
}

// Execute button handler
executeBtn.addEventListener('click', () => {
    const command = input.value;
    if (!command) return;
    
    try {
        let variables = {};
        
        const lines = command.split('\n');
        for (let line of lines) {
            line = line.trim();
            
            // Handle variable assignment
            if (line.includes('=') && !line.startsWith('print')) {
                // Handle multiple variable assignment
                if (line.includes(',')) {
                    const [vars, vals] = line.split('=').map(part => part.trim());
                    const varNames = vars.split(',').map(v => v.trim());
                    const values = vals.split(',').map(v => eval(v.trim()));
                    
                    varNames.forEach((name, index) => {
                        variables[name] = values[index];
                    });
                } else {
                    const [varName, value] = line.split('=').map(part => part.trim());
                    variables[varName] = eval(value);
                }
            }
            
            // Handle print statements
            if (line.startsWith('print(')) {
                const match = line.match(/print\s*\((.*?)\)/);
                if (match) {
                    const content = match[1].trim();
                    // Handle expressions with variables
                    if (content.includes('+')) {
                        const expr = content.split('+').map(part => {
                            part = part.trim();
                            return variables[part] || part;
                        }).join('+');
                        lowerTerminal.innerHTML += eval(expr) + '\n';
                    } else if (content in variables) {
                        lowerTerminal.innerHTML += variables[content] + '\n';
                    } else if (content.startsWith('"') || content.startsWith("'")) {
                        lowerTerminal.innerHTML += content.slice(1, -1) + '\n';
                    } else {
                        lowerTerminal.innerHTML += eval(content) + '\n';
                    }
                }
            }
        }
        
        // Check for task completion
        if (command.includes('print("Hello world")') || command.includes("print('Hello world')")) {
            completedTasks.add(1);
        }
        if (command.match(/x\s*=.+\s*print\s*\(\s*x\s*\)/)) {
            completedTasks.add(2);
        }
        if (command.match(/print\s*\(\s*[\w\s+]+\)/)) {
            const printContent = command.match(/print\s*\((.*?)\)/)[1];
            if (printContent.replace(/\s+/g, '') === '20+30') {
                completedTasks.add(3);
            }
        }
        
        document.getElementById('tasksComplete').textContent = completedTasks.size;
        
        // Check if all tasks are completed
        if (completedTasks.size === totalTasks) {
            // Show level up overlay and blur background
            levelUpOverlay.style.display = 'block';
            blurOverlay.style.opacity = '1';
        }
        
    } catch (error) {
        lowerTerminal.innerHTML += '<span class="error-text">SyntaxError: Invalid syntax</span>\n';
    }
    
    input.value = '';
});

// Input event listener
input.addEventListener('input', function() {
    adjustTextareaHeight(this);
    updateLineNumbers(this);
});

// Arrow key handling
input.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowUp') {
        handleArrowUp(this);
    }
    if (e.key === 'ArrowDown') {
        handleArrowDown(this);
    }
    if (e.key === 'Tab') {
        handleTab(this, e);
    }
});

function handleArrowUp(textarea) {
    const cursorPosition = textarea.selectionStart;
    const value = textarea.value;
    const lines = value.substring(0, cursorPosition).split('\n');
    const currentLineStart = value.lastIndexOf('\n', cursorPosition - 1) + 1;
    const currentColumn = cursorPosition - currentLineStart;
    
    if (lines.length > 1) {
        const prevLineStart = value.lastIndexOf('\n', currentLineStart - 2) + 1;
        const prevLineEnd = currentLineStart - 1;
        const prevLineLength = prevLineEnd - prevLineStart;
        const newPosition = prevLineStart + Math.min(currentColumn, prevLineLength);
        
        textarea.selectionStart = textarea.selectionEnd = newPosition;
    } else if (historyIndex > 0) {
        historyIndex--;
        textarea.value = commandHistory[historyIndex];
        adjustTextareaHeight(textarea);
    }
}

function handleArrowDown(textarea) {
    const cursorPosition = textarea.selectionStart;
    const value = textarea.value;
    const currentLineStart = value.lastIndexOf('\n', cursorPosition - 1) + 1;
    const currentLineEnd = value.indexOf('\n', cursorPosition);
    const nextLineStart = currentLineEnd + 1;
    
    if (currentLineEnd !== -1 && nextLineStart < value.length) {
        const currentColumn = cursorPosition - currentLineStart;
        const nextLineEnd = value.indexOf('\n', nextLineStart);
        const nextLineLength = (nextLineEnd === -1 ? value.length : nextLineEnd) - nextLineStart;
        const newPosition = nextLineStart + Math.min(currentColumn, nextLineLength);
        
        textarea.selectionStart = textarea.selectionEnd = newPosition;
    } else if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        textarea.value = commandHistory[historyIndex];
        adjustTextareaHeight(textarea);
    }
}

function handleTab(textarea, e) {
    e.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + 4;
}