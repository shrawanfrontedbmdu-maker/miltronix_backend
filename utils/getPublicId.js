export const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split("/");
    const fileWithExt = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    const file = fileWithExt.split(".")[0];
    return `${folder}/${file}`;
  } catch (err) {
    console.error("Error extracting public_id:", err);
    return null;
  }
};
