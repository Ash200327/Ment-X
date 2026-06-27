package com.mentx.repository;

import com.mentx.model.TaskAssignment;
import com.mentx.model.WeeklyUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WeeklyUpdateRepository extends JpaRepository<WeeklyUpdate, Long> {
    Optional<WeeklyUpdate> findByAssignment(TaskAssignment assignment);
    List<WeeklyUpdate> findByAssignmentIn(List<TaskAssignment> assignments);
}
