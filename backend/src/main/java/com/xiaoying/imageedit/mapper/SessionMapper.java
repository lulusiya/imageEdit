package com.xiaoying.imageedit.mapper;

import com.xiaoying.imageedit.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SessionMapper {

    void insert(@Param("id") String id, @Param("userId") String userId);

    User findUserBySessionId(@Param("sessionId") String sessionId);
}
