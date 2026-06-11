import React, { useState, useEffect } from 'react';

function StudyWordOfDay() {
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const words = ['serendipity', 'ephemeral', 'resilience', 'eloquence', 'melancholy',
      'ambiguous', 'benevolent', 'candid', 'diligent', 'empathy',
      'gratitude', 'hypothesis', 'inevitable', 'juxtapose', 'lucid',
      'magnanimous', 'nostalgia', 'optimistic', 'paradox', 'quintessential'];
    const today = new Date().toISOString().slice(0, 10);
    const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
    const wordOfDay = words[seed % words.length];

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordOfDay}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          const meaning = entry.meanings?.[0];
          setWord({
            word: entry.word,
            phonetic: entry.phonetic || entry.phonetics?.[0]?.text || '',
            definition: meaning?.definitions?.[0]?.definition || '',
            example: meaning?.definitions?.[0]?.example || '',
            partOfSpeech: meaning?.partOfSpeech || '',
          });
        }
      })
      .catch(() => {
        setWord({
          word: wordOfDay,
          phonetic: '',
          definition: 'Look up this word in your studies today!',
          partOfSpeech: '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div className="sz-quote-card glass-card" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
      <div className="sz-quote-overlay" />
      <div className="sz-quote-content">
        <span className="sz-quote-icon">📖</span>
        <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7, marginBottom: '0.25rem' }}>Word of the Day</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.15rem' }}>{word?.word}</p>
        {word?.phonetic && <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem' }}>{word.phonetic}</p>}
        {word?.partOfSpeech && <p style={{ fontSize: '0.7rem', opacity: 0.5, fontStyle: 'italic', marginBottom: '0.3rem' }}>{word.partOfSpeech}</p>}
        <p style={{ fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.85 }}>"{word?.definition}"</p>
        {word?.example && <p style={{ fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic', marginTop: '0.5rem' }}>e.g. {word.example}</p>}
      </div>
    </div>
  );
}

export default StudyWordOfDay;
