package com.helpinminutes.task.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request DTO for starting a task")
public class StartTaskRequest {

    @Schema(example = "123456")
    private String startCode;

    private String notes;
    private String beforePhotoUrl;
}