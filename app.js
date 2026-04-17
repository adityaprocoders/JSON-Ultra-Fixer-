        const inputArea = document.getElementById('json-input');
        const outputArea = document.getElementById('json-output');
        const errorLayer = document.getElementById('error-layer');
        const errorLog = document.getElementById('error-log');
        
// 1. PERFECT SCROLL SYNC
function syncScroll() {
    // requestAnimationFrame ensures the sync happens before the next repaint
    requestAnimationFrame(() => {
        errorLayer.scrollTop = inputArea.scrollTop;
        errorLayer.scrollLeft = inputArea.scrollLeft;
    });
}

// 2. LIVE ERROR CHECKING
inputArea.addEventListener('input', () => {
    syncScroll();
    const raw = inputArea.value;
    
    if (!raw.trim()) {
        errorLayer.innerHTML = '';
        updateStatus("Idle", "emerald");
        return;
    }

    try {
        // Sirf check karne ke liye parse karo
        JSON.parse(smartFix(raw)); 
        
        // Agar yahan tak pahunche, matlab error nahi hai!
        errorLayer.innerHTML = ''; 
        updateStatus("Success", "emerald");
    } catch (err) {
        // Agar typing ke waqt error hai, toh engine error dikhaye par status yellow rakhe (Typing...)
        updateStatus("Typing...", "amber");
        highlightErrorLine(err.message);
    }
});

function updateStatus(msg, colorCode) {
    const dot = document.getElementById('status-dot');
    const log = document.getElementById('error-log');
    
    log.textContent = `Engine: ${msg}`;
    
    if (colorCode === "emerald") {
        log.className = "text-emerald-500";
        dot.className = "w-2 h-2 rounded-full bg-emerald-500";
    } else if (colorCode === "red") {
        log.className = "text-red-400";
        dot.className = "w-2 h-2 rounded-full bg-red-500";
    } else {
        log.className = "text-amber-400";
        dot.className = "w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#fbbf24]";
    }
}

function highlightErrorLine(message) {
    const lines = inputArea.value.split('\n');
    let errorLineNum = -1;
    
    // Position nikalne ka accurate tareeka
    const match = message.match(/at position (\d+)/i);
    if (match) {
        const pos = parseInt(match[1]);
        errorLineNum = inputArea.value.substr(0, pos).split('\n').length - 1;
    } else {
        const lineMatch = message.match(/line (\d+)/i);
        if (lineMatch) errorLineNum = parseInt(lineMatch[1]) - 1;
    }

    // Layer mein sirf error wali line ko highlight karo, baaki space
    errorLayer.innerHTML = lines.map((line, i) => 
        i === errorLineNum ? `<span class="err-line">${line || ' '}</span>` : line
    ).join('\n') + '\n\n'; // Extra padding for scroll
}

        // --- APKA LOGIC (IMPROVED FOR MERGE) ---
        function smartFix(text) {
            let fixed = text.trim();
            fixed = fixed.replace(/("|\d|true|false|null|\]|\})\s*\n*\s*"/g, '$1, "');
            fixed = fixed.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
            fixed = fixed.replace(/,\s*([}\]])/g, '$1');
            fixed = fixed.replace(/}\s*{/g, '},{');
            fixed = fixed.replace(/]\s*\[/g, '],[');
            fixed = fixed.replace(/}\s*\[/g, '},[');
            fixed = fixed.replace(/]\s*{/g, '],{');
            return fixed;
        }

        function highlight(json) {
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, m => {
                let cls = 'json-number';
                if (/^"/.test(m)) cls = /:$/.test(m) ? 'json-key' : 'json-string';
                else if (/true|false/.test(m)) cls = 'json-boolean';
                return `<span class="${cls}">${m}</span>`;
            });
        }


        // 1. Shuffle Logic (Ise script mein sabse upar rakhein)
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// 2. Main Process Function
async function processJSON(mode) {
    const raw = inputArea.value; 
    if (!raw) return;
    const startTime = performance.now();
    errorLayer.innerHTML = '';
    
    try {
        let data;
        
        // Mode 'fix' hai tabhi smartFix chalega
        if (mode === 'fix') {
            let fixed = smartFix(raw);
            let wrap = fixed.startsWith('[') ? fixed : `[${fixed}]`;
            data = JSON.parse(wrap);
            // After fixing, output formatted JSON
            outputArea.innerHTML = highlight(JSON.stringify(data.flat(Infinity), null, 4));
        } else {
            let mergedRaw = raw.replace(/\]\s*\[/g, ',');
            data = JSON.parse(mergedRaw);
            
            if (mode === 'shuffle') {
                data = shuffleArray([...data.flat(Infinity)]);
            } else {
                data = data.flat(Infinity);
            }

            if (mode === 'minify') {
                outputArea.textContent = JSON.stringify(data);
            } else {
                // Highlighting use karein ya direct text as per requirement
                outputArea.innerHTML = highlight(JSON.stringify(data, null, 4));
            }
        }

        document.getElementById('obj-count').textContent = Array.isArray(data) ? data.length : 1;
        updateStatus("Success", "emerald");

    } catch (err) {
        console.error("JSON Error:", err);
        updateStatus("Error", "red");
        highlightErrorLine(err.message);
    } finally {
        document.getElementById('process-time').textContent = `${Math.round(performance.now() - startTime)}ms`;
    }
}

     function copyOutput() {
    const text = outputArea.innerText;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('copy-toast');
        const btn = document.getElementById('copy-btn');
        
        toast.classList.add('show');
        // Icon + Text update
        btn.innerHTML = '<i class="fa-solid fa-check"></i> DONE!';
        btn.style.color = "#10b981";

        setTimeout(() => {
            toast.classList.remove('show');
            // Wapas purana Icon + Text
            btn.innerHTML = '<i class="fa-solid fa-copy"></i> COPY';
            btn.style.color = "";
        }, 2000);
    });
}
 
        function clearAll() { inputArea.value = ''; outputArea.innerHTML = ''; errorLayer.innerHTML = ''; document.getElementById('obj-count').textContent = '0'; }
        async function pasteFromClipboard() { inputArea.value = await navigator.clipboard.readText(); syncScroll(); }
      
        function downloadJSON() { 
            const blob = new Blob([outputArea.innerText], {type: 'application/json'});
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `merged_json_${Date.now()}.json`; a.click();
        }










