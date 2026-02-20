import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept 'images' field and any variantImage_* fields
  if (file.fieldname === "images" || /^variantImage_\d+$/.test(file.fieldname)) {
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
