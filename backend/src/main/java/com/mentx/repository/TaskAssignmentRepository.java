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
    @Query("SELECT ta FROM TaskAssignment ta JOIN FETCH ta.task WHERE ta.mentee = :mentee")
    List<TaskAssignment> findByMentee(@org.springframework.data.repository.query.Param("mentee") User mentee);

    List<TaskAssignment> findByTask(Task task);
    List<TaskAssignment> findByMenteeAndStatus(User mentee, AssignmentStatus status);
    Optional<TaskAssignment> findByTaskAndMentee(Task task, User mentee);
    boolean existsByTaskAndMentee(Task task, User mentee);

    @Query("SELECT ta FROM TaskAssignment ta JOIN FETCH ta.task t JOIN FETCH ta.mentee WHERE t.mentor = :mentor")
    List<TaskAssignment> findByMentor(@org.springframework.data.repository.query.Param("mentor") User mentor);

    @Query("SELECT ta FROM TaskAssignment ta JOIN FETCH ta.task t JOIN FETCH ta.mentee WHERE t.mentor = :mentor AND ta.status = :status")
    List<TaskAssignment> findByMentorAndStatus(@org.springframework.data.repository.query.Param("mentor") User mentor, @org.springframework.data.repository.query.Param("status") AssignmentStatus status);

    long countByMentee(User mentee);
    long countByMenteeAndStatus(User mentee, AssignmentStatus status);

    @Query("SELECT ta.mentee.id, COUNT(ta) FROM TaskAssignment ta WHERE ta.status = 'COMPLETED' GROUP BY ta.mentee.id")
    List<Object[]> countCompletedTasksGroupByMentee();
}
