# BuildTrip — Architecture Context

> **Cách dùng file này:** AI agent PHẢI đọc file này trước khi bắt đầu bất kỳ phiên làm việc nào, và CẬP NHẬT phần "Session Log" sau khi hoàn thành công việc.

---

## Tổng quan dự án

**BuildTrip** là ứng dụng lên kế hoạch chuyến đi, cho phép người dùng tìm kiếm địa điểm, tạo lịch trình, viết đánh giá và nhận gợi ý từ chatbot AI.

### Stack công nghệ

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React (TypeScript), Vite, TailwindCSS |
| Backend API | Node.js / Express (JavaScript) |
| Database | PostgreSQL + PostGIS |
| Cache | Redis |
| ML / AI | Python (feature pipeline), Groq API (chatbot) |
| Auth | JWT + Session |

---

## Cấu trúc thư mục gốc

```
BuildTrip_Project-main/
├── backend/          — Express API server (JavaScript, module-based)
├── frontend/
│   └── my-app/       — React SPA (TypeScript + Vite)
├── crawldata/        — Python scripts thu thập dữ liệu địa điểm
├── ml/               — Python pipeline xử lý đặc trưng ML
└── docs/             — Tài liệu kiến trúc và context (file này)
```

---

## Kiến trúc DDD — Module `place`

Module `place` áp dụng **Domain-Driven Design (DDD)** với **CQRS** (Command Query Responsibility Segregation). Đây là module có kiến trúc phức tạp nhất trong dự án.

### Sơ đồ phân tầng

```
src/modules/place/
│
├── presentation/                 ← TẦNG TRÌNH BÀY (HTTP)
│   ├── controllers/
│   │   ├── management.controller.ts   API Admin: thêm/sửa Place
│   │   ├── catalog.controller.ts      API User: tìm kiếm Place
│   │   └── review.controller.ts       API User: gửi Review
│   └── dto/                           Request DTO + validation rules
│
├── infrastructure/               ← TẦNG VỎ NGOÀI (DB drivers)
│   ├── events/
│   │   └── noop-place-management-event-bus.ts
│   └── persistence/
│       ├── mappers/
│       │   └── place.mapper.ts
│       └── typeorm/
│           ├── partner.orm-entity.ts
│           ├── place-category.orm-entity.ts
│           ├── place.orm-entity.ts
│           ├── review.orm-entity.ts
│           └── repositories/
│               ├── management.repository.ts
│               ├── postgres-review.repository.ts   Ghi Review → PostgreSQL (Write DB)
│               └── postgis-catalog.repository.ts   Đọc Place ← PostGIS (Read DB)
│
├── application/                  ← TẦNG GIỮA (Điều phối luồng, không chứa logic nghiệp vụ)
│   ├── use-cases/                ← Bên GHI (CQRS Write side)
│   │   ├── create-place.use-case.ts
│   │   ├── update-place.use-case.ts
│   │   └── add-review.use-case.ts
│   │
│   ├── queries/                  ← Bên ĐỌC (CQRS Read side, bypass Domain)
│   │   ├── search-nearest.handler.ts
│   │   └── get-place-details.handler.ts
│   │
│   ├── ports/                    ← Hợp đồng giao tiếp (Interface/Port)
│       ├── place-repository.port.ts
│       ├── review-repository.port.ts
│       ├── catalog-query.port.ts
│       └── place-management-event-bus.port.ts
│
│   └── management.di-tokens.ts
│
└── domain/                       ← TẦNG LÕI (Pure TypeScript, Business Logic)
    ├── aggregates/
    │   ├── place/place.root.ts         Aggregate root: gác cổng dữ liệu Place
    │   └── review/review.root.ts       Aggregate root: gác cổng dữ liệu Review
    │
    ├── value-objects/
    │   ├── location.vo.ts              Lat + Lng (immutable, self-validating)
    │   ├── operating-hours.vo.ts       Giờ mở/đóng cửa
    │   └── category.vo.ts
    │
    ├── events/
    │   └── core/
    │       ├── domain-event.ts
    │       └── place-management.events.ts
    └── exceptions/
        └── invalid-workflow.exception.ts
```

### Quy tắc phụ thuộc (Dependency Rule)

```
presentation → application → domain
infrastructure → application → domain
```

- `domain` không được import từ `application` hay `infrastructure`
- `application` không được import từ `infrastructure` (chỉ dùng port interfaces)
- `application` không được import từ `presentation`
- Các module khác không được import trực tiếp vào nội bộ module `place` — phải qua port

### Phân biệt Command vs Query (CQRS)

| | Command (Write) | Query (Read) |
|---|---|---|
| **Mục đích** | Thay đổi trạng thái | Lấy dữ liệu |
| **Đi qua Domain** | Bắt buộc | Không (bypass) |
| **Repository** | PostgreSQL (postgres-*.repository) | PostGIS (postgis-catalog.repository) |
| **Trả về** | void hoặc ID | DTO / plain object |

---

## Backend API (Express — JavaScript)

Cấu trúc hiện tại của backend (JavaScript, **chưa** áp dụng DDD):

