import fs from "fs";
import path from "path";
import { StudentExtensionData, StudentMessage } from "./types";
import { getFirebaseDb, isFirebaseConfigured } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

const DATA_DIR = path.join(process.cwd(), "data");
const EXTENSIONS_FILE = path.join(DATA_DIR, "extensions.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

// Bộ nhớ đệm tạm thời (In-memory Fallback) khi chạy serverless nếu chưa gắn Firebase
const memoryExtensions: Record<string, StudentExtensionData> = {};
const memoryMessages: StudentMessage[] = [];

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(EXTENSIONS_FILE)) {
      fs.writeFileSync(EXTENSIONS_FILE, JSON.stringify({}, null, 2), "utf-8");
    }
    if (!fs.existsSync(MESSAGES_FILE)) {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err) {
    // Bỏ qua lỗi read-only trên serverless (Vercel)
  }
}

/**
 * Đọc tất cả thông tin mở rộng của học sinh
 */
export async function getAllExtensions(): Promise<Record<string, StudentExtensionData>> {
  const db = getFirebaseDb();
  if (db) {
    try {
      const colRef = collection(db, "student_extensions");
      const snap = await getDocs(colRef);
      const res: Record<string, StudentExtensionData> = {};
      snap.forEach((d) => {
        res[d.id] = d.data() as StudentExtensionData;
      });
      return res;
    } catch (err) {
      console.error("[Firebase Error] Lỗi đọc collection student_extensions:", err);
    }
  }

  // Fallback đọc file cục bộ hoặc bộ nhớ tạm
  ensureDataDir();
  try {
    if (fs.existsSync(EXTENSIONS_FILE)) {
      const raw = fs.readFileSync(EXTENSIONS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...parsed, ...memoryExtensions };
    }
  } catch (err) {
    console.warn("[DB Fallback] Dùng memory extensions:", err);
  }
  return memoryExtensions;
}

/**
 * Lấy thông tin mở rộng của 1 học sinh theo STT
 */
export async function getExtension(stt: string): Promise<StudentExtensionData | null> {
  const cleanStt = stt.trim();
  const targetStt = parseInt(cleanStt, 10).toString();

  const db = getFirebaseDb();
  if (db) {
    try {
      // Thử đọc doc theo cleanStt
      const docRef = doc(db, "student_extensions", cleanStt);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as StudentExtensionData;
      }
      // Thử đọc doc theo targetStt
      if (targetStt !== cleanStt) {
        const altRef = doc(db, "student_extensions", targetStt);
        const altSnap = await getDoc(altRef);
        if (altSnap.exists()) {
          return altSnap.data() as StudentExtensionData;
        }
      }
    } catch (err) {
      console.error("[Firebase Error] Lỗi đọc doc student_extensions:", err);
    }
  }

  const all = await getAllExtensions();
  return all[cleanStt] || all[targetStt] || null;
}

/**
 * Cập nhật hoặc thêm mới thông tin mở rộng của 1 học sinh
 */
export async function updateExtension(
  stt: string,
  partialData: Partial<StudentExtensionData>
): Promise<StudentExtensionData> {
  const cleanStt = stt.trim();
  const current = (await getExtension(cleanStt)) || { stt: cleanStt };

  const updated: StudentExtensionData = {
    ...current,
    ...partialData,
    stt: cleanStt,
    updatedAt: new Date().toISOString(),
  };

  const db = getFirebaseDb();
  if (db) {
    try {
      const docRef = doc(db, "student_extensions", cleanStt);
      await setDoc(docRef, updated, { merge: true });
      return updated;
    } catch (err) {
      console.error("[Firebase Error] Lỗi ghi Firestore student_extensions:", err);
      throw new Error("Lỗi khi lưu dữ liệu lên Firebase Firestore.");
    }
  }

  // Fallback: ghi vào file cục bộ (khi chạy local)
  ensureDataDir();
  memoryExtensions[cleanStt] = updated;

  try {
    const all = await getAllExtensions();
    all[cleanStt] = updated;
    fs.writeFileSync(EXTENSIONS_FILE, JSON.stringify(all, null, 2), "utf-8");
    return updated;
  } catch (err) {
    console.warn("[DB Notice] Filesystem read-only (Serverless). Lưu tạm vào memory.", err);
    return updated;
  }
}

