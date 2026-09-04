"use client";

import React, { useState } from "react";
import { AuthSession } from "@/lib/types";

interface Props {
  onSuccess: (user: AuthSession) => void;
}

export function AuthModal({ onSuccess }: Props) {
  const [email, setEmail] = useState("teacher1@example.com");
  const [pin, setPin] = useState("8a6quangtrung");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Đăng nhập thất bại.");
      }

      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-line">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-primary-soft text-primary rounded-2xl flex items-center justify-center mx-auto text-2xl mb-3 border border-[#d3e9f9]">
            🔐
          </div>
          <h2 className="text-xl font-bold text-primary-dark">XÁC THỰC GIÁO VIÊN 8A6</h2>
          <p className="text-xs text-brandText-muted mt-1">
            Hệ thống chứa thông tin nhạy cảm (Căn cước, SĐT, Cha mẹ). Vui lòng đăng nhập để tra cứu.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          <div>
            <label className="block text-xs font-bold text-brandText uppercase mb-1">
              Email giáo viên
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="teacher1@example.com"
              className="w-full h-11 px-3.5 text-sm border border-[#c9deed] rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition bg-[#fbfdff]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brandText uppercase mb-1">
              Mã PIN xác thực giáo viên
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              placeholder="Nhập mã PIN"
              className="w-full h-11 px-3.5 text-sm border border-[#c9deed] rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition bg-[#fbfdff]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-primary to-primary-hover text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "ĐĂNG NHẬP VÀO HỆ THỐNG"
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-line text-[11px] text-brandText-muted text-center space-y-1">
          <div>Email mẫu: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-primary">teacher1@example.com</code></div>
          <div>Mã PIN mặc định: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-primary">8a6quangtrung</code></div>
        </div>
      </div>
    </div>
  );
}
