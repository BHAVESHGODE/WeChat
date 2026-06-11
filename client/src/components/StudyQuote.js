import React, { useState } from 'react';

const QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'You don\'t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  { text: 'Small progress is still progress.', author: 'Unknown' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
  { text: 'Your only limit is your mind.', author: 'Unknown' },
  { text: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
  { text: 'The mind is not a vessel to be filled but a fire to be kindled.', author: 'Plutarch' },
];

const GRADIENTS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
];

function StudyQuote() {
  const today = new Date().toISOString().slice(0, 10);
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
  const [index] = useState(seed % QUOTES.length);
  const [gradient] = useState(GRADIENTS[seed % GRADIENTS.length]);

  const quote = QUOTES[index];

  return (
    <div className="sz-quote-card glass-card" style={{ background: gradient }}>
      <div className="sz-quote-overlay" />
      <div className="sz-quote-content">
        <span className="sz-quote-icon">💡</span>
        <p className="sz-quote-text">"{quote.text}"</p>
        <p className="sz-quote-author">— {quote.author}</p>
        <span className="sz-quote-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
      </div>
    </div>
  );
}

export default StudyQuote;
