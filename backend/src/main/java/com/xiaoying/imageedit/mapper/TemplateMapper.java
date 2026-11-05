package com.xiaoying.imageedit.mapper;

import com.xiaoying.imageedit.domain.CategoryRow;
import com.xiaoying.imageedit.domain.Template;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface TemplateMapper {

    List<Template> findAll(@Param("category") String category);

    Template findById(@Param("id") String id);

    List<CategoryRow> findCategories();
}
