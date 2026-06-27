package com.mentx.repository;

import com.mentx.model.Group;
import com.mentx.model.Task;
import com.mentx.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByMentor(User mentor);
    List<Task> findByGroup(Group group);
    long countByMentor(User mentor);
}
