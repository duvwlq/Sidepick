package com.failforward.backend.domain.auth.service;

import com.failforward.backend.common.api.MailDeliveryException;
import com.failforward.backend.common.config.MailProperties;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailVerificationMailService {

    private static final DateTimeFormatter EXPIRATION_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    public void sendVerificationCode(String email, String code, LocalDateTime expiresAt) {
        if (!mailProperties.isConfigured()) {
            throw new MailDeliveryException("Mail service is not configured on the server.");
        }

        try {
            var mimeMessage = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            helper.setTo(email);
            helper.setFrom(mailProperties.fromAddress(), mailProperties.fromName());
            helper.setSubject("[Sidepick] 이메일 인증 코드 안내");
            helper.setText(buildBody(code, expiresAt), false);
            mailSender.send(mimeMessage);
        } catch (Exception exception) {
            throw new MailDeliveryException("Failed to send the email verification message.", exception);
        }
    }

    private String buildBody(String code, LocalDateTime expiresAt) {
        return """
                안녕하세요, Sidepick입니다.

                이메일 인증 코드가 발급되었습니다.

                인증 코드: %s
                만료 시간: %s

                위 코드를 인증 화면에 입력해 주세요.
                본인이 요청하지 않았다면 이 메일은 무시하셔도 됩니다.
                """.formatted(code, expiresAt.format(EXPIRATION_FORMATTER));
    }
}
