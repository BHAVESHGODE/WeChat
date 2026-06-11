import React from 'react';
import { formatDuration } from '../../utils/formatters';

function VideoCard({ video, onClick, compact = false }) {
  const id = video.id?.videoId || video.videoId || video.id;
  const title = video.snippet?.title || video.title || 'Untitled';
  const channel = video.snippet?.channelTitle || video.artist || 'Unknown';
  const thumb = video.snippet?.thumbnails?.medium?.url || video.thumbnail || video.thumbnails?.default?.url;
  const views = video.statistics?.viewCount || video.views;
  const duration = video.contentDetails?.duration || video.duration;

  const fmtViews = (v) => {
    if (!v) return '';
    const n = parseInt(v);
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div
      className={`video-card ${compact ? 'compact' : ''}`}
      onClick={() => onClick && onClick(id)}
    >
      <div className="video-thumb-wrap">
        <img src={thumb} alt={title} loading="lazy" />
        {duration && <span className="video-duration-badge">{formatDuration(duration)}</span>}
      </div>
      <div className="video-info">
        <h4 className="video-title">{title}</h4>
        <p className="video-channel">{channel}</p>
        {views && <p className="video-views">{fmtViews(views)} views</p>}
      </div>
    </div>
  );
}

export default VideoCard;
