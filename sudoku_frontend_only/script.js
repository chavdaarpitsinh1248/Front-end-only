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
// Utility & Status
// -----------------------------
function setStatus(text){
    console.log(text);
}

// -----------------------------
// Render Sudoku Grid
// -----------------------------
function renderGrid(puzzle){
    boardEl.innerHTML = '';
    for(let r=0;r<SIZE;r++){
        for(let c=0;c<SIZE;c++){
            const val = puzzle[r][c];
            const cell = document.createElement('div');
            cell.className='cell';

            // Bold borders
            if((c+1)%3===0) cell.classList.add('box-right');
            if(c%3===0) cell.classList.add('box-left');
            if((r+1)%3===0) cell.classList.add('box-bottom');
            if(r%3===0) cell.classList.add('box-top');

            const input = document.createElement('input');
            input.type='text';
            input.maxLength=1;
            input.dataset.r=r;
            input.dataset.c=c;
            input.dataset.pencils=''; // store pencil numbers

            if(val!==0){
                input.value=val;
                input.readOnly=true;
                cell.classList.add('clue','given');
            }

            cell.appendChild(input);
            boardEl.appendChild(cell);
        }
    }
}

// -----------------------------
// Fill Board UI
// -----------------------------
function fillUI(board){
    boardEl.querySelectorAll('input').forEach(inp=>{
        const r=parseInt(inp.dataset.r);
        const c=parseInt(inp.dataset.c);
        inp.value=board[r][c]===0?'':board[r][c];
        inp.dataset.pencils=''; // clear pencil numbers
        inp.style.fontSize='18px';
    });
}

// -----------------------------
// Generate Puzzle (Pure JS)
// -----------------------------
function generatePuzzle(difficulty='medium'){
    // Simple generator: full solved + remove cells
    currentSolution = generateSolved();
    currentPuzzle = currentSolution.map(row => row.slice());

    let clues = {"easy":46,"medium":40,"hard":32}[difficulty]||40;
    let toRemove = SIZE*SIZE - clues;
    while(toRemove>0){
        let r=Math.floor(Math.random()*SIZE);
        let c=Math.floor(Math.random()*SIZE);
        if(currentPuzzle[r][c]!==0){
            currentPuzzle[r][c]=0;
            toRemove--;
        }
    }

    mistakes=0;
    document.getElementById('mistakes').textContent=`Mistakes: ${mistakes}`;
    renderGrid(currentPuzzle);
    startTimer();
    history=[];
    redoStack=[];
    pushHistory();
    setStatus(`Puzzle generated (${difficulty})`);
}

// -----------------------------
// Solve / Hint
// -----------------------------
function solveShow(){
    if(!currentSolution) return;
    fillUI(currentSolution);
}

function hint(){
    if(!currentSolution) return;
    for(let r=0;r<SIZE;r++){
        for(let c=0;c<SIZE;c++){
            const inp=boardEl.querySelector(`input[data-r="${r}"][data-c="${c}"]`);
            if(inp && inp.value===''){
                inp.value=currentSolution[r][c];
                inp.readOnly=true;
                inp.parentElement.classList.add('clue','given');
                inp.style.background='rgba(0,200,0,0.5)';
                setTimeout(()=>inp.style.background='',500);
                pushHistory();
                return;
            }
        }
    }
}

// -----------------------------
// Check Board
// -----------------------------
function checkBoard(){
    if(!currentSolution) return;
    boardEl.querySelectorAll('input').forEach(inp=>{
        const r=parseInt(inp.dataset.r);
        const c=parseInt(inp.dataset.c);
        const val=parseInt(inp.value);
        inp.style.background='';
        if(!isNaN(val) && val!==currentSolution[r][c]){
            inp.style.background='rgba(255,100,100,0.5)';
        }
    });
}

// -----------------------------
// Pencil Mode Toggle
// -----------------------------
function togglePencilMode(){
    pencilMode=!pencilMode;
    const btn=document.getElementById('pencilBtn');
    btn.style.background=pencilMode?'#2b7cff':'';
}

// -----------------------------
// Undo / Redo
// -----------------------------
function getCurrentBoardState(){
    const board=Array.from({length:SIZE},()=>Array(SIZE).fill(''));
    boardEl.querySelectorAll('input').forEach(inp=>{
        const r=parseInt(inp.dataset.r);
        const c=parseInt(inp.dataset.c);
        board[r][c]=inp.value;
        inp.dataset.pencils ? inp.dataset.pencils.split('') : [];
    });
    return board.map(row=>row.slice());
}

function pushHistory(){
    history.push(getCurrentBoardState());
    redoStack=[];
}

function fillBoardFromState(state){
    boardEl.querySelectorAll('input').forEach(inp=>{
        const r=parseInt(inp.dataset.r);
        const c=parseInt(inp.dataset.c);
        inp.value=state[r][c];
        inp.dataset.pencils='';
        inp.style.fontSize=inp.value===''?'18px':'18px';
    });
}

