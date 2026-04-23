# Postman Examples

## 1. Register

`POST http://localhost:8081/api/auth/register`

```json
{
  "email": "demo@sidepick.com",
  "password": "password123",
  "nickname": "demoUser",
  "ageGroup": "20s"
}
```

## 2. Login

`POST http://localhost:8081/api/auth/login`

```json
{
  "email": "demo@sidepick.com",
  "password": "password123"
}
```

Sample success data:

```json
{
  "success": true,
  "message": "Login succeeded.",
  "data": {
    "user": {
      "id": 1,
      "email": "demo@sidepick.com",
      "nickname": "demoUser",
      "ageGroup": "20s",
      "profileImage": null,
      "createdAt": "2026-04-12T16:00:00"
    },
    "tokenType": "Bearer",
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "accessTokenExpiresIn": 3600
  }
}
```

## 3. Create Experience

`POST http://localhost:8081/api/experiences`

Headers:

- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

```json
{
  "title": "Smart store launch failure",
  "content": "I launched too early without validating demand and lost budget on ads.",
  "categoryId": 1,
  "businessType": "Online store",
  "investmentAmount": 800000,
  "durationMonths": 3,
  "failureReason": "No product-market fit",
  "targetMarket": "Office workers in their 20s",
  "marketingChannels": ["Instagram", "Naver Blog"],
  "lessonsLearned": "Validate demand before scaling ads.",
  "wouldRetry": true
}
```

## 4. List Experiences

`GET http://localhost:8081/api/experiences?page=0&size=20`

## 5. Get Experience Detail

`GET http://localhost:8081/api/experiences/1`

## 6. Update Experience

`PATCH http://localhost:8081/api/experiences/1`

Headers:

- `Authorization: Bearer <accessToken>`

```json
{
  "title": "Smart store launch failure updated",
  "content": "Updated content",
  "categoryId": 1,
  "businessType": "Online store",
  "investmentAmount": 700000,
  "durationMonths": 4,
  "failureReason": "Weak validation",
  "targetMarket": "Office workers in their 20s",
  "marketingChannels": ["Instagram"],
  "lessonsLearned": "Run smaller tests first.",
  "wouldRetry": false
}
```
