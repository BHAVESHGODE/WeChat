import React, { useState } from 'react';

const quotes = [
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
];

function Quotes() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((prev) => (prev + 1) % quotes.length);

  return (
    <div className="study-card quotes-card">
      <h2 className="study-card-title">💡 Quote of the Moment</h2>
      <p className="quote-text">"{quotes[index].text}"</p>
      <p className="quote-author">— {quotes[index].author}</p>
      <button className="study-btn quote-btn" onClick={next}>
        ✨ Next Quote
      </button>
    </div>
  );
}

export default Quotes;