```
backend/src/
├── db/models/          — Sequelize models (User, Place, Trip, Comment, Favourite, Tag, ...)
├── middlewares/        — auth, admin, upload, validate
├── modules/            — controller + route theo feature
│   ├── auth/           — đăng ký, đăng nhập, refresh token
│   ├── place/          — CRUD địa điểm
│   ├── trip/           — CRUD lịch trình
│   ├── tripPlace/      — thêm/xóa địa điểm trong lịch trình
│   ├── comment/        — bình luận
│   ├── favourite/      — yêu thích
│   ├── user/           — hồ sơ người dùng
│   ├── admin/          — quản trị
│   └── chatbot/        — tích hợp Groq AI
└── validations/        — schema validation (Joi hoặc tương đương)
```

---

## Frontend (React — TypeScript)

```
frontend/my-app/src/
├── pages/              — Trang chính (Homepage, SearchPlace, PlaceDetail, MyTrips, TripDetails, ...)
├── components/         — Các component dùng chung (PlaceCard, TripCard, CommentCard, Header, Footer)
├── layouts/            — Bố cục (MainLayout, AuthLayout, AdminLayout)
├── guards/             — Route guards (AuthGuard, AdminGuard)
├── services/           — Gọi API (placeService, tripService, authService, ...)
├── store/              — State management (authStore)
└── utils/              — Tiện ích (formatDate, ...)
```

---

## ML Pipeline

```
ml/src/
└── feature_pipeline.py  — Xử lý đặc trưng cho mô hình gợi ý địa điểm
```

---

## Trạng thái hiện tại & Quyết định quan trọng

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| DDD place module | Đã scaffold kiến trúc | Đã tạo khung domain/application/infrastructure tại `src/modules/place/` |
| Backend Express | Đang hoạt động (JavaScript) | Module-based, chưa DDD |
| Frontend React | Đang hoạt động | Đủ trang, kết nối API |
| ML feature pipeline | Có skeleton | `ml/src/feature_pipeline.py` |
| Crawl data | Hoàn thành | Scripts Python, data CSV |

---

## Session Log

> Ghi lại mỗi phiên làm việc: ngày, việc đã làm, trạng thái, quyết định quan trọng.

### 2026-04-30 — Refactor review wiring trong PlaceManagementModule
- **Việc đã làm:** Giữ review bên trong `place.module.ts` nhưng refactor wiring theo pattern `reviews.module` tham chiếu: đăng ký Bull queue cho review events, thêm DI token `PLACE_REVIEW_EVENT_PUBLISHER`, thêm publisher adapter `BullPlaceReviewEventPublisher`, và đăng ký `PlaceRatingSnapshotConsumer` trong providers
- **Files thay đổi:**
  - Sửa: `src/modules/place/place.module.ts`
  - Sửa: `src/modules/place/application/review.di-token.ts`
  - Tạo mới: `src/modules/place/application/ports/place-review-event-publisher.port.ts`
  - Tạo mới: `src/modules/place/infrastructure/events/bull-place-review-event.publisher.ts`
- **Quyết định:** Không tách `PlaceReviewsModule` riêng; vẫn gộp review vào `PlaceManagementModule` theo yêu cầu, nhưng chuẩn hóa queue/provider wiring để đồng bộ với pattern module reviews
- **Vấn đề còn tồn đọng:** Review flow hiện vẫn dùng `AddReviewUseCase`/`PostgresReviewRepository` cũ, chưa chuyển đầy đủ sang `PlaceReviewService` + repository chuyên biệt như bản tham chiếu
- **Việc tiếp theo:** Nếu cần parity hoàn toàn với module tham chiếu, tách thêm `PlaceReviewRepository`/`PlaceReviewController`/DTO theo cấu trúc `reviews/*`

### 2026-04-29 — Build Notification Module cho auth email queue
- **Việc đã làm:** Xây `NotificationModule` mới trong `backend2/src/modules/notification` theo pattern producer/processor của dự án tham chiếu; chuyển auth flow verify/reset email sang enqueue job thay vì gửi SMTP đồng bộ trong request
- **Files thay đổi:**
  - Tạo mới: `src/modules/notification/notification.constants.ts`
  - Tạo mới: `src/modules/notification/notification.types.ts`
  - Tạo mới: `src/modules/notification/notification.module.ts`
  - Tạo mới: `src/modules/notification/queue/notification.queue.service.ts`
  - Tạo mới: `src/modules/notification/queue/notification.processor.ts`
  - Tạo mới: `src/modules/notification/services/notification.service.ts`
  - Sửa: `src/app.module.ts`
  - Sửa: `src/modules/auth/auth.module.ts`
  - Sửa: `src/modules/auth/auth.service.ts`
- **Quyết định:** Dùng một queue chung `notification` với template code (`AUTH_VERIFY_EMAIL`, `AUTH_RESET_PASSWORD`) thay vì tạo queue riêng cho auth ở giai đoạn này
- **Vấn đề còn tồn đọng:** Chưa có persistence table cho notification deliveries/jobs (module hiện lightweight, rely vào Bull retry + logs)
- **Việc tiếp theo:** Nếu cần audit/dedup nâng cao, bổ sung notification delivery entity + dead-letter tracking ở DB giống project reference

