import type { Movie } from '../../types/movie';
import styles from './MovieGrid.module.css';

interface MovieGridProps {
  movies: Movie[];
  onSelect: (movie: Movie) => void;
}

export default function MovieGrid({ movies, onSelect }: MovieGridProps) {
  if (movies.length === 0) return null;

  return (
    <ul className={styles.grid}>
      {movies.map((movie) => (
        <li key={movie.id} className={styles.item}>
          <button
            className={styles.card}
            type="button"
            onClick={() => onSelect(movie)}
            aria-label={`Show details for ${movie.title}`}
          >
            {movie.poster_path ? (
              <img
                className={styles.image}
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                loading="lazy"
              />
            ) : (
              <div className={styles.placeholder}>No poster available</div>
            )}
            <h2 className={styles.title}>{movie.title}</h2>
          </button>
        </li>
      ))}
    </ul>
  );
}