/**
 * Lấy tất cả tin nhắn
 */
export async function getAllMessages(): Promise<StudentMessage[]> {
  const db = getFirebaseDb();
  if (db) {
    try {
      const colRef = collection(db, "messages");
      const snap = await getDocs(colRef);
      const list: StudentMessage[] = [];
      snap.forEach((d) => {
        list.push(d.data() as StudentMessage);
      });
      // Sắp xếp theo thời gian tăng dần
      return list.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (err) {
      console.error("[Firebase Error] Lỗi đọc collection messages:", err);
    }
  }

  // Fallback đọc file cục bộ hoặc memory
  ensureDataDir();
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const raw = fs.readFileSync(MESSAGES_FILE, "utf-8");
      const fileList: StudentMessage[] = JSON.parse(raw) || [];
      const combined = [...fileList, ...memoryMessages];
      return combined.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
  } catch (err) {
    console.warn("[DB Fallback] Dùng memory messages:", err);
  }
  return memoryMessages;
}

/**
 * Lấy danh sách tin nhắn theo STT học sinh
 */
export async function getMessagesByStt(stt: string): Promise<StudentMessage[]> {
  const all = await getAllMessages();
  const cleanStt = stt.trim();
  const targetStt = parseInt(cleanStt, 10).toString();
  return all.filter((m) => m.stt === cleanStt || m.stt === targetStt);
}

/**
 * Gửi tin nhắn mới giữa Học sinh và GVCN
 */
export async function createMessage(
  data: Omit<StudentMessage, "id" | "createdAt" | "status">
): Promise<StudentMessage> {
  const cleanStt = data.stt.trim();
  const newMsg: StudentMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    stt: cleanStt,
    studentName: data.studentName.trim(),
    sender: data.sender,
    content: data.content.trim(),
    isConfidential: Boolean(data.isConfidential),
    createdAt: new Date().toISOString(),
    status: "unread",
  };

  const db = getFirebaseDb();
  if (db) {
    try {
      const docRef = doc(db, "messages", newMsg.id);
      await setDoc(docRef, newMsg);
      return newMsg;
    } catch (err) {
      console.error("[Firebase Error] Lỗi ghi message Firestore:", err);
      throw new Error("Lỗi lưu trữ tin nhắn trên Firebase Firestore.");
    }
  }

  // Fallback: ghi file cục bộ (local dev) hoặc memory
  ensureDataDir();
  memoryMessages.push(newMsg);

  try {
    const all = await getAllMessages();
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(all, null, 2), "utf-8");
    return newMsg;
  } catch (err) {
    console.warn("[DB Notice] Filesystem read-only (Serverless). Lưu tạm message vào memory.", err);
    return newMsg;
  }
}

/**
 * Cập nhật trạng thái tin nhắn
 */
export async function updateMessageStatus(
  id: string,
  status: "unread" | "read" | "replied"
): Promise<boolean> {
  const db = getFirebaseDb();
  if (db) {
    try {
      const docRef = doc(db, "messages", id);
      await setDoc(docRef, { status }, { merge: true });
      return true;
    } catch (err) {
      console.error("[Firebase Error] Lỗi cập nhật status message Firestore:", err);
      return false;
    }
  }

  ensureDataDir();
  const all = await getAllMessages();
  const index = all.findIndex((m) => m.id === id);
  if (index !== -1) {
    all[index].status = status;
    try {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(all, null, 2), "utf-8");
    } catch (err) {
      // Memory fallback
    }
    return true;
  }
  return false;
}
