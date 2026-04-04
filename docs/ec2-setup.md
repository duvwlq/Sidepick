# EC2 ?ㅼ젙 媛?대뱶

?꾩옱 ?꾨줈?앺듃??MySQL怨?Spring Boot瑜?Docker Compose濡??ㅽ뻾?섎뒗 援ъ“瑜??ъ슜?⑸땲??

## 沅뚯옣 ?몄뒪?댁뒪

- OS: Ubuntu 22.04 LTS
- 臾대즺 踰붿쐞 ?뚯뒪?몄슜: `t3.micro`
- 蹂대떎 ?덉젙?곸씤 ?먭꺽 鍮뚮뱶?? `t3.small` ?댁긽
- ?ㅽ넗由ъ?: 8 GB ?댁긽

## ?꾩닔 蹂댁븞 洹몃９ 洹쒖튃

- `SSH / 22 / ??IP`
- `Custom TCP / 8081 / 0.0.0.0/0`

臾몄젣 ?닿껐?⑹쑝濡??쇱떆?곸쑝濡??꾨옒 洹쒖튃???????덉뒿?덈떎.

- `SSH / 22 / 0.0.0.0/0`

?ㅼ젙???앸굹硫??꾩떆 SSH 洹쒖튃? ?ㅼ떆 ?쒓굅?섎뒗 寃껋쓣 沅뚯옣?⑸땲??

## Elastic IP

媛숈? ?쒕쾭瑜?怨꾩냽 ?ъ슜???덉젙?대씪硫?Elastic IP瑜??곌껐?섎뒗 寃껋씠 醫뗭뒿?덈떎.
?대젃寃??섎㈃ ?몄뒪?댁뒪瑜?以묒? ???ㅼ떆 ?쒖옉?대룄 怨듭씤 IP媛 諛붾뚯? ?딆뒿?덈떎.

## 珥덇린 ?ㅼ젙 紐낅졊

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim openjdk-17-jdk
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
sudo apt-get update
sudo apt-get install -y docker-compose-plugin
```

`docker` 洹몃９ 異붽? ?꾩뿉????踰??ㅼ떆 ?묒냽?섎뒗 寃껋씠 醫뗭뒿?덈떎.

## 諛고룷 紐낅졊

??μ냼媛 ?쒕쾭???대? ?덈뒗 寃쎌슦:

```bash
cd ~/Sidepick
git pull origin develop
cp .env.example .env
sudo docker compose -f infra/docker-compose.yml up -d --build
```

濡쒖뺄?먯꽌 ?꾨줈?앺듃瑜?蹂듭궗????寃쎌슦:

```bash
cd ~/Sidepick
cp .env.example .env
sudo docker compose -f infra/docker-compose.yml up -d --build
```

## ?뺤씤 紐낅졊

```bash
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
curl http://localhost:8081/api/health
```

?몃? ?뺤씤 二쇱냼:

- `http://<EC2_IP>:8081/api/health`
- `http://<EC2_IP>:8081/swagger-ui.html`

