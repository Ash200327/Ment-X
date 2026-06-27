package com.mentx.repository;

import com.mentx.model.Group;
import com.mentx.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    List<Group> findByMentor(User mentor);
    long countByMentor(User mentor);
}
