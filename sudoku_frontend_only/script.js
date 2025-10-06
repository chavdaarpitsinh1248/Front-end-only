const boardEl = document.getElementById('board');
const SIZE = 9;

let currentPuzzle = null;
let currentSolution = null;
let history = [];
let redoStack = [];
let pencilMode = false;
let mistakes = 0;
let seconds = 0;
let timerInterval = null;

// -----------------------------
// Sudoku Generator & Solver
// -----------------------------
function isValid(board, r, c, val) {
    for (let i = 0; i < SIZE; i++) {
        if (board[r][i] === val || board[i][c] === val) return false;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            if (board[br + i][bc + j] === val) return false;
    return true;
}

function solveBoard(board) {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] === 0) {
                for (let n = 1; n <= 9; n++) {
                    if (isValid(board, r, c, n)) {
                        board[r][c] = n;
                        if (solveBoard(board)) return true;
                        board[r][c] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function generateSolved() {
    let board = Array.from({ length: 9 }, () => Array(9).fill(0));
    function backtrack(pos = 0) {
        if (pos === 81) return true;
        const [r, c] = [Math.floor(pos / 9), pos % 9];
        let nums = [...Array(9).keys()].map(x => x + 1);
        nums.sort(() => Math.random() - 0.5);
        for (let n of nums) {
            if (isValid(board, r, c, n)) {
                board[r][c] = n;
                if (backtrack(pos + 1)) return true;
                board[r][c] = 0;
            }
        }
        return false;
    }
    backtrack();
    return board;
}

function makePuzzle(clues = 40) {
    let solved = generateSolved();
    let puzzle = solved.map(r => [...r]);
    let cells = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) cells.push([r, c]);
    cells.sort(() => Math.random() - 0.5);
    let removed = 0, max_removals = 81 - clues;
    for (let [r, c] of cells) {
        if (removed >= max_removals) break;
        let backup = puzzle[r][c];
        puzzle[r][c] = 0;
        let copy = puzzle.map(r => [...r]);
        if (countSolutions(copy) === 1) removed++;
        else puzzle[r][c] = backup;
    }
    return [puzzle, solved];
}

function countSolutions(board) {
    let count = 0;
    function backtrack() {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (board[r][c] === 0) {
                    for (let n = 1; n <= 9; n++) {
                        if (isValid(board, r, c, n)) {
                            board[r][c] = n;
                            backtrack();
                            board[r][c] = 0;
                        }
                    }
                    return;
                }
            }
        }
        count++;
    }
    backtrack();
    return count;
}

// -----------------------------
// Render / Fill UI
// -----------------------------
function renderGrid(puzzle) {
    boardEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const val = puzzle[r][c];
            const cell = document.createElement('div');
            cell.className = 'cell';
            if ((c + 1) % 3 === 0) cell.classList.add('box-right');
            if (c % 3 === 0) cell.classList.add('box-left');
            if ((r + 1) % 3 === 0) cell.classList.add('box-bottom');
            if (r % 3 === 0) cell.classList.add('box-top');

            const input = document.createElement('input');
            input.type = 'text'; input.maxLength = 1;
            input.dataset.r = r; input.dataset.c = c;

            if (val !== 0) {
                input.value = val;
                input.readOnly = true;
                cell.classList.add('clue', 'given');
            }

            cell.appendChild(input);
            boardEl.appendChild(cell);
        }
    }
}

function fillUI(board) {
    boardEl.querySelectorAll('input').forEach(inp => {
        const r = parseInt(inp.dataset.r), c = parseInt(inp.dataset.c);
        inp.value = board[r][c] === 0 ? '' : board[r][c];
    });
}

// -----------------------------
// Generate / Start Puzzle
// -----------------------------
function generatePuzzle(level = 'medium') {
    let clues = { easy: 46, medium: 40, hard: 32 }[level] || 40;
    [currentPuzzle, currentSolution] = makePuzzle(clues);
    mistakes = 0; document.getElementById('mistakes').textContent = `Mistakes: ${mistakes}`;
    renderGrid(currentPuzzle);
    startTimer();
    history = []; redoStack = [];
    pushHistory();
}

