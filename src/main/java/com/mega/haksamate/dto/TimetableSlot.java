package com.mega.haksamate.dto;

import com.mega.haksamate.entites.Subject;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TimetableSlot {
    private String dayOfWeek;
    private String startTime;
    private String endTime;
    private Subject subject;
}
