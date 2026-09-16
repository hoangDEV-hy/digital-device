import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const navItems = [
  { id: 'overview', label: 'Tổng quan', icon: '⌂' },
  { id: 'users', label: 'Người dùng', icon: '◉', count: '1,248' },
  { id: 'products', label: 'Sản phẩm', icon: '▧', count: '86' },
  { id: 'orders', label: 'Đơn hàng', icon: '▤' },
  { id: 'categories', label: 'Danh mục', icon: '◫' },
  { id: 'licenses', label: 'License', icon: '◇' },
  { id: 'reviews', label: 'Đánh giá', icon: '✦', count: '12' },
];

const users = [
  { id: 'USR-1048', name: 'Nguyễn Minh Anh', email: 'minhanh@studio.vn', role: 'customer', status: 'active', date: '12 Sep 2026', initials: 'NA', color: 'coral' },
  { id: 'USR-1047', name: 'Trần Quốc Bảo', email: 'quocbao.design@gmail.com', role: 'customer', status: 'active', date: '11 Sep 2026', initials: 'TB', color: 'blue' },
  { id: 'USR-1046', name: 'Lê Hoàng Nam', email: 'nam.le@pixels.io', role: 'admin', status: 'active', date: '09 Sep 2026', initials: 'LN', color: 'gold' },
  { id: 'USR-1045', name: 'Phạm Thùy Dương', email: 'thuyduong@mail.com', role: 'customer', status: 'locked', date: '08 Sep 2026', initials: 'PD', color: 'green' },
  { id: 'USR-1044', name: 'Đỗ Gia Huy', email: 'giahuy@creative.co', role: 'customer', status: 'active', date: '05 Sep 2026', initials: 'GH', color: 'purple' },
];

const products = [
  { name: 'Editorial Type Bundle', seller: 'Lê Hoàng Nam', type: 'Font', price: '$32.00', status: 'approved', sales: 284 },
  { name: 'Aurora UI Kit', seller: 'Nguyễn Minh Anh', type: 'UI Kit', price: '$48.00', status: 'pending', sales: 0 },
  { name: 'Film Grain Collection', seller: 'Trần Quốc Bảo', type: 'Texture', price: '$18.00', status: 'approved', sales: 167 },
  { name: 'Sora 3D Icons', seller: 'Đỗ Gia Huy', type: 'Icon pack', price: '$26.00', status: 'rejected', sales: 0 },
];

const orders = [
  { id: '#ORD-8821', customer: 'Nguyễn Minh Anh', item: 'Editorial Type Bundle', total: '$32.00', status: 'paid', time: '12 phút trước' },
  { id: '#ORD-8820', customer: 'Phạm Thùy Dương', item: 'Film Grain Collection', total: '$18.00', status: 'paid', time: '45 phút trước' },
  { id: '#ORD-8819', customer: 'Đỗ Gia Huy', item: 'Aurora UI Kit', total: '$48.00', status: 'pending', time: '1 giờ trước' },
];

