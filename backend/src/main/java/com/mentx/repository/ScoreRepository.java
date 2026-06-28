package com.mentx.repository;

import com.mentx.model.Score;
import com.mentx.model.TaskAssignment;
import com.mentx.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    Optional<Score> findByAssignment(TaskAssignment assignment);
    List<Score> findByAssignmentIn(List<TaskAssignment> assignments);

    List<Score> findByMentee(User mentee);
}