// -----------------------------
// Hint
// -----------------------------
function hint() {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const inp = boardEl.querySelector(`input[data-r="${r}"][data-c="${c}"]`);
            if (inp && inp.value === '') {
                inp.value = currentSolution[r][c];
                inp.readOnly = true;
                inp.parentElement.classList.add('clue', 'given');
                inp.style.background = 'rgba(0,200,0,0.5)';
                setTimeout(() => inp.style.background = '', 500);
                pushHistory();
                return;
            }
        }
    }
}

// -----------------------------
// Check / Pencil
// -----------------------------
function checkBoard() {
    boardEl.querySelectorAll('input').forEach(inp => {
        const r = parseInt(inp.dataset.r), c = parseInt(inp.dataset.c);
        const val = parseInt(inp.value);
        inp.style.background = '';
        if (!isNaN(val) && val !== currentSolution[r][c])
            inp.style.background = 'rgba(255,100,100,0.5)';
    });
}

function togglePencilMode() {
    pencilMode = !pencilMode;
    document.getElementById('pencilBtn').style.background = pencilMode ? '#2b7cff' : '';
}

// -----------------------------
// Undo / Redo
// -----------------------------
function getCurrentBoardState() {
    const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
    boardEl.querySelectorAll('input').forEach(inp => {
        const r = parseInt(inp.dataset.r), c = parseInt(inp.dataset.c);
        board[r][c] = inp.value;
    });
    return board;
}
function pushHistory() { history.push(getCurrentBoardState()); redoStack = []; }
function fillBoardFromState(state) {
    boardEl.querySelectorAll('input').forEach(inp => {
        const r = parseInt(inp.dataset.r), c = parseInt(inp.dataset.c);
        inp.value = state[r][c];
    });
}
function undo() { if (history.length < 2) return; redoStack.push(history.pop()); fillBoardFromState(history[history.length - 1]); }
function redo() { if (redoStack.length === 0) return; const next = redoStack.pop(); history.push(next); fillBoardFromState(next); }

// -----------------------------
// Timer
// -----------------------------
function startTimer() { if (timerInterval) clearInterval(timerInterval); seconds = 0; timerInterval = setInterval(() => { seconds++; const min = String(Math.floor(seconds / 60)).padStart(2, '0'); const sec = String(seconds % 60).padStart(2, '0'); document.getElementById('timer').textContent = `Time: ${min}:${sec}`; }, 1000); }
function stopTimer() { if (timerInterval) clearInterval(timerInterval); }

// -----------------------------
// Input Event
// -----------------------------
boardEl.addEventListener('input', e => {
    if (e.target.tagName !== 'INPUT') return;
    let val = e.target.value.replace(/[^1-9]/g, ''); e.target.value = val;
    e.target.style.fontSize = pencilMode && val ? '10px' : '18px';

    const r = parseInt(e.target.dataset.r), c = parseInt(e.target.dataset.c), num = parseInt(val);
    if (!pencilMode && !isNaN(num) && currentSolution) {
        if (num !== currentSolution[r][c]) {
            mistakes++; document.getElementById('mistakes').textContent = `Mistakes: ${mistakes}`;
            e.target.style.background = 'rgba(255,100,100,0.5)';
        } else e.target.style.background = '';
    }

    pushHistory();

    // Check completion
    if (isSolved()) {
        stopTimer();
        alert(`🎉 Congrats! Solved in ${document.getElementById('timer').textContent.split(' ')[1]} with ${mistakes} mistakes.`);
    }
});

// -----------------------------
// Check Solved
// -----------------------------
function isSolved() {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const inp = boardEl.querySelector(`input[data-r="${r}"][data-c="${c}"]`);
            if (!inp || parseInt(inp.value) !== currentSolution[r][c]) return false;
        }
    }
    return true;
}

// -----------------------------
// Event Listeners
// -----------------------------
document.getElementById('genEasy').addEventListener('click', () => generatePuzzle('easy'));
document.getElementById('genMedium').addEventListener('click', () => generatePuzzle('medium'));
document.getElementById('genHard').addEventListener('click', () => generatePuzzle('hard'));
document.getElementById('hintBtn').addEventListener('click', hint);
document.getElementById('checkBtn').addEventListener('click', checkBoard);
document.getElementById('pencilBtn').addEventListener('click', togglePencilMode);
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);

// -----------------------------
// Start with Medium Puzzle
// -----------------------------
generatePuzzle('medium');
