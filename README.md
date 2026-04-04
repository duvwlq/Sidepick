# FailForward Backend

遺???ㅽ뙣 寃쏀뿕 援ъ“??怨듭쑀 ?뚮옯?쇱쓽 諛깆뿏??API ?쒕쾭 ??μ냼?낅땲??
?꾩옱 ??μ냼??1二쇱감 踰붿쐞瑜?湲곗??쇰줈 MySQL, Docker, AWS EC2 ?섍꼍??留욎떠 ?뺣━?섏뼱 ?덉뒿?덈떎.

## 湲곗닠 ?ㅽ깮

- Java 17
- Spring Boot 3.2.12
- Spring Data JPA
- MySQL 8.4
- Springdoc OpenAPI
- Docker Compose

## ??μ냼 援ъ“

- `docs/git-flow.md`
- `docs/ec2-setup.md`
- `docs/db-schema.md`
- `docs/api-structure.md`
- `docs/week1-status.md`
- `docs/work-summary.md`
- `infra/docker-compose.yml`
- `infra/mysql/init/001_init.sql`
- `scripts`
- `server`

## 鍮좊Ⅸ ?쒖옉

### 1. ?섍꼍 蹂???뚯씪 以鍮?
Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

### 2. Docker濡??ㅽ뻾

Windows PowerShell:

```powershell
.\scripts\dev-up.ps1
```

macOS / Linux:

```bash
./scripts/dev-up.sh
```

?먮뒗 Docker Compose瑜?吏곸젒 ?ㅽ뻾?????덉뒿?덈떎.

```bash
docker compose -f infra/docker-compose.yml up -d --build
```

### 3. 濡쒖뺄 Maven ?놁씠 而댄뙆??
????μ냼?먮뒗 Docker 湲곕컲 Maven wrapper媛 ?ы븿?섏뼱 ?덉뒿?덈떎.

Windows PowerShell:

```powershell
.\mvnw.cmd -DskipTests package
```

macOS / Linux / Git Bash:

```bash
chmod +x ./mvnw
./mvnw -DskipTests package
```

### 4. ?ㅽ뻾 ?뺤씤

- ?좏뵆由ъ??댁뀡: `http://localhost:8081`
- ?ъ뒪 泥댄겕: `http://localhost:8081/api/health`
- Swagger UI: `http://localhost:8081/swagger-ui.html`

## EC2 蹂댁“ ?ㅽ겕由쏀듃

- `scripts/ec2-bootstrap.sh`
- `scripts/ec2-deploy.sh`

## 醫낅즺

Windows PowerShell:

```powershell
.\scripts\dev-down.ps1
```

macOS / Linux:

```bash
./scripts/dev-down.sh
```

## ? ?묒뾽 洹쒖튃

- 湲곕낯 ?묒뾽 釉뚮옖移섎뒗 `develop`?낅땲??
- ?묒뾽 ?쒖옉 ??`git pull origin develop`???ㅽ뻾?⑸땲??
- `.env`??濡쒖뺄?먯꽌留??앹꽦?섍퀬 而ㅻ컠?섏? ?딆뒿?덈떎.
- 媛쒖씤 IDE ?ㅼ젙 ?뚯씪? 而ㅻ컠?섏? ?딆뒿?덈떎.

## MySQL ?ъ슜 湲곗?

- 濡쒖뺄 媛쒕컻? `infra/docker-compose.yml`??`mysql` ?쒕퉬?ㅻ? ?ъ슜?⑸땲??
- 珥덇린 ?ㅽ궎留?SQL ?뚯씪? `infra/mysql/init/001_init.sql`?낅땲??
- EC2 諛고룷???숈씪??Docker Compose ?뚯씪??湲곗??쇰줈 吏꾪뻾?⑸땲??
- ?꾩옱 1二쇱감 ??μ냼 踰붿쐞?먮뒗 Supabase ?곕룞???ы븿?섏뼱 ?덉? ?딆뒿?덈떎.

## 李멸퀬 臾몄꽌

1. Git ?묒뾽 洹쒖튃: `docs/git-flow.md`
2. AWS EC2 ?ㅼ젙: `docs/ec2-setup.md`
3. DB ?ㅽ궎留?諛?SQL: `docs/db-schema.md`, `infra/mysql/init/001_init.sql`
4. API 援ъ“: `docs/api-structure.md`
5. 1二쇱감 吏꾪뻾 ?꾪솴: `docs/week1-status.md`
6. ?묒뾽 ?붿빟: `docs/work-summary.md`

## 李멸퀬 ?ы빆

- 湲곕낯 ?ㅽ뻾 諛⑹떇? Docker 湲곗??낅땲??
- EC2 諛고룷??`infra/docker-compose.yml` 湲곗??쇰줈 ?숈옉?⑸땲??
- Security? JWT???댄썑 ?④퀎?먯꽌 援ы쁽???덉젙?대ŉ, ?꾩옱 1二쇱감 踰붿쐞?먮뒗 ?ы븿?섏뼱 ?덉? ?딆뒿?덈떎.