function App() {
  const [active, setActive] = useState('overview');
  const [query, setQuery] = useState('');
  const [userRows, setUserRows] = useState(users);
  const [toast, setToast] = useState('');

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const toggleUser = (id) => {
    setUserRows((rows) => rows.map((user) => user.id === id ? { ...user, status: user.status === 'locked' ? 'active' : 'locked' } : user));
    const target = userRows.find((user) => user.id === id);
    notify(target?.status === 'locked' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
  };

  const pageTitle = navItems.find((item) => item.id === active)?.label || 'Tổng quan';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">N</span><span>northstar</span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>{navItems.map((item) => <button key={item.id} className={`nav-item ${active === item.id ? 'active' : ''}`} onClick={() => setActive(item.id)}><span className="nav-icon">{item.icon}</span><span>{item.label}</span>{item.count && <span className="nav-count">{item.count}</span>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="help-card"><span className="help-icon">?</span><div><strong>Cần trợ giúp?</strong><small>Đọc tài liệu quản trị</small></div><span>↗</span></div><button className="nav-item"><span className="nav-icon">⚙</span><span>Cài đặt</span></button></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{pageTitle}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Thông báo">♧<i /></button><div className="profile"><div className="avatar avatar-gold">LN</div><div><strong>Le Hoàng Nam</strong><small>Administrator</small></div><span className="chevron">⌄</span></div></div></header>
        {active === 'overview' ? <Overview onNavigate={setActive} /> : active === 'users' ? <UsersPage query={query} setQuery={setQuery} rows={userRows} onToggle={toggleUser} /> : <SectionPage section={active} onNotify={notify} />}
      </main>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function Overview({ onNavigate }) {
  return <div className="page"><div className="page-heading"><div><p className="eyebrow">MONDAY, 15 SEPTEMBER 2026</p><h1>Chào buổi sáng, Nam <span>✦</span></h1><p className="subtitle">Đây là những gì đang diễn ra trong marketplace hôm nay.</p></div><button className="primary-button" onClick={() => onNavigate('products')}><span>＋</span> Thêm sản phẩm</button></div>
    <div className="metric-grid"><Metric label="Tổng doanh thu" value="$24,892" change="+12.8%" note="so với tháng trước" icon="↗" tone="orange" /><Metric label="Đơn hàng" value="1,284" change="+8.2%" note="so với tháng trước" icon="▤" tone="blue" /><Metric label="Người dùng mới" value="426" change="+18.4%" note="so với tháng trước" icon="◉" tone="green" /><Metric label="Chờ duyệt" value="18" change="Cần xử lý" note="sản phẩm mới" icon="◷" tone="purple" warning /></div>
    <div className="content-grid"><div className="panel chart-panel"><div className="panel-heading"><div><h2>Doanh thu</h2><p>Hiệu suất trong 7 tháng gần nhất</p></div><button className="select-button">7 tháng gần đây <span>⌄</span></button></div><div className="chart"><div className="chart-y"><span>$8k</span><span>$6k</span><span>$4k</span><span>$2k</span><span>$0</span></div><div className="chart-area"><div className="grid-lines"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 700 260" preserveAspectRatio="none" role="img" aria-label="Biểu đồ doanh thu"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ef8354" stopOpacity=".27" /><stop offset="1" stopColor="#ef8354" stopOpacity="0" /></linearGradient></defs><path d="M0,202 C38,190 55,210 90,170 S140,175 180,140 S225,160 267,112 S310,128 350,98 S405,105 445,70 S485,90 525,55 S580,65 620,30 S665,40 700,12 L700,260 L0,260Z" fill="url(#area)" /><path d="M0,202 C38,190 55,210 90,170 S140,175 180,140 S225,160 267,112 S310,128 350,98 S405,105 445,70 S485,90 525,55 S580,65 620,30 S665,40 700,12" fill="none" stroke="#e86f47" strokeWidth="3" /></svg><div className="chart-x"><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span></div></div></div></div>
      <div className="panel activity-panel"><div className="panel-heading"><div><h2>Hoạt động gần đây</h2><p>Cập nhật theo thời gian thực</p></div><button className="text-button">Xem tất cả ↗</button></div><div className="activity-list"><Activity icon="＋" tone="green" title="Sản phẩm mới được duyệt" detail="Editorial Type Bundle" time="2 phút trước" /><Activity icon="$" tone="blue" title="Đơn hàng mới #ORD-8821" detail="Nguyễn Minh Anh · $32.00" time="12 phút trước" /><Activity icon="◉" tone="orange" title="Người dùng mới đăng ký" detail="thuyduong@mail.com" time="28 phút trước" /><Activity icon="!" tone="purple" title="Sản phẩm cần xem xét" detail="Aurora UI Kit" time="1 giờ trước" /></div></div></div>
    <div className="bottom-grid"><QuickPanel title="Sản phẩm cần duyệt" link="Xem danh sách" onClick={() => onNavigate('products')}><div className="approval-row"><div className="product-thumb thumb-one">A</div><div className="row-main"><strong>Aurora UI Kit</strong><small>Nguyễn Minh Anh · 2 giờ trước</small></div><span className="status-pill pending">Chờ duyệt</span><button className="dots">•••</button></div><div className="approval-row"><div className="product-thumb thumb-two">F</div><div className="row-main"><strong>Flux Motion Presets</strong><small>Trần Quốc Bảo · 5 giờ trước</small></div><span className="status-pill pending">Chờ duyệt</span><button className="dots">•••</button></div></QuickPanel><QuickPanel title="Tóm tắt nhanh" link="Chi tiết"><div className="quick-stat"><span>Người dùng hoạt động</span><strong>1,186 <em>95.1%</em></strong></div><div className="progress"><i style={{ width: '75%' }} /></div><div className="quick-stat second"><span>Tỷ lệ chuyển đổi</span><strong>4.8% <em className="neutral">+0.6%</em></strong></div></QuickPanel></div>
  </div>;
}

function Metric({ label, value, change, note, icon, tone, warning }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><p>{label}</p><h2>{value}</h2><div className={`metric-change ${warning ? 'warning' : ''}`}><span>{warning ? '!' : '↗'}</span> {change} <small>{note}</small></div></div>; }
function Activity({ icon, tone, title, detail, time }) { return <div className="activity"><span className={`activity-icon ${tone}`}>{icon}</span><div><strong>{title}</strong><small>{detail}</small></div><time>{time}</time></div>; }
function QuickPanel({ title, link, onClick, children }) { return <div className="panel quick-panel"><div className="panel-heading"><h2>{title}</h2><button className="text-button" onClick={onClick}>{link} ↗</button></div>{children}</div>; }

function UsersPage({ query, setQuery, rows, onToggle }) {
  const filtered = rows.filter((user) => `${user.name} ${user.email} ${user.id}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page"><div className="page-heading compact"><div><p className="eyebrow">WORKSPACE / USERS</p><h1>Người dùng</h1><p className="subtitle">Quản lý thành viên và quyền truy cập hệ thống.</p></div><button className="primary-button"><span>＋</span> Mời người dùng</button></div><div className="user-summary"><div><strong>1,248</strong><span>Tổng người dùng</span></div><div><strong>1,186</strong><span>Đang hoạt động</span></div><div><strong>62</strong><span>Đã khóa</span></div><div><strong>24</strong><span>Admin</span></div></div><div className="panel table-panel"><div className="table-toolbar"><div className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, email..." /></div><button className="filter-button">Tất cả trạng thái <span>⌄</span></button><button className="filter-button">Bộ lọc <span>≡</span></button></div><table><thead><tr><th>NGƯỜI DÙNG</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>NGÀY THAM GIA</th><th /></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td><div className="table-user"><div className={`avatar avatar-${user.color}`}>{user.initials}</div><div><strong>{user.name}</strong><small>{user.email}</small></div></div></td><td><span className={`role ${user.role}`}>{user.role === 'admin' ? 'Admin' : 'Customer'}</span></td><td><span className={`status-dot ${user.status}`}><i />{user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}</span></td><td className="date-cell">{user.date}</td><td><button className="action-menu" onClick={() => onToggle(user.id)}>{user.status === 'locked' ? 'Mở khóa' : 'Khóa'} <span>•••</span></button></td></tr>)}</tbody></table><div className="table-footer"><span>Hiển thị {filtered.length} trong 1,248 người dùng</span><div><button>←</button><b>1</b><button>2</button><button>3</button><button>→</button></div></div></div></div>;
}

function SectionPage({ section, onNotify }) {
  const content = {
    products: { title: 'Sản phẩm', eyebrow: 'WORKSPACE / PRODUCTS', subtitle: 'Duyệt và quản lý sản phẩm số trên marketplace.', action: 'Thêm sản phẩm', headers: ['SẢN PHẨM', 'NGƯỜI BÁN', 'LOẠI', 'GIÁ', 'TRẠNG THÁI'], rows: products.map((item) => [<strong>{item.name}</strong>, item.seller, item.type, item.price, <span className={`status-pill ${item.status}`}>{item.status === 'approved' ? 'Đã duyệt' : item.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}</span>]) },
    orders: { title: 'Đơn hàng', eyebrow: 'WORKSPACE / ORDERS', subtitle: 'Theo dõi các giao dịch mới nhất.', action: 'Xuất báo cáo', headers: ['MÃ ĐƠN', 'KHÁCH HÀNG', 'SẢN PHẨM', 'TỔNG TIỀN', 'TRẠNG THÁI'], rows: orders.map((item) => [<strong>{item.id}</strong>, item.customer, item.item, item.total, <span className={`status-pill ${item.status}`}>{item.status === 'paid' ? 'Đã thanh toán' : 'Đang xử lý'}</span>]) },
    categories: { title: 'Danh mục', eyebrow: 'WORKSPACE / CATEGORIES', subtitle: 'Sắp xếp sản phẩm theo nhóm rõ ràng.', action: 'Thêm danh mục', headers: ['TÊN DANH MỤC', 'SẢN PHẨM', 'TRẠNG THÁI', 'CẬP NHẬT'], rows: [['Font & Typography', '24 sản phẩm', <span className="status-pill approved">Đang hiển thị</span>, 'Hôm nay'], ['UI Kits', '18 sản phẩm', <span className="status-pill approved">Đang hiển thị</span>, '12 Sep 2026'], ['Textures', '31 sản phẩm', <span className="status-pill approved">Đang hiển thị</span>, '09 Sep 2026'], ['Templates', '13 sản phẩm', <span className="status-pill pending">Bản nháp</span>, '08 Sep 2026']] },
    licenses: { title: 'License', eyebrow: 'WORKSPACE / LICENSES', subtitle: 'Kiểm soát quyền sở hữu sản phẩm số.', action: 'Xuất danh sách', headers: ['MÃ LICENSE', 'KHÁCH HÀNG', 'SẢN PHẨM', 'NGÀY CẤP', 'TRẠNG THÁI'], rows: [['LIC-02841', 'Nguyễn Minh Anh', 'Editorial Type Bundle', '12 Sep 2026', <span className="status-pill approved">Đang hoạt động</span>], ['LIC-02840', 'Trần Quốc Bảo', 'Film Grain Collection', '11 Sep 2026', <span className="status-pill approved">Đang hoạt động</span>], ['LIC-02839', 'Phạm Thùy Dương', 'Sora 3D Icons', '10 Sep 2026', <span className="status-pill rejected">Đã thu hồi</span>]] },
    reviews: { title: 'Đánh giá', eyebrow: 'WORKSPACE / REVIEWS', subtitle: 'Giữ chất lượng và sự tin cậy cho marketplace.', action: 'Xem báo cáo', headers: ['NGƯỜI DÙNG', 'SẢN PHẨM', 'ĐÁNH GIÁ', 'NGÀY ĐĂNG', 'TRẠNG THÁI'], rows: [['Nguyễn Minh Anh', 'Editorial Type Bundle', '★★★★★', '12 Sep 2026', <span className="status-pill approved">Đã duyệt</span>], ['Đỗ Gia Huy', 'Film Grain Collection', '★★★★☆', '11 Sep 2026', <span className="status-pill approved">Đã duyệt</span>], ['Ẩn danh', 'Aurora UI Kit', '★☆☆☆☆', '10 Sep 2026', <span className="status-pill pending">Cần xem xét</span>]] },
  }[section];
  return <div className="page"><div className="page-heading compact"><div><p className="eyebrow">{content.eyebrow}</p><h1>{content.title}</h1><p className="subtitle">{content.subtitle}</p></div><button className="primary-button" onClick={() => onNotify(`Đã mở biểu mẫu: ${content.action}`)}><span>＋</span> {content.action}</button></div><div className="panel table-panel generic-table"><div className="table-toolbar"><div className="search-box"><span>⌕</span><input placeholder={`Tìm trong ${content.title.toLowerCase()}...`} /></div><button className="filter-button">Tất cả trạng thái <span>⌄</span></button></div><table><thead><tr>{content.headers.map((header) => <th key={header}>{header}</th>)}<th /></tr></thead><tbody>{content.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}<td><button className="action-menu" onClick={() => onNotify('Đã mở tùy chọn quản lý')}>•••</button></td></tr>)}</tbody></table></div></div>;
}

createRoot(document.getElementById('root')).render(<App />);
