package com.mega.haksamate.controller;

import com.mega.haksamate.dto.TimetableSlot;
import com.mega.haksamate.entites.Subject;
import com.mega.haksamate.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/timetable")
public class TimetableController {

    @Autowired
    private SubjectRepository subjectRepository;

    @PostMapping("/generate")
    public List<TimetableSlot> generateTimetable() {
        List<Subject> subjects = subjectRepository.findAll();

        // 시간대별 분류 맵
        Map<String, List<Subject>> timeSlotMap = new HashMap<>();

        for (Subject s : subjects) {
            String key = s.getDayOfWeek() + "-" + s.getStartTime() + "-" + s.getEndTime();
            timeSlotMap.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }

        List<TimetableSlot> timetable = new ArrayList<>();

        for (Map.Entry<String, List<Subject>> entry : timeSlotMap.entrySet()) {
            List<Subject> slotSubjects = entry.getValue();
            Optional<Subject> requiredSubject = slotSubjects.stream()
                    .filter(Subject::isRequired)
                    .findFirst();

            Subject selected = requiredSubject.orElseGet(() -> {
                List<Subject> nonRequired = slotSubjects.stream()
                        .filter(s -> !s.isRequired())
                        .toList();
                return nonRequired.isEmpty() ? null :
                        nonRequired.get(new Random().nextInt(nonRequired.size()));
            });

            if (selected != null) {
                String[] split = entry.getKey().split("-");
                timetable.add(new TimetableSlot(split[0], split[1], split[2], selected));
            }
        }

        return timetable;
    }
}