### 2026-04-29 — Cấu hình Email service cho auth verify/reset password
- **Việc đã làm:** Tạo `MailModule` + `MailService` dùng `@nestjs-modules/mailer`, tích hợp vào `AuthModule`, thêm flow verify email khi register (`verify-email`, `resend-verification`) và gửi email thật ở `forgotPassword`
- **Files thay đổi:**
  - Tạo mới: `src/modules/auth/dto/verify-email.dto.ts`
  - Tạo mới: `src/modules/auth/dto/resend-verification.dto.ts`
  - Sửa: `src/common/mail/mail.module.ts`
  - Sửa: `src/common/mail/mail.service.ts`
  - Sửa: `src/modules/auth/auth.module.ts`
  - Sửa: `src/modules/auth/auth.controller.ts`
  - Sửa: `src/modules/auth/auth.service.ts`
  - Sửa: `src/modules/users/entities/user.entity.ts`
  - Sửa: `.env.example`
- **Quyết định:** Đăng ký tài khoản sẽ phát token verify qua Redis TTL 24h và chặn login khi `isEmailVerified=false`; forgot password tiếp tục dùng token hash + Redis TTL 15 phút nhưng chuyển từ log URL sang gửi email SMTP
- **Vấn đề còn tồn đọng:** Chưa có migration DB để thêm cột `is_email_verified` và `email_verified_at` ở bảng `users`; môi trường production cần cấu hình SMTP credentials thật
- **Việc tiếp theo:** Thêm migration TypeORM cho 2 cột verify email và cấu hình template email HTML theo branding chính thức

### 2026-04-22 — Sửa flow create/approve để user request trước, admin duyệt sau
- **Việc đã làm:** Điều chỉnh logic `place` để user thường (không phải admin) có thể tạo/submit request; ownership theo `ownerId = currentUser.id`; không yêu cầu role `partner` toàn cục ở partner endpoints
- **Files thay đổi:**
  - Sửa: `src/modules/place/presentation/controllers/management.controller.ts`
  - Sửa: `src/modules/place/application/use-cases/update-place.use-case.ts`
  - Sửa: `src/modules/place/domain/aggregates/place/place.root.ts`
  - Sửa: `src/modules/place/presentation/dto/create-place.dto.ts`
- **Quyết định:** Quyền thao tác owner-side dựa trên user ownership của place (`actor.userId === ownerId`) thay vì `partnerId`/role partner toàn cục
- **Vấn đề còn tồn đọng:** Chưa có bảng mapping riêng `user_id <-> place_id` cho “partner của place” sau approve; hiện đang dùng trực tiếp `ownerId` trong aggregate
- **Việc tiếp theo:** Nếu cần tách bạch hơn, bổ sung bảng mapping ownership và cập nhật use-case approve để ghi quan hệ sau khi admin accepted

### 2026-04-22 — Chuyển User module sang TypeORM
- **Việc đã làm:** Chuyển `User` entity từ Sequelize sang TypeORM và cập nhật wiring/repository cho `UsersModule` + `AuthModule`
- **Files thay đổi:**
  - Sửa: `src/modules/users/entities/user.entity.ts`
  - Sửa: `src/modules/users/users.module.ts`
  - Sửa: `src/modules/users/users.service.ts`
  - Sửa: `src/modules/auth/auth.module.ts`
  - Sửa: `src/modules/auth/auth.service.ts`
  - Sửa: `src/shared/database/database.module.ts`
- **Quyết định:** `AuthService` và `UsersService` dùng `Repository<User>` (`@InjectRepository`) thay cho `@InjectModel(User)` để đồng nhất persistence layer TypeORM
- **Vấn đề còn tồn đọng:** Project hiện còn lỗi import module `comments`/`comments.entity` bị thiếu file trong tree nên `tsc` fail ở phần không liên quan đến user migration
- **Việc tiếp theo:** Khôi phục hoặc cập nhật `CommentsModule` + `Comment` entity imports để build pass toàn project

### 2026-04-22 — Chuyển place module sang TypeORM
- **Việc đã làm:** Chuyển persistence của `place` sang TypeORM thật (entity + repository + module wiring) và bỏ phụ thuộc Sequelize trong `place`
- **Files thay đổi:**
  - Tạo mới: `src/modules/place/infrastructure/persistence/typeorm/place.orm-entity.ts`
  - Tạo mới: `src/modules/place/infrastructure/persistence/typeorm/partner.orm-entity.ts`
  - Tạo mới: `src/modules/place/infrastructure/persistence/typeorm/place-category.orm-entity.ts`
  - Sửa: `src/modules/place/infrastructure/persistence/typeorm/repositories/management.repository.ts`
  - Sửa: `src/modules/place/place.module.ts`
  - Sửa: `src/shared/database/database.module.ts`
  - Sửa: `src/modules/comments/entities/comment.entity.ts`
- **Quyết định:** Dùng TypeORM connection chung (`TypeOrmModule.forRootAsync`) nhưng chỉ `place` module đăng ký `forFeature` để dùng repository
- **Vấn đề còn tồn đọng:** Bảng `places` hiện có quan hệ `partner_id` ở SQL nhưng `PlaceRoot/PlaceOrmEntity` vẫn dùng `ownerId`; cần thống nhất về một mô hình ownership
- **Việc tiếp theo:** Hoàn thiện TypeORM entity cho `reviews`/catalog read-model và thêm migration đồng bộ schema DB với domain snapshot

