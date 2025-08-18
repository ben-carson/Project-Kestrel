//networktopology/sidebar/panels/ConfigPanel.jsx
import React, { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * A reusable component for displaying code with basic syntax highlighting.
 * @param {{ code: string; language: string; }} props
 */
const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const highlightedCode = useMemo(() => {
    let tempCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Basic syntax highlighting rules
    tempCode = tempCode.replace(/(['"`])(.*?)\1/g, '<span class="text-green-400">$1$2$1</span>'); // Strings
    tempCode = tempCode.replace(/\b(version|services|web|image|ports|volumes|api|build|environment|db|user|worker_processes|error_log|pid|events|worker_connections|http|include|default_type|server|listen|server_name|location|proxy_pass|proxy_set_header|Host|DATABASE_URL|POSTGRES_USER|POSTGRES_PASSWORD)\b/g, '<span class="text-cyan-400">$1</span>'); // Keywords (YAML/Nginx)
    tempCode = tempCode.replace(/(#.*$)/gm, '<span class="text-slate-500">$1</span>'); // Comments
    tempCode = tempCode.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>'); // Numbers
    tempCode = tempCode.replace(/(\s+)([a-zA-Z0-9_-]+)(:)/g, '$1<span class="text-purple-400">$2</span>$3'); // YAML keys

    return tempCode;
  }, [code, language]);

  const handleCopy = () => {
    const textArea = document.createElement('textarea');
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="bg-slate-800/70 rounded-lg overflow-hidden relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-slate-700/50 rounded-md text-slate-400 hover:bg-slate-600/80 hover:text-slate-200 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Copy code"
      >
        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
      </button>
      <pre className="p-4 text-sm text-slate-300 overflow-x-auto">
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    </div>
  );
};

/**
 * A panel to display and manage system configurations.
 * @param {{ isLoading: boolean; configs: Record<string, string>; }} props
 */
export default function ConfigPanel({ isLoading, configs }) {
  const [activeTab, setActiveTab] = useState(Object.keys(configs)[0] || '');

  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 flex items-center justify-center">
        <div className="text-slate-400">Loading Configurations...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg shadow-2xl text-slate-300">
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Running Configuration</h2>
        <p className="text-sm text-slate-400">Live configurations from the environment.</p>
      </div>
      
      <div className="flex-shrink-0 px-4 border-b border-white/10">
        <div className="flex space-x-4 -mb-px">
          {Object.keys(configs).map(name => (
            <button
              key={name}
              onClick={() => setActiveTab(name)}
              className={`py-2 px-1 text-sm font-medium transition-colors duration-200 border-b-2 ${
                activeTab === name
                  ? 'text-sky-400 border-sky-400'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        {activeTab && configs[activeTab] ? (
          <CodeBlock code={configs[activeTab]} language={activeTab.split('.').pop() || 'bash'} />
        ) : (
          <div className="text-slate-500">No configuration selected.</div>
        )}
      </div>
    </div>
  );
};
