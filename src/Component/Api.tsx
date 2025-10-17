import axios from "axios";

const BASE = "https://api.artic.edu/api/v1/artworks";

export async function fetchArtworks(page: number, limit = 12) {
  const res = await axios.get(BASE, { params: { page, limit } });
  return res.data;
}
