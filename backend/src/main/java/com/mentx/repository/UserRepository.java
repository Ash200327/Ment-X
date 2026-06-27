package com.mentx.repository;

import com.mentx.model.Role;
import com.mentx.model.User;
import com.mentx.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    List<User> findByStatus(UserStatus status);
    List<User> findByRoleAndStatus(Role role, UserStatus status);
    long countByRole(Role role);
    long countByStatus(UserStatus status);
}
