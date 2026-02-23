import type { Episode } from '../api';

export default function EpisodeRow({
  episode,
  onToggle,
  disabled = false
}: {
  episode: Episode;
  onToggle: (episodeId: number, watched: boolean) => void;
  disabled?: boolean;
}) {
  const controlId = `episode-${episode.id}`;

  return (
    <div className="episode-row">
      <label htmlFor={controlId} className="episode-row__toggle">
        <input
          id={controlId}
          type="checkbox"
          checked={episode.watched}
          disabled={disabled}
          onChange={(event) => onToggle(episode.id, event.target.checked)}
        />
        <span className="episode-row__status">{episode.watched ? 'Watched' : 'Pending'}</span>
      </label>
      <div className="episode-row__content">
        <div className="episode-row__title">
          <span className="episode-row__index">E{episode.number ?? '?'}</span>
          <strong>{episode.name}</strong>
        </div>
        {episode.summary ? (
          <p className="episode-row__summary">{episode.summary.replace(/<[^>]*>/g, '')}</p>
        ) : null}
      </div>
    </div>
  );
}
