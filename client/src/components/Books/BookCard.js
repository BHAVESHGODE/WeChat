import React from 'react';
import { useNavigate } from 'react-router-dom';

function BookCard({ book }) {
  const navigate = useNavigate();
  const id = book._id || book.id || book.key?.replace('/works/', '');
  const title = book.title || 'Untitled';
  const author = book.author || book.authors?.[0]?.name || 'Unknown';
  const cover = book.coverUrl || book.cover?.medium || book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
    : null;
  const year = book.first_publish_year || book.publishYear;

  return (
    <div className="book-card" onClick={() => navigate(`/books/${id}`)}>
      <div className="book-cover-wrap">
        {cover ? (
          <img src={cover} alt={title} loading="lazy" />
        ) : (
          <div className="book-cover-placeholder">{title[0]}</div>
        )}
      </div>
      <div className="book-info">
        <h4 className="book-title">{title}</h4>
        <p className="book-author">{author}</p>
        {year && <span className="book-year">{year}</span>}
      </div>
    </div>
  );
}

export default BookCard;
