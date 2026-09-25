# Agent Development Rules

## 1. Nguyên tắc chính

Agent phải phát triển dự án theo nguyên tắc:

> **Hoàn thành hoàn toàn một tính năng → Test → Sửa toàn bộ lỗi → Test lại → Chỉ khi không còn lỗi mới chuyển sang tính năng tiếp theo.**

Không được triển khai đồng thời nhiều tính năng khi tính năng hiện tại chưa hoàn thành và chưa được kiểm tra đầy đủ.

---

## 2. Quy trình bắt buộc cho mỗi tính năng

Mỗi tính năng phải được thực hiện theo đúng thứ tự sau:

### Bước 1: Xác định tính năng

Trước khi code, Agent phải xác định rõ:

* Tên tính năng.
* Mục đích của tính năng.
* Input.
* Output.
* Các thành phần/file liên quan.
* Điều kiện để xác định tính năng là hoàn thành.

Nếu yêu cầu chưa rõ, Agent phải hỏi lại trước khi triển khai phần có thể gây sai hướng.

---

### Bước 2: Phân tích code hiện tại

Trước khi chỉnh sửa:

* Đọc code liên quan đến tính năng.
* Kiểm tra kiến trúc hiện tại.
* Kiểm tra các dependency giữa các module.
* Tìm cách tích hợp vào code hiện tại thay vì tự ý tạo kiến trúc mới.
* Không thay đổi những phần không liên quan nếu không cần thiết.

Mục tiêu là tránh làm hỏng các tính năng đang hoạt động.

---

### Bước 3: Lập kế hoạch triển khai

Chia tính năng thành các bước nhỏ và thực hiện tuần tự.

Ví dụ:

```text
Feature A
├── A1. Backend API
├── A2. Database
├── A3. Frontend
├── A4. Integration
└── A5. Test
```

Không được chuyển sang Feature B khi Feature A chưa hoàn thành.

---

### Bước 4: Implement

Agent triển khai từng phần của tính năng.

Trong quá trình code:

* Giữ nguyên behavior của các tính năng cũ.
* Không tự ý thêm tính năng ngoài phạm vi.
* Không tạo workaround tạm thời nếu có thể giải quyết đúng nguyên nhân.
* Ưu tiên code đơn giản, dễ bảo trì.
* Tái sử dụng code hiện có khi phù hợp.
* Nếu phát hiện lỗi liên quan đến tính năng hiện tại, phải xử lý trước khi tiếp tục.

---

## 3. Test bắt buộc

Sau khi implementation hoàn thành, Agent **phải test tính năng**.

Test tối thiểu phải bao gồm:

```text
1. Happy path
2. Invalid input
3. Edge cases
4. Error handling
5. Regression test
```

Nếu dự án có test tự động:

```bash
npm test
```

hoặc command tương ứng của dự án phải được chạy.

Nếu dự án có lint/typecheck/build:

```bash
npm run lint
npm run typecheck
npm run build
```

thì cũng phải kiểm tra khi phù hợp.

---

## 4. Khi test có lỗi

Nếu test thất bại:

```text
Test
 ↓
Có lỗi
 ↓
Phân tích nguyên nhân
 ↓
Sửa lỗi
 ↓
Test lại
 ↓
Còn lỗi?
 ├── Có → sửa tiếp
 └── Không → tiếp tục
```

Agent **không được chuyển sang tính năng khác khi vẫn còn lỗi liên quan đến tính năng hiện tại.**

Không được coi tính năng là hoàn thành chỉ vì:

* Code đã viết xong.
* Không còn syntax error.
* Server đã chạy được.
* Một vài test đã pass.

Tính năng chỉ được xem là hoàn thành khi behavior đáp ứng yêu cầu và các kiểm tra cần thiết đều pass.

---

## 5. Regression Test

Sau khi sửa lỗi, Agent phải kiểm tra lại không chỉ phần vừa sửa mà còn các behavior có khả năng bị ảnh hưởng.

Ví dụ:

```text
Feature A
   ↓
Test A
   ↓
Sửa lỗi
   ↓
Test A lại
   ↓
Test các chức năng liên quan
   ↓
Pass
```

Không được sửa một lỗi bằng cách làm hỏng tính năng khác.

---

## 6. Tiêu chí hoàn thành Feature

Một feature chỉ được đánh dấu:

```text
DONE
```

khi thỏa mãn tất cả:

* [ ] Đã implement đầy đủ yêu cầu.
* [ ] Không còn TODO quan trọng liên quan đến feature.
* [ ] Happy path hoạt động.
* [ ] Invalid input được xử lý.
* [ ] Edge cases quan trọng được xử lý.
* [ ] Error handling hoạt động.
* [ ] Test liên quan đã pass.
* [ ] Không phát hiện regression.
* [ ] Build/typecheck/lint pass nếu dự án có sử dụng.
* [ ] Không còn lỗi đã biết liên quan đến feature.

Nếu một mục chưa đạt:

```text
Feature = NOT DONE
```

và Agent phải tiếp tục xử lý feature hiện tại.

---

## 7. Không làm nhiều Feature cùng lúc