// --- MODAL CONTROLS ---
let currentDivideMode = 'smart';

function switchMode(mode) {
    currentDivideMode = mode;
    const isSmart = mode === 'smart';
    document.getElementById('smartInputs').style.display = isSmart ? 'block' : 'none';
    document.getElementById('rangeInputs').style.display = isSmart ? 'none' : 'block';
    
    // UI Visuals
    document.getElementById('btnSmart').style.borderBottom = isSmart ? '2px solid #3b82f6' : 'none';
    document.getElementById('btnRange').style.borderBottom = isSmart ? 'none' : '2px solid #3b82f6';
}

function openDivideModal() {
    document.getElementById('divideModal').style.display = 'flex';
}

function closeDivideModal() {
    document.getElementById('divideModal').style.display = 'none';
}


function smartDivideLogic(data, numParts, itemsPer) {
    let parts = [];
    let pointer = 0;
    for (let i = 0; i < numParts; i++) {
        if (pointer >= data.length) break;
        let chunk;
        if (i === numParts - 1) {
            chunk = data.slice(pointer); // Last part gets remainder
        } else {
            chunk = data.slice(pointer, pointer + itemsPer); // N-1 parts fix
        }
        parts.push(chunk);
        pointer += chunk.length;
    }
    return parts;
}

function renderDivideOutput(parts) {
    const container = document.getElementById('json-output'); // Check kar lena ye ID sahi ho
    container.innerHTML = '';
    
    // Grid Setup: Mobile(1), Tablet(2), Large Desktop(3)
    container.className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4 animate-in fade-in duration-500";

    parts.forEach((p, index) => {
        const card = document.createElement('div');
        // Glassmorphism classes + Shadow
        card.className = "group relative flex flex-col bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 shadow-xl";
        
        card.innerHTML = `
            <div class="sticky top-0 z-10 flex justify-between items-center px-4 py-3 bg-white/5 backdrop-blur-lg border-b border-white/5">
                <div class="flex flex-col">
                    <span class="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Segment</span>
                    <span class="text-blue-400 font-bold text-sm">PART ${index + 1} <span class="text-zinc-600 ml-1">(${p.length} Items)</span></span>
                </div>
                <button onclick="copyChunk(this)" class="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/20">
                    <i class="fa-solid fa-copy"></i> COPY
                </button>
            </div>

            <div class="p-4 overflow-hidden">
                <pre class="custom-scroll text-[12px] text-zinc-300 overflow-auto max-h-[350px] font-mono leading-relaxed">${highlight(JSON.stringify(p, null, 2))}</pre>
            </div>

            <div class="h-1 w-0 group-hover:w-full bg-blue-500 transition-all duration-500"></div>
        `;
        container.appendChild(card);
    });
}

// Chunks copy karne ke liye helper function
function copyChunk(btn) {
    const text = btn.parentElement.nextElementSibling.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> COPIED!';
        btn.classList.replace('text-blue-400', 'text-emerald-400');
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.replace('text-emerald-400', 'text-blue-400');
        }, 1500);
    });
}

async function executeDivideLogic() {
    const raw = inputArea.value.trim();
    if (!raw) return;

    try {
        // Sirf parse kar rahe hain divide karne ke liye, original data ko preserve rakhenge
        let data = JSON.parse(raw); 
        
        // Ensure it's an array
        if (!Array.isArray(data)) {
            data = [data];
        }

        const numParts = parseInt(document.getElementById('smartParts').value) || 1;
        const itemsPer = parseInt(document.getElementById('smartItems').value) || 1;
        
        let parts = [];
        let pointer = 0;

        for (let i = 0; i < numParts; i++) {
            if (pointer >= data.length) break;
            
            let chunk;
            if (i === numParts - 1) {
                chunk = data.slice(pointer); // Bacha hua sara data
            } else {
                chunk = data.slice(pointer, pointer + itemsPer);
            }
            
            if (chunk.length > 0) {
                parts.push(chunk);
                pointer += chunk.length;
            }
        }

        renderDivideOutput(parts);
        closeDivideModal();
        updateStatus("Divided (Original Format)", "emerald");

    } catch (err) {
        // Agar JSON kharab hai toh error dikhayega, kuch fix nahi karega apne aap
        updateStatus("Invalid JSON", "red");
        alert("JSON format galat hai. Pehle Fix button use kar ya syntax sahi kar.");
    }
}
