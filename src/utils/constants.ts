import Quality from "../lib/quality";

export const BASE_EPISODE_URL = (id: string) => `https://gogoanime.gg/${id}`;
export const BASE_STREAM_URL = (id: string) =>
  `${"https://goload.pro/streaming.php"}?id=${id}`;
export const BASE_SEARCH_URL = (search: string, page: number) =>
  `${
    "https://gogoanime.film/" + "/search.html"
  }?keyword=${search}&page=${page}`;
export const BASE_DETAILS_URL = (id: string) =>
  `https://gogoanime.gg/category/${id}`;
export const QUALITIES: Quality[] = ["144", "360", "480", "720", "1080"];
