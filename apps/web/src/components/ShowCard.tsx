import { Link } from 'react-router-dom';
import type { ShowSummary } from '../api';

export default function ShowCard({
  show,
  inLibrary,
  onToggleLibrary
}: {
  show: ShowSummary;
  inLibrary: boolean;
  onToggleLibrary: (show: ShowSummary) => void | Promise<void>;
}) {
  return (
    <article className="show-card">
      <div className="show-card__media">
        <Link to={`/shows/${show.id}`}>
          {show.posterUrl ? (
            <img src={show.posterUrl} alt={`${show.title} poster`} loading="lazy" />
          ) : (
            <div className="show-card__placeholder">No image</div>
          )}
        </Link>
      </div>
      <div className="show-card__body">
        <h3>
          <Link to={`/shows/${show.id}`}>{show.title}</Link>
        </h3>
        <p>{show.year ?? 'Unknown year'}</p>
        <div className="show-card__footer">
          <Link to={`/shows/${show.id}`} className="show-card__action">
            View details
          </Link>
          <button
            type="button"
            className={`show-card__save ${inLibrary ? 'show-card__save--active' : ''}`}
            onClick={() => onToggleLibrary(show)}
          >
            {inLibrary ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </article>
  );
}