### 2026-04-22 — Bổ sung schema partners và quan hệ với places
- **Việc đã làm:** Tạo Sequelize entity `Partner`, nối quan hệ `partners.user_id -> users.id` và `places.partner_id -> partners.id`; đồng thời thêm DDL SQL để tạo table/constraint/index
- **Files thay đổi:**
  - Tạo mới: `src/modules/place/entities/partner.entity.ts`
  - Sửa: `src/modules/place/entities/place.entity.ts`
  - Sửa: `src/shared/database/database.module.ts`
  - Tạo mới: `docs/sql/create-partners-table.sql`
- **Quyết định:** Dùng cột `partners.status` (`pending|accepted|rejected`) để quản lý trạng thái duyệt partner bởi admin; place liên kết qua `partner_id`
- **Vấn đề còn tồn đọng:** Chưa có DB trigger cưỡng chế "chỉ partner accepted mới được tạo place"; hiện enforce ở tầng nghiệp vụ/service
- **Việc tiếp theo:** Backfill `places.partner_id` dữ liệu cũ rồi set `NOT NULL`, sau đó thêm validation ở use-case tạo/sửa place

### 2026-04-22 — Giữ Sequelize và bỏ wiring TypeORM runtime
- **Việc đã làm:** Loại bỏ phụ thuộc runtime vào TypeORM trong `place` module để tránh lỗi `DataSource` DI, giữ mô hình hiện tại theo Sequelize stack
- **Files thay đổi:**
  - Sửa: `src/modules/place/infrastructure/persistence/typeorm/repositories/management.repository.ts`
  - Sửa: `src/modules/place/place.module.ts`
- **Quyết định:** `PlaceManagementRepository` tạm dùng store nội bộ + mapper thay vì `@InjectRepository`/`Repository` để không cần `TypeOrmModule.forRoot`
- **Vấn đề còn tồn đọng:** `persistence/typeorm/*` đang là naming legacy, chưa phản ánh đúng implementation hiện tại
- **Việc tiếp theo:** Đổi tên tầng persistence cho nhất quán (sequelize hoặc generic) và triển khai repository thật qua Sequelize model

### 2026-04-22 — Dọn sạch lỗi compile từ terminal watch
- **Việc đã làm:** Sửa toàn bộ lỗi TypeScript trong log watch (TS1272, TS1205, import module thiếu) để project compile lại
- **Files thay đổi:**
  - Sửa: `src/modules/place/application/use-cases/*.ts` (chuyển các interface trong constructor decorated sang `import type`)
  - Sửa: `src/modules/place/domain/events/core/place-management.events.ts` (`export type { DomainEvent }`)
  - Sửa: `src/app.module.ts` (dùng `PlaceManagementModule` thay cho `PlaceModule`, bỏ import `TripsModule` lỗi)
  - Tạo mới: `src/modules/place/entities/place.entity.ts`
  - Tạo mới: `src/modules/place/entities/category.entity.ts`
  - Tạo mới: `src/modules/place/entities/tag.entity.ts`
  - Tạo mới: `src/modules/trips/entities/trip.entity.ts`
  - Tạo mới: `src/modules/trips/entities/trip-place.entity.ts`
  - Tạo mới: `src/modules/trips/trips.module.ts`
- **Quyết định:** Tạm thêm minimal legacy entities/modules để tương thích import cũ trong `shared/database` và các module Sequelize
- **Vấn đề còn tồn đọng:** Các legacy stub entities chưa có đầy đủ fields nghiệp vụ
- **Việc tiếp theo:** Chuẩn hóa dần shared/database để bỏ phụ thuộc legacy Sequelize entities khi migrate sang cấu trúc module mới

### 2026-04-22 — Refactor Management Repository theo TypeORM pattern
- **Việc đã làm:** Chuyển `PlaceManagementRepository` từ in-memory sang pattern `InjectRepository + mapper` theo chuẩn TypeORM
- **Files thay đổi:**
  - Sửa: `src/modules/place/infrastructure/persistence/typeorm/repositories/management.repository.ts`
  - Sửa: `src/modules/place/application/ports/place-repository.port.ts`
- **Quyết định:** Repository dùng `findOne(..., withDeleted: true)`, `save`, `softDelete`, `restore`; mapper chịu trách nhiệm chuyển đổi domain/persistence
- **Vấn đề còn tồn đọng:** Project hiện thiếu module `@nestjs/typeorm` và `typeorm` nên IDE báo unresolved import tại repository
- **Việc tiếp theo:** Cài đặt dependencies TypeORM và cấu hình DataSource để repository hoạt động runtime

