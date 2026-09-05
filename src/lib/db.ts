import fs from "fs";
import path from "path";
import { StudentExtensionData, StudentMessage } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const EXTENSIONS_FILE = path.join(DATA_DIR, "extensions.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

// Đảm bảo thư mục data/ tồn tại
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(EXTENSIONS_FILE)) {
    fs.writeFileSync(EXTENSIONS_FILE, JSON.stringify({}, null, 2), "utf-8");
  }
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

/**
 * Đọc tất cả thông tin mở rộng của học sinh
 */
export async function getAllExtensions(): Promise<Record<string, StudentExtensionData>> {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(EXTENSIONS_FILE, "utf-8");
    return JSON.parse(raw) || {};
  } catch (err) {
    console.error("[DB Error] Không thể đọc extensions.json:", err);
    return {};
  }
}

/**
 * Lấy thông tin mở rộng của 1 học sinh theo STT
 */
export async function getExtension(stt: string): Promise<StudentExtensionData | null> {
  const all = await getAllExtensions();
  const cleanStt = stt.trim();
  const targetStt = parseInt(cleanStt, 10).toString();
  return all[cleanStt] || all[targetStt] || null;
}

/**
 * Cập nhật hoặc thêm mới thông tin mở rộng của 1 học sinh
 */
export async function updateExtension(
  stt: string,
  partialData: Partial<StudentExtensionData>
): Promise<StudentExtensionData> {
  ensureDataDir();
  const all = await getAllExtensions();
  const cleanStt = stt.trim();

  const current: StudentExtensionData = all[cleanStt] || {
    stt: cleanStt,
  };

  const updated: StudentExtensionData = {
    ...current,
    ...partialData,
    stt: cleanStt,
    updatedAt: new Date().toISOString(),
  };

  all[cleanStt] = updated;

  try {
    fs.writeFileSync(EXTENSIONS_FILE, JSON.stringify(all, null, 2), "utf-8");
    return updated;
  } catch (err) {
    console.error("[DB Error] Không thể ghi extensions.json:", err);
    throw new Error("Lỗi lưu trữ cơ sở dữ liệu mở rộng.");
  }
}

/**
 * Lấy tất cả tin nhắn
 */
export async function getAllMessages(): Promise<StudentMessage[]> {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(MESSAGES_FILE, "utf-8");
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error("[DB Error] Không thể đọc messages.json:", err);
    return [];
  }
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
  ensureDataDir();
  const all = await getAllMessages();

  const newMsg: StudentMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    stt: data.stt.trim(),
    studentName: data.studentName.trim(),
    sender: data.sender,
    content: data.content.trim(),
    isConfidential: Boolean(data.isConfidential),
    createdAt: new Date().toISOString(),
    status: "unread",
  };

  all.push(newMsg);

  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(all, null, 2), "utf-8");
    return newMsg;
  } catch (err) {
    console.error("[DB Error] Không thể ghi messages.json:", err);
    throw new Error("Lỗi lưu trữ tin nhắn.");
  }
}

/**
 * Cập nhật trạng thái tin nhắn
 */
export async function updateMessageStatus(
  id: string,
  status: "unread" | "read" | "replied"
): Promise<boolean> {
  ensureDataDir();
  const all = await getAllMessages();
  const index = all.findIndex((m) => m.id === id);
  if (index === -1) return false;

  all[index].status = status;
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(all, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[DB Error] Không thể cập nhật trạng thái tin nhắn:", err);
    return false;
  }
}
