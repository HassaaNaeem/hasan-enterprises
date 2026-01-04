import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create dynamic folder based on field name
    let uploadPath = "uploads/";

    switch (file.fieldname) {
      case "plotMap":
        uploadPath = "uploads/plotMap/";
        break;
      case "cnicCopy":
        uploadPath = "uploads/cnicCopy/";
        break;
      case "bankStatement":
        uploadPath = "uploads/bankStatement/";
        break;
      case "companyForm":
        uploadPath = "uploads/companyForm/";
        break;
      case "image":
        uploadPath = "uploads/image/";
        break;
      case "paymentProof":
        uploadPath = "uploads/paymentProof/";
        break;
      case "document":
        uploadPath = "uploads/documents/";
        break;
      default:
        uploadPath = "uploads/";
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, PDF, and DOC files are allowed."
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter,
});

export const uploadFields = upload.fields([
  { name: "plotMap", maxCount: 1 },
  { name: "cnicCopy", maxCount: 1 },
  { name: "bankStatement", maxCount: 1 },
  { name: "companyForm", maxCount: 1 },
  { name: "image", maxCount: 1 },
  { name: "paymentProof", maxCount: 1 },
  { name: "document", maxCount: 1 },
]);
