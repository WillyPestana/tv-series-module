import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  addComment,
  addRating,
  getShowDetails,
  toggleEpisodeWatched,
  type Comment,
  type SeasonGroup,
  type ShowSummary,
  type ShowDetailsResponse
} from '../../api';
import SeasonSection from '../../components/SeasonSection';
import { useLibrary } from '../../hooks/useLibrary';

export default function DetailsPage() {
  const params = useParams();
  const showId = Number(params.id);
  const [details, setDetails] = useState<ShowDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [episodeId, setEpisodeId] = useState<string>('');
  const [pendingEpisodeIds, setPendingEpisodeIds] = useState<Set<number>>(new Set());
  const [commentSaving, setCommentSaving] = useState(false);
  const [ratingAuthor, setRatingAuthor] = useState('');
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { ids: libraryIds, toggle: toggleLibrary } = useLibrary();

  const loadDetails = useCallback(async () => {
    if (Number.isNaN(showId)) {
      setError('Invalid show id');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getShowDetails(showId);
      setDetails(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const episodes = useMemo(() => {
    if (!details) return [];
    return details.seasons.flatMap((season) => season.episodes);
  }, [details]);
  const isShowSaved = details ? libraryIds.has(details.id) : false;
  const isShowFullyWatched =
    details !== null &&
    details.seasons.length > 0 &&
    details.seasons.every((season) => season.episodes.every((episode) => episode.watched));

  const handleToggle = async (episodeIdValue: number, watched: boolean) => {
    if (!details) return;
    setActionError(null);
    setPendingEpisodeIds((previous) => new Set(previous).add(episodeIdValue));
    const previousDetails = details;
    const optimisticSeasons: SeasonGroup[] = details.seasons.map((season) => ({
      ...season,
      episodes: season.episodes.map((episode) =>
        episode.id === episodeIdValue ? { ...episode, watched } : episode
      )
    }));
    setDetails({ ...details, seasons: optimisticSeasons });

    try {
      await toggleEpisodeWatched(episodeIdValue, { showId: details.id, watched });
    } catch (err) {
      setDetails(previousDetails);
      setActionError(`Could not update episode status: ${(err as Error).message}`);
    } finally {
      setPendingEpisodeIds((previous) => {
        const next = new Set(previous);
        next.delete(episodeIdValue);
        return next;
      });
    }
  };

  const bulkUpdateEpisodes = async (episodeIds: number[], watched: boolean) => {
    if (!details || episodeIds.length === 0) return;
    setActionError(null);
    setPendingEpisodeIds((previous) => {
      const next = new Set(previous);
      episodeIds.forEach((id) => next.add(id));
      return next;
    });

    const previousDetails = details;
    const optimisticSeasons: SeasonGroup[] = details.seasons.map((season) => ({
      ...season,
      episodes: season.episodes.map((episode) =>
        episodeIds.includes(episode.id) ? { ...episode, watched } : episode
      )
    }));
    setDetails({ ...details, seasons: optimisticSeasons });

    try {
      await Promise.all(
        episodeIds.map((id) => toggleEpisodeWatched(id, { showId: details.id, watched }))
      );
    } catch (err) {
      setDetails(previousDetails);
      setActionError(`Could not update episodes: ${(err as Error).message}`);
    } finally {
      setPendingEpisodeIds((previous) => {
        const next = new Set(previous);
        episodeIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  const handleMarkSeason = async (seasonNumber: number, watched: boolean) => {
    if (!details) return;
    const season = details.seasons.find((entry) => entry.season === seasonNumber);
    if (!season) return;
    const targets = season.episodes
      .filter((episode) => episode.watched !== watched)
      .map((episode) => episode.id);
    await bulkUpdateEpisodes(targets, watched);
  };

  const handleMarkShow = async (watched: boolean) => {
    if (!details) return;
    const targets = details.seasons
      .flatMap((season) => season.episodes)
      .filter((episode) => episode.watched !== watched)
      .map((episode) => episode.id);
    await bulkUpdateEpisodes(targets, watched);
  };

  const handleAddComment = async () => {
    if (!details || commentText.trim().length === 0) return;
    setActionError(null);
    setCommentSaving(true);
    const payload = {
      showId: details.id,
      episodeId: episodeId ? Number(episodeId) : null,
      text: commentText,
      author: commentAuthor.trim().length > 0 ? commentAuthor : null
    };
    try {
      const response = await addComment(payload);
      const nextComment: Comment = response.comment;
      setDetails({ ...details, comments: [nextComment, ...details.comments] });
      setCommentText('');
      setEpisodeId('');
    } catch (err) {
      setActionError(`Could not add comment: ${(err as Error).message}`);
    } finally {
      setCommentSaving(false);
    }
  };

  const handleToggleLibrary = async () => {
    if (!details) return;
    const show: ShowSummary = {
      id: details.id,
      title: details.title,
      posterUrl: details.posterUrl ?? null,
      genres: details.genres
    };
    try {
      await toggleLibrary(show);
    } catch (err) {
      setActionError(`Could not update library: ${(err as Error).message}`);
    }
  };

  const handleAddRating = async () => {
    if (!details || ratingScore < 1 || ratingScore > 5) return;
    setActionError(null);
    setRatingSaving(true);
    try {
      const response = await addRating({
        showId: details.id,
        score: ratingScore,
        author: ratingAuthor.trim().length > 0 ? ratingAuthor : null
      });
      const nextRatings = [response.rating, ...details.ratings];
      const average = Number(
        (nextRatings.reduce((sum, rating) => sum + rating.score, 0) / nextRatings.length).toFixed(2)
      );
      setDetails({
        ...details,
        ratings: nextRatings,
        ratingSummary: {
          average,
          count: nextRatings.length
        }
      });
      setRatingScore(0);
      setRatingAuthor('');
    } catch (err) {
      setActionError(`Could not add rating: ${(err as Error).message}`);
    } finally {
      setRatingSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="loading" role="status" aria-live="polite">
        Loading...
      </p>
    );
  }

  if (error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    );
  }

  if (!details) {
    return null;
  }

  return (
    <section className="details" aria-busy={commentSaving || ratingSaving || pendingEpisodeIds.size > 0}>
      <Link to="/" className="details__back">
        Back to search
      </Link>
      <div className="details__header">
        {details.posterUrl ? (
          <img src={details.posterUrl} alt={details.title} />
        ) : (
          <div className="details__poster">No image</div>
        )}
        <div>
          <h2>{details.title}</h2>
          <div className="details__genres">{details.genres.join(', ')}</div>
          {details.summary && (
            <div
              className="details__summary"
              dangerouslySetInnerHTML={{ __html: details.summary }}
            />
          )}
          <div className="details__meta">
            <span>{details.seasons.length} season(s)</span>
            <span>{details.comments.length} comment(s)</span>
          </div>
          <div className="details__bulk-actions">
            <button type="button" onClick={() => void handleToggleLibrary()}>
              {isShowSaved ? 'Remove from library' : 'Save to library'}
            </button>
            <button type="button" onClick={() => void handleMarkShow(!isShowFullyWatched)}>
              {isShowFullyWatched ? 'Unmark show watched' : 'Mark show watched'}
            </button>
          </div>
        </div>
      </div>
      {actionError ? (
        <p className="error" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="details__seasons">
        {details.seasons.map((season) => (
            <SeasonSection
              key={season.season}
              season={season}
              onToggle={handleToggle}
              pendingEpisodeIds={pendingEpisodeIds}
              onToggleSeason={handleMarkSeason}
            />
          ))}
      </div>

      <div className="details__comments">
        <h3>Ratings</h3>
        <div className="details__meta">
          <span>
            Average: {details.ratingSummary.average !== null ? `${details.ratingSummary.average}/5` : 'N/A'}
          </span>
          <span>{details.ratingSummary.count} rating(s)</span>
        </div>
        <div className="rating-form">
          <div className="rating-form__stars" role="radiogroup" aria-label="Rate show">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={ratingScore >= value ? 'is-active' : ''}
                onClick={() => setRatingScore(value)}
                aria-label={`Rate ${value} stars`}
              >
                ★
              </button>
            ))}
          </div>
          <input
            placeholder="Author (optional)"
            value={ratingAuthor}
            onChange={(event) => setRatingAuthor(event.target.value)}
          />
          <button type="button" onClick={handleAddRating} disabled={ratingSaving || ratingScore === 0}>
            {ratingSaving ? 'Saving...' : 'Submit rating'}
          </button>
        </div>
      </div>

      <div className="details__comments">
        <h3>Comments</h3>
        <div className="comment-form">
          <input
            placeholder="Author (optional)"
            value={commentAuthor}
            onChange={(event) => setCommentAuthor(event.target.value)}
          />
          <select value={episodeId} onChange={(event) => setEpisodeId(event.target.value)}>
            <option value="">Show-level comment</option>
            {episodes.map((episode) => (
              <option key={episode.id} value={episode.id}>
                S{episode.season}E{episode.number ?? '?'} - {episode.name}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Write a comment"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
          />
          <button type="button" onClick={handleAddComment} disabled={commentSaving}>
            {commentSaving ? 'Saving...' : 'Add comment'}
          </button>
        </div>
        <div className="comment-list">
          {details.comments.map((comment) => (
            <div key={comment.id} className="comment">
              <div className="comment__meta">
                <strong>{comment.author ?? 'Anonymous'}</strong>
                {comment.episodeId ? (
                  <span>Episode #{comment.episodeId}</span>
                ) : (
                  <span>Show</span>
                )}
                <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
              </div>
              <p>{comment.text}</p>
            </div>
          ))}
          {details.comments.length === 0 ? (
            <p className="empty-state" role="status" aria-live="polite">
              No comments yet. Start the conversation.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
