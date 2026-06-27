package com.mentx.repository;

import com.mentx.model.AssignmentStatus;
import com.mentx.model.Task;
import com.mentx.model.TaskAssignment;
import com.mentx.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {
    List<TaskAssignment> findByMentee(User mentee);
    List<TaskAssignment> findByTask(Task task);
    List<TaskAssignment> findByMenteeAndStatus(User mentee, AssignmentStatus status);
    Optional<TaskAssignment> findByTaskAndMentee(Task task, User mentee);
    boolean existsByTaskAndMentee(Task task, User mentee);

    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.task.mentor = :mentor")
    List<TaskAssignment> findByMentor(User mentor);

    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.task.mentor = :mentor AND ta.status = :status")
    List<TaskAssignment> findByMentorAndStatus(User mentor, AssignmentStatus status);

    long countByMentee(User mentee);
    long countByMenteeAndStatus(User mentee, AssignmentStatus status);
}
