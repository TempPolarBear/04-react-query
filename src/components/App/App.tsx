import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactPaginateModule from 'react-paginate';
import type { ReactPaginateProps } from 'react-paginate';
import toast, { Toaster } from 'react-hot-toast';
import type { Movie } from '../../types/movie';
import { fetchMovies } from '../../services/movieService';
import SearchBar from '../SearchBar/SearchBar';
import MovieGrid from '../MovieGrid/MovieGrid';
import Loader from '../Loader/Loader';
import ErrorMessage from '../ErrorMessage/ErrorMessage';
import MovieModal from '../MovieModal/MovieModal';
import css from './App.module.css';

type ModuleWithDefault<T> = { default: T };

const ReactPaginate = (
  ReactPaginateModule as unknown as ModuleWithDefault<ComponentType<ReactPaginateProps>>
).default;

export default function App() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const { data, isFetching, isError, isSuccess, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['movies', query, page],
    queryFn: ({ signal }) => fetchMovies(query, page, signal),
    enabled: query.length > 0,
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  // TMDB accepts page numbers up to 500.
  const totalPages = Math.min(data?.total_pages ?? 0, 500);

  useEffect(() => {
    if (isSuccess && data.results.length === 0) {
      toast.error('No movies found for your request.', { id: 'empty-results' });
    }
  }, [data, dataUpdatedAt, isSuccess]);

  function handleSearch(nextQuery: string): void {
    toast.dismiss();
    setSelectedMovie(null);
    setQuery(nextQuery);
    setPage(1);
    if (nextQuery === query && page === 1) void refetch();
  }

  return (
    <div className={css.app}>
      <SearchBar onSubmit={handleSearch} />
      <main className={css.main}>
        {isFetching && <Loader />}
        {!isFetching && isError && <ErrorMessage />}
        {!isFetching && isSuccess && (
          <>
            <MovieGrid movies={data.results} onSelect={setSelectedMovie} />
            {totalPages > 1 && (
              <ReactPaginate
                pageCount={totalPages}
                pageRangeDisplayed={5}
                marginPagesDisplayed={1}
                onPageChange={({ selected }) => setPage(selected + 1)}
                forcePage={page - 1}
                containerClassName={css.pagination}
                activeClassName={css.active}
                nextLabel="→"
                previousLabel="←"
              />
            )}
          </>
        )}
      </main>
      {selectedMovie && <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />}
      <Toaster position="top-right" />
    </div>
  );
}
