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
            // MERGE ya SHUFFLE ke liye: Direct parse bina kisi modification ke
            // User ka raw input hi parse hoga taaki LaTeX safe rahe
            data = JSON.parse(raw); 
            
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
