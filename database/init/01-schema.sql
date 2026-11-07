-- ImageEdit demo schema (MySQL 8.0, utf8mb4)
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS app_user (
    id            VARCHAR(64) PRIMARY KEY,
    display_name  VARCHAR(64)  NOT NULL,
    email         VARCHAR(128) NOT NULL,
    avatar_color  VARCHAR(16)  NOT NULL,
    account_tier  VARCHAR(16)  NOT NULL DEFAULT 'STANDARD',
    created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS demo_session (
    id          CHAR(36) PRIMARY KEY,
    user_id     VARCHAR(64) NOT NULL,
    created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES app_user (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS template (
    id                   VARCHAR(64) PRIMARY KEY,
    title                VARCHAR(128)  NOT NULL,
    category             VARCHAR(64)   NOT NULL,
    cover_url            VARCHAR(255)  NOT NULL,
    description          VARCHAR(500)  NOT NULL,
    required_image_count INT           NOT NULL,
    accepted_mime_types  VARCHAR(255)  NOT NULL,
    max_file_size_bytes  BIGINT        NOT NULL,
    sample_result_url    VARCHAR(255)  NOT NULL,
    result_caption       VARCHAR(128)  NOT NULL,
    accent_color         VARCHAR(16)   NOT NULL,
    sort_order           INT           NOT NULL DEFAULT 0,
    created_at           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS asset (
    id             CHAR(36) PRIMARY KEY,
    owner_id       VARCHAR(64)   NOT NULL,
    template_id    VARCHAR(64)   NOT NULL,
    original_name  VARCHAR(255)  NOT NULL,
    storage_key    VARCHAR(255)  NOT NULL,
    content_type   VARCHAR(64)   NOT NULL,
    size_bytes     BIGINT        NOT NULL,
    created_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY idx_asset_owner (owner_id),
    CONSTRAINT fk_asset_owner FOREIGN KEY (owner_id) REFERENCES app_user (id),
    CONSTRAINT fk_asset_template FOREIGN KEY (template_id) REFERENCES template (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS task (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_id           VARCHAR(64)  NOT NULL,
    template_id        VARCHAR(64)  NOT NULL,
    status             VARCHAR(16)  NOT NULL,
    stage              VARCHAR(16)  NULL,
    result_key         VARCHAR(255) NULL,
    failure_reason     VARCHAR(500) NULL,
    check_delay_ms     INT          NOT NULL DEFAULT 0,
    generate_delay_ms  INT          NOT NULL DEFAULT 0,
    finalize_delay_ms  INT          NOT NULL DEFAULT 0,
    fail_stage         VARCHAR(16)  NULL,
    created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    KEY idx_task_owner_created (owner_id, created_at),
    KEY idx_task_status (status),
    CONSTRAINT fk_task_owner FOREIGN KEY (owner_id) REFERENCES app_user (id),
    CONSTRAINT fk_task_template FOREIGN KEY (template_id) REFERENCES template (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS task_asset (
    task_id     BIGINT      NOT NULL,
    slot_index  INT         NOT NULL,
    asset_id    CHAR(36)    NOT NULL,
    PRIMARY KEY (task_id, slot_index),
    KEY idx_task_asset_asset (asset_id),
    CONSTRAINT fk_ta_task FOREIGN KEY (task_id) REFERENCES task (id) ON DELETE CASCADE,
    CONSTRAINT fk_ta_asset FOREIGN KEY (asset_id) REFERENCES asset (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
