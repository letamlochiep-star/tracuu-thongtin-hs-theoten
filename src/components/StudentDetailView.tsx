"use client";

import React, { useState, useEffect } from "react";
import { StudentRecord, StudentExtensionData } from "@/lib/types";
import { groupStudentFields } from "@/lib/schema";

interface Props {
  student: StudentRecord;
  onClose?: () => void;
  isModal?: boolean;
  isTeacher?: boolean;
}

export function StudentDetailView({
  student,
  onClose,
  isModal = false,
  isTeacher = true,
}: Props) {
  const groups = groupStudentFields(student);

  // Dữ liệu mở rộng
  const [ext, setExt] = useState<StudentExtensionData>(
    student.extension || { stt: student.stt }
  );

  // State Form Giáo viên
  const [academic, setAcademic] = useState(ext.academicLastYear || "Khá");
  const [conduct, setConduct] = useState(ext.conductLastYear || "Tốt");
  const [strengths, setStrengths] = useState(ext.strengths || "");
  const [weaknesses, setWeaknesses] = useState(ext.weaknesses || "");
  const [teacherProgressNote, setTeacherProgressNote] = useState(
    ext.teacherProgressNote || ""
  );
  const [teacherSpecialNote, setTeacherSpecialNote] = useState(
    ext.teacherSpecialNote || ""
  );

  const [savingExt, setSavingExt] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State AI Analysis
  const [aiReport, setAiReport] = useState<string>(ext.aiAnalysisReport || "");
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiError, setAiError] = useState("");

  // Đồng bộ lại khi student thay đổi
  useEffect(() => {
    if (student.extension) {
      setExt(student.extension);
      setAcademic(student.extension.academicLastYear || "Khá");
      setConduct(student.extension.conductLastYear || "Tốt");
      setStrengths(student.extension.strengths || "");
      setWeaknesses(student.extension.weaknesses || "");
      setTeacherProgressNote(student.extension.teacherProgressNote || "");
      setTeacherSpecialNote(student.extension.teacherSpecialNote || "");
      setAiReport(student.extension.aiAnalysisReport || "");
    }
  }, [student]);

  // Lưu đánh giá sư phạm
  const handleSaveTeacherNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingExt(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/student/extension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stt: student.stt,
          academicLastYear: academic,
          conductLastYear: conduct,
          strengths,
          weaknesses,
          teacherProgressNote,
          teacherSpecialNote,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setExt(data.extension);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.message || "Không thể lưu đánh giá.");
      }
    } catch {
      alert("Lỗi kết nối khi lưu đánh giá sư phạm.");
    } finally {
      setSavingExt(false);
    }
  };

  // Chạy phân tích AI Gemini Flash
  const handleRunAiAnalysis = async () => {
    setAnalyzingAi(true);
    setAiError("");

    try {
      const res = await fetch("/api/ai/analyze-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stt: student.stt }),
      });

      const data = await res.json();
      if (res.ok && data.ok && data.report) {
        setAiReport(data.report);
      } else {
        setAiError(data.message || "Không thể tạo báo cáo phân tích AI.");
      }
    } catch {
      setAiError("Lỗi kết nối đến dịch vụ AI Gemini.");
    } finally {
      setAnalyzingAi(false);
    }
  };

  const content = (
    <div className="space-y-4 text-left">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-primary to-primary-hover text-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div>
          <div className="text-xs uppercase tracking-wider text-blue-100 font-bold">
            Hồ sơ học sinh lớp 8A6
          </div>
          <div className="text-xl font-bold mt-0.5">{student.hoVaTen}</div>
          <div className="text-xs text-blue-100 mt-1 flex flex-wrap gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded-md">STT: {student.stt}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-md">Ngày sinh: {student.ngaySinh}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-md">Giới tính: {student.gioiTinh}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-md">CCCD: {student.canCuoc || "—"}</span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg p-2 transition text-sm font-bold cursor-pointer"
            title="Đóng"
          >
            ✕ Đóng
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="max-h-[72vh] overflow-y-auto pr-1 space-y-4">
        {/* NẾU LÀ GIÁO VIÊN -> KHỐI ĐÁNH GIÁ SƯ PHẠM & AI GEMINI FLASH */}
        {isTeacher && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* CỘT 1: FORM GHI CHÚ SƯ PHẠM CỦA GVCN */}
            <div className="bg-[#fcfdff] border border-[#d6e7f4] rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#edf4f9]">
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide text-primary-dark">
                  <span>👩‍🏫</span> Ghi Chú & Đánh Giá Sư Phạm Của GVCN
                </div>
                {saveSuccess && (
                  <span className="text-[11px] text-emerald-600 font-bold animate-fadeIn">
                    ✓ Đã lưu!
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveTeacherNotes} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#7890a3] uppercase text-[10px] mb-1">
                      Học lực năm trước
                    </label>
                    <select
                      value={academic}
                      onChange={(e) => setAcademic(e.target.value)}
                      className="w-full h-8 px-2 border border-[#c9deed] rounded-lg bg-white outline-none focus:border-primary"
                    >
                      <option value="Xuất sắc">Xuất sắc</option>
                      <option value="Giỏi">Giỏi</option>
                      <option value="Khá">Khá</option>
                      <option value="Đạt">Đạt</option>
                      <option value="Chưa đạt">Chưa đạt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#7890a3] uppercase text-[10px] mb-1">
                      Hạnh kiểm năm trước
                    </label>
                    <select
                      value={conduct}
                      onChange={(e) => setConduct(e.target.value)}
                      className="w-full h-8 px-2 border border-[#c9deed] rounded-lg bg-white outline-none focus:border-primary"
                    >
                      <option value="Tốt">Tốt</option>
                      <option value="Khá">Khá</option>
                      <option value="Đạt">Đạt</option>
                      <option value="Chưa đạt">Chưa đạt</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#7890a3] uppercase text-[10px] mb-1">
                      Môn thế mạnh
                    </label>
                    <input
                      type="text"
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      placeholder="Toán, Văn, Tin..."
                      className="w-full h-8 px-2 border border-[#c9deed] rounded-lg bg-white outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#7890a3] uppercase text-[10px] mb-1">
                      Môn cần hỗ trợ
                    </label>
                    <input
                      type="text"
                      value={weaknesses}
                      onChange={(e) => setWeaknesses(e.target.value)}
                      placeholder="Tiếng Anh, Lý..."
                      className="w-full h-8 px-2 border border-[#c9deed] rounded-lg bg-white outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#7890a3] uppercase text-[10px] mb-1">
                    Đánh giá quá trình tiến bộ
                  </label>
                  <textarea
                    value={teacherProgressNote}
                    onChange={(e) => setTeacherProgressNote(e.target.value)}
                    placeholder="Nhận xét ý thức, nề nếp, sự cải thiện trong học tập..."
                    rows={2}
                    className="w-full p-2 border border-[#c9deed] rounded-lg bg-white outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#7890a3] uppercase text-[10px] mb-1">
                    Lưu ý riêng / Hoàn cảnh nhạy cảm
                  </label>
                  <input
                    type="text"
                    value={teacherSpecialNote}
                    onChange={(e) => setTeacherSpecialNote(e.target.value)}
                    placeholder="Sức khỏe, hoàn cảnh gia đình..."
                    className="w-full h-8 px-2 border border-[#c9deed] rounded-lg bg-white outline-none focus:border-primary"
                  />
                </div>

                {/* THÔNG TIN HỌC SINH TỰ CHIA SẺ */}
                <div className="p-2.5 bg-[#f0f9f8] border border-[#bce8e3] rounded-xl space-y-1">
                  <div className="font-bold text-[#0d6e64] text-[11px] flex items-center gap-1">
                    <span>🌟</span> Thông tin do học sinh tự cập nhật:
                  </div>
                  <div className="text-[11px] text-[#1e415b]">
                    <strong>Sở thích:</strong> {ext.hobbies || "Chưa cập nhật"}
                  </div>
                  <div className="text-[11px] text-[#1e415b]">
                    <strong>Ước mơ:</strong> {ext.dreams || "Chưa cập nhật"}
                  </div>
                  {ext.personalNote && (
                    <div className="text-[11px] text-[#1e415b] italic">
                      <strong>Lời nhắn:</strong> &ldquo;{ext.personalNote}&rdquo;
                    </div>
                  )}
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingExt}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {savingExt ? "Đang lưu..." : "💾 Lưu Đánh Giá Sư Phạm"}
                  </button>
                </div>
              </form>
            </div>

            {/* CỘT 2: TRỢ LÝ SƯ PHẠM AI GEMINI FLASH */}
            <div className="bg-gradient-to-b from-[#f8faff] to-[#f2f7fc] border border-[#cbdff2] rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#dfeaf5]">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-primary-dark">
                    <span className="text-base">🤖</span> Phân Tích Tự Động Bằng Gemini Flash
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAiAnalysis}
                    disabled={analyzingAi}
                    className="px-3 py-1.5 bg-gradient-to-r from-primary to-[#2b7eb8] hover:from-primary-dark hover:to-primary text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {analyzingAi ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Đang phân tích...
                      </>
                    ) : (
                      <>✨ {aiReport ? "Phân tích lại" : "Chạy phân tích AI"}</>
                    )}
                  </button>
                </div>

                {aiError && (
                  <div className="p-2.5 my-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                    {aiError}
                  </div>
                )}

                {/* Khung hiển thị báo cáo AI */}
                <div className="mt-2.5 max-h-[360px] overflow-y-auto text-xs leading-relaxed space-y-2.5 text-[#1e415b] bg-white p-3.5 rounded-xl border border-[#dce9f2]">
                  {analyzingAi ? (
                    <div className="py-12 text-center space-y-2 text-brandText-muted">
                      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                      <p className="font-semibold text-xs text-primary">
                        Gemini Flash đang tổng hợp 49 trường hồ sơ và xây dựng khuyến nghị sư phạm...
                      </p>
                    </div>
                  ) : aiReport ? (
                    <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed space-y-2">
                      {aiReport}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-brandText-muted space-y-2">
                      <div className="text-2xl">💡</div>
                      <p className="font-medium text-xs">
                        Bấm nút <strong>&ldquo;Chạy phân tích AI&rdquo;</strong> ở trên để Gemini Flash tự động đánh giá chân dung học sinh, điểm mạnh/nguy cơ và đưa ra khuyến nghị sư phạm cho GVCN.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {aiReport && (
                <div className="text-[10px] text-brandText-muted text-right italic">
                  * Báo cáo được tạo bởi Gemini Flash dựa trên hồ sơ lớp 8A6.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9 KHỐI THÔNG TIN HÀNH CHÍNH (49 CỘT THEO SCHEMA) */}
        <div>
          <div className="font-bold text-xs uppercase tracking-wide text-primary-dark mb-2.5 flex items-center gap-1.5">
            <span>📑</span> Toàn Bộ 49 Trường Thông Tin Hành Chính (Theo Nguồn Drive)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {groups.map((group) => (
              <div
                key={group.id}
                className="border border-[#dce9f2] rounded-xl bg-white p-3.5 shadow-sm hover:border-[#b7d5eb] transition"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide text-primary-dark pb-2 mb-2 border-b border-[#edf4f9]">
                  <span className="text-sm">{group.icon}</span>
                  <span>{group.title}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {group.fields.map((f, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg bg-[#fbfdff] border border-[#edf4f9] ${
                        f.label.includes("SN/Xóm") ||
                        f.label.includes("Thông tin") ||
                        f.label.includes("Ghi chú")
                          ? "sm:col-span-2"
                          : ""
                      }`}
                    >
                      <div className="text-[10px] font-bold text-[#7890a3] uppercase mb-0.5">
                        {f.label}
                      </div>
                      <div className="font-medium text-[#1e415b] break-words">
                        {f.value || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/45 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-5xl w-full p-5 shadow-2xl border border-line max-h-[94vh] flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return <div className="mt-3">{content}</div>;
}
