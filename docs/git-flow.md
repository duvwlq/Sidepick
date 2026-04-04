# Git ?묒뾽 媛?대뱶

## 湲곕낯 釉뚮옖移?
- `main`: 諛고룷 湲곗? ?대젰
- `develop`: ? ?듯빀 ?묒뾽 釉뚮옖移?
## 湲곕뒫 釉뚮옖移??대쫫 洹쒖튃

- `feature/<topic>`
- `fix/<topic>`
- `docs/<topic>`

?덉떆:

- `feature/setup-project`
- `feature/database-schema`
- `feature/docker-setup`

## ?쇱씪 ?묒뾽 ?먮쫫

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<topic>
```

?묒뾽 ?꾩뿉???꾨옒 ?쒖꽌濡?吏꾪뻾?⑸땲??

```bash
git add .
git commit -m "type: short summary"
git push -u origin feature/<topic>
```

## 而ㅻ컠 硫붿떆吏 洹쒖튃

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `chore: ...`
- `refactor: ...`
- `test: ...`

## ? ?묒뾽 洹쒖튃

- ??긽 理쒖떊 `develop`?먯꽌 ?묒뾽 ?쒖옉
- `.env`??而ㅻ컠?섏? ?딆쓬
- 媛쒖씤 IDE ?ㅼ젙 ?뚯씪? 而ㅻ컠?섏? ?딆쓬
- ?명봽?쇱? ?ㅽ궎留?蹂寃??ы빆? `docs/`???④퍡 臾몄꽌??
