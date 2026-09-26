import axios from 'axios';
import type { MoviesResponse } from '../types/movie';

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