### 2026-04-22 — Áp dụng snapshot + mapper domain/persistence
- **Việc đã làm:** Chuyển `PlaceRoot` sang lưu state bằng snapshot và triển khai `PlaceMapper` chuyển đổi 2 chiều domain/persistence
- **Files thay đổi:**
  - Sửa: `src/modules/place/domain/aggregates/place/place.root.ts`
  - Sửa: `src/modules/place/infrastructure/persistence/mappers/place.mapper.ts`
  - Sửa: `src/modules/place/infrastructure/persistence/typeorm/place.orm-entity.ts`
  - Sửa: `src/modules/place/infrastructure/persistence/typeorm/repositories/management.repository.ts`
  - Sửa: `src/modules/place/application/use-cases/get-place.use-case.ts`
- **Quyết định:** Aggregate expose `toSnapshot()` và hỗ trợ `reconstitute(snapshot)` để phục vụ mapper; repository dùng mapper để hydrate/persist state
- **Vấn đề còn tồn đọng:** Persistence hiện là in-memory store tạm, chưa tích hợp TypeORM repository thật
- **Việc tiếp theo:** Bind TypeORM repository thật cho `PlaceManagementRepository` và map relation category/partner

### 2026-04-22 — Triển khai full management use-cases + endpoints
- **Việc đã làm:** Bổ sung đầy đủ use-cases moderation và viết lại management controllers theo luồng admin/partner (approve/reject/submit/delete/restore/get)
- **Files thay đổi:**
  - Tạo mới: `src/modules/place/application/use-cases/submit-place.use-case.ts`
  - Tạo mới: `src/modules/place/application/use-cases/approve-place.use-case.ts`
  - Tạo mới: `src/modules/place/application/use-cases/reject-place.use-case.ts`
  - Tạo mới: `src/modules/place/application/use-cases/delete-place-by-admin.use-case.ts`
  - Tạo mới: `src/modules/place/application/use-cases/delete-own-place.use-case.ts`
  - Tạo mới: `src/modules/place/application/use-cases/restore-place-by-admin.use-case.ts`
  - Tạo mới: `src/modules/place/application/use-cases/restore-own-place.use-case.ts`
  - Tạo mới: `src/modules/place/application/use-cases/get-place.use-case.ts`
  - Tạo mới: `src/modules/place/presentation/dto/approve-place.dto.ts`
  - Tạo mới: `src/modules/place/presentation/dto/reject-place.dto.ts`
  - Tạo mới: `src/modules/place/presentation/dto/delete-place.dto.ts`
  - Tạo mới: `src/modules/place/presentation/dto/delete-own-place.dto.ts`
  - Tạo mới: `src/modules/place/presentation/dto/submit-place.dto.ts`
  - Sửa: `src/modules/place/presentation/controllers/management.controller.ts`
  - Sửa: `src/modules/place/place.module.ts`
- **Quyết định:** Tách rõ management flow theo 2 controller trong cùng file: `AdminPlaceController` và `PartnerPlaceController` để đồng bộ với flow nghiệp vụ moderation
- **Vấn đề còn tồn đọng:** Repository vẫn chưa có triển khai persistence thật nên các endpoint management chưa thao tác DB thực tế
- **Việc tiếp theo:** Implement `PlaceManagementRepository` + mapper/entity mapping để luồng management chạy end-to-end

### 2026-04-22 — Viết lại Management Controllers theo admin/partner
- **Việc đã làm:** Refactor `management.controller.ts` thành 2 controller riêng cho admin và partner theo phong cách management API
- **Files thay đổi:**
  - Sửa: `src/modules/place/presentation/controllers/management.controller.ts`
  - Sửa: `src/modules/place/place.module.ts`
- **Quyết định:** Tách endpoint management thành `AdminPlaceController` (`/admin/places`) và `PartnerPlaceController` (`/partner/places`) trong cùng file để đồng bộ với mẫu controller bạn cung cấp
- **Vấn đề còn tồn đọng:** Các use-case moderation đầy đủ (approve/reject/delete/restore) chưa có trong application layer nên controller hiện mới map các use-case/query sẵn có
- **Việc tiếp theo:** Tạo các use-case moderation (`approve-place`, `reject-place`, `delete-place-by-admin`, `restore-place-by-admin`, ...) và DTO tương ứng để khớp hoàn toàn với mẫu

### 2026-04-22 — Gộp Domain Events theo core + thêm exceptions
- **Việc đã làm:** Làm gọn domain events vào `events/core` và thêm domain exceptions dùng `AppError`
- **Files thay đổi:**
  - Tạo mới: `src/modules/place/domain/events/core/domain-event.ts`
  - Tạo mới: `src/modules/place/domain/events/core/place-management.events.ts`
  - Tạo mới: `src/modules/place/domain/exceptions/invalid-workflow.exception.ts`
  - Tạo mới: `src/common/errors/app.error.ts`
  - Sửa: `src/modules/place/domain/aggregates/place/place.root.ts`
  - Sửa: `src/modules/place/domain/aggregates/review/review.root.ts`
  - Sửa: `src/modules/place/application/ports/place-management-event-bus.port.ts`
  - Sửa: `src/modules/place/infrastructure/events/nest-event-bus.adapter.ts`
  - Xóa: `src/modules/place/domain/events/domain-event.ts`
  - Xóa: `src/modules/place/domain/events/place-management.events.ts`
  - Xóa: `src/modules/place/domain/events/place-created.event.ts`
  - Xóa: `src/modules/place/domain/events/place-updated.event.ts`
  - Xóa: `src/modules/place/domain/events/review-added.event.ts`
