import { describe, it, expect, beforeEach } from "vitest";
import { getExtension, updateExtension, createMessage, getMessagesByStt, updateMessageStatus } from "../src/lib/db";
import { generateSampleStudents } from "../src/lib/mockData";
import { formatDate } from "../src/lib/parser";
import { createSessionToken, verifySessionToken } from "../src/lib/auth";
import { AuthSession } from "../src/lib/types";

describe("7. Extended Database & Messaging Tests", () => {
  it("Lưu và đọc thông tin mở rộng của học sinh (sở thích, ước mơ, ghi chú GV)", async () => {
    const stt = "1";
    await updateExtension(stt, {
      hobbies: "Đọc sách, Lập trình AI",
      dreams: "Trở thành Kỹ sư phần mềm",
      academicLastYear: "Tốt",
      conductLastYear: "Tốt",
    });

    const ext = await getExtension(stt);
    expect(ext).not.toBeNull();
    expect(ext?.hobbies).toBe("Đọc sách, Lập trình AI");
    expect(ext?.dreams).toBe("Trở thành Kỹ sư phần mềm");
    expect(ext?.academicLastYear).toBe("Tốt");
  });

  it("Gửi và nhận tin nhắn giữa học sinh và giáo viên", async () => {
    const stt = "1";
    const msg = await createMessage({
      stt,
      studentName: "Lê Nguyễn Thùy An",
      sender: "student",
      content: "Thưa cô, em muốn xin thêm tài liệu ôn tập môn Toán ạ.",
      isConfidential: false,
    });

    expect(msg.id).toBeDefined();
    expect(msg.status).toBe("unread");
    expect(msg.sender).toBe("student");

    const studentMsgs = await getMessagesByStt(stt);
    expect(studentMsgs.length).toBeGreaterThanOrEqual(1);
    const found = studentMsgs.find((m) => m.id === msg.id);
    expect(found).toBeDefined();

    // Giáo viên cập nhật trạng thái đã đọc
    const updated = await updateMessageStatus(msg.id, "read");
    expect(updated).toBe(true);
  });
});

describe("8. Student CCCD + BirthDate Authentication Tests", () => {
  const students = generateSampleStudents();

  it("Xác thực đúng học sinh STT 1 bằng CCCD và Ngày sinh", () => {
    const targetCccd = "068313010207";
    const targetBirth = "07/02/2013";

    const matched = students.find((s) => {
      const studentCccd = (s.canCuoc || "").replace(/\D/g, "").trim();
      const studentBirth = (s.ngaySinh || "").trim();
      return studentCccd === targetCccd && studentBirth === targetBirth;
    });

    expect(matched).toBeDefined();
    expect(matched?.stt).toBe("1");
    expect(matched?.hoVaTen).toBe("Lê Nguyễn Thùy An");
  });

  it("Xác thực đúng học sinh STT 3 bằng CCCD và Ngày sinh", () => {
    const targetCccd = "068313001716";
    const targetBirth = "27/07/2013";

    const matched = students.find((s) => {
      const studentCccd = (s.canCuoc || "").replace(/\D/g, "").trim();
      const studentBirth = (s.ngaySinh || "").trim();
      return studentCccd === targetCccd && studentBirth === targetBirth;
    });

    expect(matched).toBeDefined();
    expect(matched?.stt).toBe("3");
    expect(matched?.hoVaTen).toBe("Nguyễn Bảo Anh");
  });

  it("Từ chối nếu sai CCCD hoặc sai Ngày sinh", () => {
    const targetCccd = "068313010207"; // CCCD của STT 1
    const wrongBirth = "15/08/2013"; // Ngày sinh sai

    const matched = students.find((s) => {
      const studentCccd = (s.canCuoc || "").replace(/\D/g, "").trim();
      const studentBirth = (s.ngaySinh || "").trim();
      return studentCccd === targetCccd && studentBirth === wrongBirth;
    });

    expect(matched).toBeUndefined();
  });

  it("Tạo Session Token riêng biệt cho vai trò học sinh kèm STT", async () => {
    const studentSession: AuthSession = {
      email: "hs_1@8a6.student",
      name: "Lê Nguyễn Thùy An",
      role: "student",
      stt: "1",
      cccd: "068313010207",
    };

    const token = await createSessionToken(studentSession);
    const decoded = await verifySessionToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.role).toBe("student");
    expect(decoded?.stt).toBe("1");
    expect(decoded?.name).toBe("Lê Nguyễn Thùy An");
  });
});
