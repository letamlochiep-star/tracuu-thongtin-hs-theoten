export interface FieldDefinition {
  index: number;
  column: string;
  label: string;
  key: string;
}

export interface StudentRecord {
  id: string; // e.g. "stt-1"
  stt: string; // Cột A
  maHocSinh: string; // Cột B
  maVemis: string; // Cột C
  maMoet: string; // Cột D
  soDangBo: string; // Cột E
  hoVaTen: string; // Cột F
  ngaySinh: string; // Cột G
  ngayVaoTruong: string; // Cột H
  gioiTinh: string; // Cột I
  quocTich: string; // Cột J
  choO_SNXom: string; // Cột K
  choO_KhuDanCu: string; // Cột L
  choO_XaPhuong: string; // Cột M
  choO_TinhTp: string; // Cột N
  hokhau_SNXom: string; // Cột O
  hokhau_KhuDanCu: string; // Cột P
  hokhau_XaPhuong: string; // Cột Q
  hokhau_TinhTp: string; // Cột R
  noiSinh_ThongTin: string; // Cột S
  noiSinh_XaPhuong: string; // Cột T
  noiSinh_TinhTp: string; // Cột U
  queQuan_ThongTin: string; // Cột V
  queQuan_XaPhuong: string; // Cột W
  queQuan_TinhTp: string; // Cột X
  noiKhaiSinh_XaPhuong: string; // Cột Y
  noiKhaiSinh_TinhTp: string; // Cột Z
  canCuoc: string; // Cột AA
  ngayCapCanCuoc: string; // Cột AB
  noiCapCanCuoc: string; // Cột AC
  danToc: string; // Cột AD
  tonGiao: string; // Cột AE
  dienChinhSach: string; // Cột AF
  canNgheo: string; // Cột AG
  doanVien: string; // Cột AH
  doiVien: string; // Cột AI
  tenCha: string; // Cột AJ
  ngheNghiepCha: string; // Cột AK
  namSinhCha: string; // Cột AL
  tenMe: string; // Cột AM
  ngheNghiepMe: string; // Cột AN
  namSinhMe: string; // Cột AO
  dienThoaiSLL: string; // Cột AP
  emailSLL: string; // Cột AQ
  dienThoaiBo: string; // Cột AR
  dienThoaiMe: string; // Cột AS
  dienThoaiHS: string; // Cột AT
  khuyetTat: string; // Cột AU
  ntruBtru: string; // Cột AV
  ghiChu: string; // Cột AW
  rawData: Record<string, string>; // 49 trường với key là label chuẩn
}

export interface StudentSummary {
  id: string;
  stt: string;
  name: string;
  birthDate: string;
}

export interface SearchResponse {
  ok: boolean;
  query: string;
  total: number;
  matches: StudentSummary[];
  singleStudent?: StudentRecord;
  message?: string;
}

export interface FieldGroup {
  id: string;
  title: string;
  icon: string;
  fields: {
    label: string;
    value: string;
  }[];
}

export interface AuthSession {
  email: string;
  name: string;
  role: "teacher" | "admin";
  iat?: number;
  exp?: number;
}
