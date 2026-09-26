import axios from 'axios';
import type { Movie } from '../types/movie';

export interface MoviesResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export async function fetchMovies(
  query: string,
  page: number,
  signal?: AbortSignal,
): Promise<MoviesResponse> {
  const response = await axios.get<MoviesResponse>('https://api.themoviedb.org/3/search/movie', {
    params: { query, page },
    headers: { Authorization: `Bearer ${import.meta.env.TMDB_TOKEN}` },
    signal,
  });
  return response.data;
}
