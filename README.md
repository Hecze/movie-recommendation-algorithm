# Movie Recommendation Algorithm with Quality Influence

This project implements a movie recommendation system that combines content-based filtering with dynamic adjustments based on movie quality. The system provides personalized movie recommendations by incorporating user ratings and the quality of the movies into the recommendation process.

## Purpose

The primary goals of this project are to:
- Investigate and explore movie recommendation algorithms.
- Learn about combining content-based filtering with quality adjustments.
- Demonstrate the implementation and effectiveness of this algorithm.

## Algorithm Overview

The recommendation algorithm operates as follows:

1. **Data Collection**: Fetches movie and genre data from The Movie Database (TMDb) API.
2. **User Ratings**: Allows users to rate movies with likes or dislikes. These ratings influence the recommendation engine.
3. **Quality Adjustment**: The impact of a rating (like or dislike) is adjusted based on the movie's quality (rating score). Dislikes on high-rated movies have a stronger effect, while likes on low-rated movies have an enhanced effect.
4. **Recommendation Calculation**: Uses a user-specific vector to calculate scores for movies based on genre preferences and quality adjustments.
5. **Filtering**: Provides a list of recommended movies and a separate list of movies that the user is likely to dislike.

## Features

- **Content-Based Filtering**: Recommends movies based on genre preferences.
- **Quality-Based Adjustment**: Modifies the impact of ratings according to the quality of movies.
- **Personalized Recommendations**: Tailors movie suggestions based on user feedback and interactions.
- **Dynamic Filtering**: Separates recommended movies from those likely to be disliked.

## Modifications Made

1. **Rating Influence**: The system was modified to adjust the influence of likes and dislikes based on movie quality. Dislikes have a stronger impact on high-rated movies, while likes significantly enhance the recommendation for low-rated movies.
2. **Vector Normalization**: Implemented normalization of the user vector to ensure balanced influence of different genres based on user interactions.
3. **Dynamic Adjustment**: Incorporated dynamic adjustments to the recommendation process to better reflect user preferences and movie ratings.

## Installation and Usage

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
