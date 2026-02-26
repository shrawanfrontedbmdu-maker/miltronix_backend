import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed =
    file.fieldname === "images" ||
    file.fieldname === "image"  ||
    /^variantImage_\d+$/.test(file.fieldname);

  if (allowed) {
    cb(null, true);
  } else {
    cb(new Error(`Unexpected field: ${file.fieldname}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

export default upload;