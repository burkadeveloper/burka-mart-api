export const getImageUrl = (path) => {
  if (!path) return "/placeholder.jpg";
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_URL}${path}`;
};
