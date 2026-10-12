import React, { useState } from 'react';
import {
  Server,
  FileCheck,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Layers,
  FolderTree,
  Terminal,
  HelpCircle,
  CheckCircle2,
  FolderCheck
} from 'lucide-react';

export const DeploymentDiagnosticView: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const htaccessContent = `# Apache configuration for Vite React Single Page Application (SPA) on cPanel
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Chỉ định tệp trang chủ mặc định
  DirectoryIndex index.html

  # 2. Không chuyển hướng nếu yêu cầu trùng với tệp thực tế đang tồn tại (CSS, JS, ảnh, v.v.)
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 3. Chuyển hướng tất cả các yêu cầu còn lại về index.html (Khắc phục lỗi 404 khi tải lại trang hoặc truy cập link trực tiếp)
  RewriteRule ^ index.html [L]
</IfModule>

# MIME Types chuẩn cho JavaScript ES Module và tài nguyên web
<IfModule mod_mime.c>
  AddType application/javascript .js .mjs
  AddType text/css .css
  AddType image/svg+xml .svg
  AddType application/json .json
  AddType font/woff2 .woff2
</IfModule>

# Ngăn chặn duyệt danh sách thư mục (Directory Listing)
Options -Indexes

# Cấu hình tránh lưu cache tệp index.html để luôn nhận bản build mới sau khi deploy
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  <Files "index.html">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </Files>
</IfModule>`;

  const cpanelYmlContent = `---
deployment:
  tasks:
    # 1. Đường dẫn thư mục Document Root trên cPanel
    # Thay đổi $USER hoặc thay đổi theo thư mục subdomain (ví dụ: /home/$USER/public_html)
    - export DEPLOYPATH=/home/$USER/public_html
    - /bin/mkdir -p $DEPLOYPATH
    - export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:~/.nvm/versions/node/$(ls ~/.nvm/versions/node 2>/dev/null | tail -n 1)/bin
    - if [ ! -d "dist" ] && which npm >/dev/null 2>&1; then npm run build; fi
    - if [ -d "dist" ]; then /bin/cp -a dist/. $DEPLOYPATH/; fi
    - if [ -f "public/.htaccess" ]; then /bin/cp public/.htaccess $DEPLOYPATH/.htaccess; fi`;

  const terminalQuickFix = `# Khắc phục lỗi 404 trên cPanel Terminal / SSH trong 1 phút:
cd ~/repositories/ten_kho_luu_tru
git pull origin main
npm install
npm run build
cp -a dist/. ~/public_html/
chmod -R 755 ~/public_html/
chmod 644 ~/public_html/.htaccess ~/public_html/index.html`;

  // Detect client scripts and stylesheets
  const scriptTags = Array.from(document.querySelectorAll('script[src]')).map(
    (s) => s.getAttribute('src') || ''
  );
  const linkStylesheets = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  ).map((l) => l.getAttribute('href') || '');

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-950">
              Giới hạn kỹ thuật và Phạm vi chẩn đoán
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Mã nguồn đang chạy trong môi trường trình duyệt client-side của người dùng. Do cơ chế bảo mật (Sandbox),
              trình duyệt <strong>không thể trực tiếp đọc cấu trúc thư mục máy chủ cPanel</strong>, không thể tự kiểm tra
              đường dẫn ổ đĩa vật lý của máy chủ lưu trữ (ví dụ <code>/home/username/...</code>) hoặc đọc file nhật ký lỗi (error log)
              của Apache. Bảng dưới đây cung cấp thông số cấu hình của ứng dụng cùng checklist đối chiếu để quản trị viên
              kiểm tra và khắc phục triệt để lỗi 404 trên cPanel.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Loại dự án</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-base font-bold text-slate-900">Vite React SPA</div>
          <p className="text-[11px] text-slate-500">Tĩnh (Static HTML/JS/CSS), React 19 + Vite 7</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Thư mục đầu ra Vite</span>
            <FolderCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-slate-900">dist/</div>
          <p className="text-[11px] text-slate-500">Đầu ra chứa index.html, .htaccess & assets/</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Đường dẫn Base URL</span>
            <FolderTree className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-base font-bold text-slate-900">./ (Tương đối)</div>
          <p className="text-[11px] text-slate-500">Tương thích cả Root Domain, Subdomain & Thư mục con</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Cấu hình Web Server</span>
            <Server className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-base font-bold text-slate-900">Apache / LiteSpeed</div>
          <p className="text-[11px] text-slate-500">Hỗ trợ mod_rewrite qua public/.htaccess</p>
        </div>
      </div>

      {/* Root Cause Analysis on cPanel 404 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          Vì sao truy cập trang chủ trên cPanel lại bị lỗi 404 Not Found?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-red-600 flex items-center gap-1.5">
              <span>1. Document Root bị trống</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              cPanel Git Version Control chỉ thực hiện <code>git pull</code> về thư mục lưu trữ mã nguồn. Nếu không cấu hình tệp <code>.cpanel.yml</code> sao chép tệp sang <code>public_html</code>, thư mục phục vụ web của tên miền hoàn toàn trống.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-red-600 flex items-center gap-1.5">
              <span>2. Thư mục dist/ chưa được build</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Thư mục <code>dist/</code> nằm trong <code>.gitignore</code> nên GitHub không lưu mã build sẵn. Trình duyệt không thể chạy trực tiếp <code>index.html</code> gốc vì chứa thẻ <code>src/main.tsx</code>. Cần lệnh <code>npm run build</code> trước khi đưa vào Document Root.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-red-600 flex items-center gap-1.5">
              <span>3. Thiếu tệp .htaccess</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Nếu không có tệp <code>.htaccess</code> với lệnh <code>DirectoryIndex index.html</code> và <code>RewriteRule ^ index.html [L]</code>, Apache sẽ không thể phục vụ trang chủ hoặc báo 404 khi người dùng tải lại trang.
            </p>
          </div>
        </div>
      </div>

      {/* Checklist for Admin */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Checklist 5 bước đối chiếu và sửa lỗi 404 trên cPanel
        </h3>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">1</div>
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-800">Xác định chính xác Document Root của tên miền trên cPanel</span>
              <p className="text-slate-600">
                Vào cPanel &rarr; mục <strong>Domains</strong> (Tên miền) &rarr; kiểm tra cột <strong>Document Root</strong>.
                Với tên miền chính thường là <code>/home/username/public_html</code>. Với subdomain hoặc addon domain thường là <code>/home/username/public_html/ten_subdomain</code> hoặc <code>/home/username/ten_subdomain</code>.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">2</div>
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-800">Kiểm tra sự tồn tại của tệp index.html trong Document Root</span>
              <p className="text-slate-600">
                Mở <strong>File Manager</strong> &rarr; đi vào đúng Document Root đã xác định ở Bước 1. Đảm bảo có tệp <code>index.html</code> (được sao chép từ thư mục <code>dist/</code> sau khi build).
                <em>Lưu ý: Không được để tệp nằm lồng trong thư mục con như <code>public_html/dist/index.html</code>.</em>
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">3</div>
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-800">Kiểm tra tệp .htaccess trong Document Root</span>
              <p className="text-slate-600">
                Trong File Manager, bấm nút <strong>Settings</strong> ở góc trên bên phải &rarr; chọn <strong>Show Hidden Files (dotfiles)</strong> &rarr; Save.
                Đảm bảo có tệp <code>.htaccess</code> chứa luật điều hướng Rewrite sang <code>index.html</code>.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">4</div>
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-800">Kiểm tra thư mục tài nguyên tĩnh assets/</span>
              <p className="text-slate-600">
                Thư mục <code>assets/</code> chứa các tệp JavaScript và CSS đã mã hóa phải nằm cùng cấp với tệp <code>index.html</code> trong Document Root (ví dụ: <code>public_html/assets/</code>).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">5</div>
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-800">Kiểm tra phân quyền tệp (File Permissions)</span>
              <p className="text-slate-600">
                Thư mục <code>public_html</code> và <code>assets</code> phải có quyền <code>755</code> (drwxr-xr-x).
                Các tệp <code>index.html</code> và <code>.htaccess</code> phải có quyền <code>644</code> (-rw-r--r--).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Command Quick Copy */}
      <div className="bg-slate-900 rounded-2xl p-5 text-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">
              Lệnh xử lý nhanh qua cPanel Terminal / SSH
            </span>
          </div>
          <button
            onClick={() => handleCopy(terminalQuickFix, 'terminal')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors cursor-pointer"
          >
            {copiedSection === 'terminal' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Đã sao chép
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Sao chép lệnh
              </>
            )}
          </button>
        </div>
        <pre className="text-xs font-mono bg-slate-950 p-3.5 rounded-xl text-emerald-300 overflow-x-auto whitespace-pre">
          {terminalQuickFix}
        </pre>
      </div>

      {/* Configuration Files Viewers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* .htaccess */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900">
                Nội dung tệp public/.htaccess (Đã tích hợp vào dist/)
              </span>
            </div>
            <button
              onClick={() => handleCopy(htaccessContent, 'htaccess')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              {copiedSection === 'htaccess' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Đã sao chép
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Sao chép
                </>
              )}
            </button>
          </div>
          <pre className="text-[11px] font-mono bg-slate-50 p-3 rounded-xl text-slate-800 border border-slate-200 overflow-x-auto max-h-60 overflow-y-auto">
            {htaccessContent}
          </pre>
        </div>

        {/* .cpanel.yml */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">
                Nội dung tệp .cpanel.yml (Dùng cho cPanel Auto Deploy)
              </span>
            </div>
            <button
              onClick={() => handleCopy(cpanelYmlContent, 'cpanel')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              {copiedSection === 'cpanel' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Đã sao chép
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Sao chép
                </>
              )}
            </button>
          </div>
          <pre className="text-[11px] font-mono bg-slate-50 p-3 rounded-xl text-slate-800 border border-slate-200 overflow-x-auto max-h-60 overflow-y-auto">
            {cpanelYmlContent}
          </pre>
        </div>
      </div>

      {/* Runtime inspection in current browser */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Kiểm tra tài nguyên Client-side đang chạy trên trình duyệt hiện tại
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">URL Trình duyệt hiện tại:</span>
            <span className="font-mono text-slate-900 font-medium break-all">{window.location.href}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Đường dẫn Pathname:</span>
            <span className="font-mono text-slate-900 font-medium">{window.location.pathname}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Thẻ Script đã nạp ({scriptTags.length}):</span>
            <div className="font-mono text-[11px] text-slate-700 truncate">
              {scriptTags.join(', ') || 'Inline/Dynamic bundle'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Thẻ Stylesheet ({linkStylesheets.length}):</span>
            <div className="font-mono text-[11px] text-slate-700 truncate">
              {linkStylesheets.join(', ') || 'Injected Tailwind/Vite CSS'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
