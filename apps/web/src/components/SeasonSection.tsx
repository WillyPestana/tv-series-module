import { useId, useMemo, useState } from 'react';
import type { SeasonGroup } from '../api';
import EpisodeRow from './EpisodeRow';

export default function SeasonSection({
  season,
  onToggle,
  pendingEpisodeIds,
  onToggleSeason
}: {
  season: SeasonGroup;
  onToggle: (episodeId: number, watched: boolean) => void;
  pendingEpisodeIds: Set<number>;
  onToggleSeason: (seasonNumber: number, watched: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sectionId = useId();
  const watchedCount = useMemo(
    () => season.episodes.filter((episode) => episode.watched).length,
    [season.episodes]
  );
  const allWatched = season.episodes.length > 0 && watchedCount === season.episodes.length;

  return (
    <section className="season-section">
      <button
        type="button"
        className="season-section__header"
        onClick={() => setCollapsed((value) => !value)}
        aria-expanded={!collapsed}
        aria-controls={sectionId}
      >
        <h3>Season {season.season}</h3>
        <span className="season-section__progress">
          {watchedCount}/{season.episodes.length} watched
        </span>
      </button>
      <div className="season-section__actions">
        <button type="button" onClick={() => onToggleSeason(season.season, !allWatched)}>
          {allWatched ? 'Unmark season watched' : 'Mark season watched'}
        </button>
      </div>
      {!collapsed ? (
        <div id={sectionId} className="season-section__episodes">
          {season.episodes.map((episode) => (
            <EpisodeRow
              key={episode.id}
              episode={episode}
              onToggle={onToggle}
              disabled={pendingEpisodeIds.has(episode.id)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
