from flask import Flask, render_template, request, jsonify
import subprocess
import re
import os

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/scan', methods=['POST'])
def scan():
    data = request.get_json()
    target = data.get('target')
    scan_type = data.get('scan_type', '-sS')
    
    if not target:
        return jsonify({'error': 'target required'}), 400
    
    if not is_valid_target(target):
        return jsonify({'error': 'invalid target'}), 400
    
    try:
        result = run_nmap(target, scan_type)
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def is_valid_target(target):
    ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    domain_pattern = r'^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(ip_pattern, target) or re.match(domain_pattern, target))

def run_nmap(target, scan_type):
    
    if os.geteuid() == 0:
        
        cmd = ['nmap', scan_type, '--top-ports', '1000', target]
    else:
       
        cmd = ['sudo', 'nmap', scan_type, '--top-ports', '1000', target]
    
    
    if scan_type == '-sU':
        if os.geteuid() == 0:
            cmd = ['nmap', scan_type, '--top-ports', '100', target]
        else:
            cmd = ['sudo', 'nmap', scan_type, '--top-ports', '100', target]
    
    try:
        process = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if process.returncode != 0:
            
            if 'sudo' in cmd and scan_type in ['-sT']:
                cmd_no_sudo = cmd[1:]  
                process = subprocess.run(cmd_no_sudo, capture_output=True, text=True, timeout=120)
                if process.returncode != 0:
                    raise Exception(f'nmap failed: {process.stderr}')
            else:
                raise Exception(f'nmap failed: {process.stderr}')
        
        return process.stdout
        
    except subprocess.TimeoutExpired:
        raise Exception('scan timeout - try a smaller port range')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
