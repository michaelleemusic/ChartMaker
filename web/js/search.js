// chartForge - Search Functions

export function searchSongs(query, libraryIndex) {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return libraryIndex.filter(song =>
    song.title.toLowerCase().includes(lower) ||
    song.artist.toLowerCase().includes(lower)
  ).slice(0, 20);
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function getRandomSong(libraryIndex) {
  if (libraryIndex.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * libraryIndex.length);
  return libraryIndex[randomIndex];
}
