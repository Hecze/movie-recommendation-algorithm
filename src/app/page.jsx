"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { IoSearchSharp } from "react-icons/io5";

// Función para obtener las películas y géneros
async function getMovies() {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const totalPages = 3; // Define cuántas páginas quieres obtener
  const seenMovieIds = new Set(); // Para rastrear IDs únicos de películas
  let allMovies = [];

  for (let page = 1; page <= totalPages; page++) {
    const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-ES&page=${page}`);
    const data = await res.json();

    // Filtrar duplicados
    data.results.forEach(movie => {
      if (!seenMovieIds.has(movie.id)) {
        seenMovieIds.add(movie.id);
        allMovies.push(movie);
      }
    });
  }

  const genresRes = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=en-ES`);
  const genresData = await genresRes.json();
  const genresMap = genresData.genres.reduce((map, genre) => {
    map[genre.id] = genre.name;
    return map;
  }, {});

  return allMovies.map(movie => ({
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    vote_average: movie.vote_average,
    genre_ids: movie.genre_ids.map(id => genresMap[id]),
  }));
}

// Nueva función para buscar películas
async function searchMovies(query) {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const res = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=${API_KEY}&language=en-ES`);
  const data = await res.json();

  if (!data.results) return [];

  const genresRes = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=en-ES`);
  const genresData = await genresRes.json();
  const genresMap = genresData.genres.reduce((map, genre) => {
    map[genre.id] = genre.name;
    return map;
  }, {});

  return data.results.map(movie => ({
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    vote_average: movie.vote_average,
    genre_ids: movie.genre_ids.map(id => genresMap[id]),
  }));
}

