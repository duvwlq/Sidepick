package com.failforward.backend.domain.auth.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.config.OAuthProperties;
import com.failforward.backend.common.security.JwtTokenProvider;
import com.failforward.backend.domain.auth.dto.AuthDtos.AuthPayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.EmailVerificationConfirmRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.EmailVerificationPayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.EmailVerificationRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.LoginRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.OAuthLoginRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.SignUpRequest;
import com.failforward.backend.domain.auth.dto.AuthDtos.UserSummary;
import com.failforward.backend.domain.auth.entity.EmailVerificationToken;
import com.failforward.backend.domain.auth.entity.SocialAccount;
import com.failforward.backend.domain.auth.repository.EmailVerificationTokenRepository;
import com.failforward.backend.domain.auth.repository.SocialAccountRepository;
import com.failforward.backend.domain.user.entity.AuthProvider;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.user.repository.UserRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OAuthProperties oAuthProperties;
    @Qualifier("oauthRestTemplate")
    private final RestTemplate oauthRestTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.auth.email-verification.expiration-minutes:10}")
    private long emailVerificationExpirationMinutes;

    @Value("${app.auth.email-verification.expose-code:true}")
    private boolean exposeVerificationCode;

    @Transactional
    public AuthPayload signUp(SignUpRequest request) {
        userRepository.findByEmail(request.email())
                .ifPresent(user -> {
                    throw new BadRequestException("Email is already in use.");
                });
        userRepository.findByNickname(request.nickname())
                .ifPresent(user -> {
                    throw new BadRequestException("Nickname is already in use.");
                });

        EmailVerificationToken verificationToken = emailVerificationTokenRepository
                .findTopByEmailOrderByCreatedAtDesc(request.email())
                .orElseThrow(() -> new BadRequestException("Email verification is required before registration."));

        if (!verificationToken.isVerified()) {
            throw new BadRequestException("Email verification must be completed before registration.");
        }
        if (verificationToken.isExpired(LocalDateTime.now())) {
            throw new BadRequestException("Email verification has expired. Please request a new code.");
        }

        User user = userRepository.save(User.create(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.nickname(),
                normalizeAgeGroup(request.ageGroup())
        ));
        user.verifyEmail();
        return issueAuthPayload(user);
    }

    public AuthPayload login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("Email or password is invalid."));
        if (user.getPassword() == null || user.getAuthProvider() != AuthProvider.LOCAL) {
            throw new BadRequestException("This account must sign in with a social login provider.");
        }
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Email or password is invalid.");
        }
        return issueAuthPayload(user);
    }

    @Transactional
    public EmailVerificationPayload requestEmailVerification(EmailVerificationRequest request) {
        userRepository.findByEmail(request.email())
                .ifPresent(user -> {
                    if (Boolean.TRUE.equals(user.getEmailVerified())) {
                        throw new BadRequestException("This email is already verified.");
                    }
                });

        emailVerificationTokenRepository.deleteByEmail(request.email());
        String code = generateVerificationCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(emailVerificationExpirationMinutes);
        emailVerificationTokenRepository.save(EmailVerificationToken.issue(request.email(), code, expiresAt));

        return new EmailVerificationPayload(
                request.email(),
                "PENDING",
                exposeVerificationCode ? code : null,
                expiresAt
        );
    }

    @Transactional
    public EmailVerificationPayload confirmEmailVerification(EmailVerificationConfirmRequest request) {
        EmailVerificationToken token = emailVerificationTokenRepository.findTopByEmailOrderByCreatedAtDesc(request.email())
                .orElseThrow(() -> new BadRequestException("Email verification was not requested."));

        if (token.isVerified()) {
            throw new BadRequestException("Email is already verified.");
        }
        if (token.isExpired(LocalDateTime.now())) {
            throw new BadRequestException("Verification code has expired.");
        }
        if (!token.getCode().equals(request.code())) {
            throw new BadRequestException("Verification code is invalid.");
        }
        token.verify(LocalDateTime.now());
        emailVerificationTokenRepository.save(token);

        userRepository.findByEmail(request.email())
                .ifPresent(user -> {
                    user.verifyEmail();
                    userRepository.save(user);
                });

        return new EmailVerificationPayload(
                request.email(),
                "VERIFIED",
                null,
                token.getExpiresAt()
        );
    }

    @Transactional
    public AuthPayload loginWithKakao(OAuthLoginRequest request) {
        OAuthProperties.Provider providerConfig = requireConfiguredProvider(AuthProvider.KAKAO);
        OAuthTokenResponse tokenResponse = exchangeAuthorizationCode(
                "https://kauth.kakao.com/oauth/token",
                providerConfig,
                request
        );
        KakaoUserInfoResponse userInfo = fetchKakaoUserInfo(tokenResponse.accessToken());
        String providerUserId = String.valueOf(userInfo.id());
        String email = userInfo.kakaoAccount() != null ? userInfo.kakaoAccount().email() : null;
        String nickname = userInfo.properties() != null ? userInfo.properties().nickname() : null;

        return issueAuthPayload(findOrCreateSocialUser(AuthProvider.KAKAO, providerUserId, email, nickname, null));
    }

    @Transactional
    public AuthPayload loginWithGoogle(OAuthLoginRequest request) {
        OAuthProperties.Provider providerConfig = requireConfiguredProvider(AuthProvider.GOOGLE);
        OAuthTokenResponse tokenResponse = exchangeAuthorizationCode(
                "https://oauth2.googleapis.com/token",
                providerConfig,
                request
        );
        GoogleUserInfoResponse userInfo = fetchGoogleUserInfo(tokenResponse.accessToken());
        return issueAuthPayload(findOrCreateSocialUser(
                AuthProvider.GOOGLE,
                userInfo.sub(),
                userInfo.email(),
                userInfo.name(),
                userInfo.picture()
        ));
    }

    private AuthPayload issueAuthPayload(User user) {
        return new AuthPayload(
                UserSummary.from(user),
                "Bearer",
                jwtTokenProvider.generateAccessToken(user),
                jwtTokenProvider.generateRefreshToken(user),
                3600L,
                user.requiresEmailVerification()
        );
    }

    private OAuthProperties.Provider requireConfiguredProvider(AuthProvider provider) {
        OAuthProperties.Provider config = switch (provider) {
            case KAKAO -> oAuthProperties.kakao();
            case GOOGLE -> oAuthProperties.google();
            default -> throw new BadRequestException("OAuth provider is not supported.");
        };

        if (config == null || !config.isConfigured()) {
            throw new BadRequestException(provider.name() + " OAuth is not configured on the server.");
        }
        return config;
    }

    private OAuthTokenResponse exchangeAuthorizationCode(
            String tokenUrl,
            OAuthProperties.Provider provider,
            OAuthLoginRequest request
    ) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", provider.clientId());
        form.add("code", request.code());
        form.add("redirect_uri", request.redirectUri());
        if (provider.clientSecret() != null && !provider.clientSecret().isBlank()) {
            form.add("client_secret", provider.clientSecret());
        }

        try {
            ResponseEntity<OAuthTokenResponse> response = oauthRestTemplate.postForEntity(
                    tokenUrl,
                    new HttpEntity<>(form, headers),
                    OAuthTokenResponse.class
            );
            OAuthTokenResponse body = response.getBody();
            if (body == null || body.accessToken() == null || body.accessToken().isBlank()) {
                throw new BadRequestException("OAuth token exchange returned an empty access token.");
            }
            return body;
        } catch (Exception exception) {
            throw new BadRequestException("OAuth token exchange failed.");
        }
    }

    private KakaoUserInfoResponse fetchKakaoUserInfo(String accessToken) {
        try {
            ResponseEntity<KakaoUserInfoResponse> response = oauthRestTemplate.exchange(
                    "https://kapi.kakao.com/v2/user/me",
                    HttpMethod.GET,
                    new HttpEntity<>(buildBearerHeaders(accessToken)),
                    KakaoUserInfoResponse.class
            );
            KakaoUserInfoResponse body = response.getBody();
            if (body == null || body.id() == null) {
                throw new BadRequestException("Kakao user info response is invalid.");
            }
            return body;
        } catch (Exception exception) {
            throw new BadRequestException("Failed to fetch Kakao user info.");
        }
    }

    private GoogleUserInfoResponse fetchGoogleUserInfo(String accessToken) {
        try {
            ResponseEntity<GoogleUserInfoResponse> response = oauthRestTemplate.exchange(
                    "https://openidconnect.googleapis.com/v1/userinfo",
                    HttpMethod.GET,
                    new HttpEntity<>(buildBearerHeaders(accessToken)),
                    GoogleUserInfoResponse.class
            );
            GoogleUserInfoResponse body = response.getBody();
            if (body == null || body.sub() == null || body.sub().isBlank()) {
                throw new BadRequestException("Google user info response is invalid.");
            }
            return body;
        } catch (Exception exception) {
            throw new BadRequestException("Failed to fetch Google user info.");
        }
    }

    private HttpHeaders buildBearerHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        return headers;
    }

    private User findOrCreateSocialUser(
            AuthProvider provider,
            String providerUserId,
            String email,
            String nickname,
            String profileImage
    ) {
        return socialAccountRepository.findByProviderAndProviderUserId(provider, providerUserId)
                .map(SocialAccount::getUser)
                .orElseGet(() -> createOrLinkSocialUser(provider, providerUserId, email, nickname, profileImage));
    }

    private User createOrLinkSocialUser(
            AuthProvider provider,
            String providerUserId,
            String email,
            String nickname,
            String profileImage
    ) {
        User user = (email != null && !email.isBlank())
                ? userRepository.findByEmail(email)
                .map(found -> {
                    found.verifyEmail();
                    return userRepository.save(found);
                })
                .orElseGet(() -> createSocialUser(provider, providerUserId, email, nickname, profileImage))
                : createSocialUser(provider, providerUserId, buildFallbackEmail(provider, providerUserId), nickname, profileImage);

        socialAccountRepository.findByProviderAndProviderUserId(provider, providerUserId)
                .orElseGet(() -> socialAccountRepository.save(SocialAccount.create(user, provider, providerUserId, email)));

        return user;
    }

    private User createSocialUser(
            AuthProvider provider,
            String providerUserId,
            String email,
            String nickname,
            String profileImage
    ) {
        String resolvedNickname = generateUniqueNickname(provider.name().toLowerCase(), providerUserId, nickname);
        return userRepository.save(User.createSocial(provider, email, resolvedNickname, "UNKNOWN", profileImage));
    }

    private String buildFallbackEmail(AuthProvider provider, String providerUserId) {
        return provider.name().toLowerCase() + "_" + providerUserId + "@social.sidepick.local";
    }

    private String generateUniqueNickname(String providerPrefix, String providerUserId, String nickname) {
        String base = (nickname != null && !nickname.isBlank())
                ? sanitizeNickname(nickname)
                : sanitizeNickname(providerPrefix + "_" + providerUserId);
        if (base.isBlank()) {
            base = providerPrefix;
        }
        String trimmedBase = base.length() > 20 ? base.substring(0, 20) : base;
        String candidate = trimmedBase;
        int suffix = 1;
        while (userRepository.findByNickname(candidate).isPresent()) {
            String suffixValue = String.valueOf(suffix++);
            int maxBaseLength = Math.max(1, 20 - suffixValue.length() - 1);
            String truncated = trimmedBase.length() > maxBaseLength ? trimmedBase.substring(0, maxBaseLength) : trimmedBase;
            candidate = truncated + "_" + suffixValue;
        }
        return candidate;
    }

    private String sanitizeNickname(String value) {
        return value.replaceAll("[^A-Za-z0-9_]", "")
                .trim();
    }

    private String normalizeAgeGroup(String ageGroup) {
        if (ageGroup == null || ageGroup.isBlank()) {
            return "UNKNOWN";
        }
        return ageGroup;
    }

    private String generateVerificationCode() {
        int value = secureRandom.nextInt(1_000_000);
        return String.format("%06d", value);
    }

    private record OAuthTokenResponse(
            @JsonProperty("access_token") String accessToken,
            @JsonProperty("token_type") String tokenType,
            @JsonProperty("refresh_token") String refreshToken,
            @JsonProperty("expires_in") Long expiresIn,
            @JsonProperty("id_token") String idToken
    ) {
    }

    private record KakaoUserInfoResponse(
            Long id,
            KakaoProperties properties,
            @JsonProperty("kakao_account") KakaoAccount kakaoAccount
    ) {
    }

    private record KakaoProperties(
            String nickname
    ) {
    }

    private record KakaoAccount(
            @JsonProperty("email") String email
    ) {
    }

    private record GoogleUserInfoResponse(
            @JsonProperty("sub") String sub,
            @JsonProperty("email") String email,
            @JsonProperty("name") String name,
            @JsonProperty("picture") String picture
    ) {
    }
}
