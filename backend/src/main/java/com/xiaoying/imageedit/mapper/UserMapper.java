package com.xiaoying.imageedit.mapper;

import com.xiaoying.imageedit.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

    User findById(@Param("id") String id);
}
