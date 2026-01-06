export const formatDate = (dateStr: string | Date) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date
    .toLocaleString("en-US", { month: "short" })
    .toLowerCase();
  const monthFormatted = month.charAt(0).toUpperCase() + month.slice(1);
  const year = date.getFullYear().toString().slice(-2);
  return `${day}-${monthFormatted}'${year}`;
};