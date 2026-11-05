package com.xiaoying.imageedit.storage;

public interface ResultStore {

    String saveResult(long taskId, byte[] pngBytes);
}
