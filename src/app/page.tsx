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
}

export default function HomePage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "intro",
      type: "bot",
      isIntro: true,
      text: "Xin chào Thầy/Cô! Hãy nhập số thứ tự hoặc một cụm từ trong họ tên học sinh để tra cứu.",
    },
  ]);
  const [modalStudent, setModalStudent] = useState<StudentRecord | null>(null);
  const [fetchingDetailStt, setFetchingDetailStt] = useState<string | null>(null);
  const [showInboxModal, setShowInboxModal] = useState(false);

  const streamEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Kiểm tra phiên đăng nhập khi tải trang
  useEffect(() => {
    async function checkAuth() {
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
    }
    checkAuth();
  }, []);

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

  const executeSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q || loading) return;

    // Thêm tin nhắn của User
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, type: "user", text: q }]);
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
            text: "Phiên làm việc đã hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại.",
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
    <div className="max-w-[1320px] mx-auto p-4 md:p-6 min-h-screen">
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
        <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6">
          {/* MODAL CHI TIẾT HỌC SINH */}
          {modalStudent && (
            <StudentDetailView
              student={modalStudent}
              onClose={() => setModalStudent(null)}
              isModal={true}
              isTeacher={true}
            />
          )}

          {/* LEFT SIDEBAR */}
          <aside className="bg-gradient-to-br from-[#124f83] via-primary to-[#2d82bf] text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between self-start sticky top-6 min-h-[calc(100vh-48px)]">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-3xl mb-5 backdrop-blur-md">
                🎓
              </div>

              <h2 className="text-lg font-bold uppercase tracking-wide leading-tight">
                Trường THCS Quang Trung
              </h2>
              <div className="text-xs text-blue-100 uppercase tracking-wider mt-1 font-semibold">
                Xuân Hương - Đà Lạt
              </div>

              <div className="h-px bg-white/20 my-5" />

              <div className="text-xs font-bold uppercase tracking-wider text-blue-100 mb-3">
                CÔNG CỤ GIÁO VIÊN 8A6
              </div>

              {/* Nút mở hòm thư học sinh */}
              <button
                onClick={() => setShowInboxModal(true)}
                className="w-full mb-4 py-2.5 px-3 bg-white text-primary hover:bg-blue-50 font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📬</span> Hòm Thư Học Sinh 8A6
              </button>

              <div className="space-y-2.5 text-xs text-blue-50">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/10">
                  <span className="text-base">🔢</span>
                  <span>
                    <strong>Tra cứu 49 trường:</strong> Nhập STT hoặc tên để mở hồ sơ gốc từ Google Drive.
                  </span>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/10">
                  <span className="text-base">👩‍🏫</span>
                  <span>
                    <strong>Ghi chú sư phạm:</strong> Bổ sung học lực, hạnh kiểm năm trước và tiến bộ.
                  </span>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/10">
                  <span className="text-base">🤖</span>
                  <span>
                    <strong>AI Gemini Flash:</strong> 1-Click phân tích chân dung & gợi ý sư phạm.
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Footer & Auth Status */}
            <div className="mt-8 pt-4 border-t border-white/20 text-[11px] text-blue-100">
              {session ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="truncate">👤 {session.name}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 rounded-full font-bold text-[10px]">
                      Giáo viên
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
              <div className="mt-3 text-[10px] text-blue-200/80 leading-relaxed">
                Dữ liệu được bảo vệ. Không lưu trữ thông tin nhạy cảm ở phía máy khách.
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN WORKSPACE */}
          <main className="flex flex-col gap-5 min-w-0">
            {/* HERO BANNER */}
            <section className="bg-white border border-line rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-primary">
                  BẢNG ĐIỀU KHIỂN GIÁO VIÊN CHỦ NHIỆM
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#123f62] mt-1 uppercase tracking-tight">
                  QUẢN LÝ & TRA CỨU HỌC SINH LỚP 8A6
                </h1>
                <p className="text-xs md:text-sm text-brandText-muted mt-1">
                  Tra cứu hồ sơ 49 trường, cập nhật đánh giá sư phạm và phân tích tự động bằng Gemini Flash.
                </p>
              </div>

              <button
                onClick={() => setShowInboxModal(true)}
                className="self-start md:self-auto px-4 py-2.5 bg-gradient-to-r from-primary to-primary-hover text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span>📬</span> Xem Hòm Thư Học Sinh
              </button>
            </section>

            {/* WORKSPACE & CHATBOT */}
            <section className="bg-white border border-line rounded-3xl shadow-sm overflow-hidden flex flex-col flex-1">
              {/* Header */}
              <div className="p-4 md:px-6 border-b border-line flex items-center justify-between bg-gradient-to-b from-white to-[#f9fcff]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary border border-[#d3e9f9] flex items-center justify-center text-xl">
                    🤖
                  </div>
                  <div>
                    <strong className="block text-sm text-[#164f7a]">
                      Trợ lý tra cứu & cố vấn 8A6
                    </strong>
                    <small className="text-xs text-[#8498a8]">
                      Tra cứu STT hoặc cụm từ họ tên
                    </small>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-brandText-muted font-medium">Hệ thống sẵn sàng</span>
                </div>
              </div>

              {/* SEARCH INPUT BAR */}
              <div className="p-4 md:px-6 bg-white border-b border-line">
                <div className="text-xs font-bold text-[#345e7a] uppercase mb-2">
                  NHẬP YÊU CẦU TRA CỨU HỌC SINH
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    executeSearch(query);
                  }}
                  className="flex flex-col sm:flex-row gap-2.5"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ví dụ: 1, 12, Thùy An hoặc Nguyễn Bảo"
                    className="flex-1 h-12 px-4 border border-[#c9deed] rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium transition bg-[#fbfdff]"
                  />

                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="h-12 px-6 bg-gradient-to-r from-primary to-primary-hover text-white font-bold rounded-xl shadow-md hover:shadow-lg transition text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shrink-0"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      "TRA CỨU"
                    )}
                  </button>
                </form>

                {/* Quick Samples */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <span className="text-[11px] text-brandText-muted font-bold mr-1">
                    Gợi ý mẫu:
                  </span>
                  {["1", "12", "Thùy An", "Bảo Anh", "Gia Bảo"].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => useSample(sample)}
                      className="px-2.5 py-1 text-xs bg-[#f7fbff] hover:bg-primary-soft text-[#466d87] hover:text-primary border border-[#d5e7f4] rounded-full transition cursor-pointer font-medium"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* CHAT STREAM AREA */}
              <div className="p-4 md:p-6 bg-gradient-to-b from-[#f8fcff] to-white flex-1 min-h-[380px] max-h-[600px] overflow-y-auto space-y-4">
                <div className="text-xs font-bold text-[#345e7a] uppercase mb-1">
                  KẾT QUẢ PHẢN HỒI
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
                        className={`max-w-[85%] md:max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
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
                            className="p-3.5 bg-white border border-[#d6e6f2] hover:border-primary rounded-xl flex items-center justify-between gap-3 shadow-sm transition"
                          >
                            <div>
                              <div className="font-bold text-sm text-primary-dark">
                                {m.name}
                              </div>
                              <div className="text-xs text-brandText-muted mt-0.5 flex gap-3">
                                <span>STT: <strong>{m.stt}</strong></span>
                                <span>Ngày sinh: {m.birthDate || "—"}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleOpenStudentDetail(m.stt)}
                              disabled={fetchingDetailStt === m.stt}
                              className="px-3 py-1.5 bg-primary-soft hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              {fetchingDetailStt === m.stt ? "ĐANG TẢI..." : "XEM HỒ SƠ & ĐÁNH GIÁ ▾"}
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
                    <div className="bg-white border border-[#d8e8f4] p-3.5 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-xs text-brandText-muted">
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span>Đang tra cứu hồ sơ dữ liệu 8A6...</span>
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
