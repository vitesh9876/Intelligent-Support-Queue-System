import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://intelligent-support-queue-system.onrender.com');

function App() {
  const [queue, setQueue] = useState([]);
  const [agents, setAgents] = useState([]);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentSpec, setNewAgentSpec] = useState('Billing');

  useEffect(() => {
    socket.on('queue_update', (data) => {
      setQueue(data);
    });

    socket.on('agent_update', () => {
      fetchAgents();
    });

    fetchAgents();

    return () => {
      socket.off('queue_update');
      socket.off('agent_update');
    }
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch('https://intelligent-support-queue-system.onrender.com/api/agents');
      const data = await res.json();
      setAgents(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    try {
      await fetch('https://intelligent-support-queue-system.onrender.com/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAgentName, specialization: newAgentSpec })
      });
      setNewAgentName('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssign = (agentId, ticketId) => {
    socket.emit('assign_ticket', { agentId, ticketId });
  };

  const handleResolve = (agentId) => {
    socket.emit('resolve_ticket', agentId);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700/50">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Support Admin Dashboard</h1>
            <p className="text-slate-400 mt-1">Real-time Intelligent Queue System</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-medium text-slate-300">Live Backend Connected</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-slate-200">Active Agents</h2>

              <div className="space-y-4">
                {agents.map(agent => (
                  <div key={agent._id} className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30 transition-all hover:bg-slate-700/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-white">{agent.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${agent.specialization === 'Billing' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                          {agent.specialization}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${agent.isAvailable ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {agent.isAvailable ? 'Available' : 'Busy'}
                      </span>
                    </div>

                    {!agent.isAvailable && agent.currentTicket && (
                      <div className="mt-3 p-3 bg-slate-800/80 rounded-lg text-sm">
                        <div className="text-slate-400 text-xs mb-1">Current Ticket:</div>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-slate-300">{agent.currentTicket._id.substring(0, 6)}...</span>
                          <button
                            onClick={() => handleResolve(agent._id)}
                            className="text-xs bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    )}

                    {agent.isAvailable && (
                      <div className="mt-3 border-t border-slate-600/30 pt-3">
                        <p className="text-xs text-slate-400 mb-2">Assign top priority ticket:</p>
                        <div className="flex flex-wrap gap-2">
                          {queue.filter(t => t.type === agent.specialization).slice(0, 2).map(ticket => (
                            <button
                              key={ticket._id}
                              onClick={() => handleAssign(agent._id, ticket._id)}
                              className="text-xs bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Take {ticket._id.substring(0, 4)}
                            </button>
                          ))}
                          {queue.filter(t => t.type === agent.specialization).length === 0 && (
                            <span className="text-xs text-slate-500">No matching tickets in queue</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {agents.length === 0 && (
                  <div className="text-center p-4 text-slate-500 text-sm">No agents registered</div>
                )}
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-slate-200">Add New Agent</h2>
              <form onSubmit={handleAddAgent} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Name</label>
                  <input
                    required
                    type="text"
                    value={newAgentName}
                    onChange={e => setNewAgentName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors text-white placeholder-slate-500"
                    placeholder="Agent Name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Specialization</label>
                  <select
                    value={newAgentSpec}
                    onChange={e => setNewAgentSpec(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors text-white"
                  >
                    <option value="Billing">Billing</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 cursor-pointer text-white font-medium py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                  Add Agent
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-200">Live Support Queue</h2>
                <span className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-600">
                  {queue.length} Waiting
                </span>
              </div>

              <div className="space-y-3">
                {queue.map((ticket, index) => (
                  <div
                    key={ticket._id}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg ${index === 0 ? 'bg-amber-500 text-amber-950 shadow-amber-500/20' :
                        index < 3 ? 'bg-blue-500 text-blue-950 shadow-blue-500/20' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-slate-300">{ticket._id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${ticket.type === 'Billing' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                            }`}>
                            {ticket.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Wait Time: {Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 60000)}m
                          <span className="mx-2">•</span>
                          Customer: {ticket.customerId}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 items-center text-right">
                      <div className="hidden sm:block">
                        <div className="text-xs text-slate-400">Priority Score</div>
                        <div className="text-lg font-mono text-emerald-400">{ticket.currentPriority?.toFixed(1)}</div>
                      </div>
                      <div className="hidden sm:block">
                        <div className="text-xs text-slate-400">Displaced</div>
                        <div className={`text-lg font-mono ${ticket.displacementCount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                          {ticket.displacementCount}/3
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {queue.length === 0 && (
                  <div className="text-center p-12 bg-slate-900/30 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center">
                    <div className="text-4xl mb-4">🎉</div>
                    <h3 className="text-lg font-medium text-slate-300">Queue is empty</h3>
                    <p className="text-sm text-slate-500 mt-1">All customers have been assisted.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
