# Ghi chú thay đổi trong phiên

## Các thay đổi UI frontend đã làm

### Card công trường trong Management -> Chantiers

- Đưa dòng ngày hiệu lực `Start / End` lên trên dòng địa chỉ trong card công trường trên mobile.
- Tăng độ nổi bật về mặt hiển thị cho dòng `Start / End`.
- Bọc dòng `Start / End` trong một chip có border bo góc.

File đã chỉnh:

- `chantier1/Chantier-web-app-main/Chantier-web-app-main/app/(tabs)/management.tsx`

## Các thao tác runtime frontend đã thực hiện

- Kiểm tra lỗi frontend không truy cập được tại `http://localhost:16035`.
- Xác nhận container `chantier-web` đã dừng trong khi API vẫn hoạt động bình thường.
- Rebuild và khởi động lại container web của frontend.
- Rebuild lại thêm một lần với `--no-cache` sau khi chỉnh UI để đảm bảo bundle mới được phục vụ.

## Kiểm tra việc chạy Expo local

- Kiểm tra các script trong `package.json` của frontend.
- Thử chạy Expo web ở local.
- Ghi nhận xung đột cổng `8081`.
- Ghi nhận Expo web thất bại trên `8082` vì WS tunnel chỉ hỗ trợ cổng `8081`.

## Rule business được yêu cầu trong chat

Rule mới đã chốt:

- Xóa chantier do admin tạo.
- Xóa chantier do collaborator tạo và đã được approve.
- Thời điểm áp dụng: sau 4 tháng kể từ ngày tạo.

Lưu ý:

- Rule này mới chỉ được trao đổi trong chat.
- Chưa được implement vào code trong phiên này.

## Bổ sung tính năng Export admin

- Bổ sung lựa chọn khoảng thời gian tùy chỉnh cho màn `Admin | Export`.
- Giữ nguyên các lựa chọn nhanh `Cette semaine` và `Ce mois`.
- Thêm 2 trường ngày `Du / Au` dùng date picker để chọn khoảng export tùy ý.
- Thêm card custom range cho desktop export và phần chọn khoảng ngày tương ứng trên mobile export.
- Thêm tab **Absences**: xuất dữ liệu nghỉ phép / absences của **tháng tiếp theo** (overlap với tháng sau).
- 4 tab export: This week | This month | Range | Absence (admin / administratif; chef không thấy Range/Absence).

File đã chỉnh:

- `chantier1/Chantier-web-app-main/Chantier-web-app-main/app/(tabs)/export.tsx`
- `chantier1/Chantier-web-app-main/Chantier-web-app-main/components/layoutDesktop/ExportDesktop.tsx`
- `chantier1/Chantier-web-app-main/Chantier-web-app-main/utils/exportAbsenceFormat.ts`
- `chantier1/Chantier-web-app-main/Chantier-web-app-main/utils/exportSpreadsheet.web.ts`
- `chantier1/Chantier-web-app-main/Chantier-web-app-main/i18n/fr.json`
- `chantier1/Chantier-web-app-main/Chantier-web-app-main/i18n/en.json`
