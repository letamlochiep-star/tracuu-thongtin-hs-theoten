import { StudentRecord } from "./types";
import { SCHEMA_FIELDS } from "./schema";

const SAMPLE_NAMES = [
  "Nguyễn Bảo Anh",
  "Trần Gia Bảo",
  "Lê Thùy An",
  "Phạm Minh Đăng",
  "Hoàng Quốc Huy",
  "Vũ Ngọc Diệp",
  "Đỗ Tuấn Khang",
  "Bùi Thị Mai",
  "Đặng Quang Vinh",
  "Ngô Bảo Ngọc",
  "Dương Thành Nam",
  "Nguyễn Thị Hương Giang",
  "Lý Gia Hưng",
  "Đinh Trọng Hiếu",
  "Trịnh Mỹ Duyên",
  "Hồ Khánh An",
  "Võ Đức Phúc",
  "Phan Thị Kim Ngân",
  "Trần Minh Trí",
  "Nguyễn Hoàng Quân",
  "Lê Văn Nam",
  "Mai Thị Thanh Trúc",
  "Đỗ Hải Đăng",
  "Nguyễn Thảo Nguyên",
  "Vương Đình Phong",
  "Cao Nhật Minh",
  "Tạ Bảo Châu",
  "Lương Gia Huy",
  "Hà Phương Linh",
  "Chu Mạnh Hùng",
  "Trương Kiều Trang",
  "Lâm Quốc Anh",
  "Đoàn Văn Hậu",
  "Nguyễn Phúc Lâm",
  "Phan Hải Yến",
  "Huỳnh Tuấn Kiệt",
  "Trần Thị Ngọc Ánh",
  "Lê Hoàng Bách",
  "Vũ Minh Châu",
  "Đặng Thu Trang",
  "Nguyễn Đức Anh",
  "Trần Phương Vy",
  "Phạm Hoàng Nam",
];

export function generateSampleStudents(): StudentRecord[] {
  return SAMPLE_NAMES.map((name, index) => {
    const stt = (index + 1).toString();
    const padStt = stt.padStart(2, "0");
    const cccd = `06820900${padStt}12`;
    const sdtBo = `09123456${padStt}`;
    const sdtMe = `09876543${padStt}`;
    const sdtHs = `09012345${padStt}`;
    const rawDataMap: Record<string, string> = {};

    const student: StudentRecord = {
      id: `stt-${stt}`,
      stt: stt,
      maHocSinh: `HS8A6${padStt}`,
      maVemis: `VEMIS${padStt}8A6`,
      maMoet: `068012${padStt}`,
      soDangBo: `DB-8A6-${padStt}`,
      hoVaTen: name,
      ngaySinh: `${(index % 28) + 1}/0${(index % 12) + 1}/2011`,
      ngayVaoTruong: "05/09/2022",
      gioiTinh: index % 2 === 0 ? "Nam" : "Nữ",
      quocTich: "Việt Nam",
      choO_SNXom: `${index * 3 + 12} Phù Đổng Thiên Vương`,
      choO_KhuDanCu: "Khu 3",
      choO_XaPhuong: "Phường 8",
      choO_TinhTp: "Lâm Đồng",
      hokhau_SNXom: `${index * 3 + 12} Phù Đổng Thiên Vương`,
      hokhau_KhuDanCu: "Khu 3",
      hokhau_XaPhuong: "Phường 8",
      hokhau_TinhTp: "Lâm Đồng",
      noiSinh_ThongTin: "Bệnh viện Đa khoa Lâm Đồng",
      noiSinh_XaPhuong: "Phường 1",
      noiSinh_TinhTp: "Lâm Đồng",
      queQuan_ThongTin: "Xuân Hương - Đà Lạt",
      queQuan_XaPhuong: "Phường 8",
      queQuan_TinhTp: "Lâm Đồng",
      noiKhaiSinh_XaPhuong: "Phường 8",
      noiKhaiSinh_TinhTp: "Lâm Đồng",
      canCuoc: cccd,
      ngayCapCanCuoc: "15/06/2024",
      noiCapCanCuoc: "Cục Cảnh sát QLHC về TTXH",
      danToc: index === 5 ? "K'Ho" : "Kinh",
      tonGiao: index % 3 === 0 ? "Công giáo" : "Không",
      dienChinhSach: "—",
      canNgheo: index === 3 ? "Có" : "Không",
      doanVien: "Chưa",
      doiVien: "Có",
      tenCha: `Nguyễn Văn ${String.fromCharCode(65 + (index % 26))}`,
      ngheNghiepCha: "Công chức / Kinh doanh",
      namSinhCha: "1980",
      tenMe: `Trần Thị ${String.fromCharCode(75 + (index % 15))}`,
      ngheNghiepMe: "Giáo viên / Nội trợ",
      namSinhMe: "1984",
      dienThoaiSLL: sdtBo,
      emailSLL: `phuhuynh.hs${padStt}@gmail.com`,
      dienThoaiBo: sdtBo,
      dienThoaiMe: sdtMe,
      dienThoaiHS: sdtHs,
      khuyetTat: "Không",
      ntruBtru: "Bán trú",
      ghiChu: "—",
      rawData: rawDataMap,
    };

    for (const field of SCHEMA_FIELDS) {
      const val = (student as unknown as Record<string, string>)[field.key] || "—";
      rawDataMap[field.label] = val;
    }
    student.rawData = rawDataMap;

    return student;
  });
}
