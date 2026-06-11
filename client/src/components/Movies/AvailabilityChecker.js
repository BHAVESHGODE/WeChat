import React, { useState } from 'react';

const REGIONS = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
];

function AvailabilityChecker({ availability = [], initialRegion = 'IN' }) {
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);

  const regionAvailability = availability.filter(
    (item) => item.region.toUpperCase() === selectedRegion.toUpperCase()
  );

  return (
    <div className="availability-checker-panel glass-panel">
      <div className="availability-header">
        <h4 className="availability-title">🎵 Streaming Availability</h4>
        <div className="region-selector-buttons">
          {REGIONS.map((r) => (
            <button
              key={r.code}
              className={`region-btn ${selectedRegion === r.code ? 'active' : ''}`}
              onClick={() => setSelectedRegion(r.code)}
              title={`View availability in ${r.name}`}
            >
              <span className="region-flag">{r.flag}</span>
              <span className="region-code">{r.code}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="availability-platforms-list">
        {regionAvailability.length > 0 ? (
          regionAvailability.map((platform, idx) => (
            <a
              key={idx}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="platform-link-card"
            >
              {platform.logoUrl ? (
                <img
                  src={platform.logoUrl}
                  alt={platform.platform}
                  className="platform-logo"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : null}
              <div className="platform-info">
                <span className="platform-name">{platform.platform}</span>
                <span className="platform-watch-tag">Watch Now ↗</span>
              </div>
            </a>
          ))
        ) : (
          <div className="no-availability-message">
            <span className="no-stream-icon">🚫</span>
            <p>Not streaming in {REGIONS.find((r) => r.code === selectedRegion)?.name} currently.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AvailabilityChecker;