- **Quyết định:** Dùng `InvalidWorkflowException`, `PlaceOwnershipException`, `PlaceDeletedException`, `PlaceNotDeletedException` thay cho `Error` thô trong workflow của aggregate
- **Vấn đề còn tồn đọng:** Một số chỗ domain khác (ngoài place aggregate) vẫn throw `Error` thô
- **Việc tiếp theo:** Chuẩn hóa toàn bộ domain errors và map exception -> HTTP response ở global exception filter

### 2026-04-22 — Refactor Place Aggregate theo workflow
- **Việc đã làm:** Refactor `Place` aggregate theo hướng workflow state machine (submit/approve/reject/delete/restore), bỏ kiểm tra permissions và thêm value object cho trạng thái
- **Files thay đổi:**
  - Tạo mới: `src/modules/place/domain/value-objects/place-status.vo.ts`
  - Tạo mới: `src/modules/place/domain/events/place-management.events.ts`
  - Sửa: `src/modules/place/domain/aggregates/place/place.root.ts`
  - Sửa: `src/modules/place/application/use-cases/create-place.use-case.ts`
  - Sửa: `src/modules/place/application/use-cases/update-place.use-case.ts`
  - Sửa: `src/modules/place/presentation/dto/create-place.dto.ts`
  - Sửa: `src/modules/place/presentation/dto/update-place.dto.ts`
- **Quyết định:** Trạng thái `Place` được chuẩn hóa thành 4 giá trị `draft`, `pending`, `approved`, `rejected` qua `PlaceStatusVo`; transition theo method của aggregate
- **Vấn đề còn tồn đọng:** Các use-case workflow riêng (submit/approve/reject/delete/restore) chưa được tách thành command/use-case chuyên biệt
- **Việc tiếp theo:** Thêm use-cases cho từng transition workflow và controller endpoints tương ứng

### 2026-04-22 — Align Place Module với Management mẫu
- **Việc đã làm:** Chuẩn hóa naming và wiring `PlaceModule` theo cấu trúc mẫu `PlaceManagementModule`
- **Files thay đổi:**
  - Đổi tên thư mục: `application/usecase` → `application/use-cases`
  - Đổi tên file: `application/place-management.tokens.ts` → `application/management.di-tokens.ts`
  - Đổi tên file: `infrastructure/events/noop-place-management-event-bus.ts` → `infrastructure/events/nest-event-bus.adapter.ts`
  - Đổi tên file: `infrastructure/persistence/typeorm/repositories/postgres-place.repository.ts` → `infrastructure/persistence/typeorm/repositories/management.repository.ts`
  - Tạo mới: `infrastructure/persistence/typeorm/partner.orm-entity.ts`
  - Tạo mới: `infrastructure/persistence/typeorm/place-category.orm-entity.ts`
  - Tạo mới: `infrastructure/persistence/typeorm/place.orm-entity.ts`
  - Sửa: `infrastructure/persistence/mappers/place.mapper.ts`
  - Sửa: `place.module.ts` (imports TypeOrmModule, provider theo `useClass`, đổi class thành `PlaceManagementModule`)
- **Quyết định:** Theo chuẩn module management: DI token nằm ở `application/management.di-tokens.ts`, event adapter nằm ở `infrastructure/events`
- **Vấn đề còn tồn đọng:** Một số repository vẫn là skeleton và naming còn mixed (`postgres-review`, `postgis-catalog`) do chưa tách bounded context read/write rõ hơn
- **Việc tiếp theo:** Hoàn thiện TypeORM entities/repositories thật và cân nhắc tách catalog/review sang module riêng nếu theo đúng BC

### 2026-04-22 — Refactor cấu trúc usecase và persistence
- **Việc đã làm:** Đổi `application/commands` thành `application/usecase`, đưa `place-management.tokens.ts` ra root `application`, và tổ chức lại `infrastructure` thành `events` + `persistence`
- **Files thay đổi:**
  - Di chuyển: `src/modules/place/application/commands/*` → `src/modules/place/application/usecase/*`
  - Di chuyển: `src/modules/place/application/ports/place-management.tokens.ts` → `src/modules/place/application/place-management.tokens.ts`
  - Di chuyển: `src/modules/place/infrastructure/driven-adapters/noop-place-management-event-bus.ts` → `src/modules/place/infrastructure/events/noop-place-management-event-bus.ts`
  - Di chuyển: repositories vào `src/modules/place/infrastructure/persistence/typeorm/repositories/`
  - Tạo mới: `src/modules/place/infrastructure/persistence/mappers/place.mapper.ts`
  - Tạo mới: `src/modules/place/infrastructure/persistence/typeorm/entities/place.typeorm-entity.ts`
  - Tạo mới: `src/modules/place/infrastructure/persistence/typeorm/entities/review.typeorm-entity.ts`
  - Sửa: toàn bộ import liên quan trong controllers, usecases, module, repositories
