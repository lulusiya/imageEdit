package com.xiaoying.imageedit.mapper;

import com.xiaoying.imageedit.domain.Asset;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AssetMapper {

    void insert(Asset asset);

    Asset findByIdAndOwner(@Param("id") String id, @Param("ownerId") String ownerId);
}
