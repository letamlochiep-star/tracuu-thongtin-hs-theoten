"use client";

import React, { useState, useEffect, useRef } from "react";
import { AuthSession, StudentRecord, StudentSummary } from "@/lib/types";
import { StudentDetailView } from "@/components/StudentDetailView";
import { StudentPortalView } from "@/components/StudentPortalView";
import { AuthModal } from "@/components/AuthModal";
import { TeacherInboxModal } from "@/components/TeacherInboxModal";

interface MessageItem {
  id: string;
  type: "user" | "bot";
  text?: string;
  isIntro?: boolean;
  matches?: StudentSummary[];
  singleStudent?: StudentRecord;
  isError?: boolean;
  timestamp?: number;
}

const DEFAULT_INTRO_MESSAGE: MessageItem = {
  id: "intro",
  type: "bot",
  isIntro: true,
  text: "Xin chào Thầy/Cô! Hãy nhập số thứ tự hoặc một cụm từ trong họ tên học sinh để tra cứu.",
};

const CHAT_STORAGE_KEY = "chat_history_teacher_8a6_v1";

export default function HomePage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([DEFAULT_INTRO_MESSAGE]);
  const [modalStudent, setModalStudent] = useState<StudentRecord | null>(null);
  const [fetchingDetailStt, setFetchingDetailStt] = useState<string | null>(null);
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const streamEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Kiểm tra phiên đăng nhập & khôi phục lịch sử chat từ localStorage
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setSession(data.user);
          }
        }
      } catch {
        // Unauthenticated
      } finally {
        setCheckingAuth(false);
      }

      // Khôi phục lịch sử chat đã lưu
      try {
        const savedChat = localStorage.getItem(CHAT_STORAGE_KEY);
        if (savedChat) {
          const parsed = JSON.parse(savedChat);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch (e) {
        console.error("Lỗi đọc lịch sử chat từ localStorage:", e);
      }
    }

    init();
  }, []);

  // 2. Lưu tin nhắn chat vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    if (messages.length > 0 && typeof window !== "undefined") {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {
        console.error("Lỗi lưu lịch sử chat:", e);
      }
    }
  }, [messages]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (session?.role !== "student") {
      streamEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, session?.role]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession(null);
    } catch {
      setSession(null);
    }
  };

  const handleClearChatHistory = () => {
    if (window.confirm("Thầy/Cô có muốn xóa toàn bộ lịch sử tra cứu trên màn hình này không?")) {
      const reset = [DEFAULT_INTRO_MESSAGE];
      setMessages(reset);
      try {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      } catch {}
    }
  };

  const executeSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q || loading) return;

    // Thêm tin nhắn của User
    const userMsgId = `user-${Date.now()}`;
    const userMsg: MessageItem = { id: userMsgId, type: "user", text: q, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (res.status === 401) {
        setSession(null);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            type: "bot",
            isError: true,
            text: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            type: "bot",
            isError: true,
            text: data.message || "Không thể thực hiện tra cứu vào lúc này.",
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      // 1. Không có kết quả
      if (!data.matches || data.matches.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            type: "bot",
            text: data.message || "Không tìm thấy học sinh phù hợp. Hãy kiểm tra lại STT hoặc cụm họ tên.",
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      // 2. Đúng 1 kết quả
      if (data.matches.length === 1 && data.singleStudent) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            type: "bot",
            text: "Đã tìm thấy hồ sơ. Thông tin học sinh như sau:",
            singleStudent: data.singleStudent,
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      // 3. Nhiều kết quả
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: "Tôi tìm thấy nhiều học sinh phù hợp. Hãy chọn đúng học sinh trong danh sách bên dưới.",
          matches: data.matches,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          type: "bot",
          isError: true,
          text: "Hệ thống tạm thời chưa đọc được dữ liệu lớp 8A6. Vui lòng thử lại hoặc liên hệ quản trị viên.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleOpenStudentDetail = async (stt: string) => {
    setFetchingDetailStt(stt);
    try {
      const res = await fetch(`/api/student/${stt}`);
      const data = await res.json();
      if (res.ok && data.ok && data.student) {
        setModalStudent(data.student);
      } else {
        alert(data.message || "Không thể tải chi tiết học sinh.");
      }
    } catch {
      alert("Lỗi tải chi tiết học sinh.");
    } finally {
      setFetchingDetailStt(null);
    }
  };

  const useSample = (val: string) => {
    setQuery(val);
    executeSearch(val);
  };

  return (
    <div className="max-w-[1320px] mx-auto p-2 sm:p-4 md:p-6 min-h-screen">
      {/* AUTH MODAL KHI CHƯA ĐĂNG NHẬP */}
      {!checkingAuth && !session && (
        <AuthModal onSuccess={(user) => setSession(user)} />
      )}

      {/* HÒM THƯ TIẾP NHẬN Ý KIẾN HỌC SINH DÀNH CHO GVCN */}
      {showInboxModal && (
        <TeacherInboxModal onClose={() => setShowInboxModal(false)} />
      )}

      {/* NẾU LÀ HỌC SINH ĐĂNG NHẬP -> HIỂN THỊ CỔNG HỌC SINH (STUDENT PORTAL) */}
      {session && session.role === "student" ? (
        <StudentPortalView session={session} onLogout={handleLogout} />
      ) : (
        /* NẾU LÀ GIÁO VIÊN / ADMIN -> HIỂN THỊ WORKSPACE TRA CỨU 8A6 */
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 md:gap-6">
          {/* MODAL CHI TIẾT HỌC SINH */}
          {modalStudent && (
            <StudentDetailView
              student={modalStudent}
              onClose={() => setModalStudent(null)}
              isModal={true}
              isTeacher={true}
            />
          )}

          {/* DESKTOP SIDEBAR (ẨN TRÊN MOBILE ĐỂ TỐI ƯU KHÔNG GIAN) */}
          <aside className="hidden lg:flex bg-gradient-to-br from-[#124f83] via-primary to-[#2d82bf] text-white rounded-3xl p-5 shadow-xl flex-col justify-between self-start sticky top-6 min-h-[calc(100vh-48px)]">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-2xl mb-4 backdrop-blur-md">
                🎓
              </div>

              <h2 className="text-base font-bold uppercase tracking-wide leading-tight">
                THCS Quang Trung
              </h2>
              <div className="text-[11px] text-blue-100 uppercase tracking-wider mt-0.5 font-semibold">
                Xuân Hương - Đà Lạt
              </div>

              <div className="h-px bg-white/20 my-4" />

              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-100 mb-2.5">
                CÔNG CỤ GIÁO VIÊN 8A6
              </div>

              {/* Nút mở hòm thư học sinh */}
              <button
                onClick={() => setShowInboxModal(true)}
                className="w-full mb-3 py-2.5 px-3 bg-white text-primary hover:bg-blue-50 font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📬</span> Hòm Thư Học Sinh 8A6
              </button>

              <div className="space-y-2 text-xs text-blue-50">
                <div className="flex items-start gap-2 p-2 rounded-xl bg-white/10">
                  <span className="text-sm">🔢</span>
                  <span className="text-[11px]">
                    <strong>Tra cứu:</strong> Nhập STT hoặc tên để xem 49 trường hồ sơ.
                  </span>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-xl bg-white/10">
                  <span className="text-sm">👩‍🏫</span>
                  <span className="text-[11px]">
                    <strong>Ghi chú sư phạm:</strong> Ghi nhận học lực, hạnh kiểm, tiến bộ.
                  </span>
                </div>

                <div className="flex items-start gap-2 p-2 rounded-xl bg-white/10">
                  <span className="text-sm">🤖</span>
                  <span className="text-[11px]">
                    <strong>AI Gemini:</strong> Phân tích chân dung & đề xuất sư phạm.
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Footer & Auth Status */}
            <div className="mt-6 pt-3 border-t border-white/20 text-[11px] text-blue-100">
              {session ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[150px]">👤 {session.name}</span>
                    <span className="px-1.5 py-0.5 bg-emerald-500/30 text-emerald-200 rounded-md font-bold text-[9px]">
                      GVCN
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full py-1.5 px-3 bg-white/15 hover:bg-white/25 rounded-lg text-white font-bold transition text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div>Chưa xác thực quyền truy cập</div>
              )}
            </div>
          </aside>

          {/* RIGHT MAIN WORKSPACE */}
          <main className="flex flex-col gap-3 sm:gap-4 min-w-0">
            {/* MOBILE COMPACT TOP BAR (HIỂN THỊ TRÊN ĐIỆN THOẠI) */}
            <div className="lg:hidden bg-gradient-to-r from-[#124f83] to-primary text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl shrink-0">🎓</span>
                <div className="min-w-0">
                  <h2 className="text-xs font-bold uppercase truncate">
                    THCS Quang Trung · Lớp 8A6
                  </h2>
                  <div className="text-[10px] text-blue-100 flex items-center gap-1">
                    <span>GV: {session?.name || "Giáo viên"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setShowInboxModal(true)}
                  className="px-2.5 py-1.5 bg-white text-primary rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <span>📬</span> Hòm thư
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold cursor-pointer"
                  title="Đăng xuất"
                >
                  🚪
                </button>
              </div>
            </div>

            {/* HERO BANNER */}
            <section className="bg-white border border-line rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  CỔNG QUẢN LÝ & CỐ VẤN HỌC SINH 8A6
                </div>
                <h1 className="text-lg sm:text-2xl font-bold text-[#123f62] mt-0.5 uppercase tracking-tight">
                  TRA CỨU & ĐỒNG HÀNH HỌC SINH 8A6
                </h1>
                <p className="text-xs text-brandText-muted mt-0.5 hidden sm:block">
                  Tra cứu hồ sơ 49 trường, lưu đánh giá sư phạm và phân tích tự động bằng Gemini Flash.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChatHistory}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-brandText-muted rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  title="Xóa lịch sử hội thoại trên màn hình"
                >
                  <span>🗑️</span> Xóa hội thoại
                </button>
              </div>
            </section>

            {/* WORKSPACE & CHATBOT */}
            <section className="bg-white border border-line rounded-2xl md:rounded-3xl shadow-sm overflow-hidden flex flex-col flex-1">
              {/* SEARCH INPUT BAR */}
              <div className="p-3 sm:p-5 bg-white border-b border-line">
                <div className="text-xs font-bold text-[#345e7a] uppercase mb-1.5">
                  NHẬP YÊU CẦU TRA CỨU HỌC SINH
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    executeSearch(query);
                  }}
                  className="flex gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ví dụ: 1, 12, Thùy An, Bảo Anh..."
                    className="flex-1 h-11 sm:h-12 px-3.5 sm:px-4 border border-[#c9deed] rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm font-medium transition bg-[#fbfdff]"
                  />

                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="h-11 sm:h-12 px-4 sm:px-6 bg-gradient-to-r from-primary to-primary-hover text-white font-bold rounded-xl shadow-md hover:shadow-lg transition text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      "TRA CỨU"
                    )}
                  </button>
                </form>

                {/* Quick Samples */}
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap overflow-x-auto pb-0.5">
                  <span className="text-[10px] sm:text-[11px] text-brandText-muted font-bold mr-0.5 shrink-0">
                    Mẫu nhanh:
                  </span>
                  {["1", "12", "Thùy An", "Bảo Anh", "Gia Bảo"].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => useSample(sample)}
                      className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] bg-[#f7fbff] hover:bg-primary-soft text-[#466d87] hover:text-primary border border-[#d5e7f4] rounded-full transition cursor-pointer font-medium shrink-0"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* CHAT STREAM AREA (TỰ ĐỘNG LƯU VÀO LOCALSTORAGE) */}
              <div className="p-3 sm:p-5 bg-gradient-to-b from-[#f8fcff] to-white flex-1 min-h-[320px] sm:min-h-[380px] max-h-[560px] overflow-y-auto space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#345e7a] uppercase mb-0.5">
                  <span>HỘI THOẠI TRA CỨU (TỰ ĐỘNG LƯU)</span>
                  <span className="text-[10px] text-emerald-600 font-normal lowercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    đã đồng bộ
                  </span>
                </div>

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.type === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Text Bubble */}
                    {msg.text && (
                      <div
                        className={`max-w-[90%] sm:max-w-[80%] md:max-w-[75%] p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                          msg.type === "user"
                            ? "bg-gradient-to-r from-primary to-primary-hover text-white rounded-br-none"
                            : msg.isIntro
                            ? "bg-[#f3f9fe] text-[#3e647e] border border-[#d8e8f4] rounded-bl-none font-medium"
                            : msg.isError
                            ? "bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-none"
                            : "bg-white text-[#23445d] border border-[#d8e8f4] rounded-bl-none font-medium"
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}

                    {/* Single Student Profile Card */}
                    {msg.singleStudent && (
                      <div className="w-full mt-2 animate-fadeIn">
                        <StudentDetailView
                          student={msg.singleStudent}
                          isTeacher={true}
                        />
                      </div>
                    )}

                    {/* Multiple Matches Student List */}
                    {msg.matches && msg.matches.length > 0 && (
                      <div className="w-full mt-2 space-y-2 max-w-2xl">
                        {msg.matches.map((m) => (
                          <div
                            key={m.id}
                            className="p-3 bg-white border border-[#d6e6f2] hover:border-primary rounded-xl flex items-center justify-between gap-2.5 shadow-sm transition"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-xs sm:text-sm text-primary-dark truncate">
                                {m.name}
                              </div>
                              <div className="text-[11px] text-brandText-muted mt-0.5 flex gap-2.5 flex-wrap">
                                <span>STT: <strong>{m.stt}</strong></span>
                                <span>Sinh: {m.birthDate || "—"}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleOpenStudentDetail(m.stt)}
                              disabled={fetchingDetailStt === m.stt}
                              className="px-2.5 py-1.5 sm:px-3 bg-primary-soft hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              {fetchingDetailStt === m.stt ? "ĐANG TẢI..." : "XEM HỒ SƠ ▾"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Spinner when loading */}
                {loading && (
                  <div className="flex items-start">
                    <div className="bg-white border border-[#d8e8f4] p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-xs text-brandText-muted">
                      <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span>Đang tra cứu dữ liệu 8A6...</span>
                    </div>
                  </div>
                )}

                <div ref={streamEndRef} />
              </div>
            </section>
          </main>
        </div>
      )}
    </div>
  );
}
