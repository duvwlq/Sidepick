package com.failforward.backend.domain.experience.service;

import com.failforward.backend.domain.experience.dto.ExperienceDtos.ExperienceSharePageResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

@Component
public class ExperienceSharePageRenderer {

    public String render(ExperienceSharePageResponse page) {
        String title = escape(page.title());
        String description = escape(page.description());
        String imageUrl = escape(page.downloadImageUrl());
        String shareUrl = escape(page.shareUrl());
        String webUrl = escape(page.webUrl());
        String category = escape(page.categoryName());

        return """
                <!doctype html>
                <html lang="ko">
                <head>
                  <meta charset="utf-8">
                  <title>%s</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <meta name="description" content="%s">
                  <meta property="og:type" content="article">
                  <meta property="og:site_name" content="Sidepick">
                  <meta property="og:title" content="%s">
                  <meta property="og:description" content="%s">
                  <meta property="og:url" content="%s">
                  <meta property="og:image" content="%s">
                  <meta property="og:locale" content="ko_KR">
                  <meta name="twitter:card" content="summary_large_image">
                  <meta name="twitter:title" content="%s">
                  <meta name="twitter:description" content="%s">
                  <meta name="twitter:image" content="%s">
                  <meta http-equiv="refresh" content="0; url=%s">
                  <link rel="canonical" href="%s">
                  <style>
                    body { font-family: sans-serif; background: #f7f1e8; color: #251d15; padding: 32px; }
                    main { max-width: 720px; margin: 0 auto; background: #fffaf5; border-radius: 24px; padding: 32px; }
                    .chip { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #f1e2ce; color: #bd5c32; font-weight: 700; margin-bottom: 16px; }
                    a { color: #bd5c32; }
                  </style>
                </head>
                <body>
                  <main>
                    <div class="chip">%s</div>
                    <h1>%s</h1>
                    <p>%s</p>
                    <p><a href="%s">Sidepick에서 자세히 보기</a></p>
                  </main>
                </body>
                </html>
                """.formatted(
                title,
                description,
                title,
                description,
                shareUrl,
                imageUrl,
                title,
                description,
                imageUrl,
                webUrl,
                webUrl,
                category,
                title,
                description,
                webUrl
        );
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }
}
