import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    console.log("raw filename:", file.originalname);
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    console.log("fixed filename:", file.originalname);
    cb(null, true);
  },
});

export default upload;
