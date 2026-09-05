import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth";
import { getMessagesByStt, getAllMessages, createMessage, updateMessageStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await authenticateApiRequest(req);
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Bạn cần đăng nhập để xem tin nhắn." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const stt = searchParams.get("stt");

  // Nếu là học sinh, chỉ lấy tin nhắn của chính mình
  if (session.role === "student") {
    const studentStt = session.stt || "";
    const messages = await getMessagesByStt(studentStt);
    return NextResponse.json({ ok: true, messages });
  }

  // Nếu là giáo viên:
  if (stt) {
    const messages = await getMessagesByStt(stt);
    return NextResponse.json({ ok: true, messages });
  }

  const allMessages = await getAllMessages();
  return NextResponse.json({ ok: true, messages: allMessages });
}

export async function POST(req: NextRequest) {
  const session = await authenticateApiRequest(req);
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Bạn cần đăng nhập để gửi tin nhắn." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { content, isConfidential, action, messageId, newStatus } = body;

    // Cập nhật trạng thái tin nhắn (dành cho giáo viên đánh dấu đã đọc/phản hồi)
    if (action === "update_status" && messageId && newStatus) {
      if (session.role !== "teacher" && session.role !== "admin") {
        return NextResponse.json(
          { ok: false, message: "Chỉ giáo viên mới có quyền cập nhật trạng thái tin nhắn." },
          { status: 403 }
        );
      }
      const ok = await updateMessageStatus(messageId, newStatus);
      return NextResponse.json({ ok, message: "Đã cập nhật trạng thái." });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { ok: false, message: "Nội dung tin nhắn không được để trống." },
        { status: 400 }
      );
    }

    let stt = "";
    let studentName = "";
    let sender: "student" | "teacher" = "student";

    if (session.role === "student") {
      stt = session.stt || "";
      studentName = session.name || "Học sinh";
      sender = "student";
    } else {
      stt = body.stt ? String(body.stt).trim() : "";
      studentName = body.studentName ? String(body.studentName).trim() : "Học sinh";
      sender = "teacher";

      if (!stt) {
        return NextResponse.json(
          { ok: false, message: "Giáo viên cần chọn học sinh để gửi phản hồi." },
          { status: 400 }
        );
      }
    }

    const newMsg = await createMessage({
      stt,
      studentName,
      sender,
      content,
      isConfidential: Boolean(isConfidential),
    });

    return NextResponse.json({
      ok: true,
      message: "Đã gửi tin nhắn thành công.",
      data: newMsg,
    });
  } catch (error: any) {
    console.error("[Message Error]", error);
    return NextResponse.json(
      { ok: false, message: error?.message || "Lỗi xử lý tin nhắn." },
      { status: 500 }
    );
  }
}
