package com.failforward.backend.common.api;

public class AiServerTimeoutException extends AiServerException {

    public AiServerTimeoutException(String message, Throwable cause) {
        super(message, cause);
    }
}