function undo(){
    if(history.length<2) return;
    redoStack.push(history.pop());
    fillBoardFromState(history[history.length-1]);
}

function redo(){
    if(redoStack.length===0) return;
    const nextState=redoStack.pop();
    history.push(nextState);
    fillBoardFromState(nextState);
}

// -----------------------------
// Timer
// -----------------------------
function startTimer(){
    if(timerInterval) clearInterval(timerInterval);
    seconds=0;
    timerInterval=setInterval(()=>{
        seconds++;
        const min=String(Math.floor(seconds/60)).padStart(2,'0');
        const sec=String(seconds%60).padStart(2,'0');
        document.getElementById('timer') ? document.getElementById('timer').textContent=`Time: ${min}:${sec}` : null;
    },1000);
}

function stopTimer(){
    if(timerInterval) clearInterval(timerInterval);
}

// -----------------------------
// Puzzle Completion
// -----------------------------
function isSolved(){
    if(!currentSolution) return false;
    for(let r=0;r<SIZE;r++){
        for(let c=0;c<SIZE;c++){
            const inp=boardEl.querySelector(`input[data-r="${r}"][data-c="${c}"]`);
            if(!inp || parseInt(inp.value)!==currentSolution[r][c]) return false;
        }
    }
    return true;
}

function checkCompletion(){
    stopTimer();
    alert(`🎉 Congratulations! Solved in ${seconds} sec with ${mistakes} mistakes.`);
}

// -----------------------------
// Input Handler with Pencil Support
// -----------------------------
boardEl.addEventListener('keydown',e=>{
    const inp=e.target;
    if(inp.tagName!=='INPUT') return;
    const key=e.key;
    if(!/^[1-9]$/.test(key)) return;

    const r=parseInt(inp.dataset.r), c=parseInt(inp.dataset.c);

    if(pencilMode){
        let pencils=inp.dataset.pencils ? inp.dataset.pencils.split('') : [];
        if(pencils.includes(key)){
            pencils=pencils.filter(x=>x!==key);
        } else {
            pencils.push(key);
            pencils.sort();
        }
        inp.dataset.pencils=pencils.join('');
        renderPencil(inp,pencils);
        e.preventDefault();
    } else {
        inp.value=key;
        inp.dataset.pencils='';
        inp.style.fontSize='18px';
        inp.style.background='';
        pushHistory();

        if(currentSolution && parseInt(key)!==currentSolution[r][c]){
            mistakes++;
            document.getElementById('mistakes').textContent=`Mistakes: ${mistakes}`;
            inp.style.background='rgba(255,100,100,0.5)';
        }

        if(isSolved()) checkCompletion();
    }
});

// Render pencil numbers
function renderPencil(inp,pencils){
    if(pencils.length===0){
        inp.value='';
        inp.style.fontSize='18px';
    } else {
        inp.value=pencils.join('');
        inp.style.fontSize='10px';
    }
}

// -----------------------------
// Generate Solved Sudoku (Backtracking)
function generateSolved(){
    const board=Array.from({length:SIZE},()=>Array(SIZE).fill(0));
    function isValid(board,r,c,val){
        for(let i=0;i<SIZE;i++){
            if(board[r][i]===val || board[i][c]===val) return false;
        }
        let br=Math.floor(r/3)*3, bc=Math.floor(c/3)*3;
        for(let i=0;i<3;i++) for(let j=0;j<3;j++){
            if(board[br+i][bc+j]===val) return false;
        }
        return true;
    }
    function backtrack(pos=0){
        if(pos===SIZE*SIZE) return true;
        let r=Math.floor(pos/SIZE), c=pos%SIZE;
        if(board[r][c]!==0) return backtrack(pos+1);
        let nums=[1,2,3,4,5,6,7,8,9];
        nums.sort(()=>Math.random()-0.5);
        for(let n of nums){
            if(isValid(board,r,c,n)){
                board[r][c]=n;
                if(backtrack(pos+1)) return true;
                board[r][c]=0;
            }
        }
        return false;
    }
    backtrack();
    return board;
}

// -----------------------------
// Event Listeners
// -----------------------------
document.getElementById('genEasy').addEventListener('click',()=>generatePuzzle('easy'));
document.getElementById('genMedium').addEventListener('click',()=>generatePuzzle('medium'));
document.getElementById('genHard').addEventListener('click',()=>generatePuzzle('hard'));
document.getElementById('hintBtn').addEventListener('click',hint);
document.getElementById('checkBtn').addEventListener('click',checkBoard);
document.getElementById('pencilBtn').addEventListener('click',togglePencilMode);
document.getElementById('undoBtn').addEventListener('click',undo);
document.getElementById('redoBtn').addEventListener('click',redo);

// -----------------------------
// Start Puzzle
// -----------------------------
generatePuzzle('medium');
