import { NextRequest, NextResponse } from "next/server";
import { getStudents } from "@/lib/drive";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { AuthSession } from "@/lib/types";
import { formatDate } from "@/lib/parser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cccd, birthDate } = body;

    if (!cccd || typeof cccd !== "string") {
      return NextResponse.json(
        { ok: false, message: "Vui lòng nhập số Căn cước công dân (CCCD)." },
        { status: 400 }
      );
    }

    if (!birthDate || typeof birthDate !== "string") {
      return NextResponse.json(
        { ok: false, message: "Vui lòng nhập ngày sinh của học sinh." },
        { status: 400 }
      );
    }

    const cleanCccd = cccd.replace(/\D/g, "").trim();
    const cleanBirthDate = birthDate.trim();

    if (cleanCccd.length < 9 || cleanCccd.length > 12) {
      return NextResponse.json(
        { ok: false, message: "Số CCCD không hợp lệ (phải từ 9 đến 12 chữ số)." },
        { status: 400 }
      );
    }

    // Lấy danh sách học sinh
    const { students } = await getStudents();

    // Chuẩn hóa ngày sinh tìm kiếm
    const formattedInputDate = formatDate(cleanBirthDate);

    // Tìm học sinh có CCCD và Ngày sinh khớp
    const matchedStudent = students.find((s) => {
      const studentCccd = (s.canCuoc || "").replace(/\D/g, "").trim();
      const studentBirth = (s.ngaySinh || "").trim();

      const isCccdMatch = studentCccd === cleanCccd;
      const isBirthMatch =
        studentBirth === cleanBirthDate ||
        formatDate(studentBirth) === formattedInputDate ||
        studentBirth.replace(/^0+/, "") === cleanBirthDate.replace(/^0+/, "");

      return isCccdMatch && isBirthMatch;
    });

    if (!matchedStudent) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Không tìm thấy học sinh với số CCCD và Ngày sinh đã nhập. Vui lòng kiểm tra lại thông tin.",
        },
        { status: 401 }
      );
    }

    // Tạo phiên đăng nhập cho học sinh
    const session: AuthSession = {
      email: `hs_${matchedStudent.stt}@8a6.student`,
      name: matchedStudent.hoVaTen,
      role: "student",
      stt: matchedStudent.stt,
      cccd: matchedStudent.canCuoc,
    };

    const token = await createSessionToken(session);

    const response = NextResponse.json({
      ok: true,
      message: `Xin chào ${matchedStudent.hoVaTen}! Đăng nhập thành công.`,
      user: session,
      studentStt: matchedStudent.stt,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 ngày
    });

    return response;
  } catch (error: any) {
    console.error("[Student Login Error]", error);
    return NextResponse.json(
      { ok: false, message: error?.message || "Lỗi xử lý đăng nhập học sinh." },
      { status: 500 }
    );
  }
}
