import React from 'react';

function SearchBar({ value, onChange, onSearch, placeholder = 'Search...', filters }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) onSearch();
  };

  return (
    <div className="search-bar glass">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {filters && <div className="search-filters">{filters}</div>}
      {onSearch && (
        <button className="search-btn" onClick={onSearch}>Search</button>
      )}
    </div>
  );
}

export default SearchBar;
