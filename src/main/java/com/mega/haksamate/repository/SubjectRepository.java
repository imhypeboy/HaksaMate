package com.mega.haksamate.repository;

import com.mega.haksamate.entites.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
}