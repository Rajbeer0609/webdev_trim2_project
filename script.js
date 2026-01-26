let questions = [];
let history = [];
let answers = {};
let submitted = false;

function init() {
    const stored = localStorage.getItem('questions');
    questions = stored ? JSON.parse(stored) : [{
        id: 1,
        category: "DOM",
        question: "What method creates DOM elements?",
        options: ["innerHTML", "createElement", "write", "eval"],
        correct: 1,
        explanation: "createElement is the safe and standard way to generate new nodes programmatically."
    }];
    
    const hist = localStorage.getItem('history');
    history = hist ? JSON.parse(hist) : [];
    
    save();
    updateStats();
    updateAdmin();
    updateHistory();
}

function save() {
    localStorage.setItem('questions', JSON.stringify(questions));
    localStorage.setItem('history', JSON.stringify(history));
}

function switchView(view) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[onclick*="${view}"]`).classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(view + '-view').classList.add('active');
}

function updateStats() {
    document.getElementById('total-questions').textContent = questions.length;
}

function addQuestion(e) {
    e.preventDefault();
    const q = {
        id: Date.now(),
        category: document.getElementById('category').value,
        question: document.getElementById('question').value,
        options: [
            document.getElementById('opt0').value,
            document.getElementById('opt1').value,
            document.getElementById('opt2').value,
            document.getElementById('opt3').value
        ],
        correct: parseInt(document.getElementById('correct').value),
        explanation: document.getElementById('explanation').value
    };
    questions.push(q);
    save();
    updateAdmin();
    updateStats();
    showAlert('Question added!');
    document.getElementById('add-form').reset();
}

function deleteQuestion(id) {
    if (confirm('Delete this question?')) {
        questions = questions.filter(q => q.id !== id);
        save();
        updateAdmin();
        updateStats();
        showAlert('Question deleted!');
    }
}

function updateAdmin() {
    const list = document.getElementById('admin-list');
    document.getElementById('q-count').textContent = questions.length;
    
    if (questions.length === 0) {
        list.innerHTML = '<div class="empty-state">No questions yet</div>';
        return;
    }
    
    list.innerHTML = '';
    questions.forEach(q => {
        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <span class="category-badge">${q.category}</span>
                    <p style="margin: 15px 0; font-weight: 600; font-size: 1.1em;">${q.question}</p>
                    <p style="font-size: 14px; color: #555;">Correct Answer: <strong>${q.options[q.correct]}</strong></p>
                </div>
                <button class="btn btn-danger btn-small" onclick="deleteQuestion(${q.id})">Delete</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function showAlert(msg) {
    const alert = document.getElementById('admin-alert');
    alert.className = 'alert alert-success';
    alert.textContent = msg;
    alert.style.display = 'block';
    setTimeout(() => alert.style.display = 'none', 3000);
}

function startQuiz() {
    if (questions.length === 0) {
        alert('No questions available!');
        return;
    }
    answers = {};
    submitted = false;
    document.getElementById('quiz-start').style.display = 'none';
    document.getElementById('quiz-active').style.display = 'block';
    renderQuestions();
}

function renderQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    questions.forEach((q, i) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.dataset.qid = q.id;
        
        const header = document.createElement('div');
        header.className = 'question-header';
        header.innerHTML = `
            <span style="font-weight: 900; font-size: 1.2rem;">#${i + 1}</span>
            <span class="category-badge">${q.category}</span>
        `;
        
        const text = document.createElement('div');
        text.className = 'question-text';
        text.textContent = q.question;
        
        const opts = document.createElement('div');
        opts.className = 'options';
        
        q.options.forEach((opt, idx) => {
            const optDiv = document.createElement('div');
            optDiv.className = 'option';
            optDiv.onclick = () => selectOption(q.id, idx);
            optDiv.dataset.qid = q.id;
            optDiv.dataset.idx = idx;
            
            const label = document.createElement('div');
            label.className = 'option-label';
            label.textContent = String.fromCharCode(65 + idx);
            
            const span = document.createElement('span');
            span.textContent = opt;
            
            optDiv.appendChild(label);
            optDiv.appendChild(span);
            opts.appendChild(optDiv);
        });
        
        card.appendChild(header);
        card.appendChild(text);
        card.appendChild(opts);
        container.appendChild(card);
    });
    
    document.getElementById('submit-btn').style.display = 'block';
}

function selectOption(qid, idx) {
    if (submitted) return;
    const opts = document.querySelectorAll(`.option[data-qid="${qid}"]`);
    opts.forEach(o => o.classList.remove('selected'));
    document.querySelector(`.option[data-qid="${qid}"][data-idx="${idx}"]`).classList.add('selected');
    answers[qid] = idx;
}

function submitQuiz() {
    if (Object.keys(answers).length !== questions.length) {
        alert('Please answer all questions!');
        return;
    }
    
    submitted = true;
    let correct = 0;
    
    questions.forEach(q => {
        const userAns = answers[q.id];
        const isCorrect = userAns === q.correct;
        if (isCorrect) correct++;
        
        const opts = document.querySelectorAll(`.option[data-qid="${q.id}"]`);
        opts.forEach((o, idx) => {
            o.style.cursor = 'default';
            o.onclick = null; // Disable clicking
            if (idx === q.correct) o.classList.add('correct');
            else if (idx === userAns && !isCorrect) o.classList.add('incorrect');
        });
        
        const card = document.querySelector(`.question-card[data-qid="${q.id}"]`);
        const exp = document.createElement('div');
        exp.style.cssText = 'margin-top: 20px; padding: 15px; background: #000; color: #fff; border: 2px solid #000; box-shadow: 4px 4px 0px #888;';
        exp.innerHTML = `<strong style="color: #ffeb3b;">💡 KNOWLEDGE:</strong><br>${q.explanation}`;
        card.appendChild(exp);
    });
    
    const pct = Math.round((correct / questions.length) * 100);
    const results = document.getElementById('quiz-results');
    results.innerHTML = `
        <div class="results-card">
            <h2 style="font-size: 2.5rem; text-transform: uppercase;">Quiz Done!</h2>
            <p style="font-size: 1.5rem; font-weight: bold; margin-bottom: 20px;">Score: ${correct}/${questions.length} (${pct}%)</p>
            <button class="btn" style="background: white; color: black; border: 3px solid black;" onclick="resetQuiz()">Try Again</button>
        </div>
    `;
    
    document.getElementById('submit-btn').style.display = 'none';
    
    history.unshift({
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        total: questions.length,
        correct: correct,
        pct: pct
    });
    save();
    updateHistory();
    window.scrollTo(0, 0);
}

function resetQuiz() {
    document.getElementById('quiz-start').style.display = 'block';
    document.getElementById('quiz-active').style.display = 'none';
    document.getElementById('quiz-results').innerHTML = '';
    document.getElementById('questions-container').innerHTML = '';
}

function updateHistory() {
    const container = document.getElementById('history-container');
    
    if (history.length === 0) {
        container.innerHTML = '<div class="empty-state">No history recorded</div>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'history-table';
    table.innerHTML = `<thead><tr><th>Date</th><th>Score</th><th>%</th></tr></thead><tbody></tbody>`;
    
    const tbody = table.querySelector('tbody');
    history.forEach(h => {
        const row = document.createElement('tr');
        let cls = 'score-poor';
        if (h.pct >= 80) cls = 'score-excellent';
        else if (h.pct >= 60) cls = 'score-good';
        else if (h.pct >= 40) cls = 'score-fair';
        
        row.innerHTML = `
            <td>${h.date}</td>
            <td>${h.correct} / ${h.total}</td>
            <td><span class="score-badge ${cls}">${h.pct}%</span></td>
        `;
        tbody.appendChild(row);
    });
    
    container.innerHTML = '';
    container.appendChild(table);
}

init();