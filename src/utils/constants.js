export const BASE_EPISODE_URL = (id) => `https://gogoanime.gg/${id}`;
export const BASE_STREAM_URL = (id) =>
  `${"https://goload.pro/streaming.php"}?id=${id}`;
export const BASE_SEARCH_URL = (search, page) =>
  `${
    "https://gogoanime.film/" + "/search.html"
  }?keyword=${search}&page=${page}`;
export const BASE_DETAILS_URL = (id) => `https://gogoanime.gg/category/${id}`;
