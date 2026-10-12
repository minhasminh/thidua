# HƯỚNG DẪN KHẮC PHỤC TRIỆT ĐỂ LỖI 404 SAU KHI DEPLOY LÊN CPANEL

Tài liệu này giải thích chi tiết nguyên nhân gốc rễ và hướng dẫn từng bước khắc phục lỗi `404 Not Found: The resource requested could not be found on this server!` khi triển khai ứng dụng React Vite SPA lên hosting cPanel.

---

## 1. NGUYÊN NHÂN GỐC RỄ CỦA LỖI 404 TRÊN CPANEL

Ứng dụng của bạn là một **Single Page Application (SPA)** viết bằng React 19 + TypeScript + Vite 7. Khi chạy trên môi trường người dùng, ứng dụng hoạt động hoàn toàn bằng các tệp HTML, CSS, JS tĩnh tải từ máy chủ web Apache.

Lỗi 404 xảy ra tại **Trang chủ** do 3 nguyên nhân chính sau:

1. **cPanel Auto Deploy chưa đưa sản phẩm `dist` vào Document Root**:
   - Khi bạn kết nối kho lưu trữ GitHub vào **cPanel Git Version Control**, cPanel chỉ thực hiện lệnh `git pull` để tải mã nguồn thô vào thư mục kho lưu trữ (ví dụ: `/home/user/repositories/ten_du_an`).
   - cPanel **KHÔNG** tự động sao chép mã vào thư mục web công khai (`public_html`) trừ khi có tệp cấu hình `.cpanel.yml`.
   - Vì thư mục `public_html` của tên miền trống hoặc không có tệp `index.html`, Apache sẽ trả về lỗi:
     `404 Not Found - The resource requested could not be found on this server!`.

2. **Mã nguồn trên GitHub không có thư mục `dist/`**:
   - Theo chuẩn thông lệ quốc tế, tệp `.gitignore` bỏ qua thư mục `dist/`.
   - Trình duyệt chỉ hiểu các tệp sau khi đã build (`dist/index.html` và `dist/assets/*.js`). Trình duyệt **không thể chạy trực tiếp** tệp `index.html` gốc ở thư mục nguồn vì tệp đó chứa thẻ `<script src="/src/main.tsx">`.
   - Nếu hosting không chạy lệnh `npm run build` trước khi phục vụ, thư mục `dist` hoàn toàn không tồn tại trên máy chủ.

3. **Thiếu cấu hình điều hướng Apache (`.htaccess`)**:
   - Khi truy cập trực tiếp các đường dẫn con hoặc tải lại trang (F5), Apache mặc định tìm kiếm thư mục hoặc tệp vật lý tương ứng trên ổ đĩa. Do các route trong React là route ảo (client-side), nếu không có quy tắc Rewrite trong `.htaccess`, Apache sẽ trả về 404.

---

## 2. GIẢI PHÁP ĐÃ THỰC HIỆN TRONG DỰ ÁN

1. **Cấu hình `vite.config.ts`**:
   - Đã thêm `base: './'` để toàn bộ đường dẫn tài nguyên tĩnh (`assets/*.js`, `assets/*.css`) là đường dẫn tương đối. Nhờ đó, ứng dụng hoạt động chính xác cả ở tên miền chính (`https://domain.com/`), tên miền con (`https://sub.domain.com/`) lẫn thư mục con (`https://domain.com/thidua/`).
   - Đã cấu hình `build: { outDir: 'dist', emptyOutDir: true }`.

2. **Bổ sung tệp `.htaccess` chuẩn cho Apache trong `public/`**:
   - Tệp `public/.htaccess` tự động được Vite sao chép sang `dist/.htaccess` mỗi khi chạy `npm run build`.
   - Bao gồm:
     - `DirectoryIndex index.html`: Chỉ định trang chủ mặc định.
     - `RewriteRule ^ index.html [L]`: Điều hướng SPA fallback để không bị 404 khi F5.
     - Cấu hình MIME type chuẩn cho tệp JS/CSS module.
     - Cấu hình vô hiệu hóa cache cho `index.html` để cập nhật phiên bản mới ngay lập tức.

3. **Tạo tệp cấu hình `.cpanel.yml`**:
   - Tự động sao chép toàn bộ tệp tĩnh từ `dist/` và `public/.htaccess` sang `DEPLOYPATH` (`public_html`) mỗi khi thực hiện deploy trên cPanel.

---

