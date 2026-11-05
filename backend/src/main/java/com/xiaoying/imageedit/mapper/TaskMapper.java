package com.xiaoying.imageedit.mapper;

import com.xiaoying.imageedit.domain.Asset;
import com.xiaoying.imageedit.domain.Task;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface TaskMapper {

    void insert(Task task);

    void insertTaskAsset(@Param("taskId") long taskId,
                         @Param("slotIndex") int slotIndex,
                         @Param("assetId") String assetId);

    Task findById(@Param("id") long id);

    Task findByIdAndOwner(@Param("id") long id, @Param("ownerId") String ownerId);

    List<Task> findByOwner(@Param("ownerId") String ownerId);

    List<Asset> findAssetsForTask(@Param("taskId") long taskId);

    void updateStage(@Param("id") long id, @Param("stage") String stage);

    void markSucceeded(@Param("id") long id, @Param("resultKey") String resultKey);

    void markFailed(@Param("id") long id, @Param("stage") String stage, @Param("reason") String reason);

    int failInterrupted(@Param("reason") String reason);
}
