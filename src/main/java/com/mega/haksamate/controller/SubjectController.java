package com.mega.haksamate.controller;
import com.mega.haksamate.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.mega.haksamate.entites.Subject;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectRepository subjectRepo;

    @PostMapping
    public Subject add(@RequestBody Subject subject) {
        return subjectRepo.save(subject);
    }

    @GetMapping
    public List<Subject> getAll() {
        return subjectRepo.findAll();
    }

    @PutMapping("/{id}")
    public Subject updateSubject(@PathVariable Long id, @RequestBody Subject subject) {
        subject.setId(id); // id 설정
        return subjectRepo.save(subject);
    }

    @DeleteMapping("/{id}")
    public void deleteSubject(@PathVariable Long id) {
        subjectRepo.deleteById(id);
    }
}