Không được thực hiện:

```text
Feature A → làm một phần
Feature B → làm một phần
Feature C → làm một phần
```

Phải thực hiện:

```text
Feature A
  ↓
Implement
  ↓
Test
  ↓
Fix
  ↓
Test lại
  ↓
DONE
  ↓
Feature B
  ↓
Implement
  ↓
Test
  ↓
Fix
  ↓
Test lại
  ↓
DONE
```

---

## 8. Sau khi hoàn thành Feature

Sau khi một feature đã pass toàn bộ test, Agent phải báo cáo ngắn gọn:

```text
Feature: <tên feature>

Status: DONE

Implemented:
- ...

Tests:
- ...
- ...

Result:
- All tests passed.
- No known errors related to this feature.
```

Sau đó Agent phải:

> **Đề xuất tính năng tiếp theo phù hợp với trạng thái hiện tại của dự án.**

Không tự động triển khai tính năng tiếp theo nếu chưa được yêu cầu.

---

## 9. Quy tắc đề xuất tính năng tiếp theo

Khi đề xuất feature tiếp theo, Agent phải dựa trên:

1. Feature hiện tại đã hoàn thành.
2. Dependency giữa các feature.
3. Trạng thái hiện tại của codebase.
4. Các phần còn thiếu để hoàn thiện sản phẩm.
5. Các lỗi hoặc technical debt quan trọng.
6. Mức độ ưu tiên của chức năng.

Đề xuất theo format:

```text
Feature tiếp theo đề xuất:

Tên:
<feature name>

Mục đích:
<why this feature is needed>

Lý do làm tiếp theo:
<relationship with current state>

Phạm vi:
- ...
- ...
- ...

Tiêu chí hoàn thành:
- ...
- ...
- ...
```

Agent chỉ đề xuất **một feature tiếp theo**, không đưa ra danh sách quá nhiều feature khiến quá trình phát triển bị phân tán.

---

## 10. Khi phát hiện lỗi ngoài Feature hiện tại

Nếu phát hiện lỗi không thuộc feature đang triển khai:

### Nếu lỗi ảnh hưởng đến feature hiện tại

Phải sửa ngay trước khi đánh dấu feature là DONE.

### Nếu lỗi không ảnh hưởng

Không tự ý mở rộng phạm vi công việc.

Ghi nhận:

```text
Known issue:
<description>

Impact:
<impact>

Action:
Defer until the appropriate feature.
```

Sau khi feature hiện tại hoàn thành, Agent có thể đề xuất xử lý issue đó nếu nó có mức độ ưu tiên phù hợp.

---

## 11. Không tự ý mở rộng Scope

Agent không được tự ý thêm:

* Feature mới.
* UI mới.
* API mới.
* Database field mới.
* Refactor lớn.
* Dependency mới.

nếu những thay đổi đó không cần thiết cho feature hiện tại.

Nếu phát hiện một cải tiến có ích:

```text
Improvement detected:
<description>
```

ghi nhận và đề xuất sau khi feature hiện tại hoàn thành.

---

## 12. Ưu tiên sửa nguyên nhân gốc

Khi gặp lỗi:

Không ưu tiên:

```text
Ẩn lỗi
Suppress error
Hardcode
Workaround tạm thời
Bỏ qua test
```

Ưu tiên:

```text
Reproduce
 ↓
Identify root cause
 ↓
Fix root cause
 ↓
Test
 ↓
Regression test
```

---

## 13. Không được bỏ qua lỗi

Agent không được coi các lỗi sau là "không quan trọng" nếu chúng liên quan đến feature:

```text
Runtime error
Type error
Test failure
API error
Database error
Unhandled exception
Console error quan trọng
Build failure
Lint error quan trọng
Regression
```

Nếu chưa xác định được nguyên nhân, phải tiếp tục phân tích hoặc báo cáo rõ vấn đề thay vì đánh dấu feature là DONE.

---

## 14. Trạng thái phát triển

Mỗi feature nên có một trong các trạng thái:

```text
TODO
IN_PROGRESS
TESTING
FIXING
DONE
BLOCKED
```

Luồng hợp lệ:

```text
TODO
 ↓
IN_PROGRESS
 ↓
TESTING
 ↓
FIXING ←────┐
 ↓          │
TESTING ────┘
 ↓
DONE
```

Nếu bị phụ thuộc vào vấn đề bên ngoài:

```text
BLOCKED
```

Agent phải ghi rõ lý do bị BLOCKED.

---

## 15. Quy tắc cuối cùng

Luôn tuân thủ nguyên tắc:

> **One Feature at a Time.**

> **Do not move to the next feature until the current feature is completely implemented, tested, and verified.**

> **When the current feature is DONE, propose exactly one appropriate next feature.**

Mục tiêu là giữ quá trình phát triển:

```text
Tập trung
→ Hoàn thành
→ Test
→ Sửa lỗi
→ Verify
→ DONE
→ Đề xuất feature tiếp theo
→ Lặp lại
```

Không tối ưu số lượng feature được tạo ra.

**Ưu tiên chất lượng và tính ổn định của từng feature trước tốc độ phát triển.**
