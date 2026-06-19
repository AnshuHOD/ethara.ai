import React, { useState, useRef, useEffect } from 'react';

export default function AIChat({ onSendQuery }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I am your AI Inventory Assistant. Ask me questions about the inventory in plain English (e.g., *'What products are low on stock?'* or *'What is our total stock valuation?'*). How can I help you today?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.strip && !query.trim()) return;

    // Add user message to state
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const reply = await onSendQuery(query);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `⚠️ **Error connecting to assistant backend.**\n\nDetail: ${err.message || err}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick Preset Queries
  const presets = [
    "Which products are low on stock?",
    "What is the total value of our inventory?",
    "How many items are in total?",
    "Summarize our stock in the Electronics category."
  ];

  return (
    <div className="glass-panel animate-fade-in" style={{
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      height: 'calc(100vh - 180px)',
      minHeight: '480px',
      overflow: 'hidden'
    }}>
      
      {/* Chat Container Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.01)'
      }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '600' }}>AI Assistant Interface</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Natural Language Processing (Gemini API / Local Fallback)
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-success)', boxShadow: '0 0 8px var(--status-success)' }}></div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase' }}>Online</span>
        </div>
      </div>

      {/* Messages Body */}
      <div style={{
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} style={{
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              animation: 'fadeIn 0.25s ease-out'
            }}>
              
              <div style={{
                maxWidth: '75%',
                padding: '12px 18px',
                borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                background: isUser ? 'var(--grad-primary)' : 'rgba(255,255,255,0.03)',
                border: isUser ? 'none' : '1px solid var(--border-color)',
                color: isUser ? '#fff' : 'var(--text-primary)',
                fontSize: '14px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                boxShadow: isUser ? '0 4px 12px rgba(139, 92, 246, 0.15)' : 'none'
              }}>
                {/* Parse Markdown-like tags (bold, lists) */}
                {msg.text.split('\n').map((line, i) => {
                  let formattedLine = line;
                  
                  // Simple bold parser: **text**
                  const boldRegex = /\*\*(.*?)\*\*/g;
                  const parts = [];
                  let lastIndex = 0;
                  let match;
                  
                  while ((match = boldRegex.exec(line)) !== null) {
                    if (match.index > lastIndex) {
                      parts.push(line.substring(lastIndex, match.index));
                    }
                    parts.push(<strong key={match.index}>{match[1]}</strong>);
                    lastIndex = boldRegex.lastIndex;
                  }
                  if (lastIndex < line.length) {
                    parts.push(line.substring(lastIndex));
                  }

                  const content = parts.length > 0 ? parts : formattedLine;

                  // Simple list indicator
                  if (line.startsWith('- ')) {
                    return (
                      <div key={i} style={{ paddingLeft: '12px', position: 'relative', margin: '4px 0' }}>
                        <span style={{ position: 'absolute', left: 0, color: isUser ? '#fff' : 'var(--accent-violet)' }}>•</span>
                        {line.substring(2)}
                      </div>
                    );
                  }
                  
                  return <div key={i} style={{ minHeight: '1.2em' }}>{content}</div>;
                })}
              </div>

            </div>
          );
        })}

        {/* Loading bubble */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 18px',
              borderRadius: '16px 16px 16px 2px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span className="animate-fade-in" style={{ fontSize: '14px' }}>AI is thinking</span>
              <span style={{ display: 'inline-flex', gap: '3px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse-slow 1s infinite' }}></span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse-slow 1s infinite 0.2s' }}></span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse-slow 1s infinite 0.4s' }}></span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray & Presets */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        
        {/* Preset Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {presets.map((preset, i) => (
            <button
              key={i}
              onClick={() => handleSend(preset)}
              disabled={isLoading}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Text Input Block */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Type your inventory question..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            style={{ flexGrow: 1, padding: '14px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputText.trim()}
            className="btn btn-primary"
            style={{ width: '100px' }}
          >
            Send
          </button>
        </div>

      </div>

    </div>
  );
}
