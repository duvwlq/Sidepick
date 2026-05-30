package com.failforward.backend.domain.auth.service;

import com.failforward.backend.common.api.BadRequestException;
import com.failforward.backend.common.config.AuthFeatureProperties;
import com.failforward.backend.common.config.OAuthProperties;
import com.failforward.backend.domain.auth.dto.AuthDtos.AuthPayload;
import com.failforward.backend.domain.auth.dto.AuthDtos.OAuthLoginRequest;
import com.failforward.backend.domain.auth.entity.SocialAccount;
import com.failforward.backend.domain.auth.repository.SocialAccountRepository;
import com.failforward.backend.domain.user.entity.AuthProvider;
import com.failforward.backend.domain.user.entity.User;
import com.failforward.backend.domain.user.repository.UserRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OAuthAuthService {

    private final UserRepository userRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final OAuthProperties oAuthProperties;
    private final AuthFeatureProperties authFeatureProperties;
    private final AuthTokenService authTokenService;
    private final OAuthStateService oAuthStateService;
    @Qualifier("oauthRestTemplate")
    private final RestTemplate oauthRestTemplate;

    @Transactional
    public AuthPayload loginWithKakao(OAuthLoginRequest request) {
        ensureKakaoAuthEnabled();
        oAuthStateService.consume(AuthProvider.KAKAO, request.state(), request.redirectUri());
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

        return authTokenService.issue(findOrCreateSocialUser(AuthProvider.KAKAO, providerUserId, email, nickname, null));
    }

    @Transactional
    public AuthPayload loginWithGoogle(OAuthLoginRequest request) {
        ensureGoogleAuthEnabled();
        oAuthStateService.consume(AuthProvider.GOOGLE, request.state(), request.redirectUri());
        OAuthProperties.Provider providerConfig = requireConfiguredProvider(AuthProvider.GOOGLE);
        OAuthTokenResponse tokenResponse = exchangeAuthorizationCode(
                "https://oauth2.googleapis.com/token",
                providerConfig,
                request
        );
        GoogleUserInfoResponse userInfo = fetchGoogleUserInfo(tokenResponse.accessToken());
        return authTokenService.issue(findOrCreateSocialUser(
                AuthProvider.GOOGLE,
                userInfo.sub(),
                userInfo.email(),
                userInfo.name(),
                userInfo.picture()
        ));
    }

    @Transactional
    public AuthPayload loginWithNaver(OAuthLoginRequest request) {
        ensureNaverAuthEnabled();
        oAuthStateService.consume(AuthProvider.NAVER, request.state(), request.redirectUri());
        OAuthProperties.Provider providerConfig = requireConfiguredProvider(AuthProvider.NAVER);
        OAuthTokenResponse tokenResponse = exchangeAuthorizationCode(
                "https://nid.naver.com/oauth2.0/token",
                providerConfig,
                request
        );
        NaverUserInfoEnvelope userInfoEnvelope = fetchNaverUserInfo(tokenResponse.accessToken());
        NaverUserInfoResponse userInfo = userInfoEnvelope.response();
        return authTokenService.issue(findOrCreateSocialUser(
                AuthProvider.NAVER,
                userInfo.id(),
                userInfo.email(),
                userInfo.name(),
                userInfo.profileImage()
        ));
    }

    private void ensureKakaoAuthEnabled() {
        if (!authFeatureProperties.kakaoEnabled()) {
            throw new BadRequestException("Kakao login is not available right now.");
        }
    }

    private void ensureGoogleAuthEnabled() {
        if (!authFeatureProperties.googleEnabled()) {
            throw new BadRequestException("Google login is not available right now.");
        }
    }

    private void ensureNaverAuthEnabled() {
        if (!authFeatureProperties.naverEnabled()) {
            throw new BadRequestException("Naver login is not available right now.");
        }
    }

    private OAuthProperties.Provider requireConfiguredProvider(AuthProvider provider) {
        OAuthProperties.Provider config = switch (provider) {
            case KAKAO -> oAuthProperties.kakao();
            case GOOGLE -> oAuthProperties.google();
            case NAVER -> oAuthProperties.naver();
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

    private NaverUserInfoEnvelope fetchNaverUserInfo(String accessToken) {
        try {
            ResponseEntity<NaverUserInfoEnvelope> response = oauthRestTemplate.exchange(
                    "https://openapi.naver.com/v1/nid/me",
                    HttpMethod.GET,
                    new HttpEntity<>(buildBearerHeaders(accessToken)),
                    NaverUserInfoEnvelope.class
            );
            NaverUserInfoEnvelope body = response.getBody();
            if (body == null || body.response() == null || body.response().id() == null || body.response().id().isBlank()) {
                throw new BadRequestException("Naver user info response is invalid.");
            }
            return body;
        } catch (Exception exception) {
            throw new BadRequestException("Failed to fetch Naver user info.");
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

    private record NaverUserInfoEnvelope(
            @JsonProperty("response") NaverUserInfoResponse response
    ) {
    }

    private record NaverUserInfoResponse(
            @JsonProperty("id") String id,
            @JsonProperty("email") String email,
            @JsonProperty("name") String name,
            @JsonProperty("profile_image") String profileImage
    ) {
    }
}
