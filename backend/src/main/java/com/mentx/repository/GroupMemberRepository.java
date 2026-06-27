package com.mentx.repository;

import com.mentx.model.Group;
import com.mentx.model.GroupMember;
import com.mentx.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByGroup(Group group);
    List<GroupMember> findByMentee(User mentee);
    Optional<GroupMember> findByGroupAndMentee(Group group, User mentee);
    boolean existsByGroupAndMentee(Group group, User mentee);
    void deleteByGroupAndMentee(Group group, User mentee);
    void deleteByGroup(Group group);
}
