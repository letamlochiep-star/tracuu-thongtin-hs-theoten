import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth";
import { getStudents } from "@/lib/drive";
import { getStudentByStt } from "@/lib/search";
import { groupStudentFields } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { stt: string } }
) {
  // 1. Kiểm tra xác thực
  const session = await authenticateApiRequest(req);
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Bạn cần đăng nhập để xem chi tiết hồ sơ học sinh.",
      },
      { status: 401 }
    );
  }

  const stt = params.stt;
  if (!stt) {
    return NextResponse.json(
      { ok: false, message: "Số thứ tự không hợp lệ." },
      { status: 400 }
    );
  }

  try {
    const { students } = await getStudents();
    const student = getStudentByStt(stt, students);

    if (!student) {
      return NextResponse.json(
        { ok: false, message: `Không tìm thấy học sinh có STT ${stt}.` },
        { status: 404 }
      );
    }

    const groups = groupStudentFields(student);

    return NextResponse.json({
      ok: true,
      student,
      groups,
    });
  } catch (error: any) {
    console.error("[Student Detail Error]", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Lỗi đọc dữ liệu học sinh từ máy chủ.",
      },
      { status: 500 }
    );
  }
}
