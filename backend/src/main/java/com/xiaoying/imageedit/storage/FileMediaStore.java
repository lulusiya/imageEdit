package com.xiaoying.imageedit.storage;

import com.xiaoying.imageedit.config.AppProperties;
import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class FileMediaStore implements MediaStore, ResultStore {

    private static final Logger log = LoggerFactory.getLogger(FileMediaStore.class);

    private final Path root;
    private final Path assetsDir;
    private final Path resultsDir;

    public FileMediaStore(AppProperties properties) {
        this.root = Path.of(properties.getStorageRoot()).toAbsolutePath().normalize();
        this.assetsDir = root.resolve("assets");
        this.resultsDir = root.resolve("results");
        try {
            Files.createDirectories(assetsDir);
            Files.createDirectories(resultsDir);
        } catch (IOException ex) {
            throw new StorageException("无法初始化存储目录: " + root, ex);
        }
    }

    @Override
    public String saveAsset(byte[] bytes, String contentType, String ownerId) {
        String extension = "image/png".equals(contentType) ? ".png" : ".jpg";
        String safeOwner = ownerId.replaceAll("[^a-zA-Z0-9_-]", "_");
        Path ownerDir = assetsDir.resolve(safeOwner);
        Path target = ownerDir.resolve(UUID.randomUUID() + extension);
        writeFile(ownerDir, target, bytes);
        return relativeKey(target);
    }

    @Override
    public byte[] read(String storageKey) {
        Path path = resolve(storageKey);
        if (!Files.isRegularFile(path)) {
            throw new StorageException("文件不存在: " + storageKey);
        }
        try {
            return Files.readAllBytes(path);
        } catch (IOException ex) {
            throw new StorageException("读取文件失败: " + storageKey, ex);
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(resolve(storageKey));
        } catch (IOException | RuntimeException ex) {
            log.warn("Failed to delete storage file {}", storageKey, ex);
        }
    }

    @Override
    public String saveResult(long taskId, byte[] pngBytes) {
        String fileName = "task-" + taskId + "-" + Instant.now().toEpochMilli() + ".png";
        Path target = resultsDir.resolve(fileName);
        writeFile(resultsDir, target, pngBytes);
        return relativeKey(target);
    }

    private void writeFile(Path directory, Path target, byte[] bytes) {
        try {
            Files.createDirectories(directory);
            Path temp = Files.createTempFile(directory, "pending-", ".tmp");
            Files.write(temp, bytes);
            try {
                Files.move(temp, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            } catch (AtomicMoveNotSupportedException ex) {
                Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new StorageException("写入文件失败: " + target, ex);
        }
    }

    private String relativeKey(Path path) {
        return root.relativize(path).toString().replace('\\', '/');
    }

    private Path resolve(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            throw new StorageException("存储键不能为空");
        }
        Path resolved = root.resolve(storageKey).normalize();
        if (!resolved.startsWith(root)) {
            throw new StorageException("非法存储路径: " + storageKey);
        }
        return resolved;
    }
}