## 3. CÁC BƯỚC KHẮC PHỤC TRÊN CPANEL (DÀNH CHO NGƯỜI QUẢN TRỊ)

Tùy vào quyền hạn và gói hosting cPanel của bạn, chọn một trong hai phương án triển khai sau:

### PHƯƠNG ÁN A: Dùng cPanel Terminal / SSH để build trực tiếp (Khuyên dùng)

1. Đăng nhập vào cPanel, mở mục **Terminal** (Dòng lệnh).
2. Di chuyển vào thư mục kho lưu trữ đã clone:
   ```bash
   cd ~/repositories/ten_du_an
   ```
   *(Hoặc thư mục nơi bạn đã clone kho GitHub trên cPanel)*.
3. Kéo mã nguồn mới nhất:
   ```bash
   git pull origin main
   ```
4. Cài đặt dependency và build ứng dụng:
   ```bash
   npm install
   npm run build
   ```
5. Sao chép kết quả build vào Document Root (`public_html`):
   ```bash
   # Nếu là tên miền chính:
   cp -a dist/. ~/public_html/
   
   # Nếu là Subdomain hoặc Addon Domain (ví dụ: thidua.school.edu.vn):
   # cp -a dist/. ~/public_html/thidua/
   ```
6. Kiểm tra lại: Truy cập website trên trình duyệt và nhấn `Ctrl + F5`. Website sẽ hiển thị ngay lập tức.

---

### PHƯƠNG ÁN B: Build trước trên máy tính cá nhân / GitHub rồi đưa `dist` lên cPanel

Nếu hosting cPanel không có quyền truy cập Terminal hoặc không hỗ trợ Node.js:

1. Chạy lệnh build trên máy của bạn:
   ```bash
   npm run build
   ```
2. Mở cPanel -> **File Manager** (Trình quản lý tệp).
3. Đi tới thư mục Document Root của tên miền (thường là `public_html`).
4. Nén toàn bộ nội dung bên trong thư mục `dist` (gồm tệp `index.html`, thư mục `assets`, và tệp `.htaccess`) thành file `dist.zip`.
5. Tải file `dist.zip` lên `public_html` và bấm **Extract** (Giải nén) ngay tại `public_html`.
   *(Lưu ý: Đảm bảo tệp `index.html` nằm trực tiếp trong `public_html/index.html`, không nằm lồng trong thư mục `public_html/dist/index.html`)*.

---

### PHƯƠNG ÁN C: Sử dụng cPanel Git Version Control với `.cpanel.yml`

1. Mở tệp `.cpanel.yml` trong mã nguồn.
2. Kiểm tra dòng `export DEPLOYPATH=/home/$USER/public_html`:
   - Nếu triển khai cho tên miền chính: Giữ nguyên.
   - Nếu triển khai cho subdomain: Đổi thành `export DEPLOYPATH=/home/$USER/public_html/ten_subdomain`.
3. Commit và push tệp `.cpanel.yml` lên GitHub.
4. Trên cPanel:
   - Vào mục **Git Version Control**.
   - Bấm **Manage** cạnh kho lưu trữ của bạn.
   - Chuyển sang tab **Deploy HEAD Commit**.
   - Bấm **Deploy**. cPanel sẽ chạy các tác vụ trong `.cpanel.yml` để đưa tệp sang Document Root.

---

## 4. BẢNG KIỂM TRA ĐỐI CHIẾU (CHECKLIST)

| Bước | Hạng mục kiểm tra | Trạng thái đạt yêu cầu |
|---|---|---|
| 1 | Document Root của tên miền | Vào **Domains** trong cPanel, xem cột Document Root trỏ về đâu (ví dụ: `public_html`). |
| 2 | Tệp `index.html` | Trong thư mục Document Root phải có tệp `index.html` (đã qua build, chứa đường dẫn thẻ `<script>` trỏ vào `./assets/...`). |
| 3 | Tệp `.htaccess` | Trong Document Root phải có tệp `.htaccess` chứa lệnh `DirectoryIndex index.html` và `RewriteRule ^ index.html [L]`. *(Nhớ bật "Show Hidden Files" trong File Manager để nhìn thấy tệp có dấu chấm).* |
| 4 | Thư mục `assets/` | Thư mục `assets/` chứa các tệp CSS và JS đã biên dịch có mặt trong Document Root. |
| 5 | Quyền tệp (File Permissions) | Thư mục đặt quyền `755`, tệp `index.html` và `.htaccess` đặt quyền `644`. |
