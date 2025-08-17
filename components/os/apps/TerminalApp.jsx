import React from 'react';

export default function TerminalApp(){
  const [lines, setLines] = React.useState([
    'KestrelOS :: pseudo-terminal',
    'Type `help` to list commands. (demo shell)'
  ]);
  const [cmd, setCmd] = React.useState('help');

  const onSubmit = (e) => {
    e.preventDefault();
    const input = cmd.trim();
    let out = '';
    switch(input){
      case 'help': out = 'commands: help, clear, date, whoami'; break;
      case 'clear': setLines([]); setCmd(''); return;
      case 'date': out = new Date().toString(); break;
      case 'whoami': out = 'operator@kestrel'; break;
      default: out = `unknown: ${input}`;
    }
    setLines(prev => [...prev, `> ${input}`, out]);
    setCmd('');
  };

  return (
    <div className="h-full w-full bg-black text-green-400 font-mono text-sm p-3 rounded">
      <div className="overflow-auto h-[calc(100%-2rem)] mb-2 whitespace-pre-wrap">
        {lines.map((l,i)=>(<div key={i}>{l}</div>))}
      </div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <span>&gt;</span>
        <input value={cmd} onChange={e=>setCmd(e.target.value)} className="flex-1 bg-black border border-green-700 rounded px-2 py-1 outline-none"/>
      </form>
    </div>
  );
}
