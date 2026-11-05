package com.xiaoying.imageedit.storage;

public interface MediaStore {

    String saveAsset(byte[] bytes, String contentType, String ownerId);

    byte[] read(String storageKey);

    void delete(String storageKey);
}
