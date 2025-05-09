package com.mega.haksamate.entites;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String dayOfWeek;  // 예: "MONDAY"
    private String startTime;  // 예: "09:00"
    private String endTime;    // 예: "10:30"
    private int priority;
}