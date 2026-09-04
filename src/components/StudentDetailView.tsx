"use client";

import React from "react";
import { StudentRecord } from "@/lib/types";
import { groupStudentFields } from "@/lib/schema";

interface Props {
  student: StudentRecord;
  onClose?: () => void;
  isModal?: boolean;
}

export function StudentDetailView({ student, onClose, isModal = false }: Props) {
  const groups = groupStudentFields(student);

  const content = (
    <div className="space-y-4 text-left">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-primary to-primary-hover text-white p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div>
          <div className="text-xs uppercase tracking-wider text-blue-100 font-bold">
            Hồ sơ học sinh lớp 8A6
          </div>
          <div className="text-xl font-bold mt-0.5">{student.hoVaTen}</div>
          <div className="text-xs text-blue-100 mt-1 flex flex-wrap gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded-md">STT: {student.stt}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-md">Ngày sinh: {student.ngaySinh}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-md">Giới tính: {student.gioiTinh}</span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg p-1.5 transition text-sm font-bold"
            title="Đóng"
          >
            ✕
          </button>
        )}
      </div>

      {/* 9 Categorized Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[68vh] overflow-y-auto pr-1">
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
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl max-w-4xl w-full p-5 shadow-2xl border border-line max-h-[92vh] flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return <div className="mt-3">{content}</div>;
}
