const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const qr = require("qrcode");
const { API_BASE_URL, VUE_BASE_URL, ANDROID_BASE_URL, NODE_ENV } = process.env;

const isProd = NODE_ENV === "production";
const ifSudo = (role) => role === "sudo";
const ifAdmin = (role) => role === "admin";

const formatTime = (inputTime) => {
  const date = new Date(inputTime);
  const day = `0${date.getDate()}`.slice(-2);
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const year = date.getFullYear();
  const hour = date.getHours();
  const min = date.getMinutes();
  return `${day}/${month}/${year} ${hour}:${min}`;
};

const formatDate = (inputDate) => {
  const date = new Date(inputDate);
  const day = `0${date.getDate()}`.slice(-2);
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getApiPublicImgUrl = (imageName, type) =>
  isProd
    ? `${API_BASE_URL}/api/${type}/${imageName}` //for some hosting: `${API_BASE_URL}/api/${type}/${imageName}`
    : `${API_BASE_URL}/${type}/${imageName}`;

const generatePassResetContent = (token, CLIENT_BASE_URL) => {
  return `
    <p>Hello</p>
    <p>Click the button to reset password, will be valid for 1 hour.</p>
    <a href="${CLIENT_BASE_URL}/reset-password/?token=${token}"><button style="background-color: #e40046; color: white; border: none; padding: 10px;">Reset Password</button></a>
    <p>Best wishes,<br>QuickStarter</p>`;
};

const moveImage = (sourcePath, destinationPath) => {
  return new Promise((resolve, reject) => {
    fs.rename(sourcePath, destinationPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const dirMap = {
  tmp: path.join(__dirname, "..", "..", "public", "tmp"),
  user: path.join(__dirname, "..", "..", "public", "user"),
  eventBanner: path.join(__dirname, "..", "..", "public", "event-banner"),
  clubLogo: path.join(__dirname, "..", "..", "public", "club-logo"),
};

const getPrefix = (filename) => {
  return filename.split("-")[0];
};

const getDirPath = (prefix) => {
  return dirMap[prefix];
};

const getFilePath = (filename, prefix) => {
  const calcPrefix = prefix || getPrefix(filename);
  return path.join(dirMap[calcPrefix], filename);
};

const removeImages = async (imageArr) => {
  imageArr.map((image) => {
    const filePath = getFilePath(image);
    if (filePath) {
      return fs.unlink(filePath);
    } else {
      console.error("Invalid file path:", filePath);
      return Promise.resolve(); // Return a resolved promise to prevent further errors.
    }
  });
};

// const logoSvgString = fsSync.readFileSync(
//   path.join(__dirname, "./logo.svg"),
//   "utf8"
// );

const getCurrencySymbol = (currencyCode, type) => {
  const currencyCodeLower = currencyCode.toString().toLowerCase();

  const currencyMap = {
    usd: { icon: "mdi-currency-usd", symbol: "$" },
    gbp: { icon: "mdi-currency-gbp", symbol: "£" },
    eur: { icon: "mdi-currency-eur", symbol: "€" },
  };

  return currencyMap[currencyCodeLower][type];
};

const generateQrCode = async ({ id, qrUuid }) => {
  const data = JSON.stringify({ id, qrUuid });
  const qrCode = await qr.toDataURL(data);
  return qrCode.split(",")[1]; // Extract base64 data
};

const appInfo = { name: "Starter", version: 1.0 };

module.exports = {
  API_BASE_URL,
  VUE_BASE_URL,
  ANDROID_BASE_URL,
  dirMap,
  appInfo,
  getApiPublicImgUrl,
  generateQrCode,
  getCurrencySymbol,
  generatePassResetContent,
  moveImage,
  getPrefix,
  getDirPath,
  getFilePath,
  removeImages,
  formatDate,
  formatTime,
  ifSudo,
  ifAdmin,
  // logoSvgString,
};
