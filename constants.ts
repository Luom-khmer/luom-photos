
// ------------------------------------------------------------------
// IMPORTANT: YOU MUST CONFIGURE THESE VALUES FOR THE APP TO WORK
// ------------------------------------------------------------------

// 1. Dán Google Drive API Key (Lấy từ Firebase apiKey vì thường dùng chung project)
export const GOOGLE_DRIVE_API_KEY: string = "AIzaSyDzc7hjx7JRuTAF1uBh3w_EIWv36CSUO3U"; 

// 2. Điền thông tin Firebase lấy từ hình ảnh
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDzc7hjx7JRuTAF1uBh3w_EIWv36CSUO3U",
  authDomain: "gen-lang-client-0683132405.firebaseapp.com",
  projectId: "gen-lang-client-0683132405",
  storageBucket: "gen-lang-client-0683132405.firebasestorage.app",
  messagingSenderId: "709532361182",
  appId: "1:709532361182:web:89e8bf08f7897786783d4f",
  measurementId: "G-QYENBMR0MS"
};

// 3. Admin Emails
// Điền chính xác địa chỉ Gmail của BẠN vào đây để có quyền tạo Album
export const ADMIN_EMAILS = [
  "email_cua_ban@gmail.com", 
  "photographer@example.com"
];

// ------------------------------------------------------------------

export const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";

export const isConfigValid = () => {
  return (
    GOOGLE_DRIVE_API_KEY.length > 0 &&
    GOOGLE_DRIVE_API_KEY !== "DÁN_API_KEY_GOOGLE_DRIVE_CỦA_BẠN_VÀO_ĐÂY" &&
    FIREBASE_CONFIG.apiKey.length > 0 && 
    FIREBASE_CONFIG.apiKey !== "DÁN_API_KEY_FIREBASE"
  );
};
