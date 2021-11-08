export default {
  items: `
    SELECT 
        movieid as ITEM_ID,
        regexp_extract(title, '(.*?)\\s*\\(', 1) as TITLE,
        regexp_extract(title, '\\d{4}') as RELEASE_YEAR,
        genres as GENRES
    FROM movies;`,
  users: "",
  interactions: `
    SELECT 
        userid as USER_ID,
        movieid as ITEM_ID,
        rating as EVENT_VALUE,
        timestamp as TIMESTAMP,
        'rate' as EVENT_TYPE
    FROM ratings;`,
};