- **Quyết định:** `infrastructure` chỉ còn 2 nhóm chính: `events` và `persistence`; repository đặt dưới `persistence/typeorm/repositories`
- **Vấn đề còn tồn đọng:** Mapper và entity mới đang ở dạng skeleton, chưa map đầy đủ domain fields
- **Việc tiếp theo:** Hoàn thiện mapper/entity và triển khai TypeORM repository thực tế

### 2026-04-22 — Thêm DI token cho Application Ports
- **Việc đã làm:** Thêm DI token cho management ports và inject token trực tiếp trong use cases
- **Files thay đổi:**
  - Tạo mới: `src/modules/place/application/ports/place-management.tokens.ts`
  - Tạo mới: `src/modules/place/application/ports/place-management-event-bus.port.ts`
  - Tạo mới: `src/modules/place/infrastructure/driven-adapters/noop-place-management-event-bus.ts`
  - Sửa: `src/modules/place/application/commands/create-place.use-case.ts`
  - Sửa: `src/modules/place/application/commands/update-place.use-case.ts`
  - Sửa: `src/modules/place/application/commands/add-review.use-case.ts`
  - Sửa: `src/modules/place/application/ports/review-repository.port.ts`
  - Sửa: `src/modules/place/infrastructure/driven-adapters/postgres-place.repository.ts`
  - Sửa: `src/modules/place/infrastructure/driven-adapters/postgres-review.repository.ts`
  - Sửa: `src/modules/place/place.module.ts`
- **Quyết định:** Dùng token `PLACE_MANAGEMENT_REPOSITORY` và `PLACE_MANAGEMENT_EVENT_BUS` ở application layer để tách rời implementation
- **Vấn đề còn tồn đọng:** Event bus hiện là Noop adapter, chưa publish thật ra broker/outbox
- **Việc tiếp theo:** Thay `NoopPlaceManagementEventBus` bằng implementation outbox hoặc message broker

### 2026-04-22 — Refactor Domain Event metadata pattern
- **Việc đã làm:** Refactor domain events của module `place` theo pattern `metadata + base event class`
- **Files thay đổi:**
  - Tạo mới: `src/modules/place/domain/events/domain-event.ts`
  - Sửa: `src/modules/place/domain/events/place-created.event.ts`
  - Sửa: `src/modules/place/domain/events/place-updated.event.ts`
  - Sửa: `src/modules/place/domain/events/review-added.event.ts`
  - Sửa: `src/modules/place/domain/aggregates/place/place.root.ts`
  - Sửa: `src/modules/place/domain/aggregates/review/review.root.ts`
- **Quyết định:** Thống nhất event envelope có `eventId`, `eventType`, `eventVersion`, `aggregateType`, `aggregateId`, `occurredAt`
- **Vấn đề còn tồn đọng:** Hiện actor/partner đang map tạm từ aggregate fields; cần chuẩn hóa theo business flow (owner/admin/partner)
- **Việc tiếp theo:** Tạo publisher/outbox mapping dựa trên `DomainEvent.metadata`

### 2026-04-22 — Chuyển validate sang DTO layer
- **Việc đã làm:** Tách `presentation` thành `controllers` và `dto`, đồng thời bỏ validation khỏi `PlaceRoot`
- **Files thay đổi:**
  - Tạo mới: `src/modules/place/presentation/controllers/management.controller.ts`
  - Tạo mới: `src/modules/place/presentation/controllers/catalog.controller.ts`
  - Tạo mới: `src/modules/place/presentation/controllers/review.controller.ts`
  - Tạo mới: `src/modules/place/presentation/dto/create-place.dto.ts`
  - Tạo mới: `src/modules/place/presentation/dto/update-place.dto.ts`
  - Tạo mới: `src/modules/place/presentation/dto/add-review.dto.ts`
  - Tạo mới: `src/modules/place/presentation/dto/search-nearest.dto.ts`
  - Xóa: `src/modules/place/presentation/management.controller.ts`
  - Xóa: `src/modules/place/presentation/catalog.controller.ts`
  - Xóa: `src/modules/place/presentation/review.controller.ts`
  - Sửa: `src/modules/place/domain/aggregates/place/place.root.ts`
  - Sửa: `src/modules/place/place.module.ts`
  - Sửa: `docs/architecture-context.md`
- **Quyết định:** Validation request được đặt ở `presentation/dto` bằng `class-validator`; `PlaceRoot` chỉ giữ state và behavior
- **Vấn đề còn tồn đọng:** Cần đảm bảo global `ValidationPipe` đã bật để DTO validation có hiệu lực runtime
- **Việc tiếp theo:** Thêm DTO cho response nếu cần chuẩn hóa API contract đầu ra

### 2026-04-22 — Cập nhật schema thuộc tính Place
- **Việc đã làm:** Đồng bộ aggregate `Place` và command/query contracts theo thuộc tính mới của `place`
- **Files thay đổi:**
  - Sửa: `src/modules/place/domain/aggregates/place/place.root.ts`
  - Sửa: `src/modules/place/application/commands/create-place.use-case.ts`
  - Sửa: `src/modules/place/application/commands/update-place.use-case.ts`
  - Sửa: `src/modules/place/application/ports/catalog-query.port.ts`