// Componente principal de la página
export default function MoviesPage() {
  const [seenMovies, setSeenMovies] = useState([]); // Películas ya vistas
  const [movies, setMovies] = useState([]); // Películas populares
  const [userVector, setUserVector] = useState({}); // Vector del usuario
  const [recommendedMovies, setRecommendedMovies] = useState([]); // Películas recomendadas
  const [hatedMovies, setHatedMovies] = useState([]); // Películas que probablemente odie
  const [searchResults, setSearchResults] = useState([]); // Resultados de búsqueda
  const [searchQuery, setSearchQuery] = useState(''); // Query de búsqueda

  // Define una variable para la influencia de la calidad en el rating
  const QUALITY_INFLUENCE = 0.3; // Puedes ajustar este valor según tus necesidades. valor entre 0 y 0.5

  // Cargar las películas al montar el componente
  useEffect(() => {
    const fetchMovies = async () => {
      const moviesData = await getMovies();
      setMovies(moviesData);
    };
    fetchMovies();
  }, []);

  // Actualizar recomendaciones y películas odiadas cuando cambia el vector del usuario
  useEffect(() => {
    updateRecommendations(movies, userVector);
  }, [userVector, movies]);

  // Buscar películas cuando cambia el query de búsqueda
  useEffect(() => {
    if (searchQuery) {
      const fetchSearchResults = async () => {
        const results = await searchMovies(searchQuery);
        // Filtrar películas que ya se han visto
        const filteredResults = results.filter(
          (movie) => !seenMovies.some((seenMovie) => seenMovie.id === movie.id)
        );
        setSearchResults(filteredResults);
      };
      fetchSearchResults();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Función para manejar el like/dislike de una película
  const handleRating = (movie, type) => {
    const alreadySeen = seenMovies.some(seenMovie => seenMovie.id === movie.id);

    const ratingWeight = type === 'like'
      ? movie.vote_average * (1 + QUALITY_INFLUENCE)
      : -movie.vote_average * (1 - QUALITY_INFLUENCE);

    if (alreadySeen) {
      const newVector = { ...userVector };
      movie.genre_ids.forEach(genre => {
        newVector[genre] = (newVector[genre] || 0) + ratingWeight;
      });
      setUserVector(newVector);
    } else {
      const newVector = { ...userVector };
      movie.genre_ids.forEach(genre => {
        newVector[genre] = (newVector[genre] || 0) + ratingWeight;
      });

      const updatedRecommendedMovies = recommendedMovies.filter(m => m.id !== movie.id);
      setRecommendedMovies(updatedRecommendedMovies);

      const updatedHatedMovies = hatedMovies.filter(m => m.id !== movie.id);
      setHatedMovies(updatedHatedMovies);

      setSeenMovies([...seenMovies, movie]);
      setUserVector(newVector);

      const updatedMovies = movies.filter(m => m.id !== movie.id);
      setMovies(updatedMovies);

      updateRecommendations(updatedMovies, newVector);
    }
  };

  const normalizeUserVector = (vector) => {
    const totalPoints = Object.values(vector).reduce((total, value) => total + value, 0);
    const normalizedVector = {};
    for (const [genre, points] of Object.entries(vector)) {
      normalizedVector[genre] = totalPoints > 0 ? points / totalPoints : 0;
    }
    return normalizedVector;
  };

  const updateRecommendations = (moviesList, userVector) => {
    const normalizedUserVector = normalizeUserVector(userVector);

    const scoredMovies = moviesList.map(movie => {
      const score = movie.genre_ids.reduce((total, genre) => {
        return total + (normalizedUserVector[genre] || 0);
      }, 0);
      return { ...movie, score };
    });

    const highScoreMovies = scoredMovies.filter(movie => movie.score > 0.45);
    const lowScoreMovies = scoredMovies.filter(movie => movie.score < -0.1);

    setRecommendedMovies(highScoreMovies);
    setHatedMovies(lowScoreMovies);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white py-8 px-4">
      {/* <h1 className="text-4xl font-bold text-center">Movies you've already seen</h1>
      <div className="flex flex-wrap gap-4 p-8">
        {seenMovies.map((movie) => (
          <Movie movie={movie} key={movie.id} isSeen={true} />
        ))}
      </div> */}

      <div className="text-center mb-8">
        <div className="flex  items-center max-w-md mx-auto">
          <div className="flex items-center w-full px-4 py-2 bg-gray-800 rounded-lg shadow-lg">
            <input
              type="text"
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
              placeholder="Search for a movie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              className="text-white ml-3 focus:outline-none focus:ring-0"
            >
              <IoSearchSharp size={24} />
            </button>
          </div>
        </div>
      </div>

      {searchResults.length > 0 && (
        <>
          <div className="flex flex-wrap gap-4 p-4">
            {searchResults.map((movie) => (
              <Movie
                movie={movie}
                key={movie.id}
                isSeen={seenMovies.some(seenMovie => seenMovie.id === movie.id)}
                onRating={(type) => handleRating(movie, type)}
              />
            ))}
          </div>
        </>
      )}

      {recommendedMovies.length > 0 && (
        <>
          <h1 className="text-xl xl:text-3xl my-2 text-gray-100 font-bold text-center">Recommended Movies</h1>
          <div className="flex flex-wrap justify-center  gap-4 p-4">
            {recommendedMovies.map((movie) => (
              <Movie
                movie={movie}
                key={movie.id}
                isSeen={seenMovies.some(seenMovie => seenMovie.id === movie.id)}
                onRating={(type) => handleRating(movie, type)}
              />
            ))}
          </div>
        </>
      )}

      {!searchQuery && (
        <>
          <h1 className="text-xl xl:text-3xl my-2 text-gray-100 font-bold text-center">Rate some movies to be able to recommend new ones</h1>
          <div className="flex flex-wrap justify-center gap-4 p-4">
            {movies.map((movie) => (
              <Movie
                movie={movie}
                key={movie.id}
                isSeen={seenMovies.some(seenMovie => seenMovie.id === movie.id)}
                onRating={(type) => handleRating(movie, type)}
              />
            ))}
          </div>



          {hatedMovies.length > 0 && (
            <>
              <h1 className="text-xl xl:text-3xl my-2 text-gray-100  font-bold text-center">Movies You Might Hate</h1>
              <div className="flex flex-wrap justify-center gap-4 p-8">
                {hatedMovies.map((movie) => (
                  <Movie
                    movie={movie}
                    key={movie.id}
                    isSeen={seenMovies.some(seenMovie => seenMovie.id === movie.id)}
                    onRating={(type) => handleRating(movie, type)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// Componente Movie
// Componente Movie
const Movie = ({ movie, onRating = () => { }, isSeen }) => {
  const roundedVoteAverage = Math.round(movie.vote_average);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg w-[150px] h-[225px] group transition-transform transform-gpu hover:scale-150 hover:z-10">
      <div className="relative w-full h-full">
        <Image
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          layout="fill"
          objectFit="cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col p-4">
          <div className="text-center text-white mb-4">
            <h2 className="text-sm font-semibold">{movie.title}</h2>
            <p className="text-gray-300 text-[10px] mt-2">
              Categorías: {movie.genre_ids.join(', ')}
            </p>
            <p className="text-yellow-400 text-[10px] font-bold mt-2">
              Valoración: {roundedVoteAverage}/10
            </p>
          </div>
          {!isSeen && (
            <div className="flex space-x-4">
              <button
                className="text-green-400 hover:text-green-300 transition-colors"
                onClick={() => onRating('like')}
              >
                <FaThumbsUp size={24} />
              </button>
              <button
                className="text-red-400 hover:text-red-300 transition-colors"
                onClick={() => onRating('dislike')}
              >
                <FaThumbsDown size={24} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
