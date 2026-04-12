

        const inputArea = document.getElementById('json-input');
        const outputArea = document.getElementById('json-output');
        const errorLayer = document.getElementById('error-layer');
        const errorLog = document.getElementById('error-log');

        function syncScroll() { errorLayer.scrollTop = inputArea.scrollTop; errorLayer.scrollLeft = inputArea.scrollLeft; }

        function highlightErrorLine(message) {
            const lines = inputArea.value.split('\n');
            let errorLineNum = -1;
            const match = message.match(/line (\d+)/i) || message.match(/at position (\d+)/i);
            if (match) {
                if (message.includes('line')) errorLineNum = parseInt(match[1]) - 1;
                else {
                    const pos = parseInt(match[1]);
                    errorLineNum = inputArea.value.substr(0, pos).split('\n').length - 1;
                }
            }
            errorLayer.innerHTML = lines.map((line, i) => i === errorLineNum ? `<span class="err-line">${line || ' '}</span>` : line).join('\n');
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

        async function processJSON(mode) {
            const raw = inputArea.value; if (!raw) return;
            const startTime = performance.now();
            errorLayer.innerHTML = '';
            
            try {
                let fixed = smartFix(raw);
                let data;

                // --- NEW POWER MERGE LOGIC ---
                // Fragments ko ek single string bana kar array mein wrap karna
                let wrap = fixed;
                if (!wrap.startsWith('[')) wrap = `[${wrap}]`;
                
                // Parse double array structure if needed
                try {
                    data = JSON.parse(wrap);
                } catch(e) {
                    // Cleaner method: Brackets hata kar fresh wrap
                    let cleaner = fixed.replace(/^\[|\]$/g, '').replace(/\]\s*,?\s*\[/g, ',');
                    data = JSON.parse(`[${cleaner}]`);
                }

                // If Merge or multiple arrays found, flatten them
                if (mode === 'merge' || Array.isArray(data)) {
                    data = data.flat(Infinity);
                }

                if (mode === 'minify') outputArea.textContent = JSON.stringify(data);
                else outputArea.innerHTML = highlight(JSON.stringify(data, null, 4));

                document.getElementById('obj-count').textContent = data.length;
                errorLog.textContent = "Engine: Success";
                errorLog.className = "text-emerald-500";
                document.getElementById('status-dot').className = "w-2 h-2 rounded-full bg-emerald-500";
            } catch (err) {
                errorLog.textContent = "Engine: Error";
                errorLog.className = "text-red-400";
                document.getElementById('status-dot').className = "w-2 h-2 rounded-full bg-red-500";
                highlightErrorLine(err.message);
                outputArea.innerHTML = `<div class="p-4 text-red-400 text-xs"><strong>Parse Error:</strong><br>${err.message}</div>`;
            } finally {
                document.getElementById('process-time').textContent = `${Math.round(performance.now() - startTime)}ms`;
            }
        }

        function clearAll() { inputArea.value = ''; outputArea.innerHTML = ''; errorLayer.innerHTML = ''; document.getElementById('obj-count').textContent = '0'; }
        async function pasteFromClipboard() { inputArea.value = await navigator.clipboard.readText(); syncScroll(); }
        function copyOutput() { navigator.clipboard.writeText(outputArea.innerText); alert("Copied!"); }
        function downloadJSON() { 
            const blob = new Blob([outputArea.innerText], {type: 'application/json'});
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `merged_json_${Date.now()}.json`; a.click();
        }
    