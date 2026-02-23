import { useEffect, useState } from 'react';
import { getDashboard, type DashboardEntry, type DashboardResponse } from '../../api';

function RankingList({ title, items }: { title: string; items: DashboardEntry[] }) {
  return (
    <section className="dashboard__panel">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="empty-state">No data yet.</p>
      ) : (
        <ul className="dashboard__ranking">
          {items.map((item) => (
            <li key={`${title}-${item.showId}`}>
              {item.posterUrl ? <img src={item.posterUrl} alt="" loading="lazy" /> : <div className="dashboard__poster" />}
              <div>
                <strong>{item.title}</strong>
                <p>{item.value}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const payload = await getDashboard();
        if (mounted) {
          setData(payload);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <p className="loading">Loading dashboard...</p>;
  }

  if (error) {
    return (
      <p className="error" role="alert">
        Could not load dashboard: {error}
      </p>
    );
  }

  if (!data) return null;

  return (
    <section className="dashboard">
      <div className="dashboard__totals">
        <article>
          <p>Comments</p>
          <strong>{data.totals.comments}</strong>
        </article>
        <article>
          <p>Watched Episodes</p>
          <strong>{data.totals.watchedEpisodes}</strong>
        </article>
        <article>
          <p>Ratings</p>
          <strong>{data.totals.ratings}</strong>
        </article>
      </div>
      <div className="dashboard__grid">
        <RankingList title="Most Commented Shows" items={data.topCommentedShows} />
        <RankingList title="Most Watched Shows" items={data.topWatchedShows} />
        <RankingList title="Top Rated Shows" items={data.topRatedShows} />
      </div>
    </section>
  );
}