- **Quyết định:** Thuộc tính chuẩn của `place` gồm `id`, `name`, `description`, `address`, `lng`, `lat`, `category`, `tags`, `ownerId`, `status`, `thumbnailUrl`, `imageUrl`
- **Vấn đề còn tồn đọng:** Chưa triển khai persistence mapping cho các trường mới trong repository adapters
- **Việc tiếp theo:** Cập nhật `postgres-place.repository.ts` và `postgis-catalog.repository.ts` để map đầy đủ schema mới

### 2026-04-22 — Tách Presentation khỏi Infrastructure
- **Việc đã làm:** Di chuyển controllers từ `infrastructure/driving-adapters` sang layer `presentation`
- **Files thay đổi:**
  - Tạo mới: `src/modules/place/presentation/management.controller.ts`
  - Tạo mới: `src/modules/place/presentation/catalog.controller.ts`
  - Tạo mới: `src/modules/place/presentation/review.controller.ts`
  - Xóa: `src/modules/place/infrastructure/driving-adapters/management.controller.ts`
  - Xóa: `src/modules/place/infrastructure/driving-adapters/catalog.controller.ts`
  - Xóa: `src/modules/place/infrastructure/driving-adapters/review.controller.ts`
  - Sửa: `src/modules/place/place.module.ts`
  - Sửa: `.cursor/rules/ddd-place-architecture.mdc`
  - Sửa: `docs/architecture-context.md`
- **Quyết định:** `infrastructure` chỉ giữ driven adapters (repository); HTTP controllers được đặt ở `presentation`
- **Vấn đề còn tồn đọng:** Chưa bổ sung module/router tổng để expose `PlaceModule` ở app chính
- **Việc tiếp theo:** Hoàn thiện repository implementations và thêm DTO validation cho controllers

### 2026-04-22 — Scaffold Place Module DDD
- **Việc đã làm:** Tạo kiến trúc thư mục và file skeleton cho module `place` theo DDD + CQRS trong `backend2`
- **Files thay đổi:**
  - Tạo mới: `src/modules/place/domain/aggregates/place/place.root.ts`
  - Tạo mới: `src/modules/place/domain/aggregates/review/review.root.ts`
  - Tạo mới: `src/modules/place/domain/value-objects/location.vo.ts`
  - Tạo mới: `src/modules/place/domain/value-objects/operating-hours.vo.ts`
  - Tạo mới: `src/modules/place/domain/value-objects/category.vo.ts`
  - Tạo mới: `src/modules/place/domain/events/place-created.event.ts`
  - Tạo mới: `src/modules/place/domain/events/place-updated.event.ts`
  - Tạo mới: `src/modules/place/domain/events/review-added.event.ts`
  - Tạo mới: `src/modules/place/application/ports/place-repository.port.ts`
  - Tạo mới: `src/modules/place/application/ports/review-repository.port.ts`
  - Tạo mới: `src/modules/place/application/ports/catalog-query.port.ts`
  - Tạo mới: `src/modules/place/application/commands/create-place.use-case.ts`
  - Tạo mới: `src/modules/place/application/commands/update-place.use-case.ts`
  - Tạo mới: `src/modules/place/application/commands/add-review.use-case.ts`
  - Tạo mới: `src/modules/place/application/queries/search-nearest.handler.ts`
  - Tạo mới: `src/modules/place/application/queries/get-place-details.handler.ts`
  - Tạo mới: `src/modules/place/infrastructure/driven-adapters/postgres-place.repository.ts`
  - Tạo mới: `src/modules/place/infrastructure/driven-adapters/postgres-review.repository.ts`
  - Tạo mới: `src/modules/place/infrastructure/driven-adapters/postgis-catalog.repository.ts`
  - Tạo mới: `src/modules/place/infrastructure/driving-adapters/management.controller.ts`
  - Tạo mới: `src/modules/place/infrastructure/driving-adapters/catalog.controller.ts`
  - Tạo mới: `src/modules/place/infrastructure/driving-adapters/review.controller.ts`
  - Tạo mới: `src/modules/place/place.module.ts`
- **Quyết định:** Dùng aggregate + value object ở domain; command đi qua domain, query đi qua read port; repository adapter để TODO cho tầng persistence
- **Vấn đề còn tồn đọng:** Chưa có binding vào app module tổng, chưa có triển khai thật cho PostgreSQL/PostGIS adapters
- **Việc tiếp theo:** Implement persistence logic cho repositories và viết test cho `domain` + `application/commands`

### 2026-04-22 — Khởi tạo kiến trúc
- **Việc đã làm:** Thiết kế DDD architecture cho module `place`, tạo Cursor rules và docs context
- **Files tạo mới:**
  - `.cursor/rules/ddd-place-architecture.mdc` — Rule DDD cho place module
  - `.cursor/rules/session-workflow.mdc` — Rule workflow đọc/cập nhật docs
  - `docs/architecture-context.md` — File này
- **Quyết định:** Áp dụng DDD + CQRS cho module `place` với tách biệt Read DB (PostGIS) và Write DB (PostgreSQL)
- **Việc tiếp theo:** Implement các file trong `src/modules/place/domain/` và `src/modules/place/application/ports/`
