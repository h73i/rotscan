let scanning = false;

function scan() {
    const target = document.getElementById('target').value.trim();
    const scanType = document.getElementById('scan-type').value;
    const results = document.getElementById('results');
    const button = document.querySelector('button');
    
    if (!target) {
        showError('enter target');
        return;
    }
    
    if (scanning) return;
    
    scanning = true;
    button.disabled = true;
    results.innerHTML = '<div class="scanning">scanning ' + target + '...</div>';
    
    fetch('/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            target: target,
            scan_type: scanType
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showError(data.error);
        } else {
            showResults(data.result, target, scanType);
        }
    })
    .catch(error => {
        showError('scan failed: ' + error.message);
    })
    .finally(() => {
        scanning = false;
        button.disabled = false;
    });
}

function showResults(nmapOutput, target, scanType) {
    const results = document.getElementById('results');
    let output = '';
    
    output += `<div class="scan-info">target: ${target} | scan: ${scanType}</div>`;
    
    const lines = nmapOutput.split('\n');
    let openPorts = 0;
    
    lines.forEach(line => {
        if (line.includes('/tcp') || line.includes('/udp')) {
            const portMatch = line.match(/(\d+\/(tcp|udp))\s+(open|closed|filtered)\s*(.*)/);
            if (portMatch) {
                const port = portMatch[1];
                const state = portMatch[3];
                const service = portMatch[4] || '';
                
                let className = 'port-closed';
                if (state === 'open') {
                    className = 'port-open';
                    openPorts++;
                } else if (state === 'filtered') {
                    className = 'port-filtered';
                }
                
                output += `<div class="port-line ${className}">${port.padEnd(12)} ${state.padEnd(10)} ${service}</div>`;
            }
        }
    });
    
    if (openPorts === 0) {
        output += '<div class="port-line">no open ports found</div>';
    }
    
    output += `<div class="scan-info" style="margin-top: 15px; border-top: 1px solid #333; border-bottom: none; padding-top: 10px;">open ports: ${openPorts}</div>`;
    
    results.innerHTML = output;
}

function showError(message) {
    const results = document.getElementById('results');
    results.innerHTML = `<div class="error">${message}</div>`;
}

function exitApp() {
    if (confirm('exit?')) {
        window.close();
        document.body.innerHTML = '<div style="color: #0ff; text-align: center; margin-top: 50px; font-family: Courier New;">closed</div>';
    }
}

document.getElementById('target').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') scan();
});
